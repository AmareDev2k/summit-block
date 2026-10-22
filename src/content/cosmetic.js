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

  load();
})();
