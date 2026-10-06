#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRIP_ID = "shirakawago-shinhotaka-2027"
TRIP_DIR = ROOT / "trips" / TRIP_ID
ERRORS: list[str] = []


def err(message: str) -> None:
    ERRORS.append(message)


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"Cannot load {path.relative_to(ROOT)}: {exc}")
        return {}


trip = load(TRIP_DIR / "trip.json")
itinerary = load(TRIP_DIR / "itinerary.json")
info = load(TRIP_DIR / "trip-info.json")
attractions = load(TRIP_DIR / "attractions.json")
hotels = load(TRIP_DIR / "hotels.json")
live = load(TRIP_DIR / "live-cams.json")
weather = load(TRIP_DIR / "weather.json")
departure = load(TRIP_DIR / "departure-checklist.json")
report = load(TRIP_DIR / "migration-report.json")

# Pure Standard manifest.
if trip.get("schemaVersion") != 12:
    err("Golden trip must use schemaVersion 12")
if trip.get("modules") not in ([], None):
    err("Golden trip modules must be empty")
if "legacy" in trip:
    err("Golden trip still has legacy manifest block")

required_renderers = {
    "itinerary",
    "tripInfo",
    "attractions",
    "liveCam",
    "weather",
    "todayMode",
    "drivingMode",
}
renderers = trip.get("renderers") or {}
for name in required_renderers:
    if (renderers.get(name) or {}).get("mode") != "generate":
        err(f"{name} renderer is not generate")

# Runtime page allowlist: this is the retirement boundary.
page_scripts = {
    "itinerary.html": {"assets/core.js", "assets/modes.js", "assets/render-itinerary.js"},
    "trip-info.html": {"assets/core.js", "assets/render-trip-info.js"},
    "attractions.html": {"assets/core.js", "assets/render-attractions.js"},
    "live.html": {"assets/core.js", "assets/render-live.js"},
}
script_pattern = re.compile(r'<script[^>]+src=["\']([^"\']+)["\']', re.I)
legacy_pattern = re.compile(
    r"(trip-core|trip-enhancement|trip-v8|trip-v9|multi-trip|japan2027|"
    r"site-shell|attraction-info|d6-d8-weather|weather-day-selector)",
    re.I,
)
for page_name, expected in page_scripts.items():
    text = (ROOT / page_name).read_text(encoding="utf-8")
    actual = {x.split("?")[0] for x in script_pattern.findall(text)}
    if actual != expected:
        err(f"{page_name} runtime scripts {sorted(actual)} != {sorted(expected)}")
    for src in actual:
        if legacy_pattern.search(src):
            err(f"{page_name} still loads legacy runtime asset {src}")

# Shared Standard JS must not contain destination-specific runtime branches.
shared_js = [
    ROOT / "assets" / "core.js",
    ROOT / "assets" / "modes.js",
    ROOT / "assets" / "render-itinerary.js",
    ROOT / "assets" / "render-trip-info.js",
    ROOT / "assets" / "render-attractions.js",
    ROOT / "assets" / "render-live.js",
]
destination_tokens = (
    "japanWinter2027",
    "japan2027",
    "shirakawago-shinhotaka-2027",
    "白川鄉",
    "白川郷",
    "新穗高",
    "新穂高",
    "平湯神社",
    "weather-day-selector",
    "tripv2WeatherSelect",
)
for path in shared_js:
    text = path.read_text(encoding="utf-8")
    for token in destination_tokens:
        if token in text:
            err(f"Shared Standard runtime contains destination token {token!r}: {path.name}")
    if re.search(r"tripId\s*===?\s*['\"]", text):
        err(f"Shared runtime contains concrete trip-id branch: {path.name}")

# Golden data integrity and fixed-day contract.
days = itinerary.get("days") or []
if [d.get("id") for d in days] != [f"d{i}" for i in range(1, 10)]:
    err("Golden itinerary is not exact D1-D9 sequence")

by_day = {d.get("id"): d for d in days}
expected_regions = {"d6": "shinhotaka", "d7": "shirakawago", "d8": "takayama"}
for day_id, region in expected_regions.items():
    if by_day.get(day_id, {}).get("weatherRegion") != region:
        err(f"{day_id} itinerary region is not fixed to {region}")
    if (weather.get("dayRegions") or {}).get(day_id) != region:
        err(f"{day_id} weather region is not fixed to {region}")

all_text = "\n".join(
    json.dumps(obj, ensure_ascii=False)
    for obj in (trip, itinerary, info, attractions, live, weather)
)
for token in (
    "japanWinter2027_shinhotakaDay",
    "dynamicRegionRules",
    "flexibleRules",
    "weather-day-selector",
    "shinhotakaPlanner",
):
    if token in all_text:
        err(f"Retired architecture token remains in Standard data: {token}")

# Optional stops must stay outside the fixed main timeline.
def attraction_ids(day_id: str) -> set[str]:
    return {
        row.get("attractionId")
        for row in by_day.get(day_id, {}).get("items", [])
        if row.get("attractionId")
    }


for attraction_id in ("hirayu-shrine", "hirayu-no-mori", "bear-park"):
    if attraction_id in attraction_ids("d6"):
        err(f"D6 optional stop leaked into main timeline: {attraction_id}")
for attraction_id in ("hida-toshogu", "toyokawa-shiroyama-inari"):
    if attraction_id in attraction_ids("d7"):
        err(f"D7 optional shrine leaked into main timeline: {attraction_id}")
for attraction_id in ("shinhotaka", "shirakawago", "daio-wasabi"):
    if attraction_id in attraction_ids("d8"):
        err(f"D8 alternate-day stop leaked into main timeline: {attraction_id}")

# Cross-file references.
attraction_ids_all = {
    row.get("id") for row in attractions.get("attractions", []) if row.get("id")
}
hotel_ids_all = {row.get("id") for row in hotels.get("hotels", []) if row.get("id")}
for day in days:
    if day.get("hotelId") and day["hotelId"] not in hotel_ids_all:
        err(f"{day.get('id')} unknown hotelId {day['hotelId']}")
    for row in day.get("items", []):
        if row.get("attractionId") and row["attractionId"] not in attraction_ids_all:
            err(f"{day.get('id')} unknown attractionId {row['attractionId']}")

camera_ids = {row.get("id") for row in live.get("cameras", []) if row.get("id")}
for day in live.get("days", []):
    for camera_id in day.get("cameras", []):
        if camera_id not in camera_ids:
            err(f"Live Cam {day.get('id')} unknown camera {camera_id}")

# Production-parity counts must be internally reproducible.
computed = {
    "days": len(days),
    "timelineItems": sum(len(d.get("items", [])) for d in days),
    "photos": sum(
        (1 if (d.get("media") or {}).get("hero") else 0)
        + len((d.get("media") or {}).get("gallery") or [])
        for d in days
    ),
    "attractions": len(attractions.get("attractions") or []),
    "richAttractions": sum(
        1
        for row in attractions.get("attractions") or []
        if row.get("summary") or row.get("history") or row.get("visit")
    ),
    "hotels": len(hotels.get("hotels") or []),
    "departureChecklistItems": sum(
        len(group.get("items") or []) for group in departure.get("groups") or []
    ),
    "liveCameras": len(live.get("cameras") or []),
    "liveDays": len(live.get("days") or []),
    "customTripInfoSections": len(info.get("customSections") or []),
}
reported = report.get("counts") or {}
for key, value in computed.items():
    if reported.get(key) != value:
        err(f"migration-report {key}={reported.get(key)!r}, computed {value!r}")

# Minimum richness gates from the real Japan trip.
if computed["timelineItems"] < 100:
    err("Golden Reference timeline unexpectedly shrank below 100 items")
if computed["attractions"] < 40 or computed["richAttractions"] < 40:
    err("Golden Reference rich attractions unexpectedly shrank")
if computed["hotels"] != 7:
    err("Golden Reference must retain 7 hotels")
if computed["departureChecklistItems"] != 96:
    err("Golden Reference must retain all 96 departure checklist items")
if computed["liveDays"] != 9 or computed["liveCameras"] < 30:
    err("Golden Reference Live Cam coverage unexpectedly shrank")

print("TravelPilot Round 5 retirement readiness")
print(json.dumps(computed, ensure_ascii=False, indent=2))
print("Errors:", len(ERRORS))
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
print("POC runtime is ready for production cutover testing; production legacy files are NOT approved for deletion yet.")
