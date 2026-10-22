import { getSettings, saveSettings, getStats, resetStats, sanitizeSettings, DEFAULT_SETTINGS } from '../shared/storage.js';
import { normalizeHost } from '../shared/domain.js';
import { MAX_SELECTOR_LENGTH } from '../shared/constants.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n) => Number(n || 0).toLocaleString();

let settings;

const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
function setPath(o, p, v) {
  const keys = p.split('.');
  const last = keys.pop();
  keys.reduce((a, k) => a[k], o)[last] = v;
}

async function persist() {
  settings = await saveSettings(settings);
  renderLists();
}

/* ── navigation ── */
function initNav() {
  $('#nav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    $$('#nav button').forEach((b) => b.classList.toggle('active', b === btn));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.id === `tab-${btn.dataset.tab}`));
    if (btn.dataset.tab === 'backup') renderStats();
  });
}

/* ── toggles ── */
function syncToggles() {
  $$('[data-key]').forEach((input) => { input.checked = !!getPath(settings, input.dataset.key); });
}

function bindToggles() {
  $$('[data-key]').forEach((input) => {
    input.addEventListener('change', async () => {
      setPath(settings, input.dataset.key, input.checked);
      await persist();
    });
  });
  syncToggles();
}

/* ── ruleset counts ── */
async function loadCounts() {
  for (const id of ['ads', 'trackers', 'malware']) {
    const target = $(`[data-count="${id}"]`);
    try {
      const rules = await (await fetch(chrome.runtime.getURL(`src/rules/${id}.json`))).json();
      const n = rules.reduce((sum, r) => sum + (r.condition.requestDomains ? r.condition.requestDomains.length : 1), 0);
      target.textContent = fmt(n);
    } catch {
      target.textContent = '?';
    }
  }
}

/* ── list rendering ── */
function renderList(ul, items, onRemove, emptyText) {
  ul.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = emptyText;
    li.style.border = '0';
    li.style.background = 'none';
    ul.append(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    if (item.prefix) {
      const em = document.createElement('em');
      em.textContent = item.prefix;
      span.append(em);
    }
    span.append(document.createTextNode(item.text));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.setAttribute('aria-label', `Remove ${item.text}`);
    btn.addEventListener('click', () => onRemove(item));
    li.append(span, btn);
    ul.append(li);
  }
}

function renderLists() {
  renderList($('#allowList'), settings.whitelist.map((text) => ({ text })), async ({ text }) => {
    settings.whitelist = settings.whitelist.filter((d) => d !== text);
    await persist();
  }, 'No allowlisted sites.');

  renderList($('#blockList'), settings.customBlockDomains.map((text) => ({ text })), async ({ text }) => {
    settings.customBlockDomains = settings.customBlockDomains.filter((d) => d !== text);
    await persist();
  }, 'No custom blocked domains.');

  const sels = [];
  for (const [site, list] of Object.entries(settings.customSelectors)) {
    for (const sel of list) sels.push({ site, text: sel, prefix: site });
  }
  renderList($('#selList'), sels, async ({ site, text }) => {
    settings.customSelectors[site] = settings.customSelectors[site].filter((s) => s !== text);
    if (!settings.customSelectors[site].length) delete settings.customSelectors[site];
    await persist();
  }, 'No hidden elements yet.');
}

/* ── forms ── */
function initForms() {
  $('#allowForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const host = normalizeHost($('#allowInput').value);
    if (!host) { $('#allowError').textContent = 'Enter a valid domain, e.g. example.com'; return; }
    $('#allowError').textContent = '';
    if (!settings.whitelist.includes(host)) settings.whitelist.push(host);
    $('#allowInput').value = '';
    await persist();
  });

  $('#blockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const host = normalizeHost($('#blockInput').value);
    if (!host) { $('#blockError').textContent = 'Enter a valid domain, e.g. ads.example.com'; return; }
    $('#blockError').textContent = '';
    if (!settings.customBlockDomains.includes(host)) settings.customBlockDomains.push(host);
    $('#blockInput').value = '';
    await persist();
  });

  $('#selForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const site = normalizeHost($('#selSite').value);
    const sel = $('#selInput').value.trim();
    let valid = !!sel && sel.length <= MAX_SELECTOR_LENGTH;
    if (valid) { try { document.createDocumentFragment().querySelector(sel); } catch { valid = false; } }
    if (!site || !valid) { $('#selError').textContent = 'Enter a valid site and a valid CSS selector.'; return; }
    $('#selError').textContent = '';
    (settings.customSelectors[site] ||= []);
    if (!settings.customSelectors[site].includes(sel)) settings.customSelectors[site].push(sel);
    $('#selInput').value = '';
    await persist();
  });
}

/* ── backup & stats ── */
async function renderStats() {
  const s = await getStats();
  $('#statTotal').textContent = fmt(s.total);
  $('#statSince').textContent = new Date(s.since).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function say(msg) { $('#backupMsg').textContent = msg; }

function initBackup() {
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'summit-block', version: 1, settings }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'summit-block-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    say('Settings exported.');
  });

  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('File too large');
      const data = JSON.parse(await file.text());
      settings = await saveSettings(sanitizeSettings(data.settings ?? data));
      syncToggles();
      renderLists();
      say('Settings imported.');
    } catch {
      say('Could not import that file.');
    }
  });

  $('#resetStatsBtn').addEventListener('click', async () => { await resetStats(); await renderStats(); say('Counter reset.'); });

  $('#resetAllBtn').addEventListener('click', async () => {
    if (!confirm('Reset all settings, allowlist and custom filters to defaults?')) return;
    settings = await saveSettings(structuredClone(DEFAULT_SETTINGS));
    await resetStats();
    syncToggles();
    renderLists();
    await renderStats();
    say('Everything was reset.');
  });
}

async function init() {
  settings = await getSettings();
  $('#ver').textContent = `v${chrome.runtime.getManifest().version}`;
  initNav();
  bindToggles();
  initForms();
  initBackup();
  renderLists();
  renderStats();
  loadCounts();
}

init();
