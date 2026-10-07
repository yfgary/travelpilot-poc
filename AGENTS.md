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

## Repository safety
- This repository is the POC/test lab: `yfgary/travelpilot-poc`.
- POC deployment does not require user approval.
- **Do not modify the production TravelPilot repository unless the user explicitly asks.**
- V1 is the Golden Visual Reference.
- The Japan 2027 / Shirakawa-go detailed itinerary is the Golden Content Reference.
- Preserve existing user-approved visual language unless a spec explicitly changes it.

## Absolute no-hard-code rule
Never write trip-specific behavior such as:
- `if (trip === "japan2027")`
- `if (day === 6)`
- `if (place === "shirakawago")`
- country-specific rendering branches
- separate HTML pages per trip

Rendering must be driven by shared schemas and data. Optional features appear when relevant data exists and remain hidden when it does not.

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

## Branding assets
Expected canonical assets:
- `travelpilot/assets/images/travelpilot_banner.PNG`
- `travelpilot/assets/images/travelpilot_icon.PNG`

Do not replace or regenerate branding assets without explicit user approval.

## Workflow
Use Chat/architecture work to settle requirements first. Use Codex/implementation only for bounded tasks with clear acceptance criteria.
At the end of every implementation task:
1. Run relevant tests.
2. Check for cross-trip leakage/regression.
3. Update `docs/V2_CURRENT_STATE.md`.
4. Update `docs/V2_DECISIONS.md` if an architectural/product decision changed.
5. Do not claim feature parity without verifying it.

## Complexity escalation
Before building a difficult or brittle feature, classify it as Simple / Medium / Complex / High-risk and explain the maintenance cost. The user may choose to simplify or drop it. Never use hard-coded shortcuts merely to make a feature appear complete.
