# Stage 5N — audit Trip Info retry migration

Stage 5N is audit-only. It reviews whether the fixed `120 / 350 / 800 / 1600 / 2600 ms` startup retries in `assets/trip-v9-hotfix.js` can later move onto explicit Trip Info render/completion events without changing the current runtime contract in this stage.

## Current ownership

`trip-v9-hotfix.js` owns Japan Trip Info legacy reconciliation for:

- the extra Trip Info quick-nav entries (`🚆 火車` and `⛩️ 神社`)
- deep-info buttons under `#winter-shrines`
- the `v901TripInfoModal` deep-info modal and delegated click handling

The current startup contract is one DOM-ready `run()` plus fixed retries at `120 / 350 / 800 / 1600 / 2600 ms`.

## Existing event evidence

The current loader order for the Japan Trip Info chain is:

`trip-v9-final-fixes.js` → `trip-v9-hotfix.js` → `multi-trip-trip-info-renderer-v1.js`

That ordering means `trip-v9-hotfix.js` can subscribe before Trip Info renderer events begin.

`multi-trip-trip-info-renderer-v1.js` already dispatches `multitrip:tripinforendered` after each successful render. Its normal startup path renders once when `MultiTrip` and `MultiTripData` are ready, then performs bounded rerenders at `250 / 900 ms`, dispatching the event after every pass.

This event is particularly relevant because the renderer rewrites the quick nav and Trip Info section contents; a hotfix reconciliation pass after `multitrip:tripinforendered` is therefore aligned with the DOM mutation that currently requires delayed retries.

Stage 5L also established `japan2027:finalpatch` from `trip-v9-final-fixes.js`. Its final legacy reconciliation pass occurs at `1500 ms` and dispatches `final: true` after `applyAll()` completes. That gives the Japan legacy layer an explicit late completion signal even if the Trip Info renderer path is degraded.

## Audit conclusion

Event-driven migration is a credible next runtime step, but Stage 5N does **not** change runtime behavior.

The safest next runtime stage should:

1. keep the immediate DOM-ready `run()`;
2. run after `multitrip:tripinforendered` for normal renderer-owned DOM replacement;
3. run after final-only `japan2027:finalpatch` for the late Japan legacy completion path;
4. initially retain one bounded startup fallback while runtime parity is tested, rather than deleting all fixed retry protection in the same change.

After that event path has passed CI and manual Trip Info smoke testing, a later stage can audit/remove the remaining fallback separately.

## Explicitly unchanged

- no runtime JS/CSS changes
- `trip-v9-hotfix.js` keeps `120 / 350 / 800 / 1600 / 2600 ms` retries
- no Trip Info nav/modal/button behavior changes
- no Trip Info renderer timing changes
- no final-fixes timing changes
- no D6–D8 selection, localStorage key or 60 ms reload changes
- no D6–D8 visit metadata changes
- 96-item departure checklist unchanged
- Today Mode / Driving Mode unchanged
- Live Cam unchanged
- generic trips unchanged
- homepage/banner unchanged
- itinerary and Trip Info content unchanged

Application release remains `v10.13.3`.
