"""Ablage unter .storage/smartlists/: Umzug der alten Dateien, Aufräumen, Entfernen der Integration."""

import json
import re
import tempfile
from pathlib import Path

from smartlists import storage

BASE = Path(__file__).resolve().parent.parent / "custom_components" / "smartlists"


def _old_install(config: Path) -> None:
    store = config / ".storage"
    store.mkdir(parents=True)
    for name, data in (("extras", {"prices": {"milch": 1.19}}), ("own.abc", {"items": [{"uid": "1", "summary": "Milch"}]}),
                       ("01KOMBI", {"checked": ["x"]}), ("app_backups", {"backups": {}})):
        (store / f"smartlists.{name}").write_text(json.dumps({"version": 1, "minor_version": 1, "key": f"smartlists.{name}", "data": data}), encoding="utf-8")
    (store / "core.config").write_text("{}", encoding="utf-8")                      # fremde Datei: bleibt
    (config / "smartlists_backup_2026-11-17_201500.json").write_text(json.dumps({"kind": "smartlists-removal-backup"}), encoding="utf-8")


def test_keys():
    assert storage.key("extras") == "smartlists/extras" and storage.key("own.abc") == "smartlists/own.abc"
    assert storage.key("app_backups") == "smartlists/backups/apps.old"
    assert storage.key_of("smartlists.extras") == "smartlists/extras" and storage.key_of("smartlists.app_backups") == "smartlists/backups/apps.old"


def test_old_files_move_into_the_subfolder():
    with tempfile.TemporaryDirectory() as tmp:
        config = Path(tmp)
        _old_install(config)
        report = storage.migrate_files(str(config))
        assert sorted(report["moved"]) == ["smartlists.01KOMBI", "smartlists.app_backups", "smartlists.extras", "smartlists.own.abc",
                                           "smartlists_backup_2026-11-17_201500.json"]
        assert report["failed"] == [] and report["kept_newer"] == []
        root = config / ".storage" / "smartlists"
        moved = json.loads((root / "extras").read_text(encoding="utf-8"))
        assert moved["data"] == {"prices": {"milch": 1.19}} and moved["key"] == "smartlists/extras"
        assert json.loads((root / "backups" / "apps.old").read_text(encoding="utf-8"))["key"] == "smartlists/backups/apps.old"
        assert (root / "own.abc").is_file() and (root / "01KOMBI").is_file()
        assert (root / "backups" / "integration" / "smartlists_backup_2026-11-17_201500.json").is_file()
        assert (root / "backups" / "integration" / "before-move" / "smartlists.extras").is_file()     # Kopie für ein Zurück
        assert sorted(p.name for p in (config / ".storage").iterdir()) == ["core.config", "smartlists"]  # nichts Altes mehr, Fremdes bleibt
        assert not list(config.glob("smartlists_backup_*"))
        assert storage.migrate_files(str(config)) == {"moved": [], "kept_newer": [], "failed": []}        # zweiter Start: nichts zu tun


def test_a_newer_file_in_the_new_place_wins():
    with tempfile.TemporaryDirectory() as tmp:
        config = Path(tmp)
        _old_install(config)
        root = config / ".storage" / "smartlists"
        root.mkdir()
        (root / "extras").write_text(json.dumps({"version": 1, "key": "smartlists/extras", "data": {"prices": {"milch": 1.29}}}), encoding="utf-8")
        report = storage.migrate_files(str(config))
        assert report["kept_newer"] == ["smartlists.extras"] and report["failed"] == []
        assert json.loads((root / "extras").read_text(encoding="utf-8"))["data"] == {"prices": {"milch": 1.29}}
        assert (root / "backups" / "integration" / "leftover" / "smartlists.extras").is_file()
        assert not (config / ".storage" / "smartlists.extras").exists()


def test_a_broken_file_stays_where_it_is():
    with tempfile.TemporaryDirectory() as tmp:
        config = Path(tmp)
        _old_install(config)
        (config / ".storage" / "smartlists.shares").write_text("{kaputt", encoding="utf-8")
        report = storage.migrate_files(str(config))
        assert len(report["failed"]) == 1 and report["failed"][0].startswith("smartlists.shares")
        assert (config / ".storage" / "smartlists.shares").is_file()                    # nicht angefasst
        assert (config / ".storage" / "smartlists" / "extras").is_file()                # der Rest ist umgezogen


def test_files_of_deleted_lists_are_set_aside_and_removal_keeps_only_backups():
    with tempfile.TemporaryDirectory() as tmp:
        config = Path(tmp)
        _old_install(config)
        storage.migrate_files(str(config))
        root = config / ".storage" / "smartlists"
        assert storage.set_aside_unknown(str(config), {"extras", "own.abc"}) == ["01KOMBI"]
        assert not (root / "01KOMBI").exists() and len(list((root / "backups" / "deleted").glob("*01KOMBI.json"))) == 1
        assert storage.set_aside(str(config), "own.abc", "Wocheneinkauf / Test")
        assert [p.name for p in (root / "backups" / "deleted").glob("*Wocheneinkauf*")]
        assert storage.remove_all_but_backups(str(config)) == ["extras"]
        assert sorted(p.name for p in root.iterdir()) == ["backups"]
        assert (root / "backups" / "apps.old").is_file() and (root / "backups" / "integration").is_dir()


def test_every_store_is_registered():
    """Sonst würde eine neue Speicherdatei beim Start für den Rest einer gelöschten Liste gehalten."""
    used = set()
    for path in BASE.glob("*.py"):
        used |= set(re.findall(r'storage\.key\("([a-z_]+)"\)', path.read_text(encoding="utf-8")))
    # app_backups: alte Datei unter backups/ (wird dort nie für eine gelöschte Liste gehalten)
    assert used and used - {"app_backups"} <= set(storage.GLOBAL_STORES), used - set(storage.GLOBAL_STORES)


def test_watch_files_one_per_user(tmp_path):
    assert storage.watch_files(str(tmp_path)) == []
    folder = storage.root(str(tmp_path)) / storage.WATCH_DIR
    folder.mkdir(parents=True)
    (folder / "abc123").write_text("{}", encoding="utf-8")
    (folder / "abc123.tmp").write_text("{}", encoding="utf-8")
    assert storage.watch_files(str(tmp_path)) == ["abc123"]
    assert storage.watch_name("ab/../c 1-2_3") == "abc1-2_3"
    # der Ordner gilt beim Aufräumen nicht als Rest einer gelöschten Liste, beim Entfernen verschwindet er
    assert storage.set_aside_unknown(str(tmp_path), set()) == []
    assert storage.remove_all_but_backups(str(tmp_path)) == ["watch"]


def test_old_app_backup_file_makes_room_for_the_folder():
    with tempfile.TemporaryDirectory() as tmp:
        backups = Path(tmp) / ".storage" / "smartlists" / "backups"
        backups.mkdir(parents=True)
        (backups / "apps").write_text("{}", encoding="utf-8")
        assert storage.app_backup_files(tmp) == []
        assert (backups / "apps.old").is_file() and not (backups / "apps").exists()
        (backups / "apps").mkdir()
        (backups / "apps" / "anna").write_text("{}", encoding="utf-8")
        assert storage.app_backup_files(tmp) == ["anna"]
