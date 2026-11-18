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
    "from": ("valid_from", "start_date", "valid_start", "from", "validFrom", "starts"),
}
# Grundpreis wie in SmartDiscounts: „… (1 l = 1,33 €) …“ irgendwo im Text der Quelle
_UNIT_RE = re.compile(r"1\s*(kg|l|ltr|liter|stk|st|stück|m)\s*=\s*(?:ab\s*)?(?:€\s*)?(\d+(?:[.,]\d+)?)", re.I)


def unit_label(text: Any) -> str | None:
    """Grundpreis aus dem Text der Quelle als „1,33 €/l“ (None = keiner zu erkennen). Gesucht wird im GANZEN Text –
    REWE schreibt ihn ans Ende einer langen Beschreibung („versch. Sorten, …, je 1,25-l-Fl. (1 l = 1,33 €)“)."""
    m = _UNIT_RE.search(str(text or "").replace("\u00a0", " "))
    if not m:
        return None
    unit = m.group(1).lower()
    unit = "l" if unit.startswith("l") else "Stk" if unit.startswith("st") else unit
    value = float(m.group(2).replace(",", "."))
    return f"{value:.2f}".replace(".", ",") + f" €/{unit}"
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
                # nur der Grundpreis („1,33 €/l“) – die Beschreibung der Quelle („versch. Sorten, …“) sagt nichts
                if (label_ := unit_label(unit)) is not None:
                    offer["unit"] = label_
            start = str(pick(row, "from") or "")[:10]
            if re.fullmatch(r"\d{4}-\d\d-\d\d", start) and start > today:
                offer["from"] = start  # gilt erst ab diesem Tag (z. B. das Prospekt der nächsten Woche)
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


def _watch_lines(fresh: list[tuple[str, dict[str, Any]]]) -> str:
    lines = [f"{term}: {o['name']} – {o['price']:.2f}".replace(".", ",") + f" ({o['store']}"
             + (f", bis {o['until'][8:10]}.{o['until'][5:7]}." if o["until"] else "") + ")" for term, o in fresh[:12]]
    if len(fresh) > 12:
        lines.append(f"+{len(fresh) - 12}")
    return "\n".join(lines)


async def _watch_send(hass: HomeAssistant, targets: list[dict[str, Any]], message: str, tag: str) -> None:
    from .notify import async_get_notifier

    title = "🏷️ Angebot für deine Merkliste"
    for target in targets:
        try:
            if target.get("kind") == "hass":
                await hass.services.async_call("persistent_notification", "create",
                                               {"title": title, "message": message, "notification_id": tag}, blocking=False)
            else:  # notify-Dienst oder -Entität: derselbe Weg wie die Benachrichtigungen der Listen
                await (await async_get_notifier(hass))._deliver(target, title, message, tag)
        except Exception:  # noqa: BLE001 – ein falsches Ziel darf die anderen nicht aufhalten
            _LOGGER.warning("Merkliste: Benachrichtigung an %s fehlgeschlagen", target.get("id"), exc_info=True)


def fresh_for(offers: list[dict[str, Any]], terms: list[str], seen: list[str]) -> list[tuple[str, dict[str, Any]]]:
    """Angebote zu den gemerkten Produkten, die noch nicht gemeldet wurden."""
    known = set(seen)
    return [(term, o) for term in terms for o in deals_for(offers, term) if _key(term, o) not in known]


async def _admin_ids(hass: HomeAssistant, user_ids: list[str]) -> set[str]:
    admins: set[str] = set()
    for user_id in user_ids:
        try:
            user = await hass.auth.async_get_user(user_id)
        except Exception:  # noqa: BLE001
            user = None
        if user is not None and user.is_admin:
            admins.add(user_id)
    return admins


async def async_check_watch(hass: HomeAssistant) -> int:
    """Neue Angebote für die Merklisten melden (jedes Angebot je Benutzer nur einmal). Jeder Benutzer bekommt nur
    die Treffer seiner eigenen Listen, an seine eigenen Ziele. Liefert die Zahl der neuen Treffer."""
    extras = hass.data.get(DOMAIN, {}).get("extras")
    if extras is None:
        return 0
    offers: list[dict[str, Any]] | None = None
    total = 0
    admins = await _admin_ids(hass, list(extras.watch_users))
    extras.repair_watch_targets(admins)
    for user_id, user in list(extras.watch_users.items()):
        terms = list(dict.fromkeys(n for lst in user.get("lists") or [] for n in lst.get("names") or []))
        if not user.get("notify") or not terms:
            continue
        if offers is None:
            offers = collect(hass, extras.watch_settings.get("sources"))
        fresh = fresh_for(offers, terms, user.get("seen") or [])
        if not fresh:
            continue
        extras.mark_user_watch_seen(user_id, [_key(term, o) for term, o in fresh])
        # „In Home Assistant“ sieht der ganze Haushalt – dieses Ziel gilt nur bei Admins
        targets = [t for t in user.get("targets") or [] if t.get("kind") != "hass" or user_id in admins]
        await _watch_send(hass, targets, _watch_lines(fresh), f"smartlists_watch_{user_id[:8]}")
        total += len(fresh)
    if extras.watch_users or not extras.watch or not extras.watch_settings.get("notify"):
        return total
    # noch niemand hat seit dem Update seine Merkliste geöffnet: die frühere gemeinsame Merkliste meldet weiter
    fresh = fresh_for(collect(hass, extras.watch_settings.get("sources")), extras.watch, extras.watch_seen)
    if not fresh:
        return 0
    extras.mark_watch_seen([_key(term, o) for term, o in fresh])
    await _watch_send(hass, extras.watch_settings.get("targets") or [], _watch_lines(fresh), "smartlists_watch")
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
