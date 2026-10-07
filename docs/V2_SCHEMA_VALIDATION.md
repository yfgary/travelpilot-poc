# TravelPilot V2 — Golden Content Schema Validation

Date: 08/10/2026  
Reference repository: `yfgary/travelpilot`  
Reference trip: `trips/shirakawago-shinhotaka-2027/`

## Purpose
Validate the V2 data model against the most detailed existing trip before implementation begins.

## Reference files inspected
- `trip.json`
- `itinerary.json`
- `attractions.json`
- `hotels.json`
- `trip-info.json`
- `weather.json`
- `live-cams.json`
- `departure-checklist.json`
- `manifest.webmanifest`
- `sw.js`
- `version.json`

## Findings

### 1. Core schema direction is valid
The existing Golden Content trip can be represented by the proposed shared entities:
- trips
- trip_days
- timeline_items
- places
- hotels/accommodation
- transport
- weather_locations
- activity categories
- live cams
- checklists
- hard cuts
- emergency info
- user preferences
- app/trip versions

No trip-specific HTML is required in the V2 model.

### 2. Additional generic entities/fields are required
The production trip exposed important reusable concepts that were not explicit enough in the first schema draft:
- parking / entrance / pickup navigation targets
- richer hotel payment/cancellation/parking detail
- checklist grouping and validation metadata
- timeline navigation metadata
- generic optional/bonus items
- generic warnings/constraints
- flexible live-cam grouping
- weather activity-profile weights
- richer hard-cut metadata

These have now been added to the schema guidance.

### 3. Do not migrate legacy implementation patterns
The production trip contains legacy concepts such as:
- hydrate/preserveLegacy render modes
- per-trip legacy module references
- page filenames
- storage keys
- D6–D8 special-case decision logic
- direct legacy asset references

These are **reference data only** and must not be copied into V2 architecture.

### 4. Important itinerary freshness warning
The production/reference Japan 2027 trip still contains legacy D6–D8 flexible-weather scheduling. The user's newer plan may differ.

Therefore:
- V1 is the Golden Visual/Content-detail reference.
- V1 is **not automatically the latest itinerary source**.
- When Japan 2027 is migrated into V2, the latest user-approved itinerary must be confirmed/used.

### 5. PWA lessons from V1
V1 already has:
- a web app manifest
- standalone display mode
- a service worker
- offline cache
- version metadata

V2 should keep the successful product behaviour but replace hard-coded asset/trip cache lists with a generic manifest/data-driven download strategy.

### 6. Supabase
The repository search did not expose obvious Supabase client configuration strings in the inspected production source. The user has confirmed Supabase is already used in V1.

Do not guess credentials or schema. Before implementing V2 auth/sync:
- inspect the existing Supabase project/table structure through the available Supabase connection if accessible, or
- ask the user for the existing schema/config details if required.

No implementation is blocked yet because Phase 1 is architecture-only.

## Result
**PASS with schema amendments.**

The V2 architecture can proceed to Foundation after the current docs are updated and the first bounded implementation task is prepared.

## Phase 2 gate
Before Codex writes Foundation code:
- keep production untouched
- use POC only
- create a generic app shell
- use dummy/sample trip data
- do not migrate Japan 2027 yet
- do not implement full weather/live cam/checklist sync yet
