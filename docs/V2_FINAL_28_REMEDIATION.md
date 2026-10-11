# Final 28-item remediation — Issue #22

Review date: **11/10/2026 (Asia/Hong_Kong)**. Existing Draft PR **#21**, branch `content/jp2027-vnext-unpublished-draft`, starting commit `ec26784ef7b3341d867533a7bf1850a3c59b2bb2`. Implementation candidate **v2.0.0-poc.44**. No merge/deployment/publication.

**All 28 items reopened. This is local Chromium evidence, not user acceptance or 28/28 completion.** Local presentation assessment: 19 PASS / 7 PARTIAL / 2 BLOCKED. Every item still requires the separately authorized published-POC/user acceptance gate. Earlier R8 PASS labels were not treated as accepted. Physical Safari/iPhone is untested.

## Actual browser diagnosis and bounded repair

Baseline poc.43's Today Mode `TodayWeather` renders current/selected-day metrics and one score, but never renders the five-day forecast. Screenshot diagnosis reproduced item #27 despite earlier passing tests: those tests checked single-day metrics, not five cards. **Issue #22 #27: FAIL before → local PASS after.**

Extract the unchanged five-day WeatherPanel presentation into `WeatherForecast`, and the existing metric/condition formatting into `weatherDisplay`. Today uses that same component and already-loaded selected-day region forecast. A separate full-grid-width forecast section preserves the compact current-weather/navigation columns and existing current/preview/weather status behavior. No additional request, provider, score calculation rule, date/time, storage, auth or trip inference was introduced. Existing old weather assertions remain intact. The source fingerprint audit adds only the four specifically authorized weather presentation files and still protects all other R6/R7 files.

## Image implementation blocker — no content substitution

GPT-6 selected **tsuruta yosuke / Wikimedia Commons / CC BY 2.0** in the exact Issue #22 closed packet. Only its approved 960px JPEG thumbnail URL was attempted with ordinary binary retrieval. **HTTP 403; curl exit 22; no JPEG acquired.** No MIME/dimensions/hash/pixel validation can be claimed. No alternative source was fetched, no independent travel/licence research performed, no image record/mapping added. Ledger/manifest now record this packet/technical failure and retain the prior candidate as historical evidence. Candidate JSON/checksum are unchanged. D1 night image and all protected assets remain byte-for-byte unchanged.

## Fresh responsive evidence

Actual unpublished Schema6 candidate `jp2027-schema6-unpublished-draft.json` delivered through intercepted remote reads; never written to Supabase or made a local demo. Seven pages × widths **320/390/430/1024/1440** × fonts **Small/Medium/Large**: **105 scenarios**, plus **15 detail scenarios** for weather, hotels, footer, D1/D2/D6/D7/D8/D9 and controlled-clock Today. Top/content screenshots, real scroll coordinates, dialogs and actual browser offline transition were captured. Contact sheets supplement representative original-resolution PNGs. Post-repair captures cover D1 gallery/Projection/backup and Today navigation/five-day forecast at all 15 combinations.

Weather responses and clock are controlled UI fixtures, not live forecasts. Camera requests are blocked/intercepted; external-only cards are not playback proof. All page errors/whole-page horizontal overflow/status-dock overlap checks were zero in the baseline 105 scenarios; sticky selector coordinates are retained in `qa/final28/results.json`. Long sections naturally scroll within main; horizontal forecast/tab scrolling is intentional. Source facts and timings are never changed by screenshot fixtures.

| Width | Seven-page top / scrolled content | Weather / lodging / footer | Day labels | Post-repair details |
| --- | --- | --- | --- | --- |
| 320 | [top](qa/final28/contact-320-top.jpg) / [content](qa/final28/contact-320-content.jpg) | [weather/Today](qa/final28/contact-320-weather-today.jpg) | [days](qa/final28/contact-320-days.jpg) | [after](qa/final28/contact-320-after.jpg) |
| 390 | [top](qa/final28/contact-390-top.jpg) / [content](qa/final28/contact-390-content.jpg) | [weather/Today](qa/final28/contact-390-weather-today.jpg) | [days](qa/final28/contact-390-days.jpg) | [after](qa/final28/contact-390-after.jpg) |
| 430 | [top](qa/final28/contact-430-top.jpg) / [content](qa/final28/contact-430-content.jpg) | [weather/Today](qa/final28/contact-430-weather-today.jpg) | [days](qa/final28/contact-430-days.jpg) | [after](qa/final28/contact-430-after.jpg) |
| 1024 | [top](qa/final28/contact-1024-top.jpg) / [content](qa/final28/contact-1024-content.jpg) | [weather/Today](qa/final28/contact-1024-weather-today.jpg) | [days](qa/final28/contact-1024-days.jpg) | [after](qa/final28/contact-1024-after.jpg) |
| 1440 | [top](qa/final28/contact-1440-top.jpg) / [content](qa/final28/contact-1440-content.jpg) | [weather/Today](qa/final28/contact-1440-weather-today.jpg) | [days](qa/final28/contact-1440-days.jpg) | [after](qa/final28/contact-1440-after.jpg) |

Each contact sheet's columns are Small / Medium / Large. Evidence link in the matrix opens a 320px contact sheet; use the five-width table for the same section at every width/font. Original-resolution [320 Large castle dialog](qa/final28/320-large-attractions-dialog.png), [OFFLINE](qa/final28/320-large-offline.png) and post-repair forecast PNGs supplement layout thumbnails. Direct source metadata is available in the candidate/ledger; a visible screenshot cannot certify unknown content facts.

## Reopened acceptance matrix

All rows concern the actual unpublished candidate, reviewed in PR #21 on the date above. PASS means only the stated local presentation behavior, **never published/user accepted**. PARTIAL/BLOCKED retain their explicit missing data/provider/licence conditions. Complete regression covers generic city/road behavior, readers1–6 and cross-trip isolation separately from Japan visual evidence.

| # | Requirement / previous issue | Local status | Fresh browser evidence | Outstanding condition |
| --- | --- | --- | --- | --- |
| 1 | Back-to-Top fixed/accessible | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Actual main-pane scroll, visible arrow and smooth return to scrollTop=0 at all 15 combinations. | Published/user acceptance still open. |
| 2 | Five-day metrics / whitespace | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Actual Japan forecast cards show ten aligned rows, compact spacing; no empty comparison column. | Controlled forecast, not real future weather. |
| 3 | Technical metadata in footer | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Data/Schema/Source are at the compact footer, not trip heading. | Unpublished draft version explicitly shown. |
| 4 | Shared sticky five-page tabs | PASS (local) | [content](qa/final28/contact-320-content.jpg): Real main scrolling preserves trip tabs on each destination page. | Narrow tabs intentionally scroll horizontally; not all five fit simultaneously. |
| 5 | Recognisable page icons | PASS (local) | [content](qa/final28/contact-320-content.jpg): Shared SVG icons retain visible Traditional Chinese labels. | No physical Safari certification. |
| 6 | Desktop five-card width | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): 1024/1440: all five forecast cards share available width, no desktop forecast overflow. | Mobile forecast is intentionally horizontally scrollable. |
| 7 | D1–D9 / destination labels | PASS (local) | [days](qa/final28/contact-320-days.jpg): Canonical day labels wrap; D6 village, D7 summit, D8 cave → Matsumoto retained. | Fixed approved itinerary unchanged. |
| 8 | Truthful forecast horizon | PASS (local) | [days](qa/final28/contact-320-days.jpg): Yellow POC simulation notices visible for out-of-horizon itinerary dates. | Not a January 2027 forecast or travel recommendation. |
| 9 | Today airport/JR buffers | PARTIAL | [weather-today](qa/final28/contact-320-weather-today.jpg): Authored airport/transfer instructions visible in Today full activity list. | Terminal/buffer facts and further copy need GPT-6 packets; not inferred. |
| 10 | 1-large/2-small gallery; two images | PASS (local) | [after](qa/final28/contact-320-after.jpg): D1 three-image and D2 two-image layouts inspected using real protected local assets. | Semantic D2 night image remains blocked under #22. |
| 11 | Inline Maps actions | PASS (local) | [after](qa/final28/contact-320-after.jpg): Maps links alongside actual itinerary/Place/Today entities, not a separate guessed route. | Authored links only; offline map provider not certified. |
| 12 | Compact complete lodging | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Actual hotel facts grouped; booking, payment, meals and stay dates remain visible. | No booking facts modified. |
| 13 | Projection plus untimed Nawate backup | PARTIAL | [after](qa/final28/contact-320-after.jpg): Candidate preserves optional timed Projection; Nawate rendered separately in backup section. | Correct in unpublished candidate; published jp2027.1 intentionally unchanged. |
| 14 | Chinese Projection title | PARTIAL | [after](qa/final28/contact-320-after.jpg): Candidate Chinese Projection title displayed; native/source wording retained. | No publication authorized. |
| 15 | Sourced native names | PARTIAL | [content](qa/final28/contact-320-content.jpg): Castle detail and actual card names display supplied native names. | 36 original Places + seven hotels supplied; target/transport name gaps still open. |
| 16 | Colour-coded suitability | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Score bands visibly coloured and numerically labelled. | Fixture metrics are not certified travel safety or operator status. |
| 17 | Compact full Place cards | PASS (local) | [content](qa/final28/contact-320-content.jpg): Actual attraction and itinerary cards wrap; dialog preserves full authored paragraphs. | Content completeness remains #23. |
| 18 | Fares / honest missing costs | PARTIAL | [after](qa/final28/contact-320-after.jpg): Existing reference fares remain qualified; unknown flight/JR amounts are not invented. | Four flight/JR fares and real payment records need GPT-6/user packets. |
| 19 | Chinese lodging categories | PASS (local) | [weather-today](qa/final28/contact-320-weather-today.jpg): Actual accommodation cards show Chinese known-code labels. | Unknown authored categories are not silently translated. |
| 20 | Per-leg winter SA/PA advice | PARTIAL | [days](qa/final28/contact-320-days.jpg): Existing conditional D2/D6 authored advice retained. | Selected IC chain/direction, other legs and winter services not fully verified. |
| 21 | Checklist density / usability | PASS (local) | [content](qa/final28/contact-320-content.jpg): Actual Japan checklist visible with touch-sized rows and wrapping. | Mocked sync only; no live checklist writes. |
| 22 | Daytime D2 castle; nighttime D1 | BLOCKED | [content](qa/final28/contact-320-content.jpg): Screenshot confirms D2 still uses night photo. Exact approved thumbnail retrieval returned HTTP 403. | No JPEG bytes; no new image URL, mapping, substitute or protected overwrite. |
| 23 | Comprehensive original Place details | PARTIAL | [content](qa/final28/contact-320-content.jpg): Actual castle dialog displays supplied introduction and structured facts, scrolls at Large. | All 36 require complete source-reviewed history/why/importance/notices; no completeness claim. |
| 24 | Attractions sticky day/region selectors | PASS (local) | [content](qa/final28/contact-320-content.jpg): Actual main scrolling pins both selector rows below trip navigation at all 15 combinations. | Coordinates recorded; physical Safari remains untested. |
| 25 | Genuine Live Cam coverage/playback | BLOCKED | [content](qa/final28/contact-320-content.jpg): Actual five external-only cards honestly state external/not directly playable. | No real playback/44-resource coverage verification; no network travel/camera research performed. |
| 26 | Compact Today targets/parking | PASS (local) | [after](qa/final28/contact-320-after.jpg): Actual primary navigation card and supplementary airport/entrance targets inspected. | No navigation identity or route fact invented. |
| 27 | Today shared five-day weather | PASS (local; repaired) | [after](qa/final28/contact-320-after.jpg): REAL DEFECT: baseline had only selected-day metrics, no five-day section. Shared WeatherForecast now supplies five cards, notices, day-region mapping, keyboard scrolling and cache reuse. | CI/user acceptance remain separate; real forecasts/providers not certified. |
| 28 | Green ONLINE / red OFFLINE | PASS (local) | [content](qa/final28/contact-320-content.jpg): Browser offline toggle captured red OFFLINE; online captures green ONLINE; dock reserves content space. | Device connectivity only, not backend reachability. |

## Validation and release boundaries

- Baseline-focused (unmodified UI): `japanContentDraft`, `sharedShellQA`, `r2WeatherVisual`, `r5AttractionsQA`: **120/120 PASS (2.9m)**.
- Patch-focused: `final28Weather`, `todayWeather`, `todayVisual`, `todayArchitecture`, `r2WeatherVisual`, `japanContentDraft`, two Chromium workers: **155/155 PASS (3.4m)**; 15 new actual-candidate viewport/font cases, unchanged old assertions retained.
- Full final local: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test -- --workers=2`: **2,820/2,820 PASS (39.5m), exit0**, no failures/skips/retries. All 2,805 existing cases retained plus 15 new. Run once after focused success.
- `npm run build` / strict application/tool/test TypeScript: **PASS** before focused tests and again after full regression. Existing nonfatal bundle-size notices remain.
- `git diff --check`: **PASS**. **495 raw screenshots** captured across baseline, detail and post-repair scenarios; **25 contact sheets** plus representative full-resolution PNGs retained in review artifacts. Screenshot fixtures and test clocks are controlled; real media/weather availability is not certified.
- Draft PR QA: branch-only pull-request workflow; its result is recorded in PR #21 / Issue #22. No main push or Pages deployment.

- Original published fixture SHA-256 **09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e**, draft SHA-256 **0a4d085d49cc86043e290b97c3636a31300c07f0f47b61559b9b7952c9e080d8** and all canonical D1–D9 timing/identity checks retained. Schema6/readers1–6; demos city.5/road.5 unchanged.
- Production reference clean at **8b5129b381d6ace94030b51c7b8de5c4e3d5f533**. No Production, Supabase, published snapshot, protected asset or D6–D8 edit. No Step15D work, no merge/deploy.
- Additional content/price/route/camera packets must come from GPT-6. Final user acceptance is pending; this report does not ask for it while blockers remain.
