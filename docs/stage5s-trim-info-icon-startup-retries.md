# Stage 5S — Trim info-icon startup retries

## Scope

Stage 5S is the first runtime reduction after Stage 5R made `info-icon-repair-v1.js` subscribe before the itinerary renderer and added a deterministic catch-up pass.

This stage reduces only the DOM-ready startup retry schedule. It does not remove the renderer-event, reserved language, or choice-click repair surfaces.

## Runtime change

Before Stage 5S:

```js
function schedule(){[0,180,450,900,1600,2800].forEach(t=>setTimeout(repair,t));}
```

Stage 5S:

```js
function schedule(){[0,900,2800].forEach(t=>setTimeout(repair,t));}
```

The startup schedule therefore moves from six repair attempts to three:

- `0 ms`: immediate DOM-ready safety pass
- `900 ms`: bounded mid-startup safety pass
- `2800 ms`: retained late fallback

## Event coverage retained

The normal renderer completion path remains unchanged:

```js
document.addEventListener('multitrip:itineraryrendered',()=>{[0,120,500].forEach(t=>setTimeout(repair,t));});
```

Stage 5R loader ordering is also retained:

```text
Japan2027AttractionCore
→ trip-v9-1-visit-fix
→ info-icon-repair
→ multi-trip-itinerary-renderer
```

This means normal renderer events are subscribed before the renderer runs.

The timer-free deterministic catch-up also remains:

```js
function catchUp(){if(document.documentElement.dataset.itineraryRenderer)repair();}
```

## Language support retained

The reserved language repair hook remains unchanged:

```js
document.addEventListener('japan2027:languagechange',()=>{[0,250,800].forEach(t=>setTimeout(repair,t));});
```

The current UI may not expose a language-switch button, but this hook is intentionally retained for future language support. QA must not reject a future `japan2027:languagechange` producer being added to the i18n runtime.

## Choice repair retained

The broad `.tripv2-choice` click repair schedule remains unchanged:

```js
[100,400,1000].forEach(t=>setTimeout(repair,t))
```

D6–D8 selection still owns its existing localStorage behavior and `60 ms` reload in `trip-v9-final-fixes.js`.

## Cache pin

`info-icon-repair-v1.js` changes from module pin `v=4` to `v=5` in the Japan itinerary loader chain.

The application release remains `v10.13.3`.

## Protected surfaces

Stage 5S does not change:

- info-button matching or eligibility rules
- itinerary renderer `0 / 350 / 900 / 1800 ms` timing
- renderer-event repair `0 / 120 / 500 ms` timing
- reserved language repair `0 / 250 / 800 ms` timing
- `.tripv2-choice` repair `100 / 400 / 1000 ms` timing
- D6–D8 selection/localStorage/`60 ms` reload behavior
- D6–D8 visit metadata
- Trip Info event-driven runtime
- 96-item departure checklist
- Today Mode / Driving Mode
- Live Cam
- generic-trip runtime
- homepage/banner
- itinerary or Trip Info content

## Manual smoke test

After CI is green, verify:

1. Japan itinerary attraction `ⓘ` buttons appear normally.
2. Repeated refreshes do not create duplicate `ⓘ` buttons.
3. Several attraction detail modals open correctly.
4. Changing the D6–D8 Shinhotaka day still reloads and restores `ⓘ` buttons correctly.
5. Today Mode / Driving Mode remain normal.
6. Live Cam remains normal.
7. Okinawa / generic trips do not receive Japan-specific info-icon behavior.

Do not require a visible language-switch button for this stage. The language hook is retained for future use.
