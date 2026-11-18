"""Preisverlauf der Angebote, zentral in Home Assistant (.storage/smartlists/offer_history).

Je Angebot (Markt + Name) der zuletzt gesehene Preis und, wenn er sich geändert hat, die früheren Preise mit Datum.
So kann die Angebots-Karte sagen „war am 10.11. billiger“ – in jedem Browser und in der App gleich, und der Verlauf
wächst auch, wenn niemand die Karte öffnet (alle 30 Minuten aus den Angebots-Sensoren).

Gemerkt werden die Preise ALLER Angebote, nicht die, die jemand ansieht oder auf eine Liste setzt: der Verlauf sagt
nichts über Personen. Deshalb gibt es ihn einmal für alle Benutzer.

    seen = { "<markt>|<name>": {"p": Preis, "d": zuletzt gesehen, "pp": Preis davor, "pd": dessen Tag, "h": [[Tag, Preis], …]} }

Schlüssel und Regeln sind dieselben wie im Preis-Gedächtnis der Karte (rememberPrices in ha_smartdiscounts-card):
Markt und Name klein, ohne Akzente, „ß“ als „ss“. Was KEEP_DAYS Tage nicht mehr gesehen wurde, fällt weg.
"""

from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from . import storage
from .const import DOMAIN

STORAGE_KEY = storage.key("offer_history")
KEEP_DAYS = 90      # so lange nach dem letzten Mal bleibt ein Preis gemerkt
KEEP_PRICES = 5     # frühere Preise je Angebot
MAX_KEYS = 20000
_DAY = re.compile(r"\d{4}-\d\d-\d\d")


def offer_key(store: Any, name: Any) -> str:
    from .offers import norm

    return f"{norm(store)}|{norm(name)}"[:200]


def _differs(a: float, b: float) -> bool:
    return abs(a - b) > 0.004


class OfferHistory:
    def __init__(self, hass: HomeAssistant | None) -> None:
        self._store: Store[dict[str, Any]] | None = Store(hass, 1, STORAGE_KEY) if hass is not None else None
        self.seen: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        data = (await self._store.async_load() or {}) if self._store else {}
        self.seen = dict(data.get("seen") or {})

    def _save(self) -> None:
        if self._store:
            self._store.async_delay_save(lambda: {"seen": self.seen}, 5.0)

    @callback
    def merge(self, pairs: list[tuple[str, float]], today: str | None = None) -> dict[str, dict[str, Any]]:
        """Heute gesehene Angebote (Schlüssel, Preis) einarbeiten. Liefert den Stand zu genau diesen Schlüsseln –
        in der Form, die die Karte kennt: {"p", "d", "pp"?, "pd"?}. Derselbe Schlüssel zweimal (zwei Packungsgrößen
        mit gleichem Namen im selben Markt) ist nicht unterscheidbar und wird ausgelassen."""
        today = today or date.today().isoformat()
        once: set[str] = set()
        twice: set[str] = set()
        for key, _ in pairs:
            (twice if key in once else once).add(key)
        changed = False
        result: dict[str, dict[str, Any]] = {}
        for key, price in pairs:
            if key in twice:
                continue
            was = self.seen.get(key)
            if was is None:
                self.seen[key] = now = {"p": price, "d": today}
                changed = True
            elif _differs(float(was["p"]), price) and str(was["d"]) < today:
                history = [[was["d"], was["p"]], *(was.get("h") or [])][:KEEP_PRICES]
                self.seen[key] = now = {"p": price, "d": today, "pp": was["p"], "pd": was["d"], "h": history}
                changed = True
            else:
                now = was
                if was["d"] != today:
                    was["d"] = today
                    changed = True
            result[key] = {k: now[k] for k in ("p", "d", "pp", "pd") if k in now}
        if changed:
            self._prune(today)
            self._save()
        return result

    @callback
    def adopt(self, local: dict[str, Any]) -> int:
        """Verlauf aus einem Browser übernehmen (einmalig je Browser): nur, was hier noch fehlt – ein unbekanntes
        Angebot ganz, bei einem bekannten ohne Vorpreis den Vorpreis. Liefert, wie viel übernommen wurde."""
        taken = 0
        for key, entry in list(local.items())[:MAX_KEYS]:
            if not isinstance(key, str) or not isinstance(entry, dict) or len(key) > 200:
                continue
            try:
                price, day = float(entry["p"]), str(entry["d"])
                before = (float(entry["pp"]), str(entry["pd"])) if entry.get("pp") is not None and entry.get("pd") else None
            except (KeyError, TypeError, ValueError):
                continue
            if not _DAY.fullmatch(day) or (before and not _DAY.fullmatch(before[1])):
                continue
            mine = self.seen.get(key)
            if mine is None:
                self.seen[key] = {"p": price, "d": day, **({"pp": before[0], "pd": before[1], "h": [[before[1], before[0]]]} if before else {})}
                taken += 1
            elif before and "pp" not in mine and _differs(before[0], float(mine["p"])) and before[1] < str(mine["d"]):
                mine.update(pp=before[0], pd=before[1], h=[[before[1], before[0]]])
                taken += 1
        if taken:
            self._prune(date.today().isoformat())
            self._save()
        return taken

    def _prune(self, today: str) -> None:
        limit = (date.fromisoformat(today) - timedelta(days=KEEP_DAYS)).isoformat()
        for key in [k for k, v in self.seen.items() if str(v.get("d") or "") < limit]:
            self.seen.pop(key)
        if len(self.seen) > MAX_KEYS:
            for key in sorted(self.seen, key=lambda k: str(self.seen[k].get("d")))[: len(self.seen) - MAX_KEYS]:
                self.seen.pop(key)

    @callback
    def record(self, offers: list[dict[str, Any]]) -> int:
        """Aus den Angebots-Sensoren (offers.collect) – für den Verlauf im Hintergrund."""
        today = date.today().isoformat()
        pairs = [(offer_key(o.get("store"), o.get("name")), float(o["price"])) for o in offers
                 if not (o.get("from") and str(o["from"]) > today)]
        return len(self.merge(pairs, today))


async def async_get_offer_history(hass: HomeAssistant) -> OfferHistory:
    data = hass.data.setdefault(DOMAIN, {})
    if "offer_history" not in data:
        history = OfferHistory(hass)
        await history.async_load()
        data["offer_history"] = history
    return data["offer_history"]
