"""Diagnose-Download (Einstellungen → Geräte & Dienste → SmartLists → ⋮ → Diagnose herunterladen).

Enthält Version, Einstellungen, Zähler und Fehlerhinweise – keine Artikeltexte, keine Tokens, keine
Link-Schlüssel, keine Benutzernamen (IDs gekürzt)."""

from __future__ import annotations

import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN


def _short(value: str | None) -> str | None:
    return f"{value[:6]}…" if value else None


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    data = hass.data.get(DOMAIN, {})
    learning = data.get("learning")
    extras = data.get("extras")
    shares = data.get("shares")
    devices = data.get("devices")
    notes = data.get("notes")
    packs = data.get("packs")
    now = time.time()
    subentries = []
    for sub in entry.subentries.values():
        sources = list(sub.data.get("sources") or [])
        subentries.append({
            "type": sub.subentry_type,
            "sources": len(sources),
            "missing_sources": [s for s in sources if hass.states.get(s) is None],
            "mode": sub.data.get("mode"),
            "from_app": bool(sub.data.get("app_device")),
            "shares": len(sub.data.get("shares") or {}),
        })
    return {
        "version": (await async_get_integration(hass, DOMAIN)).version,
        "ha_language": hass.config.language,
        "subentries": subentries,
        "todo_entities": len(hass.states.async_all("todo")),
        "learning": None if learning is None else {
            "manual": len(learning.manual), "learned": len(learning.learned), "history": len(learning.history),
            "tag_rules": learning.tag_rules, "users_with_settings": len(learning.users),
            "automation_keys": sorted(learning.automation), "rights": learning.rights(),
            "appearance": {"kinds": learning.appearance.get("kinds"), "values": len(learning.appearance.get("values", {}))},
            "store_zones": {k: len(v) for k, v in learning.store_zones.items()},
        },
        "packs": None if packs is None else {"active": packs.active, "custom": len(packs.custom)},
        "notes": None if notes is None else {"mode": notes.mode, "scope": notes.scope, "lists": len(notes.entity_ids()), "owned": len(notes.owners)},
        "devices": None if devices is None else [
            {"id": _short(k), "app_version": d.get("app_version"), "os_version": d.get("os_version"),
             "days_since_seen": round((now - float(d.get("last_seen", 0))) / 86400, 1), "app_lists": len(d.get("app_lists") or [])}
            for k, d in devices.devices.items()],
        "shares": None if shares is None else [
            {"check": s["check"], "add": s["add"], "expired": s["expired"], "opens": s["opens"], "list_exists": hass.states.get(s["entity_id"]) is not None}
            for s in shares.all_links()],
        "extras": None if extras is None else {
            "templates": len(extras.templates), "prices": len(extras.prices), "expenses": len(extras.expenses),
            "store_orders": len(extras.store_order), "barcodes": len(extras.barcodes),
            "mealplan_days": len(getattr(extras, "mealplan", {}) or {}), "list_settings": len(extras.list_settings),
        },
        "notifier_users": len(data["notifier"].users) if data.get("notifier") else None,
    }
