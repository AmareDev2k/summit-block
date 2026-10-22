import test from 'node:test';
import assert from 'node:assert/strict';
import { getHostname, normalizeHost, hostMatches, isAllowlisted } from '../src/shared/domain.js';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../src/shared/storage.js';

test('getHostname', () => {
  assert.equal(getHostname('https://www.Example.com/a?b=1'), 'example.com');
  assert.equal(getHostname('http://sub.example.co.uk:8080/'), 'sub.example.co.uk');
  assert.equal(getHostname('chrome://extensions'), null);
  assert.equal(getHostname('not a url'), null);
});

test('normalizeHost', () => {
  assert.equal(normalizeHost('  HTTPS://www.Example.com/path?x=1#y '), 'example.com');
  assert.equal(normalizeHost('*.ads.example.org'), 'ads.example.org');
  assert.equal(normalizeHost('example.com:8443'), 'example.com');
  assert.equal(normalizeHost('localhost'), null);
  assert.equal(normalizeHost('bad_domain.com'), null);
  assert.equal(normalizeHost('<script>alert(1)</script>'), null);
  assert.equal(normalizeHost(42), null);
});

test('hostMatches / isAllowlisted', () => {
  assert.ok(hostMatches('a.b.example.com', 'example.com'));
  assert.ok(hostMatches('example.com', 'example.com'));
  assert.ok(!hostMatches('notexample.com', 'example.com'));
  assert.ok(isAllowlisted('news.example.com', ['example.com']));
  assert.ok(!isAllowlisted(null, ['example.com']));
});

test('sanitizeSettings returns defaults for garbage', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings('nope'), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings([1, 2]), DEFAULT_SETTINGS);
});

test('sanitizeSettings cleans imported data', () => {
  const s = sanitizeSettings({
    enabled: false,
    youtube: 'yes',
    rulesets: { ads: false, evil: true },
    whitelist: ['https://www.Foo.com/x', 'foo.com', '???', 7],
    customBlockDomains: ['ads.bar.net'],
    customSelectors: {
      'baz.com': ['#a', '', 5, 'x'.repeat(501)],
      'not a host': ['#b']
    },
    __proto__: { polluted: true }
  });
  assert.equal(s.enabled, false);
  assert.equal(s.youtube, true);
  assert.deepEqual(s.rulesets, { ads: false, trackers: true, malware: true });
  assert.deepEqual(s.whitelist, ['foo.com']);
  assert.deepEqual(s.customBlockDomains, ['ads.bar.net']);
  assert.deepEqual(s.customSelectors, { 'baz.com': ['#a'] });
  assert.equal(s.polluted, undefined);
});
