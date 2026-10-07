# Round 2 — Standard Multi-Trip Data Contract

Round 2 freezes the **data boundary** for the 100% Multi-Trip migration. It does not change the visual presentation or remove any current D6–D8 behaviour.

## Non-negotiable architecture rule

A trip is **data only**. A trip folder may contain JSON and media, but never its own HTML, JavaScript, module loader, runtime plan, or CSS patch.

Shared pages:
- `index.html`
- `itinerary.html`
- `trip-info.html`
- `attractions.html`
- `live.html`

Shared runtime owns all behaviour. Trip data supplies ids, content, dates, regions, maps, media and feature configuration.

## Standard v1 contract

Canonical machine-readable contract:
`schemas/standard-v1/contract.json`

Every registered trip declares:
`"contractVersion": "standard-v1"`

Canonical logical data sources:
- `trip.json`
- `itinerary.json`
- `trip-info.json`
- `hotels.json`
- `attractions.json`
- `weather.json`
- `live-cams.json`
- optional `departure-checklist.json`

## Generic conditional planning

Round 2 replaces destination-named configuration with a generic data contract:

`conditionalDayPlanning` feature +
`conditional-day-planner` module +
`weather-score` strategy.

A module may reference a trip-specific region id such as a mountain or village. That is **data**, not shared-code knowledge. Shared runtime is only allowed to understand the generic module type and strategy.

The current Japan D6–D8 runtime remains unchanged during Round 2 so Golden Reference UI/behaviour stays identical. Later rounds migrate runtime ownership to the generic engine.

## Final fixed D6–D8 plan

After the 100% Multi-Trip architecture is proven:
- D6 = Shirakawago
- D7 = Shinhotaka
- D8 = Hida Great Limestone Cave → Matsumoto
- manual D6/D7/D8 selection = removed
- best-weather automatic/recommended day selection = removed

Until that final cutover, both existing selection mechanisms remain available only as legacy Golden Reference behaviour.

## Contract QA

`scripts/qa_standard_contract.py` checks:
- every registry trip declares Standard v1
- one shared page set only
- no trip-specific HTML/JS/MJS/CSS inside trip folders
- only generic feature keys
- only generic module types
- every declared data file exists
- tripId consistency across files
- renderer configuration validity
- day id/day/date uniqueness and date range
- hotel/attraction/weather/module references resolve
- dynamic weather days require declared module references
- module candidate day and target region references resolve

Hydrate renderers and legacy metadata are reported as **migration debt**, not accepted as final architecture. Rounds 3–7 must drive that debt to zero.

## Round 2 exit criteria

Round 2 is complete only when:
1. Standard contract QA passes for every registered trip.
2. Existing normal QA passes.
3. Golden Reference browser DOM/interaction/visual parity passes.
4. No presentation/runtime regression is introduced.
5. POC version is bumped for the merge.
6. Production repository remains untouched.
