"""Kategorie-Erkennung aus Keyword-Packs.

Ein Pack ordnet Stichwörter den 12 festen Kategorien zu (+ optional Produkte mit üblicher Einheit für
Vorschläge). Eingebaut: packs/*.json (Deutsch aus der HA-SmartLists-App, Start-Packs für weitere
Sprachen); eigene Packs verwaltet packs.py. Aktiv sein können beliebig viele – ihre Stichwörter werden
zusammengeführt, der längste Treffer gewinnt. Gelernte und manuelle Zuordnungen (learning.py) haben
immer Vorrang.

Pack-Format (JSON):
    {"name": "…", "language": "en", "version": 1,
     "terms": {"apple": "obst_gemuese", …},
     "products": [["Apples", "kg", "obst_gemuese"], …]}          (products optional)
Akzeptiert wird auch das Format der App (category_pack_v2.json: "items" mit keyword/aliases/category).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN

PACKS_DIR = Path(__file__).parent / "packs"
FALLBACK_ID = "sonstiges"
MAX_TERMS = 50_000

# Feste Kategorien: Reihenfolge = Sortierung (grob wie ein Rundgang durch den Markt)
CATEGORY_DEFS: list[tuple[str, str, dict[str, str]]] = [
    ("obst_gemuese", "🥬", {"de": "Obst & Gemüse", "en": "Fruit & veg", "fr": "Fruits & légumes", "es": "Frutas y verduras", "it": "Frutta e verdura", "pl": "Owoce i warzywa"}),
    ("fleisch", "🥩", {"de": "Fleisch- & Fischtheke", "en": "Meat & fish", "fr": "Viande & poisson", "es": "Carne y pescado", "it": "Carne e pesce", "pl": "Mięso i ryby"}),
    ("kuehlung", "🥛", {"de": "Kühlung", "en": "Chilled & dairy", "fr": "Frais & produits laitiers", "es": "Refrigerados y lácteos", "it": "Freschi e latticini", "pl": "Nabiał i chłodzone"}),
    ("grundnahrung", "🥫", {"de": "Konserven & Trockensortiment", "en": "Pantry & tins", "fr": "Épicerie & conserves", "es": "Despensa y conservas", "it": "Dispensa e scatolame", "pl": "Spiżarnia i konserwy"}),
    ("backwaren", "🍞", {"de": "Brot & Backwaren", "en": "Bread & bakery", "fr": "Pain & boulangerie", "es": "Pan y bollería", "it": "Pane e prodotti da forno", "pl": "Pieczywo"}),
    ("getraenke", "🥤", {"de": "Getränke", "en": "Drinks", "fr": "Boissons", "es": "Bebidas", "it": "Bevande", "pl": "Napoje"}),
    ("suessigkeiten", "🍫", {"de": "Süßwaren & Snacks", "en": "Sweets & snacks", "fr": "Confiserie & snacks", "es": "Dulces y snacks", "it": "Dolci e snack", "pl": "Słodycze i przekąski"}),
    ("haushalt", "🧹", {"de": "Haushalt", "en": "Household", "fr": "Entretien", "es": "Hogar y limpieza", "it": "Casa e pulizia", "pl": "Chemia domowa"}),
    ("drogerie", "🧴", {"de": "Drogerie", "en": "Personal care", "fr": "Hygiène & beauté", "es": "Higiene y belleza", "it": "Igiene e bellezza", "pl": "Drogeria"}),
    ("tiefkuehl", "❄️", {"de": "Tiefkühl", "en": "Frozen", "fr": "Surgelés", "es": "Congelados", "it": "Surgelati", "pl": "Mrożonki"}),
    ("tierbedarf", "🐕", {"de": "Tierbedarf", "en": "Pets", "fr": "Animaux", "es": "Mascotas", "it": "Animali", "pl": "Zwierzęta"}),
    ("sonstiges", "📦", {"de": "Sonstiges", "en": "Other", "fr": "Autres", "es": "Otros", "it": "Altro", "pl": "Inne"}),
]
CATEGORY_IDS = [c[0] for c in CATEGORY_DEFS]
LANGUAGES = ("de", "en", "fr", "es", "it", "pl")
# Kategorien des App-Formats (Anzeigename oder ID, ältere Namen) → ID
_APP_CATEGORY = {
    **{cid: cid for cid in CATEGORY_IDS},
    "konserven": "grundnahrung",
    **{f"{emoji} {names['de']}": cid for cid, emoji, names in CATEGORY_DEFS},
    "🥩 Fleisch": "fleisch", "🥫 Konserven": "grundnahrung", "🍞 Backwaren": "backwaren", "🍫 Süßigkeiten": "suessigkeiten",
}


def normalize(name: str) -> str:
    """Schlüssel für Vergleiche. Bewusst lower() statt casefold(): casefold macht aus "ß" "ss",
    die Stichwörter im Paket sind aber mit "ß" geschrieben (z.B. "süßkartoffel")."""
    return " ".join(name.strip().lower().split())


def _lang(language: str | None) -> str:
    code = (language or "de").split("-")[0].lower()
    return code if code in LANGUAGES else "en"


def match_class(term: str, key: str) -> int:
    """Wie gut ein Stichwort im Namen steht – damit „Cocktail-Strauchtomaten“ Tomaten sind und kein Getränk:

    2 = das Stichwort ist ein ganzes Wort oder das Ende eines Wortes („Strauch|tomaten“, „Apfel|saft“) –
        im Deutschen sagt das Ende eines zusammengesetzten Wortes, was es ist
    1 = es ist der Anfang eines Wortes („Tomaten|sauce“) oder der vordere Teil mit Bindestrich („Sherry-“ in
        „Bio-Sherry-Tomaten“): nur eine nähere Bestimmung
    0 = es steckt nur mitten in einem Wort („rauch“ in „Strauchtomaten“) – zählt bei kurzen Stichwörtern (bis
        fünf Zeichen) gar nicht, bei längeren als schwächster Treffer
    -1 = kommt nicht vor
    """
    best, start = -1, 0
    while True:
        i = key.find(term, start)
        if i < 0:
            return best
        before = key[i - 1] if i > 0 else " "
        after = key[i + len(term)] if i + len(term) < len(key) else " "
        ends = not after.isalnum() and after != "-"
        begins = not before.isalnum()
        cls = 2 if ends else 1 if begins else (0 if len(term) > 5 else -1)
        if cls > best:
            best = cls
            if best == 2:
                return best
        start = i + 1


def best_match(candidates: list[tuple[str, str, int]], key: str) -> tuple[str, str] | None:
    """Bestes Stichwort für einen Namen. candidates: (Stichwort, Kategorie, Vorrang) – Vorrang 1 für selbst
    Gelerntes, 0 für die Wörterlisten. Marken unter „Sonstiges“ verlieren immer; sonst gewinnt die bessere Stellung im Namen
    (match_class), dann Gelerntes, dann das längere Stichwort. Liefert (Kategorie, Stichwort)."""
    found: tuple[tuple[int, int, int, int], str, str] | None = None
    for term, category_id, priority in candidates:
        if term not in key:
            continue
        cls = match_class(term, key)
        if cls < 0:
            continue
        # Marken („REWE Bio“, „ja!“) stehen in den Wörterlisten unter „Sonstiges“: sie verlieren gegen jedes Stichwort,
        # das sagt, was es ist („REWE Bio Cherry Romatomaten“ → Obst & Gemüse)
        score = (0 if category_id == FALLBACK_ID and not priority else 1, cls, priority, len(term))
        if found is None or score > found[0]:
            found = (score, category_id, term)
    return (found[1], found[2]) if found else None


class CategoryIndex:
    """Stichwort → Kategorie. Es gewinnt das Stichwort, das am Ende eines Wortes steht (siehe match_class),
    bei gleicher Stellung das längere (genauere)."""

    def __init__(self, terms: list[tuple[str, str]], products: list[tuple[str, str, str]], language: str = "de") -> None:
        self.language = _lang(language)
        self.order = CATEGORY_IDS
        self.terms = terms
        # Produktname → (Anzeigename, Standard-Einheit, Kategorie)
        self.products = products
        self._product_by_key = {normalize(p[0]): p for p in products}
        self._unit_terms = sorted(
            ((normalize(p[0]), p[1]) for p in products if p[1]), key=lambda kv: len(kv[0]), reverse=True
        )
        self._cache: dict[str, str] = {}

    # Abwärtskompatibel (frühere Aufrufer erwarteten diese Attribute)
    @property
    def display(self) -> dict[str, str]:
        return {cid: self.label(cid) for cid in CATEGORY_IDS}

    def guess(self, name: str) -> str:
        """Kategorie laut Packs, sonst "sonstiges"."""
        return self.guess_or_none(name) or FALLBACK_ID

    def guess_or_none(self, name: str) -> str | None:
        key = normalize(name)
        if key in self._cache:
            return self._cache[key] or None
        hit = self.match(key)
        result = hit[0] if hit else ""
        if len(self._cache) > 5000:
            self._cache.clear()
        self._cache[key] = result
        return result or None

    def candidates(self, key: str) -> list[tuple[str, str, int]]:
        """Stichwörter der Wörterlisten, die im Namen vorkommen (für best_match, Vorrang 0)."""
        spaced = key.replace("-", " ")  # "washing-up liquid" wie "washing up liquid"
        return [(term, category_id, 0) for term, category_id in self.terms if term in key or term in spaced]

    def match(self, key: str) -> tuple[str, str] | None:
        """(Kategorie, Stichwort) laut Wörterlisten. Mehrteilige Stichwörter gelten auch mit Bindestrich geschrieben."""
        spaced = key.replace("-", " ")
        found = best_match(self.candidates(key), key)
        if spaced != key:
            other = best_match([c for c in self.candidates(key) if " " in c[0]], spaced)
            if other and (found is None or len(other[1]) > len(found[1])):
                found = other
        return found

    def default_unit(self, name: str) -> str | None:
        """Übliche Einheit, z.B. "kg" für Äpfel, "Fl" für Wasser."""
        key = normalize(name)
        if key in self._product_by_key:
            return self._product_by_key[key][1] or None
        # Nur wenn ein Wort im Namen im Wesentlichen das Produkt ist ("Bio Bananen" → Banane),
        # nicht bei bloßem Teilwort ("Milchreis" enthält "Milch", ist aber keine Flüssigkeit).
        words = key.split()
        for term, unit in self._unit_terms:
            if " " in term:
                if term in key:
                    return unit
                continue
            for word in words:
                if word.startswith(term) and len(term) >= 0.7 * len(word):
                    return unit
        return None

    def valid(self, category_id: str | None) -> bool:
        return category_id in CATEGORY_IDS

    def label(self, category_id: str, language: str | None = None) -> str:
        lang = _lang(language) if language else self.language
        for cid, emoji, names in CATEGORY_DEFS:
            if cid == category_id:
                return f"{emoji} {names.get(lang) or names['en']}"
        return category_id

    def rank(self, category_id: str) -> int:
        try:
            return CATEGORY_IDS.index(category_id)
        except ValueError:
            return len(CATEGORY_IDS)

    def as_list(self, language: str | None = None) -> list[dict[str, str]]:
        return [{"id": cid, "label": self.label(cid, language)} for cid in CATEGORY_IDS]


def build_index(packs: list[dict[str, Any]], language: str) -> CategoryIndex:
    """Mehrere Packs zusammenführen. Bei gleichem Stichwort gewinnt das zuerst aktivierte Pack."""
    terms: dict[str, str] = {}
    products: dict[str, tuple[str, str, str]] = {}
    for pack in packs:
        for term, cid in pack.get("terms", {}).items():
            terms.setdefault(normalize(term), cid)
        for name, unit, cid in pack.get("products", []):
            products.setdefault(normalize(name), (name, unit or "", cid))
    ordered = sorted(terms.items(), key=lambda kv: len(kv[0]), reverse=True)
    return CategoryIndex(ordered, list(products.values()), language)


def normalize_pack(raw: Any, fallback_name: str = "Eigenes Pack") -> dict[str, Any]:
    """Pack prüfen und ins einheitliche Format bringen. Wirft ValueError mit verständlicher Meldung."""
    if not isinstance(raw, dict):
        raise ValueError("Pack muss ein JSON-Objekt sein")
    terms: dict[str, str] = {}
    products: list[list[str]] = []
    skipped = 0
    if isinstance(raw.get("items"), list):  # Format der App (category_pack_v2.json)
        for item in raw["items"]:
            cid = _APP_CATEGORY.get(str(item.get("category", "")))
            if cid is None:
                skipped += 1
                continue
            for term in [item.get("keyword"), *(item.get("aliases") or [])]:
                if term and isinstance(term, str):
                    terms[normalize(term)] = cid
            if item.get("displayName"):
                products.append([str(item["displayName"]), str(item.get("defaultUnit") or ""), cid])
    else:
        if not isinstance(raw.get("terms"), dict):
            raise ValueError("Pack braucht \"terms\": {\"stichwort\": \"kategorie_id\", …}")
        for term, cat in raw["terms"].items():
            cid = _APP_CATEGORY.get(str(cat))
            if cid is None or not str(term).strip():
                skipped += 1
                continue
            terms[normalize(str(term))] = cid
        for p in raw.get("products") or []:
            if isinstance(p, (list, tuple)) and len(p) >= 3 and _APP_CATEGORY.get(str(p[2])):
                products.append([str(p[0]), str(p[1] or ""), _APP_CATEGORY[str(p[2])]])
    if not terms:
        raise ValueError("Pack enthält keine gültigen Stichwörter (Kategorie-IDs: " + ", ".join(CATEGORY_IDS) + ")")
    if len(terms) > MAX_TERMS:
        raise ValueError(f"Pack hat mehr als {MAX_TERMS} Stichwörter")
    return {
        "name": str(raw.get("name") or raw.get("sourceNote") or fallback_name)[:60],
        "language": _lang(raw.get("language")) if raw.get("language") else "",
        "version": raw.get("version", 1),
        "terms": terms,
        "products": products,
        "skipped": skipped,
    }


def load_builtin_packs() -> dict[str, dict[str, Any]]:
    """Eingebaute Packs aus packs/<id>.json (Datei-Zugriff → im Executor aufrufen)."""
    out = {}
    for path in sorted(PACKS_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        pack = normalize_pack(raw, path.stem)
        pack["builtin"] = True
        out[path.stem] = pack
    return out


async def async_get_categories(hass: HomeAssistant) -> CategoryIndex:
    """Aktueller Index (aus den aktiven Packs, siehe packs.py)."""
    from .packs import async_get_packs

    return (await async_get_packs(hass)).index
