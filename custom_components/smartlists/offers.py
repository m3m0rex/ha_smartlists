"""Angebote aus den Angebots-Sensoren lesen und mit der Merkliste abgleichen.

Gleiche Regeln wie die Karte www/smartdiscounts-card.js (Felder, Preise, Treffer „ganzes Wort“) – hier in Python,
damit Home Assistant auch ohne geöffnetes Dashboard melden kann, wenn etwas von der Merkliste im Angebot ist.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from datetime import date, timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_interval

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

LIST_ATTRS = ("discounts", "offers", "deals", "items", "results", "products")
FIELDS: dict[str, tuple[str, ...]] = {
    "name": ("product", "title", "name", "product_name", "description"),
    "price": ("price", "new_price", "discount_price", "offer_price", "sale_price", "price_euro", "current_price"),
    "until": ("valid_until", "end_date", "valid_to", "until"),
    "store": ("store", "market", "retailer", "advertiser"),
}
STORES = (("rewe", "REWE"), ("edeka", "EDEKA"), ("lidl", "Lidl"), ("aldi", "ALDI"), ("norma", "Norma"), ("penny", "Penny"),
          ("kaufland", "Kaufland"), ("netto", "Netto"), ("rossmann", "Rossmann"), ("globus", "Globus"))
WATCH_INTERVAL = timedelta(minutes=30)
MAX_WATCH = 60
_ENDINGS = ("en", "er", "n", "e", "s")


def norm(text: Any) -> str:
    out = unicodedata.normalize("NFD", str(text or "").lower())
    return "".join(c for c in out if not unicodedata.combining(c)).replace("ß", "ss")


def num(value: Any) -> float | None:
    """„11,49 €“, „1.11 €“, „€ 10.98“ oder Zahl → Betrag."""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    m = re.search(r"(\d+)(?:[.,](\d{1,2}))?", str(value or ""))
    return float(f"{m.group(1)}.{m.group(2) or 0}") if m else None


def _stem(word: str) -> str:
    if len(word) >= 5:
        for end in _ENDINGS:
            if word.endswith(end):
                return word[: -len(end)]
    return word


def _words(text: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9]+", norm(text)) if len(w) > 1]


def matches(name: str, title: str) -> bool:
    """Passt ein Angebot zu einem gemerkten Produkt? Jedes Wort muss als ganzes Wort (oder Ende eines
    zusammengesetzten Wortes: Kaffee → Filterkaffee) vorkommen – Butter passt nicht auf Butterkeks."""
    want, have = [_stem(w) for w in _words(name)], [_stem(w) for w in _words(title)]
    if not want or not have:
        return False
    return all(any(h == w or (len(w) >= 4 and h.endswith(w)) for h in have) for w in want)


def _pick(row: dict[str, Any], field: str) -> Any:
    return next((row[k] for k in FIELDS[field] if row.get(k) not in (None, "")), None)


def _store_label(entity_id: str, attrs: dict[str, Any]) -> str:
    key = norm(f"{entity_id} {attrs.get('friendly_name') or ''}")
    return next((label for k, label in STORES if k in key), str(attrs.get("friendly_name") or entity_id.split(".", 1)[-1]))


def collect(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Alle gültigen Angebote aller Sensoren, die eine Angebotsliste in einem Attribut haben."""
    today, out = date.today().isoformat(), []
    for state in hass.states.async_all("sensor"):
        rows = next((state.attributes[a] for a in LIST_ATTRS if isinstance(state.attributes.get(a), list)), None)
        if not rows:
            continue
        label = _store_label(state.entity_id, state.attributes)
        for row in rows:
            if not isinstance(row, dict):
                continue
            name, price = _pick(row, "name"), num(_pick(row, "price"))
            if not name or price is None:
                continue
            until = str(_pick(row, "until") or "")[:10] or None
            if until and re.fullmatch(r"\d{4}-\d\d-\d\d", until) and until < today:
                continue
            out.append({"name": str(name), "price": price, "until": until, "store": str(_pick(row, "store") or label)})
    return out


def deals_for(offers: list[dict[str, Any]], name: str) -> list[dict[str, Any]]:
    return sorted((o for o in offers if matches(name, o["name"])), key=lambda o: o["price"])


def _key(term: str, offer: dict[str, Any]) -> str:
    return f"{norm(term)}|{offer['store']}|{offer['name']}|{offer['price']}|{offer['until'] or ''}"


async def async_check_watch(hass: HomeAssistant) -> int:
    """Neue Angebote für die Merkliste melden (jedes Angebot nur einmal). Liefert die Zahl der neuen Treffer."""
    extras = hass.data.get(DOMAIN, {}).get("extras")
    if extras is None or not extras.watch or not extras.watch_settings.get("notify"):
        return 0
    offers = collect(hass)
    fresh = [(term, o) for term in extras.watch for o in deals_for(offers, term) if _key(term, o) not in extras.watch_seen]
    if not fresh:
        return 0
    extras.mark_watch_seen([_key(term, o) for term, o in fresh])
    lines = [f"{term}: {o['name']} – {o['price']:.2f}".replace(".", ",") + f" ({o['store']}"
             + (f", bis {o['until'][8:10]}.{o['until'][5:7]}." if o["until"] else "") + ")" for term, o in fresh[:12]]
    if len(fresh) > 12:
        lines.append(f"+{len(fresh) - 12}")
    title, message = "🏷️ Angebot für deine Merkliste", "\n".join(lines)
    from .notify import async_get_notifier

    for target in extras.watch_settings.get("targets") or []:
        try:
            if target.get("kind") == "hass":
                await hass.services.async_call("persistent_notification", "create",
                                               {"title": title, "message": message, "notification_id": "smartlists_watch"}, blocking=False)
            else:  # notify-Dienst oder -Entität: derselbe Weg wie die Benachrichtigungen der Listen
                await (await async_get_notifier(hass))._deliver(target, title, message, "smartlists_watch")
        except Exception:  # noqa: BLE001 – ein falsches Ziel darf die anderen nicht aufhalten
            _LOGGER.warning("Merkliste: Benachrichtigung an %s fehlgeschlagen", target.get("id"), exc_info=True)
    return len(fresh)


@callback
def async_setup_watch_timer(hass: HomeAssistant):
    async def _tick(_now: Any) -> None:
        await async_check_watch(hass)

    return async_track_time_interval(hass, _tick, WATCH_INTERVAL)
