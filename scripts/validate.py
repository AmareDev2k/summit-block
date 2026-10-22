#!/usr/bin/env python3
"""Sanity-check the extension before packaging: manifest paths, rulesets, cosmetic data, legal files."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []
VALID_TYPES = {
    "main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object",
    "xmlhttprequest", "ping", "csp_report", "media", "websocket", "webtransport", "webbundle", "other",
}
DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$")
LEGAL = ["LICENSE", "legal/PRIVACY_POLICY.md", "legal/TERMS_OF_SERVICE.md", "legal/DISCLAIMER.md",
         "legal/THIRD_PARTY_NOTICES.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "CONTRIBUTING.md", "README.md"]


def need(rel):
    if not (ROOT / rel).is_file():
        errors.append(f"missing file: {rel}")


def load_json(rel):
    try:
        return json.loads((ROOT / rel).read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        errors.append(f"invalid JSON in {rel}: {e}")
        return None


manifest = load_json("manifest.json") or {}
if manifest.get("manifest_version") != 3:
    errors.append("manifest_version must be 3")
if not re.fullmatch(r"\d+(\.\d+){0,3}", str(manifest.get("version", ""))):
    errors.append("manifest version must look like 1.2.3")

paths = list(manifest.get("icons", {}).values())
paths += list(manifest.get("action", {}).get("default_icon", {}).values())
paths += [manifest.get("action", {}).get("default_popup"), manifest.get("options_ui", {}).get("page"),
          manifest.get("background", {}).get("service_worker")]
for cs in manifest.get("content_scripts", []):
    paths += cs.get("js", [])
for rr in manifest.get("declarative_net_request", {}).get("rule_resources", []):
    paths.append(rr["path"])
for p in filter(None, paths):
    need(p)
for p in ["assets/icons/icon-off-16.png", "assets/icons/icon-off-32.png",
          "assets/icons/icon-off-48.png", "assets/icons/icon-off-128.png", "src/data/cosmetic-filters.json"]:
    need(p)

total = 0
for rr in manifest.get("declarative_net_request", {}).get("rule_resources", []):
    rules = load_json(rr["path"])
    if not isinstance(rules, list):
        errors.append(f"{rr['path']} must be a JSON array")
        continue
    ids = [r.get("id") for r in rules]
    if len(ids) != len(set(ids)):
        errors.append(f"{rr['path']}: duplicate rule ids")
    for r in rules:
        c = r.get("condition", {})
        if not isinstance(r.get("id"), int) or r["id"] < 1:
            errors.append(f"{rr['path']}: bad id {r.get('id')}")
        if not ("urlFilter" in c or "requestDomains" in c or "regexFilter" in c):
            errors.append(f"{rr['path']} rule {r.get('id')}: needs a URL/domain condition")
        if "main_frame" in c.get("resourceTypes", []):
            errors.append(f"{rr['path']} rule {r.get('id')}: must not block main_frame")
        for t in c.get("resourceTypes", []):
            if t not in VALID_TYPES:
                errors.append(f"{rr['path']} rule {r.get('id')}: bad resource type {t}")
        for d in c.get("requestDomains", []):
            if not DOMAIN_RE.match(d):
                errors.append(f"{rr['path']} rule {r.get('id')}: bad domain {d}")
        total += 1
    print(f"  {rr['id']:<9} {len(rules):>4} rules")
if total > 30000:
    errors.append("more than 30,000 static rules – Chrome only guarantees 30,000")

cos = load_json("src/data/cosmetic-filters.json") or {}
for key in ("generic", "annoyances"):
    if not all(isinstance(s, str) for s in cos.get(key, [])):
        errors.append(f"cosmetic-filters.json: '{key}' must be a list of strings")
for site, lst in cos.get("sites", {}).items():
    if not DOMAIN_RE.match(site) or not all(isinstance(s, str) for s in lst):
        errors.append(f"cosmetic-filters.json: bad site entry '{site}'")

for rel in LEGAL:
    need(rel)

if errors:
    print("\nValidation FAILED:")
    for e in errors:
        print("  ✗", e)
    sys.exit(1)
print("\nValidation passed ✔")
