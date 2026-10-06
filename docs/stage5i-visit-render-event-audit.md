# Stage 5I — visit metadata timer vs renderer-event audit

Stage 5I is audit-only. It evaluates whether `trip-v9-1-visit-fix.js` can later stop relying on its fixed `1650 / 2300 ms` retries and instead reconcile D6–D8 visit metadata from the itinerary renderer event.

## Current visit-fix behavior

`assets/trip-v9-1-visit-fix.js` currently runs `decorate()` at:

- `1650 ms`
- `2300 ms`

The function decorates D6–D8 attraction cards, ensures the shared `ⓘ` button, adds `.visit-meta-card`, and refreshes map pins when `window.addMapPins` exists.

## Existing renderer event

`assets/multi-trip-itinerary-renderer-v1.js` dispatches:

- `multitrip:itineraryrendered`

with `mode`, `count`, and `tripId` detail after each render pass.

For the Japan legacy hydrate path, the renderer already runs bounded passes at:

- `0 ms`
- `350 ms`
- `900 ms`
- `1800 ms`

The Japan loader currently loads `trip-v9-1-visit-fix.js` before `multi-trip-itinerary-renderer-v1.js`, so the visit fix can subscribe before the renderer begins emitting.

## Timing evidence

The older `trip-v8-7-user-plan.js` DOM patches finish on bounded startup passes at `80 / 400 ms` (or `0 / 300 ms` when the document is already ready). The renderer's final `1800 ms` hydrate event therefore occurs after those known user-plan startup patches.

`info-icon-repair-v1.js` already consumes `multitrip:itineraryrendered`, which confirms the event is an active integration surface in the current Japan itinerary chain.

## Conclusion

The renderer event is a credible replacement target for the visit-fix timers, but Stage 5I does **not** change runtime behavior yet.

A safe next runtime stage should:

1. subscribe `decorate()` to `multitrip:itineraryrendered`;
2. preserve idempotence (`.visit-meta-card` guard and shared info-button helper);
3. keep one small startup fallback only if runtime proof shows the renderer event can be missed;
4. verify D6–D8 metadata, info buttons, map pins, and Shinhotaka-day reload flow before removing both fixed timers.

## Explicitly unchanged in Stage 5I

- `trip-v9-1-visit-fix.js` runtime code and `1650 / 2300 ms` schedule
- D6–D8 selection, localStorage, and reload behavior
- 96-item departure checklist
- itinerary content/timing/routes
- Today Mode / Driving Mode
- Live Cam
- generic trips
- homepage/banner
- application version (`v10.13.3`)
