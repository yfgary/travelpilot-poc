#!/usr/bin/env python3
"""Stage 5K-5M guard for finalpatch completion and removed visit fallback."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []

loader = (ASSETS / "attraction-info.js").read_text(encoding="utf-8")
visit = (ASSETS / "trip-v9-1-visit-fix.js").read_text(encoding="utf-8")
renderer = (ASSETS / "multi-trip-itinerary-renderer-v1.js").read_text(encoding="utf-8")
final = (ASSETS / "trip-v9-final-fixes.js").read_text(encoding="utf-8")

# Stage 5M removes the 2300 ms fallback after Stage 5L introduced an explicit final completion signal.
for marker in (
    "document.addEventListener('multitrip:itineraryrendered',decorate)",
    "document.addEventListener('japan2027:finalpatch',onFinalPatch)",
    "function onFinalPatch(e){if(e.detail&&e.detail.final===true)decorate();}",
    "visit-meta-card",
    "addMapPins",
):
    if marker not in visit:
        ERRORS.append(f"visit event contract changed: missing {marker}")

for forbidden in ("scheduleFallback", "setTimeout(decorate,2300)", "2300", "1650"):
    if forbidden in visit:
        ERRORS.append(f"Stage 5M removed visit startup fallback marker: {forbidden}")
if visit.count("setTimeout") != 0:
    ERRORS.append(f"visit-fix must have no startup timer after Stage 5M; found {visit.count('setTimeout')} setTimeout token(s)")

for marker in (
    "new CustomEvent('multitrip:itineraryrendered'",
    "[0,350,900,1800].forEach(t=>setTimeout(render,t))",
):
    if marker not in renderer:
        ERRORS.append(f"renderer event evidence changed: missing {marker}")

for marker in (
    "function applyAll()",
    "scheduleShrines();",
    "[250,700,1500].forEach((t,i)=>setTimeout(()=>runFinalPatch(i+1,t,t===1500),t))",
    "new CustomEvent('japan2027:finalpatch'",
    "detail:{pass,delay,final}",
    "function runFinalPatch(pass,delay,final)",
):
    if marker not in final:
        ERRORS.append(f"legacy final-fix completion contract changed: missing {marker}")

if "japan2027:finalpatch" not in final:
    ERRORS.append("Stage 5M requires trip-v9-final-fixes.js to emit japan2027:finalpatch")
if "japan2027:finalpatch" not in visit:
    ERRORS.append("Stage 5M requires visit-fix to consume japan2027:finalpatch")

match = re.search(r"const\s+itineraryScripts\s*=\s*commonHead\.concat\(\[(.*?)\]\);", loader, flags=re.S)
if not match:
    ERRORS.append("itineraryScripts loader block missing")
else:
    block = match.group(1)
    positions = {
        "final": block.find("trip-v9-final-fixes.js"),
        "visit": block.find("trip-v9-1-visit-fix.js"),
        "renderer": block.find("multi-trip-itinerary-renderer-v1.js"),
    }
    if min(positions.values()) < 0:
        ERRORS.append(f"Stage 5M loader evidence incomplete: {positions}")
    elif not (positions["final"] < positions["visit"] < positions["renderer"]):
        ERRORS.append(f"Expected final-fixes < visit-fix < renderer loader order; found {positions}")

if loader.count("trip-v9-1-visit-fix.js?v=5") != 1:
    ERRORS.append("Stage 5M requires visit-fix module pin v5 exactly once in the Japan itinerary loader")

print("TravelPilot Stage 5K-5M visit fallback contract QA")
print("Visit renderer listener active:", "multitrip:itineraryrendered" in visit)
print("Visit startup fallback removed:", "2300" not in visit and visit.count('setTimeout') == 0)
print("Renderer last hydrate event at 1800 ms:", "[0,350,900,1800]" in renderer)
print("Legacy final retry reaches 1500 ms:", "[250,700,1500]" in final)
print("Legacy final completion event exists:", "japan2027:finalpatch" in final)
print("Visit consumes final completion event:", "japan2027:finalpatch" in visit)
print("Stage 5M conclusion: visit decoration is renderer/finalpatch event-driven with no fixed startup fallback")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
