# Round 5 — Full Standard Parity and Production Retirement Readiness

Round 5 treats the migrated Shirakawago / Shinhotaka 2027 trip as a real application, not a fixture.

The goal is not to add more Japan-specific code. The goal is to prove that the real trip now works through the generic Standard runtime only, then define a safe production cutover order.

## Current Golden Reference

Trip:

- `shirakawago-shinhotaka-2027`
- D1–D9
- Standard trip schema v12
- `modules: []`
- no `legacy` block
- every renderer uses `mode: "generate"`

Runtime page ownership:

| Page | Standard runtime |
| --- | --- |
| Itinerary | `core.js` + `modes.js` + `render-itinerary.js` |
| Trip Info | `core.js` + `render-trip-info.js` |
| Attractions | `core.js` + `render-attractions.js` |
| Live Cam | `core.js` + `render-live.js` |

The POC pages do not load production patch assets such as `attraction-info.js`, `trip-v8-*`, `trip-v9-*`, `multi-trip-*`, `site-shell-v7.js` or the old D6–D8 selector.

## Full parity gates

Round 5 CI adds two dedicated gates.

### Static retirement-readiness audit

`python scripts/round5_readiness.py`

It verifies:

- pure Standard manifest
- only approved Standard scripts are referenced by each page
- no destination-specific branch exists in shared runtime
- D1–D9 exists in exact order
- fixed D6 / D7 / D8 weather ownership
- optional shrines stay optional
- all itinerary attraction / hotel references resolve
- all Live Cam IDs resolve
- migration-report counts still match generated data
- the complete Japan trip remains above its richness thresholds

### Real Chromium full-parity suite

`npm run parity`

It verifies:

- all four pages load only the Standard runtime
- navigation preserves the active trip
- every D1–D9 timeline count exactly matches JSON
- media, hotels, Backup, Bonus and constraints render from data
- Today Mode resolves D1, D6 and D9 from itinerary data
- Driving Mode progresses, persists and uses trip-scoped state
- disabled Driving Mode does not leak to the second generic trip
- all Trip Info sections, seven hotels and the full departure checklist render
- checklist persistence survives reload
- all migrated attractions render and key rich modals retain history / winter / sources
- Live Cam D1–D9 bindings exactly match Standard data
- D7 / D8 no longer show alternate-day camera content
- no Japan legacy localStorage keys are created

## Production snapshot before cutover

The production `yfgary/travelpilot` Japan manifest is still the old transition architecture:

- schema v10
- `shinhotaka-weather-day-selector` module still present
- itinerary / Trip Info / attractions / Live Cam / Today / Driving still use `hydrate`
- weather still preserves legacy decision modules
- a `legacy` block still points to `assets/trip-core-v1.js`

Production also still uses the legacy loader / patch chain. `assets/attraction-info.js` currently references the old site shell, trip patches, Japan attraction code, old multi-trip renderers, old modes and the D6–D8 weather decision code.

Round 5 does **not** delete any of those production files.

## Retirement groups

### Group A — Japan-only patch/data assets

These become deletion candidates only after the Standard JSON/media are copied into production and production no longer uses the migration source chain:

- `assets/japan2027-attraction-core-v1.js`
- `assets/trip-enhancement-data.js`
- `assets/trip-deep-info-d1-d4.js`
- `assets/trip-deep-info-d5-d9.js`
- `assets/trip-deep-info-backups.js`
- `assets/trip-user-overrides.js`
- `assets/trip-v8-1-overrides.js`
- `assets/trip-v8-7-user-plan.js`
- `assets/trip-v8-8-d2-plan.js`
- `assets/trip-v8-9-user-fixes.js`
- `assets/trip-v8-data.js`
- `assets/trip-v8-ui.js`
- `assets/trip-v8.css`
- `assets/trip-v8-1.css`
- `assets/trip-v9-final-fixes.js`
- `assets/trip-v9-hotfix.js`
- `assets/trip-v9-1-routing.js`
- `assets/trip-v9-1-visit-fix.js`
- `assets/d6-d8-weather-decision-v1.js`

Do not delete these while the Round 4 migration workflow still depends on them as production source data.

### Group B — old hydrate / shell runtime

These are broader architecture retirement candidates after the production pages are switched to Standard generate mode:

- `assets/attraction-info.js`
- `assets/attraction-info.css`
- `assets/site-shell-v7.js`
- `assets/site-shell-v7.css`
- `assets/trip-core-v1.js`
- old `multi-trip-*-renderer-v1.js`
- old `multi-trip-*-mode*.js`
- old checklist / nav / context compatibility modules

Some Group B files may still be required by Bangkok, Hokkaido or other production trips. They must not be deleted globally until those trips are migrated or the dependency scan proves they are unused.

## Safe production cutover order

1. Copy the Standard engine and generated Japan Standard data into a production test branch.
2. Change only the Japan manifest to schema v12, `modules: []`, no `legacy`, and all `generate` renderers.
3. Replace the Japan page execution path with the Standard shell/runtime while preserving the same public URLs.
4. Run the Round 5 parity suite against the production branch.
5. Compare the production branch manually on desktop and mobile for the Golden Reference.
6. Merge the cutover without deleting legacy files.
7. After production is stable, run a dependency scan.
8. Delete Japan-only legacy assets in a separate cleanup change.
9. Retire shared hydrate compatibility assets only after every remaining trip is confirmed independent of them.

## Round 5 boundary

A passing Round 5 means:

> The real Shirakawago / Shinhotaka trip is functionally owned by Standard data + Standard renderers inside the isolated POC, and the production cutover can be prepared without inventing more Japan-specific runtime code.

It does **not** mean:

> Production legacy files are already safe to delete.

Deletion is a later, separately verified cleanup after the production cutover.
