"""Harte Fehler mit Kennung – damit sie nicht still im Protokoll verschwinden.

Erwartbares (keine Berechtigung, Liste gelöscht, Dienst gerade nicht erreichbar) gehört nicht hierher: dafür gibt es
eine verständliche Meldung an Ort und Stelle. Hier landet, was auf einen Fehler in SmartLists oder auf beschädigte
Daten hinweist. Jeder Fall hat eine kurze Kennung (SL-STORE-01 …), die in der Meldung steht und im Fehlerbericht
vorausgefüllt wird.

Gemerkt werden die letzten 20 Fälle, nur im Arbeitsspeicher (nach einem Neustart ist die Liste leer; was weiter
besteht, meldet sich wieder). Die Einzelheiten (`detail`) können Namen von Listen oder Entitäten enthalten: sie
werden dem Benutzer in den Einstellungen gezeigt, in einen Fehlerbericht aber nur übernommen, wenn er das für diesen
Bericht ausdrücklich erlaubt.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

SIGNAL_PROBLEMS = f"{DOMAIN}_problems_changed"
KEEP = 20
# Kennung → (wo es auftritt, kurze Beschreibung auf Englisch für Protokoll und Bericht)
CODES: dict[str, tuple[str, str]] = {
    "SL-STORE-01": ("settings", "files could not be moved to .storage/smartlists"),
    "SL-STORE-02": ("settings", "a storage file could not be read"),
    "SL-BACKUP-01": ("settings", "backup could not be written"),
    "SL-BACKUP-02": ("settings", "backup could not be restored"),
    "SL-CAL-01": ("card", "calendar event could not be removed"),
    "SL-WS-01": ("card", "a command failed unexpectedly"),
    "SL-NOTIFY-01": ("settings", "a notification could not be delivered"),
    "SL-TIMER-01": ("other", "a background check failed"),
}


def _list(hass: HomeAssistant) -> list[dict[str, Any]]:
    return hass.data.setdefault(DOMAIN, {}).setdefault("problems", [])


@callback
def report(hass: HomeAssistant, code: str, detail: str = "") -> None:
    """Einen harten Fehler festhalten. Derselbe Fall (Kennung + Einzelheiten) zählt hoch, statt die Liste zu füllen."""
    where, text = CODES.get(code, ("other", "unknown problem"))
    detail = str(detail or "")[:300]
    items = _list(hass)
    same = next((p for p in items if p["code"] == code and p["detail"] == detail), None)
    if same is not None:
        same["count"] += 1
        same["at"] = int(time.time())
    else:
        items.append({"code": code, "where": where, "text": text, "detail": detail, "at": int(time.time()), "count": 1})
        del items[:-KEEP]
    _LOGGER.error("SmartLists %s: %s%s", code, text, f" ({detail})" if detail else "")
    try:
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        async_dispatcher_send(hass, SIGNAL_PROBLEMS)
    except Exception:  # noqa: BLE001 – das Melden selbst darf nichts auslösen
        pass


def current(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Die gemerkten Fälle, neuester zuerst."""
    return sorted(_list(hass), key=lambda p: -p["at"])


@callback
def clear(hass: HomeAssistant, code: str | None = None) -> None:
    items = _list(hass)
    items[:] = [p for p in items if code and p["code"] != code]
    try:
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        async_dispatcher_send(hass, SIGNAL_PROBLEMS)
    except Exception:  # noqa: BLE001
        pass
