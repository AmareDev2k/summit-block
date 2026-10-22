// Summit Block – Scriptlet Defusers (runs in MAIN world at document_start).
// unsolicited navigation, and malicious auto-download loops directly in the page context.

(() => {
  'use strict';
  if (window.__summitBlockDefuser) return;
  window.__summitBlockDefuser = true;

  /* ───────────── 1. Malicious File & Registry Download Defuser ───────────── */

  function isMaliciousDownload(urlOrFilename) {
    if (typeof urlOrFilename !== 'string' || !urlOrFilename) return false;
    let str = urlOrFilename.toLowerCase();
    try { str = decodeURIComponent(str); } catch {}
    // Block Windows Registry (.reg) scripts, screensavers (.scr), and HTA applications from web pages
    if (/\.(reg|scr|hta)(\?|#|$|\s)/i.test(str)) return true;
    // Block filename-spoofing attacks (e.g. drive.google.com ... .reg, %r%r, %b)
    if (/(drive\.google\.com|dropbox|onedrive).*\s{3,}.*\.(reg|scr|exe|bat|cmd|vbs|hta|ps1)/i.test(str)) return true;
    if (/(%r|%b|%00|\\r|\\n).*\.(reg|scr|exe|bat|cmd|vbs|hta|ps1)/i.test(str)) return true;
    if (/onlyfans_full_db/i.test(str)) return true;
    return false;
  }

  try {
    const origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      const target = (this.download || this.href || '');
      if (isMaliciousDownload(target)) {
        console.warn('[Summit Block] Defused malicious programmatic file download:', target);
        return;
      }
      return origAnchorClick.apply(this, arguments);
    };
  } catch {}

  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      const target = (a.download || a.href || '');
      if (isMaliciousDownload(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[Summit Block] Defused click on malicious download link:', target);
        return false;
      }
    }
  }, true);

  /* ───────────── 2. window.open Popunder Defuser (uBO noWindowOpenIf) ───────────── */

  const AD_URL_PATTERNS = [
    /adcash/i, /popmyads/i, /popads/i, /popcash/i, /propeller/i, /adsterra/i,
    /clickadu/i, /clksite/i, /exoclick/i, /exdynsrv/i, /realsrv/i, /juicyads/i,
    /trafficstars/i, /trafficjunky/i, /wpadmngr/i, /deductgreedyheadroom/i,
    /deloton/i, /highperformancegate/i, /onclick/i, /onclk/i, /tsyndicate/i,
    /monetag/i, /hilltopads/i, /a-ads/i, /tubecup/i, /bidgear/i
  ];

  function isAdOrPopunderUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url === 'about:blank' || url === '') return false;
    return AD_URL_PATTERNS.some((re) => re.test(url));
  }

  function createDecoyWindow() {
    const noop = () => {};
    const decoy = {
      closed: false,
      close: noop,
      focus: noop,
      blur: noop,
      postMessage: noop,
      document: { location: { href: 'about:blank' } },
      location: { href: 'about:blank', replace: noop, assign: noop }
    };
    return new Proxy(decoy, {
      get: (target, prop) => (prop in target ? target[prop] : noop),
      set: (target, prop, val) => { target[prop] = val; return true; }
    });
  }

  try {
    const origWindowOpen = window.open;
    window.open = function (url, target, features) {
      const urlStr = String(url || '');
      if (isAdOrPopunderUrl(urlStr) || isMaliciousDownload(urlStr)) {
        console.warn('[Summit Block] Defused popunder window.open call:', urlStr);
        return createDecoyWindow();
      }
      return origWindowOpen.apply(this, arguments);
    };
  } catch {}

  /* ───────────── 3. Unsolicited Navigation Defuser (uBO prevent-navigation) ───────────── */

  if (window.navigation && typeof window.navigation.addEventListener === 'function') {
    try {
      window.navigation.addEventListener('navigate', (ev) => {
        if (ev.userInitiated) return;
        const dest = ev.destination?.url || '';
        if (isMaliciousDownload(dest) || isAdOrPopunderUrl(dest)) {
          ev.preventDefault();
          console.warn('[Summit Block] Defused unprompted background navigation:', dest);
        }
      });
    } catch {}
  }

  /* ───────────── 4. In-Page Push & Fake Alert Defuser (uBO prevent-dialog) ───────────── */

  function sweepFakeDialogs() {
    const dialogs = document.querySelectorAll(
      'div[class*="in-page-push"], div[id*="in-page-push"], div[class*="fake-alert"], div[class*="push-notification"], .cl-dialog, .ipp-card, .ipp-dialog, [data-cl-spot]'
    );
    for (const d of dialogs) {
      try { d.remove(); } catch {}
    }

    const allDivs = document.querySelectorAll('div, section');
    for (const el of allDivs) {
      if (el.childElementCount < 10 && el.innerText && (el.innerText.includes('{CITY}') || el.innerText.includes('01_OnlyFans_Full_DB'))) {
        const modal = el.closest('div[style*="fixed"], div[style*="absolute"], div[class*="modal"], div[class*="dialog"]') || el;
        try { modal.remove(); } catch {}
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sweepFakeDialogs);
  } else {
    sweepFakeDialogs();
  }
  setInterval(sweepFakeDialogs, 1000);

  /* ───────────── 5. YouTube Anti-Adblock, Fetch Pruner & Native Player Controller ───────────── */

  if (window.location.hostname.endsWith('youtube.com')) {
    // 5a. Recursive Ad Pruner (matches uBO json-prune-fetch-response)
    const pruneYouTubeAds = (target) => {
      if (!target || typeof target !== 'object') return target;
      if (Array.isArray(target)) {
        for (let i = 0; i < target.length; i++) {
          target[i] = pruneYouTubeAds(target[i]);
        }
        return target;
      }
      delete target.adPlacements;
      delete target.playerAds;
      delete target.adSlots;
      delete target.adBreakHeartbeatParams;
      if (target.playerResponse && typeof target.playerResponse === 'object') {
        pruneYouTubeAds(target.playerResponse);
      }
      return target;
    };

    // 5b. Hook window.fetch for /youtubei/v1/player, /player?, /playlist, get_watch
    try {
      const origFetch = window.fetch;
      window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        const response = await origFetch.apply(this, arguments);
        if (typeof url === 'string' && (
          url.includes('/youtubei/v1/player') ||
          url.includes('/player?') ||
          url.includes('get_watch') ||
          url.includes('/youtubei/v1/browse') ||
          url.includes('/playlist?')
        )) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            pruneYouTubeAds(data);
            const cleanBody = JSON.stringify(data);
            return new Response(cleanBody, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          } catch {
            return response;
          }
        }
        return response;
      };
    } catch {}

    // 5c. Hook Response.prototype.json
    try {
      const origResponseJson = Response.prototype.json;
      Response.prototype.json = async function () {
        const data = await origResponseJson.apply(this, arguments);
        if (data && typeof data === 'object') {
          pruneYouTubeAds(data);
        }
        return data;
      };
    } catch {}

    // 5d. Hook XMLHttpRequest
    try {
      const origXhrOpen = XMLHttpRequest.prototype.open;
      const origXhrSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (method, url) {
        this._sbUrl = typeof url === 'string' ? url : String(url || '');
        return origXhrOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function () {
        if (this._sbUrl && (this._sbUrl.includes('/youtubei/v1/player') || this._sbUrl.includes('/player?'))) {
          this.addEventListener('readystatechange', () => {
            if (this.readyState === 4) {
              try {
                if (!this.responseType || this.responseType === 'text') {
                  const data = JSON.parse(this.responseText);
                  pruneYouTubeAds(data);
                  const clean = JSON.stringify(data);
                  Object.defineProperty(this, 'responseText', { value: clean, configurable: true });
                  Object.defineProperty(this, 'response', { value: clean, configurable: true });
                }
              } catch {}
            }
          });
        }
        return origXhrSend.apply(this, arguments);
      };
    } catch {}

    // 5e. Hook JSON.parse
    try {
      const origJsonParse = JSON.parse;
      JSON.parse = function () {
        const result = origJsonParse.apply(this, arguments);
        if (result && typeof result === 'object') {
          pruneYouTubeAds(result);
        }
        return result;
      };
    } catch {}

    // 5f. Hook window.ytInitialPlayerResponse
    try {
      let _ytInitial = window.ytInitialPlayerResponse;
      if (_ytInitial) pruneYouTubeAds(_ytInitial);
      Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        enumerable: true,
        get: () => _ytInitial,
        set: (val) => {
          _ytInitial = pruneYouTubeAds(val);
        }
      });
    } catch {}

    // 5g. Defuse ytcfg experiment flags
    try {
      const patchFlags = (flags) => {
        if (!flags || typeof flags !== 'object') return;
        flags.all_web_enable_network_machine = false;
        flags.all_web_network_machine_raw_request = false;
        flags.web_streaming_watch = false;
      };

      const defuseYtCfg = (cfg) => {
        if (!cfg || typeof cfg !== 'object') return;
        patchFlags(cfg.EXPERIMENT_FLAGS);
        if (cfg.data_) patchFlags(cfg.data_.EXPERIMENT_FLAGS);
        if (typeof cfg.set === 'function' && !cfg._sbHooked) {
          cfg._sbHooked = true;
          const origSet = cfg.set;
          cfg.set = function (k, v) {
            if (k === 'EXPERIMENT_FLAGS' && v && typeof v === 'object') patchFlags(v);
            else if (typeof k === 'object' && k && k.EXPERIMENT_FLAGS) patchFlags(k.EXPERIMENT_FLAGS);
            return origSet.apply(this, arguments);
          };
        }
      };

      if (window.ytcfg) defuseYtCfg(window.ytcfg);
      let _ytcfg = window.ytcfg;
      Object.defineProperty(window, 'ytcfg', {
        configurable: true,
        enumerable: true,
        get: () => _ytcfg,
        set: (val) => {
          _ytcfg = val;
          defuseYtCfg(val);
        }
      });
    } catch {}

    // 5h. Real-Time Native Player Ad Skipper & Modal Dismissal (runs in MAIN world)
    const FAST_SKIP_SELECTORS = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-container button',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-slot',
      '.ytp-ad-skip-slot button',
      '.ytp-ad-skip-slot',
      '[id^="skip-button:"] button',
      '[id^="skip-button:"]',
      'button[id^="skip-button"]',
      '.ytp-ad-overlay-close-button',
      'button.ytp-ad-overlay-close-button',
      'button[class*="skip-button"]',
      'button[class*="ad-skip"]',
      'button[aria-label*="Skip" i]',
      'button[aria-label*="skip" i]',
      '.ytp-ad-preview-container button',
      '.ytp-ad-skip-button-text',
      '.ytp-ad-skip-button-modern-text',
      '[data-ad-skip-button]',
      'div[class*="skip"][role="button"]'
    ].join(', ');

    const triggerFullClick = (el) => {
      if (!el) return;
      const target = el.closest('button, [role="button"]') || el;
      const opts = { bubbles: true, cancelable: true, view: window };
      try { target.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch {}
      try { target.dispatchEvent(new PointerEvent('pointerup', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('click', opts)); } catch {}
      if (typeof target.click === 'function') {
        try { target.click(); } catch {}
      }
    };

    const clickAllSkipButtons = () => {
      // 1. Selector match
      const candidates = document.querySelectorAll(FAST_SKIP_SELECTORS);
      for (const el of candidates) {
        triggerFullClick(el);
      }
      // 2. Text match fallback ("Skip", "Skip Ad", "Skip Ads")
      const buttons = document.querySelectorAll('button, div[role="button"], span[role="button"], [class*="skip"]');
      for (const b of buttons) {
        const text = (b.innerText || b.textContent || '').trim();
        if (/^skip(\s*ad(s)?)?$/i.test(text) || /skip\s*ad/i.test(text)) {
          triggerFullClick(b);
        }
      }
    };

    const fastSkipYouTube = () => {
      // ALWAYS unconditionally click any visible skip button first!
      clickAllSkipButtons();

      // Dismiss anti-adblock modal if present
      const dialogs = document.querySelectorAll(
        'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model), ytd-enforcement-message-view-model'
      );
      if (dialogs.length) {
        dialogs.forEach((d) => d.remove());
        const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
        if (backdrop) backdrop.remove();
        const v = document.querySelector('video');
        if (v && v.paused) {
          v.play().catch(() => {});
        }
      }

      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const video = (player && player.querySelector('video')) || document.querySelector('video');
      if (!player && !video) return;

      const isAdShowing = Boolean(
        player && (
          player.classList.contains('ad-showing') ||
          player.classList.contains('ad-interrupting') ||
          player.querySelector('.ytp-ad-player-overlay, .video-ads.ytp-ad-module:not(:empty), .ytp-ad-preview-container, .ytp-ad-preview-slot')
        )
      );

      if (isAdShowing) {
        // Direct call to YouTube player API
        if (typeof player?.skipAd === 'function') {
          try { player.skipAd(); } catch {}
        }

        clickAllSkipButtons();

        if (video) {
          video.muted = true;
          video.playbackRate = 16;
          if (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
            try {
              if (typeof player?.seekTo === 'function') {
                player.seekTo(video.duration);
              } else {
                video.currentTime = video.duration;
              }
            } catch {}
          }
        }

        clickAllSkipButtons();
      }
    };

    setInterval(fastSkipYouTube, 30);
    document.addEventListener('DOMContentLoaded', fastSkipYouTube);
    window.addEventListener('load', fastSkipYouTube);
    window.addEventListener('yt-navigate-finish', fastSkipYouTube);
  }


  /* ───────────── 6. uBO Lite prevent-popup: Auto-close Ad Tabs ───────────── */

  if (window.opener && window === window.top) {
    const currentUrl = window.location.href;
    const currentHost = window.location.hostname.toLowerCase();
    if (isAdOrPopunderUrl(currentUrl) || isAdOrPopunderUrl(currentHost)) {
      console.warn('[Summit Block] Automatically closed popunder tab:', currentHost);
      window.close();
    }
  }
})();
