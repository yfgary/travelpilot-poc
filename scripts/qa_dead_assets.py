#!/usr/bin/env python3
"""Regression guard for retired/unreferenced assets removed in Stage 5B/5C."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []

RETIRED = (
    "assets/app-v8-7-data.js",
    "assets/app-v8-7-ui.js",
    "assets/trip-enhancements-v2.js",
    "assets/bangkok-gallery-d1.css",
    "assets/bangkok-gallery-d2.css",
    "assets/bangkok-gallery-d3.css",
    "assets/bangkok-gallery-d4.css",
    "assets/bangkok-gallery-d5.css",
    "assets/bangkok-gallery-d6.css",
    "assets/bangkok-gallery-d7.css",
    "assets/bangkok-gallery-d8.css",
)

TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".md", ".py", ".yml", ".yaml", ".webmanifest"}
SKIP_DIRS = {".git", "node_modules"}
ALLOWED_DOC_REFERENCES = {
    "scripts/qa_dead_assets.py",
    "docs/legacy-loader-inventory.md",
}


def error(message: str) -> None:
    ERRORS.append(message)


for rel in RETIRED:
    if (ROOT / rel).exists():
        error(f"Retired asset still exists: {rel}")

for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
        continue
    if any(part in SKIP_DIRS for part in path.parts):
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel in ALLOWED_DOC_REFERENCES:
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for retired in RETIRED:
        name = Path(retired).name
        if retired in text or name in text:
            error(f"Reference to retired asset {name} remains in {rel}")

print("TravelPilot dead asset QA")
print(f"Retired assets: {len(RETIRED)}")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print(f"ERROR: {item}")
if ERRORS:
    sys.exit(1)
print("PASS")
