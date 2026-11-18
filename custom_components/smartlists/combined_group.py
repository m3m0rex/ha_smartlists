"""Kombinierte Listen: EIN Unter-Eintrag „Kombinierte Listen“ (Typ combined_lists, unique_id „combined_lists“) mit

    lists: {schlüssel: {"title": "Wocheneinkauf", "sources": [...], "mode": …, ["owner": …, "shares": {…}], …}}

So steht auf der Seite der Integration eine Gruppe „Kombinierte Listen“ mit allen Listen darunter – wie bei den
eigenen Listen und den Notizen. Bis 4.0.0-beta.16 war jede kombinierte Liste ein eigener Unter-Eintrag
(Typ combined_list); `async_merge` zieht sie beim Start in die Gruppe um.

Der Schlüssel ist der bisherige Schlüssel der Liste (`todo.list_key`: die alte unique_id aus 1.1 oder die
subentry_id). Damit bleiben unique_id der Entität, Speicherdatei (.storage/smartlists/<schlüssel>) und Entitäts-ID
unverändert.

Der übrige Code arbeitet mit `refs(entry)`: je kombinierter Liste ein `Ref` mit denselben Feldern wie ein
Unter-Eintrag (title, data, subentry_id, subentry_type) plus `key` – egal, ob sie in der Gruppe steht oder noch
in der alten Form. Geschrieben wird über `async_update` / `async_remove`.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, LEGACY_UNIQUE_ID, SUBENTRY_COMBINED, SUBENTRY_COMBINED_GROUP

_LOGGER = logging.getLogger(__name__)

GROUP_ID = "combined_lists"
_LABEL = {"de": "Kombinierte Listen", "en": "Combined lists", "fr": "Listes combinées", "es": "Listas combinadas",
          "it": "Liste combinate", "pl": "Listy połączone"}


def group_label(hass: HomeAssistant) -> str:
    return _LABEL.get((hass.config.language or "en").split("-")[0], _LABEL["en"])


@dataclass
class Ref:
    """Eine kombinierte Liste – in der Gruppe (grouped) oder als eigener Unter-Eintrag (alte Form)."""

    key: str
    title: str
    data: MappingProxyType
    subentry_id: str
    grouped: bool
    subentry_type: str = SUBENTRY_COMBINED
    unique_id: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


def legacy_key(sub: Any) -> str:
    return str(sub.data.get(LEGACY_UNIQUE_ID) or sub.subentry_id)


def the_group(entry: ConfigEntry | None) -> ConfigSubentry | None:
    if entry is None:
        return None
    return next((s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED_GROUP), None)


def refs(entry: ConfigEntry | None) -> list[Ref]:
    """Alle kombinierten Listen: erst die in der Gruppe, dann die der alten Form."""
    if entry is None:
        return []
    out: list[Ref] = []
    g = the_group(entry)
    if g is not None:
        for key, item in (g.data.get("lists") or {}).items():
            data = {k: v for k, v in dict(item).items() if k != "title"}
            out.append(Ref(key=str(key), title=str(item.get("title") or ""), data=MappingProxyType(data), subentry_id=g.subentry_id, grouped=True))
    for sub in entry.subentries.values():
        if sub.subentry_type == SUBENTRY_COMBINED:
            out.append(Ref(key=legacy_key(sub), title=sub.title, data=sub.data, subentry_id=sub.subentry_id, grouped=False,
                           unique_id=sub.unique_id))
    return out


def find(entry: ConfigEntry | None, key: str) -> Ref | None:
    return next((r for r in refs(entry) if r.key == key), None)


def _main(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def async_add(hass: HomeAssistant, title: str, data: dict[str, Any], key: str | None = None) -> str:
    """Kombinierte Liste in die Gruppe eintragen (die Gruppe wird bei Bedarf angelegt). Liefert den Schlüssel."""
    entry = _main(hass)
    if entry is None:
        raise ValueError("SmartLists ist nicht eingerichtet.")
    key = key or uuid.uuid4().hex
    item = {**{k: v for k, v in data.items() if k not in ("title", LEGACY_UNIQUE_ID)}, "title": (title or "").strip()[:60] or "Einkauf"}
    g = the_group(entry)
    if g is None:
        hass.config_entries.async_add_subentry(entry, ConfigSubentry(data=MappingProxyType({"lists": {key: item}}),
                                                                     subentry_type=SUBENTRY_COMBINED_GROUP,
                                                                     title=group_label(hass), unique_id=GROUP_ID))
    else:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**(g.data.get("lists") or {}), key: item}})
    return key


def async_update(hass: HomeAssistant, ref: Ref, *, title: str | None = None, data: dict[str, Any] | None = None) -> None:
    """Name und/oder Daten einer kombinierten Liste ändern (data ersetzt die Daten ganz)."""
    entry = _main(hass)
    if entry is None:
        return
    if ref.grouped:
        g = the_group(entry)
        if g is None or ref.key not in (g.data.get("lists") or {}):
            return
        old = dict(g.data["lists"][ref.key])
        item = {**({k: v for k, v in data.items() if k != LEGACY_UNIQUE_ID} if data is not None else {k: v for k, v in old.items() if k != "title"}),
                "title": (title.strip()[:60] if title and title.strip() else old.get("title") or "")}
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": {**g.data["lists"], ref.key: item}})
        return
    sub = entry.subentries.get(ref.subentry_id)
    if sub is None:
        return
    kw: dict[str, Any] = {}
    if title and title.strip():
        kw["title"] = title.strip()[:60]
    if data is not None:
        kw["data"] = data
    if kw:
        hass.config_entries.async_update_subentry(entry, sub, **kw)


def async_remove(hass: HomeAssistant, ref: Ref) -> None:
    """Kombinierte Liste löschen. Die Quell-Listen bleiben. Die Häkchen (Speicherdatei) wandern nach backups/deleted/."""
    entry = _main(hass)
    if entry is None:
        return
    if not ref.grouped:
        hass.config_entries.async_remove_subentry(entry, ref.subentry_id)
        return
    g = the_group(entry)
    if g is None:
        return
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    eid = er.async_get(hass).async_get_entity_id("todo", DOMAIN, ref.key)
    if eid is not None:
        er.async_get(hass).async_remove(eid)
    devreg = dr.async_get(hass)
    if (device := devreg.async_get_device(identifiers={(DOMAIN, f"list_{ref.key}")})) is not None:
        devreg.async_remove_device(device.id)
    rest = {k: v for k, v in (g.data.get("lists") or {}).items() if k != ref.key}
    if rest:
        hass.config_entries.async_update_subentry(entry, g, data={**g.data, "lists": rest})
    else:
        hass.config_entries.async_remove_subentry(entry, g.subentry_id)
    from . import storage

    hass.async_add_executor_job(storage.set_aside, hass.config.config_dir, ref.key, ref.title)


async def async_merge(hass: HomeAssistant, entry: ConfigEntry) -> int:
    """Bis 4.0.0-beta.16: je kombinierte Liste ein Unter-Eintrag → alle in die Gruppe „Kombinierte Listen“.
    Erst in die Gruppe eintragen und die Entität umhängen, dann den alten Unter-Eintrag entfernen – so bleiben Name,
    Symbol, Bereich, Entitäts-ID und Häkchen erhalten. Kann diese HA-Version Entitäten nicht umhängen, bleibt alles,
    wie es ist (die alte Form funktioniert weiter). Liefert die Zahl der umgezogenen Listen."""
    from .own_groups import _can_move_entities

    legacy = [s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED]
    if not legacy:
        return 0
    if not _can_move_entities(hass):
        _LOGGER.warning("SmartLists: kombinierte Listen bleiben einzeln – diese Home-Assistant-Version kann Entitäten "
                        "nicht zwischen Unter-Einträgen verschieben.")
        return 0
    from homeassistant.helpers import entity_registry as er

    registry = er.async_get(hass)
    moved = 0
    for sub in legacy:
        key = legacy_key(sub)
        async_add(hass, sub.title, dict(sub.data), key=key)
        g = the_group(entry)
        if g is None:
            continue
        eid = registry.async_get_entity_id("todo", DOMAIN, key)
        if eid is not None:
            registry.async_update_entity(eid, config_subentry_id=g.subentry_id, device_id=None)
        hass.config_entries.async_remove_subentry(entry, sub.subentry_id)
        moved += 1
    _LOGGER.info("SmartLists: %s kombinierte Liste(n) in die Gruppe „Kombinierte Listen“ umgezogen", moved)
    return moved
