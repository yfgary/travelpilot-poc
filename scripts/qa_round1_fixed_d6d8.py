#!/usr/bin/env python3
import json, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
errors=[]

def fail(msg): errors.append(msg)
def read(path): return (ROOT/path).read_text(encoding="utf-8")
def load(path): return json.loads(read(path))

trip=load("trips/shirakawago-shinhotaka-2027/trip.json")
if trip.get("features",{}).get("shinhotakaPlanner") is not False:
    fail("shinhotakaPlanner must be false")
if any(m.get("type")=="weather-day-selector" and m.get("enabled") is not False for m in trip.get("modules",[])):
    fail("weather-day-selector must not be enabled")

it=load("trips/shirakawago-shinhotaka-2027/itinerary.json")
if "flexibleRules" in it: fail("flexibleRules must be removed")
days={d.get("id"):d for d in it.get("days",[])}
expected={
 "d6":("白川鄉","高山 → 白川鄉 → 高山","shirakawago"),
 "d7":("新穗高纜車","高山 → 新穗高 → 高山","shinhotaka"),
 "d8":("高山市區＋飛驒大鐘乳洞 → 松本","宮川朝市 → 高山陣屋／三町 → 飛驒大鐘乳洞 → 松本","takayama"),
}
for did,(title,route,region) in expected.items():
    d=days.get(did) or {}
    if d.get("title")!=title: fail(f"{did} title mismatch")
    if d.get("route")!=route: fail(f"{did} route mismatch")
    if d.get("weatherRegion")!=region: fail(f"{did} weatherRegion mismatch")
    if d.get("moduleRefs"): fail(f"{did} must not reference selector modules")

weather=load("trips/shirakawago-shinhotaka-2027/weather.json")
if "dynamicRegionRules" in weather: fail("dynamicRegionRules must be removed")
for did,region in {"d6":"shirakawago","d7":"shinhotaka","d8":"takayama"}.items():
    if weather.get("dayRegions",{}).get(did)!=region: fail(f"{did} weather dayRegion mismatch")

live=load("trips/shirakawago-shinhotaka-2027/live-cams.json")
if "dynamicBindings" in live: fail("Live Cam dynamicBindings must be removed")
for did,binding in {"d6":"shirakawago","d7":"shinhotaka","d8":"city+east"}.items():
    if live.get("fixedDayBindings",{}).get(did)!=binding: fail(f"{did} Live Cam binding mismatch")

info=load("trips/shirakawago-shinhotaka-2027/trip-info.json")
if info.get("weather",{}).get("dynamicSummary") is not False: fail("Trip Info weather summary must be fixed")
if info.get("weather",{}).get("storageKey"): fail("Trip Info must not expose selector storage key")

html=read("itinerary.html")
if "tripv2WeatherSelect" in html: fail("Manual D6-D8 selector still exists in itinerary.html")
for marker in ("D6｜白川鄉","D7｜新穗高纜車","D8｜高山市區＋飛驒大鐘乳洞 → 松本"):
    if marker not in html: fail(f"Fixed itinerary marker missing: {marker}")

decision=read("assets/d6-d8-weather-decision-v1.js")
for forbidden in ("d68Apply","getSelectedShinhotakaDay(","setSelectedShinhotakaDay("):
    if forbidden in decision: fail(f"Read-only weather comparison still has selection action: {forbidden}")
if "不會推薦、套用或改動 D6–D8 行程" not in decision:
    fail("Read-only weather comparison disclaimer missing")

core=read("assets/trip-core-v1.js")
if "d6:'shirakawago',d7:'shinhotaka',d8:'cityCave'" not in core:
    fail("Trip core fixed D6-D8 resolver missing")
if "function setSelectedShinhotakaDay(){try{localStorage.removeItem(SH_KEY);" not in core:
    fail("Legacy selection API is not hard-disabled")

trip_info_html=read("trip-info.html")
if "const WEATHER_KEY='japanWinter2027_shinhotakaDay'" in trip_info_html:
    fail("Trip Info still reads legacy D6-D8 selector storage")
live_html=read("live.html")
if "const KEY = 'japanWinter2027_shinhotakaDay'" in live_html or "function weatherDay(" in live_html:
    fail("Live Today Card still depends on D6-D8 selector")
for forbidden in ("天氣彈性日 1","天氣彈性日 2","天氣彈性日 3","等待選擇新穗高日子"):
    if forbidden in live_html: fail(f"Live page still exposes old flexible-plan text: {forbidden}")

version=load("version.json")
if version.get("version")!="v10.14.1": fail("Round 1 POC version must be v10.14.1")

print("TravelPilot Round 1 fixed D6-D8 QA")
print(f"Errors: {len(errors)}")
for e in errors: print("ERROR:",e)
if errors: sys.exit(1)
print("PASS")
