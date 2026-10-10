# R7 — Japan content fidelity audit and unpublished correction proposal

Audit: **11/10/2026 (Asia/Hong_Kong)**, Issue [#16](https://github.com/yfgary/travelpilot-poc/issues/16). R7 branch `qa/pre15d-r7-japan-fidelity`, App candidate **v2.0.0-poc.42**. This document and its companion matrix are review evidence, **not an active Trip Data version or publication instruction**.

## Baseline and evidence

R6 main `718b19d06fa779d9a343bebc480de6ceffa7113d` / poc.41: [run 38080139375](https://github.com/yfgary/travelpilot-poc/actions/runs/38080139375), **2,640 PASS**, build job `114295176217` and Pages job `114297224265` successful before R7 edits. Production read-only reference: `8b5129b381d6ace94030b51c7b8de5c4e3d5f533`.

Published Japan remains **jp2027.1 / Schema 5**, UUID `349442d2-7bf3-426b-9f57-163e2272e909`, archive SHA-256 `09a0bc1a5b75e50b579fd5ec4596912026cf8311fdf262df0c14ca6e235ea57e`. Source input first entered the POC in [6c8737f](https://github.com/yfgary/travelpilot-poc/commit/6c8737fb09699de684b3eddb9058a86c520efcb8); that commit's archive has the same hash. No subsequent snapshot edit exists in repository history. This proves the drift is already in **jp2027.1's supplied authoring input**, not a later R1–R6 renderer transformation. It does **not** prove which earlier external authoring conversation removed Nawate; that history is unavailable.

The [machine-readable field matrix](V2_R7_JAPAN_CONTENT_MATRIX.json) includes **all 36 canonical Places**, exact old/new authored fields, canonical day/date/timeline occurrences, source-file line links/hashes, five V1-only records, nine base-HTML highlight comparisons and ten roadside-rest rules. It is intentionally outside runtime imports. V1 `whyLong/why` is not automatically identical to V2's separately authored introduction and reason fields; the matrix documents that mapping rather than inventing an equivalent V1 field.

Read-only sources include `itinerary.html`, the trip's itinerary/attractions/trip-info/hotels JSON, both deep-info scripts, backup deep-info, enhancement data and relevant v8/v9 overlays/visit metadata. [V1 loader lines 31–63](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/attraction-info.js#L31) establish that these overlays are loaded. [Rich dialog lines 49–67](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-enhancements-v3.js#L49) render why/history/importance/visit/takeaway/fit/winter separately. V8 visit data adds opening/fee/photography notices (31 matched canonical records included in the matrix); V1 base HTML alone is not the final route truth. Source text proves what V1 authored, **not independently that every old historical, seasonal, route or licence claim is correct today**.

## Field-by-field issue summary

| Issue / affected surface | V1 wording / source | Immutable V2 field / wording | Diagnosis and disposition |
| --- | --- | --- | --- |
| #9 Today / D1 09/01/2027 | `06:45 左右到香港機場 T2` + `唔好壓縮出發 Buffer。`; `17:40 JR 特急信濃` is important; hotel first, cancel delayed Bonus. [HTML L1454](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/itinerary.html#L1454) | `days[0].highlights = ["UO680", "μSKY＋JR轉乘", "松本第一晚"]`. Airport timeline description exists: `香港時間（HKT）。完成T2國際航班報到、行李及候機。`; transfer description `拖行李轉JR；早到可買票／便當。` | **① shared UI defect:** full Today list omitted descriptions; browser confirmed absent in row. **② data copy gap:** bare highlights are rendered faithfully; renderer must not manufacture buffers. **④** independently recheck airport terminal before publishing a stronger terminal claim. |
| #13 D1 Optional / Backup | Nawate is a separate `backups.d1[0]`, `JR準時、酒店Check-in後仲有精神，但唔想再坐車。`, `21:00前完成；航班／JR遲就直接取消。` [enhancement L166](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-enhancement-data.js#L166); attractions JSON L6 says D1/D8 backup | No Nawate Place or day reference. `days[0].optionalContent[0].id = jp27-place-matsumoto-projection`; timeline `jp27-tl-d1-projection` is optional/bonus 20:20–21:00. | **② confirmed omission**, **④ authoring decision:** V1 already contains Projection Mapping too (HTML L1655). Evidence supports loss of a separate backup, not a proven replacement operation. Do not replace/cancel the approved Projection activity or silently add Nawate. |
| #14 titles across itinerary/Attractions/Today | `✨ 松本城冬季光影投影`; local name `国宝松本城天守 プロジェクションマッピング`. [deep-info L33](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-deep-info-d1-d4.js#L33) | Place `jp27-place-matsumoto-projection.name = 松本城 Projection Mapping 2026-2027`; D1 item title `松本城 Projection Mapping`. Source URL already retained. | **② source-authored Chinese wording proposal**, not runtime translation. **④** V1 seasonal announcement is not verified current official availability. Schema 6 permits future sourced localName; current Schema 5 must not be augmented. |
| #20 driving instructions D2/D3/D5/D6/D7/D8 | V9 `REST_RULES` has explicit SA/PA/roadside narratives, applied with title-substring/vehicle-type DOM matching. [L231–247](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-v9-final-fixes.js#L231) | No canonical SA/PA or 道の駅 narrative. Rental-car notes contain equipment and pickup/return, not per-leg rest areas; driving timeline descriptions are preserved but short. | **② confirmed data absence**, **④ unverified route detail**: shared Timeline already displays descriptions and linked transport notes. New Today list makes authored descriptions accessible too. Do not import V1 title-matching rules or assume a highway/direction. |
| #22 D2 10/01/2027 daytime castle / gallery / Place image | V9 D2 gallery selects daytime `Matsumoto-Castle-day-view-2019-Luka-Peternel.jpg`; interior separately. [L9, L44–47](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-v9-final-fixes.js#L44) | `jp27-image-matsumoto → matsumoto-castle.jpg`, referenced by D1, D2, castle and projection Places. Approved source is `assets/images/d1-matsumoto-castle.jpg`; hash `dbb9e5672a646a101d9427cb95866ca950cdf064aa6a8a95ce9979b88c7afdfa`. | **② confirmed mapping gap**: actual pixels show night projection. CSS cannot make it a daytime photo. **④** new daytime asset/rights verification needed; preserve protected file and create a distinct future image record, not replace all day images. |
| #23 all canonical Place dialogs / introductions / why / history / local importance / takeaway / notices | V1 has multiple full paragraphs and separate winter/fit context. Castle whyLong 2 paragraphs, history 3, importance 2; [deep-info L8–30](https://github.com/yfgary/travelpilot/blob/8b5129b381d6ace94030b51c7b8de5c4e3d5f533/assets/trip-deep-info-d1-d4.js#L8). Exact 36-entity comparison is in matrix. | Castle `longDescription` one paragraph; history `1590年代石川氏大規模整備城郭與天守。明治後曾面臨拆除及傾斜危機，靠地方保存運動及修復才保留至今；五棟天守建築1952年按現行制度指定為國寶。`; other fields similarly concise. Projection has no history/longDescription. | **② real authored-depth gap**, not R5 truncation. R5 already renders every supplied paragraph. **③** exclude obsolete day-fit instructions; **④** unsupported dates, seasonal claims and historical details require source verification. No mass unreviewed prose transplant. |

## Four separate dispositions

1. **Safe renderer fix implemented:** Today full activity rows reuse the existing shared RichText paragraph renderer for nonempty `item.description`. Plain React text, no HTML execution, no derived instructions, no truncation/translation, no data fetch. Current/previous/next logic, times, day selection, highlight arrays, manual/preview, Maps, weather, alerts and caches are untouched. Missing descriptions remain absent. This fixes visibility of existing data, **not Japan highlight/content parity**.
2. **Verified repository/canonical corrections proposed but unpublished:** Chinese presentation name, canonical-time-based D1 highlight wording, separate daytime-vs-night image identities, preserving existing operational descriptions, and authoring Nawate as a separately reviewed optional/backup entity. Each requires a new immutable data version and fresh explicit publication approval; no proposal is bundled with the app.
3. **Obsolete V1 content not to restore:** D2 `10:00` pickup and obligatory mountain route (current timeline pickup 11:05–11:25; rental transport departure 11:15; mountain records remain backup only); D6–D8 weather-based destination swapping; old D8 Shinhotaka day assumptions; old attraction-specific fit instructions moving the cave/city/summit day. Keep current D6 village / D7 summit / D8 cave → Matsumoto, all exact D1/D9 instants and current Hard Cuts. Remaining canonical backup records are not deleted.
4. **Uncertain facts / user decisions:** whether Nawate is an alternative instead of or after the projection (no extra mandatory evening segment); 2026–27 projection dates and current airport terminal; actual per-leg highway route, direction and rest-facility winter opening; independent castle-image rights; existing D2 pickup timeline (11:05–11:25) versus rental transport metadata (11:15) should be reconciled only in future content review; historical detail that V1 claims but current approved data does not establish. Nothing uncertain is silently promoted to published fact.

## Unpublished content proposal — review only

**Do not apply this section as a migration/JSON patch.** Stable current IDs and exact timing remain. No future dataVersion or schemaVersion is reserved or activated by R7.

### Canonical-backed copy, ready for authoring review

Replace D1 highlight copy in a **future** snapshot with these proposed strings, derived only from current canonical airport/JR/hotel time records and buffer descriptions:

```json
[
  "06:45（香港時間）開始機場報到／候機安排，保留出發緩衝。",
  "17:40–19:46 JR 特急しなの；16:35–17:35 預留拖行李轉乘時間。",
  "19:50–20:10 先辦理酒店入住；夜間可選活動不可壓縮休息。"
]
```

This changes **copy only**, not timing. Do not reassert Hong Kong T2 as independently verified; the current canonical terminal text stays untouched here. D9 actionable copy can similarly use **11:35–12:10 還車 / 13:56 JR / 20:40 departure → next-day 00:30 arrival** from current records, never V1 12:30 return.

For the projection Place and matching timeline **presentation title**, propose `松本城冬季光影投影` (exact V1 Chinese name without emoji). Preserve original `Projection Mapping` terminology and existing official source URL in authored description/source metadata. A future Schema6 `localName` may use the V1 original name **only after official verification**. Do not automatically translate other Places or infer 2026–27 operation from the name.

### Nawate proposal requiring itinerary choice and source verification

- New separately authored Place (tentative stable ID `jp27-place-nawate`), canonical Matsumoto Region, generic attraction/street concept, map identity `Nawate Street Matsumoto`; no invented coordinates, price, opening hours or fixed timing.
- Source evidence: V1 `attractions.json` L6, enhancement data L151/L166–168, deep-info-d5-d9 L151–159, source URL `https://visitmatsumoto.com/` recorded in V1. Generic tourism homepage is provenance, **not proof of January 2027 night opening**.
- Proposed display wording from V1: `松本・繩手通`; optional quiet walking, many shops already closed at night, cancel on delay/fatigue. The documented 20–30 minutes and 21:00 limit are **V1 planning estimates** requiring a choice, not new confirmed canonical timings.
- Ask during future content review: restore Nawate as a separate D1 backup/alternative, retaining Projection Mapping, or replace the projection? No replacement is authorized now. D8 walking reference is also a separate future decision; do not add a compulsory detour.

### Daytime asset proposal requiring rights/asset approval

Keep existing `jp27-image-matsumoto` and night file intact for D1/projection. Future authoring should add a **distinct daytime image**, point the castle Place and only D2's castle-gallery slot to it, retaining every other gallery image/reference. Proposed source recorded by V1:

- File page: `https://commons.wikimedia.org/wiki/File:Matsumoto-Castle-day-view-2019-Luka-Peternel.jpg`
- V1 author/licence claim: **Luka Peternel / CC BY-SA 4.0**; retain author, licence link, source URL and required attribution/derivative notice after verification.
- Separate interior candidate: `File:Matsumoto inside.JPG`, V1 **James Heilman, MD / CC BY-SA 3.0**; not a substitute for daytime exterior.
- Current night file's V1 credits (HTML L4399) claim **Hiroaki Kikuchi / CC0**, `File:Matsumoto-castle-2026-PM.jpg`; current canonical image record carries neither author nor licence. `provenance.json` proves copy origin/hash, **not independent rights ownership**. Neither current image bytes nor metadata are changed.
- R7 does not download/select/install assets or certify these external file-page claims. The actual protected JPEG has no EXIF DateTime/DateTimeOriginal/DateTimeDigitized/Artist/Copyright values; its precise capture date/time and photographer cannot be established from those bytes. Night projection is visible in the pixels; a `2026` filename is not capture-time proof. Brand banner is never a trip-image fallback.

### Driving/rest proposals requiring route verification

The matrix preserves all ten exact V1 narratives. Candidate mapping is by **explicit canonical timeline item**, in future data only; do not install V1's regex/substring matching:

| Current leg | V1 candidate narrative | Verification blocker |
| --- | --- | --- |
| D2 松本 → 輕井澤 | 梓川SA → 筑北PA → 姨捨SA → 千曲川さかきPA → 東部湯の丸SA | Verify actual highway entry/direction and whether each stop lies on chosen route; preserve current 11:05–11:25 pickup timeline, 11:15 transport metadata and Outlet time; any alignment is separate content review. |
| D2 Outlet → 千曲 | 佐久平PA / 東部湯の丸SA / 千曲川さかきPA | Verify E18 direction/exit; do not prescribe all stops. |
| D3 千曲 → 小布施 | 松代PA / 小布施PA | Verify route and available side. |
| D5 長野 → 白馬 / 白馬 → 高山 | 道の駅 中条; **conditional** R148 → E8 → R41 / 有磯海SA | No proof the canonical route uses this highway diversion; confirm winter road choice before authoring. |
| D6 高山 ↔ 白川鄉 | 飛驒河合PA / 飛驒白川PA, V1 says small PA/no large SA | Verify E41 choice/direction/facilities; no D6/D7 swap. |
| D7 高山 ↔ 新穗高 | 道の駅 奥飛騨温泉郷上宝 | Verify the chosen road passes it and winter hours; do not reduce summit buffer. |
| D8 鐘乳洞 → 松本 | R158 / 安房隧道 / 道の駅 風穴の里 | Verify canonical route, closure/winter operations; keep cave → Matsumoto and arrival constraint. |

Once verified, author a per-leg `timeline.description` paragraph (or appropriate canonical transport notes), explicit optional rest and source relation; shared Timeline and Today already render it. No new schema is necessary merely to store prose. Existing generic safe-driving warning remains.

### Attraction prose proposal requiring factual review

Use the 36-entity matrix as the authoring checklist. Preserve exact current IDs, dates, fees, source references and placements. Restore distinct full introduction/reasons/history/local significance/takeaway/notice paragraphs; line breaks go through existing RichText. **Do not pad missing fields with generic prose or import V1 `fit` as itinerary truth.**

For the castle, V1 whyLong L12–13 provides two substantial paragraphs about preserved wooden fabric and military-vs-peacetime structures; these themes are already supported by the current canonical longDescription/whatToSee. They are suitable **sourced authoring candidates**, while V1's additional 1582/1593 and preservation-person detail (L16–18) must be independently checked before inclusion. Retain current D2 90-minute entry rather than V1's obsolete outer-only/10:00-pickup advice. The canonical `sourceIds` already identify the castle official source; a link is not evidence that all newly expanded assertions were checked.

For every entity, review `winter`, `fit`, `time` and V8 photography notes separately. Existing `whatToSee`/timeline/day warnings can carry approved notices without weakening Schema5; genuine new structured requirements would need separate schema review. No new schema/reader is created in R7.

## Verification and remaining gates

Native Chromium also rendered a local read-only reproduction of the pinned V1 HTML and its 41 loaded scripts at 390/1440px, with all external requests aborted. Inspected V1 D1 highlights and full castle dialog screenshots; both had a separate Nawate button and no page errors. This confirms the practical-copy and paragraph-depth gaps visually, not just by counting fields. External daytime/photo URLs were not fetched, so source-page licensing remains unverified. No V1 code was copied into the app.

Native Chromium baseline probe on unchanged poc.41 demonstrated the canonical airport description absent specifically inside its full activity row. Existing UI sources show `Activity` already renders description and day highlights render their authored array; only the full list omitted it. The safe fix therefore has a concrete scope and does not pretend to repair missing authored highlights.

New focused QA covers all five widths × all three fonts, full escaped multi-paragraph descriptions, missing-data absence, manual/automatic preservation, Schema1–6 remote/signed-out cached rendering with unchanged cache bytes, exact immutable Japan descriptions and D9 day switch, gallery/Bonus/Maps/transport notes and full long-form dialog integrity/focus return. **75 new focused PASS (1.4m), 320 existing focused PASS (5.4m), full local 2,715/2,715 PASS (37.3m)**. The original full run completed and its result was recovered after the conversation interruption; no unnecessary second full run. Clean install, strict TypeScript/Vite build and diff check PASS. Japan Today/itinerary/Attractions screenshots inspected at 320px Large, 390px Medium and 1440px Medium; synthetic Today/Bonus/full-detail captures inspected at 320px Large and 1440px Medium. Protected R6 fingerprints stay unchanged; one explicit R7 override pins only the authorized Today view. No blanket clean-worktree exception. Draft PR CI remains separate; no merge/deploy.

**R7 content parity remains open** until a separately approved, verified new immutable Trip Data version is published. R6 #25 remains five external Japan records versus 44 distinct unverified V1 media references; nine attempts were tunnel blocked. R8 final cross-trip QA is pending. **Step 15D is blocked and has not started.** No Production, live Supabase, published/archive jp2027.1 or protected image change. Draft PR only; no merge/deploy.
