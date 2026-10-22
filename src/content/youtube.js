// Summit Block – YouTube video ad skipper & cleaner.
// Skips video ads, fast-forwards playback, mutes ad audio, and dismisses adblock warnings.
// Runs locally in page context without touching network traffic.

(() => {
  'use strict';
  if (window.__summitBlockYouTube) return;
  window.__summitBlockYouTube = true;

  let timer = null;
  let saved = null;
  let observer = null;

  const SKIP_SELECTORS = [
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

  const DISMISS_SELECTORS = [
    'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model) #dismiss-button',
    'ytd-enforcement-message-view-model button',
    'tp-yt-paper-dialog #dismiss-button',
    '.yt-spec-button-shape-next[aria-label*="Dismiss" i]'
  ].join(', ');

  function triggerRealClick(element) {
    if (!element) return;
    const target = element.closest('button, [role="button"]') || element;
    const opts = { bubbles: true, cancelable: true, view: window };
    try { target.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch {}
    try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch {}
    try { target.dispatchEvent(new PointerEvent('pointerup', opts)); } catch {}
    try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch {}
    try { target.dispatchEvent(new MouseEvent('click', opts)); } catch {}
    if (typeof target.click === 'function') {
      try { target.click(); } catch {}
    }
  }

  function clickAllSkipButtons() {
    // 1. Selector match
    const candidates = document.querySelectorAll(SKIP_SELECTORS);
    for (const el of candidates) {
      triggerRealClick(el);
    }
    // 2. Text match fallback ("Skip", "Skip Ad", "Skip Ads")
    const buttons = document.querySelectorAll('button, div[role="button"], span[role="button"], [class*="skip"]');
    for (const b of buttons) {
      const text = (b.innerText || b.textContent || '').trim();
      if (/^skip(\s*ad(s)?)?$/i.test(text) || /skip\s*ad/i.test(text)) {
        triggerRealClick(b);
      }
    }
  }

  function restore() {
    if (!saved) return;
    const video = document.querySelector('video');
    if (video) {
      video.muted = saved.muted;
      video.playbackRate = saved.rate;
    }
    saved = null;
  }

  function dismissAntiAdblockModal() {
    const dialogs = document.querySelectorAll(
      'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model), ytd-enforcement-message-view-model'
    );
    if (dialogs.length) {
      dialogs.forEach((d) => d.remove());
      const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
      if (backdrop) backdrop.remove();
      const video = document.querySelector('video');
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
    const dismissBtn = document.querySelector(DISMISS_SELECTORS);
    if (dismissBtn) {
      dismissBtn.click();
      const video = document.querySelector('video');
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  }

  function tick() {
    // 1. ALWAYS click any skip ad button unconditionally
    clickAllSkipButtons();

    // 2. Dismiss any anti-adblock modal
    dismissAntiAdblockModal();

    const player = document.querySelector('#movie_player, .html5-video-player');
    const isAdShowing = player && (
      player.classList.contains('ad-showing') ||
      player.classList.contains('ad-interrupting') ||
      Boolean(player.querySelector('.ytp-ad-player-overlay, .video-ads.ytp-ad-module:not(:empty), .ytp-ad-preview-container, .ytp-ad-preview-slot'))
    );

    if (!isAdShowing) return restore();

    // Fast click skip buttons again
    clickAllSkipButtons();

    const video = (player && player.querySelector('video')) || document.querySelector('video');
    if (!video) return;

    if (!saved) saved = { muted: video.muted, rate: video.playbackRate };
    video.muted = true;
    video.playbackRate = 16;

    if (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
      try {
        video.currentTime = video.duration;
      } catch {
        /* playbackRate=16 fast-forwards if setting currentTime is guarded */
      }
    }

    clickAllSkipButtons();
  }

  function startObserver() {
    if (observer) return;
    const target = document.querySelector('#movie_player, .html5-video-player') || document.body;
    if (!target) return;
    observer = new MutationObserver(() => {
      tick();
    });
    observer.observe(target, { attributes: true, childList: true, subtree: true });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (observer) { observer.disconnect(); observer = null; }
    restore();
  }

  async function init() {
    try {
      const flags = await chrome.runtime.sendMessage({ type: 'getFeatureFlags' });
      if (flags && flags.active && flags.youtube) {
        if (!timer) timer = setInterval(tick, 30);
        startObserver();
      } else {
        stop();
      }
    } catch {
      // Fallback: keep ticking if extension messaging is briefly offline
      if (!timer) timer = setInterval(tick, 30);
    }
  }

  // Also bind directly to video events when present
  document.addEventListener('timeupdate', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') clickAllSkipButtons();
  }, true);

  document.addEventListener('playing', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') tick();
  }, true);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'refreshCosmetic') init();
  });

  window.addEventListener('yt-navigate-finish', () => {
    init();
    startObserver();
  });

  document.addEventListener('DOMContentLoaded', init);
  init();
})();
