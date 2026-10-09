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
