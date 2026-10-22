# Contributing to Summit Block

Thanks for helping! Here's how to get started in five minutes.

## Setup

```bash
git clone https://github.com/AmareDev2k/summit-block.git
cd summit-block
# Load the folder in Chrome: chrome://extensions → Developer mode → Load unpacked
```

Tools used by scripts: Python 3.9+, Node 18+, and (only for icons) `pip install pillow`.

## Everyday commands

| Command | What it does |
|---|---|
| `python3 scripts/build-rules.py` | Compile `filters/*.txt` → `src/rules/*.json` |
| `python3 scripts/validate.py` | Check manifest paths, rules, legal files |
| `npm test` | Node + Python unit tests |
| `bash scripts/package.sh` | Build the store-ready zip in `dist/` |
| `python3 scripts/generate-icons.py` | Regenerate icons from `assets/source/` |

After editing a filter list always rebuild the rules and reload the extension on
`chrome://extensions`.

## Adding or fixing filters

1. Edit the right file in `filters/` (`ads`, `trackers`, `malware`) or `src/data/cosmetic-filters.json`.
2. Keep entries **conservative** – never list domains that sites need to function (CDNs, tag
   managers, login providers).
3. Run the build + validate commands, test on at least two sites, and describe how you verified
   the change in your pull request.

## Pull request checklist

- [ ] `npm test` and `python3 scripts/validate.py` pass
- [ ] No new permissions (or a clear justification and a Privacy Policy update)
- [ ] No remote code, no `eval`, no `innerHTML` with dynamic data, no analytics
- [ ] UI changes are keyboard-accessible and readable in dark mode
- [ ] `CHANGELOG.md` updated

## Privacy rule

Contributions must not add telemetry, remote logging, fingerprinting or any network request that
sends user data anywhere. PRs that do will be declined.

## Licence

By contributing you agree that your work is released under the MIT License.
