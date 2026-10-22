# Third-Party Notices

## Bundled code and libraries

Summit Block contains **no third-party runtime code, libraries, frameworks, fonts or trackers**.
All JavaScript, HTML and CSS in `src/` was written for this project and is released under the
MIT License.

## Platform APIs

The Extension is built on browser-provided APIs (Chrome Extensions Manifest V3:
`declarativeNetRequest`, `webRequest`, `storage`, `scripting`, `contextMenus`, `tabs`, `action`).
These are part of the browser and are subject to the browser vendor's terms.

## Filter data

- `filters/*.txt` and `src/data/cosmetic-filters.json` are original, hand-written lists. They list
  publicly known domain names and generic CSS selectors, which are factual technical identifiers.
- **No third-party filter lists** (for example EasyList, EasyPrivacy, uBlock filters or Peter
  Lowe's list) are bundled. The rule compiler understands a subset of the Adblock Plus syntax
  purely for compatibility. If you import lists from another project, you are responsible for
  complying with that list's licence (several are CC BY-SA or GPL) and for crediting its authors.

## Brand assets

The Summit Block logo was supplied by the project author. The toolbar icons, banner and store
images in `assets/` are generated from that logo by `scripts/generate-icons.py` (uses the
[Pillow](https://python-pillow.org/) library under the HPND licence – a development-time tool that
is **not** shipped in the extension package).

## Development tooling (not shipped)

| Tool | Use | Licence |
|---|---|---|
| Python 3 | build / validation scripts | PSF License |
| Pillow | icon generation | HPND |
| Node.js test runner | unit tests | MIT |

## Trademarks

All third-party names are the property of their owners and used only to describe compatibility;
see `DISCLAIMER.md`.
