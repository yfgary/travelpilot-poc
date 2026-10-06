#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRIP = "shirakawago-shinhotaka-2027"
BASE = ROOT / "trips" / TRIP
ERRORS: list[str] = []


def err(message: str) -> None:
    ERRORS.append(message)


def load(name: str) -> dict:
    path = BASE / name
    if not path.is_file():
        err(f"Missing {path}")
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        err(f"Invalid JSON {path}: {exc}")
        return {}


trip = load("trip.json")
itinerary = load("itinerary.json")
info = load("trip-info.json")
attrs = load("attractions.json")
hotels = load("hotels.json")
live = load("live-cams.json")
weather = load("weather.json")
departure = load("departure-checklist.json")
report = load("migration-report.json")

# Manifest / renderer contract
if trip.get("schemaVersion") != 12:
    err("trip schemaVersion must be 12")
if trip.get("modules") not in ([], None):
    err("standard trip modules must be empty")
if "legacy" in trip:
    err("legacy block must not exist")
for name, renderer in (trip.get("renderers") or {}).items():
    if renderer.get("mode") != "generate":
        err(f"renderer {name} not generate")

# D1-D9 and fixed D6-D8 contract
days = itinerary.get("days") or []
if len(days) != 9:
    err(f"Expected D1-D9 = 9 days, got {len(days)}")
by_id = {day.get("id"): day for day in days}
for day_id in [f"d{i}" for i in range(1, 10)]:
    if day_id not in by_id:
        err(f"Missing itinerary {day_id}")

fixed_regions = {"d6": "shinhotaka", "d7": "shirakawago", "d8": "takayama"}
for day_id, region in fixed_regions.items():
    if by_id.get(day_id, {}).get("weatherRegion") != region:
        err(
            f"{day_id} must be fixed to {region}, "
            f"got {by_id.get(day_id, {}).get('weatherRegion')}"
        )
    text = json.dumps(by_id.get(day_id, {}), ensure_ascii=False)
    for banned in (
        "moduleRefs",
        "weather-day-selector",
        "dynamic",
        "japanWinter2027_shinhotakaDay",
    ):
        if banned in text:
            err(f"{day_id} contains retired selector token {banned}")

retired_phrases = (
    "重新揀",
    "互換",
    "順延到 D7",
    "按今日天氣決定",
    "D6 未完成",
    "D6 已完成",
    "D7／D8",
    "D8 再畀新穗高",
    "尚未完成嘅主景點",
    "Scenario",
    "搶新穗高",
)
for day_id in ("d6", "d7", "d8"):
    text = json.dumps(by_id.get(day_id, {}), ensure_ascii=False)
    for phrase in retired_phrases:
        if phrase in text:
            err(f"{day_id} retains retired auto-selection wording: {phrase}")


def attraction_ids(day_id: str) -> set[str]:
    return {
        item.get("attractionId")
        for item in by_id.get(day_id, {}).get("items", [])
        if item.get("attractionId")
    }


for bad in ("miyagawa", "takayama-jinya", "sanmachi", "hida-cave", "takayama-supermarket"):
    if bad in attraction_ids("d6"):
        err(f"d6 contains hidden city/cave scenario item: {bad}")

if "shinhotaka" in attraction_ids("d7"):
    err("d7 contains hidden Shinhotaka scenario item")

for bad in ("shinhotaka", "shirakawago", "wada-house", "ogimachi-view", "daio-wasabi"):
    if bad in attraction_ids("d8"):
        err(f"d8 contains hidden alternate scenario item: {bad}")


# Optional shrines / bonus stops must stay optional, not be promoted into the fixed main timeline.
for bad in ("hirayu-shrine", "hirayu-no-mori", "bear-park"):
    if bad in attraction_ids("d6"):
        err(f"d6 optional stop leaked into main timeline: {bad}")
d6_backups = json.dumps(by_id.get("d6", {}).get("backups") or [], ensure_ascii=False)
for required in ("hirayu-shrine", "hirayu-no-mori"):
    if required not in d6_backups:
        err(f"d6 backup list missing optional stop: {required}")

for bad in ("hida-toshogu", "toyokawa-shiroyama-inari"):
    if bad in attraction_ids("d7"):
        err(f"d7 optional shrine leaked into main timeline: {bad}")
d7_backups = json.dumps(by_id.get("d7", {}).get("backups") or [], ensure_ascii=False)
for required in ("hida-toshogu", "toyokawa-shiroyama-inari"):
    if required not in d7_backups:
        err(f"d7 backup list missing optional shrine: {required}")

d8_backups = json.dumps(by_id.get("d8", {}).get("backups") or [], ensure_ascii=False)
if "hie-shrine" not in d8_backups:
    err("d8 backup list missing hie-shrine")

# Scraped UI text should be clean.
for day in days:
    for item in day.get("items", []):
        time_text = item.get("time") or ""
        if re.search(r"^\d{1,2}:\d{2}\d{1,2}:\d{2}", time_text):
            err(f"{day.get('id')} has concatenated timeline time: {time_text}")
        if re.search(r"[📍ⓘ]+\s*$", item.get("title") or ""):
            err(f"{day.get('id')} title still contains UI button glyphs: {item.get('title')}")

# No retired architecture anywhere in generated Standard data.
all_text = "\n".join(
    json.dumps(obj, ensure_ascii=False)
    for obj in (trip, itinerary, info, attrs, live, weather)
)
for banned in (
    "japanWinter2027_shinhotakaDay",
    "weather-day-selector",
    "dynamicRegionRules",
    "flexibleRules",
    "shinhotakaPlanner",
):
    if banned in all_text:
        err(f"Retired architecture token remains: {banned}")

# Rich itinerary parity
items = [item for day in days for item in day.get("items", [])]
if len(items) < 50:
    err(f"Expected rich migrated timeline, got only {len(items)} items")
if not all(by_id.get(day_id, {}).get("media") for day_id in ("d1", "d2", "d6", "d7", "d8", "d9")):
    err("Key days lost media")
for field in ("highlights", "hardCuts"):
    if sum(1 for day in days if day.get(field)) < 3:
        err(f"Insufficient migrated day field coverage: {field}")

# Rich attractions
attractions = attrs.get("attractions") or []
if len(attractions) < 38:
    err(f"Expected >=38 attractions, got {len(attractions)}")
rich_count = sum(
    1
    for attraction in attractions
    if attraction.get("summary") and (attraction.get("history") or attraction.get("visit"))
)
if rich_count < 30:
    err(f"Expected >=30 rich attractions, got {rich_count}")
for attraction_id in (
    "matsumoto-castle",
    "shinhotaka",
    "shirakawago",
    "hida-toshogu",
    "hirayu-shrine",
    "hie-shrine",
):
    attraction = next(
        (row for row in attractions if row.get("id") == attraction_id),
        None,
    )
    if not attraction:
        err(f"Missing attraction {attraction_id}")
    elif not (attraction.get("summary") and attraction.get("winter")):
        err(f"Attraction {attraction_id} lost rich detail")

# The Golden Reference attraction copy must describe the fixed plan, not the retired selector.
attraction_by_id = {row.get("id"): row for row in attractions}
expected_days = {
    "shinhotaka": "D6",
    "hirayu-shrine": "D6 Backup",
    "shirakawago": "D7",
    "hida-toshogu": "D7 Backup",
    "toyokawa-shiroyama-inari": "D7 Backup",
    "miyagawa": "D8",
    "takayama-jinya": "D8",
    "sanmachi": "D8",
    "hida-cave": "D8",
}
for attraction_id, expected_day in expected_days.items():
    row = attraction_by_id.get(attraction_id)
    if not row:
        err(f"Missing fixed-day attraction {attraction_id}")
    elif row.get("day") != expected_day:
        err(f"{attraction_id} day should be {expected_day}, got {row.get('day')}")

retired_attraction_phrases = (
    "D6–D8選擇器",
    "D6／D7／D8揀一日",
    "留D7／D8",
    "三個可選日期",
    "你揀咗去新穗高嗰一日",
    "D6–D8同新穗高互換",
    "只適合D8新穗高",
    "如果 D6/D7/D8",
)
for attraction_id in (
    "shinhotaka",
    "hirayu-shrine",
    "hirayu-no-mori",
    "shirakawago",
    "hida-cave",
    "hida-toshogu",
    "toyokawa-shiroyama-inari",
    "daio-wasabi",
):
    row = attraction_by_id.get(attraction_id) or {}
    text = "\n".join(
        str(row.get(field) or "")
        for field in ("summary", "info", "tips", "visit", "winter")
    )
    for phrase in retired_attraction_phrases:
        if phrase in text:
            err(f"{attraction_id} retains retired flexible-plan copy: {phrase}")

# Hotels
if len(hotels.get("hotels") or []) != 7:
    err("Expected 7 hotels")

# Full departure checklist and stable IDs
departure_items = [
    item
    for group in departure.get("groups", [])
    for item in group.get("items", [])
]
expected_count = departure.get("expectedCount")
if expected_count and len(departure_items) != expected_count:
    err(f"Departure checklist expected {expected_count}, got {len(departure_items)}")
if len(departure_items) < 90:
    err(f"Expected full production departure checklist, got {len(departure_items)}")
departure_ids = [item.get("id") for item in departure_items]
if None in departure_ids or len(departure_ids) != len(set(departure_ids)):
    err("Departure checklist IDs are not unique/stable")

# Standard Live Cam
if live.get("schemaVersion") != 3:
    err("Live Cam must be schema v3")
if len(live.get("cameras") or []) < 10:
    err(f"Too few migrated cameras: {len(live.get('cameras') or [])}")
if len(live.get("days") or []) != 9:
    err("Live Cam must expose D1-D9 day records")
if "groups" in live or "dynamicBindings" in live:
    err("Legacy Live Cam bindings remain")

live_cam_by_id = {row.get("id"): row for row in live.get("cameras", [])}
live_day_by_id = {row.get("id"): row for row in live.get("days", [])}

def live_day_text(day_id: str) -> str:
    day = live_day_by_id.get(day_id) or {}
    cameras = [
        live_cam_by_id.get(camera_id) or {}
        for camera_id in day.get("cameras", [])
    ]
    return json.dumps(
        {"day": day, "cameras": cameras},
        ensure_ascii=False,
    )

d6_live = live_day_text("d6")
d7_live = live_day_text("d7")
d8_live = live_day_text("d8")
if "新穗高" not in d6_live and "新穂高" not in d6_live:
    err("D6 Live Cam lost Shinhotaka coverage")
for banned in ("新穗高", "新穂高"):
    if banned in d7_live:
        err(f"D7 Live Cam still contains Shinhotaka content: {banned}")
for banned in ("白川鄉", "白川郷", "新穗高", "新穂高"):
    if banned in d8_live:
        err(f"D8 Live Cam still contains alternate-day content: {banned}")

# Trip Info custom sections
custom_sections = info.get("customSections") or []
custom_ids = {section.get("id") for section in custom_sections}
if not ({"trains", "rail-prices", "train-fares"} & custom_ids):
    err("Rendered production train/rail section was not migrated")
if "winter-shrines" not in custom_ids:
    err("Rendered production shrine section was not migrated")
if "weather-manual-rule" not in custom_ids:
    err("Manual weather rule section missing")
if (info.get("checklist") or {}).get("legacyStorageKey"):
    err("Legacy checklist storage key remains")

# Weather has fixed day ownership.
day_regions = weather.get("dayRegions") or {}
for day_id, region in fixed_regions.items():
    if day_regions.get(day_id) != region:
        err(f"weather.dayRegions {day_id} != {region}")
if "dynamicRegionRules" in weather:
    err("dynamicRegionRules must be removed")

# Fixed D6 media should represent the fixed Shinhotaka / Hirayu / Takayama day.
d6_media = by_id.get("d6", {}).get("media") or {}
d6_gallery_text = json.dumps(d6_media.get("gallery") or [], ensure_ascii=False)
if "平湯神社" not in d6_gallery_text:
    err("D6 fixed media lost Hirayu Shrine")
if "松本・今晚終點" in d6_gallery_text or "d9-matsumoto-station" in d6_gallery_text:
    err("D6 media still contains hidden D8/Matsumoto scenario photo")

# Timeline order/dedupe sanity after legacy DOM extraction.
def first_minutes(value: str) -> int:
    match = re.search(r"(\d{1,2}):(\d{2})", value or "")
    if match:
        return int(match.group(1)) * 60 + int(match.group(2))
    if "晚上" in (value or "") or "夜晚" in (value or ""):
        return 24 * 60
    return 24 * 60 - 1

for day in days:
    rows = day.get("items", [])
    keys = [(row.get("type"), row.get("title"), row.get("attractionId")) for row in rows]
    if len(keys) != len(set(keys)):
        err(f"{day.get('id')} still has duplicate legacy timeline rows")
    numeric = [first_minutes(row.get("time") or "") for row in rows]
    if numeric != sorted(numeric):
        err(f"{day.get('id')} timeline is not in chronological order")

# Media parity
media_refs = report.get("mediaRefs") or []
for rel in media_refs:
    if not (ROOT / rel).is_file():
        err(f"Migrated media missing: {rel}")

counts = report.get("counts") or {}
for key in (
    "days",
    "timelineItems",
    "photos",
    "attractions",
    "hotels",
    "departureChecklistItems",
    "liveCameras",
    "liveDays",
):
    if key not in counts:
        err(f"Migration report missing count {key}")

print("TravelPilot Round 4 migration QA")
print(json.dumps(counts, ensure_ascii=False, indent=2))
print("Errors:", len(ERRORS))
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
