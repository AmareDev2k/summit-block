// Translates user settings into declarativeNetRequest state.
//   * static rulesets  -> enabled/disabled per user choice
//   * dynamic rules    -> allowlist (allowAllRequests) + user's custom blocked domains

import {
  RULESETS, ALLOW_RULE_START, CUSTOM_BLOCK_RULE_START, BLOCK_RESOURCE_TYPES
} from '../shared/constants.js';

export function buildDynamicRules(settings) {
  if (!settings.enabled) return [];
  const rules = [];

  // Allowlisted sites: `allowAllRequests` overrides every block rule for the page and its frames.
  settings.whitelist.forEach((host, i) => {
    rules.push({
      id: ALLOW_RULE_START + i,
      priority: 1000,
      action: { type: 'allowAllRequests' },
      condition: { requestDomains: [host], resourceTypes: ['main_frame', 'sub_frame'] }
    });
  });

  settings.customBlockDomains.forEach((host, i) => {
    rules.push({
      id: CUSTOM_BLOCK_RULE_START + i,
      priority: 1,
      action: { type: 'block' },
      condition: { requestDomains: [host], resourceTypes: BLOCK_RESOURCE_TYPES }
    });
  });

  return rules;
}

export async function syncRulesets(settings) {
  const dnr = chrome.declarativeNetRequest;
  const enabledNow = new Set(await dnr.getEnabledRulesets());
  const wanted = new Set(
    settings.enabled ? RULESETS.filter((r) => settings.rulesets[r.id]).map((r) => r.id) : []
  );
  const enableRulesetIds = [...wanted].filter((id) => !enabledNow.has(id));
  const disableRulesetIds = [...enabledNow].filter((id) => !wanted.has(id));
  if (enableRulesetIds.length || disableRulesetIds.length) {
    await dnr.updateEnabledRulesets({ enableRulesetIds, disableRulesetIds });
  }
}

export async function syncDynamicRules(settings) {
  const dnr = chrome.declarativeNetRequest;
  const existing = await dnr.getDynamicRules();
  await dnr.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: buildDynamicRules(settings)
  });
}
