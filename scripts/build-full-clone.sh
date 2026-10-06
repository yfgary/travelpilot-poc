#!/usr/bin/env bash
set -euo pipefail

rm -rf /tmp/poc-overlay /tmp/poc-standard-pages /tmp/production-main
mkdir -p /tmp/poc-overlay /tmp/poc-standard-pages
cp itinerary.html trip-info.html attractions.html live.html /tmp/poc-standard-pages/

for p in   assets/core.js   assets/modes.js   assets/render-itinerary.js   assets/render-trip-info.js   assets/render-attractions.js   assets/render-live.js   assets/app.css   assets/cutover-router-v1.js   schemas   docs   package.json   README.md   scripts/migrate-production.mjs   scripts/qa_migration.py   scripts/round5-parity.mjs   scripts/round5_readiness.py   scripts/smoke.mjs   scripts/qa_full_clone.py   scripts/full-clone-smoke.mjs   scripts/build-full-clone.sh   .github/workflows/qa.yml   .github/workflows/migrate-production.yml   .github/workflows/full-production-clone.yml   trips/shirakawago-shinhotaka-2027

do
  if [ -e "$p" ]; then
    cp -a --parents "$p" /tmp/poc-overlay/
  fi
done

cp -a production-source /tmp/production-main
rm -rf production-source
PROD_SHA="$(git -C /tmp/production-main rev-parse HEAD)"

rsync -a --delete --exclude='.git/' /tmp/production-main/ ./

mkdir -p assets schemas docs scripts .github/workflows trips
cp /tmp/poc-overlay/assets/core.js assets/standard-core-v1.js
cp /tmp/poc-overlay/assets/modes.js assets/standard-modes-v1.js
cp /tmp/poc-overlay/assets/render-itinerary.js assets/standard-render-itinerary-v1.js
cp /tmp/poc-overlay/assets/render-trip-info.js assets/standard-render-trip-info-v1.js
cp /tmp/poc-overlay/assets/render-attractions.js assets/standard-render-attractions-v1.js
cp /tmp/poc-overlay/assets/render-live.js assets/standard-render-live-v1.js
cp /tmp/poc-overlay/assets/app.css assets/standard-app-v1.css
cp /tmp/poc-overlay/assets/cutover-router-v1.js assets/cutover-router-v1.js

cp -a /tmp/poc-overlay/schemas/. schemas/
cp -a /tmp/poc-overlay/docs/. docs/
cp /tmp/poc-overlay/package.json package.json
cp /tmp/poc-overlay/README.md README.md

for p in   scripts/migrate-production.mjs   scripts/qa_migration.py   scripts/round5-parity.mjs   scripts/round5_readiness.py   scripts/smoke.mjs   scripts/qa_full_clone.py   scripts/full-clone-smoke.mjs   scripts/build-full-clone.sh

do
  cp "/tmp/poc-overlay/$p" "$p"
done

cp /tmp/poc-overlay/.github/workflows/qa.yml .github/workflows/qa.yml
cp /tmp/poc-overlay/.github/workflows/migrate-production.yml .github/workflows/migrate-production.yml
cp /tmp/poc-overlay/.github/workflows/full-production-clone.yml .github/workflows/full-production-clone.yml

rm -rf trips/shirakawago-shinhotaka-2027
cp -a /tmp/poc-overlay/trips/shirakawago-shinhotaka-2027 trips/

python - <<'PY'
from pathlib import Path

pages={
    "itinerary.html":"行程",
    "trip-info.html":"旅程資料",
    "attractions.html":"景點",
    "live.html":"Live Cam",
}
Path("legacy").mkdir(exist_ok=True)
Path("standard").mkdir(exist_ok=True)

def add_base_and_canonical(text, kind):
    canonical=(
        '<base href="../">\n'
        '<script>(function(){'
        f"var p=location.pathname.replace(/\\/{kind}\\/([^/]+)$/,'/$1');"
        "history.replaceState(null,'',p+location.search+location.hash);"
        '})();</script>\n'
    )
    return text.replace("<head>", "<head>\n"+canonical, 1)

replacements={
    "assets/app.css":"assets/standard-app-v1.css",
    "assets/core.js":"assets/standard-core-v1.js",
    "assets/modes.js":"assets/standard-modes-v1.js",
    "assets/render-itinerary.js":"assets/standard-render-itinerary-v1.js",
    "assets/render-trip-info.js":"assets/standard-render-trip-info-v1.js",
    "assets/render-attractions.js":"assets/standard-render-attractions-v1.js",
    "assets/render-live.js":"assets/standard-render-live-v1.js",
}

for page,label in pages.items():
    legacy=Path("/tmp/production-main",page).read_text(encoding="utf-8")
    Path("legacy",page).write_text(add_base_and_canonical(legacy,"legacy"),encoding="utf-8")

    standard=Path("/tmp/poc-standard-pages",page).read_text(encoding="utf-8")
    for old,new in replacements.items():
        standard=standard.replace(old,new)
    Path("standard",page).write_text(add_base_and_canonical(standard,"standard"),encoding="utf-8")

    root=f'''<!doctype html>
<html lang="zh-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{label}｜TravelPilot POC</title>
</head>
<body>
<main style="font-family:Arial,'Microsoft JhengHei',sans-serif;padding:24px">載入 TravelPilot POC…</main>
<noscript>TravelPilot 需要 JavaScript。</noscript>
<script src="assets/cutover-router-v1.js"></script>
</body>
</html>
'''
    Path(page).write_text(root,encoding="utf-8")
PY

python - "$PROD_SHA" <<'PY'
import json,sys
from pathlib import Path
marker={
    "mode":"full-production-clone-with-standard-overlay",
    "productionRepo":"yfgary/travelpilot",
    "productionBranch":"main",
    "productionMainSha":sys.argv[1],
    "standardGoldenReference":"shirakawago-shinhotaka-2027",
    "note":"Production files are cloned into POC. Standard changes are tested here only."
}
Path(".poc-full-production-clone.json").write_text(
    json.dumps(marker,ensure_ascii=False,indent=2)+"\n",
    encoding="utf-8"
)
PY
