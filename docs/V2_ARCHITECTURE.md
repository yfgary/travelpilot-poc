# TravelPilot V2 — Architecture

## Architectural objective
A single shared application renders every trip from structured data.

Conceptually:
```
PWA Shell
  ├─ Shared routing/navigation
  ├─ Shared UI components
  ├─ Trip renderer
  ├─ Weather engine
  ├─ Suitability engine
  ├─ Offline/cache layer
  ├─ Sync/version manager
  └─ Supabase client
          ↓
      Structured trip data
```

## Frontend
Use one application shell. Do not create one custom HTML page per trip.

Preferred route model:
- `/trip/:tripSlug`
- page/sub-view derived from routing state, not duplicated trip documents

Shared components should include:
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

Names are illustrative; implementation can differ while preserving the shared-component principle.

## Data flow
```
Supabase / packaged seed data
        ↓
Normalization / validation
        ↓
Trip store
        ↓
Shared renderers
        ↓
UI
```

No renderer may branch on a specific trip, country, date, attraction, or day number.

## PWA / offline
Use:
- Web App Manifest
- Service Worker
- IndexedDB or an equivalent durable browser store for structured offline trip data
- Cache Storage for application assets and selected images

Offline strategy:
1. App shell loads offline.
2. Previously downloaded trip data loads from local durable storage.
3. User edits that support offline operation are written locally first.
4. When connectivity returns, sync eligible changes to Supabase.
5. Live-only resources clearly indicate offline/unavailable state.

## Authentication
Supabase Auth is exposed through Settings.
The UI must tolerate:
- signed out
- signed in
- temporary loss of connectivity
- expired session requiring reauthentication

Public/read-only trip behaviour versus authenticated/private behaviour must remain configurable and must not be embedded as trip-specific logic.

## Sync
Checklist is local-first:
```
Local change
   ↓
Immediate local UI state
   ↓
Queued/synced to Supabase when online
   ↓
Other device receives latest state
```

Conflict policy must be explicit before implementation. Initial proposal: item-level last-write-wins using server timestamps, unless testing shows a better simple rule is needed.

## Version model
Keep at least:
- `app_version`
- `trip_data_version`
- `last_sync_at`

The online client checks version metadata.
Do not force-reload an actively used screen.
A downloaded update can become active on next reload/reopen or explicit user action.

## Weather architecture
Weather locations are trip data.
The weather module accepts a location record and renders shared metrics.

Suitability scoring consumes:
- activity categories
- weather conditions
- optional weighting rules

It must not know specific place names.

Possible activity categories:
- outdoor_scenic
- outdoor_walking
- mountain
- cable_car
- driving
- city_sightseeing
- indoor_attraction
- shopping
- restaurant
- onsen
- snow_activity
- photography

Final scoring weights must be specified/tested separately.

## Live Cam architecture
Live cams are normalized records attached to regions/routes/places.
Supported source types must be generic (for example embed, image snapshot, external link). If a provider needs a one-off fragile scraper or special DOM logic, escalate before implementation.

## Responsive design
V1 is the visual reference.
Desktop and iPhone are first-class.
Five-day forecast uses horizontal overflow on narrow screens.
Controls must remain touch-friendly.

## Localization readiness
Do not build full translation in V2.
Avoid mixing structural keys with display text so a future locale layer can be introduced without rewriting trip logic.

## Security
- Never commit Supabase service-role keys.
- Browser code may only use intended public/anon client configuration.
- Use Supabase RLS for protected user-specific state.
- Authenticated writes must be scoped to authorized user data.

## Testing expectations
At minimum cover:
- a second unrelated sample trip using the same renderer
- no cross-trip data leakage
- route correctness
- home date sorting
- offline app-shell start
- offline cached trip read
- checklist local write + later sync
- version comparison behaviour
- responsive key pages
