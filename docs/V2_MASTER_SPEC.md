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
