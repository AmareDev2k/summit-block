# Writing filters

## Network filters (`filters/*.txt`)

| Syntax | Meaning |
|---|---|
| `||example.com^` | block `example.com` and every subdomain |
| `||example.com^$third-party` | …only when requested by a different site |
| `||example.com/ads/` | block URLs starting with that path (wildcards `*` allowed) |
| `example.com` | bare domain, same as the first form |
| `! text` or `# text` | comment |

Unsupported lines (cosmetic `##` rules, options other than `third-party`) are skipped; the build
script prints a warning for lines it cannot understand.

After editing: `python3 scripts/build-rules.py && python3 scripts/validate.py`, then reload the
extension.

### Rules of thumb
- Prefer **domains** over URL patterns – they are cheap and fast.
- Never block domains websites need to function (CDNs, login/payment providers, tag managers).
- `main_frame` is never blocked by design, so a mistake can't make a website unreachable.
- Chrome guarantees 30,000 static rules per extension; the validator warns beyond that.

## Cosmetic filters (`src/data/cosmetic-filters.json`)

```json
{
  "generic": [".adsbygoogle", "[id^='div-gpt-ad']"],
  "sites": { "example.com": ["#top-banner", ".promo-strip"] },
  "annoyances": [".cookie-banner"]
}
```

- `generic` – hidden everywhere (keep these very specific to avoid hiding real content).
- `sites` – hidden only on that domain and its subdomains.
- `annoyances` – hidden only when the user enables "Hide annoyances".
- Every selector is validated in the page; an invalid one only disables its own chunk of 40.

## User filters

End users can create filters without touching files: **popup → Block an element**, or
**Options → My filters**.
