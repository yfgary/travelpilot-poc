# TravelPilot legacy loader inventory

Stage 5A records what `assets/attraction-info.js` currently owns. Stage 5B/5C add repository-wide dead/orphan-asset guards and remove only assets with no remaining runtime references. Stage 5D maps the active v9 patch surface before any runtime consolidation. This inventory is not permission to delete active legacy files without runtime-equivalence checks.

## Canonical shared layer

Loaded for both Japan 2027 and generic trips:

- `multi-trip-context-v1.js`
- `multi-trip-data-v1.js`
- `multi-trip-nav-v1.js`

Generic trips then stay on the `multi-trip-*` renderers/modes/weather/checklist stack. Loader QA blocks Japan-only v8/v9 dependencies from leaking into generic trips.

## Japan 2027 legacy-active layer

These are still intentionally loaded for the Shirakawago / Shinhotaka 2027 itinerary or trip-info pages and must be treated as active until a later migration proves feature parity:

- base/shell: `trip-core-v1.js`, `site-shell-v7.js`
- weather/navigation: `weather-suitability-v1.js`, `d6-d8-weather-decision-v1.js`, `nav-enhancements-v1.js`
- enhancement data/content: `trip-enhancement-data.js`, `trip-user-overrides.js`, `trip-deep-info-d1-d4.js`, `trip-deep-info-d5-d9.js`, `trip-deep-info-backups.js`
- v8 chain: `trip-v8-data.js`, `trip-v8-1-overrides.js`, `trip-v8-ui.js`, `trip-v8-7-user-plan.js`, `trip-v8-8-d2-plan.js`, `trip-v8-9-user-fixes.js`
- v9 chain: `trip-v9-final-fixes.js`, `trip-v9-hotfix.js`, `trip-v9-1-routing.js`, `trip-v9-1-visit-fix.js`
- Japan-specific mode/navigation helpers: `travel-mode-v1.js`, `travel-mode-nav-fix-v1.js`, `driving-mode-v1.js`

## Stage 5A change

`itinerary.html` previously loaded `trip-v9-final-fixes.js` directly **and** `attraction-info.js` loaded the same file again. The JS file has an execution guard, but the second request and dual ownership were unnecessary. Stage 5A removes the direct HTML load; `attraction-info.js` is now the single owner.

## Stage 5B confirmed dead assets

Repository-wide filename/reference checks found no live references to these old JavaScript assets, and they are not part of the current loader arrays. Stage 5B removes them and `scripts/qa_dead_assets.py` prevents them or references to them from silently returning:

- `app-v8-7-data.js`
- `app-v8-7-ui.js`
- `trip-enhancements-v2.js`

Note: `trip-enhancements-v2.css` is **not** retired. It remains intentionally loaded by `attraction-info.js` and is separate from the deleted JavaScript file.

## Stage 5C duplicate Bangkok gallery CSS

A repository-wide JS/CSS orphan scan found only eight additional unreferenced assets: `bangkok-gallery-d1.css` through `bangkok-gallery-d8.css`. Each file contained one gallery rule that is already present **exactly** in `bangkok-day-galleries-v1.css`. The aggregate stylesheet remains the live source and is referenced by `trips/bangkok-2026/trip.json`.

Stage 5C removes the eight per-day duplicates, extends the retired-asset regression guard, and adds `scripts/qa_orphan_assets.py` so a new top-level JS/CSS file cannot remain silently unreferenced.

## Stage 5D active v9 patch audit

Stage 5D does **not** delete active v9 files. It maps the overlapping ownership of:

- `trip-v9-final-fixes.js`
- `trip-v9-hotfix.js`
- `trip-v9-1-visit-fix.js`

The audit confirms that the three scripts still own distinct live behavior while sharing the same attraction-info / D6–D8 DOM surface. `scripts/qa_v9_patch_surface.py` now guards the current loader ownership and the key behavior markers so a later consolidation cannot silently drop required functionality.

The detailed ownership map and safe consolidation order are recorded in `docs/stage5d-v9-patch-audit.md`.

## Remaining consolidation candidates

The following remain active and require runtime-equivalence work before removal or merging:

- `trip-v9-hotfix.js`
- `trip-v9-1-visit-fix.js`
- `trip-v9-final-fixes.js`
- `trip-v8-9-user-fixes.js`
- `trip-user-overrides.js`
- `nav-enhancements-v1.js`
- `site-shell-v7.js`

The next runtime-change stage should start with the narrow shared attraction resolver / info-button normalization surface instead of attempting a wholesale legacy deletion.
