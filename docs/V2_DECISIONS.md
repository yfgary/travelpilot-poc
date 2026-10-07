# TravelPilot V2 — Decision Log

## 2026-10-08 — Rebuild architecture, preserve V1 experience
**Decision:** Build TravelPilot V2 as a new architecture while using V1 as Golden Visual Reference.  
**Reason:** Retrofitting full multi-trip behaviour into the existing half-refactored app has produced high regression/context cost.  
**Rejected:** Continue stacking trip-specific patches into the current structure.

## 2026-10-08 — POC repository is the test lab
**Decision:** V2 work happens in `yfgary/travelpilot-poc`. POC deploys do not require user approval. Production must not be changed without explicit instruction.

## 2026-10-08 — Data-driven multi-trip is mandatory
**Decision:** Adding a new trip must not require a new custom HTML page or trip-specific code.  
**Rule:** If a desired feature cannot be generic, discuss simplification/removal instead of hard-coding.

## 2026-10-08 — Supabase remains the backend
**Decision:** Keep Supabase for authentication, structured data, checklist sync, preferences, and version/sync metadata.  
**Reason:** V1 already uses Supabase and V2 needs cross-device state.

## 2026-10-08 — PWA and offline-first are core features
**Decision:** TravelPilot must be installable to iPhone home screen/desktop and previously downloaded trip information must remain usable offline.

## 2026-10-08 — Seven pages
**Decision:** Home, Detailed Itinerary, Trip Information, Attractions Overview, Live Cam, Today Mode, Settings.  
**Reason:** Settings is the home for login, font size, offline/cache/version/update controls, and future language readiness.

## 2026-10-08 — Today Mode replaces separate Driving Mode
**Decision:** Merge the useful V1 Driving Mode behaviour into Today Mode.

## 2026-10-08 — App and data versions are separate
**Decision:** Track application release version separately from each trip's data version.

## 2026-10-08 — Update without disruptive reload
**Decision:** Online version checks may download updates, but the active page must not suddenly reload. Apply on reopen/reload or explicit user action as appropriate.

## 2026-10-08 — Global display conventions
**Decision:** Dates use `DD/MM/YYYY 星期X`. Times use 24-hour `HH:MM`; Today Mode live clock uses `HH:MM:SS`. Font size is a global Small/Medium/Large preference.

## 2026-10-08 — Localization is future-ready only
**Decision:** Prepare data/UI boundaries so localization is possible later, but V2 initially implements Traditional Chinese only.

## 2026-10-08 — Canonical branding
**Decision:** Use the supplied TravelPilot banner and icon as official assets; do not regenerate/replace without approval.

Expected paths:
- `travelpilot/assets/images/travelpilot_banner.PNG`
- `travelpilot/assets/images/travelpilot_icon.PNG`

## 2026-10-08 — Complexity escalation
**Decision:** Difficult/complex/high-risk features must be explained before implementation so the user can keep, simplify, or drop them. No hard-coded workaround is acceptable.
