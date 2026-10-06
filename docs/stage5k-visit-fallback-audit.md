# Stage 5K — audit the remaining visit startup fallback

Stage 5K is audit-only. It reviews whether the remaining `2300 ms` startup fallback in `assets/trip-v9-1-visit-fix.js` can be removed safely after Stage 5J moved normal visit decoration onto `multitrip:itineraryrendered`.

## Current event path

- `trip-v9-1-visit-fix.js` loads before `multi-trip-itinerary-renderer-v1.js`.
- It subscribes to `multitrip:itineraryrendered` before renderer events begin.
- The Japan hydrate renderer runs at `0 / 350 / 900 / 1800 ms` and emits `multitrip:itineraryrendered` after every pass.
- Under a healthy renderer path, the `1800 ms` render event is later than the final known legacy `applyAll()` retry at `1500 ms`, so event-driven decoration already covers the normal startup lifecycle.

## Why the 2300 ms fallback still exists

`trip-v9-final-fixes.js` still performs broad legacy reconciliation through `applyAll()` at `250 / 700 / 1500 ms`. That pass includes D6–D8 shrine scheduling and other DOM work. If the itinerary renderer failed to load or failed before emitting its events, there is currently no separate completion event from the legacy final-fixes layer.

In that degraded path, removing the `2300 ms` fallback would leave no late visit-decoration pass after the final `1500 ms` legacy mutation.

## Conclusion

Do **not** remove the `2300 ms` fallback in Stage 5K.

The safer next runtime change is to give `trip-v9-final-fixes.js` an explicit bounded completion signal after `applyAll()` runs, then let visit decoration consume that signal. Only after that event path is proven should the timer fallback be removed.

A suitable future contract would be a Japan-specific event such as `japan2027:finalpatch` carrying the pass/timing context. That change should be isolated in its own runtime stage and must not alter D6–D8 selection/storage behavior.

## Explicitly unchanged

- no runtime JS/CSS changes
- no visit metadata content or formatting changes
- no D6–D8 selection/storage/reload changes
- no `trip-v9-final-fixes.js` retry changes
- no `trip-v9-hotfix.js` retry changes
- no info-icon repair schedule changes
- 96-item departure checklist unchanged
- Today Mode / Driving Mode unchanged
- Live Cam unchanged
- generic trips unchanged
- homepage/banner unchanged
- itinerary content and timing unchanged

Application release remains `v10.13.3`.
