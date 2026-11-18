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
# Knöpfe in der Benachrichtigung der Companion-App: (Erledigt, Morgen erinnern)
_ACTIONS = {"de": ("Erledigt", "Morgen erinnern"), "en": ("Done", "Remind me tomorrow"), "fr": ("Fait", "Rappeler demain"),
            "es": ("Hecho", "Recordar mañana"), "it": ("Fatto", "Ricordamelo domani"), "pl": ("Gotowe", "Przypomnij jutro")}
ACTION_DONE, ACTION_LATER = "SMARTLISTS_DONE_", "SMARTLISTS_LATER_"
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
    from . import calendar_sync

    try:
        await calendar_sync.async_retry(hass, extras)  # Termine, die sich beim Abhaken nicht entfernen ließen
    except Exception:  # noqa: BLE001 – darf die Erinnerungen nicht aufhalten
        _LOGGER.warning("Kalender-Termine nicht nachgeführt", exc_info=True)
    # wiederkehrende Einträge: am nächsten fälligen Tag wieder öffnen
    for entity_id, uid, mark in extras.to_reopen(dt_util.now()):
        try:
            await hass.services.async_call("todo", "update_item", {"entity_id": entity_id, "item": uid, "status": "needs_action"}, blocking=True)
        except Exception:  # noqa: BLE001 – Eintrag gelöscht oder Liste nicht erreichbar
            _LOGGER.debug("Wiederkehrenden Eintrag in %s nicht geöffnet", entity_id, exc_info=True)
        extras.set_item_mark(entity_id, uid, {"closed": False})
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
                    token = extras.mark_token(entity_id, uid)
                    done, later = _ACTIONS.get(str(hass.config.language)[:2], _ACTIONS["en"])
                    actions = [{"action": ACTION_DONE + token, "title": done}, {"action": ACTION_LATER + token, "title": later}] if token else None
                    errors = await notifier._deliver_all(settings, title, text, f"smartlists_due_{uid}", actions)
                    delivered = len(errors) < len(targets)
            if not delivered:
                await hass.services.async_call("persistent_notification", "create",
                                               {"title": title, "message": text, "notification_id": f"smartlists_due_{uid}"}, blocking=False)
            sent += 1
        except Exception:  # noqa: BLE001 – eine fehlgeschlagene Meldung darf die anderen nicht aufhalten
            _LOGGER.warning("Erinnerung für %s fehlgeschlagen", entity_id, exc_info=True)
    return sent


def later(due: str) -> str:
    """„Morgen erinnern“: einen Tag weiter, die Uhrzeit bleibt."""
    from datetime import date, timedelta

    return (date.fromisoformat(due[:10]) + timedelta(days=1)).isoformat() + due[10:]


async def async_handle_action(hass: HomeAssistant, action: str) -> bool:
    """Knopf in einer Erinnerung: „Erledigt“ hakt den Eintrag ab, „Morgen erinnern“ verschiebt die Fälligkeit um einen Tag."""
    extras = hass.data.get(DOMAIN, {}).get("extras")
    kind = ACTION_DONE if action.startswith(ACTION_DONE) else ACTION_LATER if action.startswith(ACTION_LATER) else ""
    found = extras.mark_by_token(action[len(kind):]) if extras is not None and kind else None
    if found is None:
        return False
    entity_id, uid, mark = found
    if kind == ACTION_DONE:
        from . import lists

        await lists.update_item(hass, entity_id, uid, checked=True)
    else:
        due = later(str(mark["due"]))
        extras.set_item_mark(entity_id, uid, {"due": due})
        from . import calendar_sync

        await calendar_sync.async_move(hass, extras, entity_id, uid, due)
    return True


def async_setup_timer(hass: HomeAssistant):
    async def _tick(_now: Any) -> None:
        await async_check(hass)

    async def _action(event: Any) -> None:
        action = str((event.data or {}).get("action") or "")
        if action.startswith("SMARTLISTS_"):
            try:
                await async_handle_action(hass, action)
            except Exception:  # noqa: BLE001 – ein Knopfdruck darf nichts zum Absturz bringen
                _LOGGER.warning("Schnell-Aktion %s fehlgeschlagen", action, exc_info=True)

    stop_timer = async_track_time_interval(hass, _tick, INTERVAL)
    stop_events = hass.bus.async_listen("mobile_app_notification_action", _action)

    def _stop() -> None:
        stop_timer()
        stop_events()

    return _stop
