"""Sicherung von SmartLists: von Hand, beim Entfernen der Integration – und Wiederherstellen beim Einrichten.

Wer SmartLists unter „Geräte & Dienste“ löscht, verliert sonst seine eigenen Listen: ihre Namen, Besitzer und
Freigaben stehen im Eintrag der Integration, und der ist danach weg. Deshalb schreibt SmartLists im Moment des
Löschens alles in eine Datei im Konfigurations-Ordner und meldet, wo sie liegt. Dieselbe Sicherung lässt sich
jederzeit von Hand anlegen (Einstellungen der Karte oder Dienst `smartlists.create_backup`); danach sagt ein
Bericht, was genau darin steht. Der Einrichtungs-Assistent findet die Datei und bietet an, die Listen zurückzuholen.

In der Datei steht alles, was SmartLists selbst speichert: der Eintrag (Einstellungen, alle Listen mit Besitzern und
Freigaben), die Artikel der eigenen Listen, die Häkchen der kombinierten Listen, Rechte, gemerkte Kategorien und
Verlauf, Notizen, Freigabe-Links, Merkliste, Vorlagen, gekoppelte Geräte, Benachrichtigungen. Dazu – nur zur
Ansicht, weil sie anderen Integrationen gehören – die Artikel der Quell-Listen."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from . import storage
from .const import (
    DOMAIN,
    LEGACY_UNIQUE_ID,
    STORAGE_VERSION,
    SUBENTRY_COMBINED,
    SUBENTRY_OWN,
    SUBENTRY_OWN_GROUP,
)

KIND = "smartlists-removal-backup"
PREFIX = "smartlists_backup_"
KEEP = 5  # so viele Sicherungen bleiben liegen, ältere werden aufgeräumt
# Speicherdateien, die es einmal gibt (neben denen je Liste)
GLOBAL_STORES = storage.GLOBAL_STORES
NOTIFICATION_ID = "smartlists_removed"

_TEXT = {
    "de": ("SmartLists wurde entfernt",
           "Deine Listen sind gesichert: `{path}`\n\nRichtest du SmartLists erneut ein, kannst du sie dort wiederherstellen."),
    "en": ("SmartLists was removed",
           "Your lists are backed up: `{path}`\n\nWhen you set up SmartLists again, you can restore them there."),
    "fr": ("SmartLists a été supprimé",
           "Tes listes sont sauvegardées : `{path}`\n\nSi tu configures de nouveau SmartLists, tu pourras les restaurer."),
    "es": ("SmartLists se ha eliminado",
           "Tus listas están guardadas: `{path}`\n\nSi vuelves a configurar SmartLists, podrás restaurarlas."),
    "it": ("SmartLists è stato rimosso",
           "Le tue liste sono salvate: `{path}`\n\nSe configuri di nuovo SmartLists, potrai ripristinarle."),
    "pl": ("SmartLists zostało usunięte",
           "Twoje listy są zapisane: `{path}`\n\nPrzy ponownej konfiguracji SmartLists można je przywrócić."),
}


def store_keys(subentries: list[dict[str, Any]]) -> list[str]:
    """Namen der Speicherdateien aller Listen: kombinierte unter ihrem Schlüssel, eigene unter own.<Kennung>."""
    keys: list[str] = []
    for sub in subentries:
        data = sub.get("data") or {}
        kind = sub.get("subentry_type")
        if kind == SUBENTRY_OWN_GROUP:
            keys += [f"{DOMAIN}.own.{list_id}" for list_id in (data.get("lists") or {})]
        elif kind == SUBENTRY_OWN:
            keys.append(f"{DOMAIN}.own.{sub.get('subentry_id')}")
        elif kind == SUBENTRY_COMBINED:
            keys.append(f"{DOMAIN}.{data.get(LEGACY_UNIQUE_ID) or sub.get('subentry_id')}")
    return keys


def build(version: str, options: dict[str, Any], subentries: list[dict[str, Any]], stores: dict[str, Any],
          now: datetime | None = None, *, reason: str = "removed", foreign: dict[str, Any] | None = None,
          users: dict[str, str] | None = None) -> dict[str, Any]:
    """Inhalt der Sicherungsdatei. [foreign] = Artikel der Quell-Listen anderer Integrationen (nur zur Ansicht),
    [users] = Namen zu den Benutzer-Kennungen, damit der Bericht Besitzer nennen kann."""
    return {
        "reason": reason,
        "foreign": foreign or {},
        "users": users or {},
        "kind": KIND,
        "v": 1,
        "at": (now or datetime.now()).isoformat(timespec="seconds"),  # noqa: DTZ005 – Ortszeit, wie sie der Nutzer liest
        "version": version,
        "options": dict(options),
        "subentries": subentries,
        "stores": {key: value for key, value in stores.items() if value is not None},
    }


def summary(backup: dict[str, Any]) -> dict[str, int]:
    """Was in einer Sicherung steckt – für die Rückfrage im Einrichtungs-Assistenten."""
    own = combined = 0
    for sub in backup.get("subentries") or []:
        kind = sub.get("subentry_type")
        if kind == SUBENTRY_OWN_GROUP:
            own += len((sub.get("data") or {}).get("lists") or {})
        elif kind == SUBENTRY_OWN:
            own += 1
        elif kind == SUBENTRY_COMBINED:
            combined += 1
    return {"own": own, "combined": combined}


def _done(item: dict[str, Any]) -> bool:
    return str(item.get("status") or "") == "completed"


def report(backup: dict[str, Any], path: str = "", size: int = 0, verified: bool = False) -> dict[str, Any]:
    """Was genau gesichert wurde – für die Rückmeldung nach dem Sichern von Hand."""
    stores = backup.get("stores") or {}
    users = backup.get("users") or {}
    own: list[dict[str, Any]] = []
    combined: list[dict[str, Any]] = []
    for sub in backup.get("subentries") or []:
        data = sub.get("data") or {}
        kind = sub.get("subentry_type")
        if kind == SUBENTRY_OWN_GROUP:
            for list_id, entry in (data.get("lists") or {}).items():
                owner = str(entry.get("owner") or data.get("owner") or "")  # ab beta.13 bei der Liste, vorher bei der Gruppe
                items = (stores.get(f"{DOMAIN}.own.{list_id}") or {}).get("items") or []
                own.append({"title": entry.get("title") or "", "owner": users.get(owner, owner), "shares": len(entry.get("shares") or {}),
                            "items": len(items), "open": sum(1 for i in items if not _done(i))})
        elif kind == SUBENTRY_OWN:
            items = (stores.get(f"{DOMAIN}.own.{sub.get('subentry_id')}") or {}).get("items") or []
            own.append({"title": sub.get("title") or "", "owner": "", "shares": 0, "items": len(items),
                        "open": sum(1 for i in items if not _done(i))})
        elif kind == SUBENTRY_COMBINED:
            combined.append({"title": sub.get("title") or "", "sources": len(data.get("sources") or [])})
    foreign = [{"entity_id": eid, "name": (val or {}).get("name") or eid, "items": len((val or {}).get("items") or [])}
               for eid, val in (backup.get("foreign") or {}).items()]
    return {
        "path": path, "bytes": size, "verified": verified, "at": backup.get("at"), "version": backup.get("version"),
        "own": own, "combined": combined, "foreign": foreign,
        "settings": len(backup.get("options") or {}),
        "items": sum(x["items"] for x in own),
        "more": sorted(k.split(".", 1)[1] for k in stores if k.split(".", 1)[-1] in GLOBAL_STORES),
    }


def subentries_for_restore(backup: dict[str, Any]) -> list[dict[str, Any]]:
    """Unter-Einträge für den neuen Eintrag. Eine kombinierte Liste behält ihren alten Schlüssel
    (LEGACY_UNIQUE_ID), damit Entität und Häkchen dieselben bleiben; eigene Listen hängen an ihrer Kennung."""
    result: list[dict[str, Any]] = []
    for sub in backup.get("subentries") or []:
        kind = sub.get("subentry_type")
        if kind not in (SUBENTRY_COMBINED, SUBENTRY_OWN_GROUP):
            continue  # die alte Form eigener Listen (vor 3.7) hängt an der Kennung des Unter-Eintrags – nicht übertragbar
        data = dict(sub.get("data") or {})
        if kind == SUBENTRY_COMBINED and not data.get(LEGACY_UNIQUE_ID):
            data[LEGACY_UNIQUE_ID] = sub.get("subentry_id")
        result.append({"subentry_type": kind, "title": sub.get("title") or "", "data": data, "unique_id": sub.get("unique_id")})
    return result


def valid(backup: Any) -> bool:
    return isinstance(backup, dict) and backup.get("kind") == KIND and isinstance(backup.get("subentries"), list)


# ---------- Dateien (blockierend – über den Executor aufrufen) ----------

def write_file(config_dir: str, backup: dict[str, Any]) -> str:
    stamp = str(backup.get("at", "")).replace(":", "").replace("T", "_")
    folder = storage.backup_dir(config_dir)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{PREFIX}{stamp}.json"
    path.write_text(json.dumps(backup, ensure_ascii=False, indent=1), encoding="utf-8")
    for old in sorted(folder.glob(f"{PREFIX}*.json"), reverse=True)[KEEP:]:
        old.unlink(missing_ok=True)
    return str(path)


def newest(config_dir: str) -> tuple[str, dict[str, Any]] | None:
    """Neueste lesbare Sicherung mit mindestens einer Liste."""
    # neuer Ort; dazu der alte (Konfigurations-Ordner), falls die Integration seit dem Umzug nicht gelaufen ist
    files = [*storage.backup_dir(config_dir).glob(f"{PREFIX}*.json"), *Path(config_dir).glob(f"{PREFIX}*.json")]
    for path in sorted(files, key=lambda p: p.name, reverse=True):
        try:
            backup = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if valid(backup) and sum(summary(backup).values()):
            return str(path), backup
    return None


# ---------- Home Assistant ----------

def _plain(value: Any) -> Any:
    """MappingProxy und Ähnliches in einfache JSON-Werte."""
    return json.loads(json.dumps(value, default=lambda o: dict(o) if hasattr(o, "keys") else list(o)))


async def _foreign_items(hass: Any, subentries: list[dict[str, Any]]) -> dict[str, Any]:
    """Artikel der Quell-Listen kombinierter Listen, soweit sie nicht SmartLists selbst gehören. Sie liegen bei
    anderen Integrationen und werden beim Wiederherstellen nicht zurückgeschrieben – die Kopie ist zur Sicherheit."""
    wanted: list[str] = []
    for sub in subentries:
        if sub.get("subentry_type") == SUBENTRY_COMBINED:
            wanted += [e for e in ((sub.get("data") or {}).get("sources") or []) if e not in wanted]
    wanted = [e for e in wanted if hass.states.get(e) is not None]
    if not wanted:
        return {}
    try:
        answer = await hass.services.async_call("todo", "get_items", {"entity_id": wanted, "status": ["needs_action", "completed"]},
                                                blocking=True, return_response=True)
    except Exception:  # noqa: BLE001 – eine Quelle, die nicht antwortet, darf die Sicherung nicht verhindern
        return {}
    result: dict[str, Any] = {}
    for entity_id in wanted:
        state = hass.states.get(entity_id)
        result[entity_id] = {"name": state.name if state else entity_id, "items": ((answer or {}).get(entity_id) or {}).get("items") or []}
    return result


async def async_create(hass: Any, entry: Any, reason: str = "manual") -> dict[str, Any] | None:
    """Sicherung schreiben, die Datei zur Kontrolle wieder einlesen und berichten, was darin steht."""
    from homeassistant.helpers.storage import Store

    subentries = [{"subentry_id": sub.subentry_id, "subentry_type": sub.subentry_type, "title": sub.title,
                   "unique_id": sub.unique_id, "data": _plain(sub.data)} for sub in entry.subentries.values()]
    if reason != "manual" and not subentries:
        return None
    keys = store_keys(subentries) + [f"{DOMAIN}.{name}" for name in GLOBAL_STORES]
    # Merklisten: eine Datei je Benutzer
    keys += [f"{DOMAIN}.{storage.WATCH_DIR}/{name}" for name in await hass.async_add_executor_job(storage.watch_files, hass.config.config_dir)]
    stores = {key: await Store(hass, STORAGE_VERSION, storage.key_of(key)).async_load() for key in keys}  # in der Sicherung unter dem alten Namen
    users = {u.id: u.name or "" for u in await hass.auth.async_get_users() if not u.system_generated}
    version = str(hass.data.get(DOMAIN, {}).get("version") or "")
    backup = build(version, _plain(entry.options), subentries, _plain(stores), reason=reason,
                   foreign=_plain(await _foreign_items(hass, subentries)), users=users)
    path = await hass.async_add_executor_job(write_file, hass.config.config_dir, backup)
    size, verified = await hass.async_add_executor_job(_verify, path, backup)
    if not verified:
        from . import problems

        problems.report(hass, "SL-BACKUP-01", "written file differs from what was saved")
    return report(backup, path, size, verified)


def _verify(path: str, backup: dict[str, Any]) -> tuple[int, bool]:
    """Datei wieder einlesen: stimmt sie mit dem überein, was geschrieben werden sollte?"""
    try:
        raw = Path(path).read_text(encoding="utf-8")
        return len(raw.encode("utf-8")), json.loads(raw) == json.loads(json.dumps(backup))
    except (OSError, ValueError):
        return 0, False


async def async_backup_on_remove(hass: Any, entry: Any) -> str | None:
    """Beim Löschen des Eintrags aufrufen, BEVOR Speicherdateien entfernt werden. Gibt den Pfad zurück."""
    result = await async_create(hass, entry, "removed")
    if result is None:
        return None
    title, message = _TEXT.get(str(hass.config.language)[:2], _TEXT["en"])
    from homeassistant.components import persistent_notification

    persistent_notification.async_create(hass, message.format(path=result["path"]), title=title, notification_id=NOTIFICATION_ID)
    return str(result["path"])


async def async_restore_stores(hass: Any, backup: dict[str, Any]) -> None:
    """Artikel und Häkchen zurückschreiben – nur, wo keine Datei mehr liegt (Vorhandenes ist neuer)."""
    from homeassistant.helpers.storage import Store

    for key, content in (backup.get("stores") or {}).items():
        if not str(key).startswith(f"{DOMAIN}."):
            continue
        store = Store(hass, STORAGE_VERSION, storage.key_of(str(key)))
        if await store.async_load() is None:
            await store.async_save(content)
