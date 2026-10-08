# TravelPilot V2 — Architecture

## Architecture status
Locked baseline: 08/10/2026

## Architectural objective
A single shared application renders every trip from validated structured data.

```
React + TypeScript + Vite PWA
  ├─ Hash Router
  ├─ Shared UI components
  ├─ Trip renderer
  ├─ Weather engine
  ├─ Suitability engine
  ├─ Offline/cache layer
  ├─ Sync/version manager
  └─ Supabase client
          ↓
   Versioned Trip Snapshot (JSONB)
```

## Frontend stack
Use:
- React
- TypeScript
- Vite
- GitHub Pages
- Hash-based routing
- Supabase JS
- Service Worker / PWA manifest
- IndexedDB for durable structured offline data
- Cache Storage for app assets and selected trip images

Why:
- V2 has seven substantial views with shared state/components.
- TypeScript reduces accidental schema/renderer mismatch.
- React avoids repeating V1-style patch scripts and page-specific DOM mutation.
- Vite provides a small, conventional build suitable for GitHub Pages.
- Hash routing avoids direct-route 404 problems on GitHub Pages without requiring server rewrites.

## Route model
Use one application shell.

Examples:
- `#/` — Home
- `#/trip/:tripSlug/itinerary`
- `#/trip/:tripSlug/info`
- `#/trip/:tripSlug/attractions`
- `#/trip/:tripSlug/live`
- `#/trip/:tripSlug/today`
- `#/settings`

Do not create one HTML document per trip or per page.

## Shared component principle
Shared components should cover concepts such as:
- AppHeader
- PageNavigation
- TripSummary
- WeatherPanel
- ForecastStrip
- DayAccordion
- DayHeroGallery
- Timeline
- TimelineItem
- PlaceCard
- PlaceDetail
- HotelCard
- TransportCard
- BackupPlaces
- LiveCamCard
- Checklist
- OnlineStatus
- VersionStatus
- FontSizeControl
- AuthPanel

Names are illustrative. The architectural requirement is shared rendering, not specific component names.

## Data architecture
Trip content is stored as a **versioned validated snapshot**, not dozens of tightly coupled content tables.

```
v2_trips
   ↓
v2_trip_versions
   └─ payload JSONB
        ├─ trip metadata
        ├─ regions
        ├─ days
        ├─ timeline
        ├─ places
        ├─ accommodation
        ├─ transport
        ├─ navigation targets
        ├─ hard cuts
        ├─ checklist definitions
        ├─ weather configuration
        ├─ suitability profiles
        ├─ live cams
        ├─ images
        └─ sources
```

Benefits:
- ChatGPT can transform one supplied itinerary into one validated trip payload.
- Publishing is atomic: a trip version is complete or it is not published.
- Offline download/cache is simple.
- Rollback is simple.
- Data for one page cannot silently become a different version from another page.
- New trip creation remains data-only.

User-specific mutable state remains relational and separate from trip content.

## V1 / V2 Supabase isolation
Existing V1 public tables currently include:
- `trip_checklist_state`
- `trip_checklist_shared`
- `trip_sync_config`

Do not alter or reuse these tables for V2.

All V2 tables use the `v2_` prefix. No V2 migration may modify a V1 table without explicit user approval.

## Data validation
The frontend and content-import workflow must share a versioned TypeScript schema/validator.

Before a trip snapshot is published:
1. validate required fields
2. validate stable IDs and references
3. reject broken place/hotel/timeline references
4. reject invalid dates/times
5. validate supported activity/profile/source types
6. calculate/verify a payload checksum where useful
7. publish only after validation passes

Schema evolution is controlled with `schema_version`.

### Step 10 backward-compatible snapshot reader
- Current Trip Schema Version is **2**; supported versions are **1 and 2**. `TRIP_SCHEMA_VERSION` aliases `CURRENT_TRIP_SCHEMA_VERSION`; supported-version checks are centralized.
- Schema 1 retains its strict Step 9 contract. Schema 2 shares the common shape and cross-reference validator, adds required top-level `emergency` (empty contacts/notes allowed), and permits generic `emergencyContact` entity references. No duplicate complete schema/validator or destination-specific fields.
- Emergency contacts have globally unique stable IDs, generic categories, optional phone/HTTP(S) URL/region/availability/description, notes and source IDs. Region/source/entity references and safe URLs are validated. `getEmergencyInfo()` centralizes the version-specific UI access; Schema 1 has no emergency data.
- Remote row/payload schema versions must match and both be supported. `LoadedTrip.schemaVersion` reports the actual source version, never the current app's preferred format.
- IndexedDB remains `travelpilot-v2-trips`, database storage version **1**, with the same stores/keys/pointers. Existing Schema 1 records validate/read unchanged; Schema 2 records coexist. Metadata/payload mismatches are rejected. Reading never rewrites, migrates, clears or deletes records; invalid updates preserve the valid cache.
- TripLayout remains the sole asynchronous loading boundary. Its typed Outlet context supplies both Detailed Itinerary and Trip Information; children do not access Supabase or IndexedDB. Shared canonical accommodation/transport/navigation/hard-cut records are reused. Trip Information's data-driven quick navigation, read-only checklist definitions and emergency presentation require no mutable checklist storage.
- No live Supabase DDL/data change is needed: `v2_trip_versions.payload` already stores JSONB and `schema_version` is a positive integer. Existing V1 tables and source-control SQL baseline remain untouched. Checklist state and weather remain Steps 11 and 12.

## No trip-specific logic
Application code may contain generic reusable rules and enums.

Allowed examples:
- font sizes: small / medium / large
- score bands
- activity types
- generic source capability types
- generic navigation target types

Forbidden examples:
- `if (tripSlug === 'japan-2027')`
- `if (dayNumber === 6)`
- `if (placeId === 'shirakawago')`
- country-specific render branches
- per-trip HTML or JS

## PWA / offline
Offline strategy:
1. App shell must start without a network connection after first successful install/load.
2. Downloaded/published trip snapshot is stored in IndexedDB.
3. Essential selected images are cached.
4. Local-first user changes are applied immediately.
5. Eligible changes sync to Supabase when connectivity returns.
6. Live-only resources show unavailable/offline state rather than breaking the page.

Do not hard-code one trip's asset list into the service worker. Offline resources must be derived from app build assets and downloaded trip metadata.

## Authentication
Supabase Auth lives in Settings.

UI must tolerate:
- signed out
- signed in
- temporary loss of connectivity
- expired session requiring reauthentication

Trip read visibility and user-state writes must be controlled generically with Supabase policies/configuration, never by trip-specific code.

## Checklist sync
Checklist definitions live inside the immutable/versioned trip payload.
Checklist checked/unchecked state lives separately in `v2_checklist_state`.

Local-first flow:
```
User changes item
      ↓
IndexedDB/UI updated immediately
      ↓
Sync queue
      ↓
Supabase when online
      ↓
Other signed-in devices
```

Step 11 supersedes the initial server-updated_at conflict proposal: item-level LWW uses `(client_updated_at, device_id)` with deterministic C/UTF-8 device ordering. Server `updated_at` is accepted-arrival metadata only. A private SECURITY INVOKER trigger rejects stale/equal upserts atomically; the browser always pulls again after pushing.

Checklist item IDs must remain stable across trip content versions so state survives normal itinerary updates.

## Version model
Keep distinct:
- App Version
- Trip Data Version
- Trip Schema Version
- Last Sync time

Online client checks published version metadata.

Do not force-reload an actively used screen. A newer app/data version may download in the background and become active on user reload/reopen or explicit update action.

Every page must display in the lower-left status area:
- online/offline state
- current App Version

Trip views may additionally expose Trip Data Version in details/settings.

## Weather architecture
Weather locations and activity profiles live in trip data/config.

V2 should preserve the useful generic concepts from V1's newer weather activity-profile engine:
- Experience score
- Access/Safety score
- safety cap
- activity profile weights
- operation-status caveats where relevant

Reimplement cleanly in TypeScript. Do not copy Japan-specific legacy modules.

The scoring engine must know generic activity profiles, not named attractions.

## Live Cam architecture
Live cams are data records referenced by region/route/place/group.

Generic source capabilities may include:
- embeddable stream/frame
- image/snapshot
- external official page

If a provider requires a brittle one-off scraper or provider-specific DOM hack, classify it Complex/High-risk and discuss before implementation.

## Responsive design
V1 is the Golden Visual Reference.
Desktop and iPhone are first-class.
Five-day weather cards scroll horizontally on narrow screens.
Touch targets and modal/detail views must remain usable on iPhone.

## Localization readiness
V2 ships Traditional Chinese only.
Keep structural keys separate from display text so a future locale layer does not require rewriting trip logic.

## Security
- Never commit Supabase service-role keys.
- Browser code uses only intended publishable/anon configuration.
- Use RLS for user-specific state.
- Content publishing/admin writes must not rely on an unrestricted browser key.
- Do not store secrets inside trip JSON payloads.

## Testing expectations
At minimum test:
- two unrelated dummy/sample trips with one renderer
- no cross-trip leakage
- hash-route direct reload/bookmark
- home date sorting
- offline app-shell start
- offline cached trip read
- checklist local write + later sync
- version comparison/update behaviour
- iPhone and desktop layouts
- schema validation failures

## Step 6 implemented boundaries

- Shared header Back action is present on every non-Home route. `NavigationHistory` records safe app-relative router entries and restores them from sessionStorage only when the current router key/path matches. It flushes a pending safe router URL/key before pagehide/beforeunload, so immediate reloads preserve navigation even before React commits the new view. It navigates to the previous recorded route or Home, never to an unverified native browser entry. Reloaded Settings preserves the trip page where possible; unavailable storage falls back safely.
- `data/schema/trip.ts` is the single Zod schema, with inferred TypeScript types and supported Trip Schema Version 1. Shape and cross-reference validation return structured issues.
- `data/trips.ts` provides one generic versioned local demo snapshot. Home lists that fixture only; multi-trip proof and remote Home listing remain later steps.
- `services/trips.ts` owns read-only, owner-scoped V2 queries and the loader result model (loading, remote/cache/demo success, not found, authentication required, unavailable, invalid data, unsupported schema). Raw backend errors never enter the UI.
- `offline/tripCache.ts` stores immutable-version keys and current pointers atomically in IndexedDB. Each read is revalidated. Valid remote data replaces the current pointer while retaining prior versions; failed/invalid remote reads use valid cache without overwriting it. A signed-in user's pointer is account-scoped; signed-out reads use the device pointer.
- `TripLayout` owns the asynchronous route loading boundary, cancellation and a 15-second request deadline. Stale route results cannot replace another trip's metadata. The shell exposes title, summary, slug, Trip Data Version, Trip Schema Version and discreet POC source metadata; content pages remain placeholders.
- Logout leaves cached trip snapshots on the device. Signed-out access is an explicit offline privacy trade-off; future Settings clearing will remove them. Browser storage eviction can remove caches. This is data caching only: no service worker or cold offline shell guarantee is added.
- `supabase/schema/v2_foundation.sql` records read-only catalog metadata as an unapplied source-control baseline. It is excluded from deployment execution; future DDL requires real migrations. V1 and production remain untouched.


## Step 11 implemented local-first checklist and Settings boundaries

- TripLayout remains the sole content-loading boundary; LoadedTrip adds ownerId (null for local demos, authenticated owner for remote, retained downloaded owner for cache). No second trip loader or trip-specific branch was added.
- ChecklistSyncProvider supplies one shared session/connection-aware manager. Checklist presentation uses canonical checklist/group/item order and stable IDs, immediate checkboxes, completion counts, status and confirmed per-list reset; reset is ordinary item mutations. Definitions and trip versions remain immutable.
- `offline/checklistState.ts` owns the separate `travelpilot-v2-user-state` IndexedDB database, durable dirty records, device identity/monotonic clock and sync metadata. `services/checklists.ts` is the only checklist REST boundary. `services/checklistSync.ts` performs pull/tuple-merge/batch-upsert/final-pull with serialized local persistence, cancellation on account changes/clearing and protection for edits made during requests.
- Sync is debounced after mutations/sign-in/online, on visible focus/visibility, Settings manual action and a conservative 30-second visible authenticated online interval. Hidden/signed-out/offline sessions do not continuously sync. No Realtime subscription/publication or browser content publishing exists.
- Device cache remains readable signed out; only its original authenticated owner may sync its pending edits. Another signed-in account is isolated. Orphan state remains retained but is ignored by current definitions and uploads.
- Settings retains existing Auth/font behavior and adds real pending/success/error information, account-scoped validated cached-trip inspection and confirmed explicit local clearing. Clear cancels in-flight sync and removes downloaded snapshots/pointers, checklist rows/pending records and sync timestamps without server DELETE or Auth/font changes. Device identity/clock remains non-secret continuity metadata.
- Version checks SELECT published v2_app_versions only. SemVer comparison handles numeric prereleases; missing current App Version produces neutral metadata-unsynced status, never a downgrade. Persisted optional auto-check defaults off and checks metadata only on Settings entry/enabling; manual remains available. No forced reload, trip refresh or code replacement occurs.
- Trip Schema Version stays current 2/readers 1+2; fixtures retain demo.city.3/demo.road.3. The original trip cache name/storage version/stores/keys and read validation are unchanged; new inspection and explicitly confirmed clearing are additive.
- Approved live migration and catalog/advisor proof: `supabase/migrations/20261008135932_step11_checklist_client_clock.sql`, `supabase/verification/step11.md`. Only v2_checklist_state and its dedicated private trigger/function changed; the historical baseline, other V2 objects and all V1 objects remain untouched.

Remaining boundaries: cold offline app/static-image caching, real trip migration, cloud preference sync, automatic daily resets, selective cache clearing and Weather/Suitability are future work. Stored snapshot notes are preserved even where old fictional notes still describe Step 10 read-only presentation.
