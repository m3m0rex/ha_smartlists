"""Eigene Listen: EIN Unter-Eintrag „Eigene Listen“ (Typ own_lists, unique_id „own_lists“) für alle Besitzer mit

    lists: {list_id: {"title": "Angebote", "owner": benutzer_id, "shares": {benutzer_id: rolle}, ["entity_id": …]}}

So steht auf der Seite der Integration eine Gruppe „Eigene Listen“ mit allen Listen darunter (Name, Besitzer in
Klammern, Rechte in der zweiten Zeile) statt einer Gruppe je Besitzer. Von 3.7 bis 4.0.0-beta.12 gab es je Besitzer
einen Unter-Eintrag mit `owner` oben und den Listen ohne eigenes `owner`; `async_merge_groups` führt sie beim Start
zusammen, `owner_of` versteht beide Formen (falls die HA-Version Entitäten nicht umhängen kann und es beim Alten bleibt).

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

from .const import DOMAIN, SUBENTRY_COMBINED, SUBENTRY_OWN, SUBENTRY_OWN_GROUP

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


SINGLE_ID = "own_lists"  # unique_id der einen Gruppe für alle Besitzer


def the_group(entry: ConfigEntry) -> ConfigSubentry | None:
    """Die eine Gruppe „Eigene Listen“ (ab 4.0.0-beta.13)."""
    return next((g for g in groups(entry) if getattr(g, "unique_id", None) == SINGLE_ID), None)


def owner_of(g: ConfigSubentry | None, data: dict[str, Any] | None) -> str | None:
    """Besitzer einer Liste: steht bei der Liste; in der alten Form (Gruppe je Besitzer) bei der Gruppe."""
    return (data or {}).get("owner") or (g.data.get("owner") if g is not None else None) or None


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
    item = {"title": title.strip()[:60] or "Liste", "owner": owner, "shares": dict(shares or {})}
    g = the_group(entry)
    if g is None:
        sub = ConfigSubentry(data=MappingProxyType({"lists": {list_id: item}}), subentry_type=SUBENTRY_OWN_GROUP,
                             title=group_label(hass), unique_id=SINGLE_ID)
        hass.config_entries.async_add_subentry(entry, sub)
    else:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**(g.data.get("lists") or {}), list_id: item}})
    return list_id


async def async_update_list(hass: HomeAssistant, list_id: str, *, title: str | None = None,
                            shares: dict[str, str] | None = None, owner: str | None = None) -> None:
    """Name, Freigaben oder Besitzer ändern (die Entität bleibt dieselbe)."""
    entry = main_entry(hass)
    g, data = find(entry, list_id) if entry else (None, None)
    if g is None or data is None:
        raise ValueError("Keine eigene SmartLists-Liste.")
    new = {**data}
    if title is not None and title.strip():
        new["title"] = title.strip()[:60]
    if shares is not None:
        new["shares"] = dict(shares)
    if owner and owner != owner_of(g, data):
        # der Besitzer steht bei der Liste: nur umtragen (früher wanderte die Liste dafür in eine andere Gruppe)
        new["owner"] = owner
        new["shares"] = {u: r for u, r in new.get("shares", {}).items() if u != owner}
    hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**g.data["lists"], list_id: new}})


async def async_rename_list(hass: HomeAssistant, entity: Any, title: str) -> bool:
    """Eine Liste von SmartLists umbenennen: eigene in der Gruppe, eigene alter Form oder kombinierte. Der Name steht
    am Unter-Eintrag bzw. bei der Liste in der Gruppe; Gerät und Entität folgen nach dem Neuladen. False = keine
    Liste von SmartLists."""
    entry = main_entry(hass)
    title = " ".join(str(title).split())[:60]
    if entry is None or not title:
        return False
    if getattr(entity, "grouped", False):
        await async_update_list(hass, entity.list_id, title=title)
        return True
    from .combined_group import async_update, find

    if (ref := find(entry, str(getattr(entity, "unique_id", "") or ""))) is not None:
        async_update(hass, ref, title=title)
        return True
    for sub in entry.subentries.values():
        if sub.subentry_type == SUBENTRY_OWN and sub.subentry_id == getattr(entity, "list_id", None):
            hass.config_entries.async_update_subentry(entry, sub, title=title)
            return True
    return False


def _remove_from_group(hass: HomeAssistant, entry: ConfigEntry, g: ConfigSubentry, list_id: str) -> None:
    rest = {k: v for k, v in (g.data.get("lists") or {}).items() if k != list_id}
    if rest:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": rest})
    else:
        hass.config_entries.async_remove_subentry(entry, g.subentry_id)


def combined_using(entry: ConfigEntry, entity_id: str | None) -> list[str]:
    """Namen der kombinierten Listen, in denen diese Liste als Quelle steckt."""
    if not entity_id:
        return []
    from .combined_group import refs

    return [r.title for r in refs(entry) if entity_id in (r.data.get("sources") or [])]


def async_remove_list(hass: HomeAssistant, list_id: str) -> None:
    """Liste löschen: die Entität verschwindet, der Artikel-Speicher wandert nach backups/deleted/.
    Steckt die Liste noch in einer kombinierten Liste, wird sie nicht gelöscht – erst dort herausnehmen
    (sonst zeigte die kombinierte Liste auf eine Liste, die es nicht mehr gibt)."""
    entry = main_entry(hass)
    g, _ = find(entry, list_id) if entry else (None, None)
    if g is None:
        raise ValueError("Keine eigene SmartLists-Liste.")
    if used := combined_using(entry, _entity_id_of(hass, list_id)):
        names = ", ".join(f"„{n}“" for n in used)
        raise ValueError(f"Diese Liste gehört zur kombinierten Liste {names}. Nimm sie dort zuerst heraus, dann lässt sie sich löschen."
                         if str(hass.config.language).startswith("de") else
                         f"This list is part of the combined list {', '.join(used)}. Remove it there first, then it can be deleted.")
    _drop_entity(hass, list_id)
    title = str(((g.data.get("lists") or {}).get(list_id) or {}).get("title") or "")
    _remove_from_group(hass, entry, g, list_id)
    from . import storage

    # die Artikel bleiben als Sicherung – aber nicht lose, sondern unter backups/deleted/
    hass.async_add_executor_job(storage.set_aside, hass.config.config_dir, f"own.{list_id}", title)


def _registry():
    from homeassistant.helpers import entity_registry as er

    return er


def _entity_id_of(hass: HomeAssistant, list_id: str) -> str | None:
    er = _registry()
    return er.async_get(hass).async_get_entity_id("todo", DOMAIN, f"own_{list_id}")


def _drop_entity(hass: HomeAssistant, list_id: str) -> None:
    """Entität UND Gerät der Liste entfernen – sonst bliebe die Liste auf der Integrationsseite stehen (mit den
    Sensoren und dem Knopf daran), obwohl sie gelöscht ist."""
    if (eid := _entity_id_of(hass, list_id)) is not None:
        _registry().async_get(hass).async_remove(eid)
    from homeassistant.helpers import device_registry as dr

    devreg = dr.async_get(hass)
    if (device := devreg.async_get_device(identifiers={(DOMAIN, f"list_own_{list_id}")})) is not None:
        devreg.async_remove_device(device.id)


def async_tidy_devices(hass: HomeAssistant, entry: ConfigEntry) -> list[str]:
    """Geräte früher gelöschter eigener Listen entfernen (bis beta.21 blieben sie beim Löschen stehen)."""
    from homeassistant.helpers import device_registry as dr

    alive = {f"list_own_{list_id}" for _, list_id, _ in iter_lists(entry)}
    alive |= {f"list_own_{sub.subentry_id}" for sub in entry.subentries.values() if sub.subentry_type == SUBENTRY_OWN}
    devreg = dr.async_get(hass)
    gone = []
    for device in dr.async_entries_for_config_entry(devreg, entry.entry_id):
        own = [str(i[1]) for i in device.identifiers if i[0] == DOMAIN and str(i[1]).startswith("list_own_")]
        if own and not any(i in alive for i in own):
            devreg.async_remove_device(device.id)
            gone.append(device.name or own[0])
    return gone


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
        g = the_group(entry)
        if g is not None and "entity_id" in data:
            hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {
                **g.data["lists"], sub.subentry_id: {**g.data["lists"][sub.subentry_id], "entity_id": data["entity_id"]}}})
        _repoint_entity(hass, sub.subentry_id, g.subentry_id if g else None)
        hass.config_entries.async_remove_subentry(entry, sub.subentry_id)
    _LOGGER.info("SmartLists: %s eigene Liste(n) in Gruppen je Besitzer umgezogen", len(legacy))
    return len(legacy)


async def async_merge_groups(hass: HomeAssistant, entry: ConfigEntry) -> int:
    """3.7 bis 4.0.0-beta.12: je Besitzer ein Unter-Eintrag → alle Listen in die eine Gruppe „Eigene Listen“.
    Erst in die neue Gruppe eintragen und die Entität umhängen, dann die alte Gruppe entfernen – so bleiben Name,
    Symbol, Bereich und Entitäts-ID erhalten. Kann diese HA-Version Entitäten nicht umhängen, bleibt alles, wie es
    ist (die alte Form funktioniert weiter). Liefert die Zahl der umgezogenen Listen."""
    old_groups = [g for g in groups(entry) if getattr(g, "unique_id", None) != SINGLE_ID]
    if not old_groups:
        return 0
    if not _can_move_entities(hass):
        _LOGGER.warning("SmartLists: eigene Listen bleiben je Besitzer gruppiert – diese Home-Assistant-Version kann "
                        "Entitäten nicht zwischen Unter-Einträgen verschieben.")
        return 0
    moved = 0
    for old in old_groups:
        owner = str(old.data.get("owner") or "")
        for list_id, data in list((old.data.get("lists") or {}).items()):
            await async_add_list(hass, str(data.get("owner") or owner), str(data.get("title") or ""), dict(data.get("shares") or {}), list_id=list_id)
            target = the_group(entry)
            if target is None:
                continue
            if "entity_id" in data:
                hass.config_entries.async_update_subentry(entry, target, data={**target.data, "lists": {
                    **target.data["lists"], list_id: {**target.data["lists"][list_id], "entity_id": data["entity_id"]}}})
            _repoint_entity(hass, list_id, target.subentry_id)
            moved += 1
        if entry.subentries.get(old.subentry_id) is not None:
            hass.config_entries.async_remove_subentry(entry, old.subentry_id)
    _LOGGER.info("SmartLists: %s eigene Liste(n) in die gemeinsame Gruppe „%s“ umgezogen", moved, group_label(hass))
    return moved
