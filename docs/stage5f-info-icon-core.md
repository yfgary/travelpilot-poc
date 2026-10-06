# Stage 5F — migrate itinerary info-icon repair onto the shared attraction core

Stage 5F continues the Stage 5E consolidation without removing any active Japan 2027 patch file. The goal is to eliminate the remaining duplicate attraction normalization/matching/button-creation primitives in `info-icon-repair-v1.js` while preserving its broader itinerary matching behavior.

## What moved to the shared core

`assets/info-icon-repair-v1.js` now delegates to `assets/japan2027-attraction-core-v1.js` for:

- text normalization
- alias/title best-match lookup
- the canonical info-button selector set
- info-button creation
- attaching `data-deep-info-id` to an existing button when that id is missing

The shared core gained opt-in normalization/matching options for this consumer. Its default behavior remains unchanged for the Stage 5E consumers (`trip-v9-hotfix.js` and `trip-v9-1-visit-fix.js`).

## Info-icon behavior explicitly preserved

The itinerary repair keeps the same matching surface and reconciliation triggers:

- heading text
- heading `data-map`
- heading `data-map-label`
- timeline-card `data-map`
- timeline-card text
- aliases plus stripped attraction titles
- `ⓘ` / `📍` converted to spacing before whitespace collapse
- variation selector U+FE0F removed during repair matching
- existing event-type eligibility exclusions unchanged
- an existing info button only receives `data-deep-info-id` when it was missing
- a newly created button keeps the same title and aria-label
- initial bounded retry schedule remains `0, 180, 450, 900, 1600, 2800, 4800, 7000 ms`
- `multitrip:itineraryrendered`, `japan2027:languagechange`, and D6–D8 choice click reconciliation remain unchanged

## Loader / cache behavior

- `japan2027-attraction-core-v1.js` module pin moves to `v=2` in both Japan loader chains.
- `info-icon-repair-v1.js` module pin moves to `v=2` in the Japan itinerary chain.
- `info-icon-repair-v1.js` remains itinerary-only and is blocked from generic-trip loader chains by QA.
- The application release remains `v10.13.3`; this is an internal behavior-preserving consolidation.

## Explicitly unchanged

- no itinerary content or timing changes
- no D6–D8 selection/storage changes
- no 96-item checklist changes
- no Today Mode or Driving Mode changes
- no Live Cam changes
- no generic-trip runtime changes
- no homepage/banner changes
- no active v9 patch file removed

## Next safe candidate

The remaining obvious overlap is bounded delayed reconciliation across the v9 patch files. Any reduction there should be audit-first: map which delayed passes are still required after renderer/language/choice events before changing or removing timers.
