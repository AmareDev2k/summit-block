# Changelog

All notable changes are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/),
versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] – 2026-10-22

### Added
- Support links for GitHub, Patreon and Buy Me a Coffee in the popup and settings page.
- System-aware dark mode with a manual light/dark toggle.
- Persisted theme preference in local extension storage.
- Accessible settings tab state with `aria-current` and hidden inactive panels.

### Changed
- Refined popup and settings page styling with a cleaner neutral interface.
- Improved mobile layout, focus states and control feedback.

## [1.0.0] – 2026-10-22

### Added
- Network blocking via Manifest V3 `declarativeNetRequest` with three static rulesets: ads,
  trackers, malware & crypto-miners.
- Cosmetic filtering: generic, per-site and user-defined CSS selectors.
- Optional "hide annoyances" list (cookie banners, newsletter pop-ups).
- Experimental YouTube ad skipper (off by default).
- Popup with on/off switch, per-site pause, live block counter and lifetime statistics.
- Options page: filter lists, allowlist, custom blocked domains, custom selectors, backup/restore.
- Element picker (toolbar button and right-click menu).
- Build tooling: filter compiler, validator, packager, icon generator, unit tests.
- Full legal pack: MIT licence, Privacy Policy, Terms of Service, Disclaimer, Third-Party Notices,
  Security Policy, Code of Conduct.
