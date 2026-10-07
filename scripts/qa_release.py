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
    except Exception as exc:  # noqa: BLE001 - QA should report malformed metadata
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
    index = read("index.html")
    manifest = read("manifest.webmanifest")
    sw = read("sw.js")
    loader = read("assets/attraction-info.js")  # legacy loader pin is migration-owned, not release-owned
    live_entry = read("assets/multi-trip-live-entry-v1.js")

    if plain:
        expected = {
            "runtime APP_VERSION": f"const APP_VERSION='{version}'",
            "homepage manifest pin": f"manifest.webmanifest?v={plain}",
            "homepage CSS pin": f"assets/travelpilot-home.css?v={plain}",
            "homepage runtime pin": f"assets/multi-trip-context-v1.js?v={plain}",
            "homepage icon pin": f"assets/images/travelpilot-icon-exact.jpg?v={plain}",
            "manifest icon pin": f"assets/images/travelpilot-icon-exact.jpg?v={plain}",
            "Live Cam injected shim pin": f"assets/multi-trip-live-entry-v1.js?v={plain}",
            "Live Cam entry runtime pin": f"assets/multi-trip-context-v1.js?v={plain}",
        }
        checks = {
            "runtime APP_VERSION": context,
            "homepage manifest pin": index,
            "homepage CSS pin": index,
            "homepage runtime pin": index,
            "homepage icon pin": index,
            "manifest icon pin": manifest,
            "Live Cam injected shim pin": sw,
            "Live Cam entry runtime pin": live_entry,
        }
        for label, marker in expected.items():
            if marker not in checks[label]:
                error(f"{label} does not match {version}: {marker}")

        if index.count(f"assets/images/travelpilot-icon-exact.jpg?v={plain}") < 3:
            error("Homepage icon/favicon/apple-touch cache-busters are not all on the current release")
        if manifest.count(f"assets/images/travelpilot-icon-exact.jpg?v={plain}") != 2:
            error("Manifest icon cache-busters are not exactly aligned to the current release")

    if version and cache_date:
        cache_marker = f"const CACHE_NAME='travelpilot-{version}-{cache_date}'"
        if cache_marker not in sw:
            error(f"Service Worker cache name does not match release/date: {cache_marker}")

    # Guard against accidentally shipping the immediately previous production pin
    # in files whose cache-busters are release-owned rather than module-owned.
    previous = "10.13.3"
    for path, text in (
        ("index.html", index),
        ("manifest.webmanifest", manifest),
        ("sw.js", sw),
        ("assets/multi-trip-context-v1.js", context),
        ("assets/attraction-info.js", loader),
        ("assets/multi-trip-live-entry-v1.js", live_entry),
    ):
        if previous in text:
            error(f"Stale production release pin {previous} remains in {path}")

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
