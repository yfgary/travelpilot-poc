# TravelPilot V2 — Engineering Rules

## Mission
TravelPilot V2 is a **data-driven, multi-trip, offline-first PWA**. Adding a new trip must add or update data only. It must not require trip-specific HTML, CSS, JavaScript, routes, or special-case logic.

## Read before changing anything
Before any implementation or refactor, read:
1. `docs/V2_MASTER_SPEC.md`
2. `docs/V2_ARCHITECTURE.md`
3. `docs/V2_DATABASE_SCHEMA.md`
4. `docs/V2_DECISIONS.md`
5. `docs/V2_CURRENT_STATE.md`
6. `docs/V2_ROADMAP.md`
7. `docs/V2_SCHEMA_VALIDATION.md`

## Repository safety
- This repository is the POC/test lab: `yfgary/travelpilot-poc`.
- POC deployment does not require user approval.
- **Do not modify the production TravelPilot repository unless the user explicitly asks.**
- V1 is the Golden Visual Reference.
- The Japan 2027 / Shirakawa-go detailed itinerary is the Golden Content Reference.
- Preserve existing user-approved visual language unless a spec explicitly changes it.

## Zero trip-specific hard-coding rule
Never write trip-specific behavior such as:
- `if (trip === "japan2027")`
- `if (day === 6)`
- `if (place === "shirakawago")`
- country-specific rendering branches
- separate HTML pages per trip

Rendering must be driven by shared schemas and data. Optional features appear when relevant data exists and remain hidden when it does not.

Generic shared business rules/configuration are allowed (for example font-size choices, score thresholds, activity categories, reusable renderer logic). The prohibition is against trip/country/day/place-specific application logic.

If a requested feature cannot be implemented generically, **stop and report the complexity/trade-off to the user before implementing a workaround**.

## Product rules
- Seven pages: Home, Detailed Itinerary, Trip Information, Attractions Overview, Live Cam, Today Mode, Settings.
- Date format: `DD/MM/YYYY 星期X`.
- Time format: `HH:MM` (24-hour); Today Mode live clock: `HH:MM:SS`.
- Global font size: Small / Medium / Large.
- Language architecture may be prepared, but V2 initially ships in Traditional Chinese only.
- Every page shows online/offline status.
- App and trip data must remain readable offline after prior sync/download.
- Online mode checks server/data versions; updates must not unexpectedly reload the currently viewed page.
- App Version and Trip Data Version are separate concepts.
- Supabase is the backend for login, sync, user preferences, checklist state, and structured trip data.
- Local-first behaviour is required for checklists and cached trip data.

## Release versions
- Every POC implementation/update commit intended for main must bump App Version.
- Production releases also require a version bump.
- `package.json` remains the canonical App Version source.
- App Version and Trip Data Version remain separate.
- Never hard-code the version string into multiple UI components.

## Branding assets
Expected canonical assets (repository-relative paths):
- `assets/images/travelpilot_banner.PNG`
- `assets/images/travelpilot_icon.PNG`

Do not replace or regenerate branding assets without explicit user approval.

Asset-role rules:
- `travelpilot_banner.PNG` is **Home-page brand artwork only**.
- Never use `travelpilot_banner.PNG` as an individual real-trip banner/cover or real-trip fallback.
- Each real trip must receive its own representative destination/journey image from researched trip data.
- The representative image should reflect the defining place in that itinerary, not merely the arrival city.
- Fictional/test trips may use a generic non-destination fallback.
- If a real-trip representative image cannot be sourced/selected safely, stop and ask rather than substituting the TravelPilot brand banner.

## Workflow
Use Chat/architecture work to settle requirements first. Use Codex/implementation only for bounded tasks with clear acceptance criteria.

### User-approved POC Draft PR-first gate — 16/10/2026
The [permanent workflow in Issue #23](https://github.com/yfgary/travelpilot-poc/issues/23) and [PR #21 authorization](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6198853855) supersede the former local-full-green-before-push rule for this Draft branch.
- Reviewed changes may be committed/pushed only to existing Draft PR #21 branch `content/jp2027-vnext-unpublished-draft` after diff/secret review, build/TypeScript, diff checks and relevant focused checks where runnable. Reuse verified unchanged-source results; disclose all FAIL/BLOCKED cases.
- GitHub Actions provides independent browser CI after the Draft push. Red CI remains a failure; do not hide it with retries, skips or weaker assertions. Stop after the first CI result for GPT-6 High review.
- Draft push permission does not authorize POC main changes, merge, Pages deployment, Preview or Production. Isolated Preview requires separately reviewed critical safeguards; Issue #22 user acceptance remains open even with green CI.
- Preserve Production, live Supabase, published `jp2027.1`, protected content/assets and Step15D. Do not reset/recreate the unexported workspace. Push only reviewed source, never local traces/logs/archives/credentials.
- This test/docs-only Draft snapshot keeps App Version `package.json` unchanged; the existing release-version rule applies to a later merge/release.
- Default division: GPT-6 High analysis/review; Codex GPT-6.1 Sol Medium coding/testing. No model switch or excessive delegation without explicit direction.

At the end of every implementation task:
1. Run relevant tests.
2. Check for cross-trip leakage/regression.
3. Update `docs/V2_CURRENT_STATE.md`.
4. Update `docs/V2_DECISIONS.md` if an architectural/product decision changed.
5. Do not claim feature parity without verifying it.

## Complexity escalation
Before building a difficult or brittle feature, classify it as Simple / Medium / Complex / High-risk and explain the maintenance cost. The user may choose to simplify or drop it. Never use hard-coded shortcuts merely to make a feature appear complete.
