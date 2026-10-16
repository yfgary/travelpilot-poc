# Stage A — isolated review build

## Current public POC review preparation — 16/10/2026

[Public hosting consent and bounded implementation](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6217065300) supersede the separate-origin/Windows/Tailscale hosting preference in the historical Stage A description below. The future public target is `/travelpilot-poc/review/#/`; no Preview has been deployed by this Draft work. Normal POC keeps its existing root and adds one explicit unpublished review entry.

- `npm run build`: unchanged normal build purpose, emits normal `dist/` only.
- `npm run build:isolated-preview`: validated, service-isolated review build with base `/travelpilot-poc/review/`, emits `dist-preview/`.
- `npm run build:pages`: normal + isolated typecheck/build, then byte-preserving copy to `dist/review/` and artifact verification. Always run this before `npm test`; both local test servers serve these freshly built roots.
- `npm run verify:pages`: verify both entry bases, manifests/scopes/icons, all source assets, review copy completeness, normal payload exclusion and review live-transport exclusion.
- Future main-only Pages workflow runs both builds, complete regression, dedicated same-origin release smoke and final artifact verification before its **single** upload/deploy. Current Draft App45 deliberately fails the main release-version guard; a reviewed version bump and matching assertions are required before main integration. Draft push runs PR CI, not deployment.

Preview build-only identities: `travelpilot-preview.font-size`, `.recent-trip`, `.weather-region.*`, `.navigation-history`, `.today.preview.*`, `.today.progress.*`; IDB `travelpilot-preview-v2-trips`, `travelpilot-preview-v2-user-state`, `travelpilot-preview-v2-weather-cache`; BroadcastChannel `travelpilot-preview.checklist-state`. No normal storage identity changes or migration/readback from normal keys. No Cache Storage or service-worker operations are introduced; existing same-origin caches/workers are never globally removed. Separate manifest-relative scope/identity does not create a security origin.

New `publicReview.spec.ts` exercises normal + review on the same4173 origin, all seven pages ×3 fonts ×5 widths, direct reload/scoped images/manifest, synthetic normal local/session/IDB/cache sentinels, channel identities and two-app Checklist Reset/normal Clear. Existing separate-port Preview cases remain intact with the new URL and font namespace. Original immediate reload/5s/zero-retry checks remain. An old local4174 server from the previous day was detected via asset404 Trace; it was stopped without workspace reset and its failed/interrupted run was retained under ignored work/. Browser-matched independent CI remains required.

Public site/data remains unpublished review content. No actual Safari/iPhone or camera playback/future-weather certification. Checklist durability root remains INCONCLUSIVE. No Tailscale, merge/deploy, main/Production/Supabase/content/assets/Step15D changes.

## Historical Stage A boundary

Approved boundary: [PR #21 decision](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6199542612), based on `1a962fad4253aad16c948b65053ccab922cc9502`.

This is a Medium, bounded build-time integration. Normal `src/`, `vite.config.ts`, Pages workflows, published snapshots, draft bytes and assets stay unchanged. A separate opt-in Vite configuration selects a Preview entry and replaces eight explicit service/presentation modules: Auth, trip loading, cloud checklist transport, Settings, application shell, and weather/alerts. The shared router, pages, validator, checklist engine, scoring, navigation and font preferences remain shared. A bundle-module guard rejects real Auth/Supabase/backend/update/JMA transports. Alias drift fails the build rather than silently enabling network services.

The data-only input descriptor pins the exact raw draft file, SHA256, identity and unpublished manifest. Build-time AND browser-time validation fail closed; no published or cached Japan fallback. The generic registry validates the two demos and the review input, returns cloned snapshots, and labels review provenance `preview`. Preview-only types extend provenance, not Trip Snapshot schema. No Japan slug is added to the demo registry.

Auth is permanently signed out, with no SDK/session initialization. Cloud checklist functions fail closed. The existing local-first checklist engine operates in its signed-out scope, preserving edits/reset/reload; its IndexedDB names are prefixed at Preview build time. Trip and weather cache namespaces are also separate. Build-time replacements are exact and fail on drift. Origin separation remains mandatory for future hosting; preferences use the existing keys in the separate origin. Preview never reads the normal trip cache. Settings offers fonts and honest local-only information, with no login, backend, update or sync action.

Weather uses fixed five-day numerical samples, independent of device time, region and network. Existing scoring and layout receive validated samples. Permanent SIMULATED/not-real-2027 disclosure applies to current and five-day displays. Official alerts are unavailable/unverified, including JMA; an empty result never certifies no warnings. External maps/cameras remain user-initiated. No playback or future forecast is certified.

The permanent notice shows unpublished status, Data Version and build commit (plus dirty-tree disclosure where applicable). The existing App Version remains the package source; this isolated Draft build is not a main release. No simulated clock: real device time and existing manual day/progress controls remain. No service worker or cold-start offline claim.

Commands: `npm run build` remains normal; `npm run build:isolated-preview` emits `dist-preview/`; `npm run serve:isolated-preview` binds localhost only. Stage A authorizes local test servers, not any hosted Preview or Tailscale activation. Preview tests use a separate local port and raw Playwright without the ordinary Supabase mock, observe/deny external network, and seed stale authentication/cache data to test isolation. Normal tests continue using their original site.

Future Windows/Tailscale Serve (tailnet-only, never Funnel) needs separate Stage B review. Windows setup must retain LF/raw input bytes (verify the pinned SHA rather than reserializing), have Git/Node available, and use the normalized cross-platform module paths in the Preview config. Stage C clock simulation is deferred. The repository is public: private future hosting does not make the already-public draft confidential. The 28-item UAT remains open; licensed daytime castle photography and verified playable cameras remain blocked. Local-only checklists cannot certify cloud sync. No Production, Supabase, published `jp2027.1`, main or Step15D changes are authorized.


## Local evidence and handoff

Normal build and Preview build/typechecks passed; the normal JS/CSS SHA256 values are byte-identical to pre-change output. Existing runtime/public/assets/normal-config fingerprints are asserted by the new suite. Raw-browser smoke5/5 and viewport/font/safety185/185 passed, zero retries/skips. Strengthened final controls18/20 passed; two430/1024 compound Today/offline cases exceeded30s during coincident44–46s browser-response delays. Trace evidence is retained locally under ignored work; cause is not proven. The exact two tests passed unchanged in a bounded one-worker2/2 control,28.0s. This does not erase the parallel FAIL. Local Chromium151 remains different from required managed153; no timeout/retry/skip/product workaround was introduced. GitHub independent full CI remains the final reference under Issue23. Expected full collection:3,390 cases (3,200 existing +190 Preview). Results are reported after the Draft push; no merge/deployment follows automatically.

The permanent notice identifies the bundled review dataset; per-trip technical details continue to show each demo's own version/source. Windows/iPhone and all28 human UAT acceptances remain pending Stage B authorization. Exact `dist-preview/` artifacts are ignored and are not published by normal Pages builds.
