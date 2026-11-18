"""Angebote aus den Angebots-Sensoren lesen und mit der Merkliste abgleichen.

Gleiche Regeln wie die SmartDiscounts-Karte (eigenes Repository ha_smartdiscounts-card) (Felder, Preise, Treffer „ganzes Wort“) – hier in Python,
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
    # optional – for the offers view of the app (category sections, old price, price per unit)
    "old": ("old_price", "regular_price", "original_price", "price_before", "was_price", "uvp"),
    "unit": ("price_per_unit", "base_price", "unit_price", "grundpreis"),
    "category": ("category", "categories", "group"),
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


def _get(obj: Any, path: str) -> Any:
    """„product.name“ / „images.0.url“ – wie die Feld-Zuordnung (map:) der Karte."""
    for key in str(path).split("."):
        if isinstance(obj, dict):
            obj = obj.get(key)
        elif isinstance(obj, list) and key.isdigit() and int(key) < len(obj):
            obj = obj[int(key)]
        else:
            return None
    return obj


def clean_sources(raw: Any) -> list[dict[str, Any]]:
    """Eigene Quellen aus einer Karte (sources: mit entity/attribute/store/map) – nur was die Prüfung braucht."""
    out: list[dict[str, Any]] = []
    for src in raw if isinstance(raw, list) else []:
        if not isinstance(src, dict) or not re.fullmatch(r"sensor\.[a-z0-9_]+", str(src.get("entity") or "")):
            continue
        clean: dict[str, Any] = {"entity": src["entity"]}
        for key in ("attribute", "store"):
            if isinstance(src.get(key), str) and src[key].strip():
                clean[key] = src[key].strip()[:80]
        fields = {f: str(v)[:80] for f, v in (src.get("map") or {}).items() if f in FIELDS and isinstance(v, str) and v.strip()} if isinstance(src.get("map"), dict) else {}
        if fields:
            clean["map"] = fields
        if len(clean) > 1 and not any(x["entity"] == clean["entity"] for x in out):
            out.append(clean)
    return out[:20]


def collect(hass: HomeAssistant, custom: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Alle gültigen Angebote: Sensoren mit einer Angebotsliste in einem Attribut (automatisch erkannt) und
    eigene Quellen mit Feld-Zuordnung, wie sie in einer Angebots-Karte eingetragen sind."""
    today, out = date.today().isoformat(), []
    seen: set[tuple[Any, ...]] = set()
    own = {s["entity"]: s for s in (custom or [])}
    states = {s.entity_id: s for s in hass.states.async_all("sensor")}
    for entity_id, state in states.items():
        src = own.get(entity_id, {})
        rows = _get(state.attributes, src["attribute"]) if src.get("attribute") else next(
            (state.attributes[a] for a in LIST_ATTRS if isinstance(state.attributes.get(a), list)), None)
        if not isinstance(rows, list) or not rows:
            continue
        label, fmap = src.get("store") or _store_label(entity_id, state.attributes), src.get("map") or {}

        def pick(row: dict[str, Any], field: str) -> Any:
            return _get(row, fmap[field]) if field in fmap else _pick(row, field)

        for row in rows:
            if not isinstance(row, dict):
                continue
            name, price = pick(row, "name"), num(pick(row, "price"))
            if not name or price is None:
                continue
            until = str(pick(row, "until") or "")[:10] or None
            if until and re.fullmatch(r"\d{4}-\d\d-\d\d", until) and until < today:
                continue
            offer = {"name": str(name), "price": price, "until": until, "store": str(pick(row, "store") or label)}
            old, unit, cat = num(pick(row, "old")), pick(row, "unit"), pick(row, "category")
            if isinstance(cat, (list, tuple)):
                cat = cat[0] if cat else None
            if old is not None and old > price:
                offer["old"] = old
            if isinstance(unit, (str, int, float)) and str(unit).strip():
                offer["unit"] = str(unit).strip()[:40]
            if isinstance(cat, str) and cat.strip():
                offer["category"] = cat.strip()[:60]
            # the same offer from two sensors (e.g. two integrations for one store) counts once
            key = (norm(offer["store"]), norm(offer["name"]), price, until)
            if key in seen:
                continue
            seen.add(key)
            out.append(offer)
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
    offers = collect(hass, extras.watch_settings.get("sources"))
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
        try:  # Preisverlauf: alle Angebote merken, auch wenn niemand eine Karte geöffnet hat
            extras = hass.data.get(DOMAIN, {}).get("extras")
            history = hass.data.get(DOMAIN, {}).get("offer_history")
            if history is not None:
                history.record(collect(hass, extras.watch_settings.get("sources") if extras else None))
        except Exception:  # noqa: BLE001 – darf die Merkliste nicht aufhalten
            _LOGGER.warning("Preisverlauf nicht fortgeschrieben", exc_info=True)
        await async_check_watch(hass)

    return async_track_time_interval(hass, _tick, WATCH_INTERVAL)
