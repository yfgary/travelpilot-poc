# Stage 5U — final info-icon timer cleanup

## Purpose

Complete the Stage 5Q–5U info-icon retry migration and stop this cleanup line after one final parity check.

Stage 5U removes the two remaining fallback surfaces that are no longer needed after Stage 5R established deterministic renderer-event subscription:

- the `0 / 2800 ms` DOM-ready startup schedule;
- the `.tripv2-choice` `100 / 400 / 1000 ms` click repair schedule.

The reserved language repair path is intentionally retained for future language switching.

## Runtime after Stage 5U

`assets/info-icon-repair-v1.js` now reconciles through:

1. `multitrip:itineraryrendered`
   - bounded repair passes at `0 / 120 / 500 ms`;
2. timer-free `catchUp()`
   - if the module is loaded after a renderer result already exists, `dataset.itineraryRenderer` triggers one immediate repair;
3. reserved `japan2027:languagechange`
   - bounded repair passes at `0 / 250 / 800 ms` for future language switching.

There is no DOM-ready startup retry schedule and no choice-click retry in the info-icon module.

The module therefore contains exactly two `setTimeout` surfaces: renderer reconciliation and the reserved language lifecycle hook.

## Why the final 2800 ms startup fallback can be removed

Stage 5R moved `info-icon-repair-v1.js` before `multi-trip-itinerary-renderer-v1.js` in the Japan itinerary loader chain.

The renderer:

- marks `document.documentElement.dataset.itineraryRenderer` when hydrate/generate completes;
- dispatches `multitrip:itineraryrendered` after rendering;
- retains its bounded Japan hydrate passes at `0 / 350 / 900 / 1800 ms`.

Therefore the info-icon repair subscribes before normal renderer completion and receives lifecycle events for the render passes. The deterministic catch-up remains for late/dynamic loading.

Stages 5R, 5S and 5T were each CI-verified and manually smoke-tested while the startup schedule was reduced progressively from six passes to three, then two. This provides parity evidence before removing the last startup fallback.

## Why the `.tripv2-choice` repair can be removed

The active `.tripv2-choice` UI is the D6–D8 Shinhotaka selector in `itinerary.html` (`#tripv2WeatherSelect`, `data-sh=d6/d7/d8/reset`).

`trip-v9-final-fixes.js` already owns that state transition using a capture listener on `#tripv2WeatherSelect [data-sh]`:

- write/remove `japanWinter2027_shinhotakaDay`;
- update selected state;
- reload after 60 ms.

The former info-icon repair passes at `100 / 400 / 1000 ms` therefore occur after the page transition and are not needed for the current selector lifecycle. After reload, normal renderer events reconcile info icons.

This stage does **not** change the protected D6–D8 localStorage key or the 60 ms reload behavior.

## Language support

Keep `japan2027:languagechange` support.

The current visible language switch still uses reload, but Stage 5U deliberately leaves the repair hook in place so a future language-switch implementation can emit the event without reopening this cleanup work.

Stage 5U does not add a language button.

## Loader/version

- `info-icon-repair-v1.js` cache pin: `v=6` → `v=7`.
- application release remains `v10.13.3`.
- repair remains Japan-itinerary-only.
- generic itinerary and generic Trip Info chains remain unchanged.

## Protected surfaces

No changes to:

- 96-item Japan departure checklist;
- D6–D8 selection key, choice UI, selected-state behavior or 60 ms reload;
- D6–D8 visit metadata;
- itinerary renderer hydrate timing;
- Trip Info event-driven runtime;
- Today / Driving Mode;
- Live Cam;
- generic trips;
- homepage/banner;
- itinerary or Trip Info content;
- reserved language hook.

## QA contract

Stage 5U QA must prove:

- no info-icon startup `schedule()` remains;
- no info-icon `.tripv2-choice` retry remains;
- exactly two `setTimeout` tokens remain in `info-icon-repair-v1.js`;
- renderer event repair remains `0 / 120 / 500 ms`;
- language event repair remains `0 / 250 / 800 ms`;
- `catchUp()` remains;
- loader order remains `core < visit-fix < info-icon-repair < renderer < i18n < polish`;
- module pin is `v=7` exactly once in the Japan itinerary chain;
- generic chains do not load Japan info-icon repair;
- D6–D8 60 ms reload contract is unchanged.

## Final manual smoke

Before merge:

- Japan itinerary attraction `ⓘ` icons appear normally after load;
- refresh several times: no missing or duplicate `ⓘ`;
- open several attraction detail modals;
- change the D6–D8 Shinhotaka day and confirm icons remain correct after reload;
- Today / Driving Mode still work;
- Live Cam still works;
- Okinawa/generic trip still has no Japan-specific info-icon behavior.

After this stage passes CI and manual smoke, the Stage 5Q–5U info-icon timer cleanup line is complete. No further retry-reduction stage is planned unless a real regression is found.