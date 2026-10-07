# TravelPilot V2 — Supabase / Data Schema

Status: Step 5 V2 database foundation already applied and verified in the existing Supabase project; this frontend task performs no DDL or migrations.

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

V2 trip content is private by default. App shell, Home and Settings may load signed out. Ordinary browser users cannot administer or publish content. No public/shared trip feature is provided in Step 5. The local demo fixture remains independent of real trip access; its loader is unchanged until Step 6.

The Step 5 database foundation was verified with Supabase advisors before this task. The handoff reports that the new V2 policies introduced no advisor security warnings. Existing V1 advisor warnings were intentionally left untouched; they were not fixed by this foundation or frontend task.

Existing V1 tables remain untouched and isolated. No V2 migration should modify a V1 table. The browser integration uses only the supplied modern publishable key; it never uses privileged credentials or a legacy anon JWT.

## Original schema field guidance

The field lists below are the earlier design guidance, not a fresh SQL introspection or DDL instruction. The applied ownership policies above are authoritative for access. Exact snapshot TypeScript definitions and the real data loader belong to Step 6.


### v2_trips
Stable trip identity and lightweight list/home metadata.

Suggested fields:
- id uuid primary key
- slug text unique not null
- title text not null
- destination_label text
- start_date date not null
- end_date date not null
- latest_published_version_id uuid nullable
- published boolean default false
- created_at timestamptz
- updated_at timestamptz

Home cards may read lightweight metadata from this table and/or the latest published snapshot.

### v2_trip_versions
Immutable or append-only published/draft content snapshots.

Suggested fields:
- id uuid primary key
- trip_id uuid references v2_trips
- data_version text not null
- schema_version integer not null
- payload jsonb not null
- checksum text nullable
- status text — draft / published / archived
- created_at timestamptz
- published_at timestamptz nullable
- notes text nullable

Constraints:
- unique(trip_id, data_version)
- only a validated version may become published
- normal edits create a new version rather than mutating an already-published historical version

### v2_checklist_state
User-specific mutable checklist state.

Suggested fields:
- user_id uuid references auth.users
- trip_id uuid references v2_trips
- checklist_item_id text
- checked boolean default false
- updated_at timestamptz
- device_id text nullable

Primary key:
- user_id + trip_id + checklist_item_id

Checklist item IDs in payloads must be stable across ordinary trip updates.

### v2_user_preferences
Suggested fields:
- user_id uuid primary key references auth.users
- font_size text — small / medium / large
- language text default zh-HK
- auto_update boolean
- updated_at timestamptz

### v2_app_versions
Suggested fields:
- app_version text primary key
- released_at timestamptz
- minimum_schema_version integer nullable
- notes text nullable
- published boolean

## Trip snapshot payload
A snapshot must be self-contained for trip rendering and offline use.

Illustrative top-level shape:

```json
{
  "schemaVersion": 1,
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
  "sources": []
}
```

This is a conceptual contract, not the final TypeScript interface. Exact field definitions are created with the implementation schema.

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
- region/place/route/group references
- generic source capability type
- source URL
- preview/snapshot URL where relevant
- official/status URL
- sort/display metadata

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

The prior database foundation was verified with advisors. Run security/performance advisors after future authorized DDL changes. This frontend task makes no DDL changes and does not change V1 warnings.

## Validation gate
Before real Japan 2027 migration:
1. validate two unrelated dummy trips
2. prove one renderer handles both without special cases
3. prove snapshot offline storage works
4. prove checklist IDs survive a trip data version update
5. prove rollback/version selection works conceptually
