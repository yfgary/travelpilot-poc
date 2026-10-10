# TravelPilot V2 — Conversation / Session Handoff

This file exists so the project does not depend on chat memory.

## Source of truth
Repository documentation is authoritative for project state:
- `AGENTS.md`
- `docs/V2_MASTER_SPEC.md`
- `docs/V2_ARCHITECTURE.md`
- `docs/V2_DATABASE_SCHEMA.md`
- `docs/V2_DECISIONS.md`
- `docs/V2_ROADMAP.md`
- `docs/V2_CURRENT_STATE.md`
- `docs/V2_SCHEMA_VALIDATION.md`

## Recommended first message in a new ChatGPT conversation
> 繼續 TravelPilot V2。先讀 repo 內 AGENTS.md 同所有 docs/V2_*.md，尤其 V2_CURRENT_STATE.md 同 V2_DECISIONS.md。讀完先總結而家做到邊、已完成、未完成、known issues 同下一個 bounded task；未確認之前唔好改 code。Production 唔准改，只用 travelpilot-poc。

## End-of-task rule
Before finishing any implementation task:
- update `V2_CURRENT_STATE.md`
- record any changed decision in `V2_DECISIONS.md`
- record newly discovered high-risk/complex requirements
- identify the next bounded task
- state tests run and remaining known issues

## Why
Chat memory is useful but is not guaranteed to carry every technical detail into a new conversation. The repository documents are the durable handoff mechanism for ChatGPT, Codex, and future sessions.


## Continuity rule
Do not rely on ChatGPT Memory as the authoritative project record. At the beginning of a new conversation, read the repository documents first.

If `V2_CURRENT_STATE.md` contains a **Pending architecture review** section, explicitly summarize those pending items and ask/confirm before treating them as final decisions.

A recommendation discussed in chat is not a final project decision until it is either:
- explicitly approved by the user and recorded in `V2_DECISIONS.md`, or
- purely factual/documentation correction that does not change product behaviour.

## Minimal restart prompt
> 繼續 TravelPilot V2。先讀 travelpilot-poc 入面 AGENTS.md 同所有 docs/V2_*.md，尤其 V2_CURRENT_STATE.md、V2_DECISIONS.md 同 V2_SCHEMA_VALIDATION.md。先總結 Current Phase、已完成、Pending Review、Known Issues 同下一個 bounded task。未確認之前唔好改 code；Production 唔准改。

## Current immediate handoff — 10/10/2026

- POC baseline: **v2.0.0-poc.26**.
- POC main before this documentation-only handoff update: 6c8737fb09699de684b3eddb9058a86c520efcb8.
- Step 15C Japan repository/frontend integration is complete and CI/Pages passed **2,465 tests**.
- Exact Japan jp2027.1 Schema-5 payload is published/current in Supabase.
- Production remains untouched.
- **Do NOT start Step 15D yet.**
- The active task is **Pre-15D UI / Presentation / Function QA Round 1**, containing 28 user-reported items recorded in docs/V2_CURRENT_STATE.md.
- Highest-level theme: shared UI is too vertically sparse; sticky navigation, weather layout, Today Mode, itinerary presentation, attraction detail, Live Cam parity and V1 content fidelity need refinement.
- Treat this as a generic shared-component/data-model task. No Japan/day/country-specific UI branching.
- User has said there will be another QA round after this one.

Recommended new-chat first action:
1. Read AGENTS.md and all docs/V2_*.md.
2. Read the full Pre-15D Round-1 section in V2_CURRENT_STATE.md.
3. Summarize the 28 items grouped by shared UI, weather/Today, itinerary/data, attractions, Live Cam and content fidelity.
4. Inspect V1 production read-only where fidelity is questioned.
5. Do not modify production. Do not start Step 15D.
6. Before code changes, propose a bounded implementation order/release split so the 28 items are not patched as one uncontrolled rewrite.

## Approved Pre-15D R1 implementation handoff — 10/10/2026

- User approved **8 bounded QA rounds** and authorized only R1 now (items 1/3/4/5/21/28). POC App Version candidate **v2.0.0-poc.27**.
- Branch `qa/pre15d-r1-shared-shell`: shared sticky icon trip navigation; computed spacing for existing sticky selectors; scroll-aware Back-to-Top; technical trip identifiers/source/versions moved to quiet footer; global + checklist density; green/red connection indicator. Focused browser tests added.
- Confirm full POC CI suite and Pages deployment before declaring R1 verified; no local npm runner is available in this connector-driven session.
- Original `jp2027.1` data stays published/current and immutable for this change. Trip Schema 5 and all older readers unchanged. Production and live Supabase remain untouched. **Do not begin Step 15D.**
- Next implementation only after R1 gate: R2 Weather + Today, with user-requested **today's actual five-day data shown as explicitly-labelled simulated POC weather** for layout/score testing in out-of-horizon January 2027 dates. No claim of actual 2027 meteorological forecast.

## R1 CI repair handoff

- First R1 CI run [37992256506](https://github.com/yfgary/travelpilot-poc/actions/runs/37992256506): 2,465 PASS / 20 FAIL across five viewports; build green, deployment skipped. Only four unique failure causes (stale hardcoded version test; sticky test not accounting for main padding; two trip-information quick-nav headings short of sticky offset).
- Candidate R1 hotfix version **v2.0.0-poc.28**; wait for full CI & Pages green. Fixes test semantics precisely and increases info heading scroll clearance. No production/Trip Data/Supabase change.
- R2 staged Draft PR #9 currently also uses `poc.28` from the pre-hotfix parent. **Before merging R2, rebase/update it onto the new R1 main and advance R2 to the next unique App Version (at least poc.29).** Do not merge until R1 is verified.

## R2 Draft rebased after R1 hotfix (10/10/2026)

- R1 first suite 2,465 pass / 20 fail; corrective POC v2.0.0-poc.28 merged as `1474036`. Its new full CI run is the release gate; do not merge R2 while pending/failing.
- R2 is Draft PR #9 from `qa/pre15d-r2-weather-today`, rebased onto the R1 hotfix main, and separately versioned `v2.0.0-poc.29`.
- R2 has weather density/alignment/five-column desktop, colored score, clearly-labelled POC-only current-weather simulation for out-of-horizon planned days, Today navigation consolidation, and focused tests. Build/full suite and visual checks must still be completed before R2 merge.
- No production/Supabase/jp2027.1 changes. Do not start Step 15D.

### R2 validation correction (10/10/2026)

- Initial PR QA run `37996092829`: Build PASS, **2,495 passed / 5 failed**. Sole distinct failure: old Today visual test expects the removed out-of-range blank view for all five widths.
- R2 candidate corrected to **v2.0.0-poc.30**; test now verifies POC-only simulation warning, actual sample metrics/score and that matching-date real forecasts remain unsimulated. No UI/source payload change in the correction.
- Rerun full PR CI and keep PR #9 Draft until PASS. Production/jp2027.1 and Step 15D remain untouched.

## R3 Detailed Itinerary layout candidate — 10/10/2026

- User said go next after R2 PR QA. R2 `poc.30` complete pre-merge QA PASS and was squash-merged to POC `main` (`d20b341`); the R2 main CI+Pages gate must be checked before declaring deployed.
- R3 candidate v2.0.0-poc.31 on `qa/pre15d-r3-itinerary-layout`: day-jump D number + `day.title`, 3/2/1 image gallery geometry, inline mapped title action, compact timeline/cards and full-information accommodation presentation. Covers #7, #10, #11, #12, #17 only.
- R3 has new Playwright assertions and existing day jump snapshot expectations updated. Run entire PR QA before merge. Production repo, Supabase and published/current `jp2027.1` unchanged, Step 15D on hold.

## R4 metadata presentation stage A — 10/10/2026

- POC-only `qa/pre15d-r4-metadata`, candidate `v2.0.0-poc.32`; stage A code for #18 visible truthful transport prices and #19 Chinese accommodation type codes with unchanged original data, plus regression coverage.
- #15 requires user approval of an optional versioned **native-language name** field and verified content-authoring plan because strict Schema 5 has no such field. Do not pretend a Chinese name is a verified Japanese name, and do not change the already published `jp2027.1` snapshot.
- Check the R3 `poc.31` main CI+Pages gate; run R4 independent PR QA; do not merge an incomplete R4 or start Step 15D.

## R4 Schema 6 approved continuation — 10/10/2026

- User authorized POC Schema 6 + optional local/native name field while preserving Schema 1–5 and explicitly **prohibited publishing or editing Supabase trip data**. Current candidate App Version **v2.0.0-poc.33** on existing Draft PR #12.
- Schema6 extends Schema5 without rewriting older readers. Only optional `localName` on Place/Accommodation/Transport/NavigationTarget; generic UI renders a second line only when populated.
- Schema6 has Weather and exact-timing feature parity; readers/schema validation/remote/cache tests updated. POC Test fixture only, not a new Japan snapshot. Published `jp2027.1` remains byte-identical Schema 5; no Supabase requests made to publish/mutate.
- R4 #18 & #19 were already staged, retained in this PR. Complete GitHub PR QA and review before Merge. Follow-on to reach actual native names in Japan trip is a **separate content authoring + verified-source + new Trip Data Version + publication approval** decision.
- R3 main CI Pages gate must be verified. V1/Production untouched; Step 15D remains on hold.

- R4 QA fixture correction: v2.0.0-poc.34; Day 2 explicitly opened for Place native-name display, Day 1 lodging scoped. Prior PR CI was superseded; latest run must pass.

- Final R4 premerge audit: v2.0.0-poc.35, updated last stale TodayArchitecture schema assertion and added exact timing inheritance test; only latest PR QA counts.

- R4 pre-merge CI [38005282470](https://github.com/yfgary/travelpilot-poc/actions/runs/38005282470) failed 10 of 2,550 Playwright tests (only two outdated hardcoded Schema6-as-unsupported Loader cases repeated at all five widths). Updated both to CURRENT_TRIP_SCHEMA_VERSION+1 while retaining no-cache assertions; release candidate **v2.0.0-poc.36**. Need new full PR QA green before R4 Merge.

## Pre-15D R5 candidate and boundaries (10/10/2026)
- POC-only branch `qa/pre15d-r5-attractions`, App Version `v2.0.0-poc.37`. R4 `poc.36` merged `1914295` after green PR QA, main CI/Pages pending.
- R5 #24: two sticky shortcuts—day (canonical referenced days), location/region—below trip tab bar; status/day is intersected per occurrence. R5 #23: generic full paragraph renderer in shared Place Detail. No heuristic summaries/translations, no per-trip branches.
- **Data gap:** authentic Japan long-form Place content is not altered; separate verified new Trip Data Version authoring/publication authorization required to fully satisfy #23 on real Japan itinerary. Do not declare complete V1 content parity on presentation tests alone.
- New `tests/r5AttractionsQA.spec.ts` runs across five widths. Run R4 main deployment + R5 PR full tests, review mobile/desktop/fontrender, then merge POC only when green. Production/Supabase/jp2027.1 untouched; Step 15D blocked.

- R5 first QA Build failed due to importing a TSX renderer into Node tests; fixed by moving pure paragraph splitting to `src/data/richText.ts`. Candidate App Version v2.0.0-poc.38; rerun full PR CI before merge.

- R5 CI 38063368198: Build PASS, 2,552 Pass / 13 Fail; 5 minimal view excess h3, 5 incorrectly scoped test locator, 3 phone scroll not at sticky threshold. UI omits extra heading without rich detail; test scopes by section parent and computes viewport-specific scroll. Candidate v2.0.0-poc.39; full PR QA rerun required. R4 main CI/Pages PASS.


## R6 Live Cam — Draft-only handoff (11/10/2026)

- Existing R6 branch `qa/pre15d-r6-livecam` is based on R5 main `5f24bb66f1e31c544cb2bd3767e3db5f5ddfcbbe`. Before editing, R5 run **38070578671** build **114266971801** and Pages **114269689108** were verified successful. Candidate **v2.0.0-poc.41**, canonical package/lock version; no R6 deployment or merge.
- Read [V2_R6_LIVE_CAM_AUDIT.md](V2_R6_LIVE_CAM_AUDIT.md): V1 has **44 distinct media references**, but current immutable Japan **jp2027.1** has only **five external records**. Do not claim Japan camera-count/playback parity. All nine real native-browser attempts were **environment-tunnel blocked**; availability and real-provider framing/referrer restrictions remain unverified. Historical V1 dynamic camera/day associations must not override locked D6 village / D7 summit / D8 cave → city.
- Generic viewer merges exact same media source/capability (distinct external previews kept), preserves all context/actions without snapshot mutation, adds truthful load-vs-playback states and explicit fallback/retry. Conservative source security is retained. Still/preview timestamps are device load only, no auto-refresh/fake livestream.
- New `tests/r6LiveCamQA.spec.ts` uses visibly labelled intercepted test documents/images; Chromium actually enforces fixture CSP frame-ancestors and X-Frame-Options. They prove browser/UI mechanics, not real camera playback. Covers stalled visible frame, image failure/retry, deduplication, physical Schema5/6 offline cache, all five widths × three font sizes, keyboard/touch and immutable-scope audit. Existing Schema1–4 media/cache and all prior tests remain.
- Focused media/schema **320 PASS** and corrected R6/architecture **105 PASS**, clean install/build and visual review PASS. First full local run had **2,630 PASS / 10 source-guard failures**; guard corrections preserve no polling/network fetch, authorize only the R6 viewer, and fingerprint unaffected R5 files for shallow CI. Final complete local regression: **2,640/2,640 PASS (38.5m)**; build/typecheck and `git diff --check` PASS. See Current State for detailed evidence and history. Fresh Draft PR QA must be green separately; user has explicitly prohibited merge/deploy. Preserve all R1–R5 work.
- Production reference stays **8b5129b381d6ace94030b51c7b8de5c4e3d5f533**, exact Japan archive SHA **09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e**, Schema6/readers1–6, demo versions and protected assets unchanged. No Supabase read/write or Trip Data publication occurs in this task. Real-provider verification and any newly approved immutable camera data version are separate future work. R7/R8 and **Step15D not started**.

## R7 Japan fidelity — Draft-only handoff (11/10/2026)

- R6 main **718b19d06fa779d9a343bebc480de6ceffa7113d / poc.41**: full CI **2,640 PASS**, Pages successful in run **38080139375**, build **114295176217**, deploy **114297224265**, verified before R7 edits. R7 stays on existing `qa/pre15d-r7-japan-fidelity`, candidate **v2.0.0-poc.42**; no merge/deploy.
- Read [R7 audit/proposals](V2_R7_JAPAN_FIDELITY_AUDIT.md) and its exact 36-Place field matrix. It distinguishes safe renderer fix, verified repository/canonical copy proposals, obsolete V1 route advice and uncertain facts needing decisions/verification. Prior external authoring origin is not known: jp2027.1 already lacks Nawate in earliest archive commit 6c8737f; V1 actually has both projection and separate Nawate backup.
- Only runtime edit: full Today activity rows now show existing authored descriptions via shared RichText, making check-in/buffer/rest instructions visible outside current focus. No highlights/times/data/logic generated or changed. New focused real-browser suite **75 PASS (1.4m)** across five widths/all fonts; exact Schema1–6 cached reads and immutable Japan D1/D9 prove presentation-only behavior. Existing focused regressions **320 PASS (5.4m)**; complete local regression **2,715/2,715 PASS (37.3m)**, original run recovered after conversation interruption without rerun. Clean install, build/typecheck and diff check PASS. Japan and synthetic responsive screenshots inspected; V1 browser reference read-only. Fresh Draft PR CI remains a separate review gate.
- **Do not claim Japan content parity complete:** Chinese labels, deeper attraction prose, Nawate, daytime castle-image mapping and SA/PA details are **unpublished docs-only proposals**. No new image, schema or dataVersion; seasonal/route/licence claims need verification. R5 #23 data gap and R6 #25 camera coverage/availability remain open.
- Production SHA **8b5129b381d6ace94030b51c7b8de5c4e3d5f533**, Supabase, exact jp2027.1 bytes, Schema6/readers1–6, demo versions, assets, stores/auth/checklist/weather/JMA/Today derivation and R1–R6 remain unchanged. Only an explicit one-file R7 fingerprint override permits the authorized shared Today presentation; all other prior fingerprints stay enforced.
- R7 Draft review and separate content publication authorization are next gates. R8 final cross-trip QA still pending. **Do not begin Step15D.**
