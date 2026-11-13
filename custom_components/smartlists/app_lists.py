"""Kombinierte Listen aus der HA-SmartLists-App in die Integration übernehmen.

Die App meldet beim Abgleich (smartlists/register_device, Feld app_lists) ihre eigenen kombinierten
Listen, soweit sie nur aus Home-Assistant-Listen bestehen. Hier lassen sie sich „verbinden“: Dann legt
die Integration daraus eine echte kombinierte Liste an (Unter-Eintrag), deren Entität zum Gerät der App
gehört (Einstellungen → Geräte → „<Gerät>“). Die App erkennt das am Attribut smartlists_app_list und
zeigt ab dann die Liste aus Home Assistant statt ihrer eigenen.
"""

from __future__ import annotations

from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_APP_DEVICE,
    CONF_APP_LIST,
    CONF_DEFAULT_ADD,
    CONF_FOREIGN,
    CONF_MODE,
    CONF_SORT,
    CONF_SOURCE_AS_PERSON,
    CONF_SOURCE_LABEL,
    CONF_SOURCES,
    DOMAIN,
    LABEL_SUFFIX,
    SORT_CATEGORY,
    SUBENTRY_COMBINED,
)


def _entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def connected(hass: HomeAssistant) -> dict[str, str]:
    """"<device_id>/<list_id>" → subentry_id der schon verbundenen Listen."""
    entry = _entry(hass)
    out: dict[str, str] = {}
    if entry is None:
        return out
    for sub in entry.subentries.values():
        if sub.subentry_type == SUBENTRY_COMBINED and sub.data.get(CONF_APP_DEVICE) and sub.data.get(CONF_APP_LIST):
            out[f"{sub.data[CONF_APP_DEVICE]}/{sub.data[CONF_APP_LIST]}"] = sub.subentry_id
    return out


def describe(hass: HomeAssistant, user_id: str | None = None) -> list[dict[str, Any]]:
    """Alle gemeldeten Listen (Admin: user_id=None, sonst nur eigene Geräte) mit Verbindungsstatus."""
    devices = hass.data[DOMAIN]["devices"].devices
    links = connected(hass)
    out = []
    for device_id, d in devices.items():
        if user_id is not None and d.get("user_id") != user_id:
            continue
        for lst in d.get("app_lists") or []:
            key = f"{device_id}/{lst['id']}"
            out.append({**lst, "key": key, "device_id": device_id, "device_name": d.get("name"),
                        "user_name": d.get("user_name"), "connected": key in links,
                        "missing": [s for s in lst["sources"] if hass.states.get(s) is None]})
    return out


def connect(hass: HomeAssistant, device_id: str, list_id: str) -> str:
    """Kombinierte Liste aus der App-Liste anlegen; liefert die subentry_id (bestehende bei Doppelklick)."""
    entry = _entry(hass)
    if entry is None:
        raise ValueError("SmartLists ist nicht eingerichtet.")
    key = f"{device_id}/{list_id}"
    if key in (links := connected(hass)):
        return links[key]
    device = hass.data[DOMAIN]["devices"].devices.get(device_id)
    lst = next((x for x in (device or {}).get("app_lists") or [] if x["id"] == list_id), None)
    if lst is None:
        raise ValueError("Liste nicht gefunden – in der App einmal „Abgleichen“ tippen.")
    sources = [s for s in lst["sources"] if hass.states.get(s) is not None]
    if not sources:
        raise ValueError("Keine der Quell-Listen gibt es in Home Assistant.")
    # Kombinierte Listen dürfen nicht verschachtelt sein
    combined = set(hass.data.get(DOMAIN, {}).get("entities", {}))
    sources = [s for s in sources if s not in combined]
    data = {
        CONF_SOURCES: sources,
        CONF_MODE: lst.get("mode", "bidirectional"),
        CONF_SOURCE_LABEL: LABEL_SUFFIX,
        CONF_SORT: SORT_CATEGORY,
        CONF_FOREIGN: [],
        CONF_SOURCE_AS_PERSON: True,
        CONF_APP_DEVICE: device_id,
        CONF_APP_LIST: list_id,
    }
    if lst.get("default_add") in sources:
        data[CONF_DEFAULT_ADD] = lst["default_add"]
    sub = ConfigSubentry(data=MappingProxyType(data), subentry_type=SUBENTRY_COMBINED, title=lst["name"], unique_id=None)
    hass.config_entries.async_add_subentry(entry, sub)
    return sub.subentry_id
