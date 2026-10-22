// Shared constants – safe to import from the service worker, popup and options page.

export const APP_NAME = 'Summit Block';

/** Static rulesets declared in manifest.json (src/rules/<id>.json). */
export const RULESETS = [
  { id: 'ads', label: 'Ads & popups' },
  { id: 'trackers', label: 'Trackers & analytics' },
  { id: 'malware', label: 'Malware & crypto-miners' }
];

/** Dynamic rule id ranges (static rulesets have their own id space). */
export const ALLOW_RULE_START = 1000;
export const CUSTOM_BLOCK_RULE_START = 100000;

/** main_frame is intentionally excluded so we never break top-level navigation. */
export const BLOCK_RESOURCE_TYPES = [
  'sub_frame', 'stylesheet', 'script', 'image', 'font',
  'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other'
];

export const BADGE_COLOR = '#4f46e5';

export const ICONS_ON = {
  16: 'assets/icons/icon-16.png',
  32: 'assets/icons/icon-32.png',
  48: 'assets/icons/icon-48.png',
  128: 'assets/icons/icon-128.png'
};

export const ICONS_OFF = {
  16: 'assets/icons/icon-off-16.png',
  32: 'assets/icons/icon-off-32.png',
  48: 'assets/icons/icon-off-48.png',
  128: 'assets/icons/icon-off-128.png'
};

export const MAX_SELECTOR_LENGTH = 500;
export const MAX_LIST_ITEMS = 5000;
