#!/usr/bin/env python3
"""Regression guard for Stage 5D-5U Japan-2027 patch ownership."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []

FILES = {
    "core": ASSETS / "japan2027-attraction-core-v1.js",
    "final": ASSETS / "trip-v9-final-fixes.js",
    "hotfix": ASSETS / "trip-v9-hotfix.js",
    "visit": ASSETS / "trip-v9-1-visit-fix.js",
    "repair": ASSETS / "info-icon-repair-v1.js",
}

REQUIRED = {
    "core": (
        "Japan2027AttractionCore",
        "BUTTON_SELECTOR",
        "findBest",
        "normalizeKeys",
        "stripVariationSelectors",
        "setExistingIdIfMissing",
        "ensureInfoButton",
        "dedupeInfoButtons",
    ),
    "final": (
        "__japan2027V90FinalFixes",
        "japanWinter2027_shinhotakaDay",
        "v90-shrine-info-btn",
        "#tripv2WeatherSelect [data-sh]",
        "japan2027:finalpatch",
        "function runFinalPatch(pass,delay,final)",
    ),
    "hotfix": (
        "__japan2027V901Hotfix",
        "Japan2027AttractionCore",
        "v901TripInfoModal",
        "CORE.dedupeInfoButtons",
        "CORE.ensureInfoButton",
        "#winter-shrines",
        "multitrip:tripinforendered",
        "japan2027:finalpatch",
        "onTripInfoRendered",
        "onFinalPatch",
    ),
    "visit": (
        "__japan2027V91VisitFix",
        "Japan2027AttractionCore",
        "visit-meta-card",
        "CORE.findBest",
        "CORE.ensureInfoButton",
        "['d6','d7','d8']",
        "addMapPins",
        "multitrip:itineraryrendered",
        "japan2027:finalpatch",
        "onFinalPatch",
    ),
    "repair": (
        "__japan2027InfoIconRepairV1",
        "Japan2027AttractionCore",
        "CORE.norm",
        "CORE.findBest",
        "normalizeKeys:true",
        "iconSpace:true",
        "stripVariationSelectors:true",
        "CORE.ensureInfoButton",
        "setExistingIdIfMissing:true",
        "details.day .timeline-card h3",
        "multitrip:itineraryrendered",
        "japan2027:languagechange",
        "function catchUp()",
        "dataset.itineraryRenderer",
        "setTimeout",
    ),
}

texts: dict[str, str] = {}
for key, path in FILES.items():
    if not path.exists():
        ERRORS.append(f"Missing active Stage 5D-5U file: {path.relative_to(ROOT)}")
        texts[key] = ""
        continue
    text = path.read_text(encoding="utf-8")
    texts[key] = text
    for marker in REQUIRED[key]:
        if marker not in text:
            ERRORS.append(f"{path.name} lost expected ownership marker: {marker}")
    if key != "core" and "new MutationObserver" in text:
        ERRORS.append(f"{path.name} reintroduced a live MutationObserver; bounded retry logic is required")

for key in ("hotfix", "visit"):
    text = texts.get(key, "")
    for forbidden in ("function norm(", "function bestInfo(", "function findAttraction(", "function removeDuplicateInfoButtons("):
        if forbidden in text:
            ERRORS.append(f"{FILES[key].name} reintroduced duplicated attraction helper: {forbidden}")

visit = texts.get("visit", "")
if "setTimeout" in visit or "2300" in visit or "scheduleFallback" in visit:
    ERRORS.append("Stage 5M requires visit-fix to remain event-driven with no startup fallback timer")

hotfix = texts.get("hotfix", "")
for forbidden in (
    "[120,350,800,1600,2600].forEach(t=>setTimeout(run,t));",
    "setTimeout(run,2600);",
):
    if forbidden in hotfix:
        ERRORS.append(f"Stage 5P requires hotfix to remain event-driven with no startup timer: {forbidden}")
if hotfix.count("setTimeout") != 0:
    ERRORS.append(f"Stage 5P requires hotfix to have no startup timers; found {hotfix.count('setTimeout')} setTimeout token(s)")

repair = texts.get("repair", "")
for forbidden in (
    "function norm(",
    "function strippedTitle(",
    "window.Japan2027EnhancementData",
    "document.createElement('button')",
    "function schedule(",
    "DOMContentLoaded',schedule",
    "[0,2800].forEach(t=>setTimeout(repair,t))",
    "[0,900,2800].forEach(t=>setTimeout(repair,t))",
    "[0,180,450,900,1600,2800].forEach(t=>setTimeout(repair,t))",
    ".tripv2-choice",
    "[100,400,1000].forEach(t=>setTimeout(repair,t))",
):
    if forbidden in repair:
        ERRORS.append(f"info-icon-repair-v1.js reintroduced removed/shared surface: {forbidden}")
if repair.count("setTimeout") != 2:
    ERRORS.append(
        f"Stage 5U requires info-icon repair to keep only renderer + reserved language retry surfaces; "
        f"found {repair.count('setTimeout')} setTimeout token(s)"
    )

loader = (ASSETS / "attraction-info.js").read_text(encoding="utf-8")
expected_loader_counts = {
    "japan2027-attraction-core-v1.js": 2,
    "trip-v9-final-fixes.js": 2,
    "trip-v9-hotfix.js": 2,
    "trip-v9-1-visit-fix.js": 1,
    "info-icon-repair-v1.js": 1,
}
for name, expected in expected_loader_counts.items():
    actual = loader.count(name)
    if actual != expected:
        ERRORS.append(f"Loader ownership changed for {name}: expected {expected} reference(s), found {actual}")

if loader.count("japan2027-attraction-core-v1.js?v=2") != 2:
    ERRORS.append("Both Japan loader chains must use attraction core module pin v2")
if loader.count("trip-v9-final-fixes.js?v=914") != 2:
    ERRORS.append("Stage 5L requires both Japan loader chains to use final-fixes module pin v914")
if loader.count("trip-v9-hotfix.js?v=4") != 2:
    ERRORS.append("Stage 5P requires both Japan loader chains to use hotfix module pin v4")
if loader.count("trip-v9-1-visit-fix.js?v=5") != 1:
    ERRORS.append("Stage 5M requires itinerary visit-fix module pin v5")
if loader.count("info-icon-repair-v1.js?v=7") != 1:
    ERRORS.append("Stage 5U requires itinerary info icon repair module pin v7")

for array_name in ("itineraryScripts", "tripInfoScripts"):
    match = re.search(rf"const\s+{array_name}\s*=\s*commonHead\.concat\(\[(.*?)\]\);", loader, flags=re.S)
    if not match:
        ERRORS.append(f"Loader array missing: {array_name}")
        continue
    block = match.group(1)
    core_pos = block.find("japan2027-attraction-core-v1.js")
    final_pos = block.find("trip-v9-final-fixes.js")
    hotfix_pos = block.find("trip-v9-hotfix.js")
    if core_pos < 0 or hotfix_pos < 0 or core_pos > hotfix_pos:
        ERRORS.append(f"{array_name}: shared attraction core must load before trip-v9-hotfix.js")
    if final_pos < 0 or hotfix_pos < 0 or final_pos > hotfix_pos:
        ERRORS.append(f"{array_name}: final-fixes must load before hotfix for finalpatch event ownership")
    if array_name == "itineraryScripts":
        visit_pos = block.find("trip-v9-1-visit-fix.js")
        renderer_pos = block.find("multi-trip-itinerary-renderer-v1.js")
        repair_pos = block.find("info-icon-repair-v1.js")
        if visit_pos < 0 or core_pos > visit_pos:
            ERRORS.append("itineraryScripts: shared attraction core must load before trip-v9-1-visit-fix.js")
        if renderer_pos < 0 or visit_pos > renderer_pos:
            ERRORS.append("itineraryScripts: visit-fix must load before itinerary renderer for event ownership")
        if repair_pos < 0 or core_pos > repair_pos:
            ERRORS.append("itineraryScripts: shared attraction core must load before info-icon-repair-v1.js")
        if visit_pos < 0 or repair_pos < 0 or visit_pos > repair_pos:
            ERRORS.append("itineraryScripts: visit-fix must remain before info-icon-repair-v1.js")
        if repair_pos < 0 or renderer_pos < 0 or repair_pos > renderer_pos:
            ERRORS.append("Stage 5R+ requires info-icon-repair-v1.js to load before itinerary renderer for event subscription")
    else:
        renderer_pos = block.find("multi-trip-trip-info-renderer-v1.js")
        if renderer_pos < 0 or hotfix_pos > renderer_pos:
            ERRORS.append("tripInfoScripts: hotfix must load before Trip Info renderer for event ownership")
        if "info-icon-repair-v1.js" in block:
            ERRORS.append("tripInfoScripts must not load itinerary-only info-icon-repair-v1.js")

button_tokens = (
    "enhance-info-btn",
    "attraction-info-btn",
    "backup-info-btn",
    "v90-shrine-info-btn",
)
print("TravelPilot Stage 5D-5U patch surface QA")
for key, text in texts.items():
    present = [token for token in button_tokens if token in text]
    print(f"{FILES[key].name}: {len(text)} bytes; info-button tokens={','.join(present) or 'none'}; setTimeout={text.count('setTimeout')}")

print("Shared attraction core active:", "Japan2027AttractionCore" in texts.get("core", ""))
print("Final owns D6-D8 Shinhotaka storage:", "japanWinter2027_shinhotakaDay" in texts.get("final", ""))
print("Visit owns D6-D8 metadata cards:", "visit-meta-card" in texts.get("visit", ""))
print("Visit consumes itinerary-rendered event:", "multitrip:itineraryrendered" in texts.get("visit", ""))
print("Final emits finalpatch event:", "japan2027:finalpatch" in texts.get("final", ""))
print("Visit consumes finalpatch event:", "japan2027:finalpatch" in texts.get("visit", ""))
print("Visit fixed startup timer removed:", "setTimeout" not in texts.get("visit", ""))
print("Hotfix owns Trip Info modal:", "v901TripInfoModal" in texts.get("hotfix", ""))
print("Hotfix consumes Trip Info renderer event:", "multitrip:tripinforendered" in texts.get("hotfix", ""))
print("Hotfix consumes finalpatch event:", "japan2027:finalpatch" in texts.get("hotfix", ""))
print("Hotfix startup timer removed:", "setTimeout" not in texts.get("hotfix", ""))
print("Info icon repair uses shared core:", "CORE.findBest" in texts.get("repair", ""))
print("Info icon repair deterministic catch-up active:", "dataset.itineraryRenderer" in texts.get("repair", ""))
print("Info icon startup schedule removed:", "function schedule(" not in texts.get("repair", ""))
print("Info icon choice-click retry removed:", ".tripv2-choice" not in texts.get("repair", ""))
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
