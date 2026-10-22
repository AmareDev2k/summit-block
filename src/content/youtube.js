// Experimental: skips YouTube video ads (disabled by default – enable in Options).
// It never touches network traffic; it only clicks "Skip" and fast-forwards ad playback.
// YouTube changes its player often, so treat this as best-effort.

(() => {
  'use strict';
  if (window.__summitBlockYouTube) return;
  window.__summitBlockYouTube = true;

  let timer = null;
  let saved = null;

  function restore() {
    if (!saved) return;
    const video = document.querySelector('video');
    if (video) { video.muted = saved.muted; video.playbackRate = saved.rate; }
    saved = null;
  }

  function tick() {
    const player = document.querySelector('#movie_player');
    if (!player || !player.classList.contains('ad-showing')) return restore();

    const skip = document.querySelector(
      '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern'
    );
    if (skip) skip.click();

    const video = player.querySelector('video') || document.querySelector('video');
    if (!video) return;
    if (!saved) saved = { muted: video.muted, rate: video.playbackRate };
    video.muted = true;
    video.playbackRate = 16;
    if (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
      video.currentTime = video.duration;
    }
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    restore();
  }

  async function init() {
    try {
      const flags = await chrome.runtime.sendMessage({ type: 'getFeatureFlags' });
      if (flags && flags.active && flags.youtube) {
        if (!timer) timer = setInterval(tick, 400);
      } else {
        stop();
      }
    } catch {
      stop();
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'refreshCosmetic') init();
  });

  init();
})();
