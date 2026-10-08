# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Progress
**Step 12/16 — Weather + Suitability + Official Alerts Framework: COMPLETE**

Current App Version: **v2.0.0-poc.14** (canonical source: package.json)

Current Trip Schema Version: **3**; supported readers: **1 / 2 / 3**.

Local Trip Data Versions: **demo.city.4** / **demo.road.4**.

Next: **Step 13/16 — Attractions Overview + Live Cam**

## Completed
- V2 direction agreed: rebuild architecture, preserve V1 interface/experience.
- V1 designated Golden Visual Reference.
- Japan 2027 / Shirakawa-go designated Golden Content Reference.
- POC repository confirmed: `yfgary/travelpilot-poc`.
- Production is out of scope and must not be modified.
- Supabase retained.
- PWA/offline-first requirement confirmed.
- Seven-page model confirmed.
- No-hard-code rule confirmed.
- Complexity escalation rule confirmed.
- Master specification drafted.
- Architecture baseline drafted.
- Initial Supabase/data schema drafted.
- Roadmap drafted.
- Decision log initialized.
- Engineering rules initialized in `AGENTS.md`.
- Production V1 Golden Content files inspected for schema validation.
- V2 schema validated against Japan 2027 and amended for navigation targets, richer hotel/payment data, grouped checklists, live-cam grouping, weather profiles, and richer hard-cut metadata.
- `docs/V2_SCHEMA_VALIDATION.md` added.
- Phase 1 schema validation result: PASS.

## Not started
- Full V2 feature implementation (foundation and shared visual shell complete)
- Complete PWA/offline implementation (manifest and versioned snapshot cache foundations are complete)
- Remaining trip content renderers (generic Detailed Itinerary and Trip Information are complete; Attractions, Live Cam and Today remain placeholders)
- Complete V1 UI parity across trip pages (shared responsive shell and Home parity are complete)
- Live Cam implementation
- Today Mode implementation
- real trip data migration

## Repository cleanup
- Legacy V1/previous POC implementation files have been removed from this repository by user request.
- After cleanup, the POC contained only V2 planning/docs, a clean V2 README, and the two canonical TravelPilot branding assets. Step 3 has now added the clean V2 application foundation.
- Canonical assets verified on POC:
  - `assets/images/travelpilot_banner.PNG`
  - `assets/images/travelpilot_icon.PNG`

## Pre-Step 8 branding clarification
- Documentation release App Version `v2.0.0-poc.8` records a locked asset-role rule before Step 8 implementation.
- `assets/images/travelpilot_banner.PNG` is reserved for the global TravelPilot Home hero/banner only.
- A real trip must use its own representative researched destination/journey image; the TravelPilot brand banner is never a real-trip cover fallback.
- Example decision: a Nagoya / Shirakawa-go / Takayama trip may use Shirakawa-go as its representative image when it best defines the journey.
- Fictional demo trips may use a generic non-destination fallback.
- Step 8 implementation was unstarted at this documentation release; the implementation release below is `v2.0.0-poc.9`.

## Next step
Step 12 implements the generic weather/suitability engine and fictional Official Alerts framework. After the Step 12 gate passes, next is **Step 13/16 — Attractions Overview + Live Cam**, only when explicitly authorized. Step 13 has not begun; real trip migration remains outside this release.

## Handoff instruction
In a new conversation/session:
1. Read `AGENTS.md`.
2. Read all `docs/V2_*.md` files, especially this file and the Decision Log.
3. Summarize current phase, completed work, open issues, and next bounded task.
4. Do not modify code until the requested task is clear.


## Architecture review resolution
The 08/10/2026 higher-effort architecture review has been resolved and recorded in `V2_DECISIONS.md`.

Locked decisions:
- React + TypeScript + Vite
- GitHub Pages hash routing
- hybrid versioned JSONB trip snapshot model
- `v2_` Supabase isolation; existing V1 tables remain untouched
- generic V1 weather-profile ideas reimplemented cleanly in TypeScript
- persistent lower-left online/offline + App Version on every page
- repository-relative branding paths
- 16-step progress tracking

## Step 3 completed foundation
- Clean React + TypeScript + Vite application, with strict TypeScript checks.
- One shared shell for Home, Settings and all five trip views.
- Hash routes with `:tripSlug`, a generic metadata-only `demo-trip` fixture, and clean trip/page not-found states.
- Reusable `app`, `views`, `components`, `data/schema`, `services`, `offline`, `styles` and `types` boundaries.
- Canonical icon/banner wired without changing the source files; build copies preserve original paths and bytes.
- PWA manifest foundation: TravelPilot｜旅程管家, TravelPilot, zh-HK, standalone, original icon.
- App Version starts at `v2.0.0-poc.1`; `package.json` version is the canonical source, with the display prefix injected by Vite.
- Persistent basic lower-left ONLINE/OFFLINE and App Version on every view.
- Basic narrow/mobile and desktop rendering only; no final V1 visual parity.
- GitHub Pages repository base `/travelpilot-poc/`, with a manual POC-only build/test/deploy workflow. No deployment was run.
- No production repository or Supabase tables accessed or modified.

## Step 3 verification
All Step 3 acceptance criteria passed:
- `npm install` succeeded (78 packages installed).
- `npm run build` passed, including `tsc --noEmit` for application and tool/test configuration.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`: **30 passed** against the production build.
- Chromium viewports: 320 × 740 mobile and 1440 × 900 desktop.
- All seven route/view types load and directly reload under the GitHub Pages base without page errors or horizontal overflow.
- Every demo trip view reads/displays the route slug; each unknown trip route shows the generic not-found state and returns to Home.
- Shared navigation, lower-left status and ONLINE → OFFLINE → ONLINE changes verified.
- Manifest metadata/start URL/scope and canonical image URLs verified; served and built images match the originals byte-for-byte (SHA-256 also verified).
- Source review found no trip/country/day/place-specific application branches; demo slug appears only in fixture data and routing tests.
- Existing V2 specification/architecture/schema/decision/handoff/roadmap/validation files and canonical source assets remain unchanged.
- `git diff --check` passed.

## Step 4 implemented shell
- App Version bumped to `v2.0.0-poc.2`; package.json remains canonical. AGENTS.md now requires every POC implementation/update commit intended for main and every production release to bump App Version, independently of Trip Data Version.
- V1 Home HTML/CSS inspected read-only as the Golden Visual Reference. The new shell uses its blue/cyan family, Arial/Traditional Chinese font fallbacks, pale blue background, rounded white cards and compact navigation. No legacy V1 scripts were copied.
- `app/pages.ts` defines all seven approved labels: 首頁 / 詳細行程 / 旅程資料 / 景點總覽 / Live Cam / 今日模式 / 設定. Routing and reusable navigation derive from this configuration.
- Reusable header, page heading, navigation and Loading / Empty / Error presentation components. Unknown trips still use one generic not-found state.
- One global 小 / 中 / 大 preference provider scales the root font size (14 / 16 / 18px). Valid values persist in localStorage. Invalid or blocked storage does not crash the app; blocked writes show a session-only notice.
- Home retains the canonical banner, approved product/tagline copy and one generic demo-trip card. Trip pages remain placeholders.
- Settings provides font-size controls, 繁體中文 and canonical App Version. Login/offline/sync/update remain future placeholders.
- A reserved lower-left footer keeps ONLINE/OFFLINE and App Version visible below the scrollable main content without covering controls. Includes safe-area spacing.
- POC workflow now triggers on pushes to main and workflow_dispatch. Both jobs are guarded for yfgary/travelpilot-poc/main; deployment requires successful npm ci, typecheck/build and the complete Playwright suite.
- Production was read only for visual reference, never modified. No trip-specific application branches or backend functionality were introduced.

## Step 4 verification
- `npm ci` succeeded (79 packages installed).
- `npm run build` passed, including strict TypeScript application/tool/test checks.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`: **105 passed** against the final production build.
- All Step 3 checks retained, with approved label changes; tested at 320px, 390px, 430px, 1024px and 1440px.
- All seven views, direct hash-route reloads, generic unknown trips/pages, shared navigation, connection transitions and persistent status passed.
- All three font sizes tested across every route and width; body/content overflow, navigation touch targets and bounds, preference reload persistence, invalid storage and blocked storage passed.
- Main content stays above the status footer; actionable controls remain reachable after scrolling.
- Banner aspect ratio and original icon/banner SHA-256 hashes checked. Served assets remain byte-for-byte identical to source originals.
- Home and large-font Settings screenshots inspected for mobile/desktop baseline.
- `git diff --check` passed; no canonical source assets or production files changed.
- No new architecture decision was necessary; V2_DECISIONS.md remains unchanged.

## Step 5 completed frontend foundation
- Existing Supabase project: Japan Winter 2027 Sync. The V2 database tables, grants and ownership policies were already applied and verified with advisors by GPT-5.6 Sol before this task, as confirmed by the handoff. No DDL, table changes or migrations were performed here.
- `docs/V2_DATABASE_SCHEMA.md` now records the applied V2 access model and the prior advisor verification. V1 tables and existing V1 advisor warnings remain untouched.
- App Version bumped to `v2.0.0-poc.3`, using package.json as the canonical source.
- Exact `@supabase/supabase-js` version pinned to 2.117.3, with committed lockfile and compatible Node requirement.
- One public configuration module holds the supplied project URL and modern publishable key; one reusable browser client owns standard SDK session persistence and auto refresh. No privileged credential or legacy anon JWT is used.
- Shared AuthProvider restores/checks sessions with getSession, subscribes synchronously to auth events and unsubscribes on cleanup. Generic states cover initialization, signed out, signed in and auth error. Startup results cannot overwrite a newer auth event.
- Settings supports existing-account email/password login and logout only, with duplicate-submit protection, password-type input, field clearing on submit and generic Traditional Chinese errors. Signed-in UI shows email, not internal user IDs.
- Settings checks published v2_app_versions with one bounded read per visit. Loading/success/failure is separate from navigator.onLine. No polling or automatic database-read retries; an empty result is a successful connection.
- Private trip ownership and existing-account-only authentication decisions recorded in V2_DECISIONS.md. App shell, Home, Settings and the unchanged local demo fixture remain available signed out. Real trip loading is deferred to Step 6.

## Step 5 verification
- `npm ci` succeeded (88 packages installed).
- `npm run build` passed, including strict application/tool/test TypeScript checks.
- Complete Playwright suite: **145 passed** against the final production build, at 320px, 390px, 430px, 1024px and 1440px.
- All 105 Step 3/4 checks retained with the release-version expectation updated.
- Added signed-out/password-only UI, password input type, no signup/reset actions, duplicate-submit loading, generic login error, password clearing/no console or storage exposure, signed-in email, SDK persistence/reload, successful logout and remote logout failure checks.
- Delayed session refresh verifies initialization without blocking the shell, then shared signed-in state across navigation.
- Backend loading/success/empty-list/failure checks verify published-only bounded reads and separation from browser ONLINE status.
- Source/build credential checks found no privileged keys; new frontend data code references no V1 tables and introduces no trip-specific branches.
- Supabase requests are intercepted at the network boundary in all automated tests. CI uses fake sessions and never needs real account credentials or writes to the real database.
- Canonical branding remains unchanged; responsive/font preference/hash route/error/status regressions pass.
- `git diff --check` passed. Production repository and all Supabase tables remain untouched by this task.

## Step 6 completed schema / loader / navigation foundation
- Mandatory Step 4 navigation regression fixed first in Step 6 preflight. Shared visual Back button on every non-Home route, aria-label `返回上一頁`, safe recorded app-route history, direct-entry Home fallback and reload persistence. Pending router entries are flushed before unload, covering immediate reloads before React commits. No Settings-specific navigation logic or native history-length assumption.
- Final Step 6 release App Version `v2.0.0-poc.6` from package.json; Trip Schema Version 1; Trip Data Version separate (local demo `demo.1`). Exact Zod 4.6.5 and idb 8.0.4 dependencies pinned and lockfile committed.
- One canonical Zod snapshot schema with inferred TypeScript types for trip/regions/days/timeline/places/accommodation/transport/navigation/hard cuts/checklists/weather/Live Cams/images/sources. Generic weather and Live Cam data only, no engines.
- Structured runtime issues reject unsupported versions, malformed shape, duplicate stable IDs, broken references, invalid dates/date order/day range or duplicates, coordinates, ratings and negative durations.
- Local demo converted to a valid minimal version-1 snapshot with region/day/timeline/place/navigation references. Home still lists only demo-trip; trip content views remain placeholders.
- Read-only authenticated Supabase loader checks own v2_trips row, current published v2_trip_versions row, schema versions, payload trip ID/slug and full runtime validation. No content writes or V1 table access.
- IndexedDB version records keyed by tripId/dataVersion and atomic owner/device current pointers retain older snapshots. Reads revalidate cache. Remote invalid/unavailable/unsupported responses use valid cache without overwriting it; blocked storage leaves remote data usable with a notice.
- Signed-out/offline cached data remains readable on the device. Logout does not delete it; privacy behavior is documented in architecture/schema/decisions/README. Signed-in fallback is account-scoped.
- Asynchronous TripLayout shows loading/shared generic failures and metadata/version/source details. Cancellation prevents stale route results from replacing another trip's UI.
- `supabase/schema/v2_foundation.sql` is an unapplied source-control baseline reconstructed from read-only V2 catalog metadata, including indexes/RLS/grants/policies/private updated_at triggers. Live Step 5 foundation already exists; do not auto-apply. Future DDL requires proper migrations. No tables, V1 DDL or production files changed.

## Step 6 verification
- Navigation preflight: **30 passed** across five widths before proceeding to schema/loader work; final coverage also includes fresh direct Settings reload.
- `npm ci` succeeded (90 packages installed).
- `npm run build` passed, including strict application/tool/test TypeScript checks.
- Final complete Playwright suite against the stable production build: **315 passed**, at 320px, 390px, 430px, 1024px and 1440px.
- All 145 Step 3–5 tests retained, with only App Version expectations updated. Canonical image hashes/served bytes, route reloads, labels, font sizes/persistence, no overflow, touch targets, lower-left status and auth tests pass.
- Back tests cover exact itinerary/info restoration through Settings, page A → B → Settings → B, repeated Back, fresh direct Settings/trip entries, Settings reload, Home hiding Back, blocked storage and external-history safety.
- Schema tests cover valid minimal and rich generic content, malformed input, unsupported versions, duplicates, all required references, invalid dates/time/coordinates/rating/duration and invalid/duplicate checklist item IDs.
- Mocked remote tests verify owner filtering, only V2 content GET queries, current published filters, separate versions, generic failure states, invalid/unsupported payload rejection and unchanged valid cache.
- Real browser IndexedDB tests verify reload persistence, retained old/new versions and pointers (including opaque labels preserved exactly), corruption rejection, remote fallback, signed-out/offline reads, logout retention, account isolation and blocked storage behavior.
- All automated Supabase responses are intercepted; no real password or live test data writes. Existing Supabase metadata was read only for the baseline; RLS/advisor verification remains the prior Step 5 handoff, with no claim that V1 warnings were fixed.
- `git diff --check` passed. POC workflow remains protected and unchanged.
- Initial Step 6 candidate `v2.0.0-poc.4` (`7add6cd`) failed CI with 8 immediate-reload navigation failures (302 passed) and was not deployed. The subsequent navigation repair (`2f1c0c7`) passed all 315 tests locally and in CI and deployed, but incorrectly retained `v2.0.0-poc.4`, violating the per-update version-bump rule.
- The version-correction candidate was `v2.0.0-poc.5` (`ba20abb`), successfully tested and deployed. This correction changes only package/lockfile release metadata, automated App Version expectations and this release record. Schema, loader, IndexedDB cache, navigation logic, live Supabase, V1 tables, production and canonical assets are unchanged. Step 7 remained unstarted at that release.
- `v2.0.0-poc.5` version-correction verification: `npm ci` succeeded (90 packages), `npm run build` passed including TypeScript, complete Playwright suite **315 passed** across all five widths, and `git diff --check` passed. The unchanged test-gated POC workflow verifies CI and deployment after push.

- Final Step 6 release is `v2.0.0-poc.6`: shared Back button visibility improved after real-user feedback with a solid TravelPilot blue background, white arrow, circular 44×44px target, border/shadow and distinct hover/focus/pressed states on mobile and desktop. The shared header, accessible label, Home visibility rule and navigation behavior are unchanged. Only styling, release metadata, tests and this record changed; Step 7 remained unstarted at that release.

- Final `v2.0.0-poc.6` visual-correction verification: `npm ci` succeeded (90 packages), `npm run build` passed including TypeScript, complete Playwright suite **320 passed** (all prior 315 plus Back visual/interaction checks at 320px, 390px, 430px, 1024px and 1440px), and `git diff --check` passed. The unchanged test-gated POC workflow verifies CI/deployment after push. Existing non-blocking build warnings remain.

## Step 7 completed multi-trip architecture gate
**STEP 7 MULTI-TRIP GATE: PASS**

- App Version `v2.0.0-poc.7` from canonical package.json, with consistent lockfile/test expectations. Trip Schema Version remains 1; data versions are independent.
- `src/data/demoTrips/cityTrip.ts`: `demo-trip`, 城市週末示範旅程, `demo.city.1`, 12–14/04/2030. Fictional city/public-transport data with one region, three days, train/walk transport, one accommodation, indoor/food/shopping places, simple grouped checklist and weather profiles. Live Cams, hard cuts and navigation targets are intentionally empty.
- `src/data/demoTrips/roadTrip.ts`: `demo-road-trip`, 山區自駕示範旅程, `demo.road.1`, 05–08/02/2025. Fictional mountain/road data with two regions, four days, car transport, two accommodations, nature and backup places, parking target, hard cut, optional/backup references, multiple checklist groups, weather relationships and an example.invalid external Live Cam data record.
- The registry deliberately stores road before city. Adding Trip B required a snapshot/data record only: the canonical schema/validator, loadTrip service, cache, TripLayout, five views, routes, navigation, Back behavior and status/version components are unchanged. No destination-specific component, route, CSS or application branch was added; no schema field was weakened.
- `src/data/tripDates.ts` provides shared temporal status and sorting. Dates are compared in each trip's timezone: start <= today <= end is current, today < start is upcoming, today > end is completed. Current first; upcoming by nearest start; completed by most recent end; slug ties are deterministic. Sorting does not mutate registry order.
- Home retains its Step 4 presentation and shows both fictional cards with title, destination, DD/MM/YYYY 星期X date range, generic status (旅程進行中 / 未出發 / 旅程已完成), 示範資料 and Open Trip. Final visual parity and real remote trip listing are not implemented.

## Step 7 verification
- `npm ci` succeeded (90 packages); no dependency changes beyond release metadata.
- `npm run build` passed, including strict application/tool/test TypeScript checks.
- Complete Playwright suite: **395 passed** against the stable production build at 320px, 390px, 430px, 1024px and 1440px. All prior **320** regression cases are retained; **75** additional checks cover the gate across five widths. Existing tests only adjust release/fixture expectations and scope the city Open Trip action now that Home has two cards. The former minimal snapshot remains independent schema-test data, retaining all original malformed/rich-content assertions.
- Both local snapshots validate and load through unchanged loadTrip signed out/offline. They share no nested mutable objects; modifying returned validated data does not mutate either registered fixture. All ten local trip routes, direct reloads, title/summary/slug, data/schema versions, demo source, navigation/status and Settings → Back are verified.
- Fixed-clock Home tests cover the road trip in progress, city upcoming/in progress at both date boundaries, and both completed; explicit displayed order differs from registry order where appropriate. Generic helper tests cover all statuses, inclusive boundaries, timezone day shifts, sorting priorities and deterministic ties. No horizontal overflow; original font-size, branding and Back visual tests pass. Narrow Home screenshot inspected.
- Actual SDK/browser requests are mocked for distinct remote-city-trip and remote-road-trip payloads/IDs/data versions. Tests enforce GET-only v2_trips ownership/slug filtering and v2_trip_versions matching current/published filters. Independent metadata and cache/version/current/device pointers persist; unavailable, signed-out and offline fallback returns the correct slug. Logout retains both caches.
- Invalid remote Trip B is rejected before caching and cannot change Trip A or replace a previously validated B. A forged pointer to another slug is rejected; a delayed city response cannot replace the road route. Unknown third slugs stay generic. Shared Back preserves the originating trip/page, including cross-trip and Settings reload paths.
- Source audit forbids fixture slugs/destination names outside data fixtures and checks obvious trip/country/day/place branches. Protected core files, SQL baseline, workflow, styles and canonical branding assets have no diff. Original asset hash/served-byte tests pass. Only POC files changed; production, live Supabase schema, V1 tables and data remain untouched. All network tests use fake sessions; no real password or live test writes.
- `git diff --check` passed. The unchanged POC-only workflow requires npm ci → build/typecheck → complete Playwright → Pages deployment; GitHub Actions records the pushed release's CI/deployment result. No new architectural decision was necessary; V2_DECISIONS.md is unchanged.

## Step 8 completed Home parity
**STEP 8 HOME PARITY GATE: PASS**

- App Version `v2.0.0-poc.9` from canonical package.json, with consistent lockfile and automated expectations. Trip Data Versions and Trip Schema Version 1 remain unchanged.
- Production V1 `index.html`, `assets/travelpilot-home.css` and `trips/registry.json` inspected read-only as the Golden Visual Reference. Reimplemented its sticky white header, blue/deep-blue/cyan palette, pale background, prominent hero, MY TRIPS / 我的旅程 / trip count, rounded white panel, cover cards, compact typography, grouped actions and subtle interaction states in React/TypeScript. No legacy scripts or production changes.
- The shared header retains the canonical icon and Home/Settings navigation. Home has no Back button; non-Home Back history and accessible label are unchanged.
- The unchanged canonical `travelpilot_banner.PNG` is Home hero artwork only, with its natural aspect ratio and supporting copy. It is never a trip cover or fallback. The canonical icon/banner source and served bytes remain unchanged.
- Reusable `TripCard` consumes generic snapshots and derived status. One cover resolver selects heroImageId, then bannerImageId against snapshot.images, preserves source/attribution/licence metadata, rejects brand-banner misuse and falls back safely for missing/unresolvable/broken images. The fictional demos use abstract blue/cyan compass artwork explicitly labelled 非目的地示意設計, not destination photography.
- Existing timezone-aware temporal helper and non-mutating date sorting are reused. The nearest date-sorted upcoming trip receives 下一趟旅程; additional future trips use 未出發. Current/completed labels remain 旅程進行中 / 旅程已完成. Covers and recent usage do not influence ordering.
- One guarded localStorage preference records a generic slug when a Home card or shortcut opens. Only its matching card receives 最近使用, alongside temporal/demo badges. Reload restores it; blocked storage does not crash the app. No Supabase preference sync.
- Shortcuts derive from shared page definitions: 詳細行程 / 旅程資料 / 今日模式 always, 景點 when places exist, Live Cam only when liveCams is non-empty. City has no Live Cam action; road has one. All actions use the same hash routes and placeholder trip views.
- Card surfaces are real links with Enter/Space support; shortcut links are siblings, avoiding nested links and duplicate navigation. Focus styles, visible status text, image alt, 44px touch targets, wrapping dates/actions/badges and status-footer clearance are retained.
- One/many-card layout is generic: two columns where width permits, one on mobile. Only the requested dummy-data typo 都會车站 → 都會車站 was corrected. No schema, loader, cache, auth, Settings, database, service worker or trip renderer behavior changed; no new architecture decision was necessary.

## Step 8 verification
- `npm ci` succeeded (90 packages). No dependency additions or changes.
- `npm run build` passed, including strict application/tool/test TypeScript checks.
- Complete Playwright suite against the production build: **450 passed** at 320px, 390px, 430px, 1024px and 1440px. All prior **395** cases retained, with only release/approved Home action and badge expectations adjusted; **55** additional cases cover Home behavior across all five widths.
- Covers, hero/icon separation, hierarchy/count, date formatting/status, nearest upcoming, recent-use persistence/replacement/blocked storage, every shared shortcut, keyboard/focus behavior, broken-image fallback, one/five-card layouts, all font sizes, no overflow, badge spacing, touch targets and footer clearance verified. The source audit additionally checks Bangkok/Hokkaido branches.
- Existing local/remote multi-trip isolation, authenticated owner filters, GET-only V2 access, IndexedDB version/cache isolation and fallback, logout retention, auth and shared Back regressions remain passing. All Supabase test boundaries are mocked; no real account credentials or live test writes.
- Visual QA screenshots generated across all five widths. Reviewed 390px Home, 1440px Home, 320px Home with Large font and the 1024px desktop layout, including hero/header, MY TRIPS, next/completed/recent badges, abstract covers, wrapped actions and differing Live Cam capability. Compared hierarchy/density with V1's reference HTML/CSS. Screenshot capture now waits for canonical images to decode; its final five-width rerun passed **5/5**, and the TypeScript recheck passed.
- `git diff --check` passed. Canonical asset hashes/served bytes, no trip-specific branches and protected POC-only workflow checks pass. Production, live Supabase/V1 tables and protected trip/auth/history code remain untouched. The existing workflow gates deployment on npm ci → build/typecheck → complete Playwright suite.

## Step 9 completed Detailed Itinerary engine
**STEP 9 DETAILED ITINERARY GATE: PASS**

- App Version `v2.0.0-poc.10` comes from canonical package.json, with consistent lockfile and automated expectations. The enriched fictional fixtures use independent Trip Data Versions `demo.city.2` and `demo.road.2`. Trip Schema Version remains **1**; its canonical implementation was not changed or weakened.
- Production V1 `itinerary.html`, `assets/multi-trip-itinerary-renderer-v1.js`, `assets/attraction-info.css`, `assets/itinerary-hotel-detail-v1.js`, and the reference trip's `itinerary.json`, `hotels.json` and `attractions.json` were inspected read-only. Reimplemented the visual concepts in React/TypeScript: day navigation, rounded day accordions, warm highlights/warnings, large-plus-two-small gallery, timeline, place detail dialog and grouped accommodation facts. No legacy JavaScript, hydration/storage keys or real itinerary content was copied.
- Dedicated `DetailedItinerary` route consumes the full validated snapshot from a typed shared Outlet context. TripLayout remains the single asynchronous loading boundary. Its keyed outlet resets child state when the trip/data version changes; other trip views remain placeholders. No duplicate loadTrip, Supabase or IndexedDB calls were added to child components.
- Shared components render data-driven, independently expandable days, timeline items in stored order, highlights, constraints/warnings, linked hard cuts, galleries, canonical places, transport/navigation targets, accommodation and collapsible optional/backup references. All six generic timeline types and all schema entity-reference kinds are supported without fixture/destination/day/place branches.
- The default open day matches today's calendar date in the trip timezone, otherwise the first day by day number. Day shortcuts open/focus the corresponding summary and scroll within the shared shell. Dates retain DD/MM/YYYY 星期X and times retain HH:MM.
- One generic content-image resolver is reused by Home covers and day galleries. It excludes the Home brand banner; missing/broken/unresolvable gallery images disappear safely. Galleries show up to three referenced images with meaningful alt, source/attribution/licence metadata and responsive one/two/three-image layouts. Three original abstract SVG test assets in `assets/demo/` are explicitly non-destination artwork; build copies them without altering the canonical banner/icon. Neither fixture assigns the Home banner as trip content or cover.
- Place summary/facts and the accessible native detail dialog read the same canonical record, including rating /10, duration, opening/last-entry/closing, currency/fee, rich context, maps, official link and resolved sources. Escape/close restore focus. Shared maps resolution uses explicit URL, query, then coordinates; external actions have accessible names, safe protocols, new-tab behavior and noopener/noreferrer. No map SDK or invented location/payment facts.
- Accommodation facts show available room/meal/booking/payment/check-in/out/cancellation/parking/notes and navigation data; missing values are hidden. Currency and duration formatting are generic. Hard cuts appear both in highlights and their related timeline item intentionally, with time, severity, title and description.
- City/public-transport and mountain/road-trip fixtures were enriched with fictional content only. Optional feature absence remains valid. Home, Settings/auth, shared Back behavior, schema validation, remote loader, version-aware cache, Supabase baseline, live database and V1 tables remain unchanged. No new architectural/product decision was required.

## Step 9 verification
- `npm ci` succeeded (90 packages); no new dependencies.
- `npm run build` and the final `npm run typecheck` passed, including strict application/tool/test TypeScript checks.
- Complete Playwright suite against the final production build: **580 passed** at 320px, 390px, 430px, 1024px and 1440px. All prior **450** regression cases remain, with release/data-version expectations and the dedicated itinerary route assertion updated. **130** additional cases cover the generic renderer and architecture. Footer reachability now checks visible controls because collapsed native details retain hidden descendants; new assertions also verify collapsed controls are not visible.
- Tests cover both fixtures/schema/data versions, default day/timezone behavior, independent accordion/jump controls, ordered timelines and all six types, highlights/hard cuts, zero/one/two/three-image layouts and real broken-image recovery, shared maps precedence, place facts/dialog/source/focus/Escape, hotel facts/payment omissions, optional/backup references, empty/minimal content and all supported entity-reference kinds.
- All three global font sizes remain usable at all five widths, including **320px + Large**. No body horizontal overflow; gallery captions fit, touch targets remain usable, dialogs stay within the viewport and bottom actions clear the persistent status footer.
- Actual SDK requests are mocked. Remote and cached itinerary tests verify exactly one v2_trips/v2_trip_versions read at the shared boundary, no child reloads/cache reads from view interactions, unchanged persisted snapshots and no live writes. Existing remote multi-trip/cache isolation, offline fallback, logout retention, auth and exact-trip Settings/Back regression tests pass.
- Visual QA screenshots generated for both trips across all five widths. Inspected 390px city/road, 1440px city/road and 320px Large-font road, including intro/header, day controls/summaries, warnings/hard cuts, full galleries, timeline/maps/rating, detail dialog and sources, accommodation, backup/bonus content and bottom/footer clearance. Compared hierarchy and density with the read-only V1 reference. Supplementary full-gallery/accommodation/source screenshots and measured day-control bounds confirm responsive layouts.
- Source audit found no trip/country/day/place-specific application branches, V1 table access, privileged browser credentials or legacy architecture. Canonical image hashes and served bytes remain unchanged. Protected schema, loader/cache, auth/history, SQL baseline and workflow have no diff; only POC files changed. Production and live Supabase remain untouched.
- `git diff --check` passed. The unchanged POC-only workflow gates deployment on npm ci → build/typecheck → complete Playwright suite → Pages deployment. Its release CI/deployment result is verified after push. Step 10 is not started.

## Step 10 completed Trip Information / compatible Schema 2
**STEP 10 TRIP INFORMATION GATE: PASS**

- App Version **v2.0.0-poc.11** comes from canonical package.json with consistent lockfile/test expectations. Fictional city/road Trip Data Versions are **demo.city.3** / **demo.road.3**. Current Trip Schema Version is **2**, with supported versions **1 and 2**; the three version concepts remain separate.
- Production V1 `trip-info.html`, `assets/multi-trip-trip-info-renderer-v1.js`, `trips/_template/trip-info.example.json`, and the reference trip's `trip-info.json`, `hotels.json` and `departure-checklist.json` were inspected read-only. Reimplemented its section hierarchy, sticky quick navigation, compact practical cards, hotel fact groups, parking warnings, Hard Cut overview, checklist grouping and prominent emergency phones in React/TypeScript. No legacy JavaScript/storage keys, destination behavior or real trip content was copied.
- Dedicated `TripInformation` consumes the full typed snapshot from the existing Outlet context. TripLayout remains the sole loadTrip boundary; child sections perform no Supabase/IndexedDB reads. Other three trip views remain placeholders. Home, Settings/Auth, Back/history and Detailed Itinerary behavior/styles remain unchanged; shared entity cards gain opt-in timing/heading presentation only.
- Available canonical records drive both sections and quick navigation: non-car **主要交通**, car **租車／自駕**, all **住宿酒店**, grouped **導航／泊車**, chronological **全程重要 Hard Cut**, read-only **Checklist 定義**, and **當地緊急資料**. Missing sections are absent. Shared accommodation/transport/navigation/hard-cut cards, facts, notes, Maps, safe external links and money/duration formatters are reused without parallel datasets.
- Transport departure/arrival use DD/MM/YYYY 星期X HH:MM in the trip timezone. Accommodation exposes available room/stay/payment/practical facts. Navigation groups distinguish parking/entrance/station/pickup/dropoff/other and show the related place separately from the actual target. Hard Cuts sort actual datetimes and linked day/date/time, with deterministic ID fallback and canonical source links.
- Checklist lists/groups/items sort copied arrays by order with stable ID ties. Their labels/notes are read-only definitions: no functional checkboxes, saved/ticked states, reset controls, checklist localStorage/IndexedDB state or v2_checklist_state calls. Functional state/sync remains Step 11; weather remains Step 12.
- Schema 1 retains the strict Step 9 contract. Schema 2 extends shared Zod definitions and the single cross-reference validator with generic emergency contacts and emergencyContact entity references. IDs remain globally unique; regions/sources/entities and HTTP(S) URLs are validated. Central getEmergencyInfo handles version access; Schema 1 simply omits emergency. Remote row/payload schemas must match; actual source versions are retained, and future formats are rejected cleanly.
- Both Schema 2 fictional demos exercise generic emergency categories/regions/availability/notes/source links. Prominent phones and optional safe tel actions come only from data. Dummy contacts/numbers are explicitly marked fictional, not real emergency information. City retains its optional car/navigation/Hard Cut absence; road exercises self-drive, parking, rich accommodations, Hard Cut, multiple checklist definitions and roadside support. No trip/country/day/place branches.
- IndexedDB remains **travelpilot-v2-trips**, physical storage version **1**, with unchanged stores/keys/pointers. Existing Schema 1 records read without rewriting, deleting or migration. Schema 1/2 versions coexist; invalid or unavailable updates retain/fall back to valid cache. Logout retention and owner/device scopes are unchanged.
- No live Supabase DDL/data changes are required or performed: v2_trip_versions already stores JSONB and a positive integer schema_version. V1 tables, source-controlled SQL baseline, POC workflow and canonical banner/icon are untouched. Production was read-only; no real trip migration, checklist state/sync, weather or Step 11 implementation.

## Step 10 verification
- `npm ci --cache work/npm-cache` succeeded (**90 packages**), using the ignored workspace cache because the sandbox cannot write the default home cache. No dependencies were added or changed.
- `npm run build` passed, including strict application/tool/test TypeScript checks.
- Complete Playwright suite against the final production build: **740 passed** at **320px, 390px, 430px, 1024px and 1440px**. All **580** previous cases are retained with release/data/schema expectations and the dedicated info-route assertion updated; **160** additional cases cover Schema 1/2 compatibility and Trip Information across five widths. Existing remote/cache regression fixtures retain the exact archived Schema 1 payloads rather than silently becoming Schema 2.
- Frozen city/road payloads in tests/fixtures/schema1-*.json match the Step 9 commit **71a603e** exactly. A manually seeded pre-Step-10 IndexedDB record uses the original physical format, renders itinerary/info signed out/offline, retains Schema 1, omits emergency and remains unchanged after reload. Tests verify zero writes on cache read, physical DB version 1, Schema 1/2 coexistence, actual source metadata, invalid-update fallback and mismatch rejection without deletion.
- Actual SDK network boundaries are mocked for Schema 1 and 2 remote responses, both row/payload mismatches and future version 3. No real password, live test writes or child data loads. Existing owner-scoped multi-trip isolation, current/published queries, offline fallback, logout retention, Home, Settings/auth and exact-trip Settings/Back regression tests pass.
- Tests cover both data-driven renderers; all generic transport types/zoned times; conditional payment/Maps/warnings; rich/minimal hotels; all six navigation-target categories and place distinction; Hard Cut chronology/context/sources; non-mutating ordered checklist definitions with no state writes; generic emergency categories/optional fields/safe phones/regions/sources; and section absence for minimal content.
- All three font settings work across all five widths, including **320px + Large**. No horizontal body/main/card overflow; long operator names/warnings/contact data wrap; actions retain practical 44px targets, quick-nav jumps keep headings below the sticky nav, and bottom content clears the persistent ONLINE/OFFLINE + App Version footer.
- Responsive screenshots generated and visually inspected for **390px city/road**, **1440px city/road** and **320px Large-font road**. Reviewed headings/quick nav, transport/self-drive, accommodation facts/payment, navigation/parking and Maps, Hard Cuts, read-only checklist groups, emergency contacts/phones/sources, long-warning stress data and bottom/status clearance. Hierarchy/density follows the read-only V1 reference and existing TravelPilot family; no pixel-perfect or physical Safari claim.
- Source/build audits verify no destination-specific branches, V1 table access, privileged credentials, legacy patch architecture, default emergency numbers or checklist-state storage. Canonical branding source/served bytes remain identical. Protected Home/Settings/auth/history/itinerary stylesheet/view, SQL baseline and workflow have no diff.
- `git diff --check` passed. The unchanged POC-only workflow gates npm ci → build/typecheck → complete Playwright → Pages deployment. The pushed release's CI/deployment result is verified after push. Step 11 is not started.

## Step 10 historical limitations
- No real published V2 trip data is seeded by this task, and no real account password was used. Remote loader/auth behavior is tested with the actual SDK and mocked network responses. No live DDL or advisor remediation is performed.
- Cached private trip snapshots remain readable signed out in the same browser profile until cleared/evicted. Clear Offline Data UI, image caching, service worker and cold offline app-shell startup are later steps.
- Home lists the two local fictional demos only. Real remote Home listing and representative photo research/content migration are not implemented. Detailed Itinerary and Trip Information render validated local/remote/cached snapshots; Attractions, Live Cam and Today remain shared placeholders. Demo maps/fees/bookings/emergency phones/services/sources are fictional testing data, not real travel or emergency guidance. Checklist definitions are read-only; functional checklist state/sync starts in Step 11. No weather scoring/API, playback, Today Mode logic or Supabase preference sync. Home temporal statuses recalculate on render/visit; no continuous midnight update timer is added. Recent-use persistence is device/browser-local and cannot survive blocked storage.
- Auth uses standard browser storage and default global logout scope; a failed server logout may still clear the local session, as documented in Step 5.
- Build has non-blocking upstream Zod comment-annotation warnings and a ~660kB minified JS chunk (~193kB gzip). No warning threshold or test requirement was weakened.
- Chromium viewport tests and Home/itinerary/Trip Information visual review are not physical iPhone/Safari certification or parity for the still-unimplemented trip renderers. App-managed Back relies on session storage for reload continuity; blocked storage safely falls back Home after reload.

## Step 10 historical handoff (superseded below)
**Step 11/16 — Settings + Checklist Local-First Sync** (not started)

Only when explicitly authorized: implement generic Settings improvements and local-first checklist state with Supabase sync, using the existing validated definitions and shared shell.

Do not begin Step 11 in this release. Production must not be modified.

## Step 11/16 — Settings + Checklist Local-First Sync

**STEP 11 SETTINGS + CHECKLIST SYNC GATE: PASS**

Release App Version: **v2.0.0-poc.13**, canonical package.json; lockfile and automated expectations match. Current Trip Schema Version remains **2**, supported readers **1 and 2**; local Trip Data Versions remain **demo.city.3** / **demo.road.3**. Checklist changes are user state and do not change snapshot versions.

### Implemented
- Real accessible native checkboxes in canonical checklist/group/item order, immediate optimistic values, completion counts/percentages, local/sync status and confirmed per-checklist reset through ordinary mutations. No daily/title/destination-specific behavior.
- Separate IndexedDB `travelpilot-v2-user-state` (storage version 1) with owner/trip/stable-item state, durable dirty queue and real sync metadata; persistent non-secret random device identity and atomic monotonic mutation clock. Storage blocking/quota failure keeps session state and an honest warning.
- Shared Auth/connection-aware sync manager: scoped local reads, debounced changes/sign-in/online, visible focus/visibility, conservative visible 30-second polling and manual Settings sync. Local winners batch upsert only canonical browser fields; remote winners reconcile clean; mandatory final pull corrects server-rejected stale races. Failed sync never reverts local values or drops pending changes. No Realtime.
- Demos remain local-only with zero checklist Supabase requests. Remote/cached trips retain original owner identity internally; signed-out cached-owner editing works and original-owner sign-in resumes pending sync. Another authenticated account cannot read/upload the other owner's pending values. Orphans remain stored without rendering/upload/deletion.
- Settings: existing account/password Auth and global 小/中/大 unchanged; actual pending/last-success/error information; validated current cached trip titles/destinations/data/schema/download times; explicit confirmed all-device clearing with pending-loss warning; published-version metadata checks with persisted optional auto-check; Traditional Chinese placeholder and canonical App Version.
- Clearing removes local trip snapshots/pointers, checklist rows/dirty queue and sync timestamps, cancels in-flight sync, and never deletes server rows, logs out Auth or changes font preferences/assets/definitions. Non-secret device identity/clock remains to prevent timestamp reuse.
- Version checks never reload, hot-swap code or refresh the viewed trip. Current App Version missing from server metadata is neutral「版本資料尚未同步」; older versions are never offered as updates. Automatic checking defaults off and controls metadata checking only.

### Approved live database change
- Exact migration: `supabase/migrations/20261008135932_step11_checklist_client_clock.sql`, created with Supabase CLI migration workflow and aligned to its recorded applied history version. The exact SQL was shown to Gary, explicitly approved, applied once successfully and remained unchanged.
- Only `public.v2_checklist_state` plus its dedicated private trigger/function changed. Added `client_updated_at timestamptz NOT NULL DEFAULT now()`; deterministic `(client_updated_at, device_id)` LWW uses C collation; stale/equal updates are skipped atomically. Server owns accepted-arrival `updated_at`.
- Read-only catalog checks verified the new field, RLS, four ownership policies, unchanged least-privilege grants, restricted SECURITY INVOKER function/empty search_path, new checklist trigger and untouched other V2 timestamp triggers.
- V1 counts before/after remained **39 / 0 / 1** for trip_checklist_state / trip_checklist_shared / trip_sync_config. V2 checklist count remained **0**; no real user test rows were inserted.
- Security/performance advisor findings matched preflight exactly after ignoring observation timestamps; **no new V2 security warnings**. Existing V1/global Auth warnings remain untouched and were not fixed. Details/remediation links: `supabase/verification/step11.md`.
- Historical `supabase/schema/v2_foundation.sql` remains unchanged and unapplied. No additional live schema changes or V1 modifications.

### Release history
- Initial Step 11 candidate `v2.0.0-poc.12` (`bb16d99`) passed all 990 tests locally. Its first CI run [37795474685](https://github.com/yfgary/travelpilot-poc/actions/runs/37795474685) failed two itinerary interaction checks and skipped deployment. A second run of the same candidate [37795476061](https://github.com/yfgary/travelpilot-poc/actions/runs/37795476061) passed and deployed; both results are retained here.
- Gary approved `v2.0.0-poc.13` for the repair commit, satisfying the per-implementation-commit version rule. Generic place-dialog Escape/close actions now clear React state directly rather than waiting for a delayed native close event. Day-jump tests wait for the intended focused summary; caption/figure containment is measured atomically within one frame. Existing assertions and time limits remain intact; no trip-specific fix or further database change was made.

### Verification
- `npm ci`: PASS.
- `npm run build` (both TypeScript checks + production Vite build): PASS.
- Complete Playwright suite: **990 passed** across 320 / 390 / 430 / 1024 / 1440px, retaining all 740 prior cases and adding 250 Step 11 cases. Final `v2.0.0-poc.13` local run passed all 990 cases in **17.6 minutes**, using two workers to match the two-CPU environment. An earlier four-worker run exceeded one unchanged foundation test's existing 30-second limit; assertions/time limits were not weakened.
- Coverage includes local/offline/reload/rapid mutation clocks, storage failures, immutable definitions, owner isolation/local-read ranges, mock remote batches/final-pull conflicts, two-device convergence, orphan handling/stable IDs across content versions, confirmed reset/clear, actual sync timestamps, update metadata and unchanged prior multi-trip/Auth/cache/schema/Home/Back/asset behavior.
- Actual approved SQL executed in a pinned dev-only PGlite PostgreSQL engine: stale/equal rejection, newer/tied-device acceptance, server timestamp ownership, authenticated ownership/RLS and restricted private function. Browser Auth/REST always mocked; no real passwords or live test writes.
- Required screenshot QA inspected: 390px city/road checked checklists, 1440px road checklist, 390px/1440px Settings and 320px Large Settings/checklists; checked styling, group order, completion/reset controls, cache/version/clearing details, fonts/account/language/status reviewed. Responsive body/card/touch/footer checks pass at all five widths.
- `git diff --check`: PASS. Canonical assets remain byte-for-byte unchanged. Trip schema, fixtures/data versions, Home, Back history and historical SQL baseline remain unchanged; the shared place-dialog lifecycle repair is documented above. Production repository untouched.
- POC-only push-to-main workflow remains build/test gated; CI and Pages results must be checked after this release commit is pushed; deployment still requires a successful complete suite.

### Step 11 known limitations (historical)
- Sync is item-level device-clock LWW with focus/reconnect/visible polling, not Realtime or a collaborative merge model. Demo fixtures never sync; no real trip migration or Home Supabase list was added.
- App/static-image cold offline caching, cloud font/auto-check preferences, automatic daily resets, selective offline clearing and localization remain deferred. Storage blocking/eviction prevents guaranteed persistence.
- Logout intentionally retains device-private data; anyone using the same signed-out browser profile can access previously downloaded routes. Use confirmed local clearing before sharing a browser profile.
- Published server App Version metadata may lag the POC package release; neutral status is intentional and no metadata publishing was added.
- Original fictional snapshot notes are preserved, including historical Step 10 read-only wording; checklist definitions and their Data Versions were not rewritten.
- Existing non-fatal Vite bundle-size/Zod annotation notices remain; pre-existing Supabase advisor findings are recorded without changes.

Historical Step 11 next task was Step 12; its implementation record follows.


## Step 12/16 — Weather + Suitability + Official Alerts Framework

**STEP 12 WEATHER + SUITABILITY GATE: PASS.** Release **v2.0.0-poc.14** uses canonical package.json, current Trip Schema **3**, supported readers **1 / 2 / 3**, and separate fictional Data Versions **demo.city.4 / demo.road.4**.

### Implementation
- All eight requested Production V1 weather/profile/suitability/bridge/config files were inspected read-only as visual, metric and scoring references. No legacy JavaScript, destination/day branching, default-trip logic or legacy weather storage keys were copied.
- Schema 3 extends weather with forecast-provider definitions, provider mapping, optional coordinate/elevation sample points, explicit day-to-weather-region mapping, Experience/Access rules, access share, coverage, safety caps, operation requirements and alert-provider configuration. Canonical Zod schemas infer types; Schema 1/2 strict contracts remain unchanged. Frozen actual Schema 2 fixtures join the existing Schema 1 archives.
- A data-selected `open-meteo` registry adapter requests current metrics plus five daily forecasts and hourly samples, using configured timezone/coordinates/elevation and epoch timestamps. Normalization converts visibility metres to kilometres and snow depth metres to centimetres; snowfall remains centimetres. Daily visibility mean/min/max, cloud/humidity means and nearest available local-noon snow depth are derived from hourly data. Missing metrics stay unavailable; malformed units, dates/series or metrics fail safely. Provider attribution is visible.
- Dedicated `travelpilot-v2-weather-cache` IndexedDB storage uses `[tripId, weatherRegionId, providerId]` and a sample/provider configuration signature. Online fresh TTL is ten minutes; expired/manual refresh fetches, failed refresh preserves valid stale data, offline reads cache, and no-cache failure leaves the trip usable. Timestamps and source/stale/storage limitations are visible. In-flight requests deduplicate, and region/trip identity protects against late responses. No forecast is written into immutable trip snapshots or Supabase.
- Piecewise/categorical rules and weights come from trip data. Experience and Access are calculated separately; missing metrics renormalize available weights while weighted coverage gates misleading scores. Baselines cannot disguise missing metric coverage. Final uses access share then configured caps, rounded/clamped to one decimal. Aggregate Access uses the minimum and retains unrounded thresholds when applying caps. Operation-required activities state that official operation status takes priority; scores never assert an attraction/road/service is open.
- One `WeatherPanel`, shared trip-level weather context and scoring service serve Detailed Itinerary, Trip Information and the Live Cam placeholder. Region preference is device-local and per-trip, with active mapped day then first-region fallback. Day suitability uses the exact mapped region and forecast date; unrelated dates show an honest out-of-range note. Mobile forecasts scroll horizontally, support arrow-key navigation, and mark days 4–5 as trend reference.
- Provider-independent validated Official Alerts use a data-selected registry. Step 12 includes only `demo-alerts`; every fictional alert visibly says **POC測試警告 / 非真實官方警告**. Active alerts are region-scoped, sorted deterministically and displayed above forecasts with severity/type/timing/instructions/source. Empty alert sections are hidden. Alerts do not override meteorological suitability.
- Both unrelated fictional fixtures remain data-only. City indoor/walking/transit profiles illustrate resilient indoor Experience and potentially reduced Access. Road scenic/driving/operation profiles have stronger visibility/gust/snow-depth sensitivity and a fictional warning. No real destination or trip migration.

### Verification
- `npm ci`: PASS. `npm run build` (both TypeScript checks + production Vite build): PASS. Complete Playwright suite: **1,355 passed** in **21.8 minutes**, two workers, across **320 / 390 / 430 / 1024 / 1440px**; all 990 prior cases retained plus 365 Step 12 cases. `git diff --check`: PASS.
- Local preflight found a duplicate fixture profile/checklist ID and outdated test expectations/selectors/reduced-day references; these were corrected without weakening validation/assertions. A desktop focus-visible test now explicitly exercises keyboard input, keeping its outline assertion. Five-width focused checks passed, followed by the complete green suite above. No failed candidate was pushed.
- Existing POC-only main workflow remains npm ci → typecheck/build → complete Playwright → deploy only after success. CI/Pages verification occurs after this release commit is pushed and is reported in the release handoff; no production workflow was modified.
- Required visual screenshots generated and inspected: 390px city/road itinerary, 390px Trip Information/Live Cam placeholder, 1440px road itinerary, and 320px Large road weather. Current metrics, selector, score splits/chips/caps, operation note, five horizontal cards/trend labels, stale timestamp, fictional/absent alerts, in-range day score, out-of-range note and status clearance were reviewed. No body/main overflow in these captures.
- The original 990 regression cases are retained. New coverage exercises all three schema readers, actual pre-Step12 physical Schema 2 cache reads without migration/write, normalized units/hourly aggregates/noon, weighted coverage/safety caps, cache TTL/manual/offline/failure, three-part cache isolation/config changes/tampering, pending/late requests, alert scope/expiry/sorting, all fonts/five widths and long labels.
- Canonical banner/icon, Home, Settings, router/Back behavior, existing trip/checklist cache design and approved Step 11 SQL remain unchanged. No live Supabase request writes/migration or production modifications. Automated Auth/Supabase/Open-Meteo boundaries are mocked; no real password or provider availability required in CI.

### Known limitations
- Only Open-Meteo forecast and fictional demo alerts are implemented. JMA is planned for real Japan-trip migration via trip-data provider configuration; no live JMA/TMD/AEMET/global aggregation exists. Alert-to-score safety overrides are deferred; users must check official operations independently.
- Schema 1/2 trips lacking Schema 3 configuration show an informational state rather than fabricated providers/rules. No automatic snapshot conversion, cache deletion, database rename or storage-version bump occurs.
- Forecast horizon is five current-date days, not arbitrary itinerary dates; days 4–5 are trend-only. Demonstration coordinates/content are fictional. Forecasts represent model sample locations, not verified attraction/road operations.
- Weather cache is separate device data and survives logout. The unchanged Step 11 Settings clear control manages trip/checklist stores; dedicated weather-cache clearing is not added in Step 12. Browser site-data clearing/eviction removes weather cache; blocked storage permits session-only use without durable offline guarantees.
- No background weather polling, Today integration, camera playback, real alert provider, Supabase weather storage, migrations or service-worker expansion. Existing nonfatal Vite bundle-size/Zod notices remain.

Next: **Step 13/16 — Attractions Overview + Live Cam**. **Not started.**
