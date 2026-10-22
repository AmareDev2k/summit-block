// Hostname helpers. Pure functions – no chrome.* usage so they are unit-testable in Node.

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

/** Hostname of an http(s) URL without a leading "www.", or null for anything else. */
export function getHostname(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Turns user input ("https://www.Example.com/path") into "example.com", or null if invalid. */
export function normalizeHost(input) {
  if (typeof input !== 'string') return null;
  let h = input.trim().toLowerCase();
  h = h.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  h = h.replace(/[/?#].*$/, '');
  h = h.replace(/:\d+$/, '');
  h = h.replace(/^(\*\.|\.)/, '').replace(/^www\./, '');
  return DOMAIN_RE.test(h) ? h : null;
}

/** True if `host` equals `rule` or is a subdomain of it. */
export function hostMatches(host, rule) {
  return host === rule || host.endsWith('.' + rule);
}

export function isAllowlisted(host, list) {
  if (!host || !Array.isArray(list)) return false;
  return list.some((d) => hostMatches(host, d));
}
