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

## Step 3 foundation

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
with a `v` prefix. Trip data and schema versions are separate future concerns.

Folders under `src/`: `app` (shell, routing, metadata), `views`, `components`,
`data/schema` (routing fixture type), `services` (fixture lookup), `offline`
(reserved boundary), `styles`, and `types`. The five trip views use one generic
placeholder component. `demo-trip` contains routing metadata only; it is not a
published trip snapshot or a full itinerary.

The manifest uses the original canonical icon. The build copies both branding
files byte-for-byte into `dist/assets/images/`; originals stay in `assets/images/`.
There is no service worker or offline download yet. ONLINE/OFFLINE reflects the
browser connection hint and does not guarantee backend reachability.

## Routing checks

```sh
npm run build
npx playwright install chromium
npm test
```

For an existing Chromium installation, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium` when running `npm test`.
Tests exercise the built app at the repository base path on 320px mobile and
1440px desktop viewports, including all seven views, reloads, unknown trips,
connection changes, manifest and unchanged branding bytes.

## POC GitHub Pages

The manual **POC GitHub Pages** workflow installs, typechecks, builds, tests, then
deploys `dist` for `yfgary/travelpilot-poc` only. Set this POC repository's Pages
source to **GitHub Actions** before manually running the workflow. It has no push
trigger. No deployment is performed as part of Step 3; production is untouched.
