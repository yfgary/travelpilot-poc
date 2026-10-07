# TravelPilot V2

TravelPilot V2 is a data-driven, multi-trip, offline-first PWA.

This repository is the **POC / test lab** for the V2 rebuild.

## Source of truth
Before changing implementation, read:
- `AGENTS.md`
- `docs/V2_MASTER_SPEC.md`
- `docs/V2_ARCHITECTURE.md`
- `docs/V2_DATABASE_SCHEMA.md`
- `docs/V2_DECISIONS.md`
- `docs/V2_CURRENT_STATE.md`
- `docs/V2_ROADMAP.md`

## Canonical branding
- `assets/images/travelpilot_banner.PNG`
- `assets/images/travelpilot_icon.PNG`

## Safety
- Do not modify the production TravelPilot repository unless explicitly requested.
- Do not reintroduce legacy V1 POC code into this repository.
- Do not hard-code trip-specific behaviour.

## V2 shared foundation (Step 6)

Node.js 22.12+ (Node 24 recommended):

```sh
npm install
npm run dev
npm run build
npm run preview
```

Development and production preview use `/travelpilot-poc/`. Routes live in the
hash, for example `/travelpilot-poc/#/trip/demo-trip/itinerary`, so bookmarks and
reloads request the same single HTML document on GitHub Pages.

`package.json` → `version` is the only App Version source. Vite injects its value
with a `v` prefix. Trip Data Version and Trip Schema Version are stored and displayed separately.

Folders under `src/`: `app` (shell, routing, metadata), `views`, `components`,
`data/schema` (canonical Zod snapshot contract), `services` (read-only loader), `offline`
(versioned IndexedDB cache), `styles`, and `types`. The five trip views use one generic
placeholder component. `app/pages.ts` supplies all seven route labels and the
shared navigation. The application preference provider applies 小 / 中 / 大 to
the root font size and persists the choice in localStorage; blocked storage
falls back to session-only changes. `demo-trip` is a validated generic schema-version-1 local snapshot; the trip content views remain placeholders.

The manifest uses the original canonical icon. The build copies both branding
files byte-for-byte into `dist/assets/images/`; originals stay in `assets/images/`.
Trip data is cached in IndexedDB; no service worker or cold offline app startup is implemented yet. ONLINE/OFFLINE reflects the
browser connection hint and does not guarantee backend reachability.

## Routing checks

```sh
npm run build
npx playwright install chromium
npm test
```

For an existing Chromium installation, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium` when running `npm test`.
Tests exercise the built app at the repository base path on 320px, 390px, 430px mobile and
1024px, 1440px desktop viewports, including all seven views, reloads, unknown trips,
connection changes, manifest and unchanged branding bytes. Additional checks
cover approved page names, the release version, all three font sizes on every
route, persistence, unavailable/invalid storage, touch targets, banner aspect
ratio and a reserved status footer below the scrollable content area.

## POC GitHub Pages

The **POC GitHub Pages** workflow runs on pushes to `main` and can also run
manually. It installs with `npm ci`, typechecks/builds, and runs the complete
Playwright suite before deploying `dist`. Both jobs are restricted to
`yfgary/travelpilot-poc` on `main`; deployment depends on a successful build/test
job. The POC repository Pages source must be **GitHub Actions** to prevent
legacy branch publication from bypassing this gate. Production is untouched.

Every POC implementation/update commit intended for main must bump the package
version. App Version is independent of Trip Data Versions.

## Supabase frontend foundation

`src/services/supabaseConfig.ts` contains the public project URL and modern
publishable key; `supabase.ts` creates the single browser client. The exact
`@supabase/supabase-js` version is pinned in package.json and the lockfile.
`auth/AuthProvider.tsx` restores SDK-managed sessions, subscribes to auth changes
and exposes shared initialization/session/error state. Settings supports existing
email/password account login/logout only. Passwords are not manually persisted
or logged; the password field is cleared on submit.

Settings performs one bounded published `v2_app_versions` read per visit for
backend status (no polling or automatic query retries). This is separate from
navigator.onLine. An empty published list still confirms a successful read.
App shell/Home/Settings and the local demo fixture work signed out; real trip
content remains private and owner-scoped; its read-only loader validates current published versions.

The database foundation was already created/verified before this task. A source-control SQL baseline reference records the existing catalog metadata; it is not a migration and must not be auto-applied. No DDL, table migration, V1 access or content publishing is performed by this release.
Playwright fixtures intercept all Supabase requests and use fake sessions, so
CI never needs real account credentials. Browser session restoration and logout
use normal SDK behavior; default logout scope is global, and the SDK clears the
local session even if server logout fails. Blocked browser storage cannot provide
normal reload persistence.

## Schema, loader and offline trip cache

`src/data/schema/trip.ts` defines Trip Schema Version 1 and infers all snapshot
TypeScript types from one Zod runtime contract. Validation returns structured
issues for malformed content, unsupported versions, duplicates, broken references
and invalid dates/numbers. Generic weather/Live Cam structures define data only.

`src/services/trips.ts` reads the authenticated owner's matching `v2_trips` row,
then its published `is_current` `v2_trip_versions` row. It validates both the row
metadata and complete payload before returning/caching. It never publishes or
writes content. Local demo fixtures use the same validator.

`src/offline/tripCache.ts` stores `[tripId, dataVersion]` records and atomically
updates current pointers without deleting prior versions. Invalid/unavailable
remote data falls back to a revalidated cache. Signed-in pointers are scoped to
the owner; signed-out reads use the last downloaded device pointer. Storage
failure leaves valid remote data usable with a cache notice.

**Device privacy:** logout does not remove downloaded trip snapshots. Anyone
using the same browser profile while signed out can read those cached routes.
They remain until explicitly cleared or browser storage is removed/evicted.
A Settings Clear Offline Data control belongs to a later step.

The shared header Back button uses application-recorded paths and safely falls
back to Home. It never follows an unverified native browser history entry.

The complete Playwright suite retains foundation/auth coverage and adds shared
Back navigation, runtime schema, mocked remote loading, IndexedDB version
retention, invalid-response protection, reload/offline/logout and account
isolation checks. No tests require a real password or write to Supabase.
