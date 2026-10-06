# TravelPilot Standard Multi-Trip POC

Proof-of-concept repository for the data-driven TravelPilot Standard architecture.

Golden Reference principle: useful capabilities from the Shirakawago / Shinhotaka 2027 trip become reusable Standard capabilities. The D6-D8 automatic day selector and weather-driven day auto-selection are intentionally excluded.

Current phase: **Round 5 — full Standard parity and production retirement readiness**.

The real `shirakawago-shinhotaka-2027` trip now runs in this POC with schema v12, `modules: []`, no `legacy` block, and generate-only renderers. CI verifies D1-D9, Today Mode, Driving Mode, Trip Info, Attractions, Live Cam, trip-scoped state and the absence of Japan legacy runtime assets.

Round 5 documentation: `docs/round5-standard-parity-retirement.md`.

This repository is isolated from the production `yfgary/travelpilot` repository. Passing Round 5 does **not** authorize deleting production legacy files; production cutover and legacy cleanup remain separate later steps.
