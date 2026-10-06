# Stage 5D — v9 patch consolidation audit

This stage is audit-only. It does not change runtime behavior or remove any active Japan 2027 patch file.

## Scope

The audit focuses on the three active patch-era scripts still loaded by `assets/attraction-info.js` for the Shirakawago / Shinhotaka 2027 trip:

- `assets/trip-v9-final-fixes.js`
- `assets/trip-v9-hotfix.js`
- `assets/trip-v9-1-visit-fix.js`

## Current ownership map

### `trip-v9-final-fixes.js`

Still owns several Japan-2027-specific itinerary fixes, including D6–D8 Shinhotaka selection/state, itinerary photo replacement/zoom support, shrine/deep-info presentation and additional patch-era itinerary mutations. It therefore remains active and is not a deletion candidate in Stage 5D.

### `trip-v9-hotfix.js`

Primarily patches Trip Info shrine/deep-info behavior. It creates its own detail modal, repairs/normalizes info buttons, removes duplicate info buttons, adds Trip Info quick-nav entries and uses delayed retry passes to re-apply those fixes after other scripts mutate the page.

### `trip-v9-1-visit-fix.js`

Primarily patches D6–D8 itinerary attraction cards. It finds matching attraction data, ensures an info button exists, injects visit metadata (opening/closing/fee/photo-warning information) and then asks the map-pin layer to refresh. It runs through delayed retry passes.

## Confirmed overlap / consolidation pressure

These scripts are not identical, but they overlap in the same DOM ownership areas:

1. **Attraction info buttons** — all three participate in, style, create, normalize or consume patch-era info-button variants such as `.enhance-info-btn`, `.attraction-info-btn`, `.backup-info-btn` and `.v90-shrine-info-btn`.
2. **Attraction matching / deep-info data** — both `trip-v9-hotfix.js` and `trip-v9-1-visit-fix.js` resolve attraction records from `window.Japan2027EnhancementData` by card/heading text.
3. **D6–D8 patch surface** — `trip-v9-final-fixes.js` owns the Shinhotaka day selection and D6–D8 presentation changes, while `trip-v9-1-visit-fix.js` decorates those same D6–D8 cards with visit metadata/info buttons.
4. **Repeated delayed reconciliation** — the patch files rely on delayed `setTimeout` passes because multiple legacy layers mutate the same page after initial load. This is the main architectural debt to remove later; it should not be replaced by another global observer.
5. **Modal / click ownership** — patch-era deep-info click behavior is spread across more than one layer. Consolidation must preserve one authoritative click owner and avoid duplicate modal/open handlers.

## Safe next consolidation order

Stage 5D recommends a later runtime-change stage in this order:

1. Extract a single shared attraction resolver / info-button normalizer for Japan 2027.
2. Move D6–D8 visit metadata decoration into that canonical helper while keeping the existing output and storage behavior unchanged.
3. Move Trip Info shrine modal/button wiring to the same helper or to the canonical Trip Info renderer.
4. Only after regression coverage proves parity, remove `trip-v9-hotfix.js` and/or `trip-v9-1-visit-fix.js` from the loader.
5. Leave `trip-v9-final-fixes.js` for last because it still owns broader D2/D6–D8 itinerary behavior beyond the overlapping info-button surface.

## Regression requirements before any removal

A consolidation PR must explicitly verify:

- D6/D7/D8 Shinhotaka selection persists and remains visually correct.
- D6–D8 attraction cards retain exactly one info button.
- Visit metadata cards are still present once, not duplicated.
- Trip Info shrine navigation entries remain present once.
- Trip Info shrine detail modal opens once and closes correctly.
- Map pins continue to refresh after D6–D8 card decoration.
- 96-item departure checklist is untouched.
- Today Mode, Driving Mode, Live Cam and generic trips are untouched.

## Stage 5D decision

No active v9 file is removed in this audit stage. The overlap is real, but the files still own distinct live behavior. The next runtime stage should consolidate the info-button / attraction-resolution surface first rather than attempting a wholesale v9 deletion.
