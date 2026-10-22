#!/usr/bin/env python3
"""
Fetch the latest filter lists directly from the official uBlock Origin uAssets repository
and compile them into Summit Block's declarativeNetRequest rulesets.
"""

import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILTERS_DIR = ROOT / "filters"
DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$")

UASSETS_BASE = "https://ublockorigin.github.io/uAssets/filters"

SOURCES = {
    "malware": f"{UASSETS_BASE}/badware.min.txt",
    "quick_fixes": f"{UASSETS_BASE}/quick-fixes.min.txt",
}


def fetch_url(url):
    print(f"  Fetching {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=15) as res:
        return res.read().decode("utf-8")


def extract_domains(text):
    domains = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line[0] in "!#[":
            continue
        if "##" in line or "#@#" in line or "#?#" in line:
            continue
        body, _, _ = line.partition("$")
        body = body.strip()
        if body.startswith("||"):
            body = body[2:].rstrip("^|")
        if "/" in body or "*" in body or "?" in body:
            continue
        body = body.lower()
        if DOMAIN_RE.match(body):
            domains.add(body)
    return domains


def update_malware():
    try:
        raw = fetch_url(SOURCES["malware"])
        new_domains = extract_domains(raw)
        malware_file = FILTERS_DIR / "malware.txt"
        existing_lines = malware_file.read_text(encoding="utf-8").splitlines() if malware_file.exists() else []

        domains = set(new_domains)
        for line in existing_lines:
            line = line.strip()
            if line.startswith("||"):
                d = line[2:].rstrip("^|")
                if DOMAIN_RE.match(d):
                    domains.add(d)

        header = [
            "! Summit Block – malware.txt",
            "! Malicious domains, badware distribution hosts, infostealers and in-browser crypto-miners.",
            "! Curated from Summit Block and uBlock Origin badware assets.",
            ""
        ]
        malware_file.write_text("\n".join(header + [f"||{d}^" for d in sorted(domains)]) + "\n", encoding="utf-8")
        print(f"  ✔ Updated filters/malware.txt with {len(domains)} domains.")
    except Exception as e:
        print(f"  ✗ Failed to update malware: {e}", file=sys.stderr)


def main():
    print("Updating Summit Block filter rules from uAssets...")
    update_malware()
    import subprocess
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build-rules.py")], check=True)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "validate.py")], check=True)
    print("Done! Filter update complete.")


if __name__ == "__main__":
    main()
