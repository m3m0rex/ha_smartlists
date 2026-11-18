"""Fällige Einträge in einen Kalender von Home Assistant eintragen.

Gewählt wird je Eintrag („In Kalender eintragen“). Der Termin trägt den Namen des Eintrags; mit Uhrzeit dauert er
30 Minuten, ohne Uhrzeit ist er ganztägig. Ändert sich die Fälligkeit, wird der Eintrag abgehakt oder gelöscht, wird der
Termin wieder entfernt (wieder geöffnet: wieder eingetragen) – soweit der Kalender das Löschen erlaubt (der lokale Kalender tut es)."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)
MINUTES = 30
RETRIES = 10  # so oft (einmal je Minute) wird ein Termin, der sich nicht entfernen ließ, noch einmal versucht


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


def _entity(hass: HomeAssistant, entity_id: str) -> Any:
    component = hass.data.get("calendar")
    return component.get_entity(entity_id) if component is not None else None


def _day(value: Any) -> date | None:
    """Tag eines Termin-Beginns (Datum oder Zeitpunkt) in der Zeitzone von Home Assistant."""
    if isinstance(value, datetime):
        return dt_util.as_local(value).date() if value.tzinfo else value.date()
    return value if isinstance(value, date) else None


async def _find(hass: HomeAssistant, entity: Any, cal: dict[str, Any]) -> Any:
    """Den eigenen Termin im Kalender wiederfinden: über die gemerkte Kennung, sonst über Tag, Titel und den
    Vermerk „SmartLists“ in der Beschreibung (nur eigene Termine anfassen). Gesucht wird einen Tag davor bis zwei
    danach – Kalender liefern ganztägige Termine je nach Zeitzone am Rand unterschiedlich."""
    day = date.fromisoformat(str(cal["due"])[:10])
    zone = dt_util.get_default_time_zone()
    start = datetime(day.year, day.month, day.day, tzinfo=zone) - timedelta(days=1)
    events = [e for e in await entity.async_get_events(hass, start, start + timedelta(days=3)) if getattr(e, "uid", None)]
    if cal.get("uid"):
        for event in events:
            if event.uid == cal["uid"]:
                return event
    for event in events:
        if str(event.summary or "").strip() != str(cal.get("summary") or "").strip():
            continue
        if "SmartLists" not in str(getattr(event, "description", "") or ""):
            continue
        if _day(getattr(event, "start", None)) in (day, None):
            return event
    return None


async def async_add(hass: HomeAssistant, entity_id: str, summary: str, due: str, list_name: str = "") -> dict[str, Any]:
    """Termin anlegen. Liefert, was für das spätere Entfernen gemerkt wird – wenn der Kalender sie schon nennt,
    auch die Kennung des Termins (damit er sicher wiedergefunden wird, auch nach Umbenennen im Kalender)."""
    await hass.services.async_call("calendar", "create_event", {"entity_id": entity_id, **event_data(summary, due, list_name)}, blocking=True)
    cal: dict[str, Any] = {"entity": entity_id, "due": due, "summary": summary, "list": list_name}
    try:
        entity = _entity(hass, entity_id)
        event = await _find(hass, entity, cal) if entity is not None else None
        if event is not None:
            cal["uid"] = event.uid
    except Exception:  # noqa: BLE001 – ohne Kennung wird später über Tag und Titel gesucht
        _LOGGER.debug("Kennung des Termins in %s nicht gelesen", entity_id, exc_info=True)
    return cal


async def async_remove(hass: HomeAssistant, cal: dict[str, Any] | None) -> bool:
    """Den früher angelegten Termin wieder entfernen. True: er ist weg (oder war schon nicht mehr da).
    False: der Kalender war nicht erreichbar oder erlaubt das Löschen nicht – steht dann im Protokoll."""
    if not cal or not cal.get("entity") or not cal.get("due"):
        return True
    try:
        entity = _entity(hass, cal["entity"])
        if entity is None:
            _LOGGER.warning("Termin „%s“ nicht entfernt: Kalender %s ist nicht geladen", cal.get("summary"), cal["entity"])
            return False
        event = await _find(hass, entity, cal)
        if event is None:
            _LOGGER.info("Termin „%s“ steht nicht (mehr) in %s", cal.get("summary"), cal["entity"])
            return True
        await entity.async_delete_event(event.uid)
        return True
    except NotImplementedError:
        _LOGGER.warning("Termin „%s“ nicht entfernt: %s erlaubt das Löschen nicht", cal.get("summary"), cal["entity"])
    except Exception as err:  # noqa: BLE001 – Kalender nicht erreichbar o. Ä.
        _LOGGER.warning("Termin „%s“ in %s nicht entfernt: %s", cal.get("summary"), cal["entity"], err, exc_info=True)
    return False


async def async_retry(hass: HomeAssistant, extras: Any) -> int:
    """Termine, die sich beim Abhaken nicht entfernen ließen, noch einmal versuchen (einmal je Minute, RETRIES-mal).
    Danach eine Meldung in Home Assistant – der Termin muss dann von Hand gelöscht werden. Liefert, wie viele weg sind."""
    done = 0
    for entity_id, marks in list(extras.item_marks.items()):
        for uid, mark in list(marks.items()):
            cal = mark.get("cal") or {}
            if not cal.get("pending"):
                continue
            if await async_remove(hass, cal):
                extras.set_item_mark(entity_id, uid, {"cal": {k: v for k, v in cal.items() if k not in ("pending", "tries")}})
                done += 1
                continue
            tries = int(cal.get("tries") or 0) + 1
            if tries < RETRIES:
                extras.set_item_mark(entity_id, uid, {"cal": {**cal, "tries": tries}})
                continue
            extras.set_item_mark(entity_id, uid, {"cal": {k: v for k, v in cal.items() if k not in ("pending", "tries")}})
            german = str(hass.config.language).startswith("de")
            from . import problems

            problems.report(hass, "SL-CAL-01", str(cal.get("entity") or ""))
            await hass.services.async_call("persistent_notification", "create", {
                "title": "SmartLists (SL-CAL-01)",
                "message": (f"Der Termin „{cal.get('summary')}“ ließ sich im Kalender {cal.get('entity')} nicht entfernen. Bitte dort von Hand löschen."
                            if german else
                            f"The event “{cal.get('summary')}” could not be removed from the calendar {cal.get('entity')}. Please delete it there by hand."),
                "notification_id": f"smartlists_cal_{uid}"}, blocking=False)
    return done


async def async_move(hass: HomeAssistant, extras: Any, entity_id: str, uid: str, due: str) -> None:
    """Die Fälligkeit wurde verschoben („Morgen erinnern“): der Termin zieht mit."""
    cal = extras.item_mark(entity_id, uid).get("cal")
    if not cal or not cal.get("entity") or cal.get("off"):
        return
    try:
        await async_remove(hass, cal)
        new = await async_add(hass, cal["entity"], str(cal.get("summary") or ""), due, str(cal.get("list") or ""))
        extras.set_item_mark(entity_id, uid, {"cal": new})
    except Exception:  # noqa: BLE001 – die Fälligkeit bleibt, nur der Termin fehlt
        _LOGGER.warning("Termin zu %s nicht verschoben", entity_id, exc_info=True)


async def async_follow(hass: HomeAssistant, extras: Any, entity_id: str, uid: str, checked: bool) -> None:
    """Was beim Abhaken eines Eintrags mit Fälligkeit folgt: Er zählt nicht mehr als fällig; ein wiederkehrender bekommt
    seine nächste Fälligkeit (und wird an dem Tag wieder geöffnet); der Kalender-Termin verschwindet bzw. zieht mit.
    Wieder geöffnet: wieder fällig, Termin wieder eingetragen."""
    mark = extras.item_mark(entity_id, uid)
    if not mark.get("due"):
        return
    cal = mark.get("cal")
    try:
        if checked:
            if cal and cal.get("entity") and not cal.get("off"):
                gone = await async_remove(hass, cal)
                cal = {**cal, "off": True, **({} if gone else {"pending": True, "tries": 0})}  # nicht weg: async_retry versucht es weiter
                extras.set_item_mark(entity_id, uid, {"cal": cal})
            changes: dict[str, Any] = {"closed": True}
            if mark.get("repeat"):
                from .extras import next_due

                changes["due"] = next_due(str(mark["due"]), str(mark["repeat"]), dt_util.now().strftime("%Y-%m-%d"))
            extras.set_item_mark(entity_id, uid, changes)
            if mark.get("repeat") and cal and cal.get("entity"):  # der nächste Termin steht schon im Kalender
                new = await async_add(hass, cal["entity"], str(cal.get("summary") or ""), str(changes["due"]), str(cal.get("list") or ""))
                extras.set_item_mark(entity_id, uid, {"cal": new})
        else:
            extras.set_item_mark(entity_id, uid, {"closed": False})
            mark = extras.item_mark(entity_id, uid)
            cal = mark.get("cal")
            if cal and cal.get("entity") and cal.get("pending"):  # ließ sich nie entfernen: steht also noch im Kalender
                extras.set_item_mark(entity_id, uid, {"cal": {k: v for k, v in cal.items() if k not in ("off", "pending", "tries")}})
            elif cal and cal.get("entity") and cal.get("off") and mark.get("due"):
                new = await async_add(hass, cal["entity"], str(cal.get("summary") or ""), str(mark["due"]), str(cal.get("list") or ""))
                extras.set_item_mark(entity_id, uid, {"cal": new})
    except Exception:  # noqa: BLE001 – das darf das Abhaken nicht aufhalten
        _LOGGER.warning("Fälligkeit zu %s nicht nachgeführt", entity_id, exc_info=True)
