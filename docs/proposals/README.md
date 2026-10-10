# Japan 2027 unpublished Schema 6 content proposal

**Review-only. Do not import into runtime, merge to Production, update Supabase, overwrite jp2027.1 or start Step 15D.** This document records user-approved D1 choice and the first source-checked edits. Proposed `jp2027.2-DRAFT-UNPUBLISHED` is not reserved, activated or published.

## Confirmed D1 decision

Retain original optional **松本城 Projection Mapping** 20:20–21:00 and hotel/check-in timing unchanged; **松本・繩手通（縄手通り）** is a *separate* `backupContent` place with **no scheduled timeline time**. It is skipped if arrival is late, weather poor, or traveller tired.

## Checked official sources (11 Oct 2026)

- [Matsumoto City 繩手通](https://visitmatsumoto.com/zh-hant/spot/detail_1083.html) / [Japanese 縄手通り](https://visitmatsumoto.com/spot/detail_1083.html): pedestrian street with frog imagery and shops; individual night opening **not guaranteed**.
- [Matsumoto Castle Projection Mapping](https://visitmatsumoto.com/en/event/detail_3003.html): Dec 12 2026–Feb 14 2027, daily 18:00–22:00 during the event, free. Check for changes before the Jan 9 visit. The already approved 20:20–21:00 *optional* time is retained.
- [Castle daytime image candidate](https://commons.wikimedia.org/wiki/File:Matsumoto-Castle-day-view-2019-Luka-Peternel.jpg): Luka Peternel, CC BY-SA 4.0 shown on file page. **Not downloaded or installed.** Future use needs full attribution, licensing and distinct D2/Place image mapping without replacing D1 night image.
- D1 highlight wording is derived from canonical existing 06:45 HKT check-in, 16:35–17:35 transfer, 17:40–19:46 rail and 19:50–20:10 hotel records, not newly asserted ticket/terminal information.

## Files and status

`jp2027-schema6-unpublished-draft.json` is a copy of archived published Schema5 converted into an **unpublished Schema6 content draft**. Adds one Nawate Place (36 → 37), D1 backup relation, official sources, optional Japanese names for Nawate and Projection, Chinese Projection wording and 3 D1 practical highlights. No other canonical day, itinerary time, original place, hotel, transport, camera or protected image is edited.

`jp2027-draft-manifest.json` lists remaining issue gaps and validation/publication gates. This is **not yet Zod/Playwright validated**; the mandatory Codex test stage has not occurred.

## Still incomplete

8 PARTIAL + 1 BLOCKED from [R8 final acceptance](../V2_R8_FINAL_ACCEPTANCE.md). This first proposal only partially addresses #9/#13/#14/#15. Do **not** claim parity for fares #18, driving SA/PA #20, daytime image #22, all 36 original Place full prose #23, or real Live Cams #25. Read [R7 Japan audit](../V2_R7_JAPAN_FIDELITY_AUDIT.md), [36 Place matrix](../V2_R7_JAPAN_CONTENT_MATRIX.json), [R6 cameras](../V2_R6_LIVE_CAM_AUDIT.md).

**Next:** Codex validates this *unpublished* draft via strict Schema6 and Playwright, verifies remaining source facts/place-by-place authoring, and produces a Draft PR only after local QA; **no merge/deploy and no Supabase writes**.
