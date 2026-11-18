"""Backups der HA-SmartLists-App, dauerhaft in Home Assistant gespeichert – eine Datei je HA-Benutzer:
`.storage/smartlists/backups/app/<Benutzer>`. Darin je Installation (device_id) das neueste Backup.

Bis 4.0.0-beta.20 lagen alle in einer Datei (`backups/apps`). Beim Start zieht jeder Benutzer in seine eigene
Datei um; erst wenn alle geschrieben sind, wird die alte Datei nach `backups/deleted/` gelegt (nicht gelöscht).

Inhalt ist für die Integration undurchsichtig (JSON-Text der App); ist in der App ein Backup-Passwort gesetzt,
kommt es bereits verschlüsselt an (AES-256-GCM) und kann hier von niemandem gelesen werden – auch nicht von Admins.

Wer darf was: Jeder sieht und lädt nur Backups seines eigenen HA-Benutzers; Admins sehen alle.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from . import storage
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

LEGACY_KEY = storage.key("app_backups")  # bis beta.20: alle Benutzer in einer Datei
MAX_BYTES = 5 * 1024 * 1024  # 5 MB je Backup
MAX_PER_USER = 10  # Installationen je Benutzer (das älteste fällt weg)


class AppBackups:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.backups: dict[str, dict[str, Any]] = {}
        self._stores: dict[str, Store[dict[str, Any]]] = {}

    def _store(self, user_id: str) -> Store[dict[str, Any]]:
        name = storage.watch_name(user_id) or "unknown"
        if name not in self._stores:
            self._stores[name] = Store(self.hass, 1, storage.key(f"{storage.APP_BACKUP_DIR}/{name}"))
        return self._stores[name]

    def _of(self, user_id: str) -> dict[str, Any]:
        return {"user": user_id, "backups": {k: b for k, b in self.backups.items() if (b.get("user_id") or "") == user_id}}

    def _save(self, user_id: str) -> None:
        self._store(user_id).async_delay_save(lambda: self._of(user_id), 1.0)

    async def async_load(self) -> None:
        self.backups = {}
        try:
            names = await self.hass.async_add_executor_job(storage.app_backup_files, self.hass.config.config_dir)
        except AttributeError:  # Tests ohne Home Assistant
            names = []
        for name in names:
            store: Store[dict[str, Any]] = Store(self.hass, 1, storage.key(f"{storage.APP_BACKUP_DIR}/{name}"))
            try:
                content = await store.async_load() or {}
            except Exception:  # noqa: BLE001 – unlesbar: beiseitelegen, die übrigen laden weiter
                from . import problems

                problems.report(self.hass, "SL-STORE-02", f"{storage.APP_BACKUP_DIR}/…")
                await self.hass.async_add_executor_job(storage.set_aside, self.hass.config.config_dir, f"{storage.APP_BACKUP_DIR}/{name}", "unreadable")
                continue
            self._stores[name] = store
            self.backups.update(content.get("backups") or {})
        await self._async_move_legacy()

    async def _async_move_legacy(self) -> None:
        """Alte gemeinsame Datei auf eine Datei je Benutzer verteilen."""
        legacy_store: Store[dict[str, Any]] = Store(self.hass, 1, LEGACY_KEY)
        try:
            legacy = (await legacy_store.async_load() or {}).get("backups") or {}
        except Exception:  # noqa: BLE001 – bleibt liegen, wird beim nächsten Start wieder versucht
            _LOGGER.warning("Alte App-Sicherungen nicht lesbar", exc_info=True)
            return
        if not legacy:
            return
        users: set[str] = set()
        for device_id, b in legacy.items():
            if device_id not in self.backups:  # was schon in einer eigenen Datei steht, ist neuer
                self.backups[device_id] = b
            users.add(b.get("user_id") or "")
        try:
            for user_id in users:
                await self._store(user_id).async_save(self._of(user_id))
        except Exception:  # noqa: BLE001 – alte Datei bleibt, nächster Versuch beim nächsten Start
            _LOGGER.warning("App-Sicherungen nicht in Dateien je Benutzer geschrieben", exc_info=True)
            return
        await self.hass.async_add_executor_job(storage.set_aside, self.hass.config.config_dir, "app_backups", "moved_to_app")

    @callback
    def save(self, device_id: str, profile_name: str, data: str, user_id: str, user_name: str) -> dict[str, Any]:
        device_id = device_id.strip()[:64]
        if not device_id:
            raise ValueError("device_id fehlt")
        if len(data.encode()) > MAX_BYTES:
            raise ValueError("Backup ist größer als 5 MB")
        before = self.backups.get(device_id)
        mine = [k for k, b in self.backups.items() if (b.get("user_id") or "") == user_id and k != device_id]
        if len(mine) >= MAX_PER_USER:
            self.backups.pop(min(mine, key=lambda k: self.backups[k].get("updated_at", 0)))
        import json

        try:
            parsed = json.loads(data)
            # frühere App: "smartlists_encrypted"; SmartLists Go: kind = "smartlists-backup-encrypted"
            encrypted = parsed.get("smartlists_encrypted") == 1 or parsed.get("kind") == "smartlists-backup-encrypted"
        except (ValueError, AttributeError):
            encrypted = False
        self.backups[device_id] = {
            "encrypted": encrypted,
            "profile_name": profile_name.strip()[:60] or "Gerät",
            "data": data,
            "updated_at": int(time.time() * 1000),
            "user_id": user_id,
            "user_name": user_name,
        }
        self._save(user_id)
        if before and (before.get("user_id") or "") != user_id:
            self._save(before.get("user_id") or "")  # Gerät wechselte den Benutzer: aus dessen Datei entfernen
        return self.describe(device_id)

    def describe(self, device_id: str) -> dict[str, Any]:
        b = self.backups[device_id]
        return {"device_id": device_id, "profile_name": b["profile_name"], "updated_at": b["updated_at"],
                "user_id": b.get("user_id"), "user_name": b.get("user_name", ""), "size": len(b["data"].encode()),
                "encrypted": bool(b.get("encrypted"))}

    def visible(self, user_id: str, is_admin: bool) -> list[str]:
        return [k for k, b in self.backups.items() if is_admin or b.get("user_id") == user_id]

    @callback
    def delete(self, device_id: str) -> bool:
        gone = self.backups.pop(device_id, None)
        if gone is None:
            return False
        self._save(gone.get("user_id") or "")
        return True


async def async_get_app_backups(hass: HomeAssistant) -> AppBackups:
    data = hass.data.setdefault(DOMAIN, {})
    if "app_backups" not in data:
        backups = AppBackups(hass)
        await backups.async_load()
        data["app_backups"] = backups
    return data["app_backups"]
