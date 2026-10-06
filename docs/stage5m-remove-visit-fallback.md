# Stage 5M — remove the remaining visit startup fallback

Stage 5M removes the final fixed startup timer from `assets/trip-v9-1-visit-fix.js` after Stage 5L introduced the explicit `japan2027:finalpatch` completion contract and the requested manual smoke test did not report a regression.

## Runtime contract

Visit decoration is now event-driven only:

- `multitrip:itineraryrendered` continues to decorate after renderer passes.
- `japan2027:finalpatch` continues to decorate after the final legacy patch pass (`final: true`).
- the old `2300 ms` startup fallback is removed.

`trip-v9-final-fixes.js` is unchanged in this stage: it still performs the same initial pass and bounded retries at `250 / 700 / 1500 ms`, with the `1500 ms` pass marked as the final completion signal.

## Cache pin

- `trip-v9-1-visit-fix.js`: `v=4` → `v=5` in the Japan itinerary loader only.
- application release remains `v10.13.3`.

## Explicitly unchanged

- D6–D8 Shinhotaka selection, localStorage key and 60 ms reload
- D6–D8 visit metadata content and formatting
- renderer hydrate schedule `0 / 350 / 900 / 1800 ms`
- final-fixes retry timing `250 / 700 / 1500 ms`
- `trip-v9-hotfix.js` retry timing
- info-icon repair schedules
- 96-item departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic trips
- homepage/banner
- itinerary content and itinerary timing

## Regression guard

Stage 5M updates the existing timer, v9 patch, renderer-event and fallback-contract QA so the removed `2300 ms` timer cannot silently return.