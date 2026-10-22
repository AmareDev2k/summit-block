# Privacy Policy – Summit Block

**Effective date:** October 22, 2026  **Last updated:** October 22, 2026
**Publisher:** Aravinda ("we", "us", "the developer")
**Contact:** your-email@example.com

## 1. Summary

Summit Block is an ad and tracker blocker that works **entirely on your device**.

- ✅ We do **not** collect, transmit, sell, share or rent any personal data.
- ✅ We do **not** use analytics, telemetry, crash reporting, advertising IDs or cookies.
- ✅ The extension makes **no network requests of its own** and loads no remote code or remote filter lists.
- ✅ Your settings and counters stay in your browser and are deleted when you uninstall the extension.

## 2. Data the extension stores locally

The following is stored in your browser's extension storage (`chrome.storage.local` and
`chrome.storage.session`). It is not synced to Google, not sent to us, and not readable by websites.

| Data | Why it exists | Where |
|---|---|---|
| Your settings (on/off, which lists are enabled, YouTube/annoyance toggles) | To remember your choices | `storage.local` |
| Allowlist – domains **you** add or pause blocking on | To skip blocking on those sites | `storage.local` |
| Custom blocked domains and hidden-element selectors **you** create | To apply your own filters | `storage.local` |
| Lifetime blocked-request counter and "counting since" date | To show statistics in the popup | `storage.local` |
| Per-tab blocked-request counters (numbers only, no URLs) | To show the badge and popup count | `storage.session` (cleared when the browser closes) |

We never store your browsing history, the pages you visit, the URLs that were blocked, or any
content of web pages.

## 3. Why the extension requests its permissions

| Permission | Purpose |
|---|---|
| `declarativeNetRequest` | Lets Chrome itself block requests to ad/tracker domains using rules bundled in the extension. We never see the requests. |
| `webRequest` (observe only) | Used solely to detect that a request was cancelled by blocking, so a **number** can be counted. URLs and headers are not read, logged or stored. |
| `storage` | Saves your settings and counters locally. |
| `scripting` | Starts the element picker on a page **only when you ask** (toolbar button or right-click menu). |
| `contextMenus` | Adds the "Block an element" and "Pause on this site" menu items. |
| Host access (`<all_urls>`) | Required so the cosmetic filter can hide ad containers on any site you visit, and so blocking can be paused per site. Page content is processed locally and never transmitted. |

## 4. Content scripts

A small content script runs on pages to hide ad elements using CSS selectors. It does not read,
copy or transmit form fields, passwords, page text or any personal information. The optional
YouTube feature only clicks the player's "Skip" button and fast-forwards ad playback; it does not
collect any data.

## 5. Data sharing and sales

We do not share personal data with any third party because we do not have any. We do not sell data
and we do not use data for creditworthiness, lending, advertising, or any purpose unrelated to the
extension's single purpose of blocking ads and trackers. We comply with the Chrome Web Store User
Data Policy, including its Limited Use requirements.

## 6. Exporting and importing settings

The "Export settings" button creates a JSON file on your device. We do not receive it. Treat the
file as private – it can contain domain names that you chose to allowlist or block. When importing,
the file is validated and sanitised before use.

## 7. Your rights

Because we hold no personal data about you, there is nothing for us to access, correct, port or
delete. You are in full control: you can view and edit everything in the Options page, reset it with
"Reset everything", or remove all data by uninstalling the extension. To the extent applicable law
(for example the GDPR/UK GDPR, the CCPA/CPRA, or Sri Lanka's Personal Data Protection Act, No. 9 of
2022) grants you rights over personal data, these are respected by design.

## 8. Children

Summit Block does not knowingly collect information from anyone, including children under 13 (or
the minimum age in your country).

## 9. Security

All processing happens locally. The extension bundles all code and rules, ships no remote code,
and uses a Manifest V3 service worker. If you find a vulnerability, please follow `SECURITY.md`.

## 10. Third-party sites

Websites you visit have their own privacy practices. Blocking trackers reduces – but cannot
guarantee the elimination of – tracking by those sites.

## 11. Changes to this policy

If this policy changes we will update the date above, and for material changes describe them in
`CHANGELOG.md` and the store listing. We will never begin collecting personal data without
updating this policy first and, where required, obtaining your consent.

## 12. Contact

Questions about this policy: **your-email@example.com**
Project: https://github.com/AmareDev2k/summit-block
