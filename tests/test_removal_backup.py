"""Sicherung beim Entfernen der Integration und Wiederherstellen beim Einrichten (removal_backup.py)."""

import json
from datetime import datetime

from smartlists import removal_backup as rb
from smartlists.const import (
    LEGACY_UNIQUE_ID,
    SUBENTRY_COMBINED,
    SUBENTRY_OWN,
    SUBENTRY_OWN_GROUP,
)

SUBS = [
    {"subentry_id": "S1", "subentry_type": SUBENTRY_COMBINED, "title": "Einkauf", "unique_id": None,
     "data": {"sources": ["todo.a", "todo.b"]}},
    {"subentry_id": "S2", "subentry_type": SUBENTRY_COMBINED, "title": "Alt", "unique_id": None,
     "data": {"sources": ["todo.c"], LEGACY_UNIQUE_ID: "entry-1"}},
    {"subentry_id": "S3", "subentry_type": SUBENTRY_OWN_GROUP, "title": "Eigene Listen · Anna", "unique_id": "own:u1",
     "data": {"owner": "u1", "lists": {"L1": {"name": "Anna"}, "L2": {"name": "Geschenke"}}}},
    {"subentry_id": "S4", "subentry_type": SUBENTRY_OWN, "title": "Uralt", "unique_id": None, "data": {}},
]


def test_store_keys_cover_every_list():
    assert rb.store_keys(SUBS) == ["smartlists.S1", "smartlists.entry-1", "smartlists.own.L1", "smartlists.own.L2",
                                   "smartlists.own.S4"]


def test_build_and_summary():
    backup = rb.build("4.0.0", {"x": 1}, SUBS, {"smartlists.own.L1": {"items": [1]}, "smartlists.S1": None},
                      now=datetime(2026, 11, 17, 18, 5, 0))  # noqa: DTZ001
    assert rb.valid(backup)
    assert backup["at"] == "2026-11-17T18:05:00"
    assert backup["stores"] == {"smartlists.own.L1": {"items": [1]}}  # leere Speicher fehlen
    assert rb.summary(backup) == {"own": 3, "combined": 2}
    assert not rb.valid({"kind": "etwas anderes"}) and not rb.valid(None)


def test_restore_keeps_keys_of_combined_lists():
    subs = rb.subentries_for_restore(rb.build("4.0.0", {}, SUBS, {}))
    assert [s["subentry_type"] for s in subs] == [SUBENTRY_COMBINED, SUBENTRY_COMBINED, SUBENTRY_OWN_GROUP]
    # die kombinierte Liste behält ihren Schlüssel: neue Kennung des Unter-Eintrags, alte Speicherdatei und Entität
    assert subs[0]["data"][LEGACY_UNIQUE_ID] == "S1"
    assert subs[1]["data"][LEGACY_UNIQUE_ID] == "entry-1"
    assert subs[2]["data"]["lists"].keys() == {"L1", "L2"} and subs[2]["unique_id"] == "own:u1"
    assert all(set(s) == {"subentry_type", "title", "data", "unique_id"} for s in subs)
    assert SUBS[0]["data"].get(LEGACY_UNIQUE_ID) is None  # das Original bleibt unverändert


def test_files_newest_valid_wins_and_old_ones_are_pruned(tmp_path):
    assert rb.newest(str(tmp_path)) is None
    for day in range(1, 9):
        backup = rb.build("4.0.0", {}, SUBS, {}, now=datetime(2026, 11, day, 12, 0, 0))  # noqa: DTZ001
        path = rb.write_file(str(tmp_path), backup)
    assert path.endswith("smartlists_backup_2026-11-08_120000.json")
    assert len(list(tmp_path.glob("smartlists_backup_*.json"))) == rb.KEEP
    (tmp_path / "smartlists_backup_2026-12-01_000000.json").write_text("kaputt", encoding="utf-8")
    (tmp_path / "smartlists_backup_2026-11-30_000000.json").write_text(
        json.dumps(rb.build("4.0.0", {}, [], {})), encoding="utf-8")  # ohne Listen: nicht anbieten
    found = rb.newest(str(tmp_path))
    assert found and found[0].endswith("2026-11-08_120000.json") and found[1]["at"] == "2026-11-08T12:00:00"


def test_report_lists_exactly_what_was_saved():
    stores = {
        "smartlists.own.L1": {"items": [{"uid": "1", "summary": "Milch", "status": "needs_action"},
                                        {"uid": "2", "summary": "Brot", "status": "completed"}]},
        "smartlists.own.L2": {"items": []},
        "smartlists.S1": {"overrides": {}},
        "smartlists.learning": {"rights": {"share": True}},
        "smartlists.notes": {"notes": []},
    }
    subs = [dict(s) for s in SUBS]
    subs[2] = {**subs[2], "data": {"owner": "u1", "lists": {"L1": {"title": "Anna", "shares": {"u2": "editor"}},
                                                            "L2": {"title": "Geschenke", "shares": {}}}}}
    backup = rb.build("4.0.0", {"a": 1, "b": 2}, subs, stores, reason="manual", users={"u1": "Anna"},
                      foreign={"todo.a": {"name": "Liste A", "items": [{"summary": "x"}, {"summary": "y"}]}})
    assert backup["reason"] == "manual"
    report = rb.report(backup, "/config/x.json", 2048, True)
    assert report["path"] == "/config/x.json" and report["bytes"] == 2048 and report["verified"] is True
    assert report["own"][0] == {"title": "Anna", "owner": "Anna", "shares": 1, "items": 2, "open": 1}
    assert report["own"][1]["title"] == "Geschenke" and report["own"][1]["items"] == 0
    assert [c["title"] for c in report["combined"]] == ["Einkauf", "Alt"] and report["combined"][0]["sources"] == 2
    assert report["foreign"] == [{"entity_id": "todo.a", "name": "Liste A", "items": 2}]
    assert report["settings"] == 2 and report["items"] == 2
    assert report["more"] == ["learning", "notes"]


def test_written_file_matches_and_verifies(tmp_path):
    backup = rb.build("4.0.0", {}, SUBS, {"smartlists.own.L1": {"items": [{"uid": "1", "summary": "Äpfel"}]}},
                      now=datetime(2026, 11, 17, 18, 5, 0))  # noqa: DTZ001
    path = rb.write_file(str(tmp_path), backup)
    size, ok = rb._verify(path, backup)
    assert ok and size > 100
    (tmp_path / "kaputt.json").write_text("{", encoding="utf-8")
    assert rb._verify(str(tmp_path / "kaputt.json"), backup) == (0, False)
