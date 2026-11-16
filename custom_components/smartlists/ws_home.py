"""WebSocket-Befehle: „Bin im Laden“, fällige Artikel, Export/Import, Automations-Einstellungen."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .ws_common import (
    _extras,
    _learning,
)


# ----------------------------------------------------------------------
# „Bin im Laden“, fällige Artikel, Export/Import, Automations-Einstellungen
# ----------------------------------------------------------------------
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/shopping",
        vol.Required("entity_id"): str,
        vol.Required("active"): bool,
        vol.Optional("store"): vol.Any(str, None),
        vol.Optional("open_items"): vol.Any(int, None),
    }
)
@callback
def ws_shopping(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Karte/App: Einkaufsmodus gestartet/beendet → Ereignis smartlists_shopping."""
    from .automation import fire_shopping

    user = connection.user
    fire_shopping(hass, msg["entity_id"], msg["active"], msg.get("store"), user.id, user.name,
                  msg.get("open_items"), connection.context(msg))
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/due", vol.Optional("entity_id"): str})
@websocket_api.async_response
async def ws_due(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Fällige Artikel (Rhythmus aus dem Verlauf), ohne die, die schon offen auf der Liste stehen."""
    present: list[str] = []
    if entity_id := msg.get("entity_id"):
        try:
            present = [i["text"] for i in await lists.raw_items(hass, entity_id) if not i["checked"]]
        except lists.ListError:
            present = []
    connection.send_result(msg["id"], {"due": _learning(hass).due_items(present)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/export", vol.Optional("include_history", default=True): bool})
@callback
def ws_export(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    data = _learning(hass).export(msg["include_history"])
    data["extras"] = _extras(hass).export()  # Reihenfolgen, Preise, Vorlagen, Strichcodes, Ausgaben
    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/import", vol.Required("data"): dict, vol.Optional("replace", default=False): bool}
)
@callback
def ws_import(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        counts = _learning(hass).import_data(msg["data"], msg["replace"])
        _extras(hass).import_data(msg["data"].get("extras") or {})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_import", str(err))
        return
    connection.send_result(msg["id"], {"imported": counts})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/automation"})
@callback
def ws_automation(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"settings": _learning(hass).automation})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_automation", vol.Required("settings"): dict})
@callback
def ws_set_automation(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .barcode import PROVIDERS

    raw = msg["settings"]
    settings: dict[str, Any] = {k: raw[k] for k in ("voice_default_list", "auto_due_list") if isinstance(raw.get(k), str)}
    # Strichcodes: Nachschlagen an/aus, Dienste in Reihenfolge, eigener Dienst (fehlten bisher → wurden nie gespeichert)
    if isinstance(raw.get("barcode_lookup"), bool):
        settings["barcode_lookup"] = raw["barcode_lookup"]
    if isinstance(raw.get("barcode_providers"), list):
        settings["barcode_providers"] = list(dict.fromkeys(p for p in raw["barcode_providers"] if p in PROVIDERS))
    for key in ("barcode_custom_url", "barcode_custom_field"):
        if isinstance(raw.get(key), str):
            settings[key] = raw[key].strip()[:300]
    url = settings.get("barcode_custom_url")
    if url and not url.startswith("https://"):
        connection.send_error(msg["id"], "invalid", "Eigener Dienst: Adresse muss mit https:// beginnen.")
        return
    _learning(hass).set_automation(settings)
    connection.send_result(msg["id"], {"settings": _learning(hass).automation})
