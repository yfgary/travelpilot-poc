# Round 7 — All Trips on TravelPilot Standard

Round 7 runs only in `yfgary/travelpilot-poc`. Production `yfgary/travelpilot/main` is not modified.

## Result

Every trip in the production registry now uses the same Standard v12 runtime:

- `shirakawago-shinhotaka-2027`
- `bangkok-2026`
- `hokkaido-2025`
- `multi-trip-demo-okinawa`

All four manifests now have:

- `schemaVersion: 12`
- `modules: []`
- no `legacy` block
- generate-only renderers
- separate `departure-checklist.json`

The public pages are now direct generic Standard shells. The temporary Round 6 `standard/`, `legacy/` and cutover-router paths are retired.

## Data migrations

### Bangkok 2026

Preserved:

- 8 days
- 28 attractions
- 1 hotel
- 9 departure-checklist items
- Today Mode
- weather/activity profiles
- 8 day galleries

The old `dayGalleryCss` dependency was converted into Standard `media.hero + media.gallery` data.

### Hokkaido 2025

Preserved:

- 8 days
- 26 attractions
- 4 hotels
- 15 departure-checklist items
- 8 Live Cam days / 11 camera records
- Today + Driving Mode
- attraction scores and score reasons
- 8 day galleries

Scores previously stored in the trip manifest were migrated into the individual attraction records. Weather regions were converted to the Standard v4 shape.

### Okinawa Demo

Preserved:

- 3 days
- 6 attractions
- 1 hotel
- 12 departure-checklist items
- Today + Driving Mode
- coastal/weather activity-profile data

Live Cam remains disabled by feature configuration.

### Shirakawago / Shinhotaka 2027

The Golden Reference remains unchanged in its approved Standard behavior:

- 9 days
- 42 rich attractions
- 7 hotels
- 96 departure-checklist items
- 9 Live Cam days / 37 camera records
- fixed D6 Shinhotaka
- fixed D7 Shirakawago
- fixed D8 Takayama → Matsumoto
- Hirayu Shrine / Hirayu no Mori / bear park remain optional, not main D6 timeline
- no D6–D8 weather-driven auto selection

## Homepage and Service Worker

The production-clone homepage no longer loads `multi-trip-context-v1.js`, which contained the old Japan default/fallback assumptions.

Homepage now uses `assets/standard-home-v1.js` and reads the trip registry only. If the registry cannot load, it shows a load error rather than substituting Japan data.

The Service Worker now caches the Standard runtime and no longer:

- caches old Multi Trip renderer assets
- patches `live.html`
- references Japan-specific modules

## Legacy retirement boundary

Round 7 removes **active runtime dependence** on the old architecture.

Old production legacy files are still physically present in the POC clone because they are part of the production snapshot. They are now dead-asset candidates rather than runtime dependencies.

Round 8 will use dependency/dead-asset QA to decide which files can be deleted safely. Physical deletion is deliberately separated from the Round 7 cutover so a removal cannot hide a parity regression.

## Round 7 QA contract

CI validates:

- all four trips against Standard JSON schemas
- direct Standard public shells
- no cutover router or legacy/standard routing directories
- no trip-specific branch/token in Standard shared runtime
- Standard-only Service Worker
- production image set remains byte-identical in the POC clone
- day/attraction/hotel/checklist/Live Cam parity for every trip
- real Chromium rendering for homepage and all four trips
- feature gating for Live Cam and Driving Mode
- trip-scoped checklist and Driving state
- Golden Reference D6–D8 fixed behavior
