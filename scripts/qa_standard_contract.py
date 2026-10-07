#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys
from datetime import date
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TRIPS=ROOT/"trips"
ERRORS=[]
DEBT=[]
FEATURES={"itinerary","tripInfo","attractions","liveCam","todayMode","drivingMode","weather","weatherScore","weatherActivityProfiles","packingChecklist","winterDriving","conditionalDayPlanning"}
RENDERERS={"itinerary","tripInfo","attractions","liveCam","weather","todayMode","drivingMode"}
PAGES={"itinerary":"itinerary.html","tripInfo":"trip-info.html","attractions":"attractions.html","liveCam":"live.html"}
MODULE_TYPES={"conditional-day-planner","weather-comparison"}

def err(x): ERRORS.append(x)
def debt(x): DEBT.append(x)
def load(p):
    try:return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:err(f"{p.relative_to(ROOT)} invalid JSON: {e}");return {}
def daydate(v,w):
    try:return date.fromisoformat(v)
    except Exception:err(f"{w} invalid date {v!r}");return None
def ids(doc,key,w):
    a=doc.get(key,[]) if isinstance(doc,dict) else []
    if not isinstance(a,list):err(f"{w} {key} must be array");return set()
    out=set()
    for i,x in enumerate(a):
        if not isinstance(x,dict) or not isinstance(x.get("id"),str):err(f"{w} {key}[{i}] missing id");continue
        if x["id"] in out:err(f"{w} duplicate {key} id {x['id']}")
        out.add(x["id"])
    return out

def validate(entry):
    tid=entry.get("id")
    if not isinstance(tid,str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*",tid):err(f"invalid trip id {tid!r}");return
    folder=TRIPS/tid
    tp=folder/"trip.json"
    if entry.get("config")!=f"trips/{tid}/trip.json":err(f"{tid} registry config path invalid")
    if not tp.is_file():err(f"{tid} missing trip.json");return
    for p in folder.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".html",".js",".mjs",".css"}:err(f"{tid} trip-specific executable/page forbidden: {p.relative_to(ROOT)}")
    t=load(tp)
    if t.get("contractVersion")!="standard-v1":err(f"{tid} contractVersion must be standard-v1")
    if t.get("id")!=tid:err(f"{tid} trip.json id mismatch")
    start=daydate(str(t.get("startDate","")),f"{tid}.startDate");end=daydate(str(t.get("endDate","")),f"{tid}.endDate")
    if start and end and end<start:err(f"{tid} endDate precedes startDate")
    f=t.get("features",{})
    if not isinstance(f,dict):err(f"{tid} features must be object");f={}
    bad=set(f)-FEATURES
    if bad:err(f"{tid} non-generic feature keys {sorted(bad)}")
    if any(not isinstance(v,bool) for v in f.values()):err(f"{tid} feature values must be boolean")
    pages=t.get("pages",{})
    for k,v in PAGES.items():
        if pages.get(k)!=v:err(f"{tid} page {k} must use shared {v}")
    data=t.get("dataFiles",{})
    need={"itinerary","tripInfo","hotels","attractions","liveCams","weather"}
    if not isinstance(data,dict):err(f"{tid} dataFiles must be object");data={}
    if need-set(data):err(f"{tid} missing data sources {sorted(need-set(data))}")
    docs={}
    for k,v in data.items():
        if not isinstance(v,str) or "/" in v or "\\" in v:err(f"{tid} dataFiles.{k} must be local filename");continue
        p=folder/v
        if not p.is_file():err(f"{tid} missing data file {v}");continue
        docs[k]=load(p)
        if k!="departureChecklist" and docs[k].get("tripId")!=tid:err(f"{tid} {v} tripId mismatch")
    render=t.get("renderers",{})
    if set(render)-RENDERERS:err(f"{tid} unknown renderer keys {sorted(set(render)-RENDERERS)}")
    for k in RENDERERS:
        r=render.get(k)
        if not isinstance(r,dict):err(f"{tid} renderer {k} missing");continue
        if r.get("mode") not in {"generate","hydrate"}:err(f"{tid} renderer {k} invalid mode")
        if r.get("mode")=="hydrate":debt(f"{tid} renderer {k} still hydrate")
    modules=t.get("modules",[])
    if not isinstance(modules,list):err(f"{tid} modules must be array");modules=[]
    mids=set()
    for i,m in enumerate(modules):
        w=f"{tid}.modules[{i}]"
        if not isinstance(m,dict):err(f"{w} must be object");continue
        if m.get("type") not in MODULE_TYPES:err(f"{w} non-generic module type {m.get('type')!r}")
        mid=m.get("id")
        if not isinstance(mid,str) or not mid:err(f"{w} id required")
        elif mid in mids:err(f"{w} duplicate id {mid}")
        else:mids.add(mid)
        if not isinstance(m.get("candidateDays"),list) or not m["candidateDays"]:err(f"{w} candidateDays required")
        if not isinstance(m.get("targetRegion"),str):err(f"{w} targetRegion required")
        if m.get("type")=="conditional-day-planner":
            if m.get("strategy")!="weather-score":err(f"{w} strategy must be weather-score")
            if not isinstance(m.get("assignments"),dict) or not m["assignments"]:err(f"{w} assignments required")
    itinerary=docs.get("itinerary",{})
    days=itinerary.get("days",[]) if isinstance(itinerary,dict) else []
    hotels=ids(docs.get("hotels",{}),"hotels",f"{tid}/hotels.json")
    attrs=ids(docs.get("attractions",{}),"attractions",f"{tid}/attractions.json")
    weather=docs.get("weather",{})
    regions=weather.get("regions",{}) if isinstance(weather,dict) else {}
    if not isinstance(regions,dict):err(f"{tid} weather.regions must be object");regions={}
    seen_id=set();seen_n=set();seen_date=set()
    for i,d in enumerate(days if isinstance(days,list) else []):
        w=f"{tid}.days[{i}]"
        if not isinstance(d,dict):err(f"{w} must be object");continue
        did=d.get("id");num=d.get("day");raw=d.get("date")
        if did in seen_id:err(f"{w} duplicate id {did}")
        if isinstance(did,str):seen_id.add(did)
        if num in seen_n:err(f"{w} duplicate day number {num}")
        if isinstance(num,int):seen_n.add(num)
        if raw in seen_date:err(f"{w} duplicate date {raw}")
        if isinstance(raw,str):
            seen_date.add(raw);pd=daydate(raw,w)
            if pd and start and end and not(start<=pd<=end):err(f"{w} outside trip date range")
        hid=d.get("hotelId")
        if hid is not None and hotels and hid not in hotels:err(f"{w} unresolved hotelId {hid}")
        reg=d.get("weatherRegion")
        refs=d.get("moduleRefs",[])
        if reg=="dynamic":
            if not refs:err(f"{w} dynamic weatherRegion requires moduleRefs")
        elif reg is not None and reg not in regions:err(f"{w} unresolved weatherRegion {reg}")
        for ref in refs or []:
            if ref not in mids:err(f"{w} unresolved moduleRef {ref}")
        for j,item in enumerate(d.get("items",[]) or []):
            if not isinstance(item,dict):continue
            aid=item.get("attractionId")
            if aid is not None and attrs and aid not in attrs:err(f"{w}.items[{j}] unresolved attractionId {aid}")
    if seen_n and seen_n!=set(range(1,len(seen_n)+1)):err(f"{tid} day numbers must be contiguous from 1")
    for m in modules:
        if not isinstance(m,dict):continue
        for did in m.get("candidateDays",[]) or []:
            if did not in seen_id:err(f"{tid} module {m.get('id')} unknown candidate day {did}")
        tr=m.get("targetRegion")
        if tr and tr not in regions:err(f"{tid} module {m.get('id')} unknown targetRegion {tr}")
    if f.get("conditionalDayPlanning")!=bool(modules):err(f"{tid} conditionalDayPlanning must match modules")
    if f.get("packingChecklist") and "departureChecklist" not in data:debt(f"{tid} checklist still embedded in Trip Info")
    if t.get("legacy"):debt(f"{tid} legacy metadata remains")

def main():
    contract=load(ROOT/"schemas"/"standard-v1"/"contract.json")
    if contract.get("contractVersion")!="standard-v1":err("invalid Standard contract metadata")
    registry=load(TRIPS/"registry.json");entries=registry.get("trips",[])
    seen=set()
    for e in entries:
        tid=e.get("id") if isinstance(e,dict) else None
        if tid in seen:err(f"duplicate registry id {tid}")
        if isinstance(tid,str):seen.add(tid)
        if isinstance(e,dict):validate(e)
    if registry.get("defaultTrip") not in seen:err("defaultTrip not registered")
    contract_text=(ROOT/"schemas"/"standard-v1"/"contract.json").read_text(encoding="utf-8").lower()
    leaked=sorted(x for x in seen if x.lower() in contract_text)
    if leaked:err(f"contract contains concrete trip ids {leaked}")
    print("TravelPilot Standard Multi-Trip data contract QA")
    print(f"Trips checked: {len(seen)}")
    print(f"Errors: {len(ERRORS)}  Migration debt: {len(DEBT)}")
    for x in DEBT:print("DEBT:",x)
    for x in ERRORS:print("ERROR:",x)
    if ERRORS:return 1
    print("PASS");return 0

if __name__=="__main__":sys.exit(main())
