#!/usr/bin/env python3
"""Stage 5Q-5U guard for itinerary info-icon retry/event ownership."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []

loader = (ASSETS / "attraction-info.js").read_text(encoding="utf-8")
repair = (ASSETS / "info-icon-repair-v1.js").read_text(encoding="utf-8")
renderer = (ASSETS / "multi-trip-itinerary-renderer-v1.js").read_text(encoding="utf-8")
itinerary = (ROOT / "itinerary.html").read_text(encoding="utf-8")

# Stage 5U completes the startup/choice timer cleanup. Renderer and reserved language events remain bounded.
for marker in (
    "function repair()",
    "function catchUp(){if(document.documentElement.dataset.itineraryRenderer)repair();}",
    "document.addEventListener('multitrip:itineraryrendered',()=>{[0,120,500].forEach(t=>setTimeout(repair,t));});",
    "document.addEventListener('japan2027:languagechange',()=>{[0,250,800].forEach(t=>setTimeout(repair,t));});",
    "catchUp();",
    "window.Japan2027InfoIconRepair={repair};",
):
    if marker not in repair:
        ERRORS.append(f"Stage 5U info-icon runtime contract changed: missing {marker}")

for forbidden in (
    "function schedule(",
    "DOMContentLoaded',schedule",
    "[0,2800].forEach(t=>setTimeout(repair,t))",
    "[0,900,2800].forEach(t=>setTimeout(repair,t))",
    "[0,180,450,900,1600,2800].forEach(t=>setTimeout(repair,t))",
    ".tripv2-choice",
    "[100,400,1000].forEach(t=>setTimeout(repair,t))",
):
    if forbidden in repair:
        ERRORS.append(f"Stage 5U removed info-icon fallback surface returned: {forbidden}")

if repair.count("setTimeout") != 2:
    ERRORS.append(
        "Stage 5U info-icon repair must have exactly two setTimeout surfaces "
        f"(renderer + reserved language); found {repair.count('setTimeout')}"
    )
if "new MutationObserver" in repair:
    ERRORS.append("info-icon-repair-v1.js must not reintroduce a live MutationObserver")

# Renderer completion is deterministic: it marks the document before emitting the lifecycle event.
for marker in (
    "document.documentElement.dataset.itineraryRenderer='hydrate'",
    "document.documentElement.dataset.itineraryRenderer='generate'",
    "new CustomEvent('multitrip:itineraryrendered'",
    "[0,350,900,1800].forEach(t=>setTimeout(render,t));",
    "window.MultiTripItineraryRenderer={__v1:true,render,hydrateAll,generateAll,mode}",
):
    if marker not in renderer:
        ERRORS.append(f"Itinerary renderer evidence changed: missing {marker}")

# The reserved languagechange repair hook remains harmless and future-compatible.
if "japan2027:languagechange" not in repair:
    ERRORS.append("Reserved japan2027:languagechange info-icon repair hook was removed")

# Round 1 permanently retires the D6-D8 manual selector. Info-icon QA must
# not require or recreate that retired UI.
if "tripv2WeatherSelect" in itinerary:
    ERRORS.append("Retired D6-D8 manual selector returned to itinerary.html")

# Repair must load after the shared core/visit owner but before the renderer so normal completion events cannot be missed.
match = re.search(r"const\s+itineraryScripts\s*=\s*commonHead\.concat\(\[(.*?)\]\);", loader, flags=re.S)
if not match:
    ERRORS.append("itineraryScripts loader block missing")
else:
    block = match.group(1)
    positions = {
        "core": block.find("japan2027-attraction-core-v1.js"),
        "visit": block.find("trip-v9-1-visit-fix.js"),
        "repair": block.find("info-icon-repair-v1.js"),
        "renderer": block.find("multi-trip-itinerary-renderer-v1.js"),
    }
    if min(positions.values()) < 0:
        ERRORS.append(f"Stage 5U itinerary loader evidence incomplete: {positions}")
    elif not (positions["core"] < positions["visit"] < positions["repair"] < positions["renderer"]):
        ERRORS.append(
            "Expected core < visit-fix < info-icon-repair < renderer loader order; "
            f"found {positions}"
        )

if loader.count("info-icon-repair-v1.js?v=7") != 1:
    ERRORS.append("Stage 5U requires the Japan itinerary chain to use info-icon-repair module pin v7 exactly once")

# Repair remains Japan-itinerary-only and must not leak into generic itinerary chains.
generic = re.search(r"const\s+genericItineraryScripts\s*=\s*commonHead\.concat\(\[(.*?)\]\);", loader, flags=re.S)
if not generic:
    ERRORS.append("genericItineraryScripts loader block missing")
elif "info-icon-repair-v1.js" in generic.group(1):
    ERRORS.append("Generic itinerary chain must not load Japan info-icon repair")

print("TravelPilot Stage 5Q-5U info-icon event migration QA")
print("Startup schedule removed:", "function schedule(" not in repair)
print("Choice-click repair removed:", ".tripv2-choice" not in repair)
print("Repair consumes itinerary-rendered event:", "multitrip:itineraryrendered" in repair)
print("Renderer emits itinerary-rendered event:", "multitrip:itineraryrendered" in renderer)
print("Repair loads before renderer:", bool(match and match.group(1).find("info-icon-repair-v1.js") < match.group(1).find("multi-trip-itinerary-renderer-v1.js")))
print("Deterministic catch-up present:", "dataset.itineraryRenderer" in repair and "catchUp();" in repair)
print("Reserved languagechange repair hook retained:", "japan2027:languagechange" in repair)
print("D6-D8 manual selector retired:", "tripv2WeatherSelect" not in itinerary)
print("Info-icon setTimeout surfaces:", repair.count("setTimeout"))
print("Round 1 conclusion: info-icon renderer lifecycle remains intact while the retired D6-D8 selector is no longer part of the QA contract")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
