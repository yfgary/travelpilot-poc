# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Progress
**Step 3/16 — Codex Foundation scaffold: COMPLETE**

Next: **Step 4/16 — Shared UI shell + responsive baseline**

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
- Full V2 feature implementation (only the foundation scaffold is complete)
- Supabase schema migration
- Complete PWA/offline implementation (manifest foundation only is complete)
- multi-trip renderer implementation
- UI parity implementation
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
Proceed to **Step 4/16 — Shared UI shell + responsive baseline** only when requested. Step 3 is complete; Step 4 has not begun. Real trip migration, backend integration and feature engines remain outside this foundation.

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

## Known issues / deliberate foundation limits
- No known Step 3 acceptance failures.
- Manifest only: no service worker, cold offline reload, offline trip download, IndexedDB or installability claim yet.
- ONLINE/OFFLINE is the browser connectivity hint, not a backend availability check.
- Trip views are generic placeholders; no itinerary, attractions, hotel, weather, Live Cam or Today Mode functionality.
- Browser coverage is Chromium mobile/desktop viewport emulation, not physical iPhone/Safari certification.
- GitHub Pages publication was not tested remotely. The POC Pages source must be GitHub Actions before the manual workflow is run.
- No new architectural decision was required; `V2_DECISIONS.md` is unchanged.

## Next bounded task
**Step 4/16 — Shared UI shell + responsive baseline**

Scope from the roadmap:
- V1-inspired shared header/navigation/layout
- iPhone + desktop responsive behaviour
- global typography/font-size system
- refined lower-left online/offline + version status
- shared loading/error/empty states

Step 4 has not begun. Production must not be modified.
