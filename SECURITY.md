# Security Policy

## Supported versions

Only the latest released version receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Email **your-email@example.com** with:

- a description of the issue and its impact,
- steps or a proof-of-concept to reproduce it,
- the extension version and browser version.

You can expect an acknowledgement within **72 hours** and a status update within **7 days**.
We will credit reporters in `CHANGELOG.md` unless you prefer to stay anonymous. Please give us a
reasonable time to release a fix before any public disclosure.

## Scope

In scope: the extension code in this repository, including settings import, the element picker,
message passing between content scripts and the service worker, and the filter compiler.

Out of scope: vulnerabilities in the browser itself, in third-party websites, or attacks that need
an already-compromised machine.

## Security design notes

- Manifest V3, no remote code, no `eval`, no inline scripts, default extension CSP.
- Blocking uses `declarativeNetRequest` – the extension never reads request contents.
- Messages from content scripts are validated; the site for a custom filter is taken from the
  sender's tab, never from message data.
- Imported settings are sanitised (types, hostnames and selector length are re-validated).
- All UI text is inserted with `textContent`, never `innerHTML`.
