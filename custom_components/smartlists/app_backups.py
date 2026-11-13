"""Backups der HA-SmartLists-App, dauerhaft in Home Assistant gespeichert (.storage/smartlists.app_backups).

Die App sicherte bisher in einen „losen“ Sensor über die REST-API – den vergisst Home Assistant bei jedem
Neustart. Ist die App gekoppelt, legt sie ihr Backup stattdessen hier ab: ein Backup pro Installation
(device_id), jeweils das neueste. Inhalt ist für die Integration undurchsichtig (JSON-Text der App);
ist in der App ein Backup-Passwort gesetzt, kommt es bereits verschlüsselt an (AES-256-GCM) und kann
hier von niemandem gelesen werden – auch nicht von Admins.

Wer darf was: Jeder sieht und lädt nur Backups seines eigenen HA-Benutzers; Admins sehen alle.
"""

from __future__ import annotations

import time
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.app_backups"
MAX_BYTES = 5 * 1024 * 1024  # 5 MB je Backup
MAX_BACKUPS = 30


class AppBackups:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.backups: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        self.backups = dict((await self._store.async_load() or {}).get("backups", {}))

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"backups": self.backups}, 1.0)

    @callback
    def save(self, device_id: str, profile_name: str, data: str, user_id: str, user_name: str) -> dict[str, Any]:
        device_id = device_id.strip()[:64]
        if not device_id:
            raise ValueError("device_id fehlt")
        if len(data.encode()) > MAX_BYTES:
            raise ValueError("Backup ist größer als 5 MB")
        if device_id not in self.backups and len(self.backups) >= MAX_BACKUPS:
            oldest = min(self.backups, key=lambda k: self.backups[k].get("updated_at", 0))
            self.backups.pop(oldest)
        import json

        try:
            encrypted = json.loads(data).get("smartlists_encrypted") == 1
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
        self._save()
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
        if self.backups.pop(device_id, None) is None:
            return False
        self._save()
        return True


async def async_get_app_backups(hass: HomeAssistant) -> AppBackups:
    data = hass.data.setdefault(DOMAIN, {})
    if "app_backups" not in data:
        backups = AppBackups(hass)
        await backups.async_load()
        data["app_backups"] = backups
    return data["app_backups"]
