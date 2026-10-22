// Block counter. We observe requests that Chrome cancelled with ERR_BLOCKED_BY_CLIENT
// (which is what declarativeNetRequest "block" produces) – no request contents are ever read.
//
// Per-tab counts live in memory + chrome.storage.session (survives service-worker restarts,
// cleared when the browser closes). The lifetime total lives in chrome.storage.local.

import { defaultStats } from '../shared/storage.js';

const SESSION_KEY = 'tabCounts';
const counts = new Map();
let loaded = null;
let totalPending = 0;
let timer = null;

function load() {
  if (!loaded) {
    loaded = chrome.storage.session.get(SESSION_KEY).then((res) => {
      const saved = res[SESSION_KEY] || {};
      for (const [k, v] of Object.entries(saved)) {
        if (!counts.has(Number(k))) counts.set(Number(k), v);
      }
    });
  }
  return loaded;
}

function scheduleFlush() {
  if (!timer) timer = setTimeout(flush, 1000);
}

async function flush() {
  timer = null;
  const add = totalPending;
  totalPending = 0;
  await chrome.storage.session.set({ [SESSION_KEY]: Object.fromEntries(counts) });
  if (add > 0) {
    const { stats } = await chrome.storage.local.get('stats');
    const next = { ...defaultStats(), ...(stats || {}) };
    next.total += add;
    await chrome.storage.local.set({ stats: next });
  }
}

export function setBadge(tabId, n) {
  const text = n > 0 ? (n > 999 ? '999+' : String(n)) : '';
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
}

export async function recordBlock(tabId) {
  await load();
  totalPending += 1;
  if (tabId >= 0) {
    const n = (counts.get(tabId) || 0) + 1;
    counts.set(tabId, n);
    setBadge(tabId, n);
  }
  scheduleFlush();
}

export async function resetTab(tabId) {
  await load();
  counts.delete(tabId);
  setBadge(tabId, 0);
  scheduleFlush();
}

export async function getTabCount(tabId) {
  await load();
  return counts.get(tabId) || 0;
}
