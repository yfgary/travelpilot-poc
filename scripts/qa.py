#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]

def err(msg): ERRORS.append(msg)
def read(path): return (ROOT/path).read_text(encoding="utf-8")
def load(path):
    try: return json.loads(read(path))
    except Exception as e:
        err(f"Invalid JSON {path}: {e}")
        return {}

registry=load(Path("trips/registry.json"))
trips=registry.get("trips") or []
if len(trips)<2: err("POC must contain at least two trips to prove generic rendering")

shared_files=[
    Path("index.html"),Path("itinerary.html"),Path("trip-info.html"),Path("attractions.html"),Path("live.html"),
    *sorted(Path("assets").glob("*.js"))
]
banned_trip_tokens=[
    "golden-reference-2027","city-demo","shirakawago-shinhotaka-2027",
    "japan2027","japanWinter2027","shinhotakaPlanner","weather-day-selector",
    "tripv2WeatherSelect",".tripv2-choice","hydrate"
]
banned_place_tokens=["白川鄉","白川郷","新穗高","新穂高","松本城","高山古街","輕井澤","平湯神社"]
for path in shared_files:
    text=read(path)
    for token in banned_trip_tokens+banned_place_tokens:
        if token in text:
            err(f"Shared runtime contains trip-specific token {token!r}: {path}")
    if re.search(r"tripId\s*===?\s*['\"]",text):
        err(f"Concrete trip-id branch detected in shared runtime: {path}")

core=read(Path("assets/core.js"))
if "['multiTrip', feature, ctx.tripId, subkey]" not in core:
    err("Shared state key is not visibly trip-scoped")
if "localStorage.setItem(stateKey(ctx, feature, subkey)" not in core:
    err("Shared state writes do not use canonical trip-scoped stateKey")

required_renderers={"itinerary","tripInfo","attractions","liveCam","weather","todayMode","drivingMode"}
trip_ids=set()
for entry in trips:
    tid=entry.get("id")
    if not tid:
        err("Registry entry missing id"); continue
    if tid in trip_ids: err(f"Duplicate trip id: {tid}")
    trip_ids.add(tid)
    config_path=Path(entry.get("config") or f"trips/{tid}/trip.json")
    if not (ROOT/config_path).is_file():
        err(f"{tid}: missing config {config_path}"); continue
    cfg=load(config_path)
    if cfg.get("id")!=tid: err(f"{tid}: config id mismatch")
    if cfg.get("schemaVersion")!=12: err(f"{tid}: trip schemaVersion must be 12 in POC")
    if cfg.get("modules") not in ([],None): err(f"{tid}: standard trip modules must be empty")
    if "legacy" in cfg: err(f"{tid}: legacy block is not allowed in POC")
    renderers=cfg.get("renderers") or {}
    for name in required_renderers:
        mode=(renderers.get(name) or {}).get("mode")
        if mode!="generate": err(f"{tid}: renderer {name} must be generate, got {mode!r}")
    trip_dir=config_path.parent
    loaded={}
    for key,rel in (cfg.get("dataFiles") or {}).items():
        p=trip_dir/rel
        if not (ROOT/p).is_file():
            err(f"{tid}: missing dataFiles.{key}: {p}")
            continue
        obj=load(p); loaded[key]=obj
        if isinstance(obj,dict) and obj.get("tripId") not in (None,tid):
            err(f"{tid}: {p.name} tripId mismatch")
    itinerary=loaded.get("itinerary") or {}
    attractions=loaded.get("attractions") or {}
    hotels=loaded.get("hotels") or {}
    weather=loaded.get("weather") or {}
    a_ids={a.get("id") for a in attractions.get("attractions",[]) if a.get("id")}
    h_ids={h.get("id") for h in hotels.get("hotels",[]) if h.get("id")}
    w_regions=set((weather.get("regions") or {}).keys())
    for day in itinerary.get("days",[]):
        if day.get("hotelId") and day["hotelId"] not in h_ids:
            err(f"{tid}:{day.get('id')}: unknown hotelId {day['hotelId']}")
        wr=(weather.get("dayRegions") or {}).get(day.get("id"),day.get("weatherRegion"))
        if wr and w_regions and wr not in w_regions:
            err(f"{tid}:{day.get('id')}: unknown weather region {wr}")
        for item in day.get("items",[]):
            if item.get("attractionId") and item["attractionId"] not in a_ids:
                err(f"{tid}:{day.get('id')}: unknown attractionId {item['attractionId']}")
            if item.get("hotelId") and item["hotelId"] not in h_ids:
                err(f"{tid}:{day.get('id')}: unknown item hotelId {item['hotelId']}")
    live=loaded.get("liveCams")
    if live:
        cams={c.get("id") for c in live.get("cameras",[]) if c.get("id")}
        for day in live.get("days",[]):
            for cid in day.get("cameras",[]):
                if cid not in cams: err(f"{tid}: live day {day.get('id')} references unknown camera {cid}")

# Golden Reference parity fixture: every Standard gap added in Round 3 must be represented.
gold=Path("trips/golden-reference-2027")
g_it=load(gold/"itinerary.json")
g_ai=load(gold/"attractions.json")
g_info=load(gold/"trip-info.json")
g_live=load(gold/"live-cams.json")
g_dep=load(gold/"departure-checklist.json")

days=g_it.get("days",[])
def any_day(field): return any(d.get(field) for d in days)
for field in ("highlights","media","hardCuts","backups","bonus","constraints"):
    if not any_day(field): err(f"Golden Reference does not exercise itinerary field: {field}")
items=[i for d in days for i in d.get("items",[])]
for field in ("description","localName","price","badges","links"):
    if not any(i.get(field) for i in items):
        err(f"Golden Reference does not exercise rich itinerary item field: {field}")

attrs=g_ai.get("attractions",[])
for field in ("scoreReason","summary","history","visit","winter","sources"):
    if not any(a.get(field) for a in attrs):
        err(f"Golden Reference does not exercise rich attraction field: {field}")

custom=g_info.get("customSections",[])
types={s.get("type") for s in custom}
for required in ("cards","list","notice"):
    if required not in types: err(f"Golden Reference customSections missing type {required}")

if not g_live.get("cameras") or not g_live.get("days"):
    err("Golden Reference must use Standard Live Cam cameras[] + days[]")
if "groups" in g_live or "dynamicBindings" in g_live:
    err("Golden Reference Live Cam still contains legacy group/dynamic bindings")

dep_ids=[]
for group in g_dep.get("groups",[]):
    dep_ids += [i.get("id") for i in group.get("items",[])]
if not dep_ids or None in dep_ids or len(dep_ids)!=len(set(dep_ids)):
    err("Departure checklist requires unique stable item IDs")

# Standard presentation ownership: no inline style attributes in shared HTML/JS and typography uses shared tokens.
for path in shared_files:
    text=read(path)
    if 'style="' in text or "style='" in text:
        err(f"Inline style found in shared runtime: {path}")
css=read(Path("assets/app.css"))
for token in ("--font-xs","--font-sm","--font-md","--font-lg","--font-xl"):
    if token not in css: err(f"Missing shared typography token: {token}")

print("TravelPilot Standard POC QA")
print(f"Trips: {len(trips)}")
print(f"Errors: {len(ERRORS)}")
for e in ERRORS: print("ERROR:",e)
if ERRORS: sys.exit(1)
print("PASS")
