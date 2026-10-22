// Settings + stats persistence. Every read is sanitised, so corrupt or imported data can never
// put the extension in an invalid state.

import { normalizeHost } from './domain.js';
import { MAX_LIST_ITEMS, MAX_SELECTOR_LENGTH } from './constants.js';

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  rulesets: { ads: true, trackers: true, malware: true },
  cosmetic: true,        // hide ad containers with CSS
  annoyances: false,     // cookie banners, newsletter pop-ups
  youtube: false,        // auto-skip YouTube video ads (experimental)
  whitelist: [],         // sites where blocking is paused
  customBlockDomains: [],
  customSelectors: {}    // { "example.com": ["#selector", ...] }
});

export const defaultStats = () => ({ total: 0, since: Date.now() });

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const uniq = (arr) => [...new Set(arr)];

export function sanitizeSettings(raw) {
  const out = structuredClone(DEFAULT_SETTINGS);
  if (!isObj(raw)) return out;

  for (const k of ['enabled', 'cosmetic', 'annoyances', 'youtube']) {
    if (typeof raw[k] === 'boolean') out[k] = raw[k];
  }
  if (isObj(raw.rulesets)) {
    for (const id of Object.keys(out.rulesets)) {
      if (typeof raw.rulesets[id] === 'boolean') out.rulesets[id] = raw.rulesets[id];
    }
  }
  for (const k of ['whitelist', 'customBlockDomains']) {
    const list = Array.isArray(raw[k]) ? raw[k] : [];
    out[k] = uniq(list.map(normalizeHost).filter(Boolean)).slice(0, MAX_LIST_ITEMS);
  }
  if (isObj(raw.customSelectors)) {
    for (const [site, list] of Object.entries(raw.customSelectors)) {
      const host = normalizeHost(site);
      if (!host || !Array.isArray(list)) continue;
      const sels = uniq(
        list.filter((s) => typeof s === 'string' && s.length > 0 && s.length <= MAX_SELECTOR_LENGTH)
      ).slice(0, 500);
      if (sels.length) out.customSelectors[host] = sels;
    }
  }
  return out;
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return sanitizeSettings(settings);
}

export async function saveSettings(settings) {
  const clean = sanitizeSettings(settings);
  await chrome.storage.local.set({ settings: clean });
  return clean;
}

/** Read-modify-write helper. `mutator` receives a copy and may mutate it or return a new object. */
export async function updateSettings(mutator) {
  const draft = await getSettings(); // already a fresh, sanitised copy
  const result = await mutator(draft);
  return saveSettings(result || draft);
}

export async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return { ...defaultStats(), ...(isObj(stats) ? stats : {}) };
}

export async function resetStats() {
  await chrome.storage.local.set({ stats: defaultStats() });
}
