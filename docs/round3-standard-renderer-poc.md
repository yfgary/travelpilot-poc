# Round 3 — Standard Renderer POC

This repository is the isolated proof of concept for TravelPilot Standard.

## Implemented reusable capabilities

The shared runtime contains no destination-specific trip branch. Two trips use the same code:

- `golden-reference-2027`: feature-rich Golden Reference fixture.
- `city-demo`: minimal second trip used to prove that disabled features do not leak.

Round 3 implements:

- generic HTML shells
- trip manifest + data loading
- trip-scoped state keys
- rich itinerary timeline
- day highlights
- hard cuts, backups, bonus and constraints
- hero/gallery media, captions, credits and zoom
- rich attraction detail modal
- attraction score reason, history, visit guidance, access, winter notes, tips and sources
- hotel start/end markers
- hotel payment/cancellation/parking fields in Trip Info
- generic Trip Info custom sections: cards, list, notice, links
- Standard Live Cam `cameras[] + days[]`
- Today Mode derived from itinerary/hotel/attraction data
- Driving Mode derived from itinerary/hotel/attraction data
- trip-scoped checklist and departure checklist persistence
- Standard weather region/activity-profile display
- shared typography tokens

## Deliberately excluded

- D6–D8 automatic day swapping
- weather-driven automatic selection of a D6–D8 day

Weather information remains informational and must not rewrite the itinerary.

## QA

The POC QA has three levels:

1. static architecture/data assertions
2. JavaScript + JSON syntax/parse checks
3. real Chromium browser smoke tests with Playwright

Browser smoke verifies both Golden Reference and the second generic trip, including feature gating, modal flows, photo zoom, custom Trip Info sections, state persistence and Live Cam rendering.

## Next round

Round 4 is data migration: harvest the complete production Shirakawago 2027 content into the Standard data model before any production legacy runtime is retired.
