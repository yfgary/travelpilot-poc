#!/usr/bin/env python3
"""Regression guard for retired trip-page update popup code."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


retired_tokens = (
    "tripv2UpdatePrompt",
    "tripv2ReloadBtn",
    "tripv2UpdateText",
    "multiTripUpdatePrompt",
    "multiTripRetiredUpdateUi",
    "suppressRetiredUpdateUi",
    "ensureUpdatePrompt",
    ".tripv2-update",
)

runtime_files = [
    ROOT / "itinerary.html",
    ROOT / "trip-info.html",
    ROOT / "live.html",
    ROOT / "assets" / "multi-trip-context-v1.js",
]

for path in runtime_files:
    text = path.read_text(encoding="utf-8")
    for token in retired_tokens:
        if token in text:
            error(f"Retired updater token remains in {path.relative_to(ROOT)}: {token}")

for page in ("itinerary.html", "trip-info.html", "live.html"):
    text = (ROOT / page).read_text(encoding="utf-8")
    if "tripv2NetworkStatus" not in text or "function ensureNetworkStatus" not in text:
        error(f"{page}: online/offline status indicator was removed with the updater")
    if "controllerchange" in text:
        error(f"{page}: retired Service Worker controllerchange listener remains")

context = (ROOT / "assets" / "multi-trip-context-v1.js").read_text(encoding="utf-8")
if "controllerchange" not in context:
    # The canonical runtime intentionally keeps only a comment documenting that
    # automatic controllerchange reloads are banned. This branch is informational.
    pass
if "there is no controllerchange listener and no automatic reload loop" not in context:
    error("Canonical runtime lost its explicit no-auto-reload contract")

print("TravelPilot retired updater QA")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print(f"ERROR: {item}")
if ERRORS:
    sys.exit(1)
print("PASS")
