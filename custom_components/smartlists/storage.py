"""Wo SmartLists seine Dateien ablegt: alles unter `.storage/smartlists/`.

    .storage/smartlists/<name>                       Speicherdateien (extras, learning, shares, own.<Kennung>, …)
    .storage/smartlists/backups/apps                 Sicherungen aus SmartLists Go
    .storage/smartlists/backups/integration/*.json   Sicherungen von SmartLists selbst (von Hand, beim Entfernen)
    .storage/smartlists/backups/integration/before-move/   Kopie der alten Dateien vom Umzug (für ein Zurück auf eine ältere Version)
    .storage/smartlists/backups/deleted/             Speicherdateien gelöschter Listen (die letzten KEEP_DELETED)

Bis 4.0.0-beta.11 lagen die Speicherdateien als `smartlists.<name>` direkt in `.storage` und die Sicherungen lose
im Konfigurations-Ordner. `migrate_files` zieht sie beim Start einmalig um: kopieren, die Kopie prüfen, erst dann
die alte Datei löschen. Schlägt etwas fehl, bleibt die alte Datei liegen und wird beim nächsten Start wieder versucht.

Wird die Integration entfernt, bleibt nur `backups/` liegen (`remove_all_but_backups`).

Sicherungsdateien nennen die Speicher weiter mit ihrem alten Namen (`smartlists.extras`) – so bleiben alte
Sicherungen lesbar; `key_of` übersetzt.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
from pathlib import Path
from typing import Any

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STORAGE_DIR = ".storage"
BACKUPS = "backups"
BACKUP_PREFIX = "smartlists_backup_"
KEEP_DELETED = 30
# Speicherdateien, die es einmal gibt (neben denen je Liste). JEDE neue Speicherdatei hier eintragen: was beim Start
# unter .storage/smartlists/ liegt und weder hier steht noch zu einer Liste gehört, gilt als Rest einer gelöschten
# Liste und wird nach backups/deleted/ gelegt (tests/test_storage.py prüft, dass nichts fehlt).
GLOBAL_STORES = ("learning", "notes", "shares", "public", "extras", "packs", "devices", "notify", "itemlog", "app_backups",
                 "offer_history")
# alte Namen, die einen eigenen neuen Platz bekommen (alles andere: smartlists.<rest> → smartlists/<rest>)
_SPECIAL = {"app_backups": f"{BACKUPS}/apps"}


def key(name: str) -> str:
    """Schlüssel für homeassistant.helpers.storage.Store: `key("extras")` → `smartlists/extras`."""
    return f"{DOMAIN}/{_SPECIAL.get(name, name)}"


def key_of(legacy: str) -> str:
    """Alter Name aus einer Sicherung (`smartlists.extras`) → heutiger Schlüssel."""
    return key(legacy[len(DOMAIN) + 1:]) if legacy.startswith(f"{DOMAIN}.") else legacy


def root(config_dir: str) -> Path:
    return Path(config_dir) / STORAGE_DIR / DOMAIN


def backup_dir(config_dir: str) -> Path:
    return root(config_dir) / BACKUPS / "integration"


def _same_json(a: Path, b: Path) -> bool:
    try:
        return json.loads(a.read_text(encoding="utf-8")) == json.loads(b.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False


def _move(old: Path, new: Path, new_key: str | None, report: dict[str, list[str]], leftover: Path) -> None:
    """Eine Datei umziehen. new_key: bei Speicherdateien den Schlüssel in der Datei mitziehen."""
    try:
        raw = old.read_text(encoding="utf-8")
        content: Any = json.loads(raw)
    except (OSError, ValueError) as err:
        report["failed"].append(f"{old.name}: {err}")
        return
    if isinstance(content, dict) and new_key and "key" in content:
        content["key"] = new_key
    try:
        if new.exists():
            # schon einmal umgezogen (Abbruch mittendrin) oder die neue Datei ist inzwischen in Gebrauch: die neue gilt
            if json.loads(new.read_text(encoding="utf-8")) != content:
                leftover.mkdir(parents=True, exist_ok=True)
                shutil.copy2(old, leftover / old.name)
                report["kept_newer"].append(old.name)
        else:
            new.parent.mkdir(parents=True, exist_ok=True)
            tmp = new.with_name(new.name + ".tmp")
            tmp.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
            if json.loads(tmp.read_text(encoding="utf-8")) != content:
                tmp.unlink(missing_ok=True)
                raise OSError("Kopie stimmt nicht mit dem Original überein")
            os.replace(tmp, new)
            report["moved"].append(old.name)
        old.unlink()
    except (OSError, ValueError) as err:
        report["failed"].append(f"{old.name}: {err}")


def migrate_files(config_dir: str) -> dict[str, list[str]]:
    """Alte Dateien nach `.storage/smartlists/` umziehen (blockierend – über den Executor aufrufen).
    Liefert, was passiert ist: moved, kept_newer (neue Datei gab es schon und sie war anders), failed."""
    report: dict[str, list[str]] = {"moved": [], "kept_newer": [], "failed": []}
    config = Path(config_dir)
    storage = config / STORAGE_DIR
    old_stores = sorted(p for p in storage.glob(f"{DOMAIN}.*") if p.is_file()) if storage.is_dir() else []
    old_backups = sorted(config.glob(f"{BACKUP_PREFIX}*.json"))
    if not old_stores and not old_backups:
        return report
    before = backup_dir(config_dir) / "before-move"
    try:
        before.mkdir(parents=True, exist_ok=True)
        for old in old_stores:
            if not (before / old.name).exists():
                shutil.copy2(old, before / old.name)
    except OSError as err:  # ohne Kopie wird nichts angefasst
        report["failed"].append(f"before-move: {err}")
        return report
    leftover = backup_dir(config_dir) / "leftover"
    for old in old_stores:
        name = old.name[len(DOMAIN) + 1:]
        new_key = key(name)
        _move(old, storage / new_key, new_key, report, leftover)
    for old in old_backups:
        _move(old, backup_dir(config_dir) / old.name, None, report, leftover)
    return report


def set_aside(config_dir: str, name: str, label: str = "") -> str | None:
    """Speicherdatei einer gelöschten Liste nach backups/deleted/ legen (statt sie lose liegen zu lassen).
    Die letzten KEEP_DELETED bleiben. Liefert den neuen Pfad."""
    src = Path(config_dir) / STORAGE_DIR / key(name)
    if not src.is_file():
        return None
    folder = root(config_dir) / BACKUPS / "deleted"
    try:
        folder.mkdir(parents=True, exist_ok=True)
        from datetime import datetime

        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in label)[:40]
        dst = folder / f"{datetime.now().strftime('%Y-%m-%d_%H%M%S')}_{safe + '_' if safe else ''}{name}.json"
        os.replace(src, dst)
        for old in sorted(folder.glob("*.json"), reverse=True)[KEEP_DELETED:]:
            old.unlink(missing_ok=True)
        return str(dst)
    except OSError:
        _LOGGER.warning("Speicherdatei %s nicht beiseitegelegt", name, exc_info=True)
        return None


def set_aside_unknown(config_dir: str, known: set[str]) -> list[str]:
    """Speicherdateien, zu denen es keine Liste mehr gibt (früher gelöschte Listen), nach backups/deleted/ legen."""
    base = root(config_dir)
    moved: list[str] = []
    if not base.is_dir():
        return moved
    for path in sorted(base.iterdir()):
        if path.is_file() and path.name not in known and not path.name.endswith(".tmp"):
            if set_aside(config_dir, path.name, "unknown"):
                moved.append(path.name)
    return moved


def remove_all_but_backups(config_dir: str) -> list[str]:
    """Integration entfernt: alles unter `.storage/smartlists/` löschen, nur `backups/` bleibt. Liefert, was weg ist."""
    gone: list[str] = []
    base = root(config_dir)
    if not base.is_dir():
        return gone
    for path in sorted(base.iterdir()):
        if path.name == BACKUPS:
            continue
        try:
            shutil.rmtree(path) if path.is_dir() else path.unlink()
            gone.append(path.name)
        except OSError:
            _LOGGER.warning("%s nicht gelöscht", path, exc_info=True)
    return gone
