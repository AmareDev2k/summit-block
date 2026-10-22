#!/usr/bin/env python3
"""
Compile filters/*.txt into declarativeNetRequest static rulesets (src/rules/<name>.json).

Supported syntax (a safe subset of Adblock Plus):
    ||example.com^               domain + subdomains
    ||example.com^$third-party   only when loaded by another site
    ||example.com/path/          URL prefix
    example.com                  bare domain
    ! comment  /  # comment      ignored
Cosmetic rules (##) and unsupported options are skipped with a warning.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILTERS = ROOT / "filters"
OUT = ROOT / "src" / "rules"

RESOURCE_TYPES = [
    "sub_frame", "stylesheet", "script", "image", "font",
    "object", "xmlhttprequest", "ping", "media", "websocket", "other",
]
CHUNK = 100  # domains per rule
DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$")


def parse_line(line):
    """Return (kind, value, third_party) or None. kind is 'domain' or 'url'."""
    line = line.strip()
    if not line or line[0] in "!#[":
        return None
    if "##" in line or "#@#" in line or "#?#" in line:
        return None  # cosmetic rule

    body, _, opts = line.partition("$")
    options = {o.strip() for o in opts.split(",") if o.strip()}
    unsupported = options - {"third-party", "3p"}
    if unsupported:
        raise ValueError(f"unsupported option(s) {sorted(unsupported)}")
    third_party = bool(options)

    body = body.strip()
    if body.startswith("||"):
        body = body[2:].rstrip("^|")
        if any(c in body for c in "/*?"):
            return ("url", "||" + body, third_party)
    body = body.lower()
    if DOMAIN_RE.match(body):
        return ("domain", body, third_party)
    raise ValueError("not a valid domain or URL rule")


def compile_rules(lines, source="<memory>", warn=lambda m: None):
    domains = {False: set(), True: set()}
    urls = {}
    for n, raw in enumerate(lines, 1):
        try:
            parsed = parse_line(raw)
        except ValueError as e:
            warn(f"{source}:{n}: skipped ({e}): {raw.strip()}")
            continue
        if parsed is None:
            continue
        kind, value, third = parsed
        if kind == "domain":
            domains[third].add(value)
        else:
            urls[value] = third

    rules, rid = [], 1
    for third in (False, True):
        items = sorted(domains[third])
        for i in range(0, len(items), CHUNK):
            cond = {"requestDomains": items[i:i + CHUNK], "resourceTypes": RESOURCE_TYPES}
            if third:
                cond["domainType"] = "thirdParty"
            rules.append({"id": rid, "priority": 1, "action": {"type": "block"}, "condition": cond})
            rid += 1
    for value in sorted(urls):
        cond = {"urlFilter": value, "resourceTypes": RESOURCE_TYPES}
        if urls[value]:
            cond["domainType"] = "thirdParty"
        rules.append({"id": rid, "priority": 1, "action": {"type": "block"}, "condition": cond})
        rid += 1
    return rules


def write_rules(path, rules):
    body = ",\n".join(json.dumps(r, separators=(",", ":")) for r in rules)
    path.write_text("[\n" + body + "\n]\n", encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    problems = []
    for src in sorted(FILTERS.glob("*.txt")):
        rules = compile_rules(src.read_text(encoding="utf-8").splitlines(), src.name, problems.append)
        write_rules(OUT / f"{src.stem}.json", rules)
        total = sum(len(r["condition"].get("requestDomains", [0])) for r in rules)
        print(f"  {src.name:<14} -> src/rules/{src.stem}.json  ({total} entries in {len(rules)} rules)")
    for p in problems:
        print("  warning:", p, file=sys.stderr)


if __name__ == "__main__":
    main()
