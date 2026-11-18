"""Notizen auf der Seite der Integration: eine Gruppe „Notizen“ mit je Notizliste einer Zeile.

Notizlisten sind lokale To-do-Listen von Home Assistant (die App legt sie an, siehe notes.py) – ihre Entitäten
gehören nicht SmartLists. Damit sie trotzdem neben „Eigene Listen“ und „Kombinierte Listen“ stehen, gibt es einen
Unter-Eintrag „Notizen“ (Typ notes, unique_id „notes“) und darunter je Notizliste ein Gerät ohne Entitäten:
„Name (Besitzer)“ und in der zweiten Zeile, wer sie sieht. „+ Notizen“ legt eine neue Notizliste an.

Der Unter-Eintrag entsteht von selbst, sobald es eine Notizliste gibt.
"""

from __future__ import annotations

import logging
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant

from .const import DOMAIN, SUBENTRY_NOTES

_LOGGER = logging.getLogger(__name__)

NOTES_UID = "notes"
# (Name der Gruppe, „Nur Besitzer“, „Ganzer Haushalt“, „Nur für Admins sichtbar – Besitzer zuweisen“, „kein Besitzer“)
_TEXT = {
    "de": ("Notizen", "Nur Besitzer", "Ganzer Haushalt", "Nur für Admins sichtbar – Besitzer zuweisen", "kein Besitzer"),
    "en": ("Notes", "Owner only", "Whole household", "Visible to admins only – assign an owner", "no owner"),
    "fr": ("Notes", "Propriétaire seulement", "Tout le foyer", "Visible seulement par les admins – attribuer un propriétaire", "sans propriétaire"),
    "es": ("Notas", "Solo el propietario", "Todo el hogar", "Visible solo para administradores: asigna un propietario", "sin propietario"),
    "it": ("Note", "Solo il proprietario", "Tutta la casa", "Visibile solo agli amministratori – assegna un proprietario", "senza proprietario"),
    "pl": ("Notatki", "Tylko właściciel", "Całe gospodarstwo", "Widoczne tylko dla administratorów – przypisz właściciela", "bez właściciela"),
}
_PRETTY = "ha smartlists notes"


def texts(hass: HomeAssistant) -> tuple[str, str, str, str, str]:
    return _TEXT.get((hass.config.language or "en").split("-")[0], _TEXT["en"])


def notes_subentry(entry: ConfigEntry) -> ConfigSubentry | None:
    return next((s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_NOTES), None)


def short_name(friendly: str, group: str) -> str:
    """„HA Smartlists Notes Julia“ → „Julia“; ohne Zusatz: der Name der Gruppe („Notizen“)."""
    name = str(friendly or "").strip()
    if name.lower().startswith(_PRETTY):
        name = name[len(_PRETTY):].strip()
    return name or group


def device_line(hass: HomeAssistant, friendly: str, owner_name: str | None, scope: str) -> tuple[str, str]:
    """Name und zweite Zeile: („Julia (Julia)“ bzw. „Urlaub (Anna)“, „Nur Besitzer“ / „Ganzer Haushalt“ / …)."""
    group, only, household, admins, nobody = texts(hass)
    line = household if scope == "household" else only if owner_name else admins
    return f"{short_name(friendly, group)} ({owner_name or nobody})", line


async def async_sync(hass: HomeAssistant, entry: ConfigEntry) -> int:
    """Gruppe und Zeilen an die vorhandenen Notizlisten angleichen. Liefert die Zahl der Notizlisten."""
    from homeassistant.helpers import device_registry as dr

    notes = hass.data.get(DOMAIN, {}).get("notes")
    if notes is None:
        return 0
    ids = notes.entity_ids()
    sub = notes_subentry(entry)
    if sub is None:
        if not ids:
            return 0
        sub = ConfigSubentry(data=MappingProxyType({}), subentry_type=SUBENTRY_NOTES, title=texts(hass)[0], unique_id=NOTES_UID)
        hass.config_entries.async_add_subentry(entry, sub)
    registry = dr.async_get(hass)
    wanted: set[tuple[str, str]] = set()
    for entity_id in ids:
        state = hass.states.get(entity_id)
        owner_id = notes.owners.get(entity_id)
        owner = await hass.auth.async_get_user(owner_id) if owner_id else None
        name, line = device_line(hass, state.attributes.get(ATTR_FRIENDLY_NAME, entity_id) if state else entity_id,
                                 (owner.name if owner and owner.name else None), notes.scope)
        ident = (DOMAIN, f"notes_{entity_id}")
        wanted.add(ident)
        device = registry.async_get_or_create(config_entry_id=entry.entry_id, config_subentry_id=sub.subentry_id, identifiers={ident},
                                              name=name, manufacturer="SmartLists", model=line, entry_type=dr.DeviceEntryType.SERVICE)
        if device.name != name or device.model != line:
            registry.async_update_device(device.id, name=name, model=line)
    for device in dr.async_entries_for_config_entry(registry, entry.entry_id):
        if any(i[0] == DOMAIN and str(i[1]).startswith("notes_") and i not in wanted for i in device.identifiers):
            registry.async_remove_device(device.id)
    return len(ids)


def async_setup(hass: HomeAssistant, entry: ConfigEntry):
    """Beim Start, sobald Home Assistant fertig ist (dann gibt es die lokalen To-do-Listen) und wenn sich an den
    Notizen etwas ändert. Liefert die Funktion zum Abmelden."""
    from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    from .const import SIGNAL_DATA_CHANGED

    last: list[Any] = [None]

    async def _sync(*_: Any) -> None:
        notes = hass.data.get(DOMAIN, {}).get("notes")
        # das Signal kommt bei jeder Änderung an den Listen – nur arbeiten, wenn sich an den Notizen etwas getan hat
        mark = (tuple(notes.entity_ids()), tuple(sorted(notes.owners.items())), notes.scope) if notes is not None else None
        if mark == last[0]:
            return
        last[0] = mark
        try:
            await async_sync(hass, entry)
        except Exception:  # noqa: BLE001 – nur die Anzeige auf der Seite der Integration
            _LOGGER.warning("SmartLists: Notizen auf der Seite der Integration nicht aktualisiert", exc_info=True)

    def _later(*_: Any) -> None:
        hass.async_create_task(_sync())

    hass.async_create_task(_sync())
    stops = [async_dispatcher_connect(hass, SIGNAL_DATA_CHANGED, _later)]
    if not hass.is_running:
        stops.append(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _later))

    def _stop() -> None:
        for stop in stops:
            try:
                stop()
            except Exception:  # noqa: BLE001 – der einmalige Zuhörer ist nach dem Start schon weg
                pass

    return _stop
