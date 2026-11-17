"""Erinnerungen: Einträge mit Fälligkeit melden, wenn es so weit ist.

Stern, Fälligkeit und „erinnern“ stehen je Eintrag in extras.item_marks. Einmal in der Minute wird geprüft, was fällig
ist; gemeldet wird jeder Eintrag einmal – an die Benachrichtigungs-Ziele dessen, der die Erinnerung gesetzt hat, sonst
als Meldung in Home Assistant. Ist der Eintrag inzwischen abgehakt oder gelöscht, entfällt die Meldung."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
INTERVAL = timedelta(minutes=1)
_TITLE = {"de": "⏰ Fällig", "en": "⏰ Due", "fr": "⏰ À faire", "es": "⏰ Pendiente", "it": "⏰ In scadenza", "pl": "⏰ Termin"}


def message(name: str, list_name: str, due: str) -> str:
    """Text der Meldung: „Milch – Liste Anna (20.11. 18:00)“."""
    day = f"{due[8:10]}.{due[5:7]}." + (f" {due[11:16]}" if "T" in due else "")
    return f"{name} – {list_name} ({day})" if list_name else f"{name} ({day})"


async def _open_item(hass: HomeAssistant, entity_id: str, uid: str) -> dict[str, Any] | None:
    """Der Eintrag, wenn er noch offen auf der Liste steht."""
    try:
        answer = await hass.services.async_call("todo", "get_items", {"entity_id": entity_id, "status": ["needs_action"]},
                                                blocking=True, return_response=True)
    except Exception:  # noqa: BLE001 – Liste nicht erreichbar: später noch einmal versuchen
        return None
    for item in ((answer or {}).get(entity_id) or {}).get("items") or []:
        if item.get("uid") == uid:
            return item
    return {}


async def async_check(hass: HomeAssistant) -> int:
    """Fällige Erinnerungen senden. Liefert, wie viele gemeldet wurden."""
    extras = hass.data.get(DOMAIN, {}).get("extras")
    if extras is None or not extras.item_marks:
        return 0
    sent = 0
    for entity_id, uid, mark in extras.due_reminders(dt_util.now()):
        item = await _open_item(hass, entity_id, uid)
        if item is None:
            continue  # nicht erreichbar – beim nächsten Durchlauf wieder
        extras.mark_reminded(entity_id, uid)
        if not item:
            continue  # abgehakt oder gelöscht: nichts zu melden
        state = hass.states.get(entity_id)
        title = _TITLE.get(str(hass.config.language)[:2], _TITLE["en"])
        text = message(str(item.get("summary") or mark.get("name") or ""), state.name if state else "", str(mark["due"]))
        try:
            delivered = False
            if mark.get("by"):
                from .notify import async_get_notifier

                notifier = await async_get_notifier(hass)
                settings = notifier.get(mark["by"])
                targets = settings.get("targets") or []
                if targets:
                    errors = await notifier._deliver_all(settings, title, text, f"smartlists_due_{uid}")
                    delivered = len(errors) < len(targets)
            if not delivered:
                await hass.services.async_call("persistent_notification", "create",
                                               {"title": title, "message": text, "notification_id": f"smartlists_due_{uid}"}, blocking=False)
            sent += 1
        except Exception:  # noqa: BLE001 – eine fehlgeschlagene Meldung darf die anderen nicht aufhalten
            _LOGGER.warning("Erinnerung für %s fehlgeschlagen", entity_id, exc_info=True)
    return sent


def async_setup_timer(hass: HomeAssistant):
    async def _tick(_now: Any) -> None:
        await async_check(hass)

    return async_track_time_interval(hass, _tick, INTERVAL)
