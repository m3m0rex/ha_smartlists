"""WebSocket-Befehle für die Lovelace-Karte (und später die App).

Alle Befehle beginnen mit "smartlists/". Lesen darf jeder angemeldete HA-Benutzer, Ändern der
Tag-Regeln und Vergessen gelernter Stichwörter nur Administratoren.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .learning import Learning

# Version der Befehlsschnittstelle. Erhöhen, wenn sich Befehle/Antworten inkompatibel ändern –
# App und Karte prüfen das beim Koppeln (smartlists/info).
API_VERSION = 1


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (ws_info, ws_config, ws_suggest, ws_describe, ws_set_category, ws_learned, ws_forget, ws_set_tag_rules,
                    ws_user_settings, ws_set_user_settings,
                    ws_register_device, ws_devices, ws_remove_device,
                    ws_users, ws_create_list, ws_share, ws_delete_list,
                    ws_install_sentences, ws_shopping, ws_due,
                    ws_store_order, ws_set_price, ws_expenses, ws_templates, ws_save_template, ws_delete_template, ws_add_template, ws_stats, ws_share_links, ws_share_create, ws_share_revoke, ws_notify, ws_set_notify, ws_barcode, ws_app_lists, ws_connect_app_list, ws_appearance, ws_set_appearance, ws_stores, ws_set_store_zone, ws_notes, ws_set_notes, ws_pack_create, ws_pack_terms, ws_pack_update, ws_packs, ws_pack_upload, ws_pack_delete, ws_pack_set_active, ws_pack_export,
                    ws_app_backup_save, ws_app_backups, ws_app_backup_get, ws_app_backup_delete, ws_export, ws_import, ws_automation, ws_set_automation,
                    ws_get_list, ws_lists, ws_add_item, ws_update_item, ws_remove_items, ws_clear_completed, ws_move_item):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/config", vol.Optional("language"): str})
@callback
def ws_config(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Kategorien (in der gewünschten Sprache), Tag-Regeln, bekannte Märkte."""
    extras = hass.data[DOMAIN].get("extras")
    connection.send_result(msg["id"], {**_learning(hass).config(msg.get("language")),
                                       "store_order": extras.store_order if extras else {},
                                       "templates": len(extras.templates) if extras else 0})


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
                         "store_order", "prices", "templates", "share_links", "notify", "barcode", "stats"],
            "user": {"id": connection.user.id, "name": connection.user.name, "is_admin": connection.user.is_admin},
            **_learning(hass).config(),
        },
    )


# ----------------------------------------------------------------------
# Listen
# ----------------------------------------------------------------------
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
                connection.send_error(msg["id"], "smartlists_error", str(err) or type(err).__name__)
                return
            connection.send_result(msg["id"], result)

        handler.__name__ = func.__name__
        return handler

    return wrap


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
    }
)
async def ws_update_item(hass, msg, context):
    return await lists.update_item(
        hass, msg["entity_id"], msg["uid"], checked=msg.get("checked"), text=msg.get("text"), note=msg.get("note"),
        context=context,
    )


@_list_command(
    {vol.Required("type"): "smartlists/remove_items", vol.Required("entity_id"): str, vol.Required("uids"): [str]}
)
async def ws_remove_items(hass, msg, context):
    return await lists.remove_items(hass, msg["entity_id"], msg["uids"], context)


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
    allowed = {"voice_default_list", "auto_due_list"}
    _learning(hass).set_automation({k: v for k, v in msg["settings"].items() if k in allowed})
    connection.send_result(msg["id"], {"settings": _learning(hass).automation})


# ----------------------------------------------------------------------
# Eigene Listen mit Besitzer und Freigaben (own.py)
# ----------------------------------------------------------------------
def _main_entry(hass: HomeAssistant):
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


def _own_subentry(hass: HomeAssistant, entity_id: str):
    entity = lists.own_entity(hass, entity_id)
    entry = _main_entry(hass)
    if entity is None or entry is None:
        return None, None, None
    return entity, entry, entry.subentries.get(entity.subentry.subentry_id)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/users"})
@websocket_api.async_response
async def ws_users(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Personen des Haushalts für die Freigabe-Auswahl (keine System-Benutzer)."""
    from .own import async_household_users

    connection.send_result(msg["id"], {"users": await async_household_users(hass), "me": connection.user.id})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/create_list", vol.Required("name"): vol.All(str, vol.Length(min=1, max=60))})
@callback
def ws_create_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Neue eigene Liste; Besitzer ist, wer sie anlegt."""
    from types import MappingProxyType

    from homeassistant.config_entries import ConfigSubentry

    from .const import SUBENTRY_OWN

    entry = _main_entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_setup", "SmartLists ist nicht eingerichtet.")
        return
    sub = ConfigSubentry(data=MappingProxyType({"owner": connection.user.id, "shares": {}}),
                         subentry_type=SUBENTRY_OWN, title=msg["name"].strip(), unique_id=None)
    hass.config_entries.async_add_subentry(entry, sub)
    connection.send_result(msg["id"], {"subentry_id": sub.subentry_id})


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
    entity, entry, sub = _own_subentry(hass, msg["entity_id"])
    if sub is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann Freigaben ändern.")
        return
    if msg["user_id"] == sub.data.get("owner"):
        connection.send_error(msg["id"], "invalid", "Der Besitzer hat schon alle Rechte.")
        return
    if await hass.auth.async_get_user(msg["user_id"]) is None:
        connection.send_error(msg["id"], "invalid", "Unbekannter Benutzer.")
        return
    shares = dict(sub.data.get("shares") or {})
    if msg["role"] is None:
        shares.pop(msg["user_id"], None)
    else:
        shares[msg["user_id"]] = msg["role"]
    hass.config_entries.async_update_subentry(entry, sub, data={**sub.data, "shares": shares})
    connection.send_result(msg["id"], {"shares": shares})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_list", vol.Required("entity_id"): str})
@callback
def ws_delete_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    entity, entry, sub = _own_subentry(hass, msg["entity_id"])
    if sub is None:
        connection.send_error(msg["id"], "not_found", "Keine eigene SmartLists-Liste.")
        return
    if lists.own_role(hass, msg["entity_id"], connection.user) != "owner":
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur der Besitzer kann die Liste löschen.")
        return
    hass.config_entries.async_remove_subentry(entry, sub.subentry_id)
    connection.send_result(msg["id"], {})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/install_sentences"})
@websocket_api.async_response
async def ws_install_sentences(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .automation import async_install_sentences

    connection.send_result(msg["id"], {"languages": await async_install_sentences(hass)})


# ----------------------------------------------------------------------
# App-Backups (dauerhaft in HA, siehe app_backups.py)
# ----------------------------------------------------------------------
def _backups(hass: HomeAssistant):
    return hass.data[DOMAIN]["app_backups"]


def _may_see(hass: HomeAssistant, connection: websocket_api.ActiveConnection, device_id: str) -> bool:
    return device_id in _backups(hass).visible(connection.user.id, connection.user.is_admin)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/app_backup_save",
        vol.Required("device_id"): str,
        vol.Optional("profile_name", default=""): str,
        vol.Required("data"): str,
    }
)
@callback
def ws_app_backup_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    backups = _backups(hass)
    existing = backups.backups.get(msg["device_id"].strip()[:64])
    # fremdes Backup (anderer Benutzer) nicht überschreiben – außer als Admin
    if existing and existing.get("user_id") != connection.user.id and not connection.user.is_admin:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Backup gehört einem anderen Benutzer.")
        return
    try:
        info = backups.save(msg["device_id"], msg["profile_name"], msg["data"], connection.user.id, connection.user.name or "")
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_backup", str(err))
        return
    connection.send_result(msg["id"], {"backup": info})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backups"})
@callback
def ws_app_backups(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    backups = _backups(hass)
    ids = backups.visible(connection.user.id, connection.user.is_admin)
    connection.send_result(msg["id"], {"backups": sorted((backups.describe(i) for i in ids), key=lambda b: -b["updated_at"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backup_get", vol.Required("device_id"): str})
@callback
def ws_app_backup_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if not _may_see(hass, connection, msg["device_id"]):
        connection.send_error(msg["id"], "not_found", "Backup nicht gefunden.")
        return
    b = _backups(hass).backups[msg["device_id"]]
    connection.send_result(msg["id"], {**_backups(hass).describe(msg["device_id"]), "data": b["data"]})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_backup_delete", vol.Required("device_id"): str})
@callback
def ws_app_backup_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if not _may_see(hass, connection, msg["device_id"]):
        connection.send_error(msg["id"], "not_found", "Backup nicht gefunden.")
        return
    _backups(hass).delete(msg["device_id"])
    connection.send_result(msg["id"], {})


# ----------------------------------------------------------------------
# Keyword-Packs (Kategorie-Erkennung, siehe packs.py)
# ----------------------------------------------------------------------
def _packs(hass: HomeAssistant):
    return hass.data[DOMAIN]["packs"]


@websocket_api.websocket_command({vol.Required("type"): "smartlists/packs"})
@callback
def ws_packs(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/pack_upload", vol.Required("pack"): dict, vol.Optional("name"): str, vol.Optional("activate", default=True): bool}
)
@callback
def ws_pack_upload(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigenes Pack hinzufügen (oder gleichnamiges ersetzen). Format: siehe categories.py."""
    try:
        result = _packs(hass).add_custom(msg["pack"], msg.get("name"), msg["activate"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {**result, "packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_delete", vol.Required("pack_id"): str})
@callback
def ws_pack_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        _packs(hass).delete_custom(msg["pack_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_set_active", vol.Required("active"): [str]})
@callback
def ws_pack_set_active(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Aktive Packs in Reihenfolge (vorne gewinnt bei gleichem Stichwort)."""
    try:
        _packs(hass).set_active(msg["active"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"packs": _packs(hass).describe()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_export", vol.Required("pack_id"): str})
@callback
def ws_pack_export(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Pack als Datei herunterladen – Vorlage für eigene Packs."""
    try:
        connection.send_result(msg["id"], _packs(hass).export(msg["pack_id"]))
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Pack nicht gefunden.")


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notes"})
@callback
def ws_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Notizlisten der App: Einstellung (mode, scope) und – für Admins – alle Notizlisten mit Besitzer."""
    notes = hass.data[DOMAIN]["notes"]
    info = notes.describe()
    if not connection.user.is_admin:
        info["lists"] = [n for n in info["lists"] if notes.can_see(n["entity_id"], connection.user)]
    connection.send_result(msg["id"], info)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/set_notes",
        vol.Optional("mode"): vol.In(["hidden", "section"]),
        vol.Optional("scope"): vol.In(["owner", "household"]),
        vol.Optional("owners"): {str: vol.Any(str, None)},
    }
)
@callback
def ws_set_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    notes = hass.data[DOMAIN]["notes"]
    notes.update(msg.get("mode"), msg.get("scope"), msg.get("owners"))
    connection.send_result(msg["id"], notes.describe())


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/pack_create", vol.Required("name"): str, vol.Optional("language", default=""): str})
@callback
def ws_pack_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Neues, leeres eigenes Pack (z.B. für eine weitere Sprache)."""
    try:
        pid = _packs(hass).create(msg["name"], msg["language"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {"pack_id": pid, "packs": _packs(hass).describe()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/pack_terms",
        vol.Required("pack_id"): str,
        vol.Optional("query", default=""): str,
        vol.Optional("offset", default=0): vol.All(int, vol.Range(min=0)),
        vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=500)),
    }
)
@callback
def ws_pack_terms(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Stichwörter eines Packs durchsuchen (seitenweise)."""
    try:
        connection.send_result(msg["id"], _packs(hass).terms(msg["pack_id"], msg["query"], msg["offset"], msg["limit"]))
    except ValueError as err:
        connection.send_error(msg["id"], "not_found", str(err))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/pack_update",
        vol.Required("pack_id"): str,
        vol.Required("terms"): {str: vol.Any(str, None)},
        vol.Optional("name"): str,
    }
)
@callback
def ws_pack_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Stichwörter hinzufügen/ändern (Kategorie-ID) oder löschen (null). Eingebaute Packs werden über ein
    Ergänzungs-Pack „<Name> +“ erweitert, damit Updates der Integration nichts überschreiben."""
    try:
        result = _packs(hass).update_terms(msg["pack_id"], msg["terms"], msg.get("name"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_pack", str(err))
        return
    connection.send_result(msg["id"], {**result, "packs": _packs(hass).describe()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/stores"})
@callback
def ws_stores(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Märkte (benutzte + bekannte Ketten) mit verknüpfter Zone."""
    connection.send_result(msg["id"], {"stores": _learning(hass).stores()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/set_store_zone", vol.Required("store"): str, vol.Optional("zone"): vol.Any(str, None),
     vol.Optional("zones"): [str], vol.Optional("add", default=False): bool}
)
@callback
def ws_set_store_zone(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Markt mit Zonen verknüpfen: zones = alle (z.B. mehrere Filialen), zone + add = eine hinzufügen,
    zone allein = ersetzen, zone=None = alle lösen."""
    try:
        zones = _learning(hass).set_store_zone(msg["store"], msg.get("zone"), msg.get("zones"), msg["add"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_store", str(err))
        return
    connection.send_result(msg["id"], {"store_zones": zones, "stores": _learning(hass).stores()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/appearance"})
@callback
def ws_appearance(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Badges & Farben: Einstellung + alle bekannten Badges (Märkte, Personen, Schlagwörter)."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"appearance": learning.appearance, "tags": learning.tag_overview()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_appearance", vol.Required("appearance"): dict})
@callback
def ws_set_appearance(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Badges & Farben für den Haushalt speichern (unbekannte/ungültige Angaben werden verworfen)."""
    learning = _learning(hass)
    connection.send_result(msg["id"], {"appearance": learning.set_appearance(msg["appearance"]), "tags": learning.tag_overview()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/app_lists"})
@callback
def ws_app_lists(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Von der App gemeldete kombinierte Listen je Gerät (Admin: alle Geräte, sonst die eigenen)."""
    from . import app_lists

    user = connection.user
    connection.send_result(msg["id"], {"lists": app_lists.describe(hass, None if user.is_admin else user.id)})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "smartlists/connect_app_list", vol.Required("device_id"): str, vol.Required("list_id"): str}
)
@callback
def ws_connect_app_list(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """App-Liste als kombinierte Liste der Integration anlegen (gehört dann zum Handy-Gerät)."""
    from . import app_lists

    try:
        sub_id = app_lists.connect(hass, msg["device_id"], msg["list_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "smartlists_error", str(err))
        return
    connection.send_result(msg["id"], {"subentry_id": sub_id, "lists": app_lists.describe(hass)})



# ======================================================================
# 2.8: Markt-Reihenfolge, Preise & Ausgaben, Vorlagen, Statistik, Teilen, Benachrichtigungen, Strichcodes
# ======================================================================
def _extras(hass: HomeAssistant):
    return hass.data[DOMAIN]["extras"]


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
                                  vol.Optional("price"): vol.Any(vol.Coerce(float), None), vol.Optional("store"): vol.Any(str, None)})
@callback
def ws_set_price(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Preis je Einheit für einen Artikel merken (None = vergessen)."""
    price = msg.get("price")
    if price is not None and not 0 <= price < 100000:
        connection.send_error(msg["id"], "invalid", "Preis ungültig")
        return
    _extras(hass).set_price(msg["name"], price, msg.get("store"))
    connection.send_result(msg["id"], {})


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
    try:
        tid = _extras(hass).save_template(msg.get("template_id"), msg["name"], msg["items"], msg["emoji"], msg.get("servings"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"template_id": tid})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_template", vol.Required("template_id"): str})
@callback
def ws_delete_template(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
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


def _may_share(hass: HomeAssistant, entity_id: str, user: Any) -> str | None:
    """Fehlermeldung, wenn der Benutzer diese Liste nicht teilen darf (sonst None)."""
    if not entity_id.startswith("todo.") or hass.states.get(entity_id) is None:
        return "Liste nicht gefunden."
    if lists.is_notes(hass, entity_id):
        return "Notizlisten lassen sich nicht teilen."
    if user.is_admin:
        return None
    if lists.own_entity(hass, entity_id) is not None and lists.own_role(hass, entity_id, user) == "owner":
        return None
    return "Teilen dürfen Admins und der Besitzer einer eigenen Liste."


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_links", vol.Required("entity_id"): str})
@callback
def ws_share_links(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_create", vol.Required("entity_id"): str,
                                  vol.Optional("check", default="off"): vol.In(["off", "soft", "on"]),
                                  vol.Optional("add", default=False): bool,
                                  vol.Optional("hours"): vol.Any(vol.All(int, vol.Range(min=1, max=24 * 365)), None)})
@callback
def ws_share_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Link erstellen. Der Schlüssel kommt nur in dieser Antwort vor (gespeichert wird nur sein Hash)."""
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    try:
        link = hass.data[DOMAIN]["shares"].create(msg["entity_id"], connection.user.id, msg["check"], msg["add"],
                                                   hours=msg.get("hours", 24 * 7))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {**link, "path": f"/smartlists-share/{link['token']}"})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_revoke", vol.Required("entity_id"): str, vol.Required("link_id"): str})
@callback
def ws_share_revoke(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    hass.data[DOMAIN]["shares"].revoke(msg["link_id"], msg["entity_id"])
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notify"})
@callback
def ws_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigene Benachrichtigungs-Einstellungen + verfügbare Handys (notify.mobile_app_…)."""
    n = hass.data[DOMAIN]["notifier"]
    connection.send_result(msg["id"], {"settings": n.get(connection.user.id), "services": n.services()})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_notify", vol.Required("settings"): dict})
@callback
def ws_set_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    n = hass.data[DOMAIN]["notifier"]
    service = (msg["settings"].get("service") or "").removeprefix("notify.")
    if service and service not in n.services():
        connection.send_error(msg["id"], "invalid", "Unbekanntes Handy (notify-Dienst)")
        return
    connection.send_result(msg["id"], {"settings": n.set(connection.user.id, msg["settings"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/barcode", vol.Required("code"): vol.All(str, vol.Match(r"^\d{6,14}$"))})
@websocket_api.async_response
async def ws_barcode(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Strichcode → Produkt. Erst aus dem eigenen Speicher, sonst Open Food Facts (nur der Code wird gesendet)."""
    from .barcode import async_lookup

    connection.send_result(msg["id"], await async_lookup(hass, msg["code"]))
