# TravelPilot V2 — Current State

Last updated: 08/10/2026

## Current phase
**Phase 1 — Specification and architecture (schema validation complete)**

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

## Repository cleanup
- Legacy V1/previous POC implementation files have been removed from this repository by user request.
- The POC repository now contains only V2 planning/docs, a clean V2 README, and the two canonical TravelPilot branding assets.
- Canonical assets verified on POC:
  - `assets/images/travelpilot_banner.PNG`
  - `assets/images/travelpilot_icon.PNG`

## Next step
Prepare the first bounded **Phase 2 Foundation Codex task**. It must build only the generic V2 shell/routing/PWA foundation with dummy trip data. Do not migrate Japan 2027 yet and do not implement full weather, Live Cam, or checklist sync in the first task.

Do **not** start broad implementation until the architecture/data model has been reviewed against the Golden Content trip.

## Handoff instruction
In a new conversation/session:
1. Read `AGENTS.md`.
2. Read all `docs/V2_*.md` files, especially this file and the Decision Log.
3. Summarize current phase, completed work, open issues, and next bounded task.
4. Do not modify code until the requested task is clear.


## Pending architecture review — not yet approved
A higher-effort review on 08/10/2026 identified several recommendations that must be discussed/approved before they become final architecture decisions:

1. Consider React + TypeScript + Vite for the V2 frontend to reduce long-term patch-script sprawl.
2. Prefer GitHub-Pages-friendly hash routing (for example `#/trip/<slug>/itinerary`) over history routes that can 404 on direct reload.
3. Consider simplifying the V2 Supabase content model to a hybrid/versioned JSONB trip snapshot model instead of highly normalized content tables, because trip import, offline caching, atomic versioning and rollback may be simpler.
4. Keep all new V2 Supabase tables isolated from existing V1 tables, preferably with a `v2_` prefix.
5. Existing Supabase project was inspected: current public V1 tables are `trip_checklist_state`, `trip_checklist_shared`, and `trip_sync_config`. Do not alter them for V2 without explicit approval.
6. Preserve the generic ideas from V1's newer weather activity-profile scoring (experience + access/safety + safety caps), but reimplement cleanly rather than copying legacy Japan-specific modules.
7. Make the lower-left version + online/offline indicator an explicit requirement on every page.
8. Correct repository-relative branding paths to `assets/images/travelpilot_banner.PNG` and `assets/images/travelpilot_icon.PNG`.

These are **pending recommendations**, not approved decisions. A future conversation must not silently implement them; summarize them to the user first.
