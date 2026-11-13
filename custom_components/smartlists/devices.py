"""Verbundene Geräte (Installationen der HA-SmartLists-App).

Die App meldet sich beim Koppeln und bei jedem Abgleich mit `smartlists/register_device` an. Der
HA-Benutzer kommt aus der Verbindung (Token), nicht aus der Nachricht – ein Gerät kann sich also
nicht als jemand anderes ausgeben. Gespeichert in `.storage/smartlists.devices`.

Jedes Gerät erscheint zusätzlich als Gerät in HA (unter SmartLists) mit Sensoren
„Zuletzt gesehen“ und „App-Version“ – siehe sensor.py.

Entfernen heißt hier nur „aus der Liste nehmen“. Meldet sich das Gerät wieder, erscheint es erneut.
Den Zugang sperrt man in HA über das Profil → Langlebige Zugangstoken.
"""

from __future__ import annotations

import time
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.devices"
STORAGE_VERSION = 1
SIGNAL_DEVICES_CHANGED = f"{DOMAIN}_devices_changed"
# Ab wann ein Gerät als „lange nicht gesehen“ gilt (Attribut stale am Sensor)
STALE_AFTER_SECONDS = 7 * 24 * 3600
MAX_DEVICES = 50
_FIELDS = {"name": 60, "model": 60, "manufacturer": 40, "app_version": 30, "os_version": 30}


def _clean_app_lists(raw: list[Any]) -> list[dict[str, Any]]:
    """Kombinierte Listen der App (nur solche aus HA-Listen): id, name, sources, default_add, mode."""
    out = []
    for item in raw[:30]:
        if not isinstance(item, dict) or not item.get("id") or not item.get("name"):
            continue
        sources = [s for s in item.get("sources") or [] if isinstance(s, str) and s.startswith("todo.")][:20]
        if len(sources) < 1:
            continue
        default = item.get("default_add") if item.get("default_add") in sources else None
        out.append({"id": str(item["id"])[:64], "name": str(item["name"]).strip()[:60], "sources": sources,
                    "default_add": default, "mode": "local" if item.get("mode") == "local" else "bidirectional"})
    return out


class Devices:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.devices: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.devices = dict(data.get("devices", {}))

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"devices": self.devices}, 2.0)

    @callback
    def register(self, device_id: str, info: dict[str, Any], user_id: str, user_name: str) -> dict[str, Any]:
        device_id = str(device_id).strip()[:64]
        if not device_id:
            raise ValueError("device_id fehlt")
        now = int(time.time())
        known = self.devices.get(device_id)
        if known is None and len(self.devices) >= MAX_DEVICES:
            # ältestes Gerät verdrängen statt neue abzulehnen
            oldest = min(self.devices, key=lambda k: self.devices[k].get("last_seen", 0))
            self.devices.pop(oldest)
        entry = dict(known or {"first_seen": now})
        for key, limit in _FIELDS.items():
            if info.get(key):
                entry[key] = str(info[key]).strip()[:limit]
        entry.setdefault("name", entry.get("model") or "Gerät")
        if isinstance(info.get("app_lists"), list):
            entry["app_lists"] = _clean_app_lists(info["app_lists"])
        entry.update(last_seen=now, user_id=user_id, user_name=user_name)
        self.devices[device_id] = entry
        self._save()
        # neues Gerät → HA-Gerät + Sensoren anlegen; bekanntes → Sensoren aktualisieren
        async_dispatcher_send(self.hass, SIGNAL_DEVICES_CHANGED, device_id, known is None)
        return self.describe(device_id)

    @callback
    def remove(self, device_id: str) -> bool:
        if self.devices.pop(device_id, None) is None:
            return False
        self._save()
        async_dispatcher_send(self.hass, SIGNAL_DEVICES_CHANGED, device_id, False)
        return True

    def describe(self, device_id: str) -> dict[str, Any]:
        d = self.devices[device_id]
        return {
            "device_id": device_id,
            **{k: d.get(k) for k in ("name", "model", "manufacturer", "app_version", "os_version", "user_id", "user_name")},
            "first_seen": d.get("first_seen"),
            "last_seen": d.get("last_seen"),
            "stale": time.time() - float(d.get("last_seen", 0)) > STALE_AFTER_SECONDS,
        }

    def entries(self, user_id: str | None = None) -> list[dict[str, Any]]:
        """Alle Geräte (Admin) bzw. nur die eigenen (user_id gesetzt), zuletzt gesehene zuerst."""
        ids = [k for k, v in self.devices.items() if user_id is None or v.get("user_id") == user_id]
        return sorted((self.describe(k) for k in ids), key=lambda d: -(d["last_seen"] or 0))


async def async_get_devices(hass: HomeAssistant) -> Devices:
    data = hass.data.setdefault(DOMAIN, {})
    if "devices" not in data:
        devices = Devices(hass)
        await devices.async_load()
        data["devices"] = devices
    return data["devices"]
