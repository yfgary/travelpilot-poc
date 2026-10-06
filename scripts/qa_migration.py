#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TRIP='shirakawago-shinhotaka-2027'
BASE=ROOT/'trips'/TRIP
ERRORS=[]

def err(s): ERRORS.append(s)
def load(name):
    p=BASE/name
    if not p.is_file():
        err(f'Missing {p}')
        return {}
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception as e:
        err(f'Invalid JSON {p}: {e}')
        return {}

trip=load('trip.json')
it=load('itinerary.json')
info=load('trip-info.json')
attrs=load('attractions.json')
hotels=load('hotels.json')
live=load('live-cams.json')
weather=load('weather.json')
dep=load('departure-checklist.json')
report=load('migration-report.json')

if trip.get('schemaVersion')!=12: err('trip schemaVersion must be 12')
if trip.get('modules') not in ([],None): err('standard trip modules must be empty')
if 'legacy' in trip: err('legacy block must not exist')
for k,v in (trip.get('renderers') or {}).items():
    if v.get('mode')!='generate': err(f'renderer {k} not generate')

days=it.get('days') or []
if len(days)!=9: err(f'Expected D1-D9 = 9 days, got {len(days)}')
byid={d.get('id'):d for d in days}
for d in [f'd{i}' for i in range(1,10)]:
    if d not in byid: err(f'Missing itinerary {d}')

fixed={'d6':'shinhotaka','d7':'shirakawago','d8':'takayama'}
for d,region in fixed.items():
    if byid.get(d,{}).get('weatherRegion')!=region:
        err(f'{d} must be fixed to {region}, got {byid.get(d,{}).get("weatherRegion")}')
    txt=json.dumps(byid.get(d,{}),ensure_ascii=False)
    for banned in ('moduleRefs','weather-day-selector','dynamic','japanWinter2027_shinhotakaDay'):
        if banned in txt: err(f'{d} contains retired selector token {banned}')

all_text='\n'.join(json.dumps(x,ensure_ascii=False) for x in (trip,it,info,attrs,live,weather))
for banned in ('japanWinter2027_shinhotakaDay','weather-day-selector','dynamicRegionRules','flexibleRules','shinhotakaPlanner'):
    if banned in all_text: err(f'Retired architecture token remains: {banned}')

items=[x for d in days for x in d.get('items',[])]
if len(items)<50: err(f'Expected rich migrated timeline, got only {len(items)} items')
if not all(byid.get(d,{}).get('media') for d in ('d1','d2','d6','d7','d8','d9')):
    err('Key days lost media')
for field in ('highlights','hardCuts'):
    if sum(1 for d in days if d.get(field))<3: err(f'Insufficient migrated day field coverage: {field}')

alist=attrs.get('attractions') or []
if len(alist)<38: err(f'Expected >=38 attractions, got {len(alist)}')
rich=sum(1 for a in alist if a.get('summary') and (a.get('history') or a.get('visit')))
if rich<30: err(f'Expected >=30 rich attractions, got {rich}')
for aid in ('matsumoto-castle','shinhotaka','shirakawago','hida-toshogu','hirayu-shrine','hie-shrine'):
    a=next((x for x in alist if x.get('id')==aid),None)
    if not a: err(f'Missing attraction {aid}')
    elif not (a.get('summary') and a.get('winter')): err(f'Attraction {aid} lost rich detail')

if len(hotels.get('hotels') or [])!=7: err('Expected 7 hotels')

dep_items=[i for g in dep.get('groups',[]) for i in g.get('items',[])]
expected=dep.get('expectedCount')
if expected and len(dep_items)!=expected: err(f'Departure checklist expected {expected}, got {len(dep_items)}')
if len(dep_items)<90: err(f'Expected full production departure checklist, got {len(dep_items)}')
ids=[i.get('id') for i in dep_items]
if None in ids or len(ids)!=len(set(ids)): err('Departure checklist IDs are not unique/stable')

if live.get('schemaVersion')!=3: err('Live Cam must be schema v3')
if len(live.get('cameras') or [])<10: err(f'Too few migrated cameras: {len(live.get("cameras") or [])}')
if len(live.get('days') or [])!=9: err('Live Cam must expose D1-D9 day records')
if 'groups' in live or 'dynamicBindings' in live: err('Legacy Live Cam bindings remain')

custom=info.get('customSections') or []
ids={s.get('id') for s in custom}
if 'trains' not in ids: err('Rendered production train section was not migrated')
if 'winter-shrines' not in ids: err('Rendered production shrine section was not migrated')
if 'weather-manual-rule' not in ids: err('Manual weather rule section missing')
if (info.get('checklist') or {}).get('legacyStorageKey'): err('Legacy checklist storage key remains')

dayregions=weather.get('dayRegions') or {}
for d,r in fixed.items():
    if dayregions.get(d)!=r: err(f'weather.dayRegions {d} != {r}')
if 'dynamicRegionRules' in weather: err('dynamicRegionRules must be removed')

media_refs=report.get('mediaRefs') or []
for rel in media_refs:
    if not (ROOT/rel).is_file(): err(f'Migrated media missing: {rel}')

counts=report.get('counts') or {}
for key in ('days','timelineItems','photos','attractions','hotels','departureChecklistItems','liveCameras','liveDays'):
    if key not in counts: err(f'Migration report missing count {key}')

print('TravelPilot Round 4 migration QA')
print(json.dumps(counts,ensure_ascii=False,indent=2))
print('Errors:',len(ERRORS))
for e in ERRORS: print('ERROR:',e)
if ERRORS: sys.exit(1)
print('PASS')
