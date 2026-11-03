"""WebSocket-Befehle für die Lovelace-Karte (und später die App).

Alle Befehle beginnen mit "smartlists/". Lesen darf jeder angemeldete HA-Benutzer, Ändern der
Tag-Regeln und Vergessen gelernter Stichwörter nur Administratoren.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .learning import Learning


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (ws_config, ws_suggest, ws_describe, ws_set_category, ws_learned, ws_forget, ws_set_tag_rules,
                    ws_user_settings, ws_set_user_settings):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/config"})
@callback
def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorien, Tag-Regeln, bekannte Märkte."""
    connection.send_result(msg["id"], _learning(hass).config())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/suggest",
        vol.Required("query"): str,
        vol.Optional("entity_id"): str,
        vol.Optional("limit", default=8): vol.All(int, vol.Range(min=1, max=30)),
    }
)
@websocket_api.async_response
async def ws_suggest(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Autovervollständigung. Mit entity_id fließen auch Artikel dieser Liste ein."""
    names: list[str] = []
    if entity_id := msg.get("entity_id"):
        try:
            response = await hass.services.async_call(
                "todo", "get_items", {"entity_id": entity_id}, blocking=True, return_response=True
            )
            names = [i.get("summary", "") for i in ((response or {}).get(entity_id) or {}).get("items", [])]
        except Exception:  # noqa: BLE001 – Vorschläge sollen nie an einer Liste scheitern
            names = []
    connection.send_result(msg["id"], _learning(hass).suggest(msg["query"], names, msg["limit"]))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/describe", vol.Required("texts"): [str]})
@callback
def ws_describe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Artikeltexte zerlegen: Name, Menge, Einheit, Tags, Kategorie (für Vorschau beim Tippen)."""
    learning = _learning(hass)
    result = []
    for text in msg["texts"][:200]:
        info = learning.describe(text)
        info["unit_hint"] = learning.unit_for(info["name"])
        result.append(info)
    connection.send_result(msg["id"], {"items": result})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_category",
        vol.Required("name"): str,
        vol.Required("category"): vol.Any(str, None),
    }
)
@callback
def ws_set_category(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorie für einen Artikel merken (gilt künftig auch für ähnliche Artikel)."""
    learning = _learning(hass)
    name = learning.parse(msg["name"]).name
    try:
        learning.set_category(name, msg["category"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_category", str(err))
        return
    connection.send_result(msg["id"], learning.describe(name))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/learned"})
@callback
def ws_learned(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"learned": _learning(hass).learned_list()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/forget", vol.Required("word"): str})
@callback
def ws_forget(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    _learning(hass).forget(msg["word"])
    connection.send_result(msg["id"], {"learned": _learning(hass).learned_list()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_tag_rules",
        vol.Required("rules"): [{vol.Required("prefix"): str, vol.Required("kind"): str}],
    }
)
@callback
def ws_set_tag_rules(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Namenskonvention ändern, z.B. "@" = Markt, "*" = Person, "#" = Schlagwort."""
    try:
        _learning(hass).set_tag_rules(msg["rules"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_rules", str(err))
        return
    connection.send_result(msg["id"], _learning(hass).config())


@websocket_api.websocket_command({vol.Required("type"): "smartlists/user_settings"})
@callback
def ws_user_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Haushalts-Standard + eigene Abweichungen des angemeldeten Benutzers."""
    connection.send_result(msg["id"], _learning(hass).user_settings(connection.user.id))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_user_settings",
        vol.Required("settings"): dict,
        # "user" = eigene Abweichungen, "household" = Standard für alle (nur Admins)
        vol.Optional("scope", default="user"): vol.In(["user", "household"]),
    }
)
@callback
def ws_set_user_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Jeder Benutzer ändert nur seine eigenen Einstellungen; den Haushalts-Standard nur Admins."""
    learning = _learning(hass)
    if msg["scope"] == "household" and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Administratoren können den Standard ändern.")
        return
    try:
        if msg["scope"] == "household":
            result = learning.set_ui_defaults(msg["settings"], connection.user.id)
        else:
            result = learning.set_user_settings(connection.user.id, msg["settings"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_settings", str(err))
        return
    connection.send_result(msg["id"], result)
