"""WebSocket-Befehle: Koppeln, Konfiguration, Vorschläge, Kategorien, Tag-Regeln, Bedien-Einstellungen."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .features import get_features, set_features
from .ws_common import (
    API_VERSION,
    _LOGGER,
    _denied,
    _learning,
)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/config", vol.Optional("language"): str})
@callback
def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorien (in der gewünschten Sprache), Tag-Regeln, bekannte Märkte."""
    extras = hass.data[DOMAIN].get("extras")
    connection.send_result(msg["id"], {**_learning(hass).config(msg.get("language")),
                                       "store_order": extras.store_order if extras else {},
                                       "templates": len(extras.templates) if extras else 0,
                                       "features": get_features(hass)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_features",
                                  vol.Optional("notes"): bool, vol.Optional("mealplan"): bool, vol.Optional("stats"): bool})
@callback
def ws_set_features(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einstellungen → Extras: Notizen und Wochenplan ein-/ausschalten (siehe features.py)."""
    connection.send_result(msg["id"], {"features": set_features(hass, notes=msg.get("notes"), mealplan=msg.get("mealplan"),
                                                                stats=msg.get("stats"))})


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
            _LOGGER.debug("Vorschläge: Liste %s nicht lesbar", entity_id, exc_info=True)
            names = []
    scope = lists.suggest_scope(hass, entity_id) if entity_id else None
    connection.send_result(msg["id"], _learning(hass).suggest(msg["query"], names, msg["limit"], scope))


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
    if _denied(hass, connection, msg, "categories"):
        return
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


def _counts(hass: HomeAssistant, user: Any) -> dict[str, int]:
    """Wie viele Listen SmartLists führt, wie viele Geräte dieses Benutzers verbunden sind und wie viele harte Fehler
    seit dem Start festgehalten wurden. Nur Zahlen – keine Namen."""
    from . import problems
    from .const import SUBENTRY_COMBINED, SUBENTRY_OWN, SUBENTRY_OWN_GROUP

    own = combined = 0
    for entry in hass.config_entries.async_entries(DOMAIN):
        for sub in entry.subentries.values():
            if sub.subentry_type == SUBENTRY_OWN_GROUP:
                own += len(sub.data.get("lists") or {})
            elif sub.subentry_type == SUBENTRY_OWN:
                own += 1
        from .combined_group import refs

        combined += len(refs(entry))
    data = hass.data.get(DOMAIN, {})
    notes, devices = data.get("notes"), data.get("devices")
    return {"own_lists": own, "combined_lists": combined, "notes_lists": len(notes.entity_ids()) if notes else 0,
            "devices": len(devices.entries(None if user.is_admin else user.id)) if devices else 0,
            "problems": len(problems.current(hass))}


# ----------------------------------------------------------------------
# Koppeln (App/Karte): ist die Integration da, welche Version, was kann sie?
# ----------------------------------------------------------------------
@websocket_api.websocket_command({vol.Required("type"): "smartlists/info"})
@websocket_api.async_response
async def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from homeassistant.loader import async_get_integration

    integration = await async_get_integration(hass, DOMAIN)
    connection.send_result(
        msg["id"],
        {
            "integration": DOMAIN,
            "version": str(integration.version),
            "api_version": API_VERSION,
            "features": ["lists", "combined_lists", "categories", "suggestions", "tags", "user_settings", "devices",
                         "shopping_event", "due_items", "export", "own_lists", "app_backups", "packs", "pack_editor",
                         "notes", "store_zones", "appearance", "app_lists",
                         "store_order", "prices", "templates", "share_links", "notify", "barcode", "stats", "live", "rights", "list_settings", "setup", "mealplan", "mealie", "item_history", "migrate", "item_marks", "offers", "list_sensors", "watch_all", "item_event", "counts"],
            "user": {"id": connection.user.id, "name": connection.user.name, "is_admin": connection.user.is_admin},
            # für die Seite „Home Assistant“ der App: Zahlen auf einen Blick und die Märkte mit ihren Zonen
            "counts": _counts(hass, connection.user),
            "zones": _learning(hass).store_zones,
            **_learning(hass).config(),
        },
    )
