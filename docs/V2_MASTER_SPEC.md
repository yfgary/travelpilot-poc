# TravelPilot V2 — Master Specification
Status: Draft baseline v0.1  
POC repository: `yfgary/travelpilot-poc`

## 1. Product goal
Rebuild TravelPilot with the same successful interface/experience as TravelPilot V1, while replacing the underlying architecture with a reusable multi-trip system.

V1 is the **Golden Visual Reference**.  
The Japan 2027 / Shirakawa-go itinerary is the **Golden Content Reference** for detail level.

A new trip must be created from structured data. ChatGPT may transform a supplied itinerary into the schema and research images/place information, but adding a trip must not require a new custom HTML page or trip-specific application logic.

## 2. Non-negotiable architecture principle
TravelPilot V2 is:
- data-driven
- multi-trip
- offline-first
- installable as a PWA
- responsive on iPhone and desktop
- backed by Supabase
- shared-component based
- free of trip-specific hard-coded rendering behaviour

If a feature cannot be implemented generically, report its complexity before proceeding.

## 3. Branding
Product name: **TravelPilot｜旅程管家**

Canonical product-brand assets:
- `assets/images/travelpilot_banner.PNG`
- `assets/images/travelpilot_icon.PNG`

Asset roles:
- `travelpilot_banner.PNG` is the **global Home-page TravelPilot hero/banner only**.
- `travelpilot_icon.PNG` is the canonical app/PWA/favicon/header brand icon.
- The TravelPilot brand banner must **never** be used as an individual real-trip banner/cover or as a real-trip image fallback.

Real-trip cover images:
- every real trip must have its own representative journey/destination image
- ChatGPT researches/selects that image during trip migration/content enrichment
- choose the place that best represents the whole journey, not automatically the arrival/departure city
- example: a Nagoya / Shirakawa-go / Takayama journey may use Shirakawa-go as its representative trip banner
- prefer official tourism boards, official attractions or other reliable/licensable sources
- preserve source/attribution/licence metadata where required
- if a suitable real-trip image cannot be resolved safely, ask the user rather than substituting the TravelPilot brand banner
- fictional/test trips may use a generic non-destination fallback

Suggested homepage copy:
- Main line: **每一段旅程，都準備妥當。**
- Supporting line: **行程、景點、天氣與旅途資訊，一站管理。**

Trip status labels:
- Upcoming: **下一趟旅程**
- Completed: **旅程已完成**

Copy remains editable without architecture changes.

## 4. Global behaviour
- Seven pages:
  1. Home
  2. Detailed Itinerary
  3. Trip Information
  4. Attractions Overview
  5. Live Cam
  6. Today Mode
  7. Settings
- Date format: `DD/MM/YYYY 星期X`
- Standard time: `HH:MM`, 24-hour
- Today Mode clock: `HH:MM:SS`, 24-hour
- Global font size: Small / Medium / Large
- Future language support should be structurally possible, but V2 initially supports Traditional Chinese only.
- Every page displays a persistent lower-left online/offline state and current App Version.
- Every page remains useful offline after trip data has previously been downloaded/synced.
- Online mode checks version state and can download newer data without unexpectedly reloading the active screen.
- App Version and Trip Data Version are tracked separately.

## 5. Home
Must:
- show TravelPilot｜旅程管家 branding and canonical icon/banner
- work clearly on iPhone and desktop
- show one card per trip
- include each trip's own representative trip image, place/region, trip name (location + year), travel dates, and shortcut entry; never reuse the global TravelPilot Home banner as a real-trip cover
- distinguish upcoming and completed trips
- surface version and online/offline state
- sort trips using actual travel dates, not hard-coded order

## 6. Detailed Itinerary
Header:
- trip name
- current page name
- shortcut icons to all other pages

Trip summary:
- trip introduction
- relevant regions/locations

Weather:
- current weather + 5-day forecast
- selector for all weather regions in the trip
- visibility
- cloud cover
- humidity
- wind speed
- gust
- precipitation
- new snowfall
- ground snow depth
- icon for each metric where suitable
- iPhone 5-day forecast scrolls horizontally
- daily suitability score uses the current day's planned activity categories and weather conditions
- scoring logic must be generic and shared

Daily itinerary:
- one collapsible group per day
- route summary: from → via → destination
- today's highlights
- image layout: 1 large + 2 small images
- timeline with planned start/end time, location, travel duration where relevant, and introduction
- Google Maps action for mapped locations
- attraction/shopping entries include description
- attraction entries include opening time, last admission, closing time, fee
- hotel entries include booking price, payment status, breakfast inclusion, hotel type
- detailed hotel section at bottom of relevant day
- backup attractions grouped in a collapsible section
- place detail entry opens a rich detail view containing:
  - opening / last entry / fee
  - why it is worth visiting
  - history/background
  - local importance
  - what to look for on-site
  - what the visitor should understand after visiting
  - suggested duration
  - official/primary source links
- attraction rating out of 10

## 7. Trip Information
Includes shared header/navigation/trip introduction/weather area plus:
- flights/transport
- rental car information
- hotels/accommodation
- full-trip hard-cut times
- pre-departure Hong Kong checklist
- morning driving/departure checklist
- local emergency information

Checklist definitions may differ by trip.
Checklist state must sync across iPhone/other iPhone/desktop via Supabase and remain usable offline.

Step 10 implements the practical information renderer and **read-only checklist definitions**. Functional checklist state/sync belongs to Step 11; weather belongs to Step 12.

Step 10 introduced **Schema Version 2**, adding generic local emergency contacts (category, title, phone/HTTP(S) URL, optional region, availability, description, notes and canonical source references). Current snapshots use **Schema Version 4**, with strict readers **1 / 2 / 3 / 4**. Schema Version 1 remains supported with its original strict contract and no emergency section. Source schema versions remain distinct from App Version and Trip Data Version; existing offline snapshots are not rewritten or deleted on read. Trip content remains JSONB, so this evolution requires no live database schema change.

## 8. Attractions Overview
- automatically derives attractions/places referenced by the itinerary
- grouped by location/region
- reuses the canonical place records rather than copying descriptions

## 9. Live Cam
Includes shared header/navigation/trip introduction/weather area.
Live cameras:
- derive from trip regions, attractions, and driving routes
- group by location
- may include attraction and road/highway cameras
- sources are data records, not page-specific code
- if a source cannot be generically embedded, show a supported external/open action rather than hard-code a brittle workaround

## 10. Today Mode
Merges the useful behaviour of V1 Driving Mode into a single Today page.
Must:
- auto-select the trip day matching today's date
- allow manual selection of another day
- show trip name, current page, today's date and live 24-hour clock
- show shortcut icons to other pages
- show trip introduction
- show today's activities
- show Google Maps actions
- show previous activity / current activity / next activity
- show current weather for the relevant area
- show today's hard-cut time(s)
- show next stop and planned start time
- show today's accommodation/final destination

Step 14 operational contract:

- Derive the initial Day from trip-local date, valid remembered session preview, then canonical dayNumber order. Preserve explicit preview focus rather than pretending another date is currently happening.
- Use canonical ordered timing for planned previous/current/next, including missing end, gaps, overnight and untimed items. Stable-ID manual previous/advance/reset is trip/day-session scoped and never claims GPS arrival/completion.
- Resolve the next required mapped stop, explicit navigation target, car safety notice, chronological canonical Hard Cuts and final accommodation/destination from structured relationships only; no semantic title/description regex.
- Reuse the existing shared weather/cache/scoring/alert pipeline. Actual today uses current metrics; preview requires exact daily forecast or shows honest horizon absence. Day weather does not mutate global region preference.
- Optional off-default Screen Wake Lock requires explicit user action, feature detection, truthful status and cleanup without automatic reacquisition.
- Keep all physical cached Schema 1/2/3/4 snapshots readable offline without payload rewrites or operational-state Supabase writes. Clock tick is cleaned up and never refetches weather every second.

## 11. Settings
Must include:
- Supabase login/logout and login state
- global font size: Small / Medium / Large
- offline trip/data management
- downloaded trip status
- last sync time
- App Version
- Trip Data Version
- check for update
- auto-update preference
- cache management
- current language: Traditional Chinese
- visible placeholder/architecture readiness for future languages without implementing translation in this version

## 12. Offline/PWA requirements
TravelPilot must be installable on iPhone home screen and supported desktop browsers.

After prior sync/download, offline mode must preserve access to:
- itinerary
- hotel/accommodation information
- attraction/place descriptions
- transport information
- hard-cut times
- checklists
- essential cached images

Internet-only features may be marked unavailable/offline:
- live weather
- live cams
- external live resources

Offline state must not produce a broken browser error page.

## 13. Version/update behaviour
- visible version indicator remains part of the UI
- App Version is separate from Trip Data Version
- when online, compare local and server/data versions
- newer data/app assets may download in background
- do not unexpectedly reload the page currently being used
- apply the update on user reload/reopen, or after an explicit user action when necessary

## 14. Supabase
The existing Supabase project/Auth approach is retained, but V2 data structures are isolated from V1 tables. New V2 tables use the `v2_` prefix.
V2 uses Supabase for:
- authentication
- structured trip data
- checklist sync
- user preferences
- version metadata
- sync metadata

Sensitive credentials must not be committed to the repository.

## 15. Difficulty rule
Any function assessed as Complex or High-risk must be discussed with the user before implementation. The user may simplify or drop it. No feature justifies trip-specific hard-coded architecture.


## Step 12 weather/suitability and alert contract

- At the Step 12 release, current Trip Schema Version was 3; readers 1/2/3 were supported without rewriting old offline snapshots. Schema 3 provides data-selected forecast/alert providers, provider-region mapping, optional sample elevation, explicit day-region mapping and rich activity-profile rules. Current release is v2.0.0-poc.14; fictional Data Versions demo.city.4/demo.road.4 are separate.
- One shared WeatherPanel on Detailed Itinerary, Trip Information and the Live Cam placeholder displays normalized Open-Meteo current weather and five current-date forecast days. Hourly samples derive daily visibility/cloud/humidity/noon snow. Region preference is per-trip; mobile forecasts scroll horizontally with keyboard support. Forecast days 4–5 visibly say 趨勢參考. Out-of-range itinerary dates receive no fabricated score.
- Experience and Access/Safety are separate weighted data-configured rules, combined by access share and capped by conservative safety thresholds. Weighted metric coverage gates insufficient data; missing values are not zero and a baseline cannot conceal missing coverage. Region aggregation uses minimum Access. Operation-required profiles state 官方運行狀態優先於天氣分數; no score implies an operation is open.
- Dynamic forecasts live in dedicated IndexedDB, never immutable trip content/Supabase. Ten-minute fresh TTL, explicit refresh and offline/stale fallback preserve good cached data with timestamps/source notices. Request deduplication and trip/region identity prevent stale response leakage. Weather cache survives logout; Settings remains unchanged and dedicated weather-cache management is deferred.
- Official Alerts use a provider-independent validated contract and data-selected adapter registry. Adapter files for individual external services are allowed; country/slug/destination/timezone-based selection is forbidden. Step 12 implements only fictional demo alerts, visibly labelled POC測試警告 / 非真實官方警告. Empty alert sections hide; active region-scoped alerts show type/severity/timing/instructions/source above forecasts.
- Future JMA integration is planned for real Japan-trip migration through Trip Data configuration. No live JMA/TMD/AEMET/global aggregation or alert-driven suitability override exists in Step 12. Today weather, real camera playback, migrations and service-worker expansion remain out of scope. Next authorized task must be separately requested: Step 13/16 — Attractions Overview + Live Cam.

## Step 13 Attractions Overview and Live Cam contract

- Release v2.0.0-poc.15; current Trip Schema 4; strict readers 1/2/3/4; fictional Data Versions demo.city.5/demo.road.5. No live Supabase schema change or real trip migration.
- Attractions derives referenced canonical Places from main, optional/bonus and backup day content. All is unique Places; category counts may overlap. Show canonical region groups, keyboard/mobile quick navigation, deterministic order, image or text-only fallback, facts/maps/official actions and the same detailed Place dialog used by itinerary. Unreferenced Places are omitted; no canonical Place.status is added.
- Schema 4 cameras require routeDayIds and tags arrays (empty allowed), with optional description, priority primary/reference/backup and sourceLabel. Validate every day/region/place relationship and region/place consistency. Older versions retain singular routeDayId and their frozen strict shape; reading never upgrades a stored payload.
- Live Cam shares WeatherPanel, with honest zero-camera state, canonical region/place/global grouping, optional data group labels, linked-day filters and a non-filtering trip-timezone today hint. Multi-day cameras appear once per view. Data-derived priority/tags/context do not imply operating status.
- HTTPS source capability drives lazy embed/image; external sources may use HTTPS preview. HTTP-only inline sources stay external; failed/blocked media always retains safe deduplicated source/official/status/maps actions. Embed sandbox may limit third-party functionality. No scraping, automatic refresh, source discovery, provider-specific rendering or parsing status pages.
- Camera availability, weather suitability and Official Alerts remain separate. All content children use the sole shared loaded-trip boundary. Shared routes/header/Back, Home and Settings are unchanged. Today Mode remains Step 14, not begun.


## Step 14 Today Mode delivery contract

- App **v2.0.0-poc.16** delivers dedicated Today Mode; current Schema **4**, readers **1/2/3/4** and Data Versions **demo.city.5 / demo.road.5** remain unchanged. No schema convenience fields or live Supabase migration.
- All trip pages consume the sole TripLayout loaded context and share navigation/Back. Today combines operational focus, complete daily activities, structured safe Maps, canonical cuts/final destination, shared normalized weather/three-part suitability/Official Alerts and optional Wake Lock.
- Preview, planned auto focus and session-local manual focus are explicit. Clock uses the trip timezone and HH:MM:SS without every-second screen-reader announcements. Trip/day session keys are unambiguous even with punctuation in stable IDs.
- Responsive screenshots and all-font checks cover 320/390/430/1024/1440px, including 320px Large and end-of-day. The completed regression result is recorded in V2_CURRENT_STATE.md.
- Planned timing is not GPS; Maps and live weather depend on device/network; suitability is not operating status; Wake Lock may be unsupported/revoked. Full cold-start PWA/service-worker offline QA remains Step 16. No production changes, real-trip migration, background tracking or auto-arrival.
- Next is Step 15/16 — Real Trip Migration + ChatGPT Content Pipeline, not begun.


## Step 15B.1 bounded timing patch

- App v2.0.0-poc.17; current Trip Schema 5; strict readers 1/2/3/4/5. Local Schema 4 fixtures and demo.city.5/demo.road.5 Data Versions remain unchanged.
- Schema 5 optionally supplies strict start/end offset datetimes plus IANA zones on timeline items. Validate end > start as instants; different endpoint dates/zones are allowed. Today uses absolute timing when supplied and endpoint-local 24-hour/date/zone labels; absent timing keeps legacy behavior. Manual preview/progress/reset remain unchanged.
- No cached snapshot conversion, live Supabase/schema/data changes, production edits or real-trip migration. Step 15B is not complete; Step 15C has not started.
