#!/usr/bin/env python3
from __future__ import annotations
import json,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TRIP=ROOT/"trips"/"shirakawago-shinhotaka-2027"
errors=[]

def err(x): errors.append(x)
def load(p): return json.loads(p.read_text(encoding="utf-8"))

trip=load(TRIP/"trip.json")
itin=load(TRIP/"itinerary.json")
renderer=(ROOT/"assets"/"multi-trip-itinerary-renderer-v1.js").read_text(encoding="utf-8")
today=(ROOT/"assets"/"travel-mode-v1.js").read_text(encoding="utf-8")
driving=(ROOT/"assets"/"driving-mode-v1.js").read_text(encoding="utf-8")

r=trip.get("renderers",{}).get("itinerary",{})
if r.get("mode")!="generate": err("Shirakawago itinerary renderer must be generate")
if itin.get("presentationProfile")!="standard-markup-v1": err("Golden itinerary must use generic standard-markup-v1 profile")

days=itin.get("days",[])
if len(days)!=9: err(f"Expected 9 itinerary days, got {len(days)}")
ids=[d.get("id") for d in days]
if ids!=[f"d{i}" for i in range(1,10)]: err(f"Day ids changed: {ids}")
for d in days:
    markup=d.get("presentationMarkup")
    if not isinstance(markup,str) or not markup.strip():
        err(f"{d.get('id')} missing Standard presentationMarkup")
    elif f'id="{d.get("id")}"' not in markup:
        err(f"{d.get('id')} presentationMarkup does not contain matching day id")
    for key,v in (d.get("variants") or {}).items():
        if not isinstance(v.get("presentationMarkup"),str) or not v["presentationMarkup"].strip():
            err(f"{d.get('id')} variant {key} missing presentationMarkup")

if "multiTripLegacyModeSource" in renderer:
    err("Renderer still creates hidden legacy itinerary day source")
if "legacy-mode-" in today or "legacy-mode-" in driving:
    err("Today/Driving still depend on hidden legacy day clones")
if "presentationProfile()==='standard-markup-v1'" not in renderer:
    err("Shared renderer no longer recognizes generic Standard markup profile")
if "resolvedMarkup(day)" not in renderer:
    err("Shared renderer no longer resolves planner variants from Standard markup data")

# The removed routing patch used to rewrite D6-D8 after render. Round 4 data renderer owns that now.
if (ROOT/"assets"/"trip-v9-1-routing.js").exists():
    err("trip-v9-1-routing.js still exists; D6-D8 routing ownership was not retired")

print("Round 4 Standard itinerary architecture QA")
print(f"Days: {len(days)}")
print(f"Errors: {len(errors)}")
for e in errors: print("ERROR:",e)
if errors: sys.exit(1)
print("PASS")
