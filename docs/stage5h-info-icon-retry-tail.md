# Stage 5H — trim long info-icon startup retries

Stage 5H is the first runtime change based on the Stage 5G timer/retry audit. It only trims the long tail of the Japan 2027 itinerary info-icon startup repair.

## Change

`assets/info-icon-repair-v1.js` initial startup retries change from:

- `0, 180, 450, 900, 1600, 2800, 4800, 7000 ms`

to:

- `0, 180, 450, 900, 1600, 2800 ms`

The `4800 ms` and `7000 ms` startup passes are removed.

## Why this is the lowest-risk timer reduction

The repair already has explicit reconciliation after the DOM-changing events that matter:

- `multitrip:itineraryrendered`: `0, 120, 500 ms`
- `japan2027:languagechange`: `0, 250, 800 ms`
- D6–D8 `.tripv2-choice` click: `100, 400, 1000 ms`

The earlier startup retries through `2800 ms` remain as a compatibility buffer for legacy scripts that still finish delayed DOM work after page load.

## Explicitly unchanged

- attraction matching and eligibility rules
- info-button creation/deduplication behavior
- D6–D8 selection/storage/reload behavior
- `trip-v9-final-fixes.js` retry schedule
- `trip-v9-hotfix.js` retry schedule
- `trip-v9-1-visit-fix.js` retry schedule
- 96-item departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic trips
- homepage/banner
- itinerary content and timing

## Cache / release

`info-icon-repair-v1.js` moves to module pin `v=3` so the runtime change is fetched reliably. The application release remains `v10.13.3`; no site-wide release/cache namespace change is required for this narrow module update.
