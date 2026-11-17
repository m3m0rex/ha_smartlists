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


@_list_command({vol.Required("type"): "smartlists/set_item_marks", vol.Required("entity_id"): str, vol.Required("uid"): str,
                vol.Optional("favorite"): bool, vol.Optional("due"): vol.Any(str, None), vol.Optional("remind"): bool,
                vol.Optional("calendar"): vol.Any(str, None),
                vol.Optional("name"): str, vol.Optional("op_id"): _OP_ID})
async def ws_set_item_marks(hass: HomeAssistant, msg: dict[str, Any], context: Any) -> dict[str, Any]:
    """Stern, Fälligkeit, Erinnerung und Kalender-Termin eines Eintrags. Wer abhaken darf, darf auch das."""
    from . import calendar_sync

    if not lists.list_permissions(hass, msg["entity_id"]).get("toggle"):
        raise lists.ListError("Auf dieser Liste darfst du das nicht.")
    extras = hass.data.get(DOMAIN, {}).get("extras")
    if extras is None:
        raise lists.ListError("SmartLists ist noch nicht bereit.")
    if msg.get("calendar") and not str(msg["calendar"]).startswith("calendar."):
        raise lists.ListError("Das ist kein Kalender.")
    changes = {k: msg[k] for k in ("favorite", "due", "remind", "name") if k in msg}
    user = msg.get("_user")
    if changes.get("remind") and user is not None:
        changes["by"] = user.id
    old_cal = dict(extras.item_mark(msg["entity_id"], msg["uid"]).get("cal") or {})
    try:
        mark = extras.set_item_mark(msg["entity_id"], msg["uid"], changes)
    except ValueError as err:
        raise lists.ListError(str(err)) from err
    # Kalender: gewünscht ist der neu genannte, sonst der bisherige; der Termin folgt der Fälligkeit
    wanted = msg["calendar"] if "calendar" in msg else old_cal.get("entity")
    due = mark.get("due")
    if not due or not wanted:
        wanted = None
    if old_cal and (wanted != old_cal.get("entity") or due != old_cal.get("due")):
        await calendar_sync.async_remove(hass, old_cal)
        old_cal = {}
        mark = extras.set_item_mark(msg["entity_id"], msg["uid"], {"cal": None})
    if wanted and not old_cal:
        state = hass.states.get(extras.mark_key(msg["entity_id"], msg["uid"])[0])
        try:
            cal = await calendar_sync.async_add(hass, wanted, str(msg.get("name") or mark.get("name") or "SmartLists"), due,
                                                state.name if state else "")
        except Exception as err:  # noqa: BLE001 – Fälligkeit bleibt, nur der Termin fehlt
            raise lists.ListError(f"Fälligkeit gespeichert, aber der Kalender hat den Termin nicht angenommen: {err}") from err
        mark = extras.set_item_mark(msg["entity_id"], msg["uid"], {"cal": cal})
    return {"favorite": bool(mark.get("fav")), "due": mark.get("due"), "remind": bool(mark.get("remind")),
            "calendar": (mark.get("cal") or {}).get("entity")}


@_list_command({vol.Required("type"): "smartlists/offers", vol.Optional("entity_id"): str})
async def ws_offers(hass: HomeAssistant, msg: dict[str, Any], context: Any) -> dict[str, Any]:
    """Angebote für die App: alle Angebote aus den Sensoren und – mit entity_id – je offenem Artikel die passenden.
    `sources` sagt, ob überhaupt Angebots-Sensoren da sind (die App erklärt sonst, was fehlt)."""
    from . import offers as offers_mod

    extras = hass.data.get(DOMAIN, {}).get("extras")
    found = offers_mod.collect(hass, (extras.watch_settings.get("sources") if extras else None))
    result: dict[str, Any] = {"offers": found, "sources": len({o.get("entity_id") or o.get("store") for o in found}), "matches": {}}
    if msg.get("entity_id"):
        data = await lists.get_list(hass, msg["entity_id"], msg.get("_user"))
        for item in data["items"]:
            if not item.get("checked") and item.get("name"):
                deals = offers_mod.deals_for(found, item["name"])
                if deals:
                    result["matches"][item["uid"]] = deals
    return result
