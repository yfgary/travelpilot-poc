#!/usr/bin/env python3
"""Regression guard for the Stage 5G-5U bounded timer/retry surface."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []

FILES = {
    "final": ASSETS / "trip-v9-final-fixes.js",
    "hotfix": ASSETS / "trip-v9-hotfix.js",
    "visit": ASSETS / "trip-v9-1-visit-fix.js",
    "repair": ASSETS / "info-icon-repair-v1.js",
}

REQUIRED = {
    "final": (
        "setTimeout(()=>location.reload(),60)",
        "[250,700,1500].forEach((t,i)=>setTimeout(()=>runFinalPatch(i+1,t,t===1500),t))",
        "japan2027:finalpatch",
        "function runFinalPatch(pass,delay,final)",
        "function applyAll()",
        "japanWinter2027_shinhotakaDay",
    ),
    "hotfix": (
        "document.addEventListener('multitrip:tripinforendered',onTripInfoRendered);",
        "document.addEventListener('japan2027:finalpatch',onFinalPatch);",
        "function onFinalPatch(e){if(isTripInfo()&&e.detail&&e.detail.final===true)run();}",
        "function run()",
        "#winter-shrines",
        "v901TripInfoModal",
    ),
    "visit": (
        "document.addEventListener('multitrip:itineraryrendered',decorate)",
        "document.addEventListener('japan2027:finalpatch',onFinalPatch)",
        "function onFinalPatch(e){if(e.detail&&e.detail.final===true)decorate();}",
        "function decorate()",
        "['d6','d7','d8']",
        "visit-meta-card",
        "addMapPins",
    ),
    "repair": (
        "multitrip:itineraryrendered",
        "[0,120,500].forEach(t=>setTimeout(repair,t))",
        "japan2027:languagechange",
        "[0,250,800].forEach(t=>setTimeout(repair,t))",
        "function catchUp(){if(document.documentElement.dataset.itineraryRenderer)repair();}",
        "window.Japan2027InfoIconRepair={repair}",
    ),
}

texts: dict[str, str] = {}
for key, path in FILES.items():
    if not path.is_file():
        ERRORS.append(f"Missing Stage 5G-5U timer surface file: {path.relative_to(ROOT)}")
        texts[key] = ""
        continue
    text = path.read_text(encoding="utf-8")
    texts[key] = text
    for marker in REQUIRED[key]:
        if marker not in text:
            ERRORS.append(f"{path.name} timer/ownership baseline changed: missing {marker}")
    if "new MutationObserver" in text:
        ERRORS.append(f"{path.name} reintroduced a live MutationObserver; bounded retries/events are required")

repair = texts.get("repair", "")
for forbidden in (
    "function schedule(",
    "DOMContentLoaded',schedule",
    "[0,2800].forEach(t=>setTimeout(repair,t))",
    "[0,900,2800].forEach(t=>setTimeout(repair,t))",
    "[0,180,450,900,1600,2800].forEach(t=>setTimeout(repair,t))",
    ".tripv2-choice",
    "[100,400,1000].forEach(t=>setTimeout(repair,t))",
    "4800",
    "7000",
):
    if forbidden in repair:
        ERRORS.append(f"info-icon-repair-v1.js reintroduced removed startup/choice timer surface: {forbidden}")
if repair.count("setTimeout") != 2:
    ERRORS.append(
        f"Stage 5U info-icon repair should have exactly two setTimeout surfaces "
        f"(renderer + reserved language); found {repair.count('setTimeout')}"
    )

visit = texts.get("visit", "")
for removed_timer in ("1650", "2300"):
    if removed_timer in visit:
        ERRORS.append(f"trip-v9-1-visit-fix.js reintroduced removed fixed retry: {removed_timer} ms")
if visit.count("setTimeout") != 0:
    ERRORS.append(f"trip-v9-1-visit-fix.js should be event-driven with no setTimeout; found {visit.count('setTimeout')} token(s)")

hotfix = texts.get("hotfix", "")
for removed in (
    "[120,350,800,1600,2600].forEach(t=>setTimeout(run,t));",
    "setTimeout(run,2600);",
):
    if removed in hotfix:
        ERRORS.append(f"trip-v9-hotfix.js reintroduced removed Stage 5P startup timer: {removed}")
if hotfix.count("setTimeout") != 0:
    ERRORS.append(f"trip-v9-hotfix.js should be event-driven with no setTimeout after Stage 5P; found {hotfix.count('setTimeout')} token(s)")

print("TravelPilot Stage 5G-5U timer/retry surface QA")
for key, path in FILES.items():
    text = texts.get(key, "")
    print(f"{path.name}: setTimeout={text.count('setTimeout')}; MutationObserver={text.count('MutationObserver')}")

print("Classification: D6-D8 reload=state transition; final=bounded retries with finalpatch completion signal; hotfix=Trip Info renderer/finalpatch event-driven with no startup timer; visit=renderer/finalpatch event-driven with no startup timer; info-icon=renderer lifecycle + deterministic catch-up, with only reserved language event retries beyond renderer reconciliation")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
