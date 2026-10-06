# Stage 6A — Stable baseline release

## Purpose

Promote the completed Stage 5 multi-trip/runtime cleanup into a new production baseline without changing itinerary content or UI behavior.

## Release

- Previous production baseline: `v10.13.3`
- New stable baseline: `v10.14.0`
- Build: `2026-10-05.74`

## Release-owned pins updated

- `version.json`
- `assets/multi-trip-context-v1.js` `APP_VERSION`
- homepage manifest / CSS / shared runtime / icon cache-busters
- manifest icon cache-busters
- legacy `attraction-info.js` shared runtime pin
- Live Cam entry shared runtime pin
- Service Worker cache identity
- Service Worker Live Cam injected entry pin

Module-owned pins are intentionally unchanged, including the Stage 5U `info-icon-repair-v1.js?v=7` pin.

## Baseline represented by v10.14.0

This release captures the stable state after the Stage 5 cleanup line, including:

- multi-trip routing and generic-trip isolation
- Trip Info renderer reconciliation via lifecycle events
- Japan departure checklist canonical count of 96 items
- D6–D8 Shinhotaka selection ownership and 60 ms reload behavior
- visit metadata reconciliation via renderer/finalpatch events
- info-icon repair loaded before the itinerary renderer
- info-icon startup and D6–D8 choice fallback timers removed
- reserved `japan2027:languagechange` repair hook retained for future language switching
- Today / Driving Mode and Live Cam protected surfaces unchanged

## QA contract

`qa_release.py` now treats `10.13.3` as the immediately previous production release and rejects stale release-owned pins, including the legacy loader pin.

All existing static QA remains required, including release consistency, the 96-item checklist guard, loader dependency checks, patch/timer event ownership checks and JavaScript syntax validation.

## Runtime impact

No itinerary content, Trip Info content, checklist content, navigation behavior, D6–D8 logic, Today/Driving Mode behavior, Live Cam behavior, generic-trip behavior or language behavior is intentionally changed by Stage 6A.
