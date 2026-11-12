"""Artikeltext zerlegen und zusammensetzen – ohne Home-Assistant-Abhängigkeit (testbar).

Home Assistants To-do-Einträge haben nur einen Namen. Menge und Markierungen stehen deshalb im
Namen selbst, damit jede andere Oberfläche (HA-To-do-Ansicht, Sprachassistent, App) sie weiter sieht:

    "Milch 2 l @REWE #bio"  →  Name "Milch", Menge 2, Einheit "l", Tags [Markt REWE, Schlagwort bio]

Mengen-Format wie in der App (HomeAssistantStore.encodeQuantityIntoName): "Name [N× ]Menge [Einheit]".
Beim Eintippen wird zusätzlich "2 kg Äpfel" (Menge vorne) erkannt.

Welches Zeichen welche Art Tag einleitet, ist einstellbar (siehe DEFAULT_TAG_RULES).
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any

TAG_KINDS = ("store", "person", "tag")
DEFAULT_TAG_RULES: list[dict[str, str]] = [
    {"prefix": "@", "kind": "store"},  # @REWE   → Markt-Badge
    {"prefix": "*", "kind": "person"},  # *Anna   → für wen
    {"prefix": "#", "kind": "tag"},  # #bio    → Schlagwort
]
# Erlaubte Präfixe: ein einzelnes Satz-/Sonderzeichen, das in Artikelnamen praktisch nie vorkommt.
ALLOWED_PREFIXES = "@*#!+~$&%^="

# Bekannte Märkte: Schreibweise + Farbe wie in der App (storeBadgeColor in MainActivity.kt)
KNOWN_STORES: dict[str, tuple[str, str]] = {
    "rewe": ("REWE", "#CC0000"),
    "lidl": ("LIDL", "#FF6F00"),
    "aldi": ("ALDI", "#005DFD"),
    "edeka": ("EDEKA", "#00A6FF"),
    "norma": ("NORMA", "#FF5607"),
    "kaufland": ("Kaufland", "#E10915"),
    "penny": ("Penny", "#CD1414"),
    "netto": ("Netto", "#FFD500"),
    "dm": ("dm", "#002878"),
    "rossmann": ("Rossmann", "#C3002D"),
}

_NUM = r"[0-9]+(?:[.,][0-9]+)?"
_UNIT = r"[a-zA-ZäöüÄÖÜß%°]+\.?"
_SUFFIX_UNIT = re.compile(rf"^(.+?)\s+(?:([0-9]+)[×xX]\s+)?({_NUM})\s+({_UNIT})$")
_SUFFIX_ONLY = re.compile(rf"^(.+?)\s+(?:([0-9]+)[×xX]\s+)?({_NUM})$")
_PREFIX_QTY = re.compile(rf"^({_NUM})\s*(?:({_UNIT})\s+)?(.+)$")
# Wörter, die bei "2 Bananen" fälschlich als Einheit erkannt würden, wenn kein Leerzeichen-Name folgt
_UNIT_WORDS = {
    "stk", "stück", "st", "kg", "g", "gr", "l", "ml", "cl", "pck", "pk", "packung", "packungen", "fl",
    "flasche", "flaschen", "dose", "dosen", "becher", "glas", "gläser", "tube", "bund", "netz", "beutel",
    "tüte", "kiste", "kasten", "rolle", "rollen", "scheiben", "pkg", "x",
}


@dataclass
class ParsedItem:
    name: str
    quantity: float | None = None
    unit: str | None = None
    pack_count: int | None = None
    tags: list[dict[str, str]] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "quantity": self.quantity,
            "unit": self.unit,
            "pack_count": self.pack_count,
            "tags": self.tags,
        }


def validate_rules(rules: Any) -> list[dict[str, str]]:
    """Regeln prüfen; wirft ValueError mit verständlicher Meldung."""
    if not isinstance(rules, list):
        raise ValueError("Regeln müssen eine Liste sein")
    seen: set[str] = set()
    clean: list[dict[str, str]] = []
    for rule in rules:
        prefix = str(rule.get("prefix", "")).strip()
        kind = str(rule.get("kind", "")).strip()
        if len(prefix) != 1 or prefix not in ALLOWED_PREFIXES:
            raise ValueError(f"Ungültiges Zeichen '{prefix}' – erlaubt: {' '.join(ALLOWED_PREFIXES)}")
        if kind not in TAG_KINDS:
            raise ValueError(f"Unbekannte Art '{kind}'")
        if prefix in seen:
            raise ValueError(f"Zeichen '{prefix}' ist doppelt vergeben")
        seen.add(prefix)
        clean.append({"prefix": prefix, "kind": kind})
    return clean


def _tag_regex(rules: list[dict[str, str]]) -> re.Pattern[str] | None:
    if not rules:
        return None
    chars = "".join(re.escape(r["prefix"]) for r in rules)
    return re.compile(rf"(?:^|\s)([{chars}])([\wÄÖÜäöüß][\wÄÖÜäöüß.\-]*)")


def store_display(value: str) -> tuple[str, str | None]:
    """Markt-Schreibweise + Farbe, falls bekannt (REWE, Lidl, …)."""
    known = KNOWN_STORES.get(value.lower())
    return (known[0], known[1]) if known else (value, None)


def split_tags(text: str, rules: list[dict[str, str]]) -> tuple[str, list[dict[str, str]]]:
    """Tags aus dem Text lösen. Reihenfolge bleibt erhalten, Duplikate fallen weg."""
    regex = _tag_regex(rules)
    if regex is None:
        return text.strip(), []
    kinds = {r["prefix"]: r["kind"] for r in rules}
    tags: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for match in regex.finditer(text):
        kind = kinds[match.group(1)]
        value = match.group(2).rstrip(".-")
        key = (kind, value.lower())
        if key in seen:
            continue
        seen.add(key)
        tag = {"kind": kind, "value": value, "prefix": match.group(1)}
        if kind == "store":
            tag["label"], color = store_display(value)
            if color:
                tag["color"] = color
        else:
            tag["label"] = value
        tags.append(tag)
    rest = regex.sub(" ", text)
    return " ".join(rest.split()), tags


def _num(raw: str) -> float:
    return float(raw.replace(",", "."))


def parse(text: str, rules: list[dict[str, str]], *, allow_prefix_quantity: bool = False) -> ParsedItem:
    """Gespeicherten Namen (oder Eingabe mit allow_prefix_quantity=True) zerlegen."""
    rest, tags = split_tags(text, rules)
    if m := _SUFFIX_UNIT.match(rest):
        return ParsedItem(m.group(1).strip(), _num(m.group(3)), m.group(4), int(m.group(2)) if m.group(2) else None, tags)
    if m := _SUFFIX_ONLY.match(rest):
        return ParsedItem(m.group(1).strip(), _num(m.group(3)), None, int(m.group(2)) if m.group(2) else None, tags)
    if allow_prefix_quantity and (m := _PREFIX_QTY.match(rest)):
        qty, unit, name = _num(m.group(1)), m.group(2), m.group(3).strip()
        if unit and unit.rstrip(".").lower() not in _UNIT_WORDS:
            # "2 Bananen": "Bananen" ist keine Einheit, sondern der Name
            name, unit = f"{unit} {name}".strip(), None
        if name:
            return ParsedItem(name, qty, unit.rstrip(".") if unit else None, None, tags)
    return ParsedItem(rest, None, None, None, tags)


def format_quantity(quantity: float) -> str:
    return str(int(quantity)) if float(quantity).is_integer() else str(quantity).replace(".", ",")


def encode(item: ParsedItem, rules: list[dict[str, str]]) -> str:
    """Zurück in einen HA-Namen: "Milch 2 l @REWE". Tags mit dem aktuell eingestellten Zeichen."""
    parts = [item.name.strip()]
    if item.quantity is not None:
        if item.pack_count and item.pack_count > 1:
            parts.append(f"{item.pack_count}×")
        parts.append(format_quantity(item.quantity))
        if item.unit:
            parts.append(item.unit.strip())
    prefix_for = {r["kind"]: r["prefix"] for r in rules}
    for tag in item.tags:
        prefix = prefix_for.get(tag["kind"]) or tag.get("prefix")
        value = str(tag.get("value", "")).strip().replace(" ", "-")
        if prefix and value:
            parts.append(f"{prefix}{value}")
    return " ".join(p for p in parts if p)


# ----------------------------------------------------------------------
# Angebote aus der App
# ----------------------------------------------------------------------
# Die HA-SmartLists-App hängt beim Hinzufügen aus der Angebote-Übersicht eine Zeile an die Notiz:
#   ⚙OFFER:{"s":"REWE","e":"2026-11-14","v":"2026-11-09","a":1794055898321,"p":0.39}
# s = Markt, p = Preis, o = alter Preis, d = Rabatt, v/e = gültig ab/bis (JJJJ-MM-TT),
# a = hinzugefügt (Epoch-Millis). Siehe HomeAssistantStore.encodeOfferMetaIntoDescription.
OFFER_TAG = "⚙OFFER:"
# auch "⚙️OFFER:" (mit Emoji-Variante), Leerzeichen oder Kleinschreibung erkennen
_OFFER_RE = re.compile(r"[⚙\u2699]\ufe0f?\s*OFFER\s*:", re.IGNORECASE)


def split_offer(note: str | None) -> tuple[str, dict[str, Any] | None, str]:
    """Notiz → (Notiz ohne Angebots-Zeile, Angebot oder None, rohe Angebots-Zeile oder "").
    Ein kaputtes Tag wird trotzdem abgeschnitten (wie in der App), damit nie JSON angezeigt wird."""
    import json
    from datetime import date

    text = note or ""
    m = _OFFER_RE.search(text)
    if m is None:
        return text, None, ""
    clean = text[: m.start()].strip("\n ")
    raw_line = text[m.start():].strip()
    try:
        data = json.loads(text[m.end():].strip())
    except ValueError:
        return clean, None, raw_line
    if not isinstance(data, dict) or not data.get("s"):
        return clean, None, raw_line
    label, color = store_display(str(data["s"]))

    def _num(v: Any) -> float | None:
        try:
            return float(str(v).replace(",", ".").replace("€", "").strip())
        except (TypeError, ValueError):
            return None

    until = str(data.get("e") or "") or None
    expired = False
    if until:
        try:
            expired = date.fromisoformat(until[:10]) < date.today()
        except ValueError:
            pass
    offer = {
        "store": str(data["s"]),
        "store_label": label,
        "color": color,
        "price": _num(data.get("p")),
        "old_price": _num(data.get("o")),
        "discount": str(data["d"]) if data.get("d") else None,
        "valid_from": str(data.get("v") or "") or None,
        "valid_until": until,
        "added_at": int(data["a"]) if str(data.get("a", "")).isdigit() else None,
        "expired": expired,
    }
    return clean, offer, raw_line


def join_offer(note: str, raw_line: str) -> str:
    """Notiz + rohe Angebots-Zeile wieder zusammensetzen (Format wie in der App)."""
    note = (note or "").rstrip()
    if not raw_line:
        return note
    return f"{note}\n{raw_line}" if note else raw_line


def offer_summary(offer: dict[str, Any]) -> str:
    """Lesbare Zeile für Oberflächen ohne Badges, z.B. „🏷️ REWE · 0,39 € · bis 14.11.“."""
    parts = [f"🏷️ {offer['store_label']}"]
    if offer.get("price") is not None:
        price = f"{offer['price']:.2f}".replace(".", ",") + " €"
        if offer.get("old_price") is not None:
            price += f" (statt {offer['old_price']:.2f}".replace(".", ",") + " €)"
        parts.append(price)
    if offer.get("discount"):
        parts.append(str(offer["discount"]))
    if offer.get("valid_until"):
        d = offer["valid_until"][:10].split("-")
        parts.append(("abgelaufen " if offer.get("expired") else "bis ") + (f"{d[2]}.{d[1]}." if len(d) == 3 else offer["valid_until"]))
    return " · ".join(parts)


# Wörter, die in Listennamen nichts über die Person sagen ("Einkaufsliste Peter" → "Peter")
_LIST_NOISE = {
    "einkaufsliste", "einkaufslisten", "einkauf", "einkaufen", "liste", "listen", "todo", "to-do", "aufgaben",
    "shopping", "list", "grocery", "groceries", "von", "für", "fuer", "of", "for", "die", "der", "das", "meine", "my",
}


def person_from_list_name(name: str, entity_id: str = "") -> str | None:
    """Person aus dem Namen einer Liste ableiten: "Peter" bzw. todo.peter → "Peter",
    "Einkaufsliste Peter" → "Peter". Es werden nur Füllwörter entfernt, nichts geraten
    (z.B. kein Genitiv-s). Bleibt nichts übrig ("Einkaufsliste"), gibt es keine Person."""
    raw = name or entity_id.split(".", 1)[-1].replace("_", " ")
    words = [w for w in re.split(r"[\s_\-–·:]+", raw.strip()) if w]
    kept = [w for w in words if w.casefold() not in _LIST_NOISE]
    if not kept:
        return None
    person = " ".join(kept)
    return person[:1].upper() + person[1:]


def open_tag_query(text: str, rules: list[dict[str, str]]) -> tuple[str, str] | None:
    """Tippt der Nutzer gerade einen Tag ("Milch @Re")? → (kind, angefangener Wert)."""
    if not text or text[-1].isspace():
        return None
    last = text.split()[-1] if text.split() else ""
    for rule in rules:
        if last.startswith(rule["prefix"]):
            return rule["kind"], last[1:]
    return None
