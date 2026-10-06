#!/usr/bin/env python3
"""Stage 5N-5P guard for Trip Info retry/event migration."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []

loader = (ASSETS / "attraction-info.js").read_text(encoding="utf-8")
hotfix = (ASSETS / "trip-v9-hotfix.js").read_text(encoding="utf-8")
renderer = (ASSETS / "multi-trip-trip-info-renderer-v1.js").read_text(encoding="utf-8")
final = (ASSETS / "trip-v9-final-fixes.js").read_text(encoding="utf-8")

# Stage 5P removes the last Trip Info startup fallback after Stage 5O runtime parity passed.
for marker in (
    "function ensureTripInfoNav()",
    "function wireTripInfoButtons()",
    "function run()",
    "v901TripInfoModal",
    "#winter-shrines",
    "function onTripInfoRendered(){if(isTripInfo())run();}",
    "function onFinalPatch(e){if(isTripInfo()&&e.detail&&e.detail.final===true)run();}",
    "document.addEventListener('multitrip:tripinforendered',onTripInfoRendered);",
    "document.addEventListener('japan2027:finalpatch',onFinalPatch);",
    "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();",
):
    if marker not in hotfix:
        ERRORS.append(f"Trip Info Stage 5P runtime contract changed: missing {marker}")

for forbidden in (
    "[120,350,800,1600,2600].forEach(t=>setTimeout(run,t));",
    "setTimeout(run,2600);",
):
    if forbidden in hotfix:
        ERRORS.append(f"Stage 5P removed Trip Info startup fallback marker: {forbidden}")
if hotfix.count("setTimeout") != 0:
    ERRORS.append(
        f"Stage 5P expects Trip Info hotfix to have no startup timers; "
        f"found {hotfix.count('setTimeout')} setTimeout token(s)"
    )

# Trip Info renderer exposes the normal render-completion event surface.
for marker in (
    "new CustomEvent('multitrip:tripinforendered'",
    "render();[250,900].forEach(t=>setTimeout(render,t));",
    "window.MultiTripTripInfoRenderer={__v1:true,render,mode}",
):
    if marker not in renderer:
        ERRORS.append(f"Trip Info renderer event evidence changed: missing {marker}")

# The Japan legacy final layer exposes the late completion signal consumed final-only by hotfix.
for marker in (
    "new CustomEvent('japan2027:finalpatch'",
    "detail:{pass,delay,final}",
    "[250,700,1500].forEach((t,i)=>setTimeout(()=>runFinalPatch(i+1,t,t===1500),t))",
):
    if marker not in final:
        ERRORS.append(f"finalpatch completion evidence changed: missing {marker}")

trip_info_match = re.search(
    r"const\s+tripInfoScripts\s*=\s*commonHead\.concat\(\[(.*?)\]\);",
    loader,
    flags=re.S,
)
if not trip_info_match:
    ERRORS.append("tripInfoScripts loader block missing")
else:
    block = trip_info_match.group(1)
    positions = {
        "final": block.find("trip-v9-final-fixes.js"),
        "hotfix": block.find("trip-v9-hotfix.js"),
        "renderer": block.find("multi-trip-trip-info-renderer-v1.js"),
    }
    if min(positions.values()) < 0:
        ERRORS.append(f"Stage 5P Trip Info loader evidence incomplete: {positions}")
    elif not (positions["final"] < positions["hotfix"] < positions["renderer"]):
        ERRORS.append(
            f"Expected final-fixes < hotfix < Trip Info renderer loader order; found {positions}"
        )

if loader.count("trip-v9-hotfix.js?v=4") != 2:
    ERRORS.append("Stage 5P requires both Japan loader chains to use trip-v9-hotfix.js module pin v4")

# Japan-specific legacy patches must remain out of generic Trip Info chains.
generic_match = re.search(
    r"const\s+genericTripInfoScripts\s*=\s*commonHead\.concat\(\[(.*?)\]\);",
    loader,
    flags=re.S,
)
if not generic_match:
    ERRORS.append("genericTripInfoScripts loader block missing")
else:
    generic = generic_match.group(1)
    for forbidden in (
        "trip-v9-final-fixes.js",
        "trip-v9-hotfix.js",
        "japan2027-attraction-core-v1.js",
    ):
        if forbidden in generic:
            ERRORS.append(f"Generic Trip Info chain must not load Japan legacy patch: {forbidden}")

print("TravelPilot Stage 5N-5P Trip Info event migration QA")
print("Trip Info renderer listener active:", "multitrip:tripinforendered" in hotfix)
print("Final-only legacy completion listener active:", "japan2027:finalpatch" in hotfix and "final===true" in hotfix)
print("Old five-pass hotfix retry removed:", "[120,350,800,1600,2600]" not in hotfix)
print("2600 ms startup fallback removed:", "setTimeout(run,2600)" not in hotfix)
print("Hotfix startup timer count:", hotfix.count("setTimeout"))
print("Trip Info renderer emits render event:", "multitrip:tripinforendered" in renderer)
print("Trip Info renderer bounded rerenders include 250/900 ms:", "[250,900]" in renderer)
print("Final legacy completion event exists:", "japan2027:finalpatch" in final)
print(
    "Loader can subscribe before renderer:",
    bool(
        trip_info_match
        and trip_info_match.group(1).find("trip-v9-hotfix.js")
        < trip_info_match.group(1).find("multi-trip-trip-info-renderer-v1.js")
    ),
)
print("Stage 5P conclusion: Trip Info reconciliation is fully event-driven with no fixed startup fallback")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print("ERROR:", item)
if ERRORS:
    sys.exit(1)
print("PASS")
