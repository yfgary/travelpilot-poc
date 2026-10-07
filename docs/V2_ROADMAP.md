# TravelPilot V2 — Roadmap

## Phase 0 — Freeze/reference
- Keep production untouched.
- Preserve current POC/V1 state as reference before functional V2 implementation.
- V1 = Golden Visual Reference.
- Japan 2027 / Shirakawa-go = Golden Content Reference.

## Phase 1 — Specification and architecture
- Master Spec
- Architecture
- Database schema
- Decision Log
- AGENTS.md
- Current State / handoff discipline

**Exit criteria:** architecture rules are documented before application rewrite begins.

## Phase 2 — Foundation
Bounded Codex task:
- shared app shell
- routing
- PWA manifest
- shared layout
- Supabase client framework
- version framework
- dummy trip only

Do not implement full weather/live cam/full itinerary yet.

## Phase 3 — V1 UI parity foundation
- Home
- branding/banner/icon
- trip cards
- responsive iPhone/desktop layout
- version indicator
- online/offline status
- global font sizing

## Phase 4 — Multi-trip proof
- two unrelated sample trips
- one shared renderer
- no custom trip HTML
- no trip/country/day special cases
- correct navigation and data isolation

**Gate:** Do not continue if adding the second trip requires core-code special cases.

## Phase 5 — Detailed itinerary engine
- collapsible day groups
- route/highlights
- 1-large + 2-small gallery
- generic timeline
- Maps action
- place/attraction content
- hotel content
- backup places
- place detail
- attraction rating

## Phase 6 — Weather and suitability
- current weather
- 5-day forecast
- all required metrics
- region selector
- mobile horizontal forecast
- generic activity-category suitability engine

## Phase 7 — Trip Information
- transport
- rental cars
- hotels
- hard cuts
- emergency info
- pre-departure checklist
- morning checklist
- Supabase login and cross-device checklist sync

## Phase 8 — Attractions Overview
- derive from canonical places referenced by itinerary
- group by region
- reuse place records

## Phase 9 — Live Cam
- generic source records
- group by region/route
- supported embed/snapshot/external-link behaviours
- escalate brittle provider-specific requirements

## Phase 10 — Today Mode
- date auto-selection
- manual day selection
- previous/current/next activity
- Maps
- current weather
- hard cuts
- next planned start
- today's hotel/final destination
- live date/time header

## Phase 11 — Offline/update system
- installable PWA
- app-shell offline
- downloaded trip data offline
- essential images offline
- local-first checklist
- background version check/download
- non-disruptive update activation

## Phase 12 — Real trip migration
1. Japan 2027 first, to Golden Content detail level.
2. Migrate the other existing trips.
3. Confirm each migration is data-only and does not require trip-specific core changes.

## Phase 13 — Full QA / production migration decision
Test:
- iPhone
- iPad
- desktop
- online/offline
- login/logout
- checklist sync
- PWA install
- version/update
- all seven pages
- multi-trip data isolation
- V1 feature parity

Only after successful QA should production migration be planned.
