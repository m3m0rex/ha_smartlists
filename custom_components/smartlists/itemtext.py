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


def open_tag_query(text: str, rules: list[dict[str, str]]) -> tuple[str, str] | None:
    """Tippt der Nutzer gerade einen Tag ("Milch @Re")? → (kind, angefangener Wert)."""
    if not text or text[-1].isspace():
        return None
    last = text.split()[-1] if text.split() else ""
    for rule in rules:
        if last.startswith(rule["prefix"]):
            return rule["kind"], last[1:]
    return None
