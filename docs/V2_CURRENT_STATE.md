# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Current phase
**Phase 1 — Specification and architecture**

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

## Not started
- Functional V2 application rewrite
- Supabase schema migration
- PWA implementation
- multi-trip renderer implementation
- UI parity implementation
- weather engine
- suitability engine
- checklists implementation
- Live Cam implementation
- Today Mode implementation
- real trip data migration

## Known issue / verification needed
The user states the canonical assets are already uploaded at:
- `travelpilot/assets/images/travelpilot_banner.PNG`
- `travelpilot/assets/images/travelpilot_icon.PNG`

At the start of Phase 1, those exact paths were not found on the POC repository default branch through the GitHub connector. Re-check before Phase 2; do not silently substitute other artwork.

## Next step
Review Phase 1 documentation for missing requirements and confirm/inspect the existing V1/Supabase structures needed for migration planning.

Do **not** start broad implementation until the architecture/data model has been reviewed against the Golden Content trip.

## Handoff instruction
In a new conversation/session:
1. Read `AGENTS.md`.
2. Read all `docs/V2_*.md` files, especially this file and the Decision Log.
3. Summarize current phase, completed work, open issues, and next bounded task.
4. Do not modify code until the requested task is clear.
