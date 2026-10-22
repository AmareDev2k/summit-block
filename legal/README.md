# Legal documents

| Document | Purpose |
|---|---|
| [`../LICENSE`](../LICENSE) | MIT License – how others may use, modify and redistribute the code |
| [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) | What data the extension handles (short answer: none leaves your device) |
| [`TERMS_OF_SERVICE.md`](TERMS_OF_SERVICE.md) | Terms for using the extension |
| [`DISCLAIMER.md`](DISCLAIMER.md) | No-warranty, trademark and content-blocking disclaimers |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | Third-party code, assets and trademarks |
| [`../SECURITY.md`](../SECURITY.md) | How to report vulnerabilities |
| [`../CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Community standards |

## Before you publish

1. Run `python3 scripts/personalize.py --email you@domain.com --github AmareDev2k` to replace the
   placeholder contact details everywhere.
2. Host `PRIVACY_POLICY.md` at a public URL (GitHub Pages works) – the Chrome Web Store requires a
   privacy-policy link.
3. These documents are good-faith templates written for this specific extension. They are **not
   legal advice**. If you distribute commercially, collect any data in future versions, or operate
   in a regulated market, have a qualified lawyer review them.
4. If you ever add analytics, remote filter updates, accounts, sync, or payments, update the
   Privacy Policy **before** shipping that change.
