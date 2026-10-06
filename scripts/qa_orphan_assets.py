#!/usr/bin/env python3
"""Fail when a top-level JS/CSS asset has no literal runtime reference."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
RUNTIME_SUFFIXES = {".html", ".js", ".css", ".json", ".webmanifest"}
ERRORS: list[str] = []

runtime_files: list[Path] = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in RUNTIME_SUFFIXES:
        continue
    if ".git" in path.parts or "node_modules" in path.parts:
        continue
    runtime_files.append(path)


def refs_for(name: str, *, ignore: Path | None = None) -> list[str]:
    refs: list[str] = []
    for path in runtime_files:
        if ignore is not None and path == ignore:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if name in text:
            refs.append(path.relative_to(ROOT).as_posix())
    return refs


assets = sorted(
    p for p in ASSETS.iterdir()
    if p.is_file() and p.suffix.lower() in {".js", ".css"}
)
for asset in assets:
    if not refs_for(asset.name, ignore=asset):
        ERRORS.append(f"Unreferenced JS/CSS asset: {asset.relative_to(ROOT).as_posix()}")

aggregate = ASSETS / "bangkok-day-galleries-v1.css"
bangkok_trip = ROOT / "trips" / "bangkok-2026" / "trip.json"
if not aggregate.exists():
    ERRORS.append("Bangkok aggregate gallery CSS is missing")
elif aggregate.name not in bangkok_trip.read_text(encoding="utf-8"):
    ERRORS.append("Bangkok trip no longer references bangkok-day-galleries-v1.css")

print("TravelPilot orphan asset QA")
print(f"JS/CSS assets scanned: {len(assets)}")
print(f"Errors: {len(ERRORS)}")
for item in ERRORS:
    print(f"ERROR: {item}")
if ERRORS:
    sys.exit(1)
print("PASS")
