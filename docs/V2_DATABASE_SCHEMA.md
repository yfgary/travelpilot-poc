# TravelPilot V2 — Supabase / Data Schema

Status: Step 5 foundation remains applied. Step 11 applies the first intentional post-foundation V2 migration, strictly limited to checklist state and its dedicated private trigger/function.

## Design choice
Use a **hybrid versioned-snapshot model**.

Trip content is mostly read-heavy, versioned together, downloaded for offline use, and commonly generated/imported as a whole by ChatGPT. Therefore the canonical content for each published trip version is one validated JSONB payload.

Mutable per-user state remains in normal relational tables.

This avoids an unnecessarily large number of tightly coupled content tables while preserving validation, rollback, multi-trip isolation and offline simplicity.

## Existing V1 tables — DO NOT MODIFY
Current Supabase public V1 tables observed on 08/10/2026:
- `trip_checklist_state`
- `trip_checklist_shared`
- `trip_sync_config`

V2 uses new `v2_` tables only.

## Applied Step 5 foundation

Project: **Japan Winter 2027 Sync**

Project URL: `https://rihnuowhkzrpfkvrsxej.supabase.co`

The five V2 tables, RLS policies and grants were created and verified by GPT-5.6 Sol before this frontend integration task, as confirmed in the Step 5 handoff. No table was created, altered, dropped or migrated by this task.

| Existing V2 table | Applied browser access model |
| --- | --- |
| `v2_trips` | Authenticated SELECT of own rows only |
| `v2_trip_versions` | Authenticated SELECT only when the parent trip belongs to the user |
| `v2_checklist_state` | Authenticated CRUD of own rows / own trips only |
| `v2_user_preferences` | Authenticated CRUD of own row only |
| `v2_app_versions` | Anonymous and authenticated SELECT of published rows only |

V2 trip content is private by default. App shell, Home and Settings may load signed out. Ordinary browser users cannot administer or publish content. No public/shared trip feature is provided in Step 5. The local demo snapshot remains independent of real trip access and available signed out. Step 6 validates it with the same runtime contract as remote snapshots.

The Step 5 database foundation was verified with Supabase advisors before this task. The handoff reports that the new V2 policies introduced no advisor security warnings. Existing V1 advisor warnings were intentionally left untouched; they were not fixed by this foundation or frontend task.

Existing V1 tables remain untouched and isolated. No V2 migration should modify a V1 table. The browser integration uses only the supplied modern publishable key; it never uses privileged credentials or a legacy anon JWT.

## Source-controlled foundation reference (Step 6)

`supabase/schema/v2_foundation.sql` is a **SOURCE-CONTROL BASELINE**, not an applied migration. It was reconstructed from read-only catalog inspection of the existing V2 columns, constraints, indexes, grants, policies and triggers. The live Step 5 schema already exists. Do not auto-apply this file to the current project; future changes require proper migrations. No DDL was run in Step 6 and no V1 DDL is included.

Actual content table fields used by the loader:
- `v2_trips`: UUID `id`, `owner_id` referencing auth.users, slug, title, destination_label, start_date, end_date, created_at, updated_at. Slug uniqueness is `(owner_id, slug)`, not global. Date-order and slug-format constraints apply.
- `v2_trip_versions`: UUID id, trip_id, data_version, positive schema_version, object payload, optional checksum, status (draft/published/archived), is_current, created_at, published_at, notes. Unique `(trip_id, data_version)` and a partial unique index allow at most one current version per trip. Current implies published; published requires published_at.
- `v2_checklist_state`: user_id + trip_id + checklist_item_id primary key, checked, updated_at, optional device_id.
- `v2_user_preferences`: user_id primary key, font_size (small/medium/large), language, auto_update, updated_at.
- `v2_app_versions`: app_version primary key, released_at, optional minimum_schema_version and notes, published.

All five tables have RLS enabled. Browser grants/policies match the applied access table above. The baseline also records trip foreign-key indexes and the private `v2_set_updated_at()` trigger function on trips/checklist state/preferences. It uses invoker security, an empty search_path and restricted execution privileges; it does not expose a browser publishing function.

## Trip snapshot payload
A snapshot must be self-contained for trip rendering and offline use.

Illustrative top-level shape:

```json
{
  "schemaVersion": 4,
  "trip": {},
  "regions": [],
  "days": [],
  "places": [],
  "accommodations": [],
  "transport": [],
  "navigationTargets": [],
  "hardCuts": [],
  "checklists": [],
  "weather": {},
  "liveCams": [],
  "images": [],
  "sources": [],
  "emergency": { "contacts": [], "notes": [] }
}
```

The canonical runtime contract is `src/data/schema/trip.ts`. Step 13 sets `CURRENT_TRIP_SCHEMA_VERSION = 4` (also `TRIP_SCHEMA_VERSION`) and supports strict versions 1, 2, 3 and 4. Step 10 introduced emergency content in version 2. Types are inferred from the shared Zod runtime definitions; there is no separate snapshot interface. Schema 1's original strict contract remains readable and omits emergency; Schema 2 adds generic emergency information. Dates use ISO calendar dates, times use HH:MM and datetimes include a UTC/offset zone. Durations are minutes, monetary values carry a three-letter currency, and all entity IDs (including emergency contacts, timeline/checklist groups/items) are unique across a snapshot. Live Cam route relationships use required routeDayIds in Schema 4; strict Schemas 1/2/3 retain optional singular routeDayId. Group is a display label. Arrays preserve timeline order; checklist groups/items additionally carry order values.

Schema 2 emergency contacts include category, title, optional phone/HTTP(S) URL/region/context, availability, description, notes and canonical source IDs. `emergencyContact` is a supported Schema 2 entity reference. The existing JSONB payload and positive integer schema_version need **no live DDL or data changes**. Remote row/payload versions must match. IndexedDB retains storage version 1 and its existing stores/keys; Schema 1 and 2 snapshots retain their actual metadata and are never rewritten/deleted merely on read. Invalid updates cannot overwrite a valid cache. All V1 tables and the unapplied SQL baseline remain unchanged.

## Required generic content concepts

### trip
Must support:
- title
- short title
- destination label
- introduction/summary
- start/end date
- timezone
- hero/banner references
- display metadata
- optional feature flags only when they describe generic capability, never trip-specific renderer modes

### regions
Must support:
- stable ID
- names/labels
- timezone where required
- coordinates
- weather coordinates/config

### days
Must support:
- stable ID
- day number
- date
- title
- route summary
- highlights
- hero/gallery image references
- accommodation reference
- primary weather region
- generic constraints/warnings
- optional/bonus references
- ordered timeline

### timeline items
Must support:
- stable ID
- generic item type
- start/end time
- title/description
- place/accommodation/transport references
- duration
- map/navigation target
- warning
- optional/bonus state
- hard-cut relation where relevant

### places
Must support:
- stable ID
- region
- generic place type
- short/long descriptions
- why worth visiting
- history/background
- local importance
- what to see
- takeaway/what to understand
- suggested duration
- opening/last entry/closing information
- fee
- rating out of 10
- map/coordinates
- official links
- images
- source references
- activity profile references

### accommodations
Must support:
- stable ID
- name/type
- address/phone/map
- stay dates
- room
- meal plan
- booking/payment status
- total/paid/arrival payment information
- check-in/out
- cancellation
- parking
- notes

Sensitive booking information must not be placed in a publicly readable payload unless explicitly intended.

### transport
Must support:
- generic transport type
- provider/service
- origin/destination
- date/time
- map/navigation references
- booking/payment state
- price/currency
- notes/warnings

### navigation targets
Generic targets such as:
- parking
- entrance
- station
- pickup
- dropoff
- other

Fields may include:
- title
- map query / URL
- coordinates
- description
- warning

### hard cuts
Must support:
- related day
- time or datetime
- title
- severity/priority
- category/icon
- description
- optional source relation

### checklists
Definitions live in trip payload and can differ by trip.

Must support:
- stable checklist ID
- type
- title/description
- multiple groups
- stable item IDs
- display/order metadata
- notes
- expected count for validation

### weather / suitability
Must support:
- weather regions
- current/forecast provider configuration where required
- activity profiles
- region/day profile weighting
- score configuration version
- generic operation/status notes

Do not encode a named attraction in scoring code.

### live cams
Must support:
- stable ID
- label
- optional region/place/group references; Schema 4 required routeDayIds array, old readers retain routeDayId
- generic source capability type
- source URL
- preview/snapshot URL where relevant
- official/status URL
- Schema 4 description, priority (primary/reference/backup), required tags array and optional sourceLabel; empty tags/day relationships allowed

### images
Must support:
- stable ID
- local/storage/external asset reference
- alt text
- source URL
- attribution/license note where required
- role and sort order via referencing content

### sources
Research/source records may include:
- title
- URL
- source type
- checked_at
- referenced entity ID/type

## Publishing workflow
Target workflow:
1. User supplies itinerary/document.
2. ChatGPT transforms it into the current trip schema.
3. ChatGPT researches approved missing place/image/source information.
4. Validate payload against the V2 schema.
5. Show/report validation issues instead of hard-coding around them.
6. Create a new draft trip version.
7. Publish only the complete validated version.
8. Client sees newer Trip Data Version and downloads it.
9. Previous published versions remain available for rollback/history if retained.

## Offline model
When a trip is downloaded, store:
- trip ID
- data version
- schema version
- complete validated payload
- last sync/download timestamp

Use IndexedDB for structured payloads.
Use Cache Storage for app/static assets and selected essential images.

## RLS/security
The Step 5 applied policies/grants follow the access model recorded above. Content reads require authenticated ownership, while published App Version metadata alone permits anonymous reads. Checklist and preference writes remain owner-scoped. Content administration/publishing is not exposed to ordinary browser users.

The prior database foundation was verified with advisors. Step 11 ran security/performance advisors after the explicitly approved checklist migration; findings match preflight and existing V1 warnings remain untouched. See the verification record below.

## Validation gate
Before real Japan 2027 migration:
1. validate two unrelated dummy trips
2. prove one renderer handles both without special cases
3. prove snapshot offline storage works
4. prove checklist IDs survive a trip data version update
5. prove rollback/version selection works conceptually

## Step 6 validation, loader and device cache

Runtime validation returns structured path/code/message issues. It rejects unsupported schema versions, malformed/extra fields, duplicate stable IDs, broken entity references, impossible dates, reversed trip dates, out-of-range/duplicate days, invalid coordinates, ratings outside 0–10 and negative durations. Weather configuration and Live Cam capabilities are data only; no engines are implemented.

Authenticated loader flow is read-only: select matching slug and owner_id in `v2_trips`, then matching trip_id with `status = published` and `is_current = true` in `v2_trip_versions`. RLS is the security boundary. It checks row shape/ownership, row and payload schema versions, payload trip ID/slug, complete schema and references before returning or caching. No browser content writes occur.

IndexedDB database `travelpilot-v2-trips`, storage version 1:
- `versions`: key `[tripId, dataVersion]`, validated payload, schemaVersion, slug, ownerId and cachedAt.
- `current`: key `[slug, ownerId]`, pointer to an account's active cached trip/version.
- `deviceCurrent`: key slug, most recently cached device pointer for signed-out access.

A transaction stores a valid remote version and both pointers atomically, retaining older versions. Data Version labels are opaque identities, preserved exactly rather than trimmed or normalized; blank labels are rejected. Cache reads revalidate the payload and its identity/version metadata. Remote unavailability, invalid data or unsupported versions may fall back to a valid cache without overwriting it. Signed-in lookup is account-scoped; signed-out/offline lookup uses the device pointer. A valid remote result is still usable if storage is blocked, with a visible cache warning.

**Privacy:** offline trip snapshots are local device data. Logout does not delete them; anyone using the same browser profile while signed out can read previously cached trips by route. They remain until explicitly cleared, browser storage is removed/evicted, or a future Clear Offline Data control is used. Step 6 did not implement that control; Step 11 now provides confirmed clearing in Settings. No auth password is cached in trip records. App Version, Trip Data Version and Trip Schema Version are distinct.


## Step 11 — mutable checklist state and approved live migration

The exact approved SQL is `supabase/migrations/20261008135932_step11_checklist_client_clock.sql`. It was created through the Supabase CLI migration workflow and applied to the existing project; its filename matches the recorded live migration history version. The source baseline above remains unchanged, historical and unapplied. No additional schema changes, V1 changes, data backfill or live-user test writes were made.

Checklist state now also has `client_updated_at timestamptz NOT NULL DEFAULT now()`. Client time plus non-secret device ID determines item-level LWW; server `updated_at` records accepted arrival time and never decides which offline edit wins. Browser writes contain only user_id, trip_id, checklist_item_id, checked, client_updated_at and device_id, with the original three-column conflict key. A dedicated private SECURITY INVOKER BEFORE INSERT/UPDATE trigger rejects stale/equal UPDATE tuples atomically, using C collation for device-ID ties; accepted writes receive `updated_at = now()`.

RLS, the four ownership policies, table grants, indexes and all other V2 timestamp triggers remain unchanged. Anonymous checklist access and direct browser function execution remain unavailable. [Step 11 live verification](../supabase/verification/step11.md) records catalog checks, unchanged V1 row counts and unchanged security/performance advisor findings. The V2 checklist table still had zero rows at verification; testing inserted no real user state. Existing V1 and global Auth warnings were not fixed.

### Separate device user-state database

`travelpilot-v2-user-state`, IndexedDB storage version 1:

- `checklistState`: key `[owner scope, tripId, canonical checklistItemId]`, checked, clientUpdatedAt, deviceId, dirty and optional accepted serverUpdatedAt. Null-owner demos use a generic local scope and never sync remotely.
- `syncMeta`: key `[ownerId, tripId]`, actual lastSuccessfulAt from a completed sync, absent until success.
- `meta`: persisted non-secret random device ID and monotonic lastMutationTime. One atomic state/clock transaction prevents timestamp reuse across rapid edits and reloads.

Definitions stay exclusively in validated trip snapshots; state does not change Trip Schema/Data Version. Remote reads are authenticated-owner/trip scoped and bounded by current canonical item IDs, avoiding server row-limit truncation. Orphans remain retained but are neither presented nor uploaded/deleted. Local winners are batched; remote winners are stored clean; every push is followed by a final pull to reconcile server-rejected races. Failure retains local values and pending state.

**Device privacy:** logout retains downloaded trips, local checklist state and pending mutations; signed-out cached-owner edits can later sync only when that owner logs back in. Signed-in IndexedDB reads, in-memory values and REST requests are owner-scoped. A different signed-in account cannot upload or present another owner's queue; explicit all-device clearing may inspect only its aggregate pending-loss count. Settings explicitly warns and confirms before clearing all browser-profile trip snapshots/pointers, checklist rows, dirty queue and sync timestamps. It never deletes server rows or changes Auth/font preferences/assets/definitions. The non-secret device identity/clock remains to avoid timestamp reuse. Blocked/evicted browser storage cannot guarantee reload persistence; session values and an honest warning remain available.


## Step 12 — JSON payload evolution only; no live database change

Trip Schema 3 adds forecastProviders/weatherRegion.providerId/optional location elevation, dayRegions, richer activityProfiles with Experience/Access metric curves and weights, accessShare/safetyCaps/minimumCoverage/operationRequired, and alertProviders. The canonical trip/weather Zod schemas infer TypeScript types and validate shape/references/safe configuration. Schema 1 and 2 remain unchanged/readable and cached row metadata retains its actual version; schemas 4+ were unsupported at the Step 12 release (Step 13 adds Schema 4 below). `v2_trip_versions.schema_version` must equal `payload.schemaVersion` for all supported versions.

Existing JSONB/positive schema_version columns already accommodate this payload; **no Step 12 DDL, migration, grants/policies, live rows or V1 tables are modified**. The approved Step 11 checklist migration and unapplied baseline SQL remain byte-for-byte unchanged. Browser trip content remains read-only. Dynamic provider forecasts and alerts are not written into v2_trips/v2_trip_versions/checklist tables or immutable snapshots.

Normalized WeatherForecast and OfficialAlert contracts are runtime data, distinct from the published trip config. Forecasts are stored only in local `travelpilot-v2-weather-cache` IndexedDB, keyed by trip/region/provider with a configuration signature and fetchedAt. Ten-minute TTL, stale/offline fallback and validation protect valid cache records. The original trip-cache name/version/stores/keys are untouched; original Schema 1/2 physical records need no migration/rewrite/deletion.

Local weather cache remains after logout, subject to browser eviction/site-data clearing. The unchanged Step 11 Settings clear action handles trip/checklist state and does not add dedicated weather-cache clearing. App Version v2.0.0-poc.14, Data Versions demo.city.4/demo.road.4 and Trip Schema 3 remain separate. All automated Supabase/Auth/forecast network tests are mocked; no real user credentials or live test writes.

## Step 13 — Camera JSON evolution; live database untouched

Schema 4 extends camera JSON only with multi-day routeDayIds and descriptive priority/tags/source-label metadata. All references are validated, including duplicate/missing day IDs and inconsistent explicit region versus canonical Place region. Schema 1/2/3 readers preserve their original strict contracts and source-version metadata. The existing positive schema_version/JSONB payload columns already support this version; no DDL, grants, policies, migrations, publishing or live test writes were performed.

Trip cache database name/storage version/stores/keys and owner/device pointers remain unchanged. Cached old payloads are read without writes, conversion or deletion; validated Schema 4 records coexist and retain distinct data/schema versions. Logout/privacy and explicit Settings clearing behavior are unchanged. The approved Step 11 migration and historical foundation baseline remain byte-for-byte unchanged. V1 tables and production remain untouched.
