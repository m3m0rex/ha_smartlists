"""WebSocket-Befehle: App-Backups und Keyword-Packs."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .ws_common import (
    _backups,
    _learning,
    _may_see,
    _packs,
)


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
@websocket_api.websocket_command({vol.Required("type"): "smartlists/favorite_store", vol.Required("store"): str,
                                  vol.Optional("remove", default=False): bool})
@callback
def ws_favorite_store(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Markt nachträglich hinzufügen (z. B. @EDEKA) bzw. aus der Auswahl entfernen."""
    learning = _learning(hass)
    try:
        learning.set_favorite_store(msg["store"], msg["remove"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_store", str(err))
        return
    connection.send_result(msg["id"], {"stores": learning.stores()})


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
    """App-Liste als kombinierte Liste der Integration anlegen (gehört dann zum Gerät der App)."""
    from . import app_lists

    try:
        sub_id = app_lists.connect(hass, msg["device_id"], msg["list_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "smartlists_error", str(err))
        return
    connection.send_result(msg["id"], {"subentry_id": sub_id, "lists": app_lists.describe(hass)})
