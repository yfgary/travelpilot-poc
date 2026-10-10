# R8/8 — Final acceptance and unresolved data gates

Review: **11/10/2026 (Asia/Hong_Kong)**, Issue [#18](https://github.com/yfgary/travelpilot-poc/issues/18). POC branch `qa/pre15d-r8-final-regression`, based exactly on R7 merge **ef356cb75c597706321525c722995e4bd624ca26**. Candidate App Version **v2.0.0-poc.43**. Draft review only; no R8 merge/deployment.

**Acceptance outcome: 19 PASS / 8 PARTIAL / 1 BLOCKED / 0 unresolved generic UI FAIL.** This is not “all 28 passed” or complete Japan parity. PASS describes verified POC functionality/presentation, not real-provider availability, physical Safari certification or approval to publish content. PARTIAL means the generic renderer works but the authentic Japan data is incomplete. BLOCKED means actual provider/content verification cannot be established here.

## Baseline and strict boundaries

R7 main [run 38088143574](https://github.com/yfgary/travelpilot-poc/actions/runs/38088143574): **2,715 PASS (11.2m)**, build job **114318877866** and Pages job **114321120443** successful **before any R8 tracked code edit**. While this gate was pending, only read-only baseline/browser QA and ignored scratch evidence were prepared. R7 main's Git tree exactly matches the already-tested R7 implementation tree; existing research was reused rather than repeated.

Schema **6**, supported readers **1–6**; demos **demo.city.5 / demo.road.5**. Published Japan remains **jp2027.1 / Schema5**, UUID **349442d2-7bf3-426b-9f57-163e2272e909**, archive SHA-256 **09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e**. D6 village / D7 summit / D8 cave → Matsumoto, all D1–D9 facts and exact endpoints are unchanged. No Production, Supabase, SQL, Trip Data, protected assets, caches or auth changes. Production remains **8b5129b381d6ace94030b51c7b8de5c4e3d5f533**.

## Original 28-item acceptance matrix

Implementation references: R1 [#8](https://github.com/yfgary/travelpilot-poc/pull/8) / repair [#10](https://github.com/yfgary/travelpilot-poc/pull/10), final **1474036**; R2 [#9](https://github.com/yfgary/travelpilot-poc/pull/9), **d20b341**; R3 [#11](https://github.com/yfgary/travelpilot-poc/pull/11), **5df7fcc**; R4 [#12](https://github.com/yfgary/travelpilot-poc/pull/12), **1914295**; R5 [#13](https://github.com/yfgary/travelpilot-poc/pull/13), **5f24bb6**; R6 [#15](https://github.com/yfgary/travelpilot-poc/pull/15), **718b19d**; R7 [#17](https://github.com/yfgary/travelpilot-poc/pull/17), **ef356cb**. R8 adds only the bounded generic category-label fix described below.

Screenshot notation: **M** = the seven-page × five-width × three-font contact sheets below; **D** = narrow rich dialog; **O** = offline status; **H** = actual accommodation-type diagnosis and corrected cards. Test results are separated from substantive content status. Every PASS retains the source truth and provenance limitations stated in this report.

| ID | Original requirement | Status | Implementation | Test / screenshot evidence and result | Remaining defect / acceptance condition |
| --- | --- | --- | --- | --- | --- |
| 1 | Clear Back-to-Top | PASS | R1 / 1474036 | `sharedShellQA`: actual main scroll/reset; M | No observed generic defect; scrolls the main pane, not window. |
| 2 | Compact weather / aligned five-day metrics | PASS | R2 / d20b341 | `r2WeatherVisual`, weather suites; M; five cards, ten aligned metric rows | Controlled forecast samples prove layout; not actual January 2027 forecasts. |
| 3 | Move low-value trip technical metadata from header | PASS | R1 / 1474036 | `sharedShellQA`, Japan integration; M | Small footer keeps independent Data/Schema/Source metadata. |
| 4 | Sticky shared trip tabs | PASS | R1 / 1474036 | Real main scrolling in `sharedShellQA`; M | Sideways tab scrolling is intentional on narrow screens. |
| 5 | Recognisable shared page icons | PASS | R1 / 1474036 | `sharedShellQA` SVG assertions; M | Accessible text names remain; icons are not the only label. |
| 6 | Desktop weather uses available width | PASS | R2 / d20b341 | `r2WeatherVisual`; M; measured zero desktop forecast overflow in all fonts | Five columns on desktop; mobile forecast intentionally scrolls. |
| 7 | Day number plus main location/title | PASS | R3 / 5df7fcc | Itinerary day-jump tests, immutable Japan D1–D9; M | Labels use canonical day.title, not a separate destination map. |
| 8 | Explain unavailable future-date forecast | PASS | R2 / d20b341 | `todayVisual`, weather horizon/simulation tests; M | Explicit POC simulation labels; real-provider and real future weather are not claimed. |
| 9 | Actionable Today highlights / flight buffers | PARTIAL | R7 / ef356cb | `r7FidelityQA`: exact authored airport/transfer descriptions visible; M | Highlights still bare UO680/transfer/first night. Future reviewed copy, terminal verification required. |
| 10 | Aligned one-large/two-small day gallery, graceful two | PASS | R3 / 5df7fcc | Itinerary 1/2/3 gallery geometry and broken-image tests; M | Layout passes; semantic photo correctness remains issue 22. |
| 11 | Inline Maps next to item/place names | PASS | R3 / 5df7fcc | Itinerary Maps safety/attributes, Info/Today links; M | Opens authored safe map target; no inferred identity/route. |
| 12 | Compact full-information Today accommodation | PASS | R3 / 5df7fcc | Itinerary accommodation facts/geometry; M, H | Booking, money, meals and source notes retained. |
| 13 | Restore/investigate missing D1 Nawate Bonus | PARTIAL | R7 audit / ef356cb | R7 exact matrix/earliest archive history; Japan fixture and M unchanged | Already absent in supplied jp2027.1; V1 has both Nawate backup and projection. User must choose backup/alternative/replacement; no invented time. |
| 14 | Chinese Projection Mapping title | PARTIAL | R7 proposal / ef356cb | Exact V1/V2 name/source comparison; M shows current authored English | Source Chinese wording proposed, but not published. Seasonal operation/original local name still need verification. |
| 15 | Native/local name below every relevant entity | PARTIAL | R4 / 1914295 | `schema6LocalName`: optional sourced names and strict old readers PASS | Published Japan Schema5 has no authored localName. No generated translations; needs sourced future content/version. |
| 16 | Coloured suitability/rating score bands | PASS | R2 / d20b341 | `r2WeatherVisual`, scoring/presentation tests; M | Colours do not alter scoring or imply operator/open-road status. |
| 17 | Compact itinerary Place cards | PASS | R3 / 5df7fcc | Itinerary facts/density/optional-field tests; M, D | Supplied facts readable; missing prose is issue 23. |
| 18 | Transport records show prices | PARTIAL | R4 / 1914295 | `r4ItineraryMetadata`, Info price tests PASS; M | Only 1/7 canonical Japan transport records has price. Other six honestly show unprovided cost; verified fares/booking amounts still needed. |
| 19 | Chinese known accommodation type labels | PASS | R4 + R8 generic alias fix | `r8FinalQA`: exact type facts in both views, all fonts/widths and unchanged cache; H | R8 fixes missing onsen hotel/apartment hotel codes. Unknown/custom authored values remain unchanged, not mistranslated. |
| 20 | Driving SA/PA/rest narratives | PARTIAL | R7 audit / ef356cb | R7 ten-rule/source matrix; generic authored-description tests PASS; M | Per-leg SA/PA content absent; verify highway route/direction, winter hours and buffers before authoring. |
| 21 | Compact checklist / overall density | PASS | R1 / 1474036 | `sharedShellQA` 44px rows, checklist suites; M | Local-first sync uses mocked boundaries; no real checklist mutation. |
| 22 | Daytime castle image on daytime entry | PARTIAL | R7 image audit / ef356cb | Protected bytes/source mapping and actual pixels; M visibly preserves night image | Existing image is night projection. Need separately rights-verified daytime asset and selective mapping; never overwrite protected file. |
| 23 | Detailed multiparagraph attraction content | PARTIAL | R5 + R7 / 5f24bb6, ef356cb | `r5AttractionsQA` and R7 full paragraph/XSS/focus tests; D | Renderer preserves full supplied prose, but 36-Place Japan matrix shows insufficient authored depth. Historical/seasonal/notice claims need review. |
| 24 | Sticky Attraction day and location selectors | PASS | R5 / 5f24bb6 | `r5AttractionsQA` real wheel + coordinates; M, measured 0.22–0.92px below trip tabs | Correct actual main scrollport and dual sticky layers at every font/width. |
| 25 | V1-equivalent Live Cam coverage/playback | BLOCKED | R6 / 718b19d | Controlled CSP/XFO/frame/image/retry/offline tests PASS; M; R6 source audit | Japan has 5 external-only records vs 44 distinct unverified V1 resources. Nine probes tunnel-blocked; no real playback/availability certification or publication-ready enrichment. |
| 26 | Clear, compact Today navigation targets | PASS | R2 / d20b341 | `r2WeatherVisual`, Today manual/auto/parking tests; M | One primary target with supplementary parking/entrance; truthful preview/current labels. |
| 27 | Today weather | PASS | R2 / d20b341 | `todayVisual`, current/preview/offline/error weather tests; M | Shared weather pipeline; explicit simulated POC out-of-horizon view, no false 2027 forecast. |
| 28 | Green ONLINE / red OFFLINE | PASS | R1 / 1474036 | `sharedShellQA` exact colours; real browser offline transition; O, M | navigator.onLine describes device connectivity, not backend reachability. |

## Bounded R8 code correction

Complexity **Simple**. On unmodified poc.42, actual Chromium Info cards expose `onsen hotel` and `apartment hotel` under 類型. DOM text and screenshots confirm this is not missing authored native names: the shared known-code dictionary omits these two generic compound categories. Add space/hyphen aliases for **溫泉酒店 / 公寓式酒店** in `src/data/itinerary.ts`. Existing case/whitespace normalization and unknown-code fallback are preserved. No destination branch, schema field, authored name, data translation, URL, image or runtime layout change.

New `r8FinalQA` proves exact labels in Info and Detailed Itinerary for the unchanged Japan fixture at all widths/fonts, physical Schema1/6 generic remote/cache behavior and unchanged stored payloads. Version becomes poc.43 in canonical package/lock; R7's release expectation advances consistently. All old source/asset fingerprints remain enforced and untouched.

## Responsive and browser evidence

Baseline poc.42: **105/105 page/width/font diagnostic scenarios**, seven pages at all 15 combinations, with top/content screenshots, 15 rich dialogs and 15 offline captures (**240 PNGs**). Recorded page errors **0**, body/main overflow **0**, status-dock overlap **0**, desktop forecast overflow **0**. All 15 Attraction sticky deltas measured **0.22–0.92px** below shared tabs. Font selection/reload and red/green connectivity transitions were exercised. A focus-only offscreen skip-to-content button is not a visible touch control; visible shared controls retain 44px targets. Nothing was cropped or hidden to manufacture a fit.

Contact sheets were inspected for each width, with rows Home / Itinerary / Info / Attractions / Live Cam / Today / Settings and columns Small / Medium / Large. Detail inspection supplements overviews; baseline UI is unchanged except the subsequent bounded type-label correction.

| Width | Small | Medium | Large | Seven-page contact sheet |
| --- | --- | --- | --- | --- |
| 320 | PASS | PASS | PASS | [320](qa/r8/pages-320-all-fonts.jpg) |
| 390 | PASS | PASS | PASS | [390](qa/r8/pages-390-all-fonts.jpg) |
| 430 | PASS | PASS | PASS | [430](qa/r8/pages-430-all-fonts.jpg) |
| 1024 | PASS | PASS | PASS | [1024](qa/r8/pages-1024-all-fonts.jpg) |
| 1440 | PASS | PASS | PASS | [1440](qa/r8/pages-1440-all-fonts.jpg) |

Detailed evidence: [320 Large rich dialog](qa/r8/320-large-attractions-dialog.png), [320 Large OFFLINE](qa/r8/320-large-offline.png), [apartment type before](qa/r8/hotel-apartment-hotel-before.png), [onsen type before](qa/r8/hotel-onsen-hotel-before.png). Post-fix [320 Large](qa/r8/hotel-labels-320-large-after.png) and [1440 Medium](qa/r8/hotel-labels-1440-medium-after.png) lodging screenshots were inspected at original resolution: Chinese type text, wrapping, shared sticky controls and status clearance remain readable.

All provider data is controlled/intercepted. Current-date five-day samples exercise POC simulation/forecast presentation, not live weather. Camera fixtures demonstrate browser mechanics, not real playback; no real source/proxy request was retried. R7's already-inspected pinned V1 browser/source evidence and R6 inventory were reused. Full cold-start app/image offline caching remains Step16; readable cached snapshot tests do not certify a service worker. Chromium viewports are not physical iOS Safari tests.

## Commands and results

- Baseline focused: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test -- tests/foundation.spec.ts tests/sharedShellQA.spec.ts tests/r2WeatherVisual.spec.ts tests/r5AttractionsQA.spec.ts tests/r6LiveCamQA.spec.ts tests/schema6LocalName.spec.ts tests/r7FidelityQA.spec.ts --workers=4`: **316 PASS / 4 timeout failures (7.1m)**. The long 21-route font test exceeded its original 30s limit while a separate screenshot browser also occupied the three-CPU environment. No overflow assertion failed. After screenshot capture completed, the exact unchanged font cases ran alone with `--workers=1 -g 'all font sizes scale'`: **5/5 PASS (33.5s total)**. No tolerance or timeout was increased, no test was skipped.
- `node work/r8-visual.mjs`: **105/105 PASS**, screenshot/DOM metrics as above. Script is ignored QA scratch, never runtime code.
- After the R7 CI/Pages gate: `npm ci --cache work/npm-cache`: **PASS, 91 packages**; dependencies unchanged.
- Patch-focused: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test -- tests/r8FinalQA.spec.ts tests/r4ItineraryMetadata.spec.ts tests/todayArchitecture.spec.ts --workers=2`: **60/60 PASS (1.1m)**.
- `npm run build`: **PASS**, strict application/tool/test TypeScript and Vite. Existing nonfatal bundle/Zod notices remain.
- The first four-worker complete-suite attempt reproduced the same unchanged 30s font-case timeout without a parallel screenshot browser: **198 passed / 1 timeout failure / 4 interrupted / 2,542 not run (3.1m)**, exit 130 after deliberate early interruption. It was stopped to avoid wasting a full run on known CPU contention. No assertions/deadlines were relaxed and no application fix was inferred from a runner timeout.
- Complete final local: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test -- --workers=2`: **2,745/2,745 PASS (36.9m), exit 0**, no failures, skips or retries. All **2,715** existing cases plus **30** new cases retained (**2,745 total**). Two workers match the previously successful local full-run resource setting.
- Final `git diff --check` **PASS**. Exact Japan SHA-256 and unchanged protected/source-data paths verified against R7; Production local checkout clean and remote main still **8b5129b381d6ace94030b51c7b8de5c4e3d5f533**. No Supabase operation/write. PR QA is a separate Draft review gate, with its result recorded in the PR description; no merge/deploy.

Cross-trip and reader evidence remains in the complete suites: `multiTrip`, `home`, `homeRemote`, `loader`, `navigation`, `schema`, `schema6LocalName`, `operationalTiming`, `timelineTiming`, `tripInformation`, `weather`, `today`, `liveCam`, auth/checklist and immutable-source audits. Japan source bytes are used through intercepted remote reads only; city has no Live Cam capability, road has it. Cache/auth/Back account/trip isolation is not replaced with synthetic “all fine” assertions.

## Separate authoring/publication decisions — still required

Use [R7 exact field matrix](V2_R7_JAPAN_CONTENT_MATRIX.json), [R7 proposals](V2_R7_JAPAN_FIDELITY_AUDIT.md) and [R6 source inventory](V2_R6_LIVE_CAM_AUDIT.md). No new data version is reserved, activated or published by R8.

1. Should Nawate be a separate D1 backup/alternative while retaining Projection, or replace it? Do not add a mandatory extra night stop; timing/opening claims require verification.
2. Approve a future sourced authoring pass for operational highlight copy, Chinese presentation/local names and substantial introduction/why/history/local significance/takeaway/notices. Confirm seasonal operation and terminal details, and reconcile the existing D2 pickup timeline versus transport metadata only through reviewed data.
3. Approve/verify a distinct daytime castle photo with rights/attribution and selective D2/Place mapping; retain the night source for D1/projection and every protected byte.
4. Verify actual per-leg highway routes, directions and winter roadside availability before SA/PA prose; source the six missing transport prices without inventing costs. Preserve canonical timings, meal/check-in buffers and fixed D6–D8.
5. Verify each additional camera from a permitted real browser/origin and approve a new immutable Japan version before enrichment/publication. JMA live-provider/CORS limitations remain separately unverified; no proxy/bypass is authorized.

**R8 review is not authorization to publish Trip Data or begin Step15D.** Overall Japan fidelity remains PARTIAL/BLOCKED, even when automated QA is green. Fresh explicit user approval is required after the eight-round review and verified content decisions. Draft PR only; no merge/deploy.
