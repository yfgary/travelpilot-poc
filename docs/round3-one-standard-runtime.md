# Round 3 — One Standard Runtime / Generic Shell

Round 3 removes page-owned boot routing. The four shared pages now start through one runtime entry:

- `itinerary.html`
- `trip-info.html`
- `attractions.html`
- `live.html`

Canonical entry:

`assets/multi-trip-runtime-v1.js`

## What changed

Before Round 3 there were four boot paths:

1. itinerary / Trip Info used `attraction-info.js`
2. Attractions had its own inline trip router
3. Live loaded `site-shell-v7.js` directly
4. the Service Worker could inject a separate Live entry

After Round 3 every shared page directly loads the same Multi-Trip runtime. The Service Worker also restores that same runtime entry when serving an older cached `live.html`.

`attraction-info.js` remains only as a backwards-compatibility shim for older cached HTML and contains no trip routing or dependency ownership.

## Compatibility boundary

This round deliberately does **not** remove Japan 2027 legacy behaviour. The Standard runtime owns the boot decision, but the Golden Reference trip can still select a legacy compatibility dependency set while migration continues.

That means D6–D8 manual selection and weather recommendation remain unchanged in Round 3.

The compatibility dependency sets are migration debt. Later rounds move their features into shared renderers until the legacy sets can be deleted.

## Standard-trip isolation

Generic trip dependency sets are forbidden from loading Japan-only assets such as:

- `trip-core-v1.js`
- `site-shell-v7.js`
- `d6-d8-weather-decision-v1.js`
- `trip-v8*`
- `trip-v9*`
- `japan2027-*`

The loader QA checks this automatically.

## QA gates

`scripts/qa_loader.py` now verifies:

- every shared page contains exactly one direct `multi-trip-runtime-v1.js` entry
- no page keeps a second local runtime owner
- dependency arrays contain no duplicate or missing asset
- generic dependency sets contain no Japan-only runtime
- Attractions and Live use their shared renderer/entry
- `attraction-info.js` is only a compatibility shim
- Service Worker Live migration uses the same Standard runtime entry

Golden Reference browser parity remains the final presentation gate.

## Round 3 exit criteria

Round 3 is complete only when:

1. release QA passes on v10.17.0
2. Standard data-contract QA passes
3. one-entry runtime/loader QA passes
4. all existing static QA passes
5. Golden Reference DOM / interaction / screenshot parity passes
6. POC Pages deployment succeeds
7. Production remains untouched
