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


## Step 12 — Schema 3 weather configuration gate

At the Step 12 release, current Trip Schema was 3 and supported strict contracts were 1/2/3. `src/data/schema/trip.ts` remains the canonical snapshot validator and composes `schema/weather.ts`; types are inferred. Actual Schema 1 archives and newly frozen pre-Step12 Schema 2 snapshots validate unchanged. The loader requires row/payload version consistency and preserves the source version. Original IndexedDB trip stores/name/storage version remain intact; read tests guard against writes, upgrades or old-cache deletion.

Schema 3 validates forecast-provider IDs/adapter/safe JSON config, region provider references/location/elevation/coordinate fallback, explicit day-region references/unique mappings, activity-profile metric rules/strictly ordered curves/positive weights, independent score parts, accessShare/caps/coverage ranges and operation metadata. Alert-provider config uses the same safe config boundary and validates known demo seed fields, allowed region scope and duplicate IDs. Globally stable provider IDs share the snapshot uniqueness audit. Unknown future adapter IDs degrade gracefully, never infer services from destination/country/timezone.

Normalized WeatherForecast validates trip/region/provider/timezone/fetchedAt/current timestamp/current metrics, five chronological local forecast dates, daily temperature ranges, finite percentages/nonnegative physical units and attribution. Open-Meteo units/chronological aligned raw series/hourly values are checked before normalization; null/missing metrics stay unavailable. Daily hourly aggregation/noon sampling and timezone tests cover conversions. OfficialAlert validates stable ID/type/severity/timestamps/region/provider/source/test provenance; framework filtering protects provider scope and active dates.

Scoring tests cover independent Experience/Access, data-defined curves/weights/share/caps, high Experience with unsafe Access, missing metric exclusion/weighted coverage, baseline coverage separation, one-decimal clamp/round, minimum aggregate Access/raw cap thresholds and operation caveats. Day tests score only exact dates and mappings. Weather-cache tests exercise TTL/manual/failure/offline/config signatures/tampering/isolation/dedup/late responses. Mobile/all-font tests and screenshot review cover shared UI, fictional/absent alerts, horizontal forecast, trend labels and status clearance. No destination-specific fields/branches, live Supabase migration/writes, V1 changes or Step 13 work.

Final test count and gate evidence are recorded in `V2_CURRENT_STATE.md` once all acceptance checks pass.

## Step 13 — Schema 4 Attractions / Live Cam gate

Current Trip Schema is 4; supported strict contracts are 1/2/3/4. Schema 1/2 archives and frozen actual pre-Step13 Schema 3 city/road snapshots validate unchanged. Tests reject new camera fields in older contracts, unsupported Schema 5, malformed/missing/duplicate/broken routeDayIds, broken region/place references, inconsistent region/place association, invalid priority, blank tags and unsafe source/preview/official/status URLs. One canonical Zod schema composition infers types and shares reference validation. No required old field was weakened.

Physical Schema 1/2/3 cache tests verify the actual old payload and source-version metadata on Attractions and Live Cam routes, with no trip-store write/delete/upgrade. Schema 4 remote/cache/reload/offline tests retain row/payload consistency and isolated data versions. Existing weather Schema 3 tests continue using frozen actual Schema 3 data, while current Schema 4 fixtures exercise unchanged rich weather behavior.

Canonical Place usage tests cover main/optional/bonus/optionalContent/backupContent, overlapping status counts, deduplicated days/occurrences, immutable arrays, deterministic region/day/status/name/ID ordering, unreferenced omission and text/image fallback. Camera tests cover explicit/place/global regions, linked-day filters, multi-day uniqueness, metadata, three capabilities, HTTPS-only inline behavior, HTTP external fallback, failures and deduplicated safe actions. Single load boundary, original stores, frozen archives, unchanged assets/SQL and absence of destination/provider hacks are source-audited. Automated external requests are mocked; no real account/password or live test writes.

Responsive screenshot review and final complete regression results are recorded in V2_CURRENT_STATE.md. Today Mode and real trip migration remain outside this gate.


## Step 15B.1 — Schema 5 exact timing gate

Current Trip Schema is 5; supported strict readers are 1/2/3/4/5. Focused tests cover same-zone, cross-zone, overnight/date-line intervals, missing/invalid offsets, invalid IANA identifiers, strict endpoint shape, equal/reversed instants and exact precedence over conflicting legacy clocks. Mixed timelines compare absolute timestamps with implicit and overnight legacy boundaries; Schema 5 with no timing retains legacy derivation/display. Both endpoint labels follow declared IANA zones, independent of machine timezone.

Schema 1–4 still reject timing and retain original validation/rendering; physical old-cache regressions require zero rewrite/upgrade/deletion. Mocked Schema 5 remote/cache/offline/reload tests retain separate metadata. UI tests exercise second-level automatic boundaries, manual/reset/preview, wrapped endpoint labels at all five widths including Large font and source audits for forbidden branching. Final focused/full counts and build/CI/Pages evidence belong in V2_CURRENT_STATE.md/release handoff. Step 15B is not complete; Step 15C has not started. No live Supabase or production changes.
