"""WebSocket-Befehle: Markt-Reihenfolge, Preise, Ausgaben, Vorlagen."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, WATCH_ALL
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


def _first_watch_name(hass: HomeAssistant) -> str:
    return "Merkliste" if str(hass.config.language).startswith("de") else "Watch list"


async def _watch_payload(hass: HomeAssistant, user_id: str, list_id: str | None = None) -> dict[str, Any]:
    """Merkliste des Benutzers (die genannte, sonst seine Standard-Liste), seine Benachrichtigung und alle seine Listen."""
    from .notify import async_get_notifier

    extras, notifier = _extras(hass), await async_get_notifier(hass)
    user = extras.watch_user(user_id, _first_watch_name(hass))
    shown, items = extras.watch_view(user_id, list_id)
    return {"names": [x["name"] for x in items], "items": items, "notify": bool(user.get("notify")), "targets": list(user.get("targets") or []),
            "list": shown, "default": user.get("default"), "show_all": bool(user.get("show_all")),
            "lists": [{"id": x["id"], "name": x["name"], "count": len(x["names"])} for x in user["lists"]],
            # woraus man wählen kann: notify-Dienste (Companion-App, Telegram, …) und notify-Entitäten
            "services": notifier.services(), "entities": notifier.entities()}


@websocket_api.websocket_command({vol.Required("type"): "smartlists/watch", vol.Optional("list"): str})
@websocket_api.async_response
async def ws_watch(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Merklisten des angemeldeten Benutzers (Produkte, bei denen man auf ein Angebot wartet). Jeder hat seine eigenen;
    ohne `list` kommt die Standard-Liste. Die Listen anderer Benutzer sind nicht abrufbar."""
    connection.send_result(msg["id"], await _watch_payload(hass, connection.user.id, msg.get("list")))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/watch_set", vol.Optional("list"): str, vol.Optional("names"): [str],
                                  vol.Optional("add"): str, vol.Optional("remove"): str, vol.Optional("notify"): bool,
                                  vol.Optional("targets"): [dict], vol.Optional("new_list"): str, vol.Optional("rename"): str,
                                  vol.Optional("make_default"): bool, vol.Optional("delete_list"): bool,
                                  vol.Optional("show_all"): bool})
@websocket_api.async_response
async def ws_watch_set(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigene Merkliste ändern: ganz ersetzen (names), ein Produkt hinzufügen/entfernen, Benachrichtigung und ihre Ziele.
    Listen verwalten: new_list (Name) legt eine an, rename / make_default / delete_list gelten für `list`.
    Mit list = "all" (alle Merklisten zusammen): Neues kommt in die Standard-Liste, Entfernen gilt für jede Liste.
    show_all merkt sich, ob der Benutzer ohne Angabe einer Liste alle zusammen sieht."""
    extras, user_id = _extras(hass), connection.user.id
    extras.watch_user(user_id, _first_watch_name(hass))
    list_id = msg.get("list")
    if list_id == WATCH_ALL and not msg.get("new_list"):
        extras.change_all_watch(user_id, [*(msg.get("names") or []), *([msg["add"]] if msg.get("add") else [])], msg.get("remove"))
        settings = {k: msg[k] for k in ("notify", "targets", "show_all") if k in msg}
        if settings:
            extras.set_user_watch(user_id, None, None, settings)
        if settings.get("notify"):
            from .offers import async_check_watch

            await async_check_watch(hass)
        connection.send_result(msg["id"], await _watch_payload(hass, user_id, WATCH_ALL))
        return
    try:
        if msg.get("new_list"):
            list_id = extras.add_watch_list(user_id, msg["new_list"])
        if list_id and (msg.get("rename") is not None or msg.get("make_default") or msg.get("delete_list")):
            extras.change_watch_list(user_id, list_id, name=msg.get("rename"), default=bool(msg.get("make_default")), delete=bool(msg.get("delete_list")))
            if msg.get("delete_list"):
                list_id = None
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    names = list(msg["names"]) if "names" in msg else list(extras.watch_list(user_id, list_id)["names"])
    if msg.get("add"):
        names.append(msg["add"])
    if msg.get("remove"):
        names = [n for n in names if n.lower() != msg["remove"].strip().lower()]
    settings = {k: msg[k] for k in ("notify", "targets", "show_all") if k in msg}
    extras.set_user_watch(user_id, list_id, names, settings or None)
    if settings.get("notify"):
        from .offers import async_check_watch

        await async_check_watch(hass)
    connection.send_result(msg["id"], await _watch_payload(hass, user_id, list_id))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/categorize", vol.Required("names"): [str], vol.Optional("language"): str})
@callback
def ws_categorize(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einkaufs-Kategorie für viele Namen auf einmal – die Angebots-Karte sortiert damit „Alle Angebote“ nach Kategorie."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"map": {name: learning.resolve(name)[0] for name in msg["names"][:3000]},
                                       "categories": learning.categories.as_list(msg.get("language"))})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/offer_prices",
                                  vol.Required("offers"): vol.All([vol.ExactSequence([vol.All(str, vol.Length(min=1, max=200)), vol.Coerce(float)])], vol.Length(max=8000)),
                                  vol.Optional("local"): dict})
@callback
def ws_offer_prices(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Preisverlauf der Angebote, zentral für alle Browser und die App (offer_history.py). Die Karte nennt die Angebote,
    die sie gerade zeigt (Schlüssel „markt|name“, Preis); zurück kommt je Schlüssel der gemerkte Stand mit dem Preis
    davor. `local`: das frühere Preis-Gedächtnis dieses Browsers – wird einmal übernommen, soweit es hier fehlt."""
    history = hass.data.get(DOMAIN, {}).get("offer_history")
    if history is None:
        connection.send_error(msg["id"], "not_ready", "SmartLists ist noch nicht bereit.")
        return
    adopted = history.adopt(msg["local"]) if msg.get("local") else 0
    from .offer_history import KEEP_DAYS

    connection.send_result(msg["id"], {"seen": history.merge([(k, float(p)) for k, p in msg["offers"]]), "days": KEEP_DAYS, "adopted": adopted})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/watch_sources", vol.Required("sources"): [dict]})
@callback
def ws_watch_sources(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigene Angebots-Quellen einer Karte (sources: mit Feld-Zuordnung) für die Hintergrund-Prüfung der Merkliste merken.
    Die Karte meldet sie von selbst; übernommen wird nur von Admins (sie richten die Karte ein), je Sensor der neueste Stand."""
    extras = _extras(hass)
    if connection.user.is_admin:
        from .offers import clean_sources

        new = clean_sources(msg["sources"])
        keep = [s for s in (extras.watch_settings.get("sources") or []) if not any(n["entity"] == s["entity"] for n in new)]
        merged = [*keep, *new][-20:]
        if merged != (extras.watch_settings.get("sources") or []):
            extras.watch_settings["sources"] = merged
            extras.set_watch(None, {})
    connection.send_result(msg["id"], {"sources": len(extras.watch_settings.get("sources") or [])})
