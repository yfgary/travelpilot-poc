#!/usr/bin/env python3
"""Dependency and one-entry runtime regression QA for TravelPilot."""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        error(f"Missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8")


def logical(src: str) -> str:
    return src.split("?", 1)[0]


def quoted_assets(block: str) -> list[str]:
    return re.findall(r"""['"](assets/[^'"]+\.js(?:\?[^'"]*)?)['"]""", block)


def array_block(source: str, name: str) -> list[str]:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\];", source, flags=re.S)
    if not match:
        error(f"Runtime array not found: {name}")
        return []
    return quoted_assets(match.group(1))


def check_unique(label: str, values: list[str]) -> None:
    counts = Counter(logical(v) for v in values)
    for path, count in sorted(counts.items()):
        if count > 1:
            error(f"{label}: duplicate dependency {path} x{count}")


def check_exists(label: str, values: list[str]) -> None:
    for src in values:
        path = logical(src)
        if not (ROOT / path).is_file():
            error(f"{label}: missing referenced asset {path}")


runtime = read("assets/multi-trip-runtime-v1.js")
common = array_block(runtime, "commonScripts")
legacy_itinerary = array_block(runtime, "legacyItineraryScripts")
generic_itinerary = array_block(runtime, "genericItineraryScripts")
legacy_trip_info = array_block(runtime, "legacyTripInfoScripts")
generic_trip_info = array_block(runtime, "genericTripInfoScripts")
legacy_attractions = array_block(runtime, "legacyAttractionsScripts")
generic_attractions = array_block(runtime, "genericAttractionsScripts")
legacy_live = array_block(runtime, "legacyLiveScripts")
generic_live = array_block(runtime, "genericLiveScripts")

sets = {
    "Legacy itinerary": common + legacy_itinerary,
    "Generic itinerary": common + generic_itinerary,
    "Legacy trip info": common + legacy_trip_info,
    "Generic trip info": common + generic_trip_info,
    "Legacy attractions": common + legacy_attractions,
    "Generic attractions": common + generic_attractions,
    "Legacy live": legacy_live,
    "Generic live": generic_live,
}

for label, values in sets.items():
    check_unique(label, values)
    check_exists(label, values)

expected_common = {
    "assets/multi-trip-context-v1.js",
    "assets/multi-trip-data-v1.js",
    "assets/multi-trip-nav-v1.js",
}
if {logical(v) for v in common} != expected_common:
    error("commonScripts changed unexpectedly; shared context/data/nav ownership must stay explicit")

legacy_markers = (
    "assets/trip-v8",
    "assets/trip-v9",
    "assets/trip-enhancement",
    "assets/trip-user-overrides.js",
    "assets/trip-deep-info",
    "assets/site-shell-v7.js",
    "assets/travel-mode-v1.js",
    "assets/travel-mode-nav-fix-v1.js",
    "assets/driving-mode-v1.js",
    "assets/nav-enhancements-v1.js",
    "assets/d6-d8-weather-decision-v1.js",
    "assets/japan2027-",
    "assets/info-icon-repair-v1.js",
    "assets/live-v9-2-sync.js",
)
for label in ("Generic itinerary", "Generic trip info", "Generic attractions", "Generic live"):
    for src in sets[label]:
        path = logical(src)
        if path.startswith(legacy_markers):
            error(f"{label}: Japan legacy dependency leaked into Standard runtime: {path}")

for required in (
    "assets/multi-trip-today-mode-v1.js",
    "assets/multi-trip-driving-mode-v1.js",
    "assets/multi-trip-generic-qa-fix-v1.js",
):
    if required not in {logical(x) for x in generic_itinerary}:
        error(f"Generic itinerary missing shared runtime: {required}")

if "assets/multi-trip-departure-checklist-v1.js" not in {logical(x) for x in generic_trip_info}:
    error("Generic Trip Info no longer loads departure checklist renderer")
if {logical(x) for x in generic_attractions} != {"assets/multi-trip-attractions-renderer-v1.js"}:
    error("Generic Attractions must boot only the shared attractions renderer after common scripts")
if {logical(x) for x in generic_live} != {"assets/multi-trip-live-entry-v1.js"}:
    error("Generic Live must boot through the shared Live entry")
if {logical(x) for x in legacy_live} != {"assets/site-shell-v7.js"}:
    error("Legacy Live compatibility must remain isolated behind site-shell-v7 during migration")

script_src_re = re.compile(r"""<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>""", re.I)
for page in ("itinerary.html", "trip-info.html", "attractions.html", "live.html"):
    direct = [s for s in script_src_re.findall(read(page)) if s.startswith("assets/")]
    runtime_refs = [s for s in direct if logical(s) == "assets/multi-trip-runtime-v1.js"]
    if len(runtime_refs) != 1:
        error(f"{page}: expected exactly one direct multi-trip-runtime entry, found {len(runtime_refs)}")
    banned_direct = {
        "assets/attraction-info.js",
        "assets/site-shell-v7.js",
        "assets/multi-trip-live-entry-v1.js",
        "assets/multi-trip-context-v1.js",
        "assets/multi-trip-data-v1.js",
    }
    leaked = sorted(set(logical(s) for s in direct) & banned_direct)
    if leaked:
        error(f"{page}: page-local runtime ownership remains: {leaked}")

shim = read("assets/attraction-info.js")
if "assets/multi-trip-runtime-v1.js" not in shim:
    error("attraction-info compatibility shim no longer forwards to shared runtime")
for marker in ("legacyItineraryScripts", "genericItineraryScripts", "trip-core-v1.js", "site-shell-v7.js"):
    if marker in shim:
        error(f"attraction-info compatibility shim regained runtime routing logic: {marker}")

sw = read("sw.js")
if "assets/multi-trip-runtime-v1.js" not in sw:
    error("Service Worker no longer preserves the shared runtime entry for cached Live pages")
if "assets/multi-trip-live-entry-v1.js?v=" in re.search(r"async function patchLive[\s\S]*?self\.addEventListener\('fetch'", sw).group(0):
    error("Service Worker patchLive still injects a second Live-specific boot entry")

print("TravelPilot one-entry runtime dependency QA")
for label, values in sets.items():
    print(f"{label}: {len(values)} dependencies")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print(f"ERROR: {item}")
if ERRORS:
    sys.exit(1)
print("PASS")
