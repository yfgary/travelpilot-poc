# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Progress
**Step 5/16 — Supabase V2 foundation — frontend integration: COMPLETE**

Next: **Step 6/16 — Trip schema + versioned data loader**

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
- Complete PWA/offline implementation (manifest foundation only is complete)
- multi-trip renderer implementation
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

## Next step
Step 5 is complete. Next is **Step 6/16 — Trip schema + versioned data loader**, only when explicitly authorized. No Step 6 implementation has begun. Real trip migration and feature engines remain outside this foundation.

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

## Known limitations
- Real-account login was not exercised because no user password was requested or used. Automated tests validate the actual SDK against intercepted network responses.
- Live Supabase REST reachability was not reverified from this execution environment: its network policy excludes the Supabase host. The Settings check runs in the user's browser; prior database/RLS/advisor verification is recorded from the supplied handoff.
- Default SDK logout scope is global. SDK session storage is cleared even when remote logout returns an error; the UI reports this without claiming that server-side logout succeeded.
- Standard reload persistence requires available browser storage. Font preferences remain local only; no Supabase preference or checklist sync.
- No public/shared trip content, real snapshot loader, schema validator, trip download, service worker strategy, weather, Live Cam or Today Mode engine.
- Existing Chromium viewport coverage is not physical iPhone/Safari certification or complete V1 parity.
- POC automatic build/test/deploy workflow remains intact; its remote result is verified after pushing.

## Next bounded task
**Step 6/16 — Trip schema + versioned data loader** (not started)

Only when explicitly authorized:
- versioned TypeScript trip schema/validation
- generic dummy snapshot format
- owner-scoped Supabase snapshot loader
- IndexedDB trip cache
- distinct App / Trip Data / Trip Schema versions
- validation/error handling

Do not begin Step 6. Production must not be modified.
