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

## 2026-10-08 — Canonical branding and trip-cover separation
**Decision:** The supplied TravelPilot banner and icon are official product-brand assets and must not be regenerated/replaced without approval.

Repository-relative canonical paths:
- `assets/images/travelpilot_banner.PNG`
- `assets/images/travelpilot_icon.PNG`

**Banner role:** `travelpilot_banner.PNG` is reserved for the global TravelPilot **Home** hero/banner. It is not an individual trip cover and must never be used as the banner/cover fallback for a real trip.

**Trip-cover rule:** Every real trip receives its own representative destination/journey image, researched and selected during trip migration/content enrichment. The image should represent the most iconic or defining place in that specific journey, not merely the arrival city. Example: for a Nagoya / Shirakawa-go / Takayama journey, Shirakawa-go may be selected as the trip cover because it best represents the trip.

**Research/source rule:** Trip-cover research should prefer official tourism boards, official attractions or other reliable/licensable sources. Store source/attribution/licence information in trip data where required.

**Fallback rule:** Fictional/test trips may use a generic non-destination visual fallback when no image exists. A real trip must not silently fall back to the TravelPilot brand banner; resolve a suitable trip image during migration, or ask the user if a source/choice is required.

## 2026-10-08 — Complexity escalation
**Decision:** Difficult/complex/high-risk features must be explained before implementation so the user can keep, simplify, or drop them. No hard-coded workaround is acceptable.

## 2026-10-08 — Clean POC to V2-only repository
**Decision:** Remove all legacy V1/previous POC implementation files from `travelpilot-poc`. Keep only V2 documentation, V2 repository guidance, a clean README, and the canonical banner/icon assets.  
**Reason:** The user will not reuse the old POC implementation and wants to avoid legacy clutter influencing the V2 rebuild.  
**Reference rule:** V1 remains a Golden Visual/Content Reference externally, but V1 implementation files must not be copied back into the V2 POC unless explicitly requested.

## 2026-10-08 — Golden Content schema validation passed
**Decision:** The V2 entity model is approved to proceed after amendments discovered from the Japan 2027 reference trip.  
**Added generic concepts:** navigation targets/parking, richer accommodation payment metadata, grouped checklist structure, richer hard-cut metadata, flexible live-cam grouping, timeline navigation metadata, and weather activity-profile weights.  
**Rejected:** copying V1 legacy hydrate modes, page filenames, storage keys, or trip/day-specific modules into V2.

## 2026-10-08 — V1 content detail is reference, not itinerary truth
**Decision:** Japan 2027 V1 remains the Golden Content detail reference, but its itinerary logic is not automatically considered current.  
**Reason:** production still contains legacy D6–D8 flexible-weather logic that may be stale compared with the user's newer approved plan. Migration must use the latest approved itinerary.

## 2026-10-08 — V2 frontend stack locked
**Decision:** Use React + TypeScript + Vite for the shared V2 application.  
**Reason:** Seven shared views, stateful PWA behaviour and long-term maintenance benefit from typed reusable components rather than V1-style accumulated patch scripts.

## 2026-10-08 — GitHub Pages hash routing
**Decision:** Use hash routes such as `#/trip/<slug>/itinerary`.  
**Reason:** Direct reload/bookmark works cleanly on GitHub Pages without a server rewrite or 404 workaround.

## 2026-10-08 — Hybrid versioned trip snapshots
**Decision:** Store canonical trip content as validated versioned JSONB snapshots in Supabase, while keeping mutable user state relational.  
**Reason:** This better matches the ChatGPT → validate → publish workflow, offline downloads, atomic updates and rollback.  
**Supersedes:** the earlier highly normalized content-table proposal as the primary V2 content model.

## 2026-10-08 — V1 / V2 Supabase isolation
**Decision:** Existing V1 tables must remain untouched. New V2 tables use the `v2_` prefix.  
**Observed V1 public tables:** `trip_checklist_state`, `trip_checklist_shared`, `trip_sync_config`.

## 2026-10-08 — Weather scoring direction
**Decision:** Reuse the generic concepts proven in V1's newer activity-profile system—Experience score, Access/Safety score, safety caps and profile weighting—but reimplement cleanly in TypeScript. Do not copy Japan-specific legacy modules.

## 2026-10-08 — Persistent lower-left status
**Decision:** Every page/view must show a lower-left status area containing online/offline state and current App Version. Trip Data Version is available in Settings/detail status.

## 2026-10-08 — 16-step progress model
**Decision:** Project progress is tracked as Step N/16. Each completed implementation task updates `V2_CURRENT_STATE.md`.

## 2026-10-08 — Private V2 content with a signed-out shell
**Decision:** V2 trip data is private by default. App shell, Home and Settings may load signed out. Real `v2_trips` and `v2_trip_versions` content requires authenticated ownership enforced by RLS, including ownership of the parent trip for version reads. No public/shared trip feature is implemented in Step 5. The local demo fixture is unchanged; the real loader belongs to Step 6.

## 2026-10-08 — Existing-account password authentication in Settings
**Decision:** Settings provides existing-account email/password login and logout only, using the shared Supabase browser client and auth state. No self-service signup, account creation, password reset, magic link or social login is implemented in Step 5. Supabase JS manages persisted sessions and token refresh.

## 2026-10-08 — Modern browser key and V1 isolation
**Decision:** Use the modern Supabase publishable key in the browser client, with public project configuration in one module. Do not use privileged credentials or the legacy anon JWT. The already-applied V2 tables remain isolated from V1; existing V1 Supabase tables, policies and advisor warnings stay untouched. This Step 5 frontend integration performs no database DDL or migrations.

## 2026-10-08 — Retain offline snapshots after logout
**Decision:** Validated offline trip snapshots remain local device data after logout and are readable signed out/offline in that browser profile. Clearing is explicit in a future Settings control; browser storage removal/eviction may also remove them. Signed-in fallback uses owner-scoped pointers so switching accounts does not silently return another account's cached trip. Remote ownership remains enforced by Supabase RLS. App Version, Trip Data Version and Trip Schema Version remain separate.

## 2026-10-08 — Schema 2 emergency information with Schema 1 compatibility
**Decision:** Current Trip Schema Version is 2; supported versions are 1 and 2. Schema 1 retains its original strict contract. Schema 2 adds one generic emergency-information model with globally stable contact IDs, generic categories, optional phone/HTTP(S) URL/region/context and canonical source references. Shared common definitions and cross-reference validation avoid competing contracts.

**Compatibility:** Remote row/payload versions must match. LoadedTrip and cached records retain their actual source schema version. Existing Schema 1 IndexedDB snapshots remain readable without rewriting, migration, deletion or a database-name/storage-version change; Schema 2 records may coexist safely. Unsupported future formats remain clean errors and cannot replace valid offline data.

**Database:** No live schema change is required because published trip payloads remain JSONB. No Supabase DDL, V1 table changes or browser publishing is performed.

**Step boundary:** Trip Information reuses canonical transport/accommodation/navigation/hard-cut/checklist/source data. Step 10 renders checklist definitions only; local-first state/sync belongs to Step 11 and weather belongs to Step 12.
