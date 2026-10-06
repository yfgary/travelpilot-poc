#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, os, re, sys
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT=Path(__file__).resolve().parents[1]
BASELINE=Path(os.environ.get("PRODUCTION_BASELINE","production-baseline"))
ERRORS=[]
TRIPS={
  "shirakawago-shinhotaka-2027":{"days":9,"attractions":42,"hotels":7,"checklist":96,"liveDays":9,"liveCameras":37,"mediaDays":9},
  "bangkok-2026":{"days":8,"attractions":28,"hotels":1,"checklist":9,"liveDays":0,"liveCameras":0,"mediaDays":8},
  "hokkaido-2025":{"days":8,"attractions":26,"hotels":4,"checklist":15,"liveDays":8,"liveCameras":11,"mediaDays":8},
  "multi-trip-demo-okinawa":{"days":3,"attractions":6,"hotels":1,"checklist":12,"liveDays":0,"liveCameras":0,"mediaDays":0},
}

def err(msg): ERRORS.append(msg)
def load(p):
  try:return json.loads(p.read_text(encoding="utf-8"))
  except Exception as exc: err(f"Cannot load {p.relative_to(ROOT)}: {exc}"); return {}
def sha(p):
  h=hashlib.sha256()
  with p.open("rb") as fh:
    for chunk in iter(lambda:fh.read(1024*1024),b""):h.update(chunk)
  return h.hexdigest()

# POC remains a full production clone for immutable assets/images.
if BASELINE.is_dir():
  for rel in ("assets/images","assets/travelpilot-home.css","manifest.webmanifest"):
    a=BASELINE/rel;b=ROOT/rel
    if a.is_dir():
      aa={p.relative_to(a).as_posix():sha(p) for p in a.rglob("*") if p.is_file()}
      bb={p.relative_to(b).as_posix():sha(p) for p in b.rglob("*") if p.is_file()}
      if aa!=bb:err(f"Production clone drift under {rel}")
    elif a.is_file() and (not b.is_file() or sha(a)!=sha(b)):
      err(f"Production clone drift: {rel}")

registry=load(ROOT/"trips/registry.json")
ids=[x.get("id") for x in registry.get("trips",[])]
for tid in TRIPS:
  if tid not in ids:err(f"Registry missing {tid}")

schemas={
 "trip.json":"schemas/trip-v12.schema.json",
 "itinerary.json":"schemas/itinerary-v3.schema.json",
 "trip-info.json":"schemas/trip-info-v2.schema.json",
 "attractions.json":"schemas/attractions-v3.schema.json",
 "live-cams.json":"schemas/live-cams-v3.schema.json",
 "weather.json":"schemas/weather-v4.schema.json",
}

for tid,expected in TRIPS.items():
  td=ROOT/"trips"/tid
  data={}
  for name,spath in schemas.items():
    obj=load(td/name);data[name]=obj
    schema=load(ROOT/spath)
    for e in Draft202012Validator(schema).iter_errors(obj):
      loc=".".join(str(x) for x in e.absolute_path) or "<root>"
      err(f"{tid}/{name} schema {loc}: {e.message}")
  trip=data["trip.json"];it=data["itinerary.json"];info=data["trip-info.json"];atts=data["attractions.json"];live=data["live-cams.json"];weather=data["weather.json"];hotels=load(td/"hotels.json");dep=load(td/"departure-checklist.json")
  if trip.get("schemaVersion")!=12 or "legacy" in trip or trip.get("modules") not in ([],None):err(f"{tid}: manifest not pure Standard v12")
  for name,row in (trip.get("renderers") or {}).items():
    if row.get("mode")!="generate":err(f"{tid}: {name} renderer not generate")
  if (trip.get("assets") or {}).get("dayGalleryCss"):err(f"{tid}: legacy dayGalleryCss still configured")
  if (trip.get("dataFiles") or {}).get("departureChecklist")!="departure-checklist.json":err(f"{tid}: departure checklist not split into Standard data file")
  days=it.get("days") or []
  if len(days)!=expected["days"]:err(f"{tid}: days {len(days)} != {expected['days']}")
  if any("imagePlan" in d for d in days):err(f"{tid}: legacy imagePlan remains")
  if sum(1 for d in days if d.get("media"))!=expected["mediaDays"]:err(f"{tid}: media-day parity changed")
  if len(atts.get("attractions") or [])!=expected["attractions"]:err(f"{tid}: attraction count changed")
  if len(hotels.get("hotels") or [])!=expected["hotels"]:err(f"{tid}: hotel count changed")
  dep_count=sum(len(g.get("items") or []) for g in dep.get("groups") or [])
  if dep.get("schemaVersion")!=2 or dep_count!=expected["checklist"] or dep.get("expectedCount")!=dep_count:err(f"{tid}: departure checklist parity changed")
  if len(live.get("days") or [])!=expected["liveDays"] or len(live.get("cameras") or [])!=expected["liveCameras"]:err(f"{tid}: Live Cam parity changed")
  if weather.get("schemaVersion")!=4 or "dynamicRegionRules" in weather:err(f"{tid}: weather not canonical v4")
  for d in days:
    if d.get("weatherRegion") and (weather.get("dayRegions") or {}).get(d.get("id"))!=d.get("weatherRegion"):err(f"{tid}/{d.get('id')}: dayRegions mismatch")
  attr_ids={a.get("id") for a in atts.get("attractions") or [] if a.get("id")}
  hotel_ids={h.get("id") for h in hotels.get("hotels") or [] if h.get("id")}
  for d in days:
    if d.get("hotelId") and d["hotelId"] not in hotel_ids:err(f"{tid}/{d.get('id')}: unknown hotelId {d['hotelId']}")
    for item in d.get("items") or []:
      if item.get("attractionId") and item["attractionId"] not in attr_ids:err(f"{tid}/{d.get('id')}: unknown attractionId {item['attractionId']}")
  cam_ids={c.get("id") for c in live.get("cameras") or [] if c.get("id")}
  for d in live.get("days") or []:
    for cid in d.get("cameras") or []:
      if cid not in cam_ids:err(f"{tid}/{d.get('id')}: unknown camera {cid}")

# Public pages are direct generic Standard shells; no cutover/legacy path.
expected_scripts={
 "itinerary.html":["assets/standard-core-v1.js","assets/standard-modes-v1.js","assets/standard-render-itinerary-v1.js"],
 "trip-info.html":["assets/standard-core-v1.js","assets/standard-render-trip-info-v1.js"],
 "attractions.html":["assets/standard-core-v1.js","assets/standard-render-attractions-v1.js"],
 "live.html":["assets/standard-core-v1.js","assets/standard-render-live-v1.js"],
}
for page,want in expected_scripts.items():
  text=(ROOT/page).read_text(encoding="utf-8")
  got=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',text,re.I)
  if got!=want:err(f"{page}: active scripts {got} != {want}")
for retired in ("legacy","standard"):
  if (ROOT/retired).exists():err(f"Retired routing directory still exists: {retired}/")
if (ROOT/"assets/cutover-router-v1.js").exists():err("cutover router still exists")

# Homepage no longer relies on old MultiTrip context/fallback.
index=(ROOT/"index.html").read_text(encoding="utf-8")
if "assets/standard-home-v1.js" not in index:err("Homepage does not load Standard home runtime")
for token in ("multi-trip-context-v1.js","const fallback={id:'shirakawago","shirakawago-shinhotaka-2027"):
  if token in index:err(f"Homepage contains legacy/default-trip token: {token}")

# Shared runtime must be destination-agnostic.
shared=[
 "assets/standard-home-v1.js","assets/standard-core-v1.js","assets/standard-modes-v1.js",
 "assets/standard-render-itinerary-v1.js","assets/standard-render-trip-info-v1.js",
 "assets/standard-render-attractions-v1.js","assets/standard-render-live-v1.js"
]
banned=("shirakawago-shinhotaka-2027","bangkok-2026","hokkaido-2025","multi-trip-demo-okinawa","japan2027","japanWinter2027","白川鄉","新穗高","weather-day-selector","tripv2WeatherSelect")
for rel in shared:
  text=(ROOT/rel).read_text(encoding="utf-8")
  for token in banned:
    if token in text:err(f"{rel}: destination/legacy token {token!r}")

# Service worker owns only Standard runtime, no HTML patching.
sw=(ROOT/"sw.js").read_text(encoding="utf-8")
for required in ("standard-home-v1.js","standard-core-v1.js","standard-render-itinerary-v1.js","standard-render-trip-info-v1.js","standard-render-attractions-v1.js","standard-render-live-v1.js"):
  if required not in sw:err(f"sw.js missing {required}")
for token in ("multi-trip-","trip-v8","trip-v9","site-shell","patchLive","japan2027"):
  if token in sw:err(f"sw.js still contains legacy runtime token {token!r}")

# Active public surfaces must not reference old compatibility assets.
active_text="\n".join((ROOT/p).read_text(encoding="utf-8") for p in ["index.html","itinerary.html","trip-info.html","attractions.html","live.html","sw.js"])
for token in ("multi-trip-itinerary-renderer","multi-trip-trip-info-renderer","multi-trip-attractions-renderer","multi-trip-live-renderer","site-shell-v7","trip-core-v1","d6-d8-weather-decision"):
  if token in active_text:err(f"Active public surface references retired runtime: {token}")

print("Round 7 all-trip Standard architecture QA")
print("Trips:",", ".join(TRIPS))
print("Errors:",len(ERRORS))
for e in ERRORS:print("ERROR:",e)
if ERRORS:sys.exit(1)
print("PASS")
