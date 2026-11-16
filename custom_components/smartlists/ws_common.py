"""Gemeinsame Helfer der WebSocket-Befehle (ws_*.py): Zugriff auf die Speicher, Rechte-Prüfungen, Zurücksetzen."""

from __future__ import annotations

import logging

from typing import Any


from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from . import lists
from .const import DOMAIN, SUBENTRY_COMBINED
from .learning import Learning

# Version der Befehlsschnittstelle. Erhöhen, wenn sich Befehle/Antworten inkompatibel ändern –
# App und Karte prüfen das beim Koppeln (smartlists/info).
API_VERSION = 1

_LOGGER = logging.getLogger(__name__)


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


def _list_command(schema: dict[Any, Any]):
    """Gemeinsamer Rahmen: Fehler als verständliche Meldung, Änderungen im Namen des Benutzers."""

    def wrap(func):
        @websocket_api.websocket_command(schema)
        @websocket_api.async_response
        async def handler(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
            try:
                # Benutzer für Freigaben eigener Listen (get_list/lists); Änderungen prüft die Entität selbst
                msg = {**msg, "_user": connection.user}
                # Notizlisten anderer Konten: weder lesen noch ändern (auch nicht als Ziel)
                for key in ("entity_id", "target"):
                    if msg.get(key) and not lists.notes_allowed(hass, msg[key], connection.user):
                        raise lists.ListError("Diese Notizliste gehört zu einem anderen Konto.")
                result = await func(hass, msg, connection.context(msg))
            except lists.ListError as err:
                connection.send_error(msg["id"], "smartlists_error", str(err))
                return
            except Exception as err:  # noqa: BLE001 – Karte soll eine Meldung statt Hängen sehen
                _LOGGER.exception("SmartLists: %s fehlgeschlagen", msg.get("type"))
                connection.send_error(msg["id"], "smartlists_error", str(err) or type(err).__name__)
                return
            connection.send_result(msg["id"], result)

        handler.__name__ = func.__name__
        return handler

    return wrap


def _main_entry(hass: HomeAssistant):
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def _combined_subentry(hass: HomeAssistant, entity_id: str):
    from .todo import list_key

    entity = lists.combined_entity(hass, entity_id)
    entry = _main_entry(hass)
    if entity is None or entry is None:
        return None
    return next((s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED and list_key(s) == entity.unique_id), None)


def _own_list(hass: HomeAssistant, entity_id: str) -> tuple[Any, dict[str, Any] | None]:
    """(Entität, Daten der Liste inkl. owner/shares) einer eigenen Liste – gruppiert oder alte Form –
    bzw. einer kombinierten Liste (Besitzer optional)."""
    entity = lists.own_entity(hass, entity_id)
    entry = _main_entry(hass)
    if entity is None and (sub := _combined_subentry(hass, entity_id)) is not None:
        return lists.combined_entity(hass, entity_id), {"owner": sub.data.get("owner"), "shares": dict(sub.data.get("shares") or {})}
    if entity is None or entry is None:
        return None, None
    if getattr(entity, "grouped", False):
        from .own_groups import find

        g, data = find(entry, entity.list_id)
        return (entity, {**data, "owner": g.data.get("owner")}) if g and data is not None else (None, None)
    sub = entry.subentries.get(entity.subentry.subentry_id)
    return (entity, dict(sub.data)) if sub else (None, None)


def _backups(hass: HomeAssistant):
    return hass.data[DOMAIN]["app_backups"]


def _may_see(hass: HomeAssistant, connection: websocket_api.ActiveConnection, device_id: str) -> bool:
    return device_id in _backups(hass).visible(connection.user.id, connection.user.is_admin)


def _packs(hass: HomeAssistant):
    return hass.data[DOMAIN]["packs"]


def _extras(hass: HomeAssistant):
    return hass.data[DOMAIN]["extras"]


def _may_share(hass: HomeAssistant, entity_id: str, user: Any) -> str | None:
    """Fehlermeldung, wenn der Benutzer diese Liste nicht teilen darf (sonst None)."""
    if not entity_id.startswith("todo.") or hass.states.get(entity_id) is None:
        return "Liste nicht gefunden."
    if lists.is_notes(hass, entity_id):
        return "Notizlisten lassen sich nicht teilen."
    who = _learning(hass).rights()["share_who"]
    if who == "nobody":
        return "Teilen per Link ist ausgeschaltet (Global → Teilen und Rechte)."
    if user.is_admin:
        return None
    own = lists.own_entity(hass, entity_id) is not None
    role = lists.own_role(hass, entity_id, user)
    if who == "owners" and own and role == "owner":
        return None
    if who == "editors" and role in ("owner", "editor"):  # andere Listen: jeder darf sie bearbeiten → role "owner"
        return None
    return "Du darfst diese Liste nicht per Link teilen (legt ein Admin unter Global → Teilen und Rechte fest)."


def _public_info(hass: HomeAssistant) -> dict[str, Any]:
    """Für die Karte: Art der öffentlichen Adresse und die aktuelle (Links mit anderer Tunnel-Adresse gehen nicht mehr)."""
    public = hass.data[DOMAIN].get("public")
    if public is None:
        return {"public_mode": "ha", "public_base": None}
    try:
        base = public.base_url()
    except ValueError:
        base = None
    return {"public_mode": public.mode, "public_base": base}


def _denied(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any], right: str) -> bool:
    """True (und Fehlermeldung gesendet), wenn ein Nicht-Admin etwas tut, das der Admin abgeschaltet hat."""
    if connection.user.is_admin or _learning(hass).rights().get(right, True):
        return False
    connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED,
                          "Das hat ein Admin für Benutzer ohne Admin-Rechte ausgeschaltet (Global → Teilen und Rechte).")
    return True


def _mealie_entry(hass: HomeAssistant) -> str | None:
    entries = [e for e in hass.config_entries.async_entries("mealie") if e.state.value == "loaded"]
    return entries[0].entry_id if entries else None


async def async_reset(hass: HomeAssistant, settings: bool, data: bool, links: bool, combined: bool) -> dict[str, Any]:
    """SmartLists von vorn: Teile zurücksetzen und den Einrichtungs-Assistenten wieder anbieten.
    To-do-Listen selbst (Local To-do, Einkaufsliste, eigene SmartLists-Listen) werden nie gelöscht."""
    from .const import SUBENTRY_COMBINED

    out: dict[str, Any] = {}
    _learning(hass).reset(settings, data)
    _extras(hass).reset(settings, data)
    if settings:
        packs = hass.data[DOMAIN]["packs"]
        lang = (hass.config.language or "de").split("-")[0]
        try:
            packs.set_active([lang if lang in packs.builtin else "de"])
        except ValueError:
            pass
    if links:
        out["links"] = hass.data[DOMAIN]["shares"].revoke_all()
    if combined:
        entry = _main_entry(hass)
        if entry is not None:
            subs = [s.subentry_id for s in entry.subentries.values() if s.subentry_type == SUBENTRY_COMBINED]
            for sid in subs:
                hass.config_entries.async_remove_subentry(entry, sid)
            out["combined"] = len(subs)
    return out
