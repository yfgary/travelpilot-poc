# Round 7 Redo — Golden Reference parity contract

This branch rebuilds Round 7 from the production UI outward. Production `yfgary/travelpilot/main` is read-only.

## Rule

A capability is not considered migrated merely because its JSON record exists. It must remain visible/usable in the browser and match the Golden Reference behavior and presentation closely enough to pass DOM, interaction and visual regression checks.

## Shirakawago / Shinhotaka itinerary contract

| Capability | Round 7 target |
| --- | --- |
| Header / trip identity | Preserve |
| Page switch navigation | Preserve |
| Day navigation D1–D9 | Preserve |
| Intro / overview cards | Preserve |
| Current weather | Preserve |
| 5-day forecast | Preserve |
| Weather region buttons | Preserve |
| Weather score | Preserve |
| Activity suitability chips | Preserve |
| Weather refresh | Preserve |
| D6–D8 weather auto-comparison / recommendation | **Intentional removal later** |
| D6–D8 day selector / automatic swapping | **Intentional removal later** |
| Snow shrine / torii Bonus | Preserve |
| Daily highlights | Preserve |
| Danger / road / weather / backup / bonus boxes | Preserve |
| Hero photos and galleries | Preserve |
| Photo captions and credits | Preserve |
| Image zoom modal | Preserve |
| Rich timeline descriptions | Preserve |
| Event type / duration / price | Preserve |
| Google Maps pins | Preserve |
| Hard cuts | Preserve |
| Hotel/end-of-day detail | Preserve |
| Attraction info ⓘ | Preserve |
| Today Mode | Preserve |
| Driving Mode | Preserve |
| Version / online status / back-to-top widgets | Preserve |

## Migration sequence

1. **Baseline lock** — candidate page uses the generic runtime loader but must be feature/DOM/visual equivalent to production.
2. **Ownership extraction** — move one reusable capability at a time from Japan-specific patch code into Standard modules/data.
3. **Parity after every extraction** — no next extraction while the current one changes an unapproved feature.
4. **Intentional D6–D8 removal** — remove only the selector/auto-swap/auto-recommendation surfaces, while retaining ordinary weather, scores and activity profiles.
5. **Public POC cutover** — only after the candidate passes the full parity contract.
6. Other trips are migrated only after the Golden Reference is stable.

The old simplified Round 7 implementation is retained only on `round7-regression-snapshot` for comparison and must not be used as the feature reference.
