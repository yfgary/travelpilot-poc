# Stage 5P — remove the final Trip Info startup fallback

Stage 5P is the runtime follow-up to Stage 5O after its CI and manual smoke test both passed.

## Runtime change

`assets/trip-v9-hotfix.js` no longer uses the final `2600 ms` startup fallback.

Trip Info reconciliation now runs only through explicit lifecycle paths:

- the immediate DOM-ready `run()` pass;
- `multitrip:tripinforendered` after each Trip Info renderer pass;
- final-only `japan2027:finalpatch` after the final Japan legacy reconciliation pass.

The old five-pass startup schedule (`120 / 350 / 800 / 1600 / 2600 ms`) was removed in Stage 5O. Stage 5P removes the remaining single `2600 ms` fallback, leaving `trip-v9-hotfix.js` with zero `setTimeout` calls.

## Why removal is now safe to test

Stage 5O established the event-driven path while retaining one fallback and then passed:

- full TravelPilot CI;
- manual Trip Info quick-nav verification;
- manual shrine info-button and modal verification;
- duplicate/reload verification;
- 96-item departure checklist verification;
- D6-D8, Today/Driving Mode, Live Cam and generic-trip smoke checks.

The loader order remains:

`trip-v9-final-fixes.js` → `trip-v9-hotfix.js` → `multi-trip-trip-info-renderer-v1.js`

Therefore the hotfix subscribes before Trip Info renderer events begin. The renderer continues to emit `multitrip:tripinforendered` after every render, and final-fixes continues to emit `japan2027:finalpatch` with `final: true` on the last `1500 ms` legacy pass.

## Cache/version

The hotfix module cache pin changes from `v=3` to `v=4` in both Japan loader chains.

Application release remains `v10.13.3`.

## Explicitly unchanged

- Trip Info quick-nav content and placement
- shrine info-button matching and modal content
- Trip Info renderer `250 / 900 ms` rerender timing
- final-fixes `250 / 700 / 1500 ms` timing
- D6-D8 selection key, localStorage behavior and `60 ms` reload
- D6-D8 visit metadata content/formatting
- itinerary renderer hydrate timing
- info-icon repair schedules
- 96-item Japan departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic-trip runtime chains
- homepage/banner
- itinerary and Trip Info content

## Manual smoke test before merge

1. Trip Info quick nav contains `🚆 火車` and `⛩️ 神社`.
2. Shrine `ⓘ` buttons appear once only.
3. Shrine deep-info modal opens and closes normally.
4. Refreshing does not duplicate nav items or info buttons.
5. The 96-item departure checklist is still present and persisted state is intact.
6. D6-D8 selection, Today/Driving Mode and Live Cam remain normal.
7. Generic trips such as Okinawa do not receive Japan-specific hotfix UI.

Do not merge until CI and the manual smoke test both pass and an explicit merge instruction is given.
