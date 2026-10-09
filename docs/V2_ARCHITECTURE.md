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

### Backward-compatible snapshot reader (Steps 10, 12, 13 and 15B.1)
- Current Trip Schema Version is **5**; supported versions are **1 / 2 / 3 / 4 / 5**. `TRIP_SCHEMA_VERSION` aliases `CURRENT_TRIP_SCHEMA_VERSION`; supported-version checks are centralized.
- Schema 1 retains its strict Step 9 contract. Schema 2 shares the common shape and cross-reference validator, adds required top-level `emergency` (empty contacts/notes allowed), and permits generic `emergencyContact` entity references. No duplicate complete schema/validator or destination-specific fields.
- Emergency contacts have globally unique stable IDs, generic categories, optional phone/HTTP(S) URL/region/availability/description, notes and source IDs. Region/source/entity references and safe URLs are validated. `getEmergencyInfo()` centralizes the version-specific UI access; Schema 1 has no emergency data.
- Remote row/payload schema versions must match and both be supported. `LoadedTrip.schemaVersion` reports the actual source version, never the current app's preferred format.
- IndexedDB remains `travelpilot-v2-trips`, database storage version **1**, with the same stores/keys/pointers. Existing Schema 1/2/3/4 records validate/read unchanged; Schema 5 records coexist. Metadata/payload mismatches are rejected. Reading never rewrites, migrates, clears or deletes records; invalid updates preserve the valid cache.
- TripLayout remains the sole asynchronous loading boundary. Its typed Outlet context supplies Detailed Itinerary, Trip Information, Attractions Overview and Live Cam; content children do not load trips or access Supabase/IndexedDB directly. Shared canonical accommodation/transport/navigation/hard-cut records are reused. Trip Information's data-driven quick navigation, read-only checklist definitions and emergency presentation require no mutable checklist storage.
- No live Supabase DDL/data change is needed: `v2_trip_versions.payload` already stores JSONB and `schema_version` is a positive integer. Existing V1 tables and source-control SQL baseline remain untouched. Checklist state and weather were implemented separately in Steps 11 and 12.

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


## Step 12 — Generic weather and Official Alerts foundation

At the Step 12 release, App Version was v2.0.0-poc.14 and current Trip Schema was 3 with strict readers 1/2/3. Local Data Versions are demo.city.4/demo.road.4. Schema 3 extends the weather payload only; Schema 2 emergency content remains available. Original Schema 1/2 contracts, actual source-version metadata and trip-cache physical storage remain unchanged; reads do not rewrite old data.

```
Validated Schema 3 snapshot configuration
  → TripLayout / TripWeatherProvider (one trip boundary)
  → forecast-provider registry → Open-Meteo adapter
  → validated normalized WeatherForecast
  → dedicated version-1 weather IndexedDB cache + ten-minute TTL
  → shared scoring service → WeatherPanel / DaySuitability

Snapshot alert-provider configuration
  → alert registry → fictional demo adapter
  → validated OfficialAlert[] → active region filter/sort → shared alert UI
```

Contracts live in `src/data/schema/weather.ts`, composed into the sole trip schema. `forecastProviders` select adapter IDs, weatherRegions select provider IDs and optionally a weather-specific latitude/longitude/elevation sample; otherwise canonical Region.coordinates are used. Region timezone overrides trip timezone. `dayRegions` explicitly maps stable day IDs to weather region IDs. References, globally unique provider IDs, coordinates, safe JSON config, curve ordering/weights, shares/caps/coverage and known demo-alert configuration are validated. Unknown future adapters remain data-configurable but degrade safely until implemented.

`services/weather/providers/openMeteo.ts` fixes the provider URL and units, requests `timeformat=unixtime`, current metrics, five daily standard variables and hourly visibility/cloud/humidity/snow-depth. All provider output is normalized/validated before components or cache use it. Epoch times are localized using the configured IANA timezone; daily means/extremes and local-noon snow are derived from hourly samples rather than assuming unsupported daily parameters. Missing values remain absent. Documentation reference: https://open-meteo.com/en/docs. Current conditions are model samples, not certified local station/operation observations.

`offline/weatherCache.ts` is separate from immutable trip storage: database `travelpilot-v2-weather-cache`, storage version 1, `forecasts` store keyed by `[tripId,weatherRegionId,providerId]`. Each record includes a provider/location/timezone/config signature and validated normalized payload/fetchedAt/attribution. Cache reads validate identity/signature again. `services/weather/forecasts.ts` deduplicates matching in-flight requests, enforces a 15-second abort deadline, reuses online fresh cache for ten minutes, refreshes expired/manual requests, retains good cache on invalid/non-OK/network failure, and returns offline/stale states. Storage failure preserves remote/session use with an honest notice. No weather Supabase writes or trip-cache redesign.

`data/weather/suitability.ts` evaluates generic piecewise linear or weather-code lookup rules chosen by data. Baselines and available metrics produce independent Experience and Access scores; coverage uses configured metric weights excluding baselines. Insufficient coverage yields no numeric score. Access share combines them, configured thresholds cap final scores, and results clamp/round consistently. Profile weights aggregate Experience/final; minimum Access and unrounded cap comparisons remain conservative. Legacy `weights`/`scoring.config` metadata are retained in the extended contract but are not a second scoring engine; Schema 3 uses explicit Experience/Access rule arrays and scoring schemaVersion 1. Profiles marked operationRequired always show the official-status caveat, including insufficient-data states.

One shared WeatherPanel is used on itinerary, information and the Live Cam placeholder; it never loads trip content itself. Trip-level selected-region/result state survives page switches and deduplicates consumers. Preferences use a guarded local per-trip key; default priority is valid remembered region, active mapped itinerary day, first weather region. Keyed trip boundaries and per-region result maps prevent late responses from replacing another trip/selection. DaySuitability uses day mapping and dayId weighting only when its exact date exists in that region's forecast; it never substitutes today's weather. Current metrics, profile chips, horizontal five-day forecast, trend labels, timestamps/source/stale notices and accessible refresh/keyboard controls share the responsive stylesheet.

Official alerts are independent of forecasts and suitability. `alertProviders` choose adapter IDs through data; provider-specific service adapters are permitted, while country/slug/place/timezone selection branches are forbidden. Only `demo-alerts` exists here, always normalized with isTest=true and both visible fictional-warning labels. Provider region scope, active dates and deterministic severity/time/id sorting protect UI isolation. A future JMA adapter is planned for real-trip migration and must be selected by trip data; no live JMA/TMD/AEMET/global adapter or automatic score override is implemented. No Today weather integration or Live Cam playback in Step 12.

Weather cache is local device data and is not deleted by logout. Step 11 Settings clearing remains unchanged and does not clear this new dedicated weather store; site-data clearing/eviction can remove it. App shell/image service-worker expansion and dedicated weather management remain later work.

## Step 13 — Canonical Attractions and capability-driven Live Cam

Release v2.0.0-poc.15 uses Trip Schema 4, readers 1/2/3/4 and separate Data Versions demo.city.5/demo.road.5. Schema 4 changes only camera JSON: required routeDayIds/tags arrays, optional description/priority/sourceLabel, and region/place consistency validation. Empty relationship/tag arrays are valid. Strict Schema 1/2/3 contracts retain singular routeDayId. One getLiveCamDayIds helper bridges both without rewriting snapshots. Shared common Zod definitions and cross-reference validation remain canonical; rich weather configuration applies unchanged to Schema 3/4 through one type guard.

Attractions Overview derives Place usage from canonical ordered timelines, optional/bonus flags and day optionalContent/backupContent references. It does not introduce Place.status or another attractions dataset. One Place may have multiple statuses/days; All contains each referenced Place once, category counts can overlap, and badges deduplicate days. Groups follow canonical Region order; cards sort by earliest referenced day, main/optional/backup priority, name and stable ID without mutating source arrays. Shared PlaceFacts, PlaceDetail, MapsAction, ExternalLink and canonical image resolution are reused; missing/broken images degrade to text-only cards and never use Home branding.

Live Cam resolves explicit region, then canonical Place region, then Other/Whole Trip; optional group labels are data. Filters contain only linked canonical days; a multi-day camera appears once in each matching view. Description, priority, tags and source labels come from camera data, not host/provider/trip branches. HTTPS embed uses a lazy titled fullscreen-capable iframe with conservative sandbox/referrer policy and permanent external fallback. HTTPS image/preview is lazy with a failure panel; HTTP inline sources remain external and are never rewritten. Safe source/official/status/maps links deduplicate. Status is a link, not parsed availability; no scraping, discovery, provider hacks, polling or image refresh.

Both views consume TripLayout's loaded context only. Live Cam reuses the existing WeatherPanel/context; camera filters do not change weather selection, scores or Official Alerts. City has no cameras; road has three explicitly fictional records. Today remains a placeholder. Home, Auth, Settings, Back history, trip/checklist/weather storage, approved Step 11 SQL, Supabase policies and production remain unchanged. Old physical Schema 1/2/3 cache reads are tested without trip-record writes, migration or deletion.

Third-party CSP/X-Frame-Options and sandbox requirements may prevent playback; external actions remain the reliable fallback. No source operational status is inferred from a successful image, a status URL or weather score.


## Step 14 — Derived Today Mode over immutable snapshots

`TodayMode` consumes `useLoadedTrip()` from the sole `TripLayout` boundary. It replaces the final routed placeholder; all five views share routes, page definitions, header/status and Back history. Schema 4 with strict readers 1/2/3/4 and demo.city.5/demo.road.5 is sufficient and unchanged. No Supabase DDL or snapshot operational fields.

Pure `data/today.ts` derives initial Day, planned previous/current/next, required mapped next stop, explicit navigation target, car context, chronological Hard Cuts and final accommodation/destination from canonical references. Ordered timeline records are not mutated. Untimed items remain visible/manual; explicit overnight intervals wrap safely; missing end uses the next later timed boundary. Optional progression and required destination are separate. Navigation uses existing Maps resolution and explicit type metadata, with no title/description regex.

`data/tripTime.ts` centralizes trip-local clock, wall-time instant and planned relative formatting. The existing Hard Cut instant resolver is exported and accepts a linked Day fallback; Trip Information behavior remains unchanged. `useTripClock` owns one cleaned-up one-second timer. Snapshot derivation is memoized by minute/day/progress; alert active-time filtering uses the live instant, and no weather fetch follows the clock tick.

`useTodaySession` owns React day/manual state with guarded sessionStorage. Initial selection is matching trip date → valid remembered preview → canonical first dayNumber. Progress is stable item ID, scoped by an unambiguous serialized `[tripId, dayId]` tuple; invalid IDs are ignored and blocked storage retains usable React state. TripLayout's existing trip/version-keyed boundary prevents incompatible state reuse. No permanent progress preference or server operational state. Preview is always explicit, and planned/manual labels never imply GPS completion.

`TodayWeather` consumes the existing TripWeatherProvider results/load/alerts. Canonical dayRegions selects a region without changing the remembered global WeatherPanel selection. Normalized current metrics apply to actual today; exact DailyWeather applies to preview, otherwise no fabricated score. Existing registry/cache/scoring/active-alert filtering and ScoreSummary are reused. Sources, timestamps, stale/offline state, operation requirements and fictional-alert provenance remain visible and separate from operating status. Shared WeatherPanel behavior is unchanged.

`ScreenAwake` is an off-default, user-action-only Wake Lock component with feature detection, duplicate-request protection, truthful unsupported/rejected/browser-release state and unmount cleanup including late request resolution. No persistence or automatic reacquisition.

Today reads previously downloaded physical Schema 1/2/3/4 trip snapshots signed out/offline without trip-store writes, upgrades, conversion, deletion or loader redesign. Core operations survive missing weather network; the existing dedicated weather cache remains separate. Home, Settings/Auth/checklist sync, Back, source assets, SQL, production and live Supabase are untouched. No GPS/background tracking, automatic arrival, real migration or service-worker expansion. Planned timing, device-local state, external Maps/weather and browser Wake Lock limitations are explicit. Full cold-start PWA QA remains Step 16; next Step 15 is not begun.


## Step 15B.1 — Optional exact timeline timing (Schema 5)

Schema 5 extends the strict Schema 4 timeline item with optional `timing: { start: { dateTime, timeZone }, end: { dateTime, timeZone } }` only. Each datetime must include an ISO-8601 UTC/offset designator; each timezone must be an Intl-supported IANA identifier (numeric fixed offsets are rejected). Both endpoints are required when timing exists, objects stay strict, and the end absolute instant must be strictly later than the start. Endpoints may have different zones or calendar dates, including overnight/date-line travel. The ISO offset defines the instant; the declared IANA zone defines its presentation. No requirement equates endpoint zones or dates.

`trip.ts` remains the canonical runtime schema/type source. Schema 1–4 timeline definitions are unchanged and reject the new field. Current schema is 5; supported readers are 1/2/3/4/5. Shared weather capability includes Schema 5 with the existing Schema 4 contract; no weather behavior/configuration is changed. Local fixtures remain Schema 4 with demo.city.5/demo.road.5, and Schema 5 proof data lives only in tests.

`tripTime.ts` resolves exact start/end instants and endpoint-specific 24-hour/date/IANA labels. `automaticPosition` receives the selected date, trip timezone and current instant. When exact timing is present, all timed entries in that timeline are compared as timestamps; adjacent legacy clocks resolve against the selected day/trip zone, including next-calendar-day legacy overnight ends. Canonical timeline order and implicit-end boundaries remain the source of previous/next selection. Timelines without exact timing retain the original minute-based algorithm verbatim. Today uses the existing one-second clock for exact intervals, retains minute memoization otherwise, and relative planned time uses the exact start when supplied. Exact labels wrap without changing legacy activity layout.

Initial day selection, explicit non-today preview, manual stable-ID focus/reset, session keys, Maps/cuts/final destination, weather, Wake Lock and global navigation are unchanged. Cross-midnight intervals do not silently select another day or turn manual preview into live progress. No GPS/arrival inference. IndexedDB storage version/stores/pointers and the remote loader are unchanged; validated Schema 5 coexists with old versions and reads never migrate Schema 1–4 payloads.

Release App Version is v2.0.0-poc.17, independent of Trip Schema and Data Versions. Production, live Supabase, SQL and assets remain untouched. This is only the bounded Step 15B.1 timing patch: Step 15B is **not complete**, Step 15C **has not started**, and no real-trip data is migrated.


## Step 15B.2 — operational Day and exact Timeline display

Schema remains 5; strict readers 1–5 and demo Data Versions remain unchanged. `operationalTiming.ts` is a pure, type-only snapshot dependency: it exposes exact timing access and half-open active interval checks shared by Today and tripDates. `tripTime.ts` keeps its existing public timing API and endpoint formatter; there is no runtime import cycle or second timezone formatter.

Active Schema-5 intervals outrank calendar matching and remembered preview in automatic Today Day selection. Overlap resolution uses the latest absolute start, then canonical day number. `isOperationalDay` admits either canonical date match or an active owned exact interval. The existing one-second clock re-evaluates automatic exact-enabled selection and restores calendar matching at end; explicit day previews and stable-ID manual item focus/reset remain independent. Schema 1–4 and Schema 5 without timing retain the previous selection/HH:MM semantics.

`operationalTripStatus(snapshot, now)` supplies a current exception while an exact interval is active. `orderTrips` accepts optional snapshot-aware records, which Home already supplies; the simple `tripStatus(trip, today)` API and deterministic status/date/slug sorting stay intact. No date-range mutation or permanent extension is stored.

Timeline uses shared `timelineTimeLabel` per declared endpoint zone, retaining full date/24-hour time/IANA labels and original offset strings in `time.dateTime`. Exact rows wrap timing above event content; legacy time ranges keep their previous rendering. No transport-title/type, trip, place or geography inference. No schema/cache/loader/database/asset changes. App v2.0.0-poc.18; Step 15B is incomplete overall and Step 15C has NOT started.
