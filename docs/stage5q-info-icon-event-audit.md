# Stage 5Q — audit itinerary info-icon retry/event ownership

Stage 5Q is an audit-only follow-up after Stage 5P removed the last Trip Info startup fallback.

## Scope

Audit `assets/info-icon-repair-v1.js`, which is now the largest remaining Japan itinerary retry surface, without changing runtime behavior.

Current schedules are intentionally preserved in this stage:

- startup: `0 / 180 / 450 / 900 / 1600 / 2800 ms`
- after `multitrip:itineraryrendered`: `0 / 120 / 500 ms`
- after `japan2027:languagechange`: `0 / 250 / 800 ms`
- after `.tripv2-choice` click: `100 / 400 / 1000 ms`

## Findings

### 1. Renderer event is real, but repair currently loads after the renderer

The Japan itinerary loader currently places:

`multi-trip-itinerary-renderer-v1.js` … `i18n-v1.js` … `i18n-polish-en-v1.js` … `info-icon-repair-v1.js`

`info-icon-repair-v1.js` therefore cannot be assumed to observe the renderer's earliest completion event. Its startup schedule still acts as a late catch-up path.

A later runtime migration should first decide whether to move the repair subscriber before the renderer, add an explicit post-load catch-up call, or expose a replayable completion state. Removing startup retries before that would be premature.

### 2. `multitrip:itineraryrendered` is the strongest existing completion signal

The repair already consumes `multitrip:itineraryrendered`, and the itinerary renderer dispatches that event after successful rendering. This is the best candidate for normal reconciliation once subscriber timing is made deterministic.

### 3. `japan2027:languagechange` has no confirmed producer in the active i18n runtime

`info-icon-repair-v1.js` listens for `japan2027:languagechange`, but `assets/i18n-v1.js` changes language by writing localStorage and reloading the page. Its active runtime does not expose that custom event as the language-switch contract.

Therefore Stage 5Q treats the listener as **unproven/dead until an emitter is identified**. It must not be used as justification for removing other retries.

### 4. `.tripv2-choice` click retries overlap a reload-based D6–D8 path

The current D6–D8 selector in `trip-v9-final-fixes.js` handles `#tripv2WeatherSelect [data-sh]`, updates localStorage and reloads after `60 ms`.

The repair listener is broader (`.tripv2-choice`) and schedules repairs at `100 / 400 / 1000 ms`. For the known D6–D8 selection path, the page reload happens before those retries can be useful. However the broader selector may cover other choice controls, so Stage 5Q does not remove it without a complete ownership audit.

## Safe next runtime direction

A later stage can isolate one change at a time:

1. make renderer-event subscription timing deterministic (preferably load repair before the renderer or add an explicit catch-up API/state);
2. keep an immediate repair pass;
3. then reduce the startup retry tail in a separately tested stage;
4. independently confirm whether `japan2027:languagechange` has any producer before deleting or replacing that listener;
5. independently enumerate every `.tripv2-choice` source before removing its retry path.

## Explicitly unchanged

- `info-icon-repair-v1.js` runtime code and all four retry schedules
- itinerary renderer timing
- D6–D8 selection key/localStorage/`60 ms` reload
- D6–D8 visit metadata
- Trip Info event-driven hotfix from Stage 5P
- 96-item Japan departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic-trip runtime
- homepage/banner
- itinerary and Trip Info content

## Version

Application release remains `v10.13.3`.
