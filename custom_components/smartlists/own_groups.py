"""Eigene Listen, gruppiert je Besitzer: ein Unter-Eintrag „Eigene Listen · Julian“ (Typ own_lists) mit

    owner: HA-Benutzer-ID des Besitzers
    lists: {list_id: {"title": "Angebote", "shares": {benutzer_id: rolle}, ["entity_id": …]}}

list_id ist die frühere subentry_id der Liste (bis 3.6 war jede Liste ein eigener Unter-Eintrag own_list) –
damit bleiben unique_id (own_<list_id>), Speicher (smartlists.own.<list_id>) und Entitäts-ID unverändert.
Alte Unter-Einträge werden beim Start einmalig umgezogen (async_migrate_legacy).
"""

from __future__ import annotations

import inspect
import logging
import uuid
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, SUBENTRY_OWN, SUBENTRY_OWN_GROUP

_LOGGER = logging.getLogger(__name__)

_LABEL = {"de": "Eigene Listen", "en": "Own lists", "fr": "Listes propres", "es": "Listas propias",
          "it": "Liste proprie", "pl": "Własne listy"}


def group_label(hass: HomeAssistant) -> str:
    return _LABEL.get((hass.config.language or "en").split("-")[0], _LABEL["en"])


async def _owner_name(hass: HomeAssistant, owner: str | None) -> str:
    user = await hass.auth.async_get_user(owner) if owner else None
    return (user.name if user and user.name else None) or "?"


def main_entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def groups(entry: ConfigEntry) -> list[ConfigSubentry]:
    return [s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_OWN_GROUP]


def group_of_owner(entry: ConfigEntry, owner: str) -> ConfigSubentry | None:
    return next((g for g in groups(entry) if g.data.get("owner") == owner), None)


def iter_lists(entry: ConfigEntry):
    """(Gruppe, list_id, Daten der Liste) für alle eigenen Listen."""
    for g in groups(entry):
        for list_id, data in (g.data.get("lists") or {}).items():
            yield g, list_id, data


def find(entry: ConfigEntry, list_id: str) -> tuple[ConfigSubentry | None, dict[str, Any] | None]:
    for g, lid, data in iter_lists(entry):
        if lid == list_id:
            return g, data
    return None, None


async def async_add_list(hass: HomeAssistant, owner: str, title: str, shares: dict[str, str] | None = None,
                         list_id: str | None = None) -> str:
    """Liste beim Besitzer eintragen (Gruppe wird bei Bedarf angelegt). Liefert die list_id.
    Wer Artikel mitgeben will, schreibt vorher den Speicher smartlists.own.<list_id> (siehe migrate.py)."""
    entry = main_entry(hass)
    if entry is None:
        raise ValueError("SmartLists ist nicht eingerichtet.")
    list_id = list_id or uuid.uuid4().hex
    item = {"title": title.strip()[:60] or "Liste", "shares": dict(shares or {})}
    g = group_of_owner(entry, owner)
    if g is None:
        sub = ConfigSubentry(data=MappingProxyType({"owner": owner, "lists": {list_id: item}}), subentry_type=SUBENTRY_OWN_GROUP,
                             title=f"{group_label(hass)} · {await _owner_name(hass, owner)}", unique_id=f"owner_{owner}")
        hass.config_entries.async_add_subentry(entry, sub)
    else:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**(g.data.get("lists") or {}), list_id: item}})
    return list_id


async def async_update_list(hass: HomeAssistant, list_id: str, *, title: str | None = None,
                            shares: dict[str, str] | None = None, owner: str | None = None) -> None:
    """Name/Freigaben ändern; anderer Besitzer → Liste wandert in dessen Gruppe (Entität bleibt dieselbe)."""
    entry = main_entry(hass)
    g, data = find(entry, list_id) if entry else (None, None)
    if g is None or data is None:
        raise ValueError("Keine eigene SmartLists-Liste.")
    new = {**data}
    if title is not None and title.strip():
        new["title"] = title.strip()[:60]
    if shares is not None:
        new["shares"] = dict(shares)
    if owner and owner != g.data.get("owner"):
        new["shares"] = {u: r for u, r in new.get("shares", {}).items() if u != owner}
        _remove_from_group(hass, entry, g, list_id)
        await async_add_list(hass, owner, new["title"], new["shares"], list_id=list_id)
        target = group_of_owner(entry, owner)
        if target is not None and "entity_id" in data:
            hass.config_entries.async_update_subentry(entry, target, data={**target.data, "lists": {
                **target.data["lists"], list_id: {**target.data["lists"][list_id], "entity_id": data["entity_id"]}}})
        _repoint_entity(hass, list_id, target.subentry_id if target else None)
        return
    hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**g.data["lists"], list_id: new}})


def _remove_from_group(hass: HomeAssistant, entry: ConfigEntry, g: ConfigSubentry, list_id: str) -> None:
    rest = {k: v for k, v in (g.data.get("lists") or {}).items() if k != list_id}
    if rest:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": rest})
    else:
        hass.config_entries.async_remove_subentry(entry, g.subentry_id)


def async_remove_list(hass: HomeAssistant, list_id: str) -> None:
    """Liste löschen (Artikel-Speicher bleibt als Sicherung liegen, Entität verschwindet)."""
    entry = main_entry(hass)
    g, _ = find(entry, list_id) if entry else (None, None)
    if g is None:
        raise ValueError("Keine eigene SmartLists-Liste.")
    _drop_entity(hass, list_id)
    _remove_from_group(hass, entry, g, list_id)


def _registry():
    from homeassistant.helpers import entity_registry as er

    return er


def _entity_id_of(hass: HomeAssistant, list_id: str) -> str | None:
    er = _registry()
    return er.async_get(hass).async_get_entity_id("todo", DOMAIN, f"own_{list_id}")


def _drop_entity(hass: HomeAssistant, list_id: str) -> None:
    if (eid := _entity_id_of(hass, list_id)) is not None:
        _registry().async_get(hass).async_remove(eid)


def _can_move_entities(hass: HomeAssistant) -> bool:
    reg = _registry().async_get(hass)
    try:
        return "config_subentry_id" in inspect.signature(reg.async_update_entity).parameters
    except (TypeError, ValueError):
        return False


def _repoint_entity(hass: HomeAssistant, list_id: str, subentry_id: str | None) -> None:
    """Entität an den neuen Unter-Eintrag hängen und vom alten Gerät lösen – sonst würde Home Assistant sie
    beim Entfernen des alten Unter-Eintrags bzw. Geräts mitlöschen."""
    eid = _entity_id_of(hass, list_id)
    if eid is None or subentry_id is None or not _can_move_entities(hass):
        return
    _registry().async_get(hass).async_update_entity(eid, config_subentry_id=subentry_id, device_id=None)


async def async_migrate_legacy(hass: HomeAssistant, entry: ConfigEntry) -> int:
    """Bis 3.6: je eigene Liste ein Unter-Eintrag own_list → in die Gruppen der Besitzer umziehen.
    Geht nur, wenn diese HA-Version Entitäten zwischen Unter-Einträgen verschieben kann; sonst bleibt alles,
    wie es ist (alte Einträge funktionieren weiter). Liefert die Zahl der umgezogenen Listen."""
    legacy = [s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_OWN]
    if not legacy:
        return 0
    if not _can_move_entities(hass):
        _LOGGER.warning("SmartLists: eigene Listen bleiben einzeln – diese Home-Assistant-Version kann Entitäten "
                        "nicht zwischen Unter-Einträgen verschieben.")
        return 0
    for sub in legacy:
        data = {"title": sub.title, "shares": dict(sub.data.get("shares") or {})}
        if sub.data.get("entity_id"):
            data["entity_id"] = sub.data["entity_id"]
        owner = sub.data.get("owner") or ""
        await async_add_list(hass, owner, data["title"], data["shares"], list_id=sub.subentry_id)
        g = group_of_owner(entry, owner)
        if g is not None and "entity_id" in data:
            hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {
                **g.data["lists"], sub.subentry_id: {**g.data["lists"][sub.subentry_id], "entity_id": data["entity_id"]}}})
        _repoint_entity(hass, sub.subentry_id, g.subentry_id if g else None)
        hass.config_entries.async_remove_subentry(entry, sub.subentry_id)
    _LOGGER.info("SmartLists: %s eigene Liste(n) in Gruppen je Besitzer umgezogen", len(legacy))
    return len(legacy)
