# Stage 5L — explicit final-patch completion event

Stage 5L adds the bounded completion contract proposed by the Stage 5K audit. It does not remove the remaining `2300 ms` visit fallback yet.

## Runtime contract

`assets/trip-v9-final-fixes.js` still performs the same initial pass plus bounded retries at `250 / 700 / 1500 ms`. Each pass now runs through `runFinalPatch(pass, delay, final)` and dispatches `japan2027:finalpatch` after `applyAll()` completes. The event detail carries `pass`, `delay`, and `final`; only the `1500 ms` pass has `final: true`.

`assets/trip-v9-1-visit-fix.js` keeps its existing `multitrip:itineraryrendered` listener and adds a `japan2027:finalpatch` listener. It calls `decorate()` only when `detail.final === true`, giving the degraded renderer-failure path an explicit late completion trigger.

The Stage 5J `2300 ms` startup fallback remains unchanged as a temporary safety net. Its removal is deferred until this new event path has runtime parity evidence.

## Cache pins

- `trip-v9-final-fixes.js`: `v=913` → `v=914` in both Japan loader chains
- `trip-v9-1-visit-fix.js`: `v=3` → `v=4` in the Japan itinerary chain
- application release remains `v10.13.3`

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

## Next safe step

After manual/runtime parity confirms the finalpatch listener covers the degraded path, a later stage can consider removing the remaining `2300 ms` visit fallback.
