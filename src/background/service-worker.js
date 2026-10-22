// Summit Block – background service worker (Manifest V3, ES module).
//
// Responsibilities
//   1. Keep declarativeNetRequest rulesets in sync with the user's settings
//   2. Serve cosmetic-filter configuration to content scripts
//   3. Count blocked requests and update the toolbar badge / icon
//   4. Context-menu actions and the element picker launcher
//
// The service worker holds no long-lived state: everything important is in chrome.storage.

import { getSettings, updateSettings, defaultStats, DEFAULT_SETTINGS } from '../shared/storage.js';
import { getHostname, hostMatches, isAllowlisted } from '../shared/domain.js';
import { BADGE_COLOR, ICONS_ON, ICONS_OFF, MAX_SELECTOR_LENGTH } from '../shared/constants.js';
import { syncRulesets, syncDynamicRules } from './rules.js';
import { recordBlock, resetTab, getTabCount } from './stats.js';

/* ───────────── block counting (listeners must be registered synchronously) ───────────── */

chrome.webRequest.onErrorOccurred.addListener(
  (d) => { if (d.error === 'net::ERR_BLOCKED_BY_CLIENT') recordBlock(d.tabId); },
  { urls: ['<all_urls>'] }
);

chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });

/* ───────────── cosmetic filter data ───────────── */

let cosmeticData = null;
async function getCosmeticData() {
  if (!cosmeticData) {
    const res = await fetch(chrome.runtime.getURL('src/data/cosmetic-filters.json'));
    cosmeticData = await res.json();
  }
  return cosmeticData;
}

function siteMatches(hosts, site) {
  return hosts.some((h) => h && hostMatches(h, site));
}

async function buildCosmeticConfig(sender) {
  const s = await getSettings();
  const topHost = getHostname(sender.tab?.url || sender.url || '');
  const frameHost = getHostname(sender.url || '');
  if (!s.enabled || isAllowlisted(topHost, s.whitelist)) return { active: false, selectors: [] };

  const hosts = [topHost, frameHost];
  const selectors = [];
  const data = await getCosmeticData();

  if (s.cosmetic) {
    selectors.push(...data.generic);
    for (const [site, list] of Object.entries(data.sites)) {
      if (siteMatches(hosts, site)) selectors.push(...list);
    }
  }
  if (s.annoyances) selectors.push(...data.annoyances);
  for (const [site, list] of Object.entries(s.customSelectors)) {
    if (siteMatches(hosts, site)) selectors.push(...list);
  }
  return { active: true, selectors };
}

/* ───────────── sync everything with settings ───────────── */

async function refreshTab(tab, s) {
  if (!tab?.id) return;
  const host = getHostname(tab.url || '');
  const off = !s.enabled || isAllowlisted(host, s.whitelist);
  chrome.action.setIcon({ tabId: tab.id, path: off ? ICONS_OFF : ICONS_ON }).catch(() => {});
}

async function broadcastRefresh() {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id != null) chrome.tabs.sendMessage(t.id, { type: 'refreshCosmetic' }).catch(() => {});
  }
}

async function applyAll() {
  const s = await getSettings();
  await Promise.all([syncRulesets(s), syncDynamicRules(s)]);
  chrome.action.setIcon({ path: s.enabled ? ICONS_ON : ICONS_OFF }).catch(() => {});
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((t) => refreshTab(t, s)));
  await broadcastRefresh();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) applyAll().catch(console.error);
});

/* ───────────── lifecycle ───────────── */

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'sb-pick',
      title: 'Block an element on this page…',
      contexts: ['page', 'frame', 'image', 'link', 'video', 'audio']
    });
    chrome.contextMenus.create({
      id: 'sb-toggle',
      title: 'Pause / resume Summit Block on this site',
      contexts: ['page', 'action']
    });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { settings, stats } = await chrome.storage.local.get(['settings', 'stats']);
  if (!settings) await chrome.storage.local.set({ settings: structuredClone(DEFAULT_SETTINGS) });
  if (!stats) await chrome.storage.local.set({ stats: defaultStats() });
  createMenus();
  await applyAll();
});

chrome.runtime.onStartup.addListener(() => { applyAll().catch(console.error); });

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') await resetTab(tabId);
  if (changeInfo.status) refreshTab(tab, await getSettings());
});

chrome.tabs.onRemoved.addListener((tabId) => { resetTab(tabId); });

/* ───────────── context menu ───────────── */

async function toggleSite(tab) {
  const host = getHostname(tab?.url || '');
  if (!host) return;
  await updateSettings((s) => {
    s.whitelist = isAllowlisted(host, s.whitelist)
      ? s.whitelist.filter((d) => !hostMatches(host, d))
      : [...s.whitelist, host];
  });
  chrome.tabs.reload(tab.id);
}

async function startPicker(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/picker.js'] });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 'sb-pick') startPicker(tab.id).catch(console.error);
  if (info.menuItemId === 'sb-toggle') toggleSite(tab).catch(console.error);
});

/* ───────────── messaging ───────────── */

async function handleMessage(msg, sender) {
  switch (msg?.type) {
    case 'getCosmeticConfig':
      return buildCosmeticConfig(sender);

    case 'getFeatureFlags': {
      const s = await getSettings();
      const host = getHostname(sender.tab?.url || sender.url || '');
      return { active: s.enabled && !isAllowlisted(host, s.whitelist), youtube: s.youtube };
    }

    case 'getTabCount':
      return { count: await getTabCount(Number(msg.tabId)) };

    case 'startPicker':
      await startPicker(Number(msg.tabId));
      return { ok: true };

    case 'addSelector': {
      // Host comes from the sender's tab, never from the message body.
      const host = getHostname(sender.tab?.url || '');
      const sel = msg.selector;
      if (!host || typeof sel !== 'string' || !sel || sel.length > MAX_SELECTOR_LENGTH) {
        return { ok: false };
      }
      await updateSettings((s) => {
        const list = s.customSelectors[host] || [];
        if (!list.includes(sel)) list.push(sel);
        s.customSelectors[host] = list;
      });
      return { ok: true };
    }

    default:
      return { error: 'unknown message' };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch((e) => sendResponse({ error: String(e) }));
  return true; // async response
});
