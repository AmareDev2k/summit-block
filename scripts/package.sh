#!/usr/bin/env bash
# Builds a lean, store-ready zip (runtime files only) in dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
echo "▶ Building rules…";      python3 scripts/build-rules.py
echo "▶ Validating…";          python3 scripts/validate.py

mkdir -p dist
OUT="dist/summit-block-v${VERSION}.zip"
rm -f "$OUT"
zip -r -q "$OUT" manifest.json LICENSE README.md src assets/icons legal -x "*.DS_Store"
echo "✅ Created $OUT ($(du -h "$OUT" | cut -f1))"
echo "   Upload this file to the Chrome Web Store developer dashboard."
