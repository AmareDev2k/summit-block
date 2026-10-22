// Cosmetic filtering: hides ad containers with a single injected <style> element.
// Runs at document_start in every frame. The selector list comes from the service worker,
// so per-site rules, user rules and the allowlist are all resolved in one place.

(() => {
  'use strict';
  if (window.__summitBlockCosmetic) return;
  window.__summitBlockCosmetic = true;

  const STYLE_ID = 'summit-block-cosmetic';
  const CHUNK = 40; // an invalid selector only breaks its own chunk
  const probe = document.createDocumentFragment();
  let styleEl = null;
  let observer = null;

  const isValid = (sel) => {
    try { probe.querySelector(sel); return true; } catch { return false; }
  };

  function remove() {
    if (styleEl) styleEl.remove();
    if (observer) { observer.disconnect(); observer = null; }
  }

  function apply(selectors) {
    const clean = [...new Set(selectors)].filter(
      (s) => typeof s === 'string' && s.length > 0 && s.length <= 500 && isValid(s)
    );
    if (!clean.length) return remove();

    const css = [];
    for (let i = 0; i < clean.length; i += CHUNK) {
      css.push(clean.slice(i, i + CHUNK).join(',\n') + '{display:none!important;visibility:hidden!important;}');
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
    }
    styleEl.textContent = css.join('\n');
    attach();

    // Pages occasionally strip unknown <style> nodes – put ours back if that happens.
    if (!observer) {
      observer = new MutationObserver(() => { if (styleEl && !styleEl.isConnected) attach(); });
      observer.observe(document.documentElement, { childList: true });
    }
  }

  function attach() {
    const root = document.head || document.documentElement;
    if (root && styleEl && styleEl.parentNode !== root) root.appendChild(styleEl);
  }

  async function load() {
    try {
      const cfg = await chrome.runtime.sendMessage({ type: 'getCosmeticConfig' });
      if (!cfg || !cfg.active) return remove();
      apply(cfg.selectors || []);
    } catch {
      /* extension was reloaded/updated – nothing to do */
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'refreshCosmetic') load();
  });

  /* ───────────── malicious download & fake-dialog guard ───────────── */

  function isMaliciousDownload(urlOrFilename) {
    if (typeof urlOrFilename !== 'string' || !urlOrFilename) return false;
    let str = urlOrFilename.toLowerCase();
    try { str = decodeURIComponent(str); } catch {}
    // 1. Block Windows Registry scripts (.reg) downloaded from web pages (almost universally malware/infostealers)
    if (/\.(reg)(\?|#|$|\s)/.test(str)) return true;
    // 2. Filename spoofing with large whitespace, %r, %b, or fake Google Drive name
    if (/(drive\.google\.com|dropbox|onedrive).*\s{3,}.*\.(reg|scr|exe|bat|cmd|vbs|hta|ps1)/i.test(str)) return true;
    if (/(%r|%b|%00|\\r|\\n).*\.(reg|scr|exe|bat|cmd|vbs|hta|ps1)/i.test(str)) return true;
    if (/onlyfans_full_db/i.test(str)) return true;
    return false;
  }

  // Intercept programmatic .click() on <a> elements targeting malicious downloads
  try {
    const origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const target = (this.download || this.href || '');
      if (isMaliciousDownload(target)) {
        console.warn('[Summit Block] Prevented malicious auto-download:', target);
        return;
      }
      return origAnchorClick.apply(this, arguments);
    };
  } catch {}

  // Intercept click events in capture phase
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      const target = (a.download || a.href || '');
      if (isMaliciousDownload(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[Summit Block] Blocked click triggering malicious download:', target);
        return false;
      }
    }
  }, true);

  // Auto-remove fake In-Page Push notifications and fake system dialogs
  function sweepFakeDialogs() {
    const elements = document.querySelectorAll(
      'div[class*="in-page-push"], div[id*="in-page-push"], div[class*="fake-alert"], div[class*="push-notification"], .cl-dialog, .ipp-card, .ipp-dialog, [data-cl-spot]'
    );
    elements.forEach((el) => {
      try { el.remove(); } catch {}
    });

    const allDivs = document.querySelectorAll('div, section');
    allDivs.forEach((d) => {
      if (d.childElementCount < 10 && d.innerText && (d.innerText.includes('{CITY}') || d.innerText.includes('01_OnlyFans_Full_DB'))) {
        const modal = d.closest('div[style*="fixed"], div[style*="absolute"], div[class*="modal"], div[class*="dialog"]') || d;
        try { modal.remove(); } catch {}
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sweepFakeDialogs);
  } else {
    sweepFakeDialogs();
  }
  setInterval(sweepFakeDialogs, 1000);

  load();
})();
