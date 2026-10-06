#!/usr/bin/env python3
"""Dependency and duplicate-load regression QA for TravelPilot trip loaders."""
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
    return re.findall(r"['\"](assets/[^'\"]+\.js(?:\?[^'\"]*)?)['\"]", block)


def array_block(source: str, name: str, concat: bool = False) -> list[str]:
    if concat:
        pattern = rf"const\s+{re.escape(name)}\s*=\s*commonHead\.concat\(\[(.*?)\]\);"
    else:
        pattern = rf"const\s+{re.escape(name)}\s*=\s*\[(.*?)\];"
    match = re.search(pattern, source, flags=re.S)
    if not match:
        error(f"Loader array not found: {name}")
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


loader = read("assets/attraction-info.js")
common = array_block(loader, "commonHead")
itinerary_extra = array_block(loader, "itineraryScripts", concat=True)
trip_info_extra = array_block(loader, "tripInfoScripts", concat=True)
generic_itinerary_extra = array_block(loader, "genericItineraryScripts", concat=True)
generic_trip_info_extra = array_block(loader, "genericTripInfoScripts", concat=True)

sets = {
    "Japan itinerary": common + itinerary_extra,
    "Japan trip info": common + trip_info_extra,
    "Generic itinerary": common + generic_itinerary_extra,
    "Generic trip info": common + generic_trip_info_extra,
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
    error("commonHead changed unexpectedly; keep shared trip context/data/nav ownership explicit")

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
)
for label in ("Generic itinerary", "Generic trip info"):
    for src in sets[label]:
        path = logical(src)
        if path.startswith(legacy_markers):
            error(f"{label}: Japan legacy dependency leaked into generic trips: {path}")

script_src_re = re.compile(r'<script\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*>', re.I)
for page, loader_set in (
    ("itinerary.html", sets["Japan itinerary"]),
    ("trip-info.html", sets["Japan trip info"]),
):
    direct = [s for s in script_src_re.findall(read(page)) if s.startswith("assets/")]
    direct_logical = [logical(s) for s in direct]
    check_unique(f"{page} direct scripts", direct)
    effective = {logical(s) for s in loader_set}
    for path in direct_logical:
        if path == "assets/attraction-info.js":
            continue
        if path in effective:
            error(f"{page}: direct script duplicates attraction-info loader dependency: {path}")

if "assets/trip-v9-final-fixes.js" in [logical(s) for s in script_src_re.findall(read("itinerary.html"))]:
    error("itinerary.html still directly loads trip-v9-final-fixes.js")

print("TravelPilot loader dependency QA")
for label, values in sets.items():
    print(f"{label}: {len(values)} dependencies")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print(f"ERROR: {item}")
if ERRORS:
    sys.exit(1)
print("PASS")
