"""Hinweise unter Einstellungen → Reparaturen, statt still zu scheitern.

- missing_source: eine kombinierte Liste verweist auf eine To-do-Liste, die es nicht mehr gibt
- stale_device: ein Gerät mit der App hat sich seit 30 Tagen nicht gemeldet
Verwaiste Teilen-Links (Liste gelöscht) werden ohne Rückfrage entfernt.
Geprüft wird kurz nach dem Start und dann stündlich.
"""

from __future__ import annotations

from datetime import timedelta
import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_call_later, async_track_time_interval

from .const import DOMAIN, SUBENTRY_COMBINED

STALE_DAYS = 30


@callback
def async_check(hass: HomeAssistant, entry: ConfigEntry) -> None:
    wanted: set[str] = set()
    for sub in entry.subentries.values():
        if sub.subentry_type != SUBENTRY_COMBINED:
            continue
        missing = [s for s in sub.data.get("sources") or [] if hass.states.get(s) is None]
        if missing:
            issue_id = f"missing_source_{sub.subentry_id}"
            wanted.add(issue_id)
            ir.async_create_issue(hass, DOMAIN, issue_id, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                  translation_key="missing_source",
                                  translation_placeholders={"list": sub.title, "sources": ", ".join(missing)})
    devices = hass.data.get(DOMAIN, {}).get("devices")
    if devices is not None:
        now = time.time()
        for device_id, d in devices.devices.items():
            days = (now - float(d.get("last_seen", 0))) / 86400
            if days >= STALE_DAYS:
                issue_id = f"stale_device_{device_id[:16]}"
                wanted.add(issue_id)
                ir.async_create_issue(hass, DOMAIN, issue_id, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                                      translation_key="stale_device",
                                      translation_placeholders={"device": d.get("name") or "?", "days": str(int(days))})
    shares = hass.data.get(DOMAIN, {}).get("shares")
    if shares is not None:
        for link in list(shares.links.values()):
            if hass.states.get(link["entity_id"]) is None and hass.is_running:
                shares.drop_entity(link["entity_id"])
    # nicht mehr zutreffende Hinweise entfernen
    registry = ir.async_get(hass)
    for (domain, issue_id) in list(registry.issues):
        if domain == DOMAIN and issue_id.startswith(("missing_source_", "stale_device_")) and issue_id not in wanted:
            ir.async_delete_issue(hass, DOMAIN, issue_id)


@callback
def async_setup_checks(hass: HomeAssistant, entry: ConfigEntry) -> Any:
    cancel_first = async_call_later(hass, 90, lambda _now: async_check(hass, entry))
    cancel_hourly = async_track_time_interval(hass, lambda _now: async_check(hass, entry), timedelta(hours=1))

    def _cancel() -> None:
        cancel_first()
        cancel_hourly()

    return _cancel
