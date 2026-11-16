"""WebSocket-Befehle: Listen und Artikel, verbundene Geräte."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .ws_common import (
    _list_command,
)

# Kennung einer Änderung aus der Karte – eine Wiederholung nach Verbindungsabbruch wird nicht doppelt ausgeführt
_OP_ID = vol.All(str, vol.Length(min=6, max=64))


@_list_command({vol.Required("type"): "smartlists/get_list", vol.Required("entity_id"): str, vol.Optional("language"): str})
async def ws_get_list(hass, msg, context):
    """Liste mit zerlegten Artikeln (Name, Menge, Einheit, Tags, Kategorie) und Rechten."""
    return await lists.get_list(hass, msg["entity_id"], msg["_user"], msg.get("language"))


@_list_command({vol.Required("type"): "smartlists/lists"})
async def ws_lists(hass, msg, context):
    return {"lists": await lists.all_lists(hass, msg["_user"])}


@_list_command(
    {
        vol.Required("type"): "smartlists/add_item",
        vol.Required("entity_id"): str,
        vol.Required("text"): str,
        vol.Optional("note", default=""): str,
        vol.Optional("checked", default=False): bool,
        vol.Optional("op_id"): _OP_ID,
    }
)
async def ws_add_item(hass, msg, context):
    return await lists.add_item(hass, msg["entity_id"], msg["text"], msg["note"], msg["checked"], context)


@_list_command(
    {
        vol.Required("type"): "smartlists/update_item",
        vol.Required("entity_id"): str,
        vol.Required("uid"): str,
        vol.Optional("checked"): bool,
        vol.Optional("text"): str,
        vol.Optional("note"): str,
        vol.Optional("op_id"): _OP_ID,
    }
)
async def ws_update_item(hass, msg, context):
    return await lists.update_item(
        hass, msg["entity_id"], msg["uid"], checked=msg.get("checked"), text=msg.get("text"), note=msg.get("note"),
        context=context,
    )


@_list_command(
    {vol.Required("type"): "smartlists/remove_items", vol.Required("entity_id"): str, vol.Required("uids"): [str],
     vol.Optional("op_id"): _OP_ID}
)
async def ws_remove_items(hass, msg, context):
    return await lists.remove_items(hass, msg["entity_id"], msg["uids"], context)


@_list_command({vol.Required("type"): "smartlists/clear_expired_offers", vol.Required("entity_id"): str})
async def ws_clear_expired_offers(hass, msg, context):
    return await lists.clear_expired_offers(hass, msg["entity_id"], context)


@_list_command({vol.Required("type"): "smartlists/clear_completed", vol.Required("entity_id"): str})
async def ws_clear_completed(hass, msg, context):
    return await lists.clear_completed(hass, msg["entity_id"], context)


@_list_command(
    {
        vol.Required("type"): "smartlists/move_item",
        vol.Required("entity_id"): str,
        vol.Required("uid"): str,
        vol.Required("target"): str,
        vol.Optional("copy", default=False): bool,
    }
)
async def ws_move_item(hass, msg, context):
    return await lists.move_item(hass, msg["entity_id"], msg["uid"], msg["target"], msg["copy"], context)


# ----------------------------------------------------------------------
# Verbundene Geräte (App-Installationen) – siehe devices.py
# ----------------------------------------------------------------------
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/register_device",
        vol.Required("device_id"): str,
        vol.Optional("name"): str,
        vol.Optional("model"): str,
        vol.Optional("manufacturer"): str,
        vol.Optional("app_version"): str,
        vol.Optional("os_version"): str,
        vol.Optional("notes_lists"): [str],
        # kombinierte Listen der App (nur aus HA-Listen) – lassen sich in der Integration verbinden
        vol.Optional("app_lists"): [dict],
    }
)
@callback
def ws_register_device(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """App meldet sich an (beim Koppeln und bei jedem Abgleich → „zuletzt gesehen“)."""
    try:
        device = hass.data[DOMAIN]["devices"].register(
            msg["device_id"], msg, connection.user.id, connection.user.name or ""
        )
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_device", str(err))
        return
    if msg.get("notes_lists") and hass.data[DOMAIN].get("notes"):
        # Notizlisten der App gehören dem Konto, mit dem die App angemeldet ist
        hass.data[DOMAIN]["notes"].claim(msg["notes_lists"], connection.user.id)
    connection.send_result(msg["id"], {"device": device})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/devices"})
@callback
def ws_devices(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Admins sehen alle Geräte, andere Benutzer nur ihre eigenen."""
    devices = hass.data[DOMAIN]["devices"]
    user = connection.user
    connection.send_result(msg["id"], {"devices": devices.entries(None if user.is_admin else user.id)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/remove_device", vol.Required("device_id"): str})
@callback
def ws_remove_device(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    hass.data[DOMAIN]["devices"].remove(msg["device_id"])
    connection.send_result(msg["id"], {"devices": hass.data[DOMAIN]["devices"].entries()})
