# Installation

## Chrome / Chromium browsers (developer install)

1. Unzip the project. The folder that contains `manifest.json` is the extension folder.
2. Go to `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extension folder.
5. Click the puzzle-piece icon in the toolbar and **pin** Summit Block.

### Updating after you change code or filters
- Run `python3 scripts/build-rules.py` if you edited anything in `filters/`.
- Click the **reload ↻** button on the extension's card in `chrome://extensions`.

### Verify it works
1. Visit a news site, open the popup and watch the *blocked on this page* number grow.
2. Open DevTools → Network: blocked requests appear in red as `net::ERR_BLOCKED_BY_CLIENT`.
3. Open the popup, flip the site switch off, and the page reloads with blocking paused.

### Troubleshooting
| Problem | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You selected the wrong folder – select the one containing `manifest.json`. |
| Counter stays at 0 | Reload the tab after installing; counters start from page load. |
| A rule file error on load | Run `python3 scripts/validate.py` to see exactly what is wrong. |
| Site is broken | Pause blocking on it from the popup and file a filter request. |

## Chrome Web Store build
```bash
bash scripts/package.sh      # → dist/summit-block-v1.0.0.zip
```
Upload that zip in the Chrome Web Store developer dashboard. See `docs/STORE_LISTING.md`.
