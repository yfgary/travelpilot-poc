# TravelPilot V2 — Decision Log

## 2026-10-08 — Rebuild architecture, preserve V1 experience
**Decision:** Build TravelPilot V2 as a new architecture while using V1 as Golden Visual Reference.  
**Reason:** Retrofitting full multi-trip behaviour into the existing half-refactored app has produced high regression/context cost.  
**Rejected:** Continue stacking trip-specific patches into the current structure.

## 2026-10-08 — POC repository is the test lab
**Decision:** V2 work happens in `yfgary/travelpilot-poc`. POC deploys do not require user approval. Production must not be changed without explicit instruction.

## 2026-10-08 — Data-driven multi-trip is mandatory
**Decision:** Adding a new trip must not require a new custom HTML page or trip-specific code.  
**Rule:** If a desired feature cannot be generic, discuss simplification/removal instead of hard-coding.

## 2026-10-08 — Supabase remains the backend
**Decision:** Keep Supabase for authentication, structured data, checklist sync, preferences, and version/sync metadata.  
**Reason:** V1 already uses Supabase and V2 needs cross-device state.

## 2026-10-08 — PWA and offline-first are core features
**Decision:** TravelPilot must be installable to iPhone home screen/desktop and previously downloaded trip information must remain usable offline.

## 2026-10-08 — Seven pages
**Decision:** Home, Detailed Itinerary, Trip Information, Attractions Overview, Live Cam, Today Mode, Settings.  
**Reason:** Settings is the home for login, font size, offline/cache/version/update controls, and future language readiness.

## 2026-10-08 — Today Mode replaces separate Driving Mode
**Decision:** Merge the useful V1 Driving Mode behaviour into Today Mode.

## 2026-10-08 — App and data versions are separate
**Decision:** Track application release version separately from each trip's data version.

## 2026-10-08 — Update without disruptive reload
**Decision:** Online version checks must not suddenly reload the active page. When a newer version is detected, Settings may expose an explicit `立即更新` action; only that user action may reload the current route to load the deployed app. Automatic checks never reload by themselves.

## 2026-10-08 — Global display conventions
**Decision:** Dates use `DD/MM/YYYY 星期X`. Times use 24-hour `HH:MM`; Today Mode live clock uses `HH:MM:SS`. Font size is a global Small/Medium/Large preference.

## 2026-10-08 — Localization is future-ready only
**Decision:** Prepare data/UI boundaries so localization is possible later, but V2 initially implements Traditional Chinese only.

## 2026-10-08 — Canonical branding and trip-cover separation
**Decision:** The supplied TravelPilot banner and icon are official product-brand assets and must not be regenerated/replaced without approval.

Repository-relative canonical paths:
- `assets/images/travelpilot_banner.PNG`
- `assets/images/travelpilot_icon.PNG`

**Banner role:** `travelpilot_banner.PNG` is reserved for the global TravelPilot **Home** hero/banner. It is not an individual trip cover and must never be used as the banner/cover fallback for a real trip.

**Trip-cover rule:** Every real trip receives its own representative destination/journey image, researched and selected during trip migration/content enrichment. The image should represent the most iconic or defining place in that specific journey, not merely the arrival city. Example: for a Nagoya / Shirakawa-go / Takayama journey, Shirakawa-go may be selected as the trip cover because it best represents the trip.

**Research/source rule:** Trip-cover research should prefer official tourism boards, official attractions or other reliable/licensable sources. Store source/attribution/licence information in trip data where required.

**Fallback rule:** Fictional/test trips may use a generic non-destination visual fallback when no image exists. A real trip must not silently fall back to the TravelPilot brand banner; resolve a suitable trip image during migration, or ask the user if a source/choice is required.

## 2026-10-08 — Complexity escalation
**Decision:** Difficult/complex/high-risk features must be explained before implementation so the user can keep, simplify, or drop them. No hard-coded workaround is acceptable.

## 2026-10-08 — Clean POC to V2-only repository
**Decision:** Remove all legacy V1/previous POC implementation files from `travelpilot-poc`. Keep only V2 documentation, V2 repository guidance, a clean README, and the canonical banner/icon assets.  
**Reason:** The user will not reuse the old POC implementation and wants to avoid legacy clutter influencing the V2 rebuild.  
**Reference rule:** V1 remains a Golden Visual/Content Reference externally, but V1 implementation files must not be copied back into the V2 POC unless explicitly requested.

## 2026-10-08 — Golden Content schema validation passed
**Decision:** The V2 entity model is approved to proceed after amendments discovered from the Japan 2027 reference trip.  
**Added generic concepts:** navigation targets/parking, richer accommodation payment metadata, grouped checklist structure, richer hard-cut metadata, flexible live-cam grouping, timeline navigation metadata, and weather activity-profile weights.  
**Rejected:** copying V1 legacy hydrate modes, page filenames, storage keys, or trip/day-specific modules into V2.

## 2026-10-08 — V1 content detail is reference, not itinerary truth
**Decision:** Japan 2027 V1 remains the Golden Content detail reference, but its itinerary logic is not automatically considered current.  
**Reason:** production still contains legacy D6–D8 flexible-weather logic that may be stale compared with the user's newer approved plan. Migration must use the latest approved itinerary.

## 2026-10-08 — V2 frontend stack locked
**Decision:** Use React + TypeScript + Vite for the shared V2 application.  
**Reason:** Seven shared views, stateful PWA behaviour and long-term maintenance benefit from typed reusable components rather than V1-style accumulated patch scripts.

## 2026-10-08 — GitHub Pages hash routing
**Decision:** Use hash routes such as `#/trip/<slug>/itinerary`.  
**Reason:** Direct reload/bookmark works cleanly on GitHub Pages without a server rewrite or 404 workaround.

## 2026-10-08 — Hybrid versioned trip snapshots
**Decision:** Store canonical trip content as validated versioned JSONB snapshots in Supabase, while keeping mutable user state relational.  
**Reason:** This better matches the ChatGPT → validate → publish workflow, offline downloads, atomic updates and rollback.  
**Supersedes:** the earlier highly normalized content-table proposal as the primary V2 content model.

## 2026-10-08 — V1 / V2 Supabase isolation
**Decision:** Existing V1 tables must remain untouched. New V2 tables use the `v2_` prefix.  
**Observed V1 public tables:** `trip_checklist_state`, `trip_checklist_shared`, `trip_sync_config`.

## 2026-10-08 — Weather scoring direction
**Decision:** Reuse the generic concepts proven in V1's newer activity-profile system—Experience score, Access/Safety score, safety caps and profile weighting—but reimplement cleanly in TypeScript. Do not copy Japan-specific legacy modules.

## 2026-10-08 — Persistent lower-left status
**Decision:** Every page/view must show a lower-left status area containing online/offline state and current App Version. Trip Data Version is available in Settings/detail status.

## 2026-10-08 — 16-step progress model
**Decision:** Project progress is tracked as Step N/16. Each completed implementation task updates `V2_CURRENT_STATE.md`.

## 2026-10-08 — Private V2 content with a signed-out shell
**Decision:** V2 trip data is private by default. App shell, Home and Settings may load signed out. Real `v2_trips` and `v2_trip_versions` content requires authenticated ownership enforced by RLS, including ownership of the parent trip for version reads. No public/shared trip feature is implemented in Step 5. The local demo fixture is unchanged; the real loader belongs to Step 6.

## 2026-10-08 — Existing-account password authentication in Settings
**Decision:** Settings provides existing-account email/password login and logout only, using the shared Supabase browser client and auth state. No self-service signup, account creation, password reset, magic link or social login is implemented in Step 5. Supabase JS manages persisted sessions and token refresh.

## 2026-10-08 — Modern browser key and V1 isolation
**Decision:** Use the modern Supabase publishable key in the browser client, with public project configuration in one module. Do not use privileged credentials or the legacy anon JWT. The already-applied V2 tables remain isolated from V1; existing V1 Supabase tables, policies and advisor warnings stay untouched. This Step 5 frontend integration performs no database DDL or migrations.

## 2026-10-08 — Retain offline snapshots after logout
**Decision:** Validated offline trip snapshots remain local device data after logout and are readable signed out/offline in that browser profile. Clearing is explicit in a future Settings control; browser storage removal/eviction may also remove them. Signed-in fallback uses owner-scoped pointers so switching accounts does not silently return another account's cached trip. Remote ownership remains enforced by Supabase RLS. App Version, Trip Data Version and Trip Schema Version remain separate.

## 2026-10-08 — Schema 2 emergency information with Schema 1 compatibility
**Decision:** Current Trip Schema Version is 2; supported versions are 1 and 2. Schema 1 retains its original strict contract. Schema 2 adds one generic emergency-information model with globally stable contact IDs, generic categories, optional phone/HTTP(S) URL/region/context and canonical source references. Shared common definitions and cross-reference validation avoid competing contracts.

**Compatibility:** Remote row/payload versions must match. LoadedTrip and cached records retain their actual source schema version. Existing Schema 1 IndexedDB snapshots remain readable without rewriting, migration, deletion or a database-name/storage-version change; Schema 2 records may coexist safely. Unsupported future formats remain clean errors and cannot replace valid offline data.

**Database:** No live schema change is required because published trip payloads remain JSONB. No Supabase DDL, V1 table changes or browser publishing is performed.

**Step boundary:** Trip Information reuses canonical transport/accommodation/navigation/hard-cut/checklist/source data. Step 10 renders checklist definitions only; local-first state/sync belongs to Step 11 and weather belongs to Step 12.


## 2026-10-08 — Step 11 deterministic local-first checklist sync
**Decision:** Keep canonical checklist definitions immutable in trip snapshots and store checked state/dirty queue separately in `travelpilot-v2-user-state`. Scope state by owner, trip ID and stable item ID. Demos are null-owner local-only; downloaded real trips retain their owner. Logout retains device data; another authenticated account cannot sync it; original-owner sign-in resumes synchronization.

**Conflict policy:** `(client_updated_at, device_id)` replaces server-arrival `updated_at` as LWW ordering. Persist a non-secret UUID device identity and monotonically increasing per-device mutation clock. Use deterministic UTF-8/C-collation tie ordering on browser and database. The approved migration adds client_updated_at and a restricted private SECURITY INVOKER trigger that skips stale/equal writes and assigns server updated_at only to accepted changes. A final pull after every push reconciles server-rejected races. RLS/ownership/grants remain the security boundary; no SECURITY DEFINER, V1 modifications or real-user test data.

**Sync/controls:** Debounced mutation/sign-in/reconnect, visible focus/visibility, conservative visible 30-second polling and manual Settings sync; no Realtime. Confirmed per-list reset uses normal state changes. Orphans are retained without rendering/upload/deletion. Explicit confirmed Settings clearing removes local trip/checklist/queue/sync data only, warns about pending loss, retains Auth/fonts/non-secret device clock, and never issues server DELETE.

**Update checks:** Settings reads published App Version metadata only. Missing current metadata is neutral, numeric prereleases compare semantically, and older rows are never offered as upgrades. Optional persisted automatic checking defaults off and controls checking only. Manual/automatic checks themselves never reload or replace the current app; when a newer version is found, an explicit `立即更新` action may reload the current route. Language remains Traditional Chinese and cloud preference sync is deferred.


## 2026-10-08 — Schema 3 data-driven weather and separate Official Alerts
**Decision:** Current Trip Schema 3 supports rich weather/provider configuration while strict readers 1/2 remain readable without cache migration or snapshot rewriting. Providers are selected by adapter IDs in trip data; weather sample coordinates/elevation can differ from broad canonical regions. Generic day-to-weather-region mappings drive date-matched suitability.

**Forecast/scoring:** Normalize Open-Meteo once into provider-independent metrics and use a dedicated ten-minute IndexedDB weather cache keyed by trip/region/provider plus configuration signature. Never write dynamic forecasts into trip snapshots or Supabase. Evaluate separate weighted Experience/Access rules, coverage thresholds, access share and configurable conservative caps. Baselines cannot hide missing metric coverage; region Access uses minimum. Scores are advisory and never establish official operating status.

**Alerts:** Provider-specific external adapters are permitted, while country/slug/place/timezone provider selection is forbidden. Step 12 implements only fictional `demo-alerts`, always visibly labelled POC測試警告 / 非真實官方警告. JMA is planned for later real Japan-trip migration and must be selected through Trip Data configuration; no live JMA/TMD/AEMET/global aggregation exists here. Alerts remain separate and do not automatically override suitability until structured safety impact has product review.

**Device privacy/scope:** Weather cache survives logout, as other downloaded local data does. The existing Step 11 Settings clearing behavior stays unchanged; dedicated weather-cache controls are deferred and browser site-data clearing can remove this store. Step 12 does not change live Supabase, V1, Home/Settings/Back, Today or camera playback; next is Step 13 only after separate authorization.

## 2026-10-09 — Schema 4 multi-day camera relationships and canonical content views

**Decision:** Extend camera JSON in Schema 4 with required routeDayIds/tags arrays and optional description, priority and sourceLabel; retain strict Schema 1/2/3 contracts and centralize legacy singular relationships in one compatibility helper. No stored snapshot conversion, cache redesign or live Supabase schema change is needed.

**Canonical data:** Attractions status is derived per occurrence from day timeline/optional/backup content, never stored as a global Place.status. Category counts may overlap while each filtered view shows a Place once. Region grouping/order, metadata and detail content reuse canonical snapshot records. Camera grouping/filtering similarly uses canonical region/place/day relationships.

**Media boundary:** Generic sourceType plus HTTPS capability determines lazy embedded/image/external presentation. HTTP inline sources stay external without rewriting. Conservative iframe sandbox, image failure panels and permanent safe external actions avoid provider-specific hacks. Status URLs are links only; availability is never inferred from camera loading, weather or a status link. No discovery, scraping, polling or automatic still-image refresh.

**Scope:** Shared loader/routes/navigation/weather/Place detail remain the single sources. Production and live Supabase are untouched; Today Mode is not implemented here.


## 2026-10-09 — Today Mode is derived planned state, with explicit preview/manual focus

**Decision:** Step 14 uses existing Schema 4 relationships and strict readers 1/2/3/4. Day/time/focus, next required mapped stop, canonical Hard Cuts and final accommodation/destination are runtime derivations, not new snapshot fields. No Schema 5 or live Supabase migration is necessary; Data Versions remain unchanged.

**Timing/state:** Trip-local matching date takes initial precedence over a valid remembered preview and canonical first dayNumber. Planned intervals preserve timeline order, handle overnight/untimed content safely and never imply GPS completion. Non-today preview stays explicitly labelled and uses no live progress countdown. Manual focus uses stable item IDs in guarded sessionStorage with unambiguous trip/day tuple keys; blocked storage remains usable in React memory. State is device/session local, never synced or treated as real arrival.

**Structured operations:** Required mapped destination is distinct from optional timeline progression. Navigation, car context, cuts and accommodation/final fallback use explicit canonical relationships/types only. No semantic regex, named-place/day/timezone rule or duplicated trip data.

**Weather/Wake Lock:** Reuse shared normalized weather/cache/scoring/alerts via dayRegions without changing global remembered region. Actual today uses current metrics, preview requires matching daily forecast and no fake horizon score. Suitability, alerts and official operation status remain separate. Wake Lock is optional, off-default and explicit-user-action only, with feature detection/cleanup and no persistence or automatic reacquisition.

**Compatibility/scope:** Physical cached Schema 1/2/3/4 snapshots remain readable offline without rewriting or trip-cache writes from Today. No Supabase operational-state writes, V1/production changes, GPS/background tracking, automatic arrival or service-worker expansion. Full cold-start offline QA remains Step 16; Step 15 migration has not begun.


## 2026-10-09 — Schema 5 optional exact cross-timezone timeline endpoints

**Decision:** The bounded Step 15B.1 patch adds optional strict `timing.start/end` objects containing offset ISO datetime and IANA timezone to Schema 5 only. End must be later as an absolute instant. Different dates/zones are valid, and timing takes precedence over optional legacy clocks. The offset defines the instant; the declared timezone formats the endpoint using generic Intl/24-hour/date presentation. No geography, transport-type or trip-specific branch.

**Compatibility:** Current schema is 5; strict readers 1/2/3/4/5 share canonical validation. Schema 1–4 definitions and all runtime fixtures/data versions stay unchanged. Exact timelines normalize adjacent legacy clocks in the selected day/trip zone for timestamp comparisons; timelines without timing retain the original algorithm. Existing date-based day selection, manual preview/progress/reset and other Today operations are unchanged. No old cache rewrite, IndexedDB redesign or live Supabase change.

**Scope:** App v2.0.0-poc.17, test-only Schema 5 proof snapshots, and timing helpers/UI labels only. Step 15B is **not complete** and Step 15C **has not started**. No real-trip migration, production changes, live database access, weather adapter/configuration, camera/checklist data or service-worker expansion.


## 2026-10-09 — Schema 5 operational Day and shared exact endpoint display

**Decision:** In Step 15B.2, a valid Schema-5 exact interval is active when `start <= now < end`. Its owning Day is operational Today even beyond the canonical trip-local calendar date. Initial/automatic selection prioritizes active exact intervals (latest absolute start, then canonical day number), then today's canonical date, remembered valid preview, and canonical first Day. An explicitly selected preview remains manual; stable-ID manual progress/reset is unchanged. The existing one-second Today clock hands automatic selection back to calendar rules at the exact end.

**Home/display:** Snapshot-aware Home status is current during any active exact interval, including before startDate or after endDate. Existing status ordering and displayed date range remain unchanged; the simple calendar-only tripStatus API stays available. Detailed Itinerary reuses the shared endpoint formatter, preserving offset datetimes in semantic time elements and displaying each declared IANA zone/date. Exact labels wrap above event content; legacy HH:MM layout and old-schema cross-midnight semantics are unchanged.

**Scope:** App v2.0.0-poc.18. Schema remains 5 with strict readers 1/2/3/4/5, unchanged demo.city.5/demo.road.5 data and no old-cache rewrite. This runtime/display patch does not modify production, live Supabase, SQL, loaders, storage, assets or real trip content. Step 15B remains incomplete overall; Step 15C has NOT started.


## 2026-10-09 — Trip page availability is capability-driven everywhere

**Decision:** Home shortcuts, in-trip navigation and direct trip routes use the same generic snapshot capability rule. `Live Cam` is available only when `snapshot.liveCams.length > 0`; `景點總覽` is available only when `snapshot.places.length > 0`. Detailed Itinerary, Trip Information and Today Mode remain generally available for a loaded trip.

**Direct-route rule:** A bookmarked/manual URL for an unavailable optional trip page redirects with history replacement to that trip's Detailed Itinerary rather than rendering an empty feature page. The rule is snapshot-driven and contains no trip slug, country, day or destination branches.

**Reason:** A trip must not advertise or expose a feature page that its canonical data does not support. Home and in-trip navigation must never disagree about feature availability.


## 2026-10-09 — Generic owner-scoped Home listing and official JMA boundary

**Decision:** Home merges its two local fictional fixtures with validated current published remote snapshots and existing validated cached snapshots. Owner-filtered trip rows and batched, ordered/paginated version reads share the route loader's canonical row/payload/schema/identity validator. Invalid or unsupported records are isolated and cannot overwrite valid cache. Local fixture slug identities take precedence generically; real content is never registered as a local demo. Sorting, operational status, next/recent badges and shortcuts reuse the existing snapshot-driven helpers without mutating stored data.

**Privacy:** Signed-in lists use only that owner's cache pointers. Auth initialization/account changes hide stale account results synchronously, cancel pending requests and reload the appropriate scope. Signed-out/offline Home may list previously downloaded device data, consistent with the existing logout-retention policy. Explicit Settings clearing remains unchanged. RLS is still the remote authorization boundary; content tables are read-only in browser code.

**Official Alerts:** The `jma` adapter is selected only by provider.adapter. Its validated configuration supplies official HTTPS XML feed URLs, product codes and area-code-to-weather-region groups. Structured configured area codes route reports; matchNames remain descriptive metadata and never select an adapter. Bounded XML rejects DTD/entities/HTML/malformed input; official-host-only report URLs, timeouts and request concurrency bounds prevent arbitrary HTML scraping or uncontrolled requests. Normalized alerts remain separate from suitability and operator status. Newer matched report updates/cancellations supersede older reports; training reports are excluded. Existing demo-alerts behavior remains unchanged.

**Network limitation:** This execution environment blocks direct official JMA requests (HTTP 403 / browser ERR_TUNNEL_CONNECTION_FAILED). Live feed/report verification is paused; browser CORS at deployed Pages cannot be established here. Parser/registry behavior is tested with intercepted XML fixtures only. No proxy, Edge Function, Worker or third-party CORS service is introduced; formats lacking supported configured area-code relationships are not broadcast to unrelated regions.

**Publishing:** The exact approved Japan Schema-5 payload is archived as a test/integration input, not bundled local-trip data. This repository task never inserts/publishes v2_trip_versions or modifies live schema, V1 tables or production. ChatGPT's separate publication step follows the repository/CI gate. Schema remains 5 with readers 1/2/3/4/5; no real itinerary rewriting or weather-based day switching. Step 15D is not started.

## 2026-10-10 — Pre-15D R1 sticky shared shell and compact information density

**Decision:** Place the shared capability-aware trip page selector outside the trip heading, sticky within the actual main scroller. Use recognizable page icons and horizontal mobile scrolling with keyboard focus and 44px minimum targets. Measure navigation height for stacking pre-existing itinerary/info sticky selectors rather than assuming fixed dimensions.

**Presentation:** Preserve full trip ID, source, data/schema version metadata but move it to a small page-end technical footer. Add a scroll-aware Back-to-Top and accessible green ONLINE/red OFFLINE status symbols. Reduce generic/list/checklist spacing while preserving notes, content and interactive target sizes.

**Boundary:** This is shared UI only. No trip-specific rendering, live content publishing, JMA/weather behavior changes, V1 or production modifications. R2 is separately scoped. For R2, the user explicitly approved using today's available actual five-day weather as **visibly marked simulated POC QA data**, never as a factual forecast for future itinerary dates.

## 2026-10-10 — R2 POC-only simulated weather for distant travel-date visual QA

**Decision:** On the dedicated POC deployment only, when a chosen itinerary date is outside the actual 5-day horizon, current actual forecast model metrics may be explicitly reused for UI presentation and a clearly-marked *simulated* day-profile score. Original forecast timestamps/dates/provider/cache/snapshot remain authoritative and unchanged; these numbers are NEVER described as actual trip-date weather. Non-POC deployments retain the truthful out-of-range informational state.

**Layout/Today:** Five forecast cards use the desktop width when feasible and align metric values. The same suitability calculation has more visible color bands. Today Mode labels main mapped destinations by current/future/preview focus, and supplementary parking/entrance guidance is grouped into the same compact card. No GPS inference or official operation assertion is introduced.
