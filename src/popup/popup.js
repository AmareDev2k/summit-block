import { getSettings, updateSettings, getStats } from '../shared/storage.js';
import { getHostname, isAllowlisted, hostMatches } from '../shared/domain.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toLocaleString();

let tab = null;
let host = null;
let settings = null;

function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('themeToggle').textContent = dark ? 'Light mode' : 'Dark mode';
  $('themeToggle').setAttribute('aria-pressed', String(dark));
}

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
  settings = await getSettings();
  if (settings.theme === 'system') applyTheme(settings.theme);
});

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  host = getHostname(tab?.url || '');
  settings = await getSettings();
  applyTheme(settings.theme);
  $('ver').textContent = `v${chrome.runtime.getManifest().version}`;
  await render();
  bind();
}

async function render() {
  const on = settings.enabled;
  $('power').setAttribute('aria-pressed', String(on));
  $('status').textContent = on ? 'Protection is on' : 'Protection is paused';

  // per-page + lifetime stats
  let count = 0;
  if (tab?.id != null) {
    try { count = (await chrome.runtime.sendMessage({ type: 'getTabCount', tabId: tab.id }))?.count || 0; } catch { /* ignore */ }
  }
  $('pageCount').textContent = fmt(count);
  const stats = await getStats();
  $('totalCount').textContent = fmt(stats.total);
  $('sinceDate').textContent = new Date(stats.since).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  // site controls
  const toggle = $('siteToggle');
  if (!host) {
    $('siteName').textContent = 'This page';
    $('siteHint').textContent = 'Not available on browser pages';
    toggle.disabled = true;
    toggle.checked = false;
    $('pick').disabled = true;
  } else {
    const allowed = isAllowlisted(host, settings.whitelist);
    $('siteName').textContent = host;
    $('siteHint').textContent = allowed ? 'Paused on this site' : 'Blocking on this site';
    toggle.checked = !allowed;
    toggle.disabled = !on;
    $('pick').disabled = !on;
  }
}

function bind() {
  $('power').addEventListener('click', async () => {
    settings = await updateSettings((s) => { s.enabled = !s.enabled; });
    await render();
  });

  $('siteToggle').addEventListener('change', async (e) => {
    const block = e.target.checked;
    settings = await updateSettings((s) => {
      s.whitelist = block
        ? s.whitelist.filter((d) => !hostMatches(host, d))
        : [...new Set([...s.whitelist, host])];
    });
    await render();
    if (tab?.id != null) chrome.tabs.reload(tab.id);
  });

  $('pick').addEventListener('click', async () => {
    if (tab?.id == null) return;
    await chrome.runtime.sendMessage({ type: 'startPicker', tabId: tab.id });
    window.close();
  });

  $('options').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('themeToggle').addEventListener('click', async () => {
    settings = await updateSettings((s) => { s.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; });
    applyTheme(settings.theme);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) getSettings().then((s) => { settings = s; render(); });
  });
}

init();
