# Trip Loading Timeout diagnosis — 15/10/2026 (Hong Kong)

## Current boundary — 16/10/2026

The checkpoints below are historical evidence. [User-approved Draft-first CI](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6198853855) now permits the reviewed test/docs snapshot to be pushed to existing Draft PR21, while all15 failures remain unresolved. No full-PASS/release/Preview claim. Opt-in measurement helpers are retained for bounded diagnosis under that authorization; they are OFF in ordinary CI and no raw measurement artifacts are committed.

Recovered full result:3,185 PASS/15 FAIL/0 skipped/interrupted,3,200 total, exit1, two workers, no retries; completed15/10/2026 16:24:42 HK. Build/TypeScript and affected70-case controls pass on unchanged source. The shared initial-ready12s helper checks exact loaded trip identity without changing existing functional assertions;205-item test retains all items/last checked/exact two pulls and adds exact200+5 ID batches. Multi-trip long loops are split per trip/view, retaining adjacent transitions, reload, navigation, status, overflow, isolation and Settings Back checks.

The15 failures comprise: platform/fixture4; atypical initialization/navigation4; distinct reset-sync observation1; loaded multi-step budget exhaustion5; Home listing readiness1. [Full15-case review](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6197061914) and [platform/browser review](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6197947917) retain the evidence and uncertainty. Late teardown assertions/screenshots do not make a failed test pass.

Short existing fixture/remote-trip controls passed2/2 at one worker(16.30s),2/2 at two workers(14.14s). No new OOM events; CPU throttling observed but no95s stall reproduced. Zombies395/RSS0 indicate unreaped processes, not established RAM exhaustion. Playwright1.63.0 expects Chromium153.0.8010.12; system151 override was used locally. Matching browser absent; official CONNECT403 preflight blocks installation. No container reset or alternate download used.

One isolated observational copy of the original strict reset test passed1/1(8.79s): four optimistic mutations12ms, all durable211ms, debounce sync513ms, reconciliation GET200575–640ms, four-row POST201704–789ms, final GET200790–825ms, dirty0 at973ms; other checklist remains checked, no DELETE/Abort/IDB error. The original failure's incomplete pre-POST GET remains unexplained; no sync/Auth/cache/weather runtime patch is justified.

Ignored raw evidence stays under work/readiness-batch, work/failure-inventory, work/platform-sync-diagnosis and work/browser-consistency. Existing validated archive SHA6888c7dcfcf0f08aa37314a48ed7d1dd275f7723e4f9d3c2260f36cfdccbf2bd remains local; external export blocked. Independent CI is pending at commit preparation,35-minute job limit unchanged. Stop after its first conclusion for review; no merge/deploy/Production/Supabase/content/assets/Step15D.

**Original diagnostic checkpoint (historical): PARTIAL / not ready for full regression, commit or push.** Branch `content/jp2027-vnext-unpublished-draft`, HEAD `8d46bd1df3c9691d123d015da175a7ce7d5b3fb8`. Follows PR21 comment6176253276 and Issue23. The existing uncommitted source-count repair is preserved unchanged. No production/client/runtime/content/SQL/asset/package changes, actual Supabase access, merge/deploy or Step15D. Green automated cases do not close Issue22 acceptance.

## Exact six failures recovered from the original local full report

All six occurred in project `width-1440`. Complete original error text and stack locations are retained in `work/trip-loading-diagnosis/original-six-errors.txt` (copied from `work/ci-source-count-repair/full.log`). Original run had no trace; its error-context cannot retrospectively reveal React Auth state or pending promises.

| File / complete test title | Failed step and exact error | Original screenshot/error-context state |
|---|---|---|
| `japanContentDraft.spec.ts:113` — `unpublished content/native names are readable at medium font and retain offline cache` | Line123 `dialog.getByTestId('native-name').toHaveText(place.localName)`; `Test timeout of 30000ms exceeded.` Expected `瀬戸川と白壁土蔵街`, received empty; protocol reports session closed on cancellation. | Already inside the 37-Place interaction sequence; not initial Trip Loading. |
| `japanContentDraft.spec.ts:113` — `unpublished content/native names are readable at large font and retain offline cache` | Line121 click `詳細介紹：AEON Mall Matsumoto`; `Test timeout of 30000ms exceeded.` Target resolved visible/enabled/stable, click in progress. | Already interacting with authored Places; not initial Trip Loading. |
| `japanRoadSafetyPacket.spec.ts:45` — `R158 safety in itinerary medium` | Line50 `trip-versions.toContainText('Trip Schema Version：6')`; `Timeout: 5000ms`, `element(s) not found`. | Shared `正在載入旅程`; Auth initializing versus loadTrip pending cannot be distinguished from this old snapshot. |
| `japanRoadsidePacket.spec.ts:53` — `conditional D7/D8 roadside notes wrap with unchanged schedule at medium font` | Line58 same trip-version expectation; `Timeout: 5000ms`, `element(s) not found`. | Same shared Trip Loading state; phase unknown historically. |
| `liveCam.spec.ts:88` — `HTTPS embed is lazy, titled, sandboxed and always offers safe source/official/status actions` | `contentFixtures.ts:29`, `live-cam.toBeVisible()`; `Timeout: 5000ms`, `element(s) not found`. | Same shared Trip Loading state; iframe playback had not yet been tested. |
| `weather.spec.ts:40` — `itinerary uses shared normalized weather, score, attribution and five forecast cards` | `weather.spec.ts:20`, `.weather-forecast-day.toHaveCount(5)`; `Timeout: 5000ms`, received0. | City trip heading/itinerary are already rendered. Panel says `載入天氣資料…`. This is weather readiness, not Trip Loading. |

## Non-invasive diagnostic evidence

`tests/loadingDiagnostics.ts`, enabled only with `TRAVELPILOT_LOADING_DIAGNOSTICS=1`, records safe current React hook stage labels (Auth phase and loaded result state), browser clock progress, console/page errors, API path/method/status, IndexedDB open/request/transaction lifecycle and long-task timings. React-private inspection is **diagnosis-only**, not a product dependency. Event listeners forward native DB operations unchanged; no payload or storage values are read. Traces/screenshots and extracted event JSON stay in ignored `work/trip-loading-diagnosis/`, never in production assets.

No request headers/bodies, session values, passwords or actual tokens are logged. Tests use synthetic sessions and intercepted APIs. Trace may contain synthetic fixture session arguments; it must not be confused with a real account. Console JWT/Bearer patterns are redacted.

| Targeted run (no retries; assertions/timeouts unchanged) | Result |
|---|---|
| Exact original six × repeat2, one worker, Trace on | 12/12 PASS (2.8m) |
| Same six × repeat2, two workers, Trace on | 11 PASS /1 FAIL (2.3m) |
| Later failure identities: Schema1 cached info at320, R7 immutable Japan Today at390, large-font draft Attractions at430; repeat2, one worker | 6/6 PASS (1.3m) |
| Same later identities, repeat2, two workers | 4 PASS /2 FAIL (1.2m) |

Total36 targeted executions: **33 PASS /3 FAIL**, not an all-green gate. All three reproduced failures are the 37-Place case exhausting the unchanged30s whole-test budget, while Auth is signed-in and the trip result is loaded. Screenshot shows a functioning authored Place dialog, not Loading. The first reproduced failure cancels while closing `須坂・蔵の町並み`; the later430 failures likewise occur after initial load. Different stop points plus successful full loops in isolated runs support workload/budget sensitivity, not malformed Place data.

Across all36 traces, the trip reaches loaded, browser clock advances, and successful mocked trip/version API and native IndexedDB events are observed. The later probes additionally show completed DB transactions, not an observed blocked/open-abort stall. For the two failing430 runs, captured transition to loaded is about3.25s/4.02s after the first diagnostic sample, long before total-test expiry. These are observer delivery timings, not precise network-performance SLAs; tracing and polling add overhead.

**The three historical initial-Loading failures and the historical weather-wait failure were not reproduced. Their exact root cause remains unconfirmed.** Healthy reruns do not prove that AuthProvider/cache can never hang. Do not label CPU as the demonstrated cause of those historical failures or claim a product loading fix.

## Hypotheses checked

- AuthProvider and TripLayout deliberately share one Loading presentation. Safe current-tree sampling differentiates `initializing` from `signed-in` with no loaded result; both then transition normally in captured reruns. The reproduced timeout has Auth completed and loaded data.
- Installed SDK source was inspected rather than assuming old lock semantics. No live project query or client configuration change was made. No evidence of auth-refresh/mock credential rejection explains a captured failure.
- Supabase mocks are installed before navigation. Captured trip/version responses complete successfully. Cached Schema1 reload uses the existing persisted snapshot and remains readable in targeted reruns; original fixtures and cache contracts are not rewritten.
- **None of the exact six failed test bodies, nor the later immutable-Japan R7 failure, invokes `openToday`/`page.clock.pauseAt`.** Their traces have advancing browser clocks. Fake-clock pause is therefore not evidenced as the cause of these identities. Other Today tests do use paused clocks; they are outside this bounded reproduction.
- Code review confirms the15s TripLayout AbortController starts only after Auth initialization and cannot cancel a pending native IndexedDB promise. This is an architectural risk, **not a proven explanation** of the historical failures; no speculative abort/cache workaround was added.
- Console identifies a separate harness-side `sessionStorage` SecurityError in sandboxed LiveCam child frames: the page-wide auth init script also executes there. Those LiveCam cases pass and main-frame loading completes, so this is not evidence of the historical main-frame hang. Do not weaken iframe sandbox permissions to silence it.

## Smallest justified next changes (proposed, not implemented)

1. Split the37-Place monolithic test into bounded data-derived groups/atomic interaction tests while retaining every native-name/prose/fee/source assertion, all five widths/three fonts, and a separate strict auth/cache-reload invariant check. Do not merely increase timeout, remove Places or introduce retries. This addresses the **confirmed** test-budget issue; it is not a Trip Loading fix.
2. A top-frame-only guard on synthetic auth-seeding init scripts is a small test-harness cleanup for the observed sandbox error, with an opaque-frame regression check; it must not be presented as the loading root cause.
3. Keep opt-in stage evidence available for the three specific initial-load cases. A useful next failing trace must show the unfinished Auth/cache/network/commit stage and whether it later settles. Do not change AuthProvider/loadTrip/cache based only on a generic Loading screenshot. No further full3035 run until the final fix is ready; no unbounded retry/soak loop.

The source-count repair remains separate and unchanged; strict SHA/schema/navigation/history checks remain. TypeScript and diff checks pass. No full regression was run in this diagnosis unit, and no commit/push occurred. Full local/independent CI acceptance and the user’s28-item acceptance remain open.


## Bounded-group follow-up

Implemented only the confirmed test-design packet from [comment6176946167](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6176946167). Four data-derived groups cover all37 IDs once, in canonical order (10/10/10/7); all5 projects ×3 fonts remain. Every dialog assertion and Castle capture retained. Full cache equality is now checked across each group, with independent auth-token removal/reload/cache-source/equality checks per font/project. Packet7 repair and opt-in diagnostics remain unchanged; runtime/data/assets/packages/workflow untouched.

| Local run | Exact result |
|---|---|
| `npm run build` | PASS, including TypeScript; existing Zod comment/bundle-size warnings only |
| Three requested specs, all5 projects, one worker; diagnostics/Trace OFF | 179 PASS /1 FAIL, 8.8m |
| Exact failed group, width390/medium/group3, one worker; diagnostics/Trace ON | 1 PASS, 10.4s (body6.3s) |
| New groups/cache cases plus four original failure titles, width390/1440, two workers, deliberate repeat2; diagnostics/Trace ON | 73 PASS /3 FAIL, 8.5m |
| `git diff --check` | PASS |
| Full regression | NOT RUN: focused stability gate failed; discovery only =3,100 tests/48 files |

**Combined:257 executions,253 PASS/4 FAIL. No retries configured, no timeout increase or assertion removal. No commit/push/new CI.**

### Exact remaining failures and evidence

1. Uninstrumented focused run: `[width-390] japanContentDraft.spec.ts:132` — `unpublished content/native names group 3 (21–30) are readable at medium font without cache mutation`. Whole-test30s deadline cancels line140 `getByRole('button', { name: '詳細介紹：大王山葵農場', exact: true }).first().click()`. Post-failure accessibility snapshot includes the correct loaded trip, all37 Places and that button. This run has no Trace, so it does **not** establish why that locator/action failed to finish before the deadline. The exact traced rerun passes; that is not a root-cause fix.
2. Instrumented parallel run: `[width-1440] ... group 1 (1–10) ... large ...`. Whole-test30s deadline. Safe stage observer records signed-in/loaded at about1.93s after first diagnostic event, then loaded through28.89s. Browser-clock samples advance; API/IndexedDB operations complete. Trace shows repeated dialog interactions with several2–3.6s actions and reaches the ninth Place's close, not a pending Auth/trip-load promise. Inspected final screenshot shows loaded Attractions. Reported case42.5s includes expensive failure teardown/Trace capture; **the test budget remains30s**, not42.5s. Test workflow still exceeds the budget in this instrumented parallel run; instrumentation changes workload, so this is not proof of normal-CI behaviour or a product bug.
3. Instrumented parallel repeat1: `[width-1440] ... group 2 (11–20) ... small ...`. Line136 `.trip-heading h2` expected title fails after unchanged5s (Trace assertion5.61s). Observer sees initializing at6.13s, signed-in/loaded at7.84s relative to the first diagnostic event. Subsequent native DB operations finish and inspected teardown screenshot has the correct loaded trip. This is transient delayed readiness in the capture, **not an observed permanently unresolved initialization**.
4. Instrumented parallel repeat1: `[width-1440] ... group 3 (21–30) ... medium ...`. Same line136 title assertion5s (Trace5.34s). Observer sees signed-in without result at4.36/7.81s, then signed-in/loaded at9.74s and completed DB transactions. Again eventual load is evidenced; precise source of delayed delivery remains unproven.

Observer times are relative to first delivered diagnostic event, not navigation start or a performance SLA. Trace/observer overhead and the two-worker environment are present in this run; no causality claim is made without a controlled comparison. No speculative AuthProvider/loadTrip/IndexedDB/Weather modification was made. No further repeats or full-suite run were started after the bounded stress failure, per quota/stop instructions.

Raw evidence is local and ignored: `work/place-groups/{focused,reproduce,stress}.log`, corresponding exit files and `*-results/` Trace/screenshots; safe stage summaries extracted under failed stress folders. No raw traces/logs/session data added to source control. Existing candidate and published-fixture SHA256 remain unchanged. PR21 stays Draft; CI/28-item acceptance are not claimed.


## Lightweight stage measurement — 15/10/2026 (Hong Kong)

[Approved measurement packet](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6184045964). Preserved all existing uncommitted work. Added temporary opt-in `TRAVELPILOT_STAGE_TIMING=1` test-only timing; the heavier `TRAVELPILOT_LOADING_DIAGNOSTICS` and Playwright Trace were OFF. No repeats/retries/skips, no assertion or timeout changes. Three actual failed width1440 identities plus one existing large-font cache/reload control, to measure the requested reload path without adding work to the timed Place groups. All 37 Place assertions remain unchanged.

### Method and limitations

Node `performance.now()` wraps each awaited action; no browser polling, React/IndexedDB monkey-patching, credential values, response bodies, headers or storage values. A one-shot DOM MutationObserver records only whether heading/version nodes exist, disconnecting after both appear (fresh observer on reload). Endpoint method/path/count/status and browser page-error class are recorded; URLs/query/user IDs/tokens are not. Node event-loop delay and worker CPU measure the **test worker**, not browser app CPU. Browser endpoint response timings include scheduling/mock-delivery overhead and cannot identify SQL/backend latency: all endpoints are intercepted. No live account/project/provider reads or writes were added.

**Body total** starts after the page/parent fixture exists and includes the lightweight timer setup, test setup and all measured operations; **runner duration** additionally includes Playwright fixture/test lifecycle. Neither is browser-only rendering time. Readiness `heading.readiness` is the unchanged5s assertion, not an auth-state probe or a declared product SLA. DOM evidence proves heading and trip-versions became present; it does not measure each SDK internal phase. Observers can add some overhead; no numerical claim of zero overhead.

### Run accounting

| Run | Requested / actual workers | Result | Suite wall time |
|---|---|---|---|
| single | 1 / 1 | 4 PASS, 0 FAIL/skip/flaky | 20.65s |
| dual | 2 / 1 | 4 PASS, 0 FAIL/skip/flaky | 21.96s |
| parallel | 2 / 2 | 4 PASS, 0 FAIL/skip/flaky | 19.78s |

**Accounting correction:** `dual` was configured with2 workers but single-file default serialization used only1 (`actualWorkers:1`, all workerIndex0). It is retained/disclosed, not counted as parallel evidence. One corrected `parallel` execution used CLI `--fully-parallel --workers=2` and actually ran workerIndex0/1 with overlapping cases; no repository scheduling/configuration change. Valid comparison =8 executions,8 PASS; including the mistaken serial control =12 executions,12 PASS. No broad or full-suite run.

### Aggregate stage durations (milliseconds)

Navigation + heading below means initial navigation plus the first heading assertion only; dialog time excludes Castle screenshot (shown separately). Values rounded for display.

| Run | Case | Navigate + heading | Dialog open / validate / close sums | Castle capture | Cache read + strict equality | Body total | Runner duration |
|---|---|---:|---:|---:|---:|---:|---:|
| single | G2/small | 2120.0 | 789.3 / 650.6 / 1351.2 | 0.0 | 570.2 | 5732.3 | 6261.0 |
| single | G3/medium | 1145.9 | 715.7 / 420.3 / 912.4 | 0.0 | 358.6 | 3609.5 | 3921.0 |
| single | G1/large | 1223.6 | 662.8 / 295.7 / 693.5 | 142.6 | 289.6 | 3374.0 | 3627.0 |
| single | Reload/large | 1227.7 | 0.0 / 0.0 / 0.0 | 0.0 | 322.6 | 2889.2 | 3109.0 |
| parallel | G2/small | 3117.1 | 1597.4 / 1053.3 / 1644.5 | 0.0 | 1086.1 | 8764.6 | 9273.0 |
| parallel | G3/medium | 3237.1 | 1194.1 / 900.1 / 1537.6 | 0.0 | 1423.2 | 8584.8 | 9375.0 |
| parallel | G1/large | 2789.3 | 1052.6 / 464.7 / 919.4 | 232.2 | 465.6 | 6076.5 | 6486.0 |
| parallel | Reload/large | 2601.5 | 0.0 / 0.0 / 0.0 | 0.0 | 406.0 | 4111.1 | 4800.0 |

### Every non-Place stage (milliseconds)

| Run / case | Diagnostic setup | Font/auth/mock setup | Navigation | Heading (initial) | Cache before | Cache equality | Token removal | Reload navigation | Reload cache readiness | Heading after reload |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| single / G2/small | 97.5 | 133.0 | 611.0 | 1509.0 | 369.3 | 200.9 | 0.0 | 0.0 | 0.0 | — |
| single / G3/medium | 12.8 | 37.4 | 426.3 | 719.6 | 178.1 | 180.5 | 0.0 | 0.0 | 0.0 | — |
| single / G1/large | 15.1 | 45.2 | 423.5 | 800.0 | 195.7 | 93.8 | 0.0 | 0.0 | 0.0 | — |
| single / Reload/large | 19.2 | 23.2 | 396.2 | 831.5 | 179.9 | 142.7 | 7.9 | 332.9 | 394.4 | 549.9 |
| parallel / G2/small | 106.3 | 148.0 | 942.4 | 2174.7 | 534.6 | 551.5 | 0.0 | 0.0 | 0.0 | — |
| parallel / G3/medium | 106.8 | 153.4 | 1126.3 | 2110.8 | 856.1 | 567.0 | 0.0 | 0.0 | 0.0 | — |
| parallel / G1/large | 65.3 | 79.6 | 840.5 | 1948.8 | 339.0 | 126.5 | 0.0 | 0.0 | 0.0 | — |
| parallel / Reload/large | 34.9 | 59.7 | 953.0 | 1648.5 | 178.0 | 228.0 | 27.9 | 330.3 | 624.3 | 8.3 |

Reload control includes unchanged signed-out cache-source, exact title, full cache equality and overflow assertions. Its complete navigation+cache-readiness+post-reload-heading path =1,277.2ms single-worker /962.9ms parallel (individual rounded values above); no remote trip/version request is issued on that signed-out reload.

### Every Place: open / validate / close (milliseconds)

Exact fixture IDs identify the unchanged assertions, not runtime branches. Each row is one of the three failed groups in its original order. All other groups/fonts/widths still exist but were deliberately not executed in this bounded measurement.

| Case | Place ID | Single open | Single validate | Single close | Parallel open | Parallel validate | Parallel close |
|---|---|---:|---:|---:|---:|---:|---:|
| G1/large | jp27-place-matsumoto-castle | 136.1 | 38.3 | 62.6 | 178.3 | 92.4 | 124.6 |
| G1/large | jp27-place-matsumoto-projection | 51.8 | 29.2 | 73.7 | 257.2 | 22.1 | 204.0 |
| G1/large | jp27-place-karuizawa-outlet | 66.3 | 34.8 | 101.2 | 116.4 | 78.5 | 122.7 |
| G1/large | jp27-place-shiraito | 59.9 | 33.7 | 85.6 | 122.3 | 75.7 | 102.7 |
| G1/large | jp27-place-onioshidashi | 57.9 | 22.6 | 49.5 | 83.5 | 45.7 | 62.3 |
| G1/large | jp27-place-obuse | 47.9 | 20.4 | 60.1 | 64.9 | 20.1 | 50.9 |
| G1/large | jp27-place-hokusai | 64.6 | 28.9 | 97.3 | 64.0 | 29.2 | 84.0 |
| G1/large | jp27-place-oranche | 54.2 | 29.1 | 47.0 | 56.9 | 26.0 | 69.7 |
| G1/large | jp27-place-shibu-onsen | 49.7 | 28.9 | 67.9 | 57.6 | 51.6 | 54.5 |
| G1/large | jp27-place-ganshoin | 74.4 | 29.8 | 48.7 | 51.6 | 23.4 | 44.0 |
| G2/small | jp27-place-snow-monkey | 124.2 | 249.7 | 322.9 | 342.5 | 493.7 | 277.5 |
| G2/small | jp27-place-aeon-suzaka | 79.7 | 47.5 | 156.4 | 228.9 | 124.4 | 185.0 |
| G2/small | jp27-place-suzaka-kura | 162.1 | 41.0 | 53.1 | 184.2 | 66.3 | 133.2 |
| G2/small | jp27-place-hakuba-iwatake | 57.5 | 27.8 | 110.0 | 102.5 | 60.4 | 151.7 |
| G2/small | jp27-place-hida-no-sato | 62.1 | 34.0 | 65.1 | 67.4 | 53.0 | 106.9 |
| G2/small | jp27-place-yatai-kaikan | 48.1 | 39.6 | 43.4 | 118.4 | 74.6 | 90.5 |
| G2/small | jp27-place-shirakawago | 57.3 | 142.9 | 420.7 | 178.6 | 63.0 | 435.4 |
| G2/small | jp27-place-wada-house | 104.5 | 22.9 | 54.9 | 192.4 | 28.4 | 88.3 |
| G2/small | jp27-place-ogimachi-view | 48.7 | 23.4 | 59.9 | 108.9 | 42.3 | 100.4 |
| G2/small | jp27-place-shinhotaka | 45.2 | 21.8 | 64.7 | 73.7 | 47.2 | 75.5 |
| G3/medium | jp27-place-hirayu-no-mori | 88.4 | 39.1 | 69.5 | 170.9 | 142.3 | 195.9 |
| G3/medium | jp27-place-bear-park | 52.7 | 31.6 | 99.5 | 103.8 | 54.8 | 86.2 |
| G3/medium | jp27-place-miyagawa | 70.0 | 66.3 | 177.0 | 150.2 | 98.0 | 211.9 |
| G3/medium | jp27-place-takayama-jinya | 59.9 | 24.7 | 70.7 | 109.7 | 46.3 | 92.3 |
| G3/medium | jp27-place-sanmachi | 53.1 | 42.9 | 92.0 | 97.0 | 63.7 | 185.8 |
| G3/medium | jp27-place-hida-cave | 113.3 | 30.5 | 48.7 | 118.3 | 96.7 | 192.4 |
| G3/medium | jp27-place-hida-furukawa | 72.5 | 55.9 | 91.2 | 98.7 | 107.7 | 199.0 |
| G3/medium | jp27-place-santera | 64.6 | 18.8 | 56.2 | 114.8 | 43.6 | 84.0 |
| G3/medium | jp27-place-daio-wasabi | 85.7 | 24.6 | 123.8 | 111.5 | 128.7 | 215.8 |
| G3/medium | jp27-place-aeon-matsumoto | 55.5 | 86.1 | 83.8 | 119.1 | 118.2 | 74.4 |

### Mock boundary / readiness / worker observations

| Run / case | Trip / version / checklist GET counts | Trip / version response delay | First heading+version seen (body elapsed) | Worker loop p95 / max | Page errors |
|---|---|---|---:|---:|---|
| single / G2/small | 1 / 1 / 1 | 7.7ms / 13.8ms | 2170.1ms | 39.1 / 149.9ms | 0 |
| single / G3/medium | 1 / 1 / 1 | 11.1ms / 37.4ms | 1089.9ms | 35.5 / 75.6ms | 0 |
| single / G1/large | 1 / 1 / 1 | 114.5ms / 67.5ms | 1154.4ms | 34.3 / 82.8ms | 0 |
| single / Reload/large | 1 / 1 / 0 | 8.5ms / 16.0ms | 1149.7ms | 44.2 / 341.6ms | 0 |
| parallel / G2/small | 1 / 1 / 2 | 15.7ms / 98.2ms | 2992.6ms | 52.4 / 140.5ms | 0 |
| parallel / G3/medium | 1 / 1 / 1 | 224.1ms / 35.6ms | 3182.5ms | 51.6 / 305.4ms | 0 |
| parallel / G1/large | 1 / 1 / 2 | 29.6ms / 41.9ms | 2566.3ms | 46.7 / 94.1ms | 0 |
| parallel / Reload/large | 1 / 1 / 0 | 101.3ms / 61.7ms | 2219.0ms | 56.4 / 75.6ms | 0 |

All observed REST responses were200. Each test performs exactly one mocked trip lookup and one current-version lookup. Checklist read count can be2 under existing background sync; it is not another trip/version request and no application behaviour was changed. No captured auth-refresh API or browser page-error. No late-readiness failure captured: heading/version were already present before each successful readiness assertion completed.

Across the30 parallel Place interactions: nearest-rank sample p95=676.9ms and maximum=1113.7ms (open+validation+close, screenshot excluded). This small successful sample is **not** a failure-tail estimate or a justified new timeout budget.

### Decision / gate

**The timeout did not reproduce.** The previously failing ten-Place workflows do not inherently require30s in this measurement: all three parallel bodies finish in6.08–8.76s, runner max9.375s; actual dialog work totals2.44–4.30s/group. Two original heading checks complete in2.11–2.18s in parallel. Mock trip/version response delays are16–224ms across the parallel sample; cache read/equality are measured above. These captures do not expose a stuck API/cache promise or isolate a product startup defect.

Two-worker execution is slower than single-worker for many operations, but this is not proof that saturation caused the old failures. The earlier stress used heavier Trace/React/IDB diagnostics and repeated cases; the new run differs in load/instrumentation/time. No controlled same-load A/B evidence establishes those as the root cause. No unsupported regression fix, re-splitting or timeout increase is justified from these successful samples. The old unexplained failures remain open.

**Full regression NOT RUN:** no evidence-based repair was identified in this measurement task. One small successful sample per worker setting does not certify prior intermittent failures fixed. No commit/push/new CI; PR remains Draft. Typecheck and diff checks PASS. Profiling is temporary/opt-in and must be removed or separately justified before a final push; old requested diagnostic helper remains preserved. Raw JSON/attachments stay ignored in `work/stage-timing/`, not in source control. Production, Supabase, trip candidates/published fixtures, canonical timing/assets, App Version and Step15D remain unchanged.


## One guarded full regression — 15/10/2026 (Hong Kong)

Followed [GPT-6 High's one-run decision](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6184231207). Reviewed full test diff:37 Places/three fonts/five projects, native-name/prose/Snow Monkey/capture assertions, per-group cache equality and independent auth/cache reload remain. Exact SHA/schema/historical packet assertions retained; Packet9→8→7 source delta is fixture-derived. No code changes since last successful build, so no repeated build/focused run. Both diagnostic environment variables explicitly removed; no React/IDB observer/profiling enabled. Source/test/protected-file hashes captured before run and all232 remain identical after run.

Executed **once**, adding only line+JSON reporting and local Chromium selection to the approved command:

```sh
npm test -- --workers=2 --max-failures=1 --retries=0 --trace=retain-on-failure
```

JSON metadata confirms **actualWorkers2**. Result: **101 PASS,1 FAIL,1 interrupted,2,997 not run /3,100 collected**, exit1; total235.392s (3m55.39s). Playwright's aggregated `skipped:2998` includes the interrupted case: it is not2,998 unstarted plus another interrupted. No user-added skip/retry. Runner-level message `Testing stopped early after 1 maximum allowed failures` is the stop signal, not an additional product failure. Run started12:13:49 Hong Kong and ended about12:17:45. No second full run.

### First failure

`[width-320] tests/foundation.spec.ts:108:1 — all font sizes scale the global UI, persist and fit every route`

- Whole-test deadline:30,000ms; reported test duration32,538ms includes failure teardown.
- Error: `locator.evaluate: Test timeout of 30000ms exceeded`, waiting for `locator('nav a').nth(1)` at line133, the `el.closest('.trip-navigation')` membership check.
- This file was **not modified**. Test still in the first/small-font iteration, traversing the demo routes; medium/large were not reached. It is not the newly split Japan37-Place test.
- Other in-flight test `[width-320] checklistSync.spec.ts:248 — two independent browser devices converge through deterministic remote state on focus` was interrupted by max-failures, not independently failed.

### Retained Trace observations (no rerun)

Browser trace records:

| Operation | Duration |
|---|---:|
| Initial Settings navigation |1,059ms|
| Select `小` radio |12,095ms|
| Settings reload |3,508ms|
| Home / Settings / Itinerary / Info / Attractions hash navigations |102 /14 /13 /59 /26ms|

The slow radio action logs first waiting for the selector, resolving about5.59s after action start, then completing visibility/stability/scroll/click checks and waiting for scheduled navigations. It records **no retry loop of overlay interception or unstable element**; the entire browser action takes12.10s. This is where a substantial part of the30s was consumed, not proof of why those deliveries were slow. The settings reload uses3.51s. Do not attribute those times to CPU, network or Auth without further evidence.

Node test trace starts Before Hooks at201680.990ms; After Hooks starts231707ms, about30.03s later. Error reporting/context teardown overlaps the remaining cancelled async test flow. The final navigation-locator evaluation starts234179ms and returns/cancels about61ms later; **it did not independently wait30s for that link**. Naming that last operation in the error does not demonstrate a broken navigation element. The report's32.538s is not a new timeout allowance.

### Trip/weather state and network evidence

- Error-context accessibility snapshot shows the correct **城市週末示範旅程**, Today Mode preview, selectedD1, current/previous/next presentation and navigation links. This is a **loaded trip**, not the generic Trip Loading state.
- Snapshot says **天氣資料已更新**, includes18°C current sample, suitability data/attribution and future-five-day cards. Weather is **not pending** in this snapshot.
- Last retained screencast frame, inspected, is the prior Attractions page with the loaded demo metadata/status, about3s before final error; it must not be mislabeled as a screenshot of the later Today error-context snapshot.
- Recorded mocked requests: `v2_app_versions` GET200×3,86/217/10ms; Open-Meteo forecast GET200×1,17ms. These are trace request-to-response/resource timings, not real backend SLAs. No real remote trip/version request is required for local demo; no auth API recorded. No console/page-error events captured in this retained context stream. Absence of events does not prove no unrecorded browser issue.
- Heavy opt-in diagnostics remained OFF throughout. Trace retention itself may add overhead; this capture is not a controlled Trace-on/off comparison. No product/root-cause claim or speculative fix made.

### Evidence and stop gate

Raw evidence, all ignored/local only:

- `work/guarded-regression/report.json`, `full.log`, `full.exit`, `environment.json`, `before-hashes.json`
- Original `test-results/foundation-all-font-sizes--d8f71-persist-and-fit-every-route-width-320/trace.zip` and `error-context.md`
- Short preserved copy `work/guarded-regression/first-failure-trace.zip` (SHA256: **c590c61f94eeb801ad62dd23f6d6c9140dffe297450de514e749ba565150feba**)
- Extracted last pre-error screencast `work/guarded-regression/failure-last-frame.jpg`

**STOP: no commit/push/new GitHub CI, no test/runtime edits or further test execution after failure.** Existing uncommitted work and DraftPR21 preserved at8d46bd1df3c9691d123d015da175a7ce7d5b3fb8. Only development/diagnosis docs updated in this unit; final diff check PASS. Production, Supabase, unpublished/published trip data, protected assets, packages, workflow and Step15D unchanged. Evidence is for GPT-6 High triage; all-green/28-item acceptance is not claimed.


## Foundation bounded refactor — 15/10/2026 (Hong Kong)

[Approved code review/plan](https://github.com/yfgary/travelpilot-poc/pull/21#issuecomment-6184370162). All earlier uncommitted source-count,37-Place groups, opt-in diagnostics and QA history preserved. Only test implementation changed this unit: `tests/foundation.spec.ts`; no runtime, data, schema, package, asset or workflow changes.

### Retained Radio Trace: what12.095s contains

Read the existing `work/guarded-regression/first-failure-trace.zip`, without rerunning the old case. Browser action `check()` starts204089.456ms and ends216184.152ms; total12,094.696ms. Settings `goto` is a **separate**1,058.713ms action. Relevant log timestamps on the same browser trace clock:

| Event | Trace timestamp (ms) |
|---|---:|
| Check starts |204089.456|
| Waiting for radio locator |204366.582|
| Radio locator resolved |209679.528|
| Attempting click / waiting visible, enabled, stable |210278.416 /210278.472|
| Element ready |210310.025|
| Scroll starts / done |210310.037 /210386.295|
| Performing click / click done |210517.942 /210894.162|
| Scheduled navigation wait / finished |210894.336 /212580.816|
| Check action returns |216184.152|

Locator resolution is about5.590s after action start; logged click execution is0.376s, subsequent scheduled-navigation wait1.686s, and the interval from navigation-finished log to action return3.603s. Remaining time includes log delivery/actionability/scroll/scheduling intervals; these are trace intervals, **not proof that any specific application callback used that CPU time**. No overlay-interception or stability-retry loop recorded. Node's next checked-state assertion completes in27.247ms, html-attribute assertion407.277ms; Reload is another separate3,507.795ms browser action. Thus an isolated12s radio click/change is **not established**. Delayed readiness/automation delivery remains a distinct unconfirmed concern, not dismissed as normal or attributed to CPU/Auth. No product performance fix made.

### Test decomposition and exact coverage

Replaced one3-font×6-route workflow with:

- Three independent UI selection/persistence/reload tests. Each first selects a different font, then the target, preventing the default-medium case from passing without an actual transition. All original checked/html-state assertions retained, with html-state also checked after reload.
- One bounded real-radio CSS comparison for body, h1, brand and app-status, retaining both strict monotonic comparisons for all four elements.
- Nine independent layout/navigation tests:3 fonts×3 data-derived batches of2 original routes. Each starts with its own persisted-font seed; UI and reload behaviour is covered independently above. **All18 font/route combinations×5 viewports =90 combinations** retained. Original document/main overflow, content/status-dock separation, every nav link44px hit-target bounds/scrollable-tab exception, bottom-scroll actionable-control clearance and visible status assertions copied unchanged. Added expected h1 readiness before measurements, so trip layout cannot pass against the shared Loading shell.
- One coverage invariant pins18 distinct ordered font/route pairs. All other Foundation tests untouched. The old single test becomes14 bounded cases/project, increasing full collection3,100→**3,165**, not reducing coverage.

### Local checks

Build PASS (includes TypeScript). Final test-only enhancement forcing a real preference transition was separately typechecked PASS before Focused. Diff check PASS. Foundation Focused all5 viewport projects, actualWorkers2, retries0, trace retain-on-failure: **165/165 PASS,0 skipped/flaky/fail,429.138s (7m09.14s)**. Maximum whole case13.098s (unchanged manifest/assets test); maximum new layout batch9.783s. No extra focused repeat.

Then executed **one** full guarded regression:

```sh
npm test -- --workers=2 --max-failures=1 --retries=0 --trace=retain-on-failure
```

Both opt-in diagnostic env vars removed. Only reporting/output path/local Chromium supplied outside the command. JSON metadata actualWorkers2. **116 PASS /1 FAIL /1 interrupted /3,047 not run =3,165 collected**, exit1,263.709s (4m23.71s). Automatic first-failure stop. No further build/test run, code fix, commit or push after failure.

### New first failure, unchanged Checklist test

`[width-320] tests/checklistSync.spec.ts:311 — bounded canonical-item reads handle large definitions without server-limit truncation`

- Fixture has205 checklist items; failure occurs **before** the205 count/last checked item/two bounded pull assertions are reached.
- At `checklistFixtures.ts:93`, called from test line315, `expect(page.getByTestId('trip-source')).toContainText('remote')` fails: element not found, unchanged5s assertion. Browser Trace assertion5.207s; Node wrapper7.305s; reported whole-case12.650s includes setup/teardown. This is not a30s whole-test failure.
- Error-context snapshot shows shared **正在載入旅程**, no trip-source yet. Without active Auth/IDB probes this generic shell does not distinguish initialization, validation, cache or rendering; no unsupported stage/root-cause claim.
- Mock `v2_trips` GET200,94ms; `v2_trip_versions` GET200,35ms, both completed before assertion failure. No recorded auth API. Captured context has no console/page-error event. These are mocked boundary observations, not live backend evidence or proof of a healthy complete loader.
- Later retained screencast frame, inspected, shows **清單城市測試旅程 /旅程資料**. Therefore the capture evidences eventual rendering, not a proven permanently unresolved load. No new wait/retry was inserted to make it pass.
- Forecast and checklist GET appear later during failure cleanup, recorded status/time `-1` (cancelled/incomplete), not an established provider/server error. No updated forecast was confirmed at the failed assertion; do not describe weather as ready or treat those cancellations as the first failure.
- The other worker's `[width-320] foundation.spec.ts:155 — medium font layout/navigation batch2: #/trip/demo-trip/itinerary, #/trip/demo-trip/info` is **interrupted** by the global stop at17.408s, not independently failed or completed. Focused Foundation green does not certify full-suite stability.

### Evidence / stop

Ignored raw evidence: `work/foundation-split/{focused,full}.json`, corresponding logs/exit files, `full-results/checklistSync-bounded-cano-25cac-out-server-limit-truncation-width-320/{trace.zip,error-context.md}`. Short copy `work/foundation-split/first-failure-trace.zip`, SHA256 **e27f382755bd1103cb5de9305c5a80728e208b62f6bb26c71a0bae8f85735a8a**; later screencast `work/foundation-split/checklist-failure-last-frame.jpg`. No raw trace/session information staged or committed. All232 source/test/protected hashes match the pre-full snapshot. Published/unpublished Japan hashes remain unchanged.

**FAIL / STOP: PR21 still Draft at8d46bd1; no Commit/Push/new CI, no further rerun.** Only Foundation test and development docs changed this unit. Existing local work intact; App Version45 unchanged for test-only draft QA. No Production/Supabase/published data/protected assets/timing/merge/deploy/Step15D changes. First-failure evidence awaits GPT-6 High review; no speculation-driven Checklist/Auth/cache/weather modification.
