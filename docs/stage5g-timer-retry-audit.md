# Stage 5G — timer / retry consolidation audit

Stage 5G is audit-only. It maps the remaining bounded delayed retries in the active Japan 2027 patch chain before any timer is removed or consolidated.

## Scope

This audit covers the four active modules that still perform delayed reconciliation:

- `assets/trip-v9-final-fixes.js`
- `assets/trip-v9-hotfix.js`
- `assets/trip-v9-1-visit-fix.js`
- `assets/info-icon-repair-v1.js`

No runtime JavaScript, itinerary content, storage behavior or UI behavior is changed in this stage.

## Current delayed work

### `trip-v9-final-fixes.js`

- D6–D8 choice click: reload after `60 ms` after updating `japanWinter2027_shinhotakaDay`.
- Initial reconciliation: `applyAll()` runs immediately, then at `250 / 700 / 1500 ms`.
- `applyAll()` owns a broad surface including D2 photo patching, D6–D8 photo/plan patching, shrine scheduling, route/rest notes and map-link normalization, so these retries are not safe to remove solely because attraction-info logic was consolidated.

### `trip-v9-hotfix.js`

- `run()` executes at DOM ready and again at `120 / 350 / 800 / 1600 / 2600 ms`.
- The delayed passes repair Trip Info quick-nav links, shrine info buttons and duplicate-button cleanup after older Trip Info renderers finish.
- This is Trip Info only.

### `trip-v9-1-visit-fix.js`

- `decorate()` runs at `1650 / 2300 ms`.
- It is D6–D8 itinerary only and adds visit metadata cards, ensures info buttons and refreshes map pins.
- The late timing strongly suggests dependency on earlier legacy itinerary rendering/patching and should not be removed without a targeted runtime test.

### `info-icon-repair-v1.js`

- Initial repair schedule: `0 / 180 / 450 / 900 / 1600 / 2800 / 4800 / 7000 ms`.
- `multitrip:itineraryrendered`: `0 / 120 / 500 ms`.
- `japan2027:languagechange`: `0 / 250 / 800 ms`.
- D6–D8 choice click: `100 / 400 / 1000 ms`.
- This is the widest retry surface. Stage 5F already removed its duplicate matching/button primitives, but the retry schedule itself is still intentionally preserved.

## Overlap map

The main overlap is on the Japan itinerary page:

- `trip-v9-final-fixes.js` retries broad itinerary patching through `1500 ms`.
- `trip-v9-1-visit-fix.js` begins at `1650 ms` and repeats at `2300 ms`.
- `info-icon-repair-v1.js` continues through `7000 ms` and also reacts to renderer/language/choice events.

Trip Info has a separate retry stream in `trip-v9-hotfix.js`; it should not be merged blindly with itinerary retry behavior.

## Classification

- **Keep for now — state transition:** the `60 ms` D6–D8 reload is part of the current selection flow, not a generic reconciliation retry.
- **Keep for now — broad legacy patch:** `trip-v9-final-fixes.js` `250 / 700 / 1500 ms`.
- **Keep for now — Trip Info renderer dependency:** `trip-v9-hotfix.js` `120 / 350 / 800 / 1600 / 2600 ms`.
- **Keep for now — late D6–D8 metadata/map dependency:** `trip-v9-1-visit-fix.js` `1650 / 2300 ms`.
- **Best next consolidation candidate:** `info-icon-repair-v1.js` initial schedule, because it already has explicit renderer/language/choice event triggers and its final `4800 / 7000 ms` passes are the most likely candidates for measured removal.

## Safe next step

Do not delete timers in Stage 5G. The next runtime slice should be narrow and reversible:

1. verify when `multitrip:itineraryrendered` fires relative to the initial itinerary render;
2. verify D1–D9 info icons after initial load, language switch and D6–D8 plan selection;
3. remove only the latest redundant initial info-icon repair passes if the event-driven repairs cover the same cases;
4. keep the v9 final-fixes, visit metadata and Trip Info retry schedules unchanged until separately proven redundant.

## Explicitly unchanged

- no active patch file removed
- no timer changed
- no D6–D8 selection/storage behavior changed
- no itinerary content/timing changed
- no 96-item checklist changed
- no Today Mode / Driving Mode changed
- no Live Cam changed
- no generic-trip runtime changed
- no homepage/banner changed
- application version remains `v10.13.3`
