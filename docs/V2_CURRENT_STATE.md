# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Progress
**Step 7/16 — Multi-Trip Proof: COMPLETE**

Next: **Step 8/16 — Home Page Parity**

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
- Full trip content renderers (shared multi-trip placeholder shell is proven)
- Complete V1 UI parity (shared responsive baseline only is complete)
- weather engine
- suitability engine
- checklists implementation
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
- Step 8 implementation remains unstarted by this documentation release.

## Next step
Step 7 passed the multi-trip architecture gate. Next is **Step 8/16 — Home Page Parity**, only when explicitly authorized. No Step 8 implementation has begun. Real trip migration and feature engines remain outside this foundation.

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

## Known limitations
- No real published V2 trip data is seeded by this task, and no real account password was used. Remote loader/auth behavior is tested with the actual SDK and mocked network responses. No live DDL or advisor remediation is performed.
- Cached private trip snapshots remain readable signed out in the same browser profile until cleared/evicted. Clear Offline Data UI, image caching, service worker and cold offline app-shell startup are later steps.
- Home lists the two local fictional demos only. Real remote Home listing, final Home parity and full itinerary/other trip content renderers are not implemented. No weather scoring/API, playback, Today Mode, checklist sync or Supabase preference sync. Home temporal statuses recalculate on render/visit; no continuous midnight update timer is added.
- Auth uses standard browser storage and default global logout scope; a failed server logout may still clear the local session, as documented in Step 5.
- Build has non-blocking upstream Zod comment-annotation warnings and a ~620kB minified JS chunk (~182kB gzip). No warning threshold or test requirement was weakened.
- Chromium viewport tests are not physical iPhone/Safari certification or final V1 parity. App-managed Back relies on session storage for reload continuity; blocked storage safely falls back Home after reload.

## Next bounded task
**Step 8/16 — Home Page Parity** (not started)

Only when explicitly authorized: refine Home presentation to the Golden Visual Reference while retaining the proven generic trip/date architecture.

Do not begin Step 8. Production must not be modified.
