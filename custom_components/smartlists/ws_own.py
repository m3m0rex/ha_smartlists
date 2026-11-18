"""WebSocket-Befehle: Eigene Listen mit Besitzer und Freigaben."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .ws_common import (
    _combined_subentry,
    _denied,
    _main_entry,
    _own_list,
)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/users"})
@websocket_api.async_response
async def ws_users(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Personen des Haushalts für die Freigabe-Auswahl (keine System-Benutzer)."""
    from .own import async_household_users

    connection.send_result(msg["id"], {"users": await async_household_users(hass), "me": connection.user.id})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/create_list", vol.Required("name"): vol.All(str, vol.Length(min=1, max=60))})
@websocket_api.async_response
async def ws_create_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Neue eigene Liste; Besitzer ist, wer sie anlegt (landet in der Gruppe „Eigene Listen“)."""
    if _denied(hass, connection, msg, "create_lists"):
        return
    from .own_groups import async_add_list

    try:
        list_id = await async_add_list(hass, connection.user.id, msg["name"])
    except ValueError as err:
        connection.send_error(msg["id"], "not_setup", str(err))
        return
    # Die Entität entsteht erst, wenn die Integration neu geladen hat: kurz warten und ihre ID mitliefern – die App
    # trägt danach gleich die Artikel ein (Übertragen einer Liste vom Smartphone)
    import asyncio

    from homeassistant.helpers import entity_registry as er

    entity_id = None
    for _ in range(40):
        entity_id = er.async_get(hass).async_get_entity_id("todo", DOMAIN, f"own_{list_id}")
        if entity_id and hass.states.get(entity_id) is not None:
            break
        await asyncio.sleep(0.25)
    connection.send_result(msg["id"], {"list_id": list_id, "entity_id": entity_id})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/share",
        vol.Required("entity_id"): str,
        vol.Required("user_id"): str,
        vol.Required("role"): vol.Any(None, vol.In(["viewer", "checker", "editor"])),
    }
)
@websocket_api.async_response
async def ws_share(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Freigabe setzen (role) oder entfernen (role = null). Nur Besitzer und Admins."""
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann Freigaben ändern.")
        return
    if msg["user_id"] == data.get("owner"):
        connection.send_error(msg["id"], "invalid", "Der Besitzer hat schon alle Rechte.")
        return
    if await hass.auth.async_get_user(msg["user_id"]) is None:
        connection.send_error(msg["id"], "invalid", "Unbekannter Benutzer.")
        return
    shares = dict(data.get("shares") or {})
    if msg["role"] is None:
        shares.pop(msg["user_id"], None)
    else:
        shares[msg["user_id"]] = msg["role"]
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        if not data.get("owner"):
            connection.send_error(msg["id"], "invalid", "Erst einen Besitzer festlegen.")
            return
        from .combined_group import async_update

        async_update(hass, csub, data={**csub.data, "shares": shares})
    elif getattr(entity, "grouped", False):
        from .own_groups import async_update_list

        await async_update_list(hass, entity.list_id, shares=shares)
    else:
        entry = _main_entry(hass)
        sub = entry.subentries[entity.subentry.subentry_id]
        hass.config_entries.async_update_subentry(entry, sub, data={**sub.data, "shares": shares})
    connection.send_result(msg["id"], {"shares": shares})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_owner", vol.Required("entity_id"): str,
                                  vol.Required("owner"): vol.Any(str, None)})
@websocket_api.async_response
async def ws_set_owner(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Besitzer einer eigenen oder kombinierten Liste festlegen (Admins und der bisherige Besitzer).
    Kombinierte Listen: owner = null → wieder für alle sichtbar und bearbeitbar."""
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene oder kombinierte SmartLists-Liste.")
        return
    user = connection.user
    if not user.is_admin and data.get("owner") != user.id:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins und der Besitzer können das ändern.")
        return
    owner = msg["owner"] or None
    if owner and await hass.auth.async_get_user(owner) is None:
        connection.send_error(msg["id"], "invalid", "Unbekannter Benutzer.")
        return
    shares = {u: r for u, r in (data.get("shares") or {}).items() if u != owner}
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        new = {**csub.data, "owner": owner, "shares": shares if owner else {}}
        if not owner:
            new.pop("owner", None)
        from .combined_group import async_update

        async_update(hass, csub, data=new)
    elif getattr(entity, "grouped", False):
        if not owner:
            connection.send_error(msg["id"], "invalid", "Eigene Listen brauchen einen Besitzer.")
            return
        from .own_groups import async_update_list

        await async_update_list(hass, entity.list_id, owner=owner)
    else:
        connection.send_error(msg["id"], "invalid", "Bitte die Integration einmal neu laden.")
        return
    connection.send_result(msg["id"], {"owner": owner})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_labels", vol.Required("entity_id"): str,
                                  vol.Required("show"): vol.In(["list", "owner", "owner_list"]),
                                  vol.Optional("sources", default=[]): [str],
                                  vol.Optional("colors", default={}): {str: vol.Any("", vol.Match(r"^#[0-9a-fA-F]{6}$"))}})
@websocket_api.async_response
async def ws_set_labels(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Herkunfts-Badges einer kombinierten Liste: was sie zeigen (Liste / Besitzer / Besitzer Liste) und von welchen
    Quell-Listen es überhaupt Badges gibt (leer = alle). Admins und der Besitzer der kombinierten Liste."""
    from .const import CONF_LABEL_COLORS, CONF_LABEL_SHOW, CONF_LABEL_SOURCES, CONF_SOURCES

    sub = _combined_subentry(hass, msg["entity_id"])
    if sub is None:
        connection.send_error(msg["id"], "not_found", "Keine kombinierte SmartLists-Liste.")
        return
    user = connection.user
    if not user.is_admin and sub.data.get("owner") != user.id:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins und der Besitzer können das ändern.")
        return
    sources = [s for s in dict.fromkeys(msg["sources"]) if s in (sub.data.get(CONF_SOURCES) or [])]
    colors = {s: c.lower() for s, c in msg["colors"].items() if c and s in (sub.data.get(CONF_SOURCES) or [])}
    from .combined_group import async_update

    async_update(hass, sub, data={**sub.data, CONF_LABEL_SHOW: msg["show"], CONF_LABEL_SOURCES: sources, CONF_LABEL_COLORS: colors})
    connection.send_result(msg["id"], {"show": msg["show"], "sources": sources, "colors": colors})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_list", vol.Required("entity_id"): str})
@callback
def ws_delete_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    entity, data = _own_list(hass, msg["entity_id"])
    if data is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann die Liste löschen.")
        return
    if (csub := _combined_subentry(hass, msg["entity_id"])) is not None:
        from .combined_group import async_remove

        async_remove(hass, csub)  # Quell-Listen bleiben
    elif getattr(entity, "grouped", False):
        from .own_groups import async_remove_list

        try:
            async_remove_list(hass, entity.list_id)
        except ValueError as err:  # z. B. noch Teil einer kombinierten Liste
            connection.send_error(msg["id"], "in_use", str(err))
            return
    else:
        hass.config_entries.async_remove_subentry(_main_entry(hass), entity.subentry.subentry_id)
    connection.send_result(msg["id"], {})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/install_sentences"})
@websocket_api.async_response
async def ws_install_sentences(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .automation import async_install_sentences

    connection.send_result(msg["id"], {"languages": await async_install_sentences(hass)})
