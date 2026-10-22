# Chrome Web Store listing kit

## Name
Summit Block – Ad & Tracker Blocker

## Short description (≤132 chars)
Fast, private, open-source ad and tracker blocker. No data collection. Built on Manifest V3.

## Detailed description
Summit Block removes ads, trackers and crypto-miners so pages load cleaner and faster – without
spying on you.

★ Native-speed blocking using Chrome's declarativeNetRequest engine
★ Hides leftover ad boxes and placeholders
★ Click-to-hide element picker
★ One-click pause on any site
★ Live blocked-requests counter
★ Backup & restore your settings
★ 100% local – no analytics, no telemetry, no remote code, no accounts

Summit Block collects no data of any kind. Everything stays in your browser. Open source (MIT).

## Single purpose statement
Block advertisements, trackers and malicious resources on web pages and let the user control
that blocking.

## Permission justifications
| Permission | Justification |
|---|---|
| declarativeNetRequest | Blocks requests to ad, tracker and malware domains using bundled static rules and user-defined dynamic rules (allowlist, custom blocks). |
| webRequest | Read-only listener on `onErrorOccurred` to count requests cancelled by blocking, for the badge and statistics. No request data is read or stored. |
| storage | Saves user settings, allowlist, custom filters and counters locally. |
| scripting | Injects the element-picker only when the user starts it from the popup or context menu. |
| contextMenus | "Block an element on this page" and "Pause/resume on this site" menu items. |
| Host permissions (all URLs) | Needed to hide ad elements (content script) and apply per-site allowlisting on every website the user visits. Page content is never transmitted. |

## Remote code
No – all JavaScript is packaged in the extension.

## Data usage disclosures (Developer Dashboard → Privacy tab)
Collects: **none of the listed categories**. Certify: not sold to third parties; not used for
unrelated purposes; not used for creditworthiness or lending.

## Privacy policy URL
Host `legal/PRIVACY_POLICY.md` (for example via GitHub Pages or a raw GitHub link) and paste the
public URL.

## Images (already generated in `assets/`)
- Icon 128×128: `assets/icons/icon-128.png`
- Small promo tile 440×280: `assets/store/promo-small-440x280.png`
- Marquee promo 1400×560: `assets/store/promo-marquee-1400x560.png`
- Screenshots (1280×800): take your own with the popup and options page open.

## Category
Productivity (or Privacy & Security, where offered)
