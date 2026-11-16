"""WebSocket-Befehle: Markt-Reihenfolge, Preise, Ausgaben, Vorlagen."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .ws_common import (
    _denied,
    _extras,
    _learning,
    _list_command,
)


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/store_order", vol.Required("store"): str,
                                  vol.Optional("zone"): vol.Any(str, None), vol.Optional("order"): vol.Any([str], None)})
@callback
def ws_store_order(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Gang-Reihenfolge der Kategorien für einen Markt (optional je Zone). order=None → Standard."""
    try:
        result = _extras(hass).set_store_order(msg["store"], msg.get("order"), msg.get("zone"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"store_order": result})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_price", vol.Required("name"): str,
                                  vol.Optional("price"): vol.Any(vol.Coerce(float), None), vol.Optional("store"): vol.Any(str, None),
                                  # 4.0: der Preis gehört (auch) zu genau diesem Eintrag
                                  vol.Optional("entity_id"): str, vol.Optional("uid"): str})
@callback
def ws_set_price(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Preis je Einheit für einen Artikel merken (None = vergessen)."""
    if _denied(hass, connection, msg, "prices"):
        return
    price = msg.get("price")
    if price is not None and not 0 <= price < 100000:
        connection.send_error(msg["id"], "invalid", "Preis ungültig")
        return
    _extras(hass).set_price(msg["name"], price, msg.get("store"))
    if msg.get("entity_id") and msg.get("uid"):
        _extras(hass).set_item_price(msg["entity_id"], msg["uid"], price)
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/price_history", vol.Required("name"): str})
@callback
def ws_price_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Preis-Verlauf eines Artikels (neueste zuerst): eigener Preis und „beim Abhaken bezahlt“."""
    connection.send_result(msg["id"], {"entries": _extras(hass).price_history(msg["name"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/expenses",
                                  vol.Optional("period", default="month"): vol.In(["week", "month", "year"]),
                                  vol.Optional("count", default=6): vol.All(int, vol.Range(min=1, max=24))})
@callback
def ws_expenses(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], _extras(hass).expense_report(msg["period"], msg["count"]))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/templates"})
@callback
def ws_templates(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"templates": [{"id": k, **v} for k, v in _extras(hass).templates.items()]})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/save_template", vol.Optional("template_id"): str,
                                  vol.Required("name"): str, vol.Required("items"): [str], vol.Optional("emoji", default=""): str,
                                  vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None)})
@callback
def ws_save_template(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    try:
        tid = _extras(hass).save_template(msg.get("template_id"), msg["name"], msg["items"], msg["emoji"], msg.get("servings"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"template_id": tid})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_template", vol.Required("template_id"): str})
@callback
def ws_delete_template(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    _extras(hass).delete_template(msg["template_id"])
    connection.send_result(msg["id"], {})


@_list_command({vol.Required("type"): "smartlists/add_template", vol.Required("entity_id"): str, vol.Required("template_id"): str,
                vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None), vol.Optional("skip", default=[]): [int]})
async def ws_add_template(hass, msg, context):
    from .automation import add_template_items

    return await add_template_items(hass, msg["entity_id"], msg["template_id"], msg.get("servings"), msg["skip"], context)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/stats", vol.Optional("days", default=90): vol.All(int, vol.Range(min=0, max=3650))})
@callback
def ws_stats(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .extras import stats

    connection.send_result(msg["id"], stats(_learning(hass), _extras(hass), msg["days"]))


async def _watch_payload(hass: HomeAssistant) -> dict[str, Any]:
    from .notify import async_get_notifier

    extras, notifier = _extras(hass), await async_get_notifier(hass)
    return {"names": list(extras.watch), "notify": bool(extras.watch_settings.get("notify")),
            "targets": list(extras.watch_settings.get("targets") or []),
            # woraus man wählen kann: notify-Dienste (Companion-App, Telegram, …) und notify-Entitäten
            "services": notifier.services(), "entities": notifier.entities()}


@websocket_api.websocket_command({vol.Required("type"): "smartlists/watch"})
@websocket_api.async_response
async def ws_watch(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Merkliste des Haushalts (Produkte, bei denen man auf ein Angebot wartet) und ihre Benachrichtigung."""
    connection.send_result(msg["id"], await _watch_payload(hass))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/watch_set", vol.Optional("names"): [str], vol.Optional("add"): str,
                                  vol.Optional("remove"): str, vol.Optional("notify"): bool, vol.Optional("targets"): [dict]})
@websocket_api.async_response
async def ws_watch_set(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Merkliste ändern: ganz ersetzen (names), ein Produkt hinzufügen/entfernen; Benachrichtigung nur für Admins."""
    extras = _extras(hass)
    names = list(msg["names"]) if "names" in msg else list(extras.watch)
    if msg.get("add"):
        names.append(msg["add"])
    if msg.get("remove"):
        names = [n for n in names if n.lower() != msg["remove"].strip().lower()]
    settings = {k: msg[k] for k in ("notify", "targets") if k in msg}
    if settings and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Die Benachrichtigung stellt ein Admin ein.")
        return
    extras.set_watch(names, settings or None)
    if settings.get("notify"):
        from .offers import async_check_watch

        await async_check_watch(hass)
    connection.send_result(msg["id"], await _watch_payload(hass))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/categorize", vol.Required("names"): [str], vol.Optional("language"): str})
@callback
def ws_categorize(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einkaufs-Kategorie für viele Namen auf einmal – die Angebots-Karte sortiert damit „Alle Angebote“ nach Kategorie."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"map": {name: learning.resolve(name)[0] for name in msg["names"][:3000]},
                                       "categories": learning.categories.as_list(msg.get("language"))})
