#!/usr/bin/env python3
"""Focused regression checks for the shared departure-checklist migration."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
DEFAULT_TRIP = "shirakawago-shinhotaka-2027"
EXPECTED_JAPAN_COUNT = 96
EXPECTED_JAPAN_IDS = {
    "pack_docs", "pack_cash", "pack_sim", "pack_pen", "pack_wallet", "pack_visa", "pack_master", "pack_unionpay",
    "pack_ski_gloves", "pack_decathlon_gloves", "pack_hats", "pack_scarves", "pack_regular_socks", "pack_thick_socks", "pack_coat", "pack_sleepwear", "pack_underwear", "pack_outfits_min", "pack_base_layers", "pack_windy_thermal", "pack_long_sleeves", "pack_snow_pants", "pack_gary_jeans", "pack_windy_skirt",
    "pack_electric_toothbrush", "pack_sensitive_toothpaste", "pack_disposable_toothpaste", "pack_disposable_toothbrush", "pack_cups", "pack_conditioner", "pack_shampoo", "pack_comb", "pack_hairclip",
    "pack_hangers", "pack_clothesline", "pack_laundrypods", "pack_bathtowels", "pack_hairtowel", "pack_slippers", "pack_garbagebags",
    "pack_masks", "pack_earplugs", "pack_disposable_gloves", "pack_wetwipes", "pack_tissues", "pack_boxtissue", "pack_toiletroll", "pack_disinfectspray", "pack_sanitizer",
    "pack_sunglasses", "pack_lipbalm", "pack_skincare_set", "pack_handcream", "pack_bodylotion", "pack_vaseline", "pack_eczema_cream", "pack_deodorant", "pack_eyebrow", "pack_makeup", "pack_makeup_wipes", "pack_warmers", "pack_nailclipper", "pack_sewing", "pack_toothpicks", "pack_floss", "pack_sunscreen", "pack_umbrellas", "pack_lunchbox", "pack_forks", "pack_fruitknife", "pack_thermos",
    "pack_thermalbags", "pack_luggagescale", "pack_sleepmed", "pack_panadol", "pack_trumpet", "pack_cold_drink", "pack_plasters", "pack_antiseptic_wipes", "pack_antiseptic_liquid", "pack_qingreku", "pack_baoanxin", "pack_ecobag",
    "pack_batteries", "pack_selfiestick", "pack_tripod", "pack_camera", "pack_adapters", "pack_kettle", "pack_stove", "pack_powerbanks", "pack_cctv", "pack_memorycard", "pack_dashcam", "pack_dashcam_mount", "pack_cables",
}


def error(message: str) -> None:
    ERRORS.append(message)


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        error(f"Missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8")


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        error(f"Invalid JSON: {path.relative_to(ROOT)} ({exc})")
        return None


def validate_checklist(label: str, obj) -> set[str]:
    if not isinstance(obj, dict):
        error(f"{label}: checklist must be an object")
        return set()
    groups = obj.get("groups")
    if not isinstance(groups, list) or not groups:
        error(f"{label}: checklist groups are missing")
        return set()
    ids: list[str] = []
    for gi, group in enumerate(groups, 1):
        if not isinstance(group, dict):
            error(f"{label}: group #{gi} is not an object")
            continue
        if not str(group.get("title") or "").strip():
            error(f"{label}: group #{gi} has no title")
        items = group.get("items")
        if not isinstance(items, list) or not items:
            error(f"{label}: group #{gi} has no items")
            continue
        for ii, item in enumerate(items, 1):
            if not isinstance(item, dict):
                error(f"{label}: group #{gi} item #{ii} is not an object")
                continue
            item_id = str(item.get("id") or "").strip()
            item_label = str(item.get("label") or "").strip()
            if not item_id:
                error(f"{label}: group #{gi} item #{ii} has no stable id")
            else:
                ids.append(item_id)
            if not item_label:
                error(f"{label}: group #{gi} item #{ii} has no label")
    if len(ids) != len(set(ids)):
        error(f"{label}: checklist item ids must be unique")
    return set(ids)


def check_trip_data() -> None:
    registry = load(ROOT / "trips" / "registry.json")
    if not isinstance(registry, dict):
        return
    for trip in registry.get("trips") or []:
        if not isinstance(trip, dict) or not trip.get("id"):
            continue
        trip_id = str(trip["id"])
        config_path = ROOT / str(trip.get("config") or f"trips/{trip_id}/trip.json")
        config = load(config_path)
        if not isinstance(config, dict):
            continue
        features = config.get("features") or {}
        if features.get("packingChecklist") is not True:
            continue
        data_files = config.get("dataFiles") or {}
        trip_dir = config_path.parent
        obj = None
        dedicated = data_files.get("departureChecklist")
        if isinstance(dedicated, str):
            path = trip_dir / dedicated
            if not path.is_file():
                error(f"{trip_id}: dedicated checklist file is missing: {dedicated}")
            else:
                obj = load(path)
        if obj is None:
            info_name = data_files.get("tripInfo", "trip-info.json")
            info = load(trip_dir / info_name)
            if isinstance(info, dict):
                obj = info.get("departureChecklist")
        ids = validate_checklist(trip_id, obj)
        if trip_id == DEFAULT_TRIP:
            if dedicated != "departure-checklist.json":
                error("Japan 2027 must use canonical departure-checklist.json")
            if not isinstance(obj, dict) or obj.get("expectedCount") != EXPECTED_JAPAN_COUNT:
                error("Japan 2027 departure-checklist.json must declare expectedCount=96")
            if len(ids) != EXPECTED_JAPAN_COUNT:
                error(f"Japan 2027 checklist must contain exactly {EXPECTED_JAPAN_COUNT} items; found {len(ids)}")
            missing = EXPECTED_JAPAN_IDS - ids
            extra = ids - EXPECTED_JAPAN_IDS
            if missing:
                error("Japan 2027 checklist lost canonical 96-item ids: " + ", ".join(sorted(missing)))
            if extra:
                error("Japan 2027 checklist has unexpected ids: " + ", ".join(sorted(extra)))


def check_runtime() -> None:
    runtime = read("assets/multi-trip-runtime-v1.js")
    shim = read("assets/attraction-info.js")
    renderer = read("assets/multi-trip-departure-checklist-v1.js")
    sync = read("assets/multi-trip-checklist-sync-v1.js")
    hotfix = read("assets/trip-v9-hotfix.js")
    sw = read("sw.js")

    if (ROOT / "assets" / "checklist-sync.js").exists():
        error("Retired Japan-only checklist-sync.js still exists")
    if "assets/checklist-sync.js" in loader:
        error("Trip loader still references retired checklist-sync.js")

    blocks = re.findall(r"const (?:tripInfoScripts|genericTripInfoScripts)=commonHead\.concat\(\[(.*?)\]\);", loader, re.S)
    if len(blocks) != 2:
        error("Could not identify both Trip Info loader blocks")
    else:
        for idx, block in enumerate(blocks, 1):
            for required in ("multi-trip-departure-checklist-v1.js", "multi-trip-checklist-sync-v1.js"):
                if required not in block:
                    error(f"Trip Info runtime block #{idx} is missing {required}")

    for required in (
        "all('departureChecklist')",
        "LEGACY_LOCAL='japanWinter2027DepartureChecklistV1'",
        "LEGACY_SPLIT_MAP",
        "expandLegacyState",
        "multitrip:departurerendered",
        "departureChecklistCount",
    ):
        if required not in renderer:
            error(f"Shared checklist renderer is missing migration/runtime guard: {required}")
    if "ensureDepartureChecklist" in hotfix or "DATA.departureChecklist" in hotfix:
        error("trip-v9-hotfix.js still owns the legacy Japan departure checklist")

    for required in (
        "LEGACY_LOCAL='japanWinter2027DepartureChecklistV1'",
        "LEGACY_SPLIT_MAP",
        "expandLegacyState",
        "legacyJapanRemote",
        "remoteId=id=>`${tid()}::${id}`",
        ".in('item_id',lookup)",
        "mergeMissing(remote,legacy.state,keys)",
    ):
        if required not in sync:
            error(f"Shared checklist sync is missing legacy-state migration guard: {required}")

    for required in (
        "./assets/multi-trip-departure-checklist-v1.js",
        "./assets/multi-trip-checklist-sync-v1.js",
        "./trips/shirakawago-shinhotaka-2027/departure-checklist.json",
        "./trips/shirakawago-shinhotaka-2027/trip.json",
    ):
        if required not in sw:
            error(f"Service worker CORE is missing offline checklist asset: {required}")


def main() -> int:
    check_trip_data()
    check_runtime()
    print("TravelPilot checklist QA")
    print(f"Errors: {len(ERRORS)}")
    for item in ERRORS:
        print(f"ERROR: {item}")
    if ERRORS:
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
