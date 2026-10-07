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

Initial conflict policy: item-level last-write-wins using `updated_at`. Review if testing exposes a real conflict problem.

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
