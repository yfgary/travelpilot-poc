#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASELINE=Path(os.environ.get("PRODUCTION_BASELINE","production-baseline"))
TRIP_ID="shirakawago-shinhotaka-2027"
ERRORS=[]

def err(msg): ERRORS.append(msg)
def load(path):
    try: return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"Cannot load {path}: {exc}")
        return {}

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda:fh.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

marker=load(ROOT/".poc-full-production-clone.json")
if not marker.get("productionMainSha"):
    err("POC full-clone marker missing productionMainSha")

# Every production-main file must exist in POC. Only explicit Standard/POC surfaces may differ.
allowed_exact_overrides={
    "README.md",
    ".github/workflows/qa.yml",
    ".github/workflows/migrate-production.yml",
    ".github/workflows/full-production-clone.yml",
    "itinerary.html","trip-info.html","attractions.html","live.html",
}
allowed_prefixes=(
    "trips/shirakawago-shinhotaka-2027/",
    "standard/","legacy/","schemas/","docs/",
)
allowed_new_prefixes=(
    "standard/","legacy/","schemas/","docs/",
)
allowed_new_exact={
    ".poc-full-production-clone.json",
    "assets/cutover-router-v1.js",
    "assets/standard-core-v1.js",
    "assets/standard-modes-v1.js",
    "assets/standard-render-itinerary-v1.js",
    "assets/standard-render-trip-info-v1.js",
    "assets/standard-render-attractions-v1.js",
    "assets/standard-render-live-v1.js",
    "assets/standard-app-v1.css",
    "package.json",
    "scripts/migrate-production.mjs",
    "scripts/qa_migration.py",
    "scripts/round5-parity.mjs",
    "scripts/round5_readiness.py",
    "scripts/smoke.mjs",
    "scripts/qa_full_clone.py",
    "scripts/full-clone-smoke.mjs",
}

if BASELINE.is_dir():
    for src in BASELINE.rglob("*"):
        if not src.is_file() or ".git" in src.parts:
            continue
        rel=src.relative_to(BASELINE).as_posix()
        dst=ROOT/rel
        if not dst.is_file():
            err(f"Production file missing from POC: {rel}")
            continue
        allowed=rel in allowed_exact_overrides or any(rel.startswith(p) for p in allowed_prefixes)
        if not allowed and sha(src)!=sha(dst):
            err(f"Unexpected drift from production main: {rel}")

# Core production assets/images and non-Japan trips must be byte-identical.
for rel in ("assets/images","trips/bangkok-2026","trips/hokkaido-2025","trips/multi-trip-demo-okinawa"):
    base=BASELINE/rel
    dest=ROOT/rel
    if BASELINE.is_dir() and base.is_dir():
        base_files={p.relative_to(base).as_posix():sha(p) for p in base.rglob("*") if p.is_file()}
        dest_files={p.relative_to(dest).as_posix():sha(p) for p in dest.rglob("*") if p.is_file()}
        if base_files!=dest_files:
            err(f"Production clone mismatch under {rel}")

registry=load(ROOT/"trips/registry.json")
real_ids={x.get("id") for x in registry.get("trips",[])}
for required in (TRIP_ID,"bangkok-2026","hokkaido-2025","multi-trip-demo-okinawa"):
    if required not in real_ids: err(f"Registry missing production trip {required}")

trip_dir=ROOT/"trips"/TRIP_ID
trip=load(trip_dir/"trip.json")
itinerary=load(trip_dir/"itinerary.json")
info=load(trip_dir/"trip-info.json")
attractions=load(trip_dir/"attractions.json")
hotels=load(trip_dir/"hotels.json")
live=load(trip_dir/"live-cams.json")
weather=load(trip_dir/"weather.json")
departure=load(trip_dir/"departure-checklist.json")

if trip.get("schemaVersion")!=12: err("Japan Standard trip is not schema v12")
if trip.get("modules") not in ([],None): err("Japan Standard modules must be empty")
if "legacy" in trip: err("Japan Standard manifest still has legacy block")
for name,row in (trip.get("renderers") or {}).items():
    if row.get("mode")!="generate": err(f"Japan renderer {name} is not generate")

for page in ("itinerary.html","trip-info.html","attractions.html","live.html"):
    root=(ROOT/page).read_text(encoding="utf-8")
    scripts=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',root,re.I)
    if scripts!=["assets/cutover-router-v1.js"]:
        err(f"{page} is not router-only: {scripts}")
    if not (ROOT/"legacy"/page).is_file(): err(f"Missing legacy clone: legacy/{page}")
    if not (ROOT/"standard"/page).is_file(): err(f"Missing Standard page: standard/{page}")

router=(ROOT/"assets"/"cutover-router-v1.js").read_text(encoding="utf-8")
for token in (TRIP_ID,"白川鄉","新穗高","bangkok-2026","hokkaido-2025"):
    if token in router: err(f"Router contains trip-specific token: {token}")

standard_assets=[
    "assets/standard-core-v1.js","assets/standard-modes-v1.js",
    "assets/standard-render-itinerary-v1.js","assets/standard-render-trip-info-v1.js",
    "assets/standard-render-attractions-v1.js","assets/standard-render-live-v1.js",
]
for rel in standard_assets:
    text=(ROOT/rel).read_text(encoding="utf-8")
    for token in (TRIP_ID,"japan2027","japanWinter2027","白川鄉","新穗高","weather-day-selector"):
        if token in text: err(f"{rel} contains destination token {token!r}")

days=itinerary.get("days") or []
if [d.get("id") for d in days] != [f"d{i}" for i in range(1,10)]:
    err("Japan itinerary is not D1-D9")
counts={
    "days":len(days),
    "timeline":sum(len(d.get("items",[])) for d in days),
    "attractions":len(attractions.get("attractions") or []),
    "hotels":len(hotels.get("hotels") or []),
    "checklist":sum(len(g.get("items") or []) for g in departure.get("groups") or []),
    "liveDays":len(live.get("days") or []),
    "liveCameras":len(live.get("cameras") or []),
}
if counts["timeline"]<100: err("Japan timeline shrank below 100")
if counts["attractions"]!=42: err("Japan attractions != 42")
if counts["hotels"]!=7: err("Japan hotels != 7")
if counts["checklist"]!=96: err("Japan checklist != 96")
if counts["liveDays"]!=9 or counts["liveCameras"]!=37: err("Japan Live Cam parity changed")

fixed={"d6":"shinhotaka","d7":"shirakawago","d8":"takayama"}
by={d.get("id"):d for d in days}
for did,region in fixed.items():
    if by.get(did,{}).get("weatherRegion")!=region: err(f"{did} itinerary region != {region}")
    if (weather.get("dayRegions") or {}).get(did)!=region: err(f"{did} weather region != {region}")

all_text="\n".join(json.dumps(x,ensure_ascii=False) for x in (trip,itinerary,info,attractions,live,weather))
for token in ("weather-day-selector","shinhotakaPlanner","dynamicRegionRules","flexibleRules","japanWinter2027_shinhotakaDay"):
    if token in all_text: err(f"Retired selector token remains: {token}")

print("TravelPilot POC full-production-clone QA")
print(json.dumps(counts,ensure_ascii=False,indent=2))
print("Errors:",len(ERRORS))
for item in ERRORS: print("ERROR:",item)
if ERRORS: sys.exit(1)
print("PASS")
