# Japan 2027 unpublished Schema 6 content proposal

**Review-only; no runtime import, publication, merge or deployment.** This candidate does not replace `jp2027.1`, update Supabase or begin Step 15D. `jp2027.2-DRAFT-UNPUBLISHED` is a review label, not a reserved or activated version.

## Preserved decisions and data

D1 retains optional **松本城 Projection Mapping**, 20:20–21:00. **松本・繩手通（縄手通り）** remains a separate, untimed `backupContent` Place, not a replacement or additional scheduled stop. Original nine dates/routes, timeline identities/order/timing, D1/D9 offset datetimes, fixed D6 白川鄉 / D7 新穗高 / D8 飛驒大鐘乳洞 → 松本, bookings/payments, weather, checklists, navigation, five camera records and image mappings are preserved.

The archived published Schema5 fixture retains SHA-256 `09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e`. The draft uses existing Schema6 optional native names; there is no schema/runtime change. App Version stays **v2.0.0-poc.43**: this is unpublished Trip Data authoring and validation, not an application implementation/release. Reader contracts remain 1–6; demos remain city.5/road.5.

## Reviewed draft changes

- Original Chinese two-paragraph introductions and source-backed Japanese labels for all **36 original Places**, plus the already approved Nawate backup (37 total). Official operator/tourism/municipal/UNESCO sources are listed per Place in [source review](jp2027-source-review.json). New prose explains the specific visit and operational limitations. It does not certify every inherited history/fee/hour field or assert final V1 content parity.
- Japanese labels for seven actual booked accommodation records, preserving booking, money and stay dates. No guessed parking-target translations.
- Two Meitetsu **reference** fares: current official query adult one-person single fare ¥980 + special-car μticket ¥450 = ¥1,430. Notes explicitly distinguish this October 2026 reference from payment or a January 2027 quote. Four air/JR fare amounts remain absent; actual booking totals for all six missing-fare records still require confirmation.
- Sourced general NEXCO winter advice on winter tyres, severe snow and chain restrictions. SA/PA candidates are documented separately, **not inserted as confirmed route stops**. Direction, IC sequence and winter services need per-leg verification.
- Bear-park official URL corrected only in the draft from the expired legacy site to the reviewed operator site. No new camera or playback capability is asserted.

## Evidence and uncertainty

[Source review JSON](jp2027-source-review.json) records URLs, check date, verified fields, original paraphrases and unresolved fields. Sources were inspected read-only; ordinary browser/media restrictions remain evidence, not a reason to invent results. Reused [R7 fidelity audit](../V2_R7_JAPAN_FIDELITY_AUDIT.md), [36 Place matrix](../V2_R7_JAPAN_CONTENT_MATRIX.json), [R6 camera audit](../V2_R6_LIVE_CAM_AUDIT.md) and [R8 acceptance](../V2_R8_FINAL_ACCEPTANCE.md).

Important follow-ups:

- Snow Monkey fees were implemented from **GPT-6 verified packet #1**: adult standard ¥1,000, approved Web-price notes and qualified arrival advice. The unproven hard `lastEntry` was removed. See the source ledger; other inherited operational fields are not thereby certified.
- Santera's checked detailed schedule is **2026**, not a published 2027 timetable. Iwatake seasonal page information must not be transposed between green/winter seasons. Bear cub photo dates reviewed cover April–October 2026, not January.
- Official viewpoint parking closure notice prohibits promising direct parking at 荻町城跡展望台. No new navigation target is added.
- Issue #22 selects **tsuruta yosuke / Wikimedia Commons / CC BY 2.0** as the approved daytime castle source. Exact approved-thumbnail retrieval returned **HTTP 403**; no JPEG, image record or selective mapping installed. D1 night artwork remains untouched. The prior Luka Peternel candidate is retained only as historical ledger evidence; no source substitution occurred.
- The official Iwatake winter page links [Panomax](https://iwatake.panomax.com/). Native Chromium returned **ERR_TUNNEL_CONNECTION_FAILED**. A linked source is not verified playback or embedding permission; all five original records remain external and unchanged. R6 coverage/playback blockers remain open.
- Existing detailed history, why-visit, fee and hours fields outside newly authored prose are **inherited, not newly certified**. These are explicitly listed per entity. Target-specific native navigation labels and some transport labels remain pending.

## Validation and publication boundary

Focused tests use the exact draft as intercepted review data in native Playwright, never real Supabase records. They exercise strict Schema6/reference validation, immutable fixture/timing, every Place dialog, native names, all five trip routes/reload, all five widths and three fonts, source provenance and signed-out cache fallback. This validates renderability, not factual completeness or camera playability. Final results appear in [current state](../V2_CURRENT_STATE.md).

`jp2027-draft-manifest.json` includes the exact draft hash, invariants and outstanding gates. Source verification and a green Draft PR **do not authorize publication**. Any actual Supabase version creation/publication requires separate explicit user authorization; Step 15D remains blocked.

## Issue #22 reopened visual gate

[Final 28-item browser evidence](../V2_FINAL_28_REMEDIATION.md) reopens every original requirement using this actual unpublished candidate. Today’s missing shared five-day forecast is repaired generically in poc.44, with comparison-track alignment repaired in poc.45; image/content/camera blockers remain open. No user acceptance, publication, merge or deployment is implied.

## GPT-6 verified Packet #2 (11 October 2026)

[Exact implementation packet](https://github.com/yfgary/travelpilot-poc/issues/20#issuecomment-6109775041) adds only conditional D7/D8 roadside notes and two timeline-bound official sources. Original description sentences, every route/location/time and published bytes remain intact. There is no added actual stop. Operator-listed D7 winter shop16:30 and Matsumoto-city D8 hours/toilets/closures are GPT-6-supplied reference facts, not verified 2027 availability or a confirmed route. Actual navigation/IC/other-leg SA/PA gate stays open; discretionary safety breaks require real-world ETA adjustment. No independent Codex research. App remains poc.45; this is unpublished candidate authoring, not an app release. Results/checksum are in the manifest and current state.

## GPT-6 verified Packet #3 + shallow-checkout test repair (12 October 2026)

[Approved coding packet](https://github.com/yfgary/travelpilot-poc/issues/20#issuecomment-6111341798) supplies both Shinano ordinary reserved-seat¥6,160 references, inclusive of basic¥3,430+surcharge¥2,730. Exact notes visibly distinguish reference from booked/paid and future confirmed price. Official JR operator seasonal rules and third-party reference fare tables retain their separate source classes. Two flight fares and all six actual booking/payment totals remain unconfirmed; #18 remains PARTIAL. No independent Codex research or other schedule/data change.

Packet2's local PASS did not certify shallow Actions compatibility:38149460911 failed importing a historical Git tree before tests ran. The closed repair replaces Git with pinned descriptions/times and complete reconstructed SHA256 checks. Packet3 and Packet2 independently restore their prior baseline digests; no workflow weakening or archived-fixture copy. App remains poc.45 (content/test authoring only); strict schema/readers1–6 and published jp2027.1 unchanged. Latest results are in the manifest/current state; Draft only, no merge/deploy/publication/Step15D.

## GPT-6 verified Packet #4 (12 October 2026)

[Closed packet](https://github.com/yfgary/travelpilot-poc/issues/20#issuecomment-6112231362) replaces only D1/D9 two highlights/five descriptions and adds five official sources. Airport arrival/queue buffer differs from normal check-in opening; boarding gate transfer, airport walking, hotel4min-walk limitations, optimistic hotel check-in, T2 A departure/T1 Hong Kong arrival and lounge restriction are explicit. All flight/rail dates, offsets, canonical timings, fare/state/booking data and fixed D6–D8 routes are unchanged. No actual booked schedule or guaranteed hotel arrival is newly certified. #9 stays PARTIAL until eventual POC display/approval; no deploy is authorized now.

`airportReview` records exact approved fields, GPT-6 provenance and assumptions. A pinned pre-packet SHA256 restoration guards the complete delta and feeds earlier Packet2/3 tests without Git history. Browser tests use the actual shared Itinerary and Today interfaces, all five widths/three fonts. App remains poc.45, Schema6/readers1–6; no runtime/UI/asset change or independent Codex research. Published jp2027.1 stays immutable; no merge/deploy/Supabase/Production/publication/Step15D.

## GPT-6 verified Packet #5 (12 October 2026)

[Closed packet](https://github.com/yfgary/travelpilot-poc/issues/20#issuecomment-6113262289) replaces three D6/D8/D9 timeline descriptions and only two second Place paragraphs. Canonical timings, AEON11:00 hard cut, all routes/locations/bookings and fixed D6–D8 stay unchanged. Source-led operational warnings require2027 recheck; no optional viewpoint prose rewrite or extra parking/booking field invented.

Six official source records accompany the exact copy and distinct external-only village scenery webpage. Its approximate minutely05–19 update schedule, night stop, snow interruptions and residents’ privacy are explicit. Direct image-data linking is prohibited; no media/preview/iframe/hotlink/scrape/proxy/refresh request added. Five original cameras, including the separate traffic still page, are preserved. #25 remains BLOCKED, not playback-certified.

`operationsPacket5` and the camera evidence record retain GPT-6 provenance and rights limitations. Full pre-packet SHA restoration guards every other candidate byte and composes with Packet2/3/4 checks without Git history. Browser tests use mocked draft data in actual Today/Itinerary/Place/LiveCam interfaces, five widths and three fonts. App remains poc.45, strict Schema6/readers1–6 unchanged; results/checksum in manifest/current state. Draft PR21 only; no publication, merge/deploy/Supabase/Production/protected assets/Step15D. All28 items still need final acceptance.

## Packet #7 R158 safety addendum

Review-only `jp2027-schema6-review-draft-09` includes the user-approved D8 今日重點 warning for the R158 塩屋 landslide, nearby city-managed municipal diversion, and **snow/ice/road-closure recheck** before any January 2027 use. Official Gifu Prefecture, Takayama City, Hida Cave and Nagano Prefecture notices checked 2026-10-14. D5/D7/D8 have append-only road safety descriptions and 8 official timeline references; original D1–D9 schedule, routes, 5 old camera data, published Japan and protected images untouched. Full prior Packet5 SHA guarded by new restoration test; GitHub CI pending, so no new regression pass claimed. No publication or user acceptance.

## Packet #8 — Matsumoto official Live Camera

One external-only D1/D2 Matsumoto Castle camera card links the [official combined page](https://visitmatsumoto.com/en/livecamera/) (City Hall roof, Honmaru Garden, Kuromon Gate). City office separately verifies the municipal source and Honmaru published 08:00–22:00, not a universal camera schedule. Direct YouTube playback blocked in this research environment, so licensing/embedding/playback are NOT certified; #25 BLOCKED. Candidate draft-10 SHA-reversible to Packet7 with original six camera records untouched. New CI pending; no publication or Prod changes.
