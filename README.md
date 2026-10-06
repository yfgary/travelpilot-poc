# TravelPilot POC

This repository is the **full test clone** of `yfgary/travelpilot/main` plus the new TravelPilot Standard architecture.

## Safety rule

- Development, migration, QA and manual testing happen here first.
- `yfgary/travelpilot/main` is production and is not modified by POC work.
- Production migration requires explicit user approval.

## Current phase: Round 7

All trips in the production registry now run through the same Standard v12 data/rendering architecture:

- Shirakawago / Shinhotaka 2027 — Golden Reference
- Bangkok 2026
- Hokkaido 2025
- Okinawa demo

The public pages are direct generic Standard shells. The temporary cutover router and legacy/standard split paths are retired.

The old production runtime files are still physically present only as dead-asset candidates from the cloned production snapshot. Round 8 will perform final dependency/dead-asset cleanup and full acceptance QA.

See `docs/round7-all-trips-standard.md`.
