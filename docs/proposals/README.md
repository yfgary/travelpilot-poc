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

- Monkey-park official guide announces a **1 December 2026 fee change**; revised amount is not verified. The inherited price is not certified for January 2027.
- Santera's checked detailed schedule is **2026**, not a published 2027 timetable. Iwatake seasonal page information must not be transposed between green/winter seasons. Bear cub photo dates reviewed cover April–October 2026, not January.
- Official viewpoint parking closure notice prohibits promising direct parking at 荻町城跡展望台. No new navigation target is added.
- A daytime castle photo candidate has verified file-page attribution: **Luka Peternel, CC BY-SA 4.0**, [Commons file](https://commons.wikimedia.org/wiki/File:Matsumoto-Castle-day-view-2019-Luka-Peternel.jpg), revision 861963817. Original-file acquisition returned **HTTP 403**. No image bytes downloaded, visual approval performed or new image mapping installed. Future D2/Place daytime mapping must keep D1 night artwork separate and retain licence/attribution.
- The official Iwatake winter page links [Panomax](https://iwatake.panomax.com/). Native Chromium returned **ERR_TUNNEL_CONNECTION_FAILED**. A linked source is not verified playback or embedding permission; all five original records remain external and unchanged. R6 coverage/playback blockers remain open.
- Existing detailed history, why-visit, fee and hours fields outside newly authored prose are **inherited, not newly certified**. These are explicitly listed per entity. Target-specific native navigation labels and some transport labels remain pending.

## Validation and publication boundary

Focused tests use the exact draft as intercepted review data in native Playwright, never real Supabase records. They exercise strict Schema6/reference validation, immutable fixture/timing, every Place dialog, native names, all five trip routes/reload, all five widths and three fonts, source provenance and signed-out cache fallback. This validates renderability, not factual completeness or camera playability. Final results appear in [current state](../V2_CURRENT_STATE.md).

`jp2027-draft-manifest.json` includes the exact draft hash, invariants and outstanding gates. Source verification and a green Draft PR **do not authorize publication**. Any actual Supabase version creation/publication requires separate explicit user authorization; Step 15D remains blocked.
