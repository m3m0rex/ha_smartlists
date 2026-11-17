"""Fällige Einträge in einen Kalender von Home Assistant eintragen.

Gewählt wird je Eintrag („In Kalender eintragen“). Der Termin trägt den Namen des Eintrags; mit Uhrzeit dauert er
30 Minuten, ohne Uhrzeit ist er ganztägig. Ändert sich die Fälligkeit oder verschwindet der Eintrag, wird der alte
Termin wieder entfernt – soweit der Kalender das Löschen erlaubt (der lokale Kalender tut es)."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)
MINUTES = 30


def event_data(summary: str, due: str, list_name: str = "") -> dict[str, Any]:
    """Felder für calendar.create_event."""
    data: dict[str, Any] = {"summary": summary, "description": f"SmartLists · {list_name}" if list_name else "SmartLists"}
    if "T" in due:
        start = datetime.fromisoformat(due)
        data["start_date_time"] = start.strftime("%Y-%m-%d %H:%M:%S")
        data["end_date_time"] = (start + timedelta(minutes=MINUTES)).strftime("%Y-%m-%d %H:%M:%S")
    else:
        day = date.fromisoformat(due)
        data["start_date"] = day.isoformat()
        data["end_date"] = (day + timedelta(days=1)).isoformat()
    return data


async def async_add(hass: HomeAssistant, entity_id: str, summary: str, due: str, list_name: str = "") -> dict[str, Any]:
    """Termin anlegen. Liefert, was für das spätere Entfernen gemerkt wird."""
    await hass.services.async_call("calendar", "create_event", {"entity_id": entity_id, **event_data(summary, due, list_name)}, blocking=True)
    return {"entity": entity_id, "due": due, "summary": summary}


async def async_remove(hass: HomeAssistant, cal: dict[str, Any] | None) -> bool:
    """Den früher angelegten Termin wieder entfernen. Geht es nicht, bleibt er stehen (kein Fehler für den Benutzer)."""
    if not cal or not cal.get("entity") or not cal.get("due"):
        return False
    try:
        component = hass.data.get("calendar")
        entity = component.get_entity(cal["entity"]) if component is not None else None
        if entity is None:
            return False
        due = str(cal["due"])
        day = date.fromisoformat(due[:10])
        zone = dt_util.get_default_time_zone()
        start = datetime(day.year, day.month, day.day, tzinfo=zone)
        for event in await entity.async_get_events(hass, start, start + timedelta(days=1)):
            if event.summary != cal.get("summary") or not getattr(event, "uid", None):
                continue
            if "SmartLists" not in str(getattr(event, "description", "") or ""):
                continue  # nur eigene Termine anfassen
            await entity.async_delete_event(event.uid)
            return True
    except Exception:  # noqa: BLE001 – Kalender ohne Löschen oder nicht erreichbar
        _LOGGER.debug("Termin in %s nicht entfernt", cal.get("entity"), exc_info=True)
    return False
