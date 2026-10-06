# Stage 5T — trim info-icon mid startup retry

## Scope

Stage 5T continues the staged migration of the Japan itinerary info-icon repair runtime toward renderer-event ownership.

Stage 5R moved `info-icon-repair-v1.js` before the itinerary renderer and added deterministic catch-up. Stage 5S then reduced the DOM-ready startup safety schedule from six passes to three. Stage 5T removes only the remaining middle startup pass.

## Runtime change

Before Stage 5T:

```js
function schedule(){[0,900,2800].forEach(t=>setTimeout(repair,t));}
```

After Stage 5T:

```js
function schedule(){[0,2800].forEach(t=>setTimeout(repair,t));}
```

The remaining two startup passes provide:

- an immediate DOM-ready repair pass;
- one late `2800 ms` safety fallback while the event path continues to prove stable.

## Preserved event and retry surfaces

Stage 5T does not change any of these:

```js
document.addEventListener('multitrip:itineraryrendered',()=>{[0,120,500].forEach(t=>setTimeout(repair,t));});
document.addEventListener('japan2027:languagechange',()=>{[0,250,800].forEach(t=>setTimeout(repair,t));});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.tripv2-choice'))[100,400,1000].forEach(t=>setTimeout(repair,t));},true);
```

The timer-free deterministic catch-up also remains:

```js
function catchUp(){if(document.documentElement.dataset.itineraryRenderer)repair();}
```

## Loader order

The Stage 5R loader ordering remains unchanged:

`Japan2027AttractionCore` → `trip-v9-1-visit-fix` → `info-icon-repair` → itinerary renderer → i18n.

This means the repair runtime subscribes to `multitrip:itineraryrendered` before normal renderer completion events can fire.

## Language support

The reserved `japan2027:languagechange` consumer is intentionally retained. Stage 5T does not add a visible language button and does not require a producer today. QA remains compatible with a future real language-change emitter.

## Cache pin

`assets/info-icon-repair-v1.js` changes from module pin `v=5` to `v=6`.

The application release remains `v10.13.3`.

## Protected surfaces

Stage 5T does not change:

- info-button matching or eligibility rules;
- itinerary renderer timing `0 / 350 / 900 / 1800 ms`;
- D6–D8 selection/localStorage/60 ms reload behavior;
- D6–D8 visit metadata;
- Trip Info runtime;
- the 96-item departure checklist;
- Today / Driving Mode;
- Live Cam;
- generic-trip runtime;
- homepage/banner;
- itinerary or Trip Info content.

## QA contract

Stage 5T QA requires:

- startup schedule exactly `0 / 2800 ms`;
- removed `0 / 900 / 2800 ms` startup schedule must not return;
- four logical retry surfaces remain: startup, itinerary-rendered, reserved language, choice-click;
- pre-render loader subscription order remains intact;
- deterministic catch-up remains;
- `japan2027:languagechange` repair hook remains;
- module pin is exactly `v=6` on the Japan itinerary chain;
- no Japan-specific repair leaks into generic trips.

## Manual smoke

Before merge, verify:

- Japan itinerary attraction `ⓘ` buttons appear normally;
- refreshing several times does not create duplicate `ⓘ` buttons;
- several `ⓘ` detail modals open normally;
- changing the D6–D8 Shinhotaka day and reloading keeps `ⓘ` buttons correct;
- Today / Driving Mode remains normal;
- Live Cam remains normal;
- Okinawa/generic trips do not gain Japan-specific info-icon behavior.
