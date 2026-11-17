"""WebSocket-Befehle: Ausgaben verwalten, Zurücksetzen, Einrichtung, Wochenplan, Mealie, Verlauf, Listen übernehmen."""

from __future__ import annotations


from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .features import set_features
from .ws_common import (
    _LOGGER,
    _denied,
    _extras,
    _learning,
    _list_command,
    _main_entry,
    _mealie_entry,
    async_reset,
)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/expense_entries", vol.Optional("limit", default=100): vol.All(int, vol.Range(min=1, max=500))})
@callback
def ws_expense_entries(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einzelne Buchungen (Admins: alle, sonst nur eigene) – zum Prüfen und Löschen."""
    user = connection.user
    connection.send_result(msg["id"], {"entries": _extras(hass).expense_entries(None if user.is_admin else user.id, msg["limit"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_expense", vol.Required("expense_id"): str})
@callback
def ws_delete_expense(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    user = connection.user
    if not _extras(hass).delete_expense(msg["expense_id"], None if user.is_admin else user.id):
        connection.send_error(msg["id"], "not_found", "Buchung nicht gefunden (oder nicht deine).")
        return
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/delete_expenses",
                                  vol.Optional("expense_ids"): [str], vol.Optional("all", default=False): bool})
@callback
def ws_delete_expenses(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Mehrere bzw. alle Buchungen löschen (Admins: alle, sonst nur eigene)."""
    user = connection.user
    ids = None if msg["all"] else list(msg.get("expense_ids") or [])
    connection.send_result(msg["id"], {"deleted": _extras(hass).delete_expenses(ids, None if user.is_admin else user.id)})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/reset_stats", vol.Optional("names"): [str]})
@callback
def ws_reset_stats(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Statistik zurücksetzen – ganz oder nur ausgewählte Artikel (Käufe und Rhythmus; Vorschläge bleiben)."""
    connection.send_result(msg["id"], {"reset": _learning(hass).reset_stats(msg.get("names"))})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/reset_frequent", vol.Required("entity_id"): str,
                                  vol.Optional("names"): [str]})
@callback
def ws_reset_frequent(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """„Häufig gekauft“ einer Liste zurücksetzen bzw. einzelne Artikel daraus entfernen.
    Einzelne: wer in der Liste hinzufügen darf; alles: Admins und der Besitzer."""
    entity_id = msg["entity_id"]
    user = connection.user
    if hass.states.get(entity_id) is None or not entity_id.startswith("todo."):
        connection.send_error(msg["id"], "not_found", "Liste nicht gefunden.")
        return
    role = lists.own_role(hass, entity_id, user)
    allowed = user.is_admin or role == "owner" if "names" not in msg else user.is_admin or role in ("owner", "editor")
    if not allowed:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Keine Berechtigung für diese Liste.")
        return
    scope = lists.suggest_scope(hass, entity_id)
    connection.send_result(msg["id"], {"reset": _learning(hass).reset_frequent(scope, msg.get("names"))})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/forget_history", vol.Required("name"): str})
@callback
def ws_forget_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Falschen Eintrag aus dem Verlauf (Statistik, Vorschläge, Rhythmus) entfernen."""
    from .categories import normalize

    learning = _learning(hass)
    if learning.history.pop(normalize(msg["name"]), None) is None:
        connection.send_error(msg["id"], "not_found", "Nicht im Verlauf.")
        return
    learning._changed()
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/create_notes", vol.Optional("name", default=""): str})
@websocket_api.async_response
async def ws_create_notes(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Notizliste anlegen (Local To-do, Entitäts-ID todo.ha_smartlists_notes_<name>), Besitzer = wer sie anlegt.
    So kann man Notizen in SmartLists nutzen, auch wenn die App noch keine angelegt hat."""
    from .notes import async_create_notes_list

    try:
        entity_id = await async_create_notes_list(hass, connection.user, msg["name"])
    except ValueError as err:
        connection.send_error(msg["id"], "failed", str(err))
        return
    notes = hass.data[DOMAIN]["notes"]
    connection.send_result(msg["id"], {"entity_id": entity_id, "mode": notes.mode})


@_list_command({vol.Required("type"): "smartlists/finish_shopping", vol.Required("entity_id"): str,
                vol.Optional("reopen", default=False): bool})
async def ws_finish_shopping(hass, msg, context):
    """„Einkauf beendet“: Summe im Wagen auf 0. Mit reopen=True werden die abgehakten Artikel wieder offen
    (für Listen, die man jede Woche neu benutzt)."""
    extras = _extras(hass)
    start = extras.finish_trip(msg["entity_id"])
    reopened = 0
    if msg["reopen"]:
        for item in await lists.raw_items(hass, msg["entity_id"]):
            if item["checked"]:
                await lists._call(hass, "update_item", {"entity_id": msg["entity_id"], "item": item["uid"], "status": lists.STATUS_OPEN}, context)
                reopened += 1
    return {"trip_start": start, "reopened": reopened}


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_rights", vol.Required("rights"): dict})
@callback
def ws_set_rights(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Was Benutzer ohne Admin-Rechte dürfen (Teilen per Link, Listen anlegen, Vorlagen, Kategorien, Preise)."""
    connection.send_result(msg["id"], {"rights": _learning(hass).set_rights(msg["rights"])})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_links_all"})
@callback
def ws_share_links_all(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Alle aktiven Links aller Listen (für die Übersicht des Admins)."""
    out = []
    for link in hass.data[DOMAIN]["shares"].all_links():
        state = hass.states.get(link["entity_id"])
        out.append({**link, "list_name": state.attributes.get("friendly_name", link["entity_id"]) if state else link["entity_id"]})
    connection.send_result(msg["id"], {"links": out})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_list_settings", vol.Required("entity_id"): str,
                                  vol.Optional("name"): vol.All(str, vol.Length(min=1, max=60)),
                                  vol.Optional("sort"): vol.Any(str, None), vol.Optional("show_prices"): bool,
                                  vol.Optional("categories"): bool, vol.Optional("suggest_scope"): vol.In(["list", "all"]),
                                  vol.Optional("plain"): bool})
@callback
def ws_set_list_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Darstellung einer Liste für alle Geräte: Name (Anzeigename in HA), Standard-Sortierung, Preise an/aus.
    Admins; bei eigenen Listen auch der Besitzer."""
    entity_id = msg["entity_id"]
    user = connection.user
    owner = lists.own_entity(hass, entity_id) is not None and lists.own_role(hass, entity_id, user) == "owner"
    if hass.states.get(entity_id) is None or not entity_id.startswith("todo."):
        connection.send_error(msg["id"], "not_found", "Liste nicht gefunden.")
        return
    if not (user.is_admin or owner):
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Nur Admins oder der Besitzer der Liste.")
        return
    if "name" in msg:
        from homeassistant.helpers import entity_registry as er

        registry = er.async_get(hass)
        if registry.async_get(entity_id) is None:
            connection.send_error(msg["id"], "invalid", "Diese Liste lässt sich hier nicht umbenennen.")
            return
        registry.async_update_entity(entity_id, name=msg["name"].strip())
    settings = _extras(hass).set_list_settings(entity_id, msg.get("sort") if "sort" in msg else None, msg.get("show_prices"),
                                               msg.get("categories"), msg.get("suggest_scope"), msg.get("plain"))
    connection.send_result(msg["id"], {"settings": settings})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smartlists/setup",
        vol.Optional("skip", default=False): bool,
        # Listen: vorhandene benutzen (optional zusammenfassen) oder eine neue eigene anlegen
        vol.Optional("lists", default=[]): [str],
        vol.Optional("combine_name"): vol.Any(str, None),
        vol.Optional("new_list"): vol.Any(str, None),
        vol.Optional("shares", default={}): {str: vol.In(["viewer", "checker", "editor"])},
        vol.Optional("stores", default=[]): [str],
        vol.Optional("tag_rules"): list,
        vol.Optional("packs"): [str],
        vol.Optional("notify_service"): vol.Any(str, None),
        vol.Optional("voice", default=False): bool,
        vol.Optional("prices", default=True): bool,
        vol.Optional("barcode", default=True): bool,
        vol.Optional("share_links", default=False): bool,
        # Extras – im Assistenten standardmäßig aus (fehlt die Angabe: unverändert)
        vol.Optional("notes"): bool,
        vol.Optional("mealplan"): bool,
        vol.Optional("stats"): bool,
    }
)
@websocket_api.async_response
async def ws_setup(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Einrichtungs-Assistent: alles auf einmal übernehmen. skip=True merkt nur „erledigt“."""
    from types import MappingProxyType

    from homeassistant.config_entries import ConfigSubentry
    from homeassistant.util import slugify

    from .const import CONF_DEFAULT_ADD, CONF_FOREIGN, CONF_MODE, CONF_SORT, CONF_SOURCE_AS_PERSON, CONF_SOURCE_LABEL, CONF_SOURCES, \
        LABEL_SUFFIX, MODE_BIDIRECTIONAL, SORT_CATEGORY, SUBENTRY_COMBINED

    learning = _learning(hass)
    done: list[str] = []
    if not msg["skip"]:
        entry = _main_entry(hass)
        if entry is None:
            connection.send_error(msg["id"], "not_setup", "SmartLists ist nicht eingerichtet.")
            return
        user = connection.user
        lists_sel = [e for e in msg["lists"] if hass.states.get(e) is not None and not lists.is_notes(hass, e)]
        main_list: str | None = lists_sel[0] if lists_sel else None
        if msg.get("new_list"):
            name = msg["new_list"].strip()[:60]
            from .own_groups import async_add_list

            await async_add_list(hass, user.id, name, dict(msg["shares"]))
            main_list = f"todo.ha_smartlists_list_{slugify(name) or 'list'}"
            done.append("own_list")
        elif msg.get("combine_name") and len(lists_sel) >= 2:
            name = msg["combine_name"].strip()[:60]
            data = {CONF_SOURCES: lists_sel, CONF_MODE: MODE_BIDIRECTIONAL, CONF_SOURCE_LABEL: LABEL_SUFFIX,
                    CONF_SORT: SORT_CATEGORY, CONF_FOREIGN: [], CONF_SOURCE_AS_PERSON: True, CONF_DEFAULT_ADD: lists_sel[0]}
            sub = ConfigSubentry(data=MappingProxyType(data), subentry_type=SUBENTRY_COMBINED, title=name, unique_id=None)
            hass.config_entries.async_add_subentry(entry, sub)
            main_list = f"todo.ha_smartlists_list_merged_{slugify(name) or 'list'}"
            done.append("combined_list")
        if msg["stores"]:
            learning.automation["favorite_stores"] = [s.strip().lstrip("@")[:30] for s in msg["stores"] if s.strip()][:30]
            done.append("stores")
        if msg.get("tag_rules") is not None:
            try:
                learning.set_tag_rules([r for r in msg["tag_rules"] if isinstance(r, dict) and r.get("prefix")])
                done.append("naming")
            except ValueError:
                pass
        if msg.get("packs"):
            try:
                hass.data[DOMAIN]["packs"].set_active(msg["packs"])
                done.append("packs")
            except ValueError:
                pass
        if msg.get("notify_service"):
            notifier = hass.data[DOMAIN]["notifier"]
            if msg["notify_service"] in notifier.services():
                cur = notifier.get(user.id)
                notifier.set(user.id, {**cur, "targets": [*cur["targets"], {"kind": "service", "id": "notify." + msg["notify_service"]}], "added": True})
                done.append("notify")
        if msg["voice"] and main_list:
            learning.automation["voice_default_list"] = main_list
            try:
                from .automation import async_install_sentences

                await async_install_sentences(hass)
            except Exception:  # noqa: BLE001 – Assist ist optional
                _LOGGER.warning("SmartLists: Sprachbefehle konnten nicht eingerichtet werden", exc_info=True)
            done.append("voice")
        learning.automation["barcode_lookup"] = bool(msg["barcode"])
        # kein Dienst wird dabei eingetragen: welche Datenbank gefragt wird, wählt man selbst in den Einstellungen
        rights = learning.rights()
        rights["share_who"] = "owners" if msg["share_links"] else "admins"
        learning.automation["rights"] = rights
        if "notes" in msg or "mealplan" in msg or "stats" in msg:
            set_features(hass, notes=msg.get("notes"), mealplan=msg.get("mealplan"), stats=msg.get("stats"))
            done.extend(k for k in ("notes", "mealplan", "stats") if msg.get(k))
        if not msg["prices"]:
            for e in [*lists_sel, *([main_list] if main_list else [])]:
                _extras(hass).set_list_settings(e, show_prices=False)
    learning.automation["setup_done"] = True
    learning.automation.pop("setup_pending", None)
    learning._changed(categories=True)
    connection.send_result(msg["id"], {"done": done})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealplan", vol.Required("start"): str,
                                  vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31))})
@callback
def ws_mealplan(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Wochenplan: je Tag die eingetragenen Gerichte (Vorlagen)."""
    try:
        connection.send_result(msg["id"], {"days": _extras(hass).plan(msg["start"], msg["days"])})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_meals", vol.Required("date"): str, vol.Required("template_ids"): [str]})
@callback
def ws_set_meals(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if _denied(hass, connection, msg, "templates"):
        return
    try:
        connection.send_result(msg["id"], {"template_ids": _extras(hass).set_meals(msg["date"], msg["template_ids"])})
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))


@_list_command({vol.Required("type"): "smartlists/add_meals", vol.Required("entity_id"): str, vol.Required("start"): str,
                vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31)),
                vol.Optional("servings"): vol.Any(vol.All(int, vol.Range(min=1, max=100)), None)})
async def ws_add_meals(hass, msg, context):
    """Zutaten aller Gerichte im Zeitraum auf eine Liste (gleiche Artikel werden zusammengezählt)."""
    from .automation import add_template_items

    added = increased = 0
    for day in _extras(hass).plan(msg["start"], msg["days"]):
        for tpl in day["templates"]:
            r = await add_template_items(hass, msg["entity_id"], tpl["id"], msg.get("servings"), [], context)
            added += r["added"]
            increased += r["increased"]
    return {"added": added, "increased": increased}


@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealie_status"})
@callback
def ws_mealie_status(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"available": _mealie_entry(hass) is not None})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/mealie_import", vol.Required("start"): str,
                                  vol.Optional("days", default=7): vol.All(int, vol.Range(min=1, max=31)),
                                  vol.Optional("plan", default=True): bool})
@websocket_api.async_response
async def ws_mealie_import(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Mealie-Wochenplan holen: jedes Rezept wird eine Vorlage (Zutaten), auf Wunsch in den Wochenplan eingetragen."""
    if _denied(hass, connection, msg, "templates"):
        return
    import datetime as dt

    entry_id = _mealie_entry(hass)
    if entry_id is None:
        connection.send_error(msg["id"], "not_found", "Die Mealie-Integration ist nicht eingerichtet.")
        return
    try:
        start = dt.date.fromisoformat(msg["start"])
        end = start + dt.timedelta(days=msg["days"] - 1)
        res = await hass.services.async_call("mealie", "get_mealplan", {"config_entry_id": entry_id, "start_date": start.isoformat(),
                                             "end_date": end.isoformat()}, blocking=True, return_response=True)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "failed", f"Mealie: {err}")
        return
    extras = _extras(hass)
    templates = recipes = 0
    by_day: dict[str, list[str]] = {}
    cache: dict[str, str] = {}
    for meal in (res or {}).get("mealplan") or []:
        recipe = meal.get("recipe") if isinstance(meal, dict) else None
        day = str(meal.get("mealplan_date") or meal.get("date") or "")[:10] if isinstance(meal, dict) else ""
        if not recipe:
            continue
        rid = recipe.get("recipe_id") or recipe.get("id") or recipe.get("slug")
        if not rid:
            continue
        if rid not in cache:
            try:
                full = await hass.services.async_call("mealie", "get_recipe", {"config_entry_id": entry_id, "recipe_id": str(rid)},
                                                      blocking=True, return_response=True)
            except Exception:  # noqa: BLE001
                _LOGGER.debug("Mealie: Rezept nicht ladbar", exc_info=True)
                continue
            r = (full or {}).get("recipe") or {}
            from .extras import ingredient_text

            lines = [x for x in (ingredient_text(i) for i in r.get("ingredients") or []) if x]
            if not lines:
                continue
            servings = r.get("recipe_yield") or r.get("recipe_servings")
            try:
                servings = int(float(str(servings).split()[0])) if servings else None
            except ValueError:
                servings = None
            tid = f"mealie_{str(recipe.get('slug') or rid)[:40]}"
            existed = tid in extras.templates
            extras.save_template(tid, str(r.get("name") or recipe.get("name") or "Mealie")[:60], lines, "🍽️", servings)
            cache[rid] = tid
            recipes += 1
            templates += 0 if existed else 1
        if day:
            by_day.setdefault(day, []).append(cache[rid])
    if msg["plan"]:
        for day, ids in by_day.items():
            try:
                extras.set_meals(day, [*extras.mealplan.get(day, []), *ids])
            except ValueError:
                continue
    connection.send_result(msg["id"], {"recipes": recipes, "new_templates": templates, "days": len(by_day)})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/item_history", vol.Required("entity_id"): str, vol.Optional("name", default=""): str})
@websocket_api.async_response
async def ws_item_history(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Wer hat einen Artikel wann hinzugefügt, abgehakt, umbenannt oder gelöscht."""
    entity_id = msg["entity_id"]
    if not lists.notes_allowed(hass, entity_id, connection.user) or lists.own_role(hass, entity_id, connection.user) is None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Keine Berechtigung für diese Liste.")
        return
    rows = hass.data[DOMAIN]["itemlog"].for_item(entity_id, msg["name"])
    names: dict[str, str] = {}
    for r in rows:
        uid = r.get("user")
        if uid and uid not in names:
            user = await hass.auth.async_get_user(uid)
            names[uid] = (user.name if user else "") or "?"
    connection.send_result(msg["id"], {"entries": [{**r, "user_name": names.get(r.get("user") or "", None)} for r in rows]})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/reset", vol.Optional("settings", default=True): bool,
                                  vol.Optional("data", default=False): bool, vol.Optional("links", default=False): bool,
                                  vol.Optional("combined", default=False): bool})
@websocket_api.async_response
async def ws_reset(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], await async_reset(hass, msg["settings"], msg["data"], msg["links"], msg["combined"]))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/migrate_candidates"})
@callback
def ws_migrate_candidates(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    from .migrate import candidates

    connection.send_result(msg["id"], {"lists": candidates(hass, connection.user)})


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): "smartlists/migrate",
    vol.Required("sources"): [str],
    vol.Optional("mode", default="each"): vol.In(["each", "one"]),
    vol.Optional("name"): vol.Any(str, None),
    vol.Optional("old", default="keep"): vol.In(["keep"]),  # alte Listen bleiben immer
    vol.Optional("tag_kind"): vol.Any(None, vol.In(["person", "tag"])),
    vol.Optional("target", default="list"): vol.In(["list", "notes"]),
})
@websocket_api.async_response
async def ws_migrate(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """To-do-Listen in eigene SmartLists-Listen übernehmen (Besitzer: wer migriert)."""
    from .migrate import async_migrate

    try:
        result = await async_migrate(hass, connection.user.id, msg["sources"], msg["mode"], msg.get("name"), msg["old"], msg.get("tag_kind"),
                                     msg["target"], connection.user)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/backup_create"})
@websocket_api.async_response
async def ws_backup_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Sicherung von Hand anlegen; die Antwort ist der Bericht, was genau gesichert wurde."""
    from . import removal_backup

    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_found", "SmartLists ist nicht eingerichtet")
        return
    connection.send_result(msg["id"], {"report": await removal_backup.async_create(hass, entries[0], "manual")})
