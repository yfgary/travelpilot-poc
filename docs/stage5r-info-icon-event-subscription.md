# Stage 5R — establish deterministic info-icon event subscription

Stage 5R is the runtime follow-up to the merged Stage 5Q audit.

## Goal

Make the Japan itinerary `info-icon-repair-v1.js` subscribe to the itinerary renderer completion event before the renderer can emit it, without reducing any existing retry coverage yet.

## Runtime change

The Japan itinerary loader order changes from:

`... visit-fix → itinerary renderer → ... → i18n → i18n polish → info-icon repair`

to:

`... visit-fix → info-icon repair → itinerary renderer → ... → i18n → i18n polish`

`info-icon-repair-v1.js` still depends only on `Japan2027AttractionCore`, which remains loaded earlier in the chain.

Stage 5R also adds one deterministic, timer-free catch-up check:

- if the document already has `data-itinerary-renderer`, run `repair()` once immediately;
- otherwise normal `multitrip:itineraryrendered` events are now subscribed before renderer startup.

## Retry surface intentionally unchanged

Stage 5R does **not** remove or shorten any current info-icon retries:

- startup: `0 / 180 / 450 / 900 / 1600 / 2800 ms`
- itinerary-rendered: `0 / 120 / 500 ms`
- `japan2027:languagechange`: `0 / 250 / 800 ms`
- `.tripv2-choice` click: `100 / 400 / 1000 ms`

The next stage can reduce retries only after this event path passes CI and live UI parity testing.

## Known audit facts preserved

- `multitrip:itineraryrendered` is the explicit itinerary renderer completion signal.
- current language switching still uses localStorage + page reload; no active `japan2027:languagechange` producer has been confirmed in `i18n-v1.js`.
- the D6–D8 selector still reloads at `60 ms` after the choice state is stored.
- generic trips still do not load the Japan-specific info-icon repair module.

## Cache/version

Only the itinerary info-icon repair module pin changes from `v=3` to `v=4`.

Application release remains `v10.13.3`.

## Explicitly unchanged

- info-button matching and eligibility rules
- all four info-icon retry schedules
- itinerary renderer `0 / 350 / 900 / 1800 ms` hydrate timing
- D6–D8 selection key, localStorage behavior and `60 ms` reload
- D6–D8 visit metadata
- Trip Info event-driven hotfix runtime
- 96-item Japan departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic-trip runtime chains
- homepage/banner
- itinerary and Trip Info content

## Manual smoke test before merge

1. open Japan itinerary and confirm attraction `ⓘ` buttons appear normally;
2. refresh several times and confirm no duplicate info buttons;
3. open several `ⓘ` detail panels/modals and confirm they still work;
4. switch to English and back to Chinese and confirm info buttons remain available after reload;
5. change D6–D8 Shinhotaka day and confirm the itinerary reload still has the correct info buttons;
6. confirm Today/Driving Mode and Live Cam remain normal;
7. confirm a generic trip such as Okinawa does not receive Japan-specific info-icon behavior.
