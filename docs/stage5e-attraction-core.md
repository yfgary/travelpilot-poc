# Stage 5E — shared Japan 2027 attraction core

Stage 5E is the first runtime consolidation slice after the Stage 5D audit. It intentionally does **not** remove any active v9 patch file.

## What moved into the shared core

`assets/japan2027-attraction-core-v1.js` now owns the duplicated primitives used by the Japan 2027 Trip Info hotfix and D6–D8 visit patch:

- the canonical info-button selector set
- attraction text normalization
- alias/title best-match lookup
- attraction lookup by id
- safe info-button creation / deep-info id attachment
- duplicate info-button cleanup, preserving the previous preference for generic buttons over `v90-shrine-info-btn`

## Runtime consumers

`trip-v9-hotfix.js` now delegates attraction matching, duplicate-button cleanup and button creation to the shared core while retaining ownership of:

- Trip Info shrine navigation links
- Trip Info shrine detail modal
- Trip Info shrine click handling
- its existing bounded delayed reconciliation passes

`trip-v9-1-visit-fix.js` now delegates attraction matching and button creation to the shared core while retaining ownership of:

- D6–D8 visit metadata cards
- visit opening / last-entry / closing / fee display
- map-pin refresh
- its existing bounded delayed reconciliation passes

## Explicitly unchanged

- `trip-v9-final-fixes.js` remains active and unchanged
- `info-icon-repair-v1.js` remains active and unchanged for this slice
- no itinerary or Trip Info content was changed
- no D6–D8 selection/storage behavior was changed
- no checklist, Today Mode, Driving Mode, Live Cam, generic-trip, homepage or banner behavior was changed

## Loader / cache behavior

The shared core is loaded only in the Japan legacy itinerary and Trip Info chains, after `trip-enhancement-data.js` and before the two consumers. Generic trips do not load it.

The application release remains `v10.13.3`; this is a behavior-preserving internal refactor. The two modified legacy consumers receive module-level cache-buster updates so the refactored code is fetched without changing the app release badge.

## Next consolidation candidate

The remaining attraction-resolution overlap is `info-icon-repair-v1.js`. A later stage can migrate that file onto the shared core only after preserving its broader matching surface (heading attributes, card text and event-type eligibility rules).
