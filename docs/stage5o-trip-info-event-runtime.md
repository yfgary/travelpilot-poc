# Stage 5O — drive Trip Info hotfix from render events

Stage 5O is the runtime follow-up to the merged Stage 5N audit.

## Runtime change

`assets/trip-v9-hotfix.js` previously ran once at DOM ready and then retried at `120 / 350 / 800 / 1600 / 2600 ms`.

Stage 5O keeps the immediate DOM-ready pass, but moves normal Trip Info reconciliation onto explicit completion events:

- `multitrip:tripinforendered` after each Trip Info renderer pass
- final-only `japan2027:finalpatch` after the final `1500 ms` Japan legacy reconciliation pass

The old five-pass fixed retry schedule is removed. One bounded `2600 ms` fallback remains temporarily as a safety net while runtime parity is manually tested.

## Why this event path is safe to test

The Japan Trip Info loader order remains:

`trip-v9-final-fixes.js` → `trip-v9-hotfix.js` → `multi-trip-trip-info-renderer-v1.js`

That means the hotfix subscribes before Trip Info renderer events begin.

The Trip Info renderer emits `multitrip:tripinforendered` after every successful render and normally renders once when data is ready plus bounded rerenders at `250 / 900 ms`.

The Japan final-fixes layer emits `japan2027:finalpatch` after every legacy reconciliation pass, with only the final `1500 ms` pass carrying `final: true`. Stage 5O consumes only that final completion signal.

## Preserved ownership

`trip-v9-hotfix.js` still owns:

- Trip Info quick-nav repair (`🚆 火車` / `⛩️ 神社`)
- deep-info buttons under `#winter-shrines`
- the `v901TripInfoModal` modal and delegated click handling
- shared-core duplicate info-button cleanup

No modal content, matching rules, button behavior or Trip Info content changes are made.

## Cache/version

Only the hotfix module cache pin changes from `v=2` to `v=3` in both Japan loader chains.

Application release remains `v10.13.3`.

## Explicitly unchanged

- D6–D8 selection key, localStorage behavior and `60 ms` reload
- D6–D8 visit metadata content/formatting
- itinerary renderer hydrate timing
- Trip Info renderer `250 / 900 ms` rerender timing
- final-fixes `250 / 700 / 1500 ms` timing
- info-icon repair schedules
- 96-item Japan departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic-trip runtime chains
- homepage/banner
- itinerary and Trip Info content

## Manual smoke test before merge

Check Japan Trip Info after the branch is deployed or previewed:

1. quick nav still includes `🚆 火車` and `⛩️ 神社`;
2. shrine `ⓘ` buttons appear once only;
3. shrine deep-info modal opens and closes normally;
4. refreshing does not duplicate buttons or nav items;
5. the 96-item departure checklist is still present and state persists;
6. itinerary D6–D8 selection, Today/Driving Mode and Live Cam remain normal;
7. a generic trip such as Okinawa does not receive Japan-specific hotfix UI.

A later stage can audit removal of the remaining `2600 ms` fallback only after this event path passes CI and manual smoke testing.
