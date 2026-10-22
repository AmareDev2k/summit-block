#!/usr/bin/env python3
"""
Replace the placeholder contact details across README + legal documents in one go.

    python3 scripts/personalize.py --email you@domain.com --github yourname \
        --author "Your Name" --jurisdiction "Sri Lanka"
"""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULTS = {
    "email": "your-email@example.com",
    "github": "YOUR-GITHUB-USERNAME",
    "author": "Aravinda",
    "jurisdiction": "Sri Lanka",
}
SKIP_DIRS = {".git", "dist", "node_modules", "assets"}
EXTS = {".md", ".json", ".html", ".txt", ".yml", ".yaml"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    for k in DEFAULTS:
        ap.add_argument(f"--{k}")
    args = vars(ap.parse_args())
    changes = {DEFAULTS[k]: v for k, v in args.items() if v}
    if not changes:
        ap.print_help()
        return
    touched = 0
    for p in ROOT.rglob("*"):
        if not p.is_file() or p.suffix not in EXTS or SKIP_DIRS & set(p.relative_to(ROOT).parts):
            continue
        text = p.read_text(encoding="utf-8")
        new = text
        for old, rep in changes.items():
            new = new.replace(old, rep)
        if new != text:
            p.write_text(new, encoding="utf-8")
            touched += 1
    print(f"Updated {touched} file(s). Re-run this script's defaults only after editing DEFAULTS.")


if __name__ == "__main__":
    main()
