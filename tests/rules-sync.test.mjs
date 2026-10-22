import test from 'node:test';

test('settings → declarativeNetRequest sync (mocked chrome API)', async () => {
  // Mock chrome.* just enough to exercise storage + rule-sync logic end to end.
  const store = {};
  const dnrState = { enabled: new Set(['ads', 'trackers', 'malware']), dynamic: [] };
  globalThis.chrome = {
    storage: { local: {
      get: async (k) => (typeof k === 'string' ? { [k]: store[k] } : Object.fromEntries(k.map((x) => [x, store[x]]))),
      set: async (o) => Object.assign(store, structuredClone(o))
    } },
    declarativeNetRequest: {
      getEnabledRulesets: async () => [...dnrState.enabled],
      updateEnabledRulesets: async ({ enableRulesetIds, disableRulesetIds }) => {
        enableRulesetIds.forEach((i) => dnrState.enabled.add(i));
        disableRulesetIds.forEach((i) => dnrState.enabled.delete(i));
      },
      getDynamicRules: async () => dnrState.dynamic,
      updateDynamicRules: async ({ removeRuleIds, addRules }) => {
        dnrState.dynamic = dnrState.dynamic.filter((r) => !removeRuleIds.includes(r.id)).concat(addRules);
      }
    }
  };
  const { getSettings, updateSettings } = await import('../src/shared/storage.js');
  const { syncRulesets, syncDynamicRules } = await import('../src/background/rules.js');
  const assert = (await import('node:assert/strict')).default;

  let s = await getSettings();
  await syncRulesets(s); await syncDynamicRules(s);
  assert.equal(dnrState.enabled.size, 3);
  assert.equal(dnrState.dynamic.length, 0);

  s = await updateSettings((x) => { x.whitelist.push('example.com'); x.customBlockDomains.push('ads.foo.net'); x.rulesets.trackers = false; });
  await syncRulesets(s); await syncDynamicRules(s);
  assert.deepEqual([...dnrState.enabled].sort(), ['ads', 'malware']);
  assert.equal(dnrState.dynamic.length, 2);
  assert.equal(dnrState.dynamic[0].action.type, 'allowAllRequests');
  assert.deepEqual(dnrState.dynamic[0].condition.resourceTypes, ['main_frame', 'sub_frame']);
  assert.equal(dnrState.dynamic[1].action.type, 'block');

  s = await updateSettings((x) => { x.enabled = false; });
  await syncRulesets(s); await syncDynamicRules(s);
  assert.equal(dnrState.enabled.size, 0);
  assert.equal(dnrState.dynamic.length, 0);

  // idempotent re-sync
  await syncRulesets(s); await syncDynamicRules(s);
  
});
