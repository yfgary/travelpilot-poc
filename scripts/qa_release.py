#!/usr/bin/env python3
"""Release-version and cache-buster consistency checks for TravelPilot."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        error(f"Missing required release file: {path}")
        return ""
    return p.read_text(encoding="utf-8")


def main() -> int:
    try:
        meta = json.loads(read("version.json"))
    except Exception as exc:
        error(f"Invalid version.json: {exc}")
        meta = {}

    version = str(meta.get("version", ""))
    if not re.fullmatch(r"v\d+\.\d+\.\d+", version):
        error(f"Invalid release version: {version!r}")
        plain = ""
    else:
        plain = version[1:]

    updated = str(meta.get("updated", ""))
    date_match = re.match(r"(\d{4})-(\d{2})-(\d{2})T", updated)
    cache_date = "".join(date_match.groups()) if date_match else ""
    if not cache_date:
        error("version.json updated timestamp is missing or invalid")

    context = read("assets/multi-trip-context-v1.js")
    runtime = read("assets/multi-trip-runtime-v1.js")
    shim = read("assets/attraction-info.js")
    live_entry = read("assets/multi-trip-live-entry-v1.js")
    index = read("index.html")
    itinerary = read("itinerary.html")
    trip_info = read("trip-info.html")
    attractions = read("attractions.html")
    live = read("live.html")
    manifest = read("manifest.webmanifest")
    sw = read("sw.js")

    if plain:
        checks = (
            ("context APP_VERSION", f"const APP_VERSION='{version}'", context),
            ("runtime APP_VERSION", f"const APP_VERSION='{plain}'", runtime),
            ("homepage manifest pin", f"manifest.webmanifest?v={plain}", index),
            ("homepage CSS pin", f"assets/travelpilot-home.css?v={plain}", index),
            ("homepage context pin", f"assets/multi-trip-context-v1.js?v={plain}", index),
            ("homepage icon pin", f"assets/images/travelpilot-icon-exact.jpg?v={plain}", index),
            ("manifest icon pin", f"assets/images/travelpilot-icon-exact.jpg?v={plain}", manifest),
            ("itinerary runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", itinerary),
            ("Trip Info runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", trip_info),
            ("Attractions runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", attractions),
            ("Live runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", live),
            ("compatibility shim runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", shim),
            ("Service Worker cached Live runtime pin", f"assets/multi-trip-runtime-v1.js?v={plain}", sw),
            ("Live entry context pin", f"assets/multi-trip-context-v1.js?v={plain}", live_entry),
        )
        for label, marker, source in checks:
            if marker not in source:
                error(f"{label} does not match {version}: {marker}")

        if index.count(f"assets/images/travelpilot-icon-exact.jpg?v={plain}") < 3:
            error("Homepage icon/favicon/apple-touch cache-busters are not all on the current release")
        if manifest.count(f"assets/images/travelpilot-icon-exact.jpg?v={plain}") != 2:
            error("Manifest icon cache-busters are not exactly aligned to the current release")

    if version and cache_date:
        cache_marker = f"const CACHE_NAME='travelpilot-{version}-{cache_date}'"
        if cache_marker not in sw:
            error(f"Service Worker cache name does not match release/date: {cache_marker}")

    previous = "10.16.0"
    release_owned = (
        ("index.html", index),
        ("itinerary.html", itinerary),
        ("trip-info.html", trip_info),
        ("attractions.html", attractions),
        ("live.html", live),
        ("manifest.webmanifest", manifest),
        ("sw.js", sw),
        ("assets/multi-trip-context-v1.js", context),
        ("assets/multi-trip-runtime-v1.js", runtime),
        ("assets/attraction-info.js", shim),
        ("assets/multi-trip-live-entry-v1.js", live_entry),
    )
    if plain and plain != previous:
        for p, text in release_owned:
            if previous in text:
                error(f"Stale prior POC release pin {previous} remains in {p}")

    print("TravelPilot release QA")
    print(f"Release: {version or 'UNKNOWN'}")
    print(f"Errors: {len(ERRORS)}")
    for item in ERRORS:
        print(f"ERROR: {item}")
    if ERRORS:
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
