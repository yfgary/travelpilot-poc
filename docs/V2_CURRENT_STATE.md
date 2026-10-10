# TravelPilot V2 — Current State

Last updated: 11/10/2026 (Hong Kong)

## Progress
**Step 14/16 — Today Mode: COMPLETE**

**Step 15B.1/16 — Schema 5 Cross-Timezone Timeline Timing Patch: COMPLETE.**

**Step 15B.2/16 — Operational-Day + Exact Timing Display Patch: COMPLETE.**

**Step 15B.3/16 — Capability-driven trip navigation guard: COMPLETE.** Release v2.0.0-poc.24 finalized the capability guard and regression tests; failed candidates v2.0.0-poc.19–23 were never deployed.

**Pre-15C update UX repair:** v2.0.0-poc.25 adds an explicit `立即更新` action after a newer App Version is detected. Version checks themselves remain non-disruptive; reload occurs only after explicit user action. Optional trip pages now use the same snapshot capability rules on Home and inside a trip; unavailable direct routes redirect to Detailed Itinerary. At that preflight release, Step 15C had not started.

Deployed R7 main baseline: **v2.0.0-poc.42**, main SHA `ef356cb75c597706321525c722995e4bd624ca26`. R7 main CI/Pages [38088143574](https://github.com/yfgary/travelpilot-poc/actions/runs/38088143574): **2,715 tests PASS (11.2m)**, build `114318877866` and deploy `114321120443` successful before R8 tracked edits. R8 candidate **v2.0.0-poc.43** on `qa/pre15d-r8-final-regression`, based exactly on that R7 main. Package/lock match. R8 is Draft-only; no merge/deploy.

Current Trip Schema Version: **6**; supported readers: **1 / 2 / 3 / 4 / 5 / 6** (R4). Published Japan jp2027.1 remains immutable Schema 5.

Local Trip Data Versions: **demo.city.5** / **demo.road.5**.

**Step 15C — Japan 2027 Integration: COMPLETE.** POC v2.0.0-poc.26 passed CI/Pages with 2,465 tests. The exact validated jp2027.1 Schema-5 snapshot is published/current in Supabase for the Japan trip. Live JMA verification remains limited by the execution-environment network block. **Step 15D has NOT started.**

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
- Complete PWA/offline implementation (manifest and versioned snapshot cache foundations are complete)
- Complete V1 UI parity across trip pages (shared responsive shell and Home parity are complete)
- Step 15D Bangkok + Hokkaido data-only migration (blocked until the current UI/presentation QA gate is resolved)

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
R8 final Draft review and separately approved Japan content authoring/publication decisions. **Step 15D is blocked and has NOT started.** See [R8 acceptance](V2_R8_FINAL_ACCEPTANCE.md), the R7 unpublished proposals and R6 source-verification limitations. Historical step records retain their original release boundaries.

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

Historical Step 12 next task was Step 13; its implementation record follows.

## Step 13/16 — Attractions Overview + Live Cam

**STEP 13 ATTRACTIONS + LIVE CAM GATE: PASS.** Release **v2.0.0-poc.15** uses canonical package.json, current Trip Schema **4**, supported strict readers **1 / 2 / 3 / 4**, and separate fictional Data Versions **demo.city.5 / demo.road.5**.

### Implementation
- All twelve requested Production V1 Attractions/Live Cam markup, renderer, detail/style, template and trip-data references were inspected read-only. `assets/live-v9-2-sync.js` was also inspected as an architecture example to avoid. No legacy JavaScript, default-trip/hydrate logic, fixed/dynamic day bindings, provider hostname patches or real trip content was copied.
- Schema 4 extends camera JSON only: required `routeDayIds` and `tags` arrays (empty allowed), optional description, primary/reference/backup priority and sourceLabel. All day references, duplicate relationships, safe HTTP(S) URLs and explicit region/place consistency validate. Canonical Zod definitions infer types. Strict Schema 1/2/3 contracts retain singular `routeDayId`; one `getLiveCamDayIds()` helper supplies compatible UI relationships without rewriting old snapshots. Rich weather config applies unchanged to Schema 3/4 through one guard.
- Dedicated Attractions Overview derives canonical Place usage from normal/optional/bonus timelines and day optional/backup Place references. Places can have several statuses/days; All is unique Places, category counts overlap honestly, and day badges deduplicate. Unreferenced Places are omitted. Canonical Region ordering, earliest day/status/name/ID sorting, category filters and keyboard/horizontal region navigation require no second dataset or Place.status field.
- Cards use shared canonical image resolution (first valid record, next valid on failure, clean text-only absence), PlaceFacts, MapsAction, ExternalLink and the exact existing PlaceDetail dialog. Ratings, durations, opening/last entry/closing, fees, descriptions, source/official actions and image attribution remain canonical. No Home brand banner appears in content cards.
- Dedicated Live Cam reuses WeatherPanel/context and the sole TripLayout loading boundary. Explicit region then Place region then Other/Whole Trip drives grouping, with optional data group labels. Only linked days become filters; multi-day cameras appear once per view. Trip-timezone today hint does not automatically filter. Description, priority, tags, source labels and context come from data; missing metadata is not fabricated.
- HTTPS source capability selects lazy titled/fullscreen-capable sandboxed iframe or lazy image; external sources can show a safe HTTPS preview. Failed media retains clean panels/actions; HTTP embed/image stays external without HTTPS rewriting. Source/official/status/maps actions are safe and deduplicated. Embed always retains an external fallback. Status links do not imply operation; weather suitability, alerts and camera availability remain separate. No scraper, automatic source discovery, hostname/camera-name branches, polling or still-image auto-refresh.
- City retains zero cameras; road has three clearly fictional POC records exercising multiple regions/days and global scope. Existing non-camera fixture content is unchanged. Synthetic embed/image resources exist only in mocked tests/QA, not as claimed working real cameras.
- Home, Settings/Auth, Back history, checklist behavior, original trip/checklist/weather stores and loader remain unchanged. Today remains a placeholder; Step 14 is not begun. No live Supabase calls were used for database administration, schema changes, publishing or test writes. V1 tables and production remain untouched.

### Verification
- `npm ci`: PASS. `npm run build` (both TypeScript checks + production Vite build): PASS. Complete Playwright suite: **1,700 passed** in **24.5 minutes**, two workers, across **320 / 390 / 430 / 1024 / 1440px**. All **1,355** prior cases retained and **345** new Step 13 cases added. `git diff --check`: PASS.
- New five-width focused suite: **345 passed** in **4.0 minutes**. Initial local test-fixture issues (image IDs absent from original Places, demo fixture shadowing a cached archive slug and legitimate online cachedAt refresh) were corrected in tests without weakening schema, assertions or time limits. The first complete run passed 1,698 cases and exposed two existing test sequencing assumptions. For batching, auto-scrolling between checkbox actions could exceed the unchanged 500ms debounce. The test now issues both changes in one browser turn and additionally asserts both checkboxes; all original two-row batch, timestamp and clean-queue assertions remain. Checklist implementation, assertions/time limits and SQL are unchanged. The frozen-clock reload test also attempted to uncheck before persisted checked state restored; it now explicitly waits for that state before acting, preserving all durable-value/device-clock assertions. Both corrected cases passed three repetitions at every width (30 focused passes), followed by the full green rerun above. No failed implementation candidate was pushed.
- Frozen actual Schema 1/2 archives and pre-Step13 Schema 3 city/road payloads validate unchanged. Physical Schema 1/2/3 cache tests verify rendering/source versions and zero trip-store writes/deletes/upgrades. Schema 4 remote/reload/signed-out/offline tests preserve metadata and valid cache. Existing weather tests still exercise actual frozen Schema 3 alongside current Schema 4; all preceding local-first checklist, multi-trip, owner isolation, Home/Auth/Back/version/asset tests pass.
- Required screenshots generated and visually inspected: **390px city/road Attractions**, **1440px road Attractions**, **320px Large road Attractions**, **390px city zero-camera/road Live Cam**, **1440px road Live Cam**, **320px Large road Live Cam**. Additional synthetic 390px canonical image, embed and still-image views were reviewed. Filters/counts, region navigation, multi-status/day badges, facts/maps/detail, weather/empty states, group/priority/tags, day filtering, wrapped actions, media fallback and footer clearance were checked. Every captured scenario measured zero body/main horizontal overflow. All three fonts pass automated responsive checks at all five widths.
- Source audits verify a single load boundary, canonical datasets/detail/weather reuse, immutable fixture content, unchanged archived payload hashes, no trip/country/day/place/camera/provider-site branches, no V1 data access and no privileged credentials. Browser Auth/Supabase/forecast/media boundaries are mocked; no real password or live test rows.
- Canonical banner/icon remain byte-for-byte unchanged. Approved Step 11 SQL and historical baseline remain unchanged and unapplied in this step. No production repository modifications or live Supabase migration/writes. The POC-only gated workflow is unchanged; CI and Pages outcome is verified after this commit is pushed and reported in the release handoff.

### Known limitations
- Real camera sources may refuse embedding through CSP/X-Frame-Options or require permissions unavailable in the conservative iframe sandbox. A working third-party stream is not guaranteed; permanent external actions are the fallback. Image failures are handled, but cross-origin framing failures cannot always be detected automatically.
- No camera discovery, scraping, provider-specific behavior, parsed operation status or automatic still-image refresh. Source/status links and loaded media do not establish road/attraction operating status. Weather scores and Official Alerts remain advisory and separate.
- Only fictional camera/alert examples and mocked media resources are included. No real trip migration, live JMA/other official provider, Today Mode, service-worker expansion, Supabase Home listing or checklist/cache redesign.
- Existing device privacy remains: cached trips/weather survive logout, and signed-out users in the same browser profile can access previously downloaded routes. Explicit Settings trip/checklist clearing is unchanged; dedicated weather clearing remains deferred. Storage blocking/eviction can prevent durable offline use.
- Visual QA uses Chromium viewport screenshots, not physical iPhone/Safari certification. Existing nonfatal Vite bundle-size/Zod annotation notices remain.

Historical Step 13 next task was Step 14; its implementation record follows.


## Step 14/16 — Today Mode

**STEP 14 TODAY MODE GATE: PASS.** Release **v2.0.0-poc.16** uses canonical package.json. Trip Schema remains **4**, strict supported readers remain **1 / 2 / 3 / 4**, and Trip Data Versions remain **demo.city.5 / demo.road.5**. Schema implementation, archived payloads and both local fixtures are unchanged.

### Implementation
- The six requested Production V1 driving/travel/today-mode reference files were inspected read-only. Operational hierarchy, clear current/next information, practical Maps actions and previous/advance/reset controls were reimplemented in React/TypeScript. No legacy scripts, DOM scraping, fixed trip/day/timezone assumptions, semantic parking/hotel/deadline detection, overlay or duplicate weather fetcher was copied. Complexity is Medium: pure generic derivation keeps planned, manual and preview states explicit rather than persisting UI fields in snapshots.
- Dedicated TodayMode replaces the final routed placeholder and consumes useLoadedTrip(). TripLayout remains the sole load boundary; all five trip views share the existing shell, page definitions, navigation and safe Back behavior. No Schema 5 or convenience snapshot fields were needed.
- The live clock uses the validated trip timezone, DD/MM/YYYY 星期X and HH:MM:SS. Its one-second interval cleans up on unmount and does not announce every second. Heavy timeline derivation is memoized by minute/day/snapshot/progress; alert expiry uses the live instant. No per-second weather refetch.
- Initial day selection prefers the trip-local matching date, then a valid session preview, then the smallest actual canonical dayNumber. Accessible horizontal day controls show actual numbers and 今日. Non-today days are explicitly 預覽模式 / 預覽焦點, with no current-day countdown or fake current weather.
- Pure helpers derive previous/current/next from canonical order and planned times. Explicit intervals, missing-end next-later-start boundaries, gaps, open-ended final activities, cross-midnight ranges and untimed items are handled safely. Untimed items remain visible/manual but never become clock-current. Planned focus never asserts GPS arrival or completion.
- Previous/advance/reset override focus using stable item IDs. Session preview is trip-scoped; progress uses unambiguous trip/day tuple keys, avoiding punctuation collisions. Invalid IDs are ignored; blocked sessionStorage falls back to usable React state. No permanent progress preference or Supabase state.
- The next mapped destination is separate from optional activity progression and prefers nonoptional/nonbonus stops. Maps resolves structured navigation target → Place → accommodation → transport URL/referenced target with existing safe links. Optional-only fallback is labelled. Explicit next navigation type/label/warning remains visible without semantic regex inference. Car-linked days alone show the approved passenger/safe-stop notice.
- Canonical day/timeline-linked Hard Cuts use trip-local instants and chronological ordering, then deterministic priority/severity/ID ties. Actual-day relative labels compare planned time only; previews do not claim missed/late cuts. Final destination prefers day accommodation, last timeline accommodation, then the final mapped entity. Missing concepts hide cleanly. The complete compact activity list retains time/type/optional/bonus/warnings/current markers; end state preserves weather, cuts, final destination and activities without claiming completion.
- Compact TodayWeather reuses TripWeatherProvider, provider registry, normalized forecasts, existing cache, suitability engine and active-alert filtering. dayRegions selects context without changing the global remembered weather region. Actual today uses current normalized metrics; preview uses matching DailyWeather or the honest five-day out-of-range note without a fake score. Final/Experience/Access, operation notes, timestamps, source/stale/offline state and fictional-alert provenance remain separate from real road/service operating status.
- Optional Screen Wake Lock is off by default, feature-detected and requested only after user action. Unsupported/rejected/released states are truthful. Unmount releases a held or late-arriving lock; no automatic reacquisition or persistence.
- Previously downloaded physical Schema 1/2/3/4 real-trip snapshots remain usable signed out/offline, with zero trip-store writes, upgrades, conversion or deletion merely from Today rendering. Core operational data does not need weather network. No GPS/background tracking, auto-arrival, real migration, service-worker expansion or live Supabase migration was added.

### Verification
- `npm ci`: PASS (91 packages). `npm run build`: PASS, including strict application/tool/test TypeScript checks. Complete Playwright suite: **2,065 passed** in **27.8m**, two workers, across **320 / 390 / 430 / 1024 / 1440px**. All **1,700** previous cases retained plus **365** new Step 14 cases. `git diff --check`: PASS.
- Final focused Today suite: **365 passed** in **3.9 minutes** across all five widths. Local preflight corrected a synthetic broken-reference fixture, deterministic mocked clock/alert timing and two old placeholder expectations, preserving validation, assertions and timeouts. Final audit fixed punctuation ambiguity in session keys and compact desktop card alignment. Interrupted intermediate full runs were not counted as successful verification; the completed green run above is the release evidence. No failed candidate was pushed.
- Required screenshots were generated and actually inspected: **390px city preview**, **390px road actual day**, **1440px road actual day**, **320px Large road**, and **mocked end-of-day**. Final captures use the real scrollable viewport layout. Reviewed heading/clock/day controls, 今日 versus preview, previous/current/next/manual controls, primary Maps, structured target/warnings, driving notice, compact weather/alerts/scores, Hard Cuts, accommodation/final, full activities, Wake Lock and footer/status clearance. All three fonts and five widths pass no-overflow/touch/focus checks.
- Mocked tests cover trip-timezone clocks, selection precedence, arbitrary day numbers, timed/untimed/overnight positioning, manual persistence/reset/blocked storage, trip/day/punctuation isolation, required versus optional stops, Maps precedence/safety, canonical cuts/final fallback, current/daily/out-of-range weather, shared scoring/cache/deduplication/alerts, Wake Lock cleanup including pending release, and real physical cached Schema 1/2/3/4 reads without writes. No real password or live test data is required.
- Canonical banner/icon are byte-for-byte unchanged. Schema/data/archives, Home, Settings/Auth/checklist sync, Back/router history, shared WeatherPanel behavior, trip/checklist/weather stores, loader, approved Step 11 SQL and source-controlled baseline remain unchanged. No V1 table access, live Supabase administration/migration/test writes or production repository modifications.
- Existing POC-only gated workflow remains npm ci → typecheck/build → complete Playwright → deploy only after success. CI/Pages outcome is verified after this release commit is pushed and reported in the release handoff; production workflow is untouched.

### Known limitations
- Today follows planned itinerary timing and does not know the user's real GPS location. Manual progress is device/browser-session local. No GPS/background tracking or automatic arrival detection.
- Google Maps availability depends on the device, network and offline Maps settings. Forecasts may be stale/offline; suitability does not prove road, attraction or service operating status. Official announcements remain separate.
- Wake Lock support varies by browser and may be revoked by the browser/device. It is optional and never automatically reacquired.
- Downloaded trip/weather caches retain the existing device privacy behavior after logout. Blocked/evicted storage can prevent durable offline use. Full cold-start PWA/service-worker offline QA remains Step 16.
- Visual QA uses Chromium viewport screenshots, not physical iPhone/Safari certification. Existing nonfatal Vite bundle-size/Zod annotation notices remain.

Historical Step 14 next task was Step 15; only bounded Step 15B timing patches are recorded below.


## Step 15B.1/16 — Schema 5 cross-timezone timeline timing patch

App Version **v2.0.0-poc.17**, canonical package.json; package-lock/test expectations match. Current Trip Schema **5**; strict supported versions **1 / 2 / 3 / 4 / 5**. Local fixtures remain Schema 4 and Trip Data Versions **demo.city.5 / demo.road.5**. Step 14 remains complete. **Step 15B remains incomplete overall; Step 15C has NOT started.**

### Implementation
- Schema 5 adds only optional strict timeline `timing.start/end`, each containing offset-bearing ISO datetime and IANA timezone. Both endpoints are required when timing exists; invalid zones/fixed numeric offsets/missing offsets and end <= start are rejected with structured issues. Different zones/dates, overnight and date-line travel are supported. Offset defines the instant; declared IANA zone defines endpoint display.
- Schema 1–4 definitions remain strict and unchanged, reject timing and retain their original source versions. Types remain inferred from the canonical Zod schema. Existing runtime fixtures and archived snapshot data were not rewritten; Schema 5 proof fixtures exist only in tests.
- Shared Today timing helpers compare exact timestamps when timing is supplied, taking precedence over optional/conflicting local-clock fields. Adjacent legacy items resolve in the selected day/trip timezone, including implicit-end boundaries and overnight end dates. Timelines without exact timing keep the existing clock/minute algorithm. Exact intervals use the existing one-second clock, including second-level boundaries; legacy memoization remains minute-based.
- Start/end labels use their own declared IANA timezone, 24-hour time and existing DD/MM/YYYY 星期X date format. Long exact labels wrap in current/neighbour/full-activity cards; the exact-only row rule leaves legacy layout unchanged. No timezone abbreviations or geography-specific runtime branches.
- Initial date-based day selection, explicit manual day preview, stable-ID progress override/reset, session keys, Maps/cuts/accommodation, weather and Wake Lock are unchanged. Exact intervals do not override manual preview or imply real GPS completion.
- Existing loader/cache supports Schema 5 through centralized supported-version validation without modifications to its code, IndexedDB storage version/stores/pointers or old records. Cached Schema 1–4 remains readable without migration; mocked Schema 5 remote/cache/offline/reload metadata is preserved. No live Supabase access/schema/data change, V1-table access, production edits, real-trip migration, adapter/configuration additions, checklist changes or canonical asset changes.

### Verification and release evidence
- `npm ci --cache work/npm-cache`: PASS (91 packages; dependencies unchanged). `npm run build`: PASS, including both strict TypeScript checks. After the final test-only correction, `npm run typecheck`: PASS. `git diff --check`: PASS.
- Focused coverage: **695 cases verified green** across all five widths: **620 existing Schema/Today regression cases** plus **75 new timing cases**. The initial new cache-source assertion used the version label by mistake; its selector was corrected to the existing source label, then the complete 75-case timing file passed. No application repair or weakened assertion/timeout was needed.
- The **single local complete Playwright run** exercised **2,140 cases** at 320 / 390 / 430 / 1024 / 1440px: **2,130 passed / 10 failed** in **27.8m**. All 10 failures were two old loader rejection fixtures repeated at five widths that still called now-supported Schema 5 unsupported. Only those test inputs were changed to unsupported Schema 6, retaining rejection/no-cache assertions. Their targeted five-width rerun passed **10/10**. Thus every local regression case is verified; the original failed run is not represented as an uninterrupted green run. No second local full regression was run, honoring the once-only quota rule. CI runs the final complete suite after push; its exact result and Pages deployment are verified in the release handoff.
- Schema/Today/cache tests verify old strict contracts, physical Schema 1/2/3/4 offline rendering with no rewrites, Schema 5 same-zone/cross-zone/overnight/date-line intervals, end-exclusive current/previous/next, mixed legacy/exact boundaries, no-timing fallback, precise-second progress, endpoint-local labels, manual/reset/preview and mocked Schema 5 cache reload while signed out/offline. Machine-local timezone is never used for timing assertions. Existing multi-trip/owner/Back/auth/checklist/weather/attractions/camera/asset/responsive regressions passed.
- Source/diff audits confirm the timing patch has no trip/country/day/place-specific branches or runtime fixture/timezone identities. Canonical source banner/icon SHA-256 values match prior releases. No diff in live-database SQL/baseline, existing fixtures, loader/stores, auth, router history, Home/Settings, other trip views or the protected POC-only workflow.
- Endpoint presentation is checked with Large font/no overflow at all five widths. Supplementary scrolled-view screenshots inspect actual exact progress and activity labels at 320px Large, 390px and 1440px, preserving the TravelPilot shell/status/control layout. This is Chromium viewport QA, not physical iPhone/Safari certification.
- POC main is the only authorized release target. The existing guarded workflow runs npm ci → typecheck/build → complete Playwright → Pages only after success. Final CI/Pages status and commit SHA are supplied in the release handoff; no experimental/failed candidate has been pushed.

### Known limitations and next scope
- Today remains planned state. Day selection and non-today manual preview retain their existing date-based semantics; exact intervals do not silently choose a different day or assert physical arrival. Manual progress remains session/device local.
- Old cached snapshots need no migration. Cache retention/privacy and storage blocking/eviction behavior are unchanged. Browser/Intl timezone support applies; full cold-start offline QA remains Step 16. Existing nonfatal Vite bundle-size/Zod annotation notices remain.
- **Step 15B is NOT complete overall. Step 15C has NOT started.** No Japan 2027 or other real-trip data has been migrated. Stop after this bounded timing patch; do not begin Step 15C.

## Step 15B.2/16 — Schema 5 Operational-Day + Exact Timing Display Patch

App Version **v2.0.0-poc.18** (canonical package.json; lockfile/test expectations match). Current Trip Schema remains **5**, strict supported readers **1 / 2 / 3 / 4 / 5**. Demo snapshots/Data Versions remain unchanged: **demo.city.5 / demo.road.5**. Step 15B.1 is complete; **Step 15B remains incomplete overall and Step 15C has NOT started.**

### Implementation
- Pure shared `operationalTiming.ts` checks Schema-5 exact intervals using absolute instants and half-open boundaries (`start <= now < end`). No transport/geography/title inference; invalid bypassed intervals cannot extend a Day. Exact interval ownership, rather than the arrival calendar date, can keep a Day operationally current after midnight.
- Automatic Today selection prefers the active exact interval with latest absolute start, then canonical dayNumber for overlaps, then trip-local matching date, valid remembered preview and canonical first Day. `deriveToday` recognizes canonical matching or active owned exact timing. The existing one-second clock returns automatic selection to calendar rules at the exact end. Explicit manual Day previews, stable-ID progress/reset, storage keys, preview truthfulness and minute-based legacy behavior are retained.
- Snapshot-aware Home status is current during an active exact interval even outside startDate/endDate. Existing simple calendar-only `tripStatus`, deterministic status/date/slug ordering and source registry immutability remain intact. The displayed Trip date range is unchanged; no permanent date extension is stored. Existing Home supplies snapshots to the shared sorter; Home/TripCard implementation requires no changes.
- Detailed Itinerary Timeline reuses `tripTime.ts` endpoint formatting for each declared IANA timezone and full date/24-hour clock. Semantic time elements retain the exact original offset datetime. Exact labels wrap above event content; legacy HH:MM ranges remain unchanged. Today exact label presentation is unchanged.
- No Schema 6, old-cache rewrite, fixture conversion, real-trip data, JMA, live cameras, checklist changes, Supabase access/migrations, production modification, canonical asset changes or Step 15C functionality.

### Verification
- `npm ci`: PASS (91 packages). Focused tripDates/Home/Today/Timeline timing tests: **605 passed** across 320/390/430/1024/1440px. `npm run build`: PASS, including strict application/tool/test TypeScript checks. Complete Playwright regression: **2245 passed (28.4m)**, two workers across all five widths, run once after the focused gate passed. All **2,140** previous cases retained plus **105** new cases; no failures or test weakening. `git diff --check`: PASS. No failed candidate pushed.
- Required responsive timing screenshots generated; **320px Large**, **390px Large**, **430px Large** and **1440px Large** actually inspected. Date/IANA endpoints wrap cleanly, event content is not squeezed, shared header/navigation remain usable and the persistent status dock has clearance. Automated no-overflow checks cover all five widths.
- New focused coverage proves overnight operational ownership, fresh selection/remembered-preview priority, absolute current/previous/next, half-open end and live return to calendar selection, deterministic overlaps, manual/reset/explicit preview, unchanged Schema 1–4 and Schema 5-without-timing behavior, Home before-start/after-end exceptions, unchanged displayed dates/sorting, exact/legacy Timeline labels and offset datetime semantics, and generic source audit.
- Source-control boundaries verify unchanged Schema definitions, demo data/version registry, loader, IndexedDB/checklist/weather caches, auth/settings, Back history, live Supabase/V1 SQL and canonical assets. Tests intercept backend/network requests; no real account or live test writes. Production repository is untouched.
- Existing POC-only CI remains npm ci → typecheck/build → complete Playwright → Pages deployment only after success. CI/Pages result is verified after the green local release is pushed and recorded in the release handoff.

### Known limitations / next scope
- Operational ownership uses structured exact Schema-5 timing only. Old HH:MM cross-midnight semantics remain unchanged. Planned timing is not GPS or actual arrival detection; manual progress remains browser-session local. Home status is derived on rendering, as before.
- Overlapping active Days use deterministic latest-start/canonical-Day precedence; this does not repair itinerary content. No cache migration or real trip migration is included.
- **Step 15B remains incomplete overall. Next: remaining Step 15B work only when separately authorized. Step 15C has NOT started.**


## Step 15C — Japan 2027 repository/frontend integration

Release **v2.0.0-poc.26**; starting POC main **831616d6543aa5f775999998523be3c7c5a61ef5** / v2.0.0-poc.25. Current Trip Schema remains **5**, supported readers **1 / 2 / 3 / 4 / 5**; fictional Data Versions remain **demo.city.5 / demo.road.5**. The only local demo fixtures remain the original two fictional trips. **Japan has not been added to localTrips, and no Supabase version has been written or published.**

### Canonical input and assets
- Exact approved payload archived at `tests/fixtures/japan2027-schema5.json`, with SHA-256 **09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e**. Full canonical Schema-5 and cross-reference validation passes without editing any itinerary content. Existing UUID **349442d2-7bf3-426b-9f57-163e2272e909**, slug **shirakawago-shinhotaka-2027**, integration Data Version **jp2027.1**, nine days and fixed D6 白川鄉 / D7 新穗高 / D8 飛驒大鐘乳洞 → 松本 are retained. D1 UO680 cross-zone and D9 UO685 cross-date/cross-zone exact endpoints are unchanged. Manifest is archived separately as provenance; its publishing suggestions do not authorize writes in this task.
- Copied only the 24 manifest-approved existing images from read-only production SHA **8b5129b381d6ace94030b51c7b8de5c4e3d5f533** into semantic filenames under `assets/trips/shirakawago-shinhotaka-2027/`. The approved cover is copied exactly from POC branch **step15c-input-assets**, never re-fetched from Wikimedia or substituted. JPEG SHA-256 **54d609bca9f3bcc2c958b1ea05c5e3e92b8ee3a409b3631a2a8dff578fb5d121**. **Raita Futo / Wikimedia Commons / CC BY 2.0** attribution/source metadata is retained. `provenance.json` records source commit/branch and byte hashes; all 25 canonical image records resolve and served bytes match. Canonical Home brand banner/icon remain unchanged; neither is used as a real-trip cover.

### Generic frontend changes
- Home now merges validated current published owner-scoped remote snapshots and existing validated cached trips with local demos. Stable ordered pagination and ID-batched version requests avoid a per-card N+1 design. `validateRemoteTrip` is shared with `loadTrip`; row ownership, UUID/slug, row/payload schema agreement and full canonical validation are mandatory before display/cache. Invalid/unsupported records do not replace valid cache or break other cards. No content-table writes.
- Auth-aware Home initialization/account switches hide previous-account results immediately and cancel obsolete effects; connectivity changes reload the list without continuous polling. Signed-in cache listing is owner-scoped. Signed-out/offline device cache remains available consistently with the existing logout-retention policy. Cache stores, pointers, storage version and explicit Settings clearing are unchanged.
- Real cards omit 示範資料. Existing shared temporal/operational status, deterministic non-mutating sorting, nearest upcoming, recently used, covers, capability-driven shortcuts, routes, PageNavigation, Back and all five renderers are reused. Future real trips can be added through validated remote data/assets without a new route or destination branch.
- Added `jma` to the generic Official Alert adapter registry and a strict shared provider configuration contract. Configured official area codes **200000 / 210000** route to configured weather regions; matchNames are descriptive, not selection logic. Official HTTPS XML only, safe DOMParser with DTD/entity/HTML/malformed rejection, bounded XML/report counts, timeouts and request concurrency. Configured product codes, report normalization, area scope, training exclusions and latest matched update/cancellation behavior are fixture-tested. Alerts remain independent of suitability/operation status; demo-alerts behavior remains unchanged.

### Verification
- `npm ci --cache work/npm-cache`: PASS (**91 packages**, dependencies unchanged). Final `npm run build`: PASS, including both strict TypeScript projects and production Vite output. `git diff --check`: PASS.
- Focused canonical Japan/JMA, Home, loader, multi-trip, schema/weather-schema, timing and source checks were verified before the full run. Local test setup fixes retained assertions/timeouts: scoped shortcut selection, native accordion selection, future fake-session expiry and truthful loaded-shell offline testing. Initial visual decoding waited on off-screen lazy images; QA now explicitly loads fixture images and captures each view separately. The repaired visual/scope run passed **35/35**; final exact-timing/scrolled visual run passed **35/35**. A test-title edit during an earlier worker run caused one collection mismatch; its unchanged assertion passed targeted re-verification.
- Complete local Playwright regression was run **once**, across **320 / 390 / 430 / 1024 / 1440px**: **2,455 passed / 5 failed** out of **2,460** in **33.6 minutes**. The five failures were one old source assertion repeated at every width, expecting Home's snapshot mapping inline. The authorized hook now supplies that mapping. The assertion was strengthened to check Home's sorter input plus both remote/demo snapshot projections, and an authenticated real-trip Home test proves operational current status until exact arrival without changing displayed dates. The post-regression focused run passed **310/310** (125 Japan, 80 JMA and 105 operational timing cases). It also verifies configured product-token parsing with optional filename sequence markers. All final local cases are therefore verified; this is not presented as an uninterrupted green full run. The final complete suite contains **2,465 cases** (all **2,260** baseline cases retained plus **205** new Japan/JMA integration cases) and runs afresh in CI after push. Its exact outcome and Pages deployment are reported in the release handoff.
- Mocked tests verify canonical hash/UUID/version/fixed days/endpoints, all image references/served hashes, real Home card/capabilities, owner/current/published query filters, batched multi-trip listing, account isolation, malformed/unsupported isolation, good-cache preservation, signed-out/offline reads, all five route reloads/Back, operational timing and legacy readers. No real password or live test writes. Supplementary mocked DOM QA passed **10/10** at 390/1440px: nine days, seven accommodation records/names, 36 attractions, five cameras/labels and selected-day Today content.
- Large-font visual screenshots at all five widths cover Home and all five Japan views, including scrolled content/bottom controls and exact D1/D9 endpoints. Actual inspection included 320px Large Home/Trip Information/exact arrival labels, 390px Home/Attractions/camera cards/Today, 1440px Home/accommodations/Today, and status clearance. No body horizontal overflow; shared header/Back, cards, dates/IANA endpoints, actions and optional features remain in the existing TravelPilot family. Chromium viewport QA is not physical iPhone/Safari certification.
- Source/diff audits preserve Schema 1–5, local fixture data/versions, all trip engines, IndexedDB/checklist/weather stores, Auth/Settings/Back, SQL and protected POC-only workflow. No trip/country/day/place branches, privileged credentials or V1 table access were introduced. Production was read-only for the approved asset copies. No live Supabase DDL, version publishing, checklist migration or V1 write occurred.

### Known limitations and next boundary
- **Live JMA feed/report verification is paused:** direct official HTTPS requests return HTTP 403 through the environment network boundary; browser probe fails **ERR_TUNNEL_CONNECTION_FAILED** before CORS can be assessed. Deployed browser CORS is unverified. Fixture-tested parsing does not certify every live JMA report variant; unsupported area-code relationships are not broadcast to unrelated regions. No proxy, Edge Function, Worker, third-party CORS service or HTML scraper was added. Network failure uses the existing unavailable alert state and does not claim all-clear or change weather scores.
- **jp2027.1 has now been published/current in Supabase** from the exact validated canonical payload, checksum 09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e. Japan is visible through the generic authenticated remote-trip loader. Optional legacy checklist continuity was not migrated.
- Existing device-cache privacy/storage limits, independent weather cache, external camera/operation availability and nonfatal Vite bundle/Zod notices remain. Full cold-start offline app/static-image/service-worker QA remains Step 16; no expansion in this task.
- **Stop after Step 15C. Step 15D has NOT started.** Next action is separate exact-payload publication/review; further integration requires its own authorization.

## Pre-15D UI / Presentation / Function QA — Round 1 (user review, 10/10/2026)

Status: **PENDING — do not start Step 15D yet.** Baseline remains POC **v2.0.0-poc.26**. This is a real-trip UI/fidelity refinement gate, not a production change. Production stays untouched.

User-reported Round-1 requirements:
1. Add a clear Back-to-Top control.
2. Weather section is too tall/empty; redesign density. Five-day forecast rows (visibility/cloud/humidity etc.) are misaligned and too loose.
3. Trip header exposes low-value technical metadata (trip id, Trip Data Version, POC source). If retained, move to small footer/debug-style presentation.
4. Shared trip page selector (詳細行程 / 旅程資料 / 景點總覽 / Live Cam / 今日模式) must be sticky/top-fixed so it remains usable after scrolling.
5. Those shared page-selector items need clear recognisable icons, not text-only pseudo-icons.
6. Weather content should use available desktop width; avoid unnecessary horizontal scrolling.
7. Day selector D1–D9 should also show that day's main destination/location so the user need not remember day numbers.
8. Explain/fix the user-facing message 目前5日預測未涵蓋此行程日期。; it is currently unclear.
9. 今日重點 lost V1 fidelity. Restore meaningful actionable copy, not bare identifiers such as a flight number. Example V1 wording: ✈️ 06:45 左右到香港機場 T2，唔好壓縮出發 Buffer。
10. Day hero/gallery layout looks irregular. Standardise to one large + two small images, aligned cleanly; handle days with only two images gracefully.
11. Put map/navigation icons inline immediately after the itinerary item/place name, not below the whole description.
12. ⌂ 今日住宿 card is too tall/empty; compact it.
13. D1 Optional/Bonus was expected to include 松本・繩手通; investigate why it became 松本城 Projection Mapping rather than silently accepting the content drift.
14. 松本城 Projection Mapping should use Chinese presentation wording.
15. Every itinerary place/hotel/location should show the local-language name underneath for asking directions/showing locals.
16. Suitability/itinerary score should use colour bands by score.
17. Itinerary place cards are too vertically sparse; compact them.
18. Transport records need prices.
19. Hotel/accommodation type labels should be Chinese, not English where a Chinese label exists.
20. Driving description lost V1 details such as whether the route passes/uses SA/PA and related explanation; restore equivalent useful detail.
21. Checklist layout is too sparse. More broadly, many sections use excessive vertical whitespace and make pages unnecessarily long.
22. 國寶・松本城 daytime entry must use a daytime image; do not use a night image for daytime content.
23. Attraction content was shortened too aggressively. User requires very detailed multi-paragraph content for: introduction, why worth visiting, history/background, local significance, takeaways, and points to notice. One or two sentences is explicitly insufficient.
24. Attractions Overview location/day selector must also remain sticky while scrolling.
25. Live Cam has fewer cameras than V1 and current entries only show 此來源請在官方／來源頁面開啟。; restore V1-equivalent camera coverage/embeddable behaviour where technically possible and investigate source restrictions rather than treating this as accepted parity.
26. Today Mode labels 下一站 · 導航目的地 and 下一導航點 are confusing/redundant; first card may not actually mean next. Both cards are also too vertically sparse.
27. Today Mode is missing today's weather presentation.
28. Lower-left connection status: online icon green, offline icon red.

Cross-cutting user direction:
- Excessive blank space/vertical padding is a major app-wide usability issue. Optimise information density without making the interface cramped.
- Preserve V1 visual/functional/content fidelity where V1 had useful detail; do not shorten or substitute content casually.
- Fix shared/generic components, not Japan-specific branches.
- Do not begin Step 15D until this QA round is reviewed and accepted.
- This is Round 1; the user explicitly expects another review round.

Recommended execution order:
A. Shared navigation/sticky controls/back-to-top/status colours + global density primitives.
B. Weather layout + Today Mode layout/weather.
C. Detailed Itinerary day selector/gallery/cards/inline navigation/accommodation/checklist/transport price/local-language names/score colours.
D. Attraction Overview sticky navigation + long-form content fidelity.
E. Live Cam parity/investigation.
F. Japan content-fidelity corrections (D1 Bonus/繩手通, Chinese Projection Mapping naming, daytime Matsumoto Castle image, SA/PA descriptions).
G. Responsive regression at 320/390/430/1024/1440 and compare against V1 before release.

Do not implement these as trip/country/day hardcoded UI branches. Where a requirement needs richer data, extend the generic schema/data model only after impact is reviewed.

## Pre-15D QA — Implementation R1/8 Shared UI (10/10/2026)

Release candidate: **v2.0.0-poc.27** (App Version only). User authorized the bounded eight-round plan and specifically began R1, covering **Round-1 issues 1, 3, 4, 5, 21 and 28**. POC branch: `qa/pre15d-r1-shared-shell`.

### R1 changes
- Added a conditional Back-to-Top control bound to the real main scroll container (not the window). Changing app routes restores the initial scroll position.
- Moved shared trip navigation outside the hero/title section to make it genuinely sticky; it remains capability-filtered. Each page tab has a recognizable shared SVG icon; mobile tabs have native horizontal scrolling and retain minimum 44px targets.
- Shared navigation publishes its measured sticky height for pre-existing itinerary and information quick-nav offsets; no country/trip/day-specific layout assumptions.
- Trip identifiers, Trip Data/Schema Versions and POC source remain precise and testable in a discreet bottom technical footer, not the opening hero. Offline/cache/source warnings remain visible.
- Reduced generic panel spacing and checklist vertical margins/padding without reducing tap target sizes or deleting notes, checklist groups or content.
- Lower-left connection state retains readable ONLINE/OFFLINE and App Version text, with green online/red offline visual dots.
- New `tests/sharedShellQA.spec.ts` regression tests verify sticky behavior, page changes, Back-to-Top, technical footer, indicator colors and minimum checklist control size. Existing foundation tests account for deliberately horizontal mobile trip tabs and footer relocation without weakening tap-target assertions.
- Trip Schema 5, existing Schema 1–5 readers, all trip snapshots and their versions, exact published `jp2027.1`, trip/cache state, Weather/Today engines, JMA, Supabase, SQL, branding images, V1 and Production remain unchanged. **Step 15D is still blocked**.

### R1 verification gate
GitHub POC workflow is unchanged and runs `npm ci` → TypeScript/Vite build → complete Playwright regression → Pages deployment only after success. **This repository write environment has no local npm/browser runner wired to this checkout; GitHub CI completion and on-device visual review must be verified separately.** Do not claim full regression PASS or final visual parity until those outcomes are observed. Next bounded implementation scope is R2 Weather + Today, where the user explicitly requested clearly-labelled *POC simulated* weather using currently available real five-day forecast data to exercise January 2027 UI (never present it as a real 2027 forecast).

### R1 CI failure and bounded repair (10/10/2026)

The first R1 main commit `75d6612` built successfully but its complete GitHub Playwright run [37992256506](https://github.com/yfgary/travelpilot-poc/actions/runs/37992256506) returned **2,465 passed / 20 failed** from **2,485** tests. Deployment was correctly skipped. There were four deterministic failures repeated at the five viewport widths: an old Step 15C test hard-coded the now-outdated App Version `poc.26`; the new sticky nav test incorrectly demanded zero inset despite intentional responsive main padding; and the two demo info quick-nav tests measured headings roughly 6–9px beneath the necessary sticky clearance.

Repair release candidate `v2.0.0-poc.28` retains all original data/behavior assertions. The archived Japan test now requires a valid monotonically non-regressed POC App Version >=26 while retaining Schema, old fixture, loader/source and SHA audits; the sticky test asserts the actual padded scroller boundary; and the info section heading scroll margin increases by 1rem to clear stacked navigation. No app content, trip data or production changes. **Do not claim the gate passed until a new full CI run passes and Pages deploys.**

## Pre-15D QA R2 — weather + Today Draft candidate (10/10/2026)

**R2 staged separately on `qa/pre15d-r2-weather-today` with candidate `v2.0.0-poc.29`. NOT deployed and NOT merged; R1 v2.0.0-poc.28 full GitHub CI gate remains the prerequisite.**

This bounded Round-2 candidate addresses user issues #2/#6/#8/#16/#26/#27:
- Denser shared WeatherPanel/forecast metrics, stable aligned comparison rows and a five-column desktop forecast that reuses available width; phone view preserves horizontal navigation.
- ScoreSummary gets stronger semantic green/amber/red band accents without changing its existing suitability math, coverage, or official operation caveats.
- Only on the explicit POC deployment base, an out-of-range itinerary day may display **current actual model weather as clearly marked POC simulation**, including a planned-day profile score for UI testing. The forecast-date range, sources and timestamps stay unchanged and visible. Production-style builds retain honest out-of-range fallback. Nothing claims that today represents the January 2027 trip-date weather.
- Today Mode primary mapped destination label distinguishes current/planned later/preview and combines supplemental parking/entrance metadata into one compact navigation section rather than duplicative tall cards. TodayWeather shows the same clearly labelled UI-only simulation if selected day is beyond the five-day forecast.
- Matching-date forecast tests retain real daily data; outside-date tests are strengthened to require explicit simulation provenance. New focused desktop/mobile layout, score-band and Today navigation regression cases added.
- No Supabase publishing or schema/reader/cache mutation, no production/V1 modification, no itinerary payload rewrite. R1 fixes remain present via rebase; Step 15D not started.
**R2 full build/Playwright/visual checks still required before merge or declaring completion.**

### R2 PR QA run #37996092829 failure repair (10/10/2026)

R2 candidate `poc.29` pre-merge PR QA: **2,495 Passed / 5 Failed**, npm ci and TypeScript/Vite build PASS. All five failures were the same outdated `tests/todayVisual.spec.ts` assertion replicated across viewport widths 320/390/430/1024/1440: it expected `today-weather-outside` when the new, user-approved POC-only simulation deliberately displays weather metrics with a prominent simulation notice. No other test failure was reported.

Repair candidate **v2.0.0-poc.30** updates the visual scenario to test the *new requirement*: out-of-horizon dates visibly state that this is simulated POC data and **not the itinerary-day forecast**, include the real current sample metrics/score, and don't show the old empty-data UI. Same-day weather must remain factual and **not** show the simulation notice. Actual score/provider/forecast/date/cache logic is unchanged. **Full PR QA is required again; no merge until green.**

## Pre-15D QA — R3 Detailed Itinerary Layout candidate (10/10/2026)

**Candidate v2.0.0-poc.31**, isolated POC branch `qa/pre15d-r3-itinerary-layout`. This is bounded R3 of the approved 8-round QA plan, addressing original items **7, 10, 11, 12 and 17**. R2 `poc.30` passed PR QA and merged to POC main; do not release R3 until full PR QA and R2 main deployment gate finish.

- Reusable day-jump tabs now render both D-number and the canonical `day.title`, using the title attribute for full text and keeping stable existing accessible DAY-jump labels and keyboard navigation. This is trip-agnostic.
- Gallery presentation explicitly handles 3 images (one larger + two aligned smaller), 2 images (larger and smaller at desktop widths, balanced pair on mobile), and 1 image without adding/fabricating/cropping source data beyond existing object-fit behavior; captions and source credits remain.
- Maps icon/action moves immediately beside each available itinerary place, accommodation, transport or navigation-target heading; no duplicate action at the card bottom. Link URLs remain resolved and filtered through existing safety utilities. Places without Maps retain no fake links.
- Compacts day summary, timeline rows, cards, highlights, action spacing and the day-level full accommodation facts grid, without deleting price/booking/date/address/cancellation/parking/notes or breaking 44px interactive targets.
- New `tests/r3ItineraryLayout.spec.ts` covers canonical day titles, accessible jump controls, mapped heading actions, preservation of lodging details and both gallery layouts at every configured viewport. Original itinerary tests adjusted solely for extra visible day title text.
- No canonical Trip Data (including published/current `jp2027.1`), Schema 1–5, weather provider, Supabase, protected images, V1 or Production changes. Remaining item #15 local-language names and #18 transport price presentation belong to R4. **Step 15D remains blocked.**

**QA status:** R3 is staged only, with full pre-merge PR workflow and visual review still required; do not claim R3 PASS until verified.

## Pre-15D QA — R4 Metadata Presentation phase A (10/10/2026)

Candidate POC App Version **v2.0.0-poc.32**, staged on `qa/pre15d-r4-metadata`. R3 PR #11 passed complete PR QA and merged to POC main (commit `5df7fcc`); the main build/Pages gate must be green before merging R4.

R4 original issue grouping: #15 local-language name under every place/hotel/location; #18 transport prices; #19 accommodation categories in Chinese.

- **#18 phase A complete in reusable renderer:** known transport prices now visibly display near the service heading with original amount, currency and notes from the existing safe formatter. Non-walking transport with absent price explicitly shows `費用：未提供，請核實`; walking is not silently assumed free. No fares are guessed or written into Trip Data.
- **#19 implemented:** recognized accommodation type codes (hotel, lodge, cabin, ryokan, guesthouse, etc.) are shown in Traditional Chinese via one data-agnostic formatter; unknown/native-script descriptive types are shown unchanged. Snapshot type values remain immutable.
- **#15 not implemented pending data-contract authorization:** strict Schema 5 has no local/native language name field on Place, Accommodation, Transport or NavigationTarget. We cannot reliably infer verified Japanese names from display names, map URLs or addresses. Completing #15 correctly means planning an optional localized name field in a versioned schema/reader update, supporting authored values validated against real sources, and publishing a **new** Trip Data Version after user approval. Existing published `jp2027.1` must not be silently changed. Report tradeoffs before any schema migration; do not claim R4 complete without #15.
- New metadata-specific Playwright tests cover factual and missing transport price and common Chinese lodging categories; existing display expectations are updated without changing fixture data. All trip renderers remain generic.
- **QA status:** stage A branch/PR not yet verified. No POC main, Production, Supabase, published snapshot or Step 15D changes for R4.

## R4 authorized Schema 6 local-name contract — POC-only candidate v2.0.0-poc.33 (10/10/2026)

User explicitly approved **Schema 6 in the POC only**, optional local-language name fields and preservation of all older readers; user explicitly **did NOT approve Supabase data changes or publication**.

- Add strict Schema 6 as the successor to Schema 5 exact timing, Weather/JMA, V4 camera and emergency contracts. The only added data fields are optional nonblank `localName` on canonical Places, Accommodations, Transport and NavigationTargets. Schemas 1–5 keep their own unchanged strict object contracts and reject those fields. No implicit upgrade or cache rewrite of older records.
- `CURRENT_TRIP_SCHEMA_VERSION` = 6; supported reader set = [1,2,3,4,5,6]. Remote version/payload match, validation and IndexedDB remain the same; WeatherSnapshot and exact timing/day selectors are extended to 6 so feature parity is not lost.
- Generic optional native-name row now appears below the canonical Chinese/display name in Detailed Itinerary, Place Detail dialog, Attractions Overview, Trip Information and Today Mode wherever canonical name data is present. No fabricated translations or locale-/trip-specific branches. Legacy records without `localName` render the old layout unchanged.
- Rendered names are plain text (React escaped) and source-authored; do not infer from maps, URLs or other display text. Synthetic tests use *explicitly fictional* Japanese-looking values to confirm mechanics, not an authentic location-name dictionary.
- R4 prior #18 factual/missing transport prices and #19 Chinese lodging-type presentation remain in the branch. App Version candidate increases to **poc.33**.
- POC-only synthetic Schema 6 validation, strict old-version rejection, remote/cached read, out-of-range version, rendered labels and no-label compatibility regressions added; updated current-version assertions retain the original known Schema 1–5 fixture/data-version and published Japan byte identity checks.
- **No change to published/current `jp2027.1`** (remains Schema 5), local demo city/road fixtures, production/V1, SQL, Supabase or its trip version rows. Real Japan native-name population remains a separate sourced content work item requiring a validated **new** Trip Data Version and explicit publication authorization. Step 15D remains blocked.
- Gate: R3 POC main CI+Pages; then complete R4 pull-request QA full Playwright (320/390/430/1024/1440); only merge when verified. Do not claim real January 2027 local names have been populated by this schema change.

### R4 Schema 6 focused QA robustness correction (10/10/2026)
App Version candidate raised to **v2.0.0-poc.34**. Fictional road-trip Day 1 has no Place item; the Schema6 browser integration test now explicitly opens Day 2 before asserting native-language Place display, and scopes the shared lodging card to avoid multiple matches. This corrects test intent without changing the source data or UI behavior. Previous pending PR QA for poc.33 is superseded; do not merge before fresh complete PR QA PASS and R3 main deployment PASS.

### R4 final static test sweep before full PR QA (10/10/2026)
Additional audit found one legacy Today Architecture test still hardcoding current Schema 5; revised the *current supported reader* assertion to 6 while preserving its immutable demo versions and source-boundary checks. Added a focused Schema6 inherited exact-timing regression. Candidate App Version increases to **v2.0.0-poc.35**. Older PR QA attempts are superseded; the latest complete PR run is the release gate.

### R4 v2.0.0-poc.35 pre-merge QA failure and correction (10/10/2026)

Run [38005282470](https://github.com/yfgary/travelpilot-poc/actions/runs/38005282470): **2,540 passed / 10 failed**, Build PASS. The 10 failures consist of two outdated unknown-schema Loader cases × five viewport widths, hardcoded to reject Schema6 even though it is now explicitly supported. All other cases, including the new Schema6 remote/cache/local-name/old-schema/exact-timing tests, passed.

Candidate App Version **v2.0.0-poc.36** changes only `tests/loader.spec.ts` to derive the **first unsupported version as CURRENT_TRIP_SCHEMA_VERSION + 1**, rather than hardcoding 6. The tests still require a rejected remote row/payload, the proper unsupported-schema message, **and absolutely no IndexedDB version/pointer/device cache writes**. No security validation is relaxed, and no production/Supabase/Trip Data changes. Latest full PR QA must pass before R4 Merge.

## Pre-15D QA — R5 Attractions Navigation and Long-form Content (POC-only, 10/10/2026)

R4 Schema6/metadata `v2.0.0-poc.36` PR QA succeeded and was merged to POC main, commit `1914295`. Full R4 main CI/Pages deployment must be verified separately.

R5 staged candidate `v2.0.0-poc.37` on `qa/pre15d-r5-attractions` handles original #23 (do not shorten detailed attraction introductions/reasons/history/local importance/takeaways/notice details) and #24 (sticky location/day selectors).
- **#24 shared UI implementation:** sticky, stacked day + region shortcuts immediately under shared trip navigation. Days are sourced from canonical referenced PlaceUsage occurrences and sorted by dayNumber, not hardcoded to Japan/D1–D9. Day selection intersects with the main/optional/backup status **on the same day**, and region groups/counts derive from matching Places only; no duplicate entity/payload rewriting. Horizontal navigation remains scrollable for narrow screens and button targets retain >=44px. Sticky offset is measured via ResizeObserver for accurate in-page region heading jumps.
- **#23 shared renderer implementation:** rich authored Place descriptions are rendered as full paragraph groups under labelled "景點介紹", "為何值得到訪", "歷史／背景", "在地重要性", "到訪後的收穫" plus the original "值得留意" list; do not collapse multiline paragraphs into one long run-on block, truncate source, fetch translation, or fabricate missing histories. The Place Detail dialog is still shared between Attractions and Itinerary and preserves sources/links/keyboard-focus return.
- This is **presentation capability only**. The immutable published/current Japan `jp2027.1` Schema5 snapshot may still have short content; #23 content-authoring parity remains open until authentic, verified long-form Japan content is prepared as a **new immutable Trip Data Version** and separately approved for publication. V1 Golden Content Reference must be compared before claiming full data-fidelity parity.
- Focused R5 automated tests added for full multi-paragraph preservation, same-day status/date intersection, sticky selectors and responsive horizontal overflow. Cross-trip checks use synthetic demo data. R5 must not merge before full PR CI/visual review; release candidate only.
- Production repo/V1, Supabase, current Trip Data, Schema6 contract and Step15D remain untouched.

### R5 initial PR QA build repair (10/10/2026)

R5 `poc.37` PR QA failed **at TypeScript build** (Playwright not run): TypeScript tests imported the `.tsx` RichText presentation module under a test tsconfig without JSX. Candidate **v2.0.0-poc.38** moves the pure paragraph splitter into `src/data/richText.ts` and reuses it from the UI React `.tsx` wrapper and tests. This preserves exact content output and adds no schema/data change. Await fresh Build and complete Playwright before merge.

### R5 complete PR QA correction (10/10/2026)

CI [38063368198](https://github.com/yfgary/travelpilot-poc/actions/runs/38063368198) on poc.38: **Build PASS, 2552 Passed / 13 Failed**. Three distinct issues occurred across the five responsive widths: (1) Old minimal-Place view test expects no optional h3 while the new RichText UI introduced an unnecessary heading even without extended content (5 failures), (2) R5 test scoped its inner heading Locator from the outer dialog, which did not match as a relative Playwright `has` selector (5 failures), and (3) R5 mobile sticky test's fixed 420px scroll never passed the actual sticky threshold when title/intro wrap (3 failures).

**Candidate poc.39:** Hide the optional "景點介紹" heading when no longDescription exists (keep summary verbatim), fixing real minimal UI density and old regression. Test authored rich sections through direct heading parent locator, and scroll by the actual measured difference to the sticky threshold plus margin across widths (not fixed pixels). No data, schema, supplier or business logic changes. Full R5 PR QA required before Merge. R4 main CI/Pages already PASS.


### R5 browser-diagnosed sticky QA repair — poc.40 (11/10/2026)

Existing Draft PR #13, branch `qa/pre15d-r5-attractions`; retains all R1–R4 and existing R5 implementation. Complexity: **Simple** test initialization correction, no runtime maintenance change.

**Root cause:** the old test used the shared trip tabs’ *unscrolled* bottom as the sticky threshold. Those tabs themselves move upward before sticking inside the padded `main.content-shell` scrollport. Thus the computed scroll was insufficient to pin the attraction selectors. This was not a wrong overflow ancestor, broken sticky positioning, smooth-scroll delay or exhausted scroll range. Native Chromium diagnostics measured main scrollTop/scrollHeight/clientHeight, selector/tab coordinates, computed top/position, nav-height variable and every ancestor overflow. Waiting two animation frames did not alter the failing coordinates; extra scrolling immediately aligned both sticky layers.

Medium-font measurements (pixels, original failing scroll → diagnostic extra scroll):

| Width | Original main scrollTop | Original selector gap below tabs | After extra scrollTop | Aligned gap |
| --- | ---: | ---: | ---: | ---: |
| 320 | 460 | 69.531 | 760 | 0.219 |
| 390 | 460 | 43.938 | 760 | 0.219 |
| 430 | 408 | 43.938 | 708 | 0.219 |
| 1024 | 367 | 18.484 | 667 | 0.219 |
| 1440 | 367 | 18.484 | 667 | 0.219 |

**Correction:** derive the eventual tabs bottom from main’s bounding box, border/padding, computed sticky top and measured tab height. Assert the requested threshold is reachable and the browser actually reaches it. Retain the original strict selector alignment limits (-3/+9px); test a further real mouse-wheel scroll and reassert alignment/visibility. Expand the same test to Small/Medium/Large at all five widths; retain region jump/focus/heading clearance and day/status filter checks, add body overflow and 44px control checks. No test skip, relaxed tolerance, destination branching or CSS workaround.

**Verification:** unchanged failing test reproduced 5/5 failures; instrumented extra-scroll experiment passed all five. Corrected complete focused R5 suite: **25/25 PASS (30.2s)**. `npm ci` and `npm run build` (strict TypeScript plus Vite) PASS. Inspected 320px Large and 1440px Medium screenshots; all 15 width/font screenshots captured. Complete local Playwright regression: **2,575/2,575 PASS (34.8m)**, two workers across all five widths, run once after the focused gate. `git diff --check` PASS. Fresh PR CI result is verified and reported in the release handoff after pushing this branch; it remains a required pre-merge gate. Draft status remains; no merge or deployment authorized/performed by this repair.

**Scope:** only R5 QA, release package/lock metadata and this status document change. Runtime CSS/components, trip schema/readers, local fixtures, published Japan jp2027.1 bytes, image assets, Supabase/SQL and Production are untouched. Step 15D has NOT started. Existing nonfatal Vite bundle-size warning remains.


## Pre-15D R6 — Live Cam viewer and read-only source audit (11/10/2026)

POC candidate **v2.0.0-poc.41**, existing branch `qa/pre15d-r6-livecam`, follows Issue #14. Complexity **Medium**: cross-origin playback cannot be reliably diagnosed by iframe events; provider behavior needs real browser verification and maintenance. R1–R5 remain intact. Schema **6**, readers **1–6**, demo Data Versions **demo.city.5 / demo.road.5**, and published Japan **jp2027.1 / Schema 5** are unchanged.

**Actual root causes/boundaries:** The immutable Japan snapshot contains five `external` sources without previews, so it intentionally opens official pages and cannot render the much larger V1 camera set. V1 has 40 YouTube references / 33 distinct IDs and 17 still-image references / 11 distinct URLs; repeats do not mean additional cameras. Legacy dynamic day bindings disagree with the locked canonical D6/D7/D8 plan and must not be copied. An iframe load event is not evidence of playback or availability, including when CSP/X-Frame-Options prevents rendering.

**Source availability:** Read-only V1 `live.html`, camera JSON and the two renderer/sync scripts were inspected at Production SHA `8b5129b381d6ace94030b51c7b8de5c4e3d5f533`. Native Chromium attempted two embeds, two official images and five canonical official pages; all nine were blocked by the managed environment tunnel (`ERR_TUNNEL_CONNECTION_FAILED`, no successful source response). Availability is **not tested**, not “dead” or “working”; real-provider CSP, referrer, playback and hotlink restrictions remain unverified. See [V2_R6_LIVE_CAM_AUDIT.md](V2_R6_LIVE_CAM_AUDIT.md) for exact URLs, historical associations, methods and the separate canonical coverage table. No provider permission guess, proxy, source replacement or data publishing was attempted.

**Generic shared viewer:** Exact normalized source URL + authored capability deduplicates camera resources, retaining distinct external previews, URL queries, all original day/region/place/group/priority/description/source-label associations and safe links. Filtering a day selects the matching association without mutating snapshots. Visible stalled embeds report unconfirmed loading; successful iframe load still says playback is unconfirmed. A user can select “畫面未能播放”, retain source/official links, and explicitly retry. Conservative HTTPS validation, sandbox, no-referrer, lazy loading and no autoplay remain. Still/preview images show only a device-load timestamp, explicitly not capture/source freshness; no periodic refresh or fake live content.

**QA:** Focused media/schema suite **320/320 PASS (3.9m)**; corrected R6/architecture suite **105/105 PASS (1.6m)**. `npm ci` uses the writable workspace cache; strict TypeScript/Vite build PASS. First full local run: **2,630 passed / 10 failed (38.3m)**, exclusively two old source guards × five widths: an absolute timeout ban conflicted with the bounded visible-frame deadline, and the Step15C clean-worktree guard prohibited the now-authorized LiveCam view edit. Updated guards still forbid fetch/polling/legacy/trip-specific behavior, require a single cleaned-up deadline, and pin **78** unaffected R5 files to SHA-256 fingerprints instead of depending on ancestor objects or a clean worktree. Ignored local CLI/build caches are excluded, new nonignored source files are detected. Final complete local Playwright regression: **2,640/2,640 PASS (38.5m)**, two workers across all five widths. No skipped cases or relaxed tolerances. Both earlier guard failures are resolved; all previous R1–R5 tests pass. All 15 width/font screenshots captured; 320px Large, 390px Medium and 1440px Medium inspected, plus blocked-frame fallback, still and preview at 390px Large. `git diff --check` PASS. Required full PR CI remains a separate pre-merge gate. No R6 merge/deploy is authorized by this task.

**Remaining limitations:** Japan camera-count/playback parity is **incomplete**. No verified publication-ready additional camera candidates are produced. Testing from a permitted browser/deployed origin and separately approved new immutable Trip Data authoring/publication are required later; never mutate `jp2027.1`. Weather, official alerts and operator status remain separate. Existing nonfatal Vite bundle-size warning remains. Production, Supabase, SQL, protected assets, auth/cache/loaders/schema contracts and canonical Trip Data are unchanged. R7/R8 and **Step 15D have NOT started**.


## Pre-15D R7 — Japan fidelity audit and bounded shared Today presentation (11/10/2026)

Issue [#16](https://github.com/yfgary/travelpilot-poc/issues/16), branch `qa/pre15d-r7-japan-fidelity`, candidate **v2.0.0-poc.42**. R6 main **718b19d** full CI/Pages green before edits, as recorded above. Complexity **Medium** for fidelity/source review; the actual runtime patch is **Simple**, using the existing paragraph renderer with no new service or data contract.

**Root causes:** native Chromium on unchanged poc.41 confirmed authored airport instructions missing inside Today full-list rows; the focused activity cards already render description. Full activity rows now render nonempty descriptions using shared RichText, preserving plain escaped paragraphs, warnings/Maps/type/time/optional labels. Highlight copy itself is short in canonical data, Nawate is absent, the D2 castle image is visibly night projection and SA/PA prose is absent; these are authored-data gaps, not renderer substitutions/truncation. R5 already preserves all supplied Place paragraphs.

**Read-only evidence / proposals:** [V2_R7_JAPAN_FIDELITY_AUDIT.md](V2_R7_JAPAN_FIDELITY_AUDIT.md) and [field matrix](V2_R7_JAPAN_CONTENT_MATRIX.json) preserve exact V1/V2 wording for all 36 canonical Places, historical visit/photography metadata, canonical usages/dates/times, nine base highlights, five V1-only records and ten roadside rules, with source line links/hashes. Earliest POC archive commit **6c8737f** already has exact **jp2027.1** input hash; Nawate omission precedes R1–R6, but prior external authoring origin is not available. V1 contains both projection and a separate Nawate backup, so a proven replacement operation cannot be claimed. Chinese name and canonical-time-based highlight proposals are docs-only. Nawate placement, actual highway routes/facility hours, daytime-image source/licence and expanded historical/seasonal claims still require decisions/verification. Existing pickup timeline 11:05–11:25 versus transport 11:15 metadata is not silently reconciled.

**Compatibility / scope:** Schema **6**, strict readers **1–6**, demo.city.5/demo.road.5 and immutable Japan **jp2027.1 / Schema5** unchanged. Japan SHA **09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e** and protected assets remain byte-identical. No source translation, new schema, special-case UI, data publishing or cache/auth/weather/Today derivation change. The R6 fingerprint baseline stays unchanged; a separate R7 single-file override pins exact authorized Today view bytes, all other protected files remain pinned. Production **8b5129b381d6ace94030b51c7b8de5c4e3d5f533** is inspected read-only. No Supabase operation/write, V1 write or published data change.

**Verification:** clean `npm ci` (91 packages) and strict TypeScript/Vite build PASS. New real-browser focused QA **75/75 PASS (1.4m)**, all five widths × Small/Medium/Large, paragraphs/escaping/no-placeholder, manual/reset, old readers/cached snapshots with unchanged bytes, immutable Japan D1/D9 descriptions, canonical gallery/Bonus/Maps/driving notes and long-form detail/focus return. Existing focused regressions **320/320 PASS (5.4m)**. Complete local Playwright **2,715/2,715 PASS (37.3m)**, two workers, all five widths; original run completed while the conversation was interrupted and its full result was recovered, so it was not rerun. No skipped cases, failed retries, weakened assertions or runtime Japan fixture substitution. Final `git diff --check` PASS. Draft PR CI is a separate review gate; no merge/deploy.

**Visual QA:** native Chromium captures of immutable Japan Today/itinerary/Attractions at **320px Large, 390px Medium and 1440px Medium** inspected. Airport instructions/timezones wrap, no body overflow, sticky navigation/status clearance and dialog readability retained. D2 night photo and short actual Place text remain visibly unresolved, as documented. Synthetic all-font/all-width captures demonstrate long authored descriptions and full paragraphs; Today/Bonus/dialog captures inspected at 320px Large and 1440px Medium, not a claim that Japan gained the missing content. V1 rich-section hierarchy/operation notes and actual source wording compared read-only in the locally reproduced V1 browser UI (external requests aborted). Chromium viewport QA is not physical Safari certification.

**Remaining:** R7 shared presentation can be verified separately from content fidelity. Japan highlight/Nawate/naming/daytime-image/SA-PA/long-form changes require a separately verified **new immutable Trip Data Version** and fresh explicit publication authorization. #23 and R6 #25 (five external records vs 44 distinct unverified V1 references; nine tunnel-blocked attempts) remain open. R8 final cross-trip QA pending; **Step 15D has NOT started**. No merge/deploy. Existing nonfatal Vite/Zod bundle notices remain.

## Pre-15D R8/8 — final acceptance and bounded category-label correction (11/10/2026)

Issue [#18](https://github.com/yfgary/travelpilot-poc/issues/18), existing branch `qa/pre15d-r8-final-regression`, candidate **v2.0.0-poc.43**. R7 main/Pages success verified before tracked edits, as recorded above. [Final acceptance matrix](V2_R8_FINAL_ACCEPTANCE.md): **19 PASS / 8 PARTIAL / 1 BLOCKED**, with per-issue PR/commit, test and screenshot evidence. Overall Japan fidelity is not complete: #9/#13/#14/#15/#18/#20/#22/#23 remain authored-data gaps; #25 actual source availability/coverage is blocked/unverified. Green mocks are not content publication approval.

**One genuine generic defect / Simple fix:** Chromium Info cards displayed known `onsen hotel` and `apartment hotel` category codes in English. Add their space/hyphen variants to the existing shared Chinese label map; unknown/localised values remain unchanged. Exact source data, names, prices, dates and all derived behavior are unchanged. Package/lock and automated release expectation advance together; no dependency change.

**QA:** 105 seven-page/width/font diagnostics PASS at 320/390/430/1024/1440 × Small/Medium/Large, 240 captures plus measured JSON/contact sheets. Zero body/main overflow, page errors or status-dock overlap; all 15 sticky selector measurements align below tabs and desktop forecasts stay five columns. Patch-focused **60/60 PASS (1.1m)**; install (91 packages) and strict build/typecheck PASS. Resource-heavy four-worker baseline had 316 PASS/4 font-case timeouts; exact unchanged font tests passed alone 5/5 (33.5s). Four-worker full attempt stopped early (198 PASS/1 timeout/4 interrupted/2,542 not run); final full regression **2,745/2,745 PASS (36.9m), exit 0**, with proven two-worker configuration. No failures/skips/retries or test tolerance/timeout/assertion weakening. Final diff check and immutable/Production checks PASS. Post-fix 320 Large/1440 Medium screenshots inspected. Draft PR QA remains separate; no merge/deploy.

**Preserved:** published jp2027.1 exact SHA-256/UUID/Schema5 and all canonical D1–D9 facts/fixed D6–D8; reader6/support1–6, demos city.5/road.5; R1–R7 functionality, assets, schemas, services, stores, auth, Supabase, SQL and Production SHA unchanged. New screenshots use disposable intercepted provider/auth data, not real backend/camera/forecast certification. Cold-start offline/static-image caching and physical Safari certification remain outside this QA gate. One Draft PR only after local PASS; no merge/deploy or Step15D. Future content choices and explicit publication approval are listed in the acceptance report.

## Post-R8 — unpublished Japan Schema6 content review (11/10/2026)

Issue [#20](https://github.com/yfgary/travelpilot-poc/issues/20), existing branch `content/jp2027-vnext-unpublished-draft`, starting draft `9a8520e811f853578bb944f2d0bc5b0562d992d9`. R8 main `995a9268bebd965c0d41e3cd395eaa9b6be987c8` CI/Pages [38092960792](https://github.com/yfgary/travelpilot-poc/actions/runs/38092960792) verified **completed/success**. This work authors **unpublished data only**: App stays **v2.0.0-poc.43**, current authoring Schema6/readers1–6 unchanged, demos city.5/road.5 unchanged. No application implementation/release, new schema or architectural decision.

**Candidate:** [proposal README](proposals/README.md), [exact draft](proposals/jp2027-schema6-unpublished-draft.json), [manifest/hash](proposals/jp2027-draft-manifest.json), [per-entity source review](proposals/jp2027-source-review.json). Adds original sourced two-paragraph introductions/Japanese labels for 36 original Places, names for seven actual accommodation records, two Meitetsu current adult one-way reference fares (¥980 + ¥450 = ¥1,430; explicitly not payment or January 2027 booking quotes), sourced general NEXCO winter advice and corrected draft-only bear-park operator URL. Existing Nawate is the 37th Place and remains an untimed D1 backup. D1 Projection remains optional 20:20–21:00. All nine canonical dates/routes, fixed D6–D8, timeline and transport instants, bookings/payments, image mappings, navigation, cameras, checklists and weather preserved. Original jp2027.1 Schema5 fixture SHA-256 remains `09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e`.

**Validation:** Initial strict Schema6/reference/timing check **1/1 PASS** before authoring. Final focused **55/55 PASS (1.9m)**: strict schema/refs, fixture identity, timing/booking/media invariants, source provenance, all five trip routes/direct reload, every one of 37 Place dialogs, five viewport widths × Small/Medium/Large, signed-out cache fallback and exact D1/D9 endpoint rendering. Native Chromium 320 Large/390 Medium/1440 Medium screenshots visually inspected: paragraphs/native names wrap, dialog scroll and close controls remain usable, no body overflow. `npm ci` (91 packages), final strict TypeScript/build and `git diff --check` PASS. Complete stable-build regression **2,800/2,800 PASS (38.0m), exit 0**, no retries/skips/failures or weakened assertions/timeouts. One earlier focused reload collided with concurrent preview build-file replacement (54 PASS/1 failure); stable-build rerun passed all55. A premature full launch was stopped at 17 PASS/2 interrupted/2,781 not run before the final complete run. No app-code repair was needed. Existing nonfatal bundle-size warning remains.

**Still open / not final fidelity:** Four air/JR fare amounts and all actual booking totals, target-specific navigation/remaining transport native labels, per-leg SA/PA direction/IC sequence/services, inherited history/fees/hours outside new prose, 2027 Santera/seasonal operation details. Monkey-park guide flags a December2026 fee change; amount not certified. Daytime castle candidate: Luka Peternel **CC BY-SA4.0** file page verified; actual original-file fetch **HTTP403**, no bytes/visual approval/new media mapping. Official Iwatake page links Panomax; real Chromium probe **ERR_TUNNEL_CONNECTION_FAILED**, no verified playback/embedding permission or new camera row. R6–R8 unresolved acceptance items remain open; green mocks are not factual completeness or publication approval.

**Boundary:** candidate label `jp2027.2-DRAFT-UNPUBLISHED` is not reserved, current or published; no runtime/localTrips import. Production read-only reference remains clean at `8b5129b381d6ace94030b51c7b8de5c4e3d5f533`; protected assets, source schemas/services/stores, original fixtures, Supabase and SQL untouched. No Supabase/V1 write or trip-version publication. One Draft PR only after local PASS; no merge/deploy. Separate explicit authorization is required before actual Trip Data publication. **Step15D has NOT started.**
