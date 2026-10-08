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

## V2 shared foundation

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
(versioned IndexedDB cache), `styles`, and `types`. Detailed Itinerary and Trip Information use shared data-driven renderers; the remaining three trip views use one generic placeholder component. `app/pages.ts` supplies all seven route labels and the
shared navigation. The application preference provider applies 小 / 中 / 大 to
the root font size and persists the choice in localStorage; blocked storage
falls back to session-only changes. `demo-trip` (fictional city/public transport)
and `demo-road-trip` (fictional mountain/road trip) are schema-version-2 local
snapshots in `data/demoTrips`. Registering a new data record in `data/trips.ts`
is sufficient; the existing loader/routes/components stay shared. Attractions, Live Cam and Today remain placeholders.

Home derives current/upcoming/completed status from dates in each trip's timezone
using `data/tripDates.ts`. Current trips come first, then upcoming by nearest start,
then completed by most recent end; slugs break ties deterministically. The fixture
array intentionally starts with the completed trip to prove sorting. Cards show
destination, dates, status and the existing demo indication. Home parity is complete and preserves generic temporal sorting, conditional shortcuts and local recently-used badges.

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
App shell/Home/Settings and both local demo fixtures work signed out; real trip
content remains private and owner-scoped; its read-only loader validates current published versions.

The database foundation was already created/verified before this task. A source-control SQL baseline reference records the existing catalog metadata; it is not a migration and must not be auto-applied. The baseline remains historical and unapplied. Step 11 adds the explicitly approved checklist-only migration; V1 access and browser content publishing remain forbidden.
Playwright fixtures intercept all Supabase requests and use fake sessions, so
CI never needs real account credentials. Browser session restoration and logout
use normal SDK behavior; default logout scope is global, and the SDK clears the
local session even if server logout fails. Blocked browser storage cannot provide
normal reload persistence.

## Schema, loader and offline trip cache

`src/data/schema/trip.ts` defines current Trip Schema Version 2 while preserving
the original strict Schema 1 contract. It infers all snapshot TypeScript types
from shared Zod definitions and one cross-reference validator. Schema 2 adds
generic emergency contacts; Schema 1 simply omits that section. Validation returns structured
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

The database name, storage version and record keys remain unchanged. Schema 1
and Schema 2 offline records coexist, retain their actual source versions and
are not rewritten/deleted on read. This payload evolution requires no live DDL.
Trip Information consumes the shared loaded snapshot and presents practical
records plus functional local-first checklists. Definitions stay immutable; user state and sync are separate.

**Device privacy:** logout does not remove downloaded trip snapshots. Anyone
using the same browser profile while signed out can read those cached routes.
They remain until explicitly cleared or browser storage is removed/evicted.
Settings provides confirmed explicit local-data clearing, with an unsynced-change warning. It does not delete server rows or sign out the account.

The shared header Back button uses application-recorded paths and safely falls
back to Home. It never follows an unverified native browser history entry.

The complete Playwright suite retains foundation/auth coverage and adds shared
Back navigation, runtime schema, mocked remote loading, IndexedDB version
retention, invalid-response protection, reload/offline/logout and account
isolation checks, plus two unrelated local snapshots, all ten trip routes, generic
Home date sorting and two mocked remote trips with isolated versions/caches.
No tests require a real password or write to Supabase.


## Step 11 checklist and Settings

`ChecklistSyncProvider` supplies one shared manager; the dedicated user-state IndexedDB database stores owner/trip/item-scoped checked values, dirty records, actual sync metadata and a non-secret device identity/monotonic clock. Signed-in local reads and REST requests are owner-scoped; signed-out device caches retain their downloaded owner for future sync. Demos are local-only. Every item mutation updates UI immediately; ordered groups show completion counts and a confirmed per-list reset.

Sync uses deterministic `(client_updated_at, device_id)` LWW, bounded current-definition reads, batched canonical upserts and a final pull after pushing. The approved private invoker database trigger rejects stale/equal updates atomically and assigns server-owned `updated_at`. Local mutations/sign-in/reconnect, visible focus, manual Settings sync and conservative visible 30-second polling are supported; there is no Realtime. Failures retain pending state; blocked storage leaves session state with a visible warning.

Settings includes account, font, actual sync/pending status, downloaded-trip versions/timestamps, explicit local clearing, metadata-only update checks, Traditional Chinese language placeholder and App Version. Optional automatic checking defaults off and persists locally; no forced reload or current-trip refresh occurs. App Version missing from published metadata shows neutral unsynced status.

**Device privacy:** logout retains downloaded trips, local checklists and pending changes. Cached-owner edits can sync only after the original owner signs in. Clearing removes local snapshots/pointers/checklist/queue/sync records while retaining Auth/fonts and the non-secret device identity/clock. Shared-browser signed-out access remains intentional. Browser storage eviction or blocking prevents guaranteed persistence; no cold offline app/static-image cache is implemented yet.

Migration and read-only live verification: `supabase/migrations/20261008135932_step11_checklist_client_clock.sql`, `supabase/verification/step11.md`. No live user test rows were inserted. Dev-only pinned PGlite executes the exact migration in an isolated PostgreSQL engine; all browser Supabase boundaries remain mocked. Trip schema (current 2, readers 1+2), fixture data versions (demo.city.3/demo.road.3), Home, Back navigation, canonical assets and production remain unchanged.
