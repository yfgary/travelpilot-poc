# Stage 5J — move D6–D8 visit decoration to renderer events

Stage 5J is the runtime follow-up to the Stage 5I audit. It moves the Japan 2027 D6–D8 visit metadata decorator away from the fixed `1650 / 2300 ms` retry pair and onto the existing `multitrip:itineraryrendered` event.

## Runtime change

`assets/trip-v9-1-visit-fix.js` now:

- subscribes to `multitrip:itineraryrendered` before the itinerary renderer loads
- runs `decorate()` on each renderer pass
- keeps one `2300 ms` startup fallback after DOM ready as a safety net
- removes the old `1650 ms` fixed retry

The existing decorator remains idempotent: it still checks for `.visit-meta-card` before appending metadata, and info-button creation remains owned by the shared attraction core.

## Why the event is the right trigger

The Japan itinerary loader places `trip-v9-1-visit-fix.js` before `multi-trip-itinerary-renderer-v1.js`, so the listener is active before render events can fire. The renderer emits `multitrip:itineraryrendered` after every render pass, including its existing bounded hydrate passes at `0 / 350 / 900 / 1800 ms`.

This ties visit decoration to the DOM lifecycle it depends on instead of guessing when the renderer has finished.

## Fallback boundary

One `2300 ms` startup fallback remains temporarily. It preserves a late safety pass if a renderer event is missed because of an unexpected legacy-load failure. Future removal should require runtime proof rather than another timing guess.

## Explicitly unchanged

- D6–D8 visit metadata content and formatting
- attraction matching and info-button behavior
- `addMapPins()` ownership
- D6–D8 Shinhotaka selection, localStorage key and 60 ms selection reload
- `trip-v9-final-fixes.js` retry schedule
- `trip-v9-hotfix.js` retry schedule
- `info-icon-repair-v1.js` schedules
- 96-item departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic trips
- homepage/banner
- itinerary content and itinerary timing

## Cache / release

`trip-v9-1-visit-fix.js` moves to module pin `v=3` so the runtime change is fetched reliably. The application release remains `v10.13.3`; no site-wide cache namespace or version change is made in this stage.
