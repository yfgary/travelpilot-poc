# Preview checklist reload — bounded diagnosis, 16/10/2026 (+08)

## New bounded packet6218966453: actual4173 Demo control

The previous six153 cases passed but covered4174/Japan. Baseline `a4bb7c5` full run38920117709 failed two **same-origin Demo** assertions (3513/3515 pass). Width1024 loses checked after its first reload, before a normal tab exists;390 loses checked after Preview Reset/recheck, before normal Clear. Do not attribute either to normal Clear, Schema6 content or namespace transforms without evidence.

The opt-in observer is installed before navigation only for the existing publicReview Reset/Clear title. It derives the same ordered Demo item from fixture definitions, compares the first UI checkbox identity with that key, and reads the exact null-owner compound key only after the original test. Prefix/path guards keep4173 normal-page navigation uninstrumented. No private values, labels, session/token, device ID, raw row or error text is exported. Reset-click and false/true put rows are distinguishable by document/transaction IDs plus epoch-relative browser/receive timestamps. Missing transaction completion is not itself proof of abort; getAll/readback/UI comparisons differentiate missing persistence from hydration/key mismatches where evidence permits.

One reviewed Draft push replaces the temporary workflow's selection with exactly the original publicReview title at390/1024,2workers,0retry,Chromium153. Strict two-case/source-file allowlist is separate from retained old six-case collector checks. Each sanitized report remains capped128KiB, total below800KiB, retention7days; raw trace upload is prohibited. The normal full PR workflow is unchanged and remains mandatory. No second diagnostic CI cycle, runtime repair, sleep, retry, timeout, assertion or version change. Original test action/assertion body is byte-identical. Results and any proposed Preview-only durable acknowledgement/replay contract are handed off on PR21 after CI, not represented as an implemented fix.

## Approved next checkpoint: one matching-browser diagnostic push

[Review6211355166](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6211355166) supersedes the historical pending-approval statements below **only for one diagnostic push and CI collection**. No runtime repair is approved. The original four-file evidence remains intact.

- New temporary workflow `.github/workflows/preview-durability-diagnostics.yml` runs only on this POC's same-repository Draft PR21/head branch and relevant paths, via `pull_request`, never `pull_request_target`. No default-branch change/deploy is needed. Existing PR QA is unchanged and runs independently on push.
- Explicit install/build/managed Chromium install and actual major153 check. Exactly the two existing stale-auth and device-clock Today titles across390/430/1024: six scenarios, two real workers, zero retries, original five-second assertions and immediate reload, opt-in observer ON, focused trace ON. No comparator is scheduled unless this one run establishes a specific need.
- `tests/previewDurabilityReport.mjs` verifies exact scenario selection and actual workers/retry settings; exports only strictly allowlisted, hashed event JSON. Unknown fields/values fail closed. Each report is capped128KiB, six reports plus summary below800KiB, retention7 days. Complete safe event timelines are retained without truncating evidence. No real account/session input is used.
- **Raw traces deliberately omitted from public artifacts**: their DOM/draft/synthetic-session contents cannot be guaranteed safe. They are generated on the ephemeral runner; only sanitized event evidence is uploaded. Do not claim raw traces were independently retrieved. Original PR QA artifact behavior remains unchanged.
- Existing workflow/Pages fingerprints are unchanged; the R6 inventory adds exactly the authorized new workflow's SHA256, without relaxing any old fingerprint. Source fixtures, runtime, assets, packages and version remain unchanged.
- Pre-push checks: normal build/TypeScript PASS; six-case selection PASS; sanitizer accepts all existing safe events and rejects unknown/sensitive/oversized input; YAML/Node syntax and workflow inventory checks PASS. Existing one/two-worker Chromium151 evidence below is reused without another local browser/full run.

Focused153 and new normal full CI results are **pending** at preparation time. Existing3387PASS/3FAIL remains unresolved until independent normal CI verifies this final commit. Even a green focused/full run cannot establish a permanent intermittent-data-loss repair. If no reproduction, report **INCONCLUSIVE** and stop for review. No shared src/Preview runtime/journal/sleep/retry/timeout change, no main/merge/deploy/Tailscale/Production/Supabase/Step15D.

**Status: CI root cause UNCONFIRMED; Stage A remains RED.** This is evidence and a pending repair proposal, not a fix or release. Branch `content/jp2027-vnext-unpublished-draft`, HEAD `944b426d91b39eff493f7a72be278b9fdf0e6a68`. [Approved diagnosis packet](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6200724379).

## Existing CI failures: one durability/readback category

[Run38792285169 / job116619625554](https://github.com/yfgary/travelpilot-poc/actions/runs/38792285169/job/116619625554): 3,387 PASS /3 FAIL /3,390, two workers,13.7m, exit1. All three fail the **post-reload checked assertion**, not a whole-test deadline:

|Viewport|Original test / original line|Observed failure|
|---|---|---|
|390|`isolatedPreview.spec.ts:148`, stale-auth/local-checklist; assertion164|first checkbox becomes enabled but remains unchecked; expected checked within5s|
|430|`isolatedPreview.spec.ts:254`, Today/warm-offline; assertion274|same|
|1024|same Today/warm-offline test|same|

The prior local browser-command stalls do **not** explain these functional failures. The 3,200 legacy cases were green in that CI; none were changed in this diagnosis.

## Artifact and browser limits

The approved GitHub artifact downloader returned artifact12002005589 (86,245,812bytes). Executor transfer rejected the ZIP because its32MiB limit is smaller. A single scoped HTTP Range attempt for the ZIP tail via the configured proxy failed with `Tunnel connection failed: 403 Forbidden`; no alternate host, proxy, network-policy change or bypass was attempted. **The three original CI traces were not inspected.** Existing local traces from the preceding task are not substitutes. The artifact remains on GitHub.

**Tracing configuration finding:** `pr-qa.yml:30` invokes plain `npm test`; package script is plain `playwright test`; `playwright.config.ts` and both failing tests configure no tracing. CI failure summaries list only error-context, not trace attachments. Therefore automatic failure traces were not enabled and must not be assumed to exist in this archive. Its file inventory could not be inspected, so no claim is made about unrelated artifacts. A fresh matching-browser instrumented run is likely required; asking for three unavailable old traces alone will not solve the evidence gap.

Playwright1.63 expects managed Chromium153/rev1243. Its expected executable is absent; browser inventory reports missing `.links`. No browser/system install or container change was attempted. Current controls use system Chromium151.0.7922.173 and are **directional evidence only**. A matching153 failing run remains necessary to identify the original CI cause.

## Source-level facts

- `ChecklistDefinitions` changes the shared manager synchronously from the input handler. `ChecklistSyncManager.mutate` lines95–112 publishes an optimistic in-memory row (105) **before** enqueueing asynchronous persistence (106–111). `status` for null owner always returns `只儲存在此裝置`; that text is not a commit acknowledgement.
- `persistMutation` opens a connection, reads the clock and exact compound key, puts row and clock, and awaits `tx.done` (offline/checklistState.ts40–52). Only completion establishes the current IDB write has committed.
- Initial `readUserState` reads rows and awaits its transaction completion; manager initializes its row map and then publishes `ready=true`. A disabled→enabled checkbox means initialization ended, not that a previous document's intended write existed.
- Preview only substitutes the DB constant with `travelpilot-preview-v2-user-state`; writer and reader use the same module/namespace. Registry records use ownerId=null, whose storage scope is `local-demo`. No real Auth, cloud transport or Supabase is involved.
- No synchronous pending-operation journal, commit-status acknowledgement or unload durability barrier is present. This is a **confirmed acknowledgement gap**, not yet proof of an interrupted write in the three CI failures.

## Opt-in observation, unchanged functional assertions

Only `tests/previewChecklistDiagnostics.ts` and the opt-in call in `tests/isolatedPreview.spec.ts` were added/modified. Enable with `TRAVELPILOT_PREVIEW_DURABILITY_DIAGNOSTICS=1`; ordinary suites leave it OFF. It records only known local DB names, relative times, hashed trip/item identity, null/local-demo scope, checked/disabled booleans and request/transaction complete/abort/error labels. No account/token/password/session contents or full row values.

Native IDB and UI events are observed without introducing waits, writes or barriers before the existing reload. A synchronous test-side marker surrounds the original reload method; original actions/assertions are unchanged. Correct compound-key readback is **after** the original test/assertion. Logs/traces remain ignored/local. Instrumentation itself can perturb timing; passing observed runs cannot rule out a race.

`pending:[]` covers created transactions only; an unresolved database open or queued mutation can still exist. Missing old-document console completion alone cannot prove abort. Readback and transaction outcomes must be interpreted together.

## Exact bounded results

A test-list file selects exactly the three CI project/title pairs, preserving original assertions and zero retries. An initial path-selector invocation selected0 cases and is excluded from evidence. Corrected runs:

- One worker: **3/3 PASS**,49.446867s; actual worker count1.
- Two workers: **3/3 PASS**,36.518092s; actual worker count2.
- No skip/retry, timeout/assertion changes or full regression. No write abort/error observed in these six controls.
- Node/test TypeScript and `git diff --check`: PASS. Product bundles were unchanged; the focused harness built Preview as usual. No redundant normal build/full-suite execution.

Times below are milliseconds relative to each test's observation start (browser high-resolution events; reload is a synchronous Node-side call marker):

|Workers / width|Optimistic UI checked|True-row transaction complete|Reload call|Same item restored checked|
|---|---:|---:|---:|---:|
|1 /390|2016.2|2079.4|2129|3180.7|
|1 /430|2429.9|2445.7|2504|3244.4|
|1 /1024|2604.2|2644.8|2739|3545.0|
|2 /390|5164.7|5205.2|5384|7027.0|
|2 /430|6701.9|6735.1|6841|8713.8|
|2 /1024|2610.0|2632.1|2689|3456.2|

All six hydration reads returned `checked=true` for the same `(local-demo, tripHash74b611d5, itemHashf8dd378a)` before the UI was enabled/checked. No observed wrong key, scope mismatch, competing reset or failed write explained a failure, because no failure reproduced. Later reset operations in the stale-auth scenario are distinguished from the first true-row reload.

### One additional immediate-model-reload control

An ignored standalone browser script installed a one-document actor that reloads immediately when the **real React model's checked class** appears. It did not slow/abort IndexedDB, wait for a commit, change application code or replace the original tests. No storage marker or sleep was used; the reload document had no actor. One390px experiment only, Chromium151: **PASS**, no unexpected external requests.

|Relative ms|Event|
|---:|---|
|1781.8|mutation DB open requested|
|1782.6|real model/UI shows checked=true; actor requests reload|
|1785.3|beforeunload; no transaction yet, database open still pending|
|1799.5|old document's DB open succeeds|
|1800.3|old document write transaction starts|
|1811.2|true-row transaction completes|
|2350.3|new document hydration reads the same key, checked=true|
|2366.0|UI enabled and checked=true|
|2815.3|post-test direct IDB read confirms same trip/item/null owner/checked=true|

**Interpretation:** checked UI and even `beforeunload` can precede commit, but `beforeunload` is not the point at which all old-document work stops. This one write survived. It does not demonstrate actual lost data or prove CI was a test-only issue.

## Minimal next step and conditional repair proposal — pending GPT-6 High

**Do not modify shared src/ yet.** Current evidence cannot distinguish the original CI's interrupted persistence from completed-write/wrong-hydration behavior. No definitive product repair is justified yet.

1. If separately recorded original traces exist, obtain them individually (each within32MiB). Otherwise approve a tightly scoped **matching Chromium153 focused CI diagnostic**, explicitly enabling trace and this observer, running only the same three cases with this opt-in observer and post-failure compound-key readback. Existing `pr-qa.yml` currently always runs the full suite; no workflow change or new push was made because it would trigger another full3,390-case run. A manual focused mode needs a separate reviewed workflow packet; it must not report a subset as the full required gate.
2. If checked intent is absent from IDB after reload AND event ordering confirms its write never committed, treat it as **real local durability risk**. A proposed bounded repair is a generic, isolated pending-operation recovery journal written synchronously before an edit is acknowledged, replayed before ready/hydration, removed only after the matching revision's IDB commit. Expose truthful saving/committed/storage-failed state. Start with Preview null-owner scope if review requires preserving normal behavior; no trip-specific logic or cloud dependency. Exact API/storage contract needs approval. Merely awaiting IDB in the test or shortening the queue is not a durability solution.
3. If IDB contains the correct committed value while ready UI is unchecked, fix only the evidenced scope/key/hydration overwrite instead. Do not add a journal to hide an unrelated readback bug.
4. Preserve immediate-reload assertions. A separate commit-acknowledgement control may be added alongside them, never substituted. Keep cloud/account behavior, old snapshots, normal3,200 tests and all protected inputs untouched.

## Preservation and stop

Only two test files and this report/Current State are uncommitted. HEAD remains944b426; App45, Schema6/readers1–6, both raw Japan payloads, assets, src/, preview/, package files, workflows and Supabase remain unchanged. Original archive SHA256 `6888c7dcfcf0f08aa37314a48ed7d1dd275f7723e4f9d3c2260f36cfdccbf2bd` still matches. Local server was stopped. No Commit/Push/CI rerun, main change, merge, deploy, Tailscale, Production change or Step15D. CI3FAIL and Stage A RED remain open.
