# TravelPilot V2 — 16-Step Roadmap

The step number is the primary progress indicator used in chat and `V2_CURRENT_STATE.md`.

## Step 1/16 — Requirements + Golden Reference + schema validation
**Status: COMPLETE**
- freeze production as reference
- clean POC to V2-only
- Master Spec / AGENTS / handoff docs
- inspect Japan 2027 Golden Content
- validate required generic concepts

## Step 2/16 — Lock V2 technical architecture
**Status: COMPLETE**
- React + TypeScript + Vite
- hash routing for GitHub Pages
- versioned JSONB trip snapshots
- V2 Supabase table isolation using `v2_`
- IndexedDB + Cache Storage offline model
- generic weather scoring design
- lower-left online/offline + app version rule
- no trip-specific hard-coded logic

## Step 3/16 — Codex Foundation scaffold
- create React/TypeScript/Vite project
- basic build
- hash router
- seven empty shared routes/views
- canonical icon/banner wiring
- PWA manifest skeleton
- basic version metadata
- no real trip migration

## Step 4/16 — Shared UI shell + responsive baseline
- V1-inspired header/navigation/layout
- iPhone + desktop responsive behaviour
- global typography/font-size system
- lower-left online/offline + version status
- shared loading/error/empty states

## Step 5/16 — Supabase V2 foundation
- create only approved `v2_` tables
- RLS/policies
- frontend Supabase client
- Settings login/logout
- preserve V1 tables untouched
- run advisors after DDL

## Step 6/16 — Trip schema + versioned data loader
- TypeScript schema/validation
- dummy trip payload format
- Supabase snapshot loader
- IndexedDB trip cache
- App Version / Trip Data Version handling
- validation/error handling

## Step 7/16 — Multi-Trip proof
- two unrelated dummy trips
- same renderer/routes/components
- home sorting/status
- no special-case code
- fail the gate if second trip requires core changes

## Step 8/16 — Home page parity
- TravelPilot｜旅程管家
- banner/icon
- refined copy
- trip cards
- upcoming/completed status
- dates/shortcuts
- mobile/desktop parity with V1 visual language

## Step 9/16 — Detailed Itinerary engine
- day accordions
- route/highlights
- 1 large + 2 small gallery
- generic timeline
- Maps/navigation
- accommodation section
- backup/bonus items
- place detail
- ratings

## Step 10/16 — Trip Information
- transport
- rental car
- accommodations
- navigation/parking
- hard cuts
- emergency info
- checklist definitions

## Step 11/16 — Settings + checklist local-first sync
- Supabase auth UX
- Small/Medium/Large font preference
- checklist offline state
- sync queue
- cross-device sync
- cache/offline controls
- version/update details
- future language placeholder

## Step 12/16 — Weather + suitability
- current + 5-day weather
- all required metrics
- region selector
- mobile horizontal forecast
- Experience + Access/Safety scoring
- safety caps / generic activity profiles
- no named-place scoring branches

## Step 13/16 — Attractions Overview + Live Cam
- derive canonical places from trip payload
- group attractions by region
- generic Live Cam groups/source capabilities
- external fallback for unsupported embeds

## Step 14/16 — Today Mode
- date-based auto day selection
- manual day selection
- previous/current/next
- Maps
- current weather
- hard cuts
- next planned time
- accommodation/final destination
- live DD/MM/YYYY + HH:MM:SS

## Step 15/16 — Real trip migration + ChatGPT content pipeline
- migrate latest approved Japan 2027 first
- reach Golden Content detail level
- add/research images, attraction information and sources
- migrate remaining trips
- prove each trip addition is data-only

## Step 16/16 — Full QA + production migration
- iPhone / iPad / desktop
- online / offline
- installable PWA
- login/logout
- checklist sync
- version/update
- all seven views
- no cross-trip leakage
- V1 visual/function parity
- production migration only after user approval
