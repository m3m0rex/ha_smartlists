"""Verbundene Apps auf der Seite der Integration: eine eigene Gruppe „SmartLists Go“.

Bis 4.0.0-beta.22 standen „SmartLists Go“ und die Smartphones unter „Geräte, die nicht zu einem Untereintrag
gehören“. Jetzt gibt es einen Unter-Eintrag „SmartLists Go“ (Typ apps, unique_id „apps“); das Gerät „SmartLists Go“
und je verbundener App ein Gerät mit seinen Sensoren hängen daran. Der Unter-Eintrag entsteht von selbst.
Neue Apps verbindet man in der App (Anmelden bei Home Assistant), nicht hier.
"""

from __future__ import annotations

import inspect
import logging
from types import MappingProxyType

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, SUBENTRY_APPS

_LOGGER = logging.getLogger(__name__)

APPS_UID = "apps"
TITLE = "SmartLists Go"


def apps_subentry(entry: ConfigEntry) -> ConfigSubentry | None:
    return next((s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_APPS), None)


def async_ensure(hass: HomeAssistant, entry: ConfigEntry) -> str | None:
    """Kennung des Unter-Eintrags „SmartLists Go“; legt ihn an, wenn es ihn noch nicht gibt."""
    sub = apps_subentry(entry)
    if sub is None:
        try:
            sub = ConfigSubentry(data=MappingProxyType({}), subentry_type=SUBENTRY_APPS, title=TITLE, unique_id=APPS_UID)
            hass.config_entries.async_add_subentry(entry, sub)
        except Exception:  # noqa: BLE001 – ältere Home-Assistant-Versionen: die Apps bleiben, wo sie sind
            _LOGGER.debug("SmartLists: Gruppe „SmartLists Go“ nicht angelegt", exc_info=True)
            return None
    return sub.subentry_id


def _accepts(func, *names: str) -> bool:
    try:
        params = inspect.signature(func).parameters
    except (TypeError, ValueError):
        return False
    return all(n in params for n in names)


def is_app_device(identifiers) -> bool:
    return any(i[0] == DOMAIN and (i[1] == "apps" or str(i[1]).startswith("app_")) for i in identifiers)


def async_move(hass: HomeAssistant, entry: ConfigEntry, subentry_id: str | None) -> int:
    """Vorhandene App-Geräte und ihre Sensoren in die Gruppe umhängen (einmalig nach dem Update).
    Erst hinzufügen, dann die alte Zuordnung lösen – so bleiben Gerät, Namen und Entitäts-IDs erhalten."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    if subentry_id is None:
        return 0
    devreg, entreg = dr.async_get(hass), er.async_get(hass)
    if not _accepts(devreg.async_update_device, "add_config_subentry_id", "remove_config_subentry_id") \
            or not _accepts(entreg.async_update_entity, "config_subentry_id"):
        return 0
    moved = 0
    for device in dr.async_entries_for_config_entry(devreg, entry.entry_id):
        if not is_app_device(device.identifiers):
            continue
        subs = (getattr(device, "config_entries_subentries", None) or {}).get(entry.entry_id) or set()
        if subentry_id in subs and subs == {subentry_id}:
            continue
        if subentry_id not in subs:
            devreg.async_update_device(device.id, add_config_entry_id=entry.entry_id, add_config_subentry_id=subentry_id)
        # erst die Sensoren umhängen, dann die alte Zuordnung des Geräts lösen – sonst räumt HA sie mit weg
        for ent in er.async_entries_for_device(entreg, device.id, include_disabled_entities=True):
            if ent.config_entry_id == entry.entry_id and str(ent.unique_id).startswith("app_") \
                    and getattr(ent, "config_subentry_id", None) != subentry_id:
                entreg.async_update_entity(ent.entity_id, config_subentry_id=subentry_id)
        for old in subs - {subentry_id}:
            devreg.async_update_device(device.id, remove_config_entry_id=entry.entry_id, remove_config_subentry_id=old)
        moved += 1
    if moved:
        _LOGGER.info("SmartLists: %s App-Gerät(e) in die Gruppe „%s“ umgehängt", moved, TITLE)
    return moved
