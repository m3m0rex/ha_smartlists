"""Eingebautes Kategorie-Paket (gleiches Stichwort-Paket wie die HA-SmartLists-App).

Wird mit scripts/build_categories.py aus dem App-Paket erzeugt. Hier nur die feste Erkennung;
gelernte und manuelle Zuordnungen kommen aus learning.py und haben Vorrang.
"""

from __future__ import annotations

import json
from pathlib import Path

from homeassistant.core import HomeAssistant

from .const import DOMAIN

_FILE = Path(__file__).parent / "categories.json"
FALLBACK_ID = "sonstiges"


def normalize(name: str) -> str:
    """Schlüssel für Vergleiche. Bewusst lower() statt casefold(): casefold macht aus "ß" "ss",
    die Stichwörter im Paket sind aber mit "ß" geschrieben (z.B. "süßkartoffel")."""
    return " ".join(name.strip().lower().split())


class CategoryIndex:
    """Stichwort → Kategorie, längste Stichwörter zuerst (genauere Treffer gewinnen)."""

    def __init__(
        self,
        categories: list[dict[str, str]],
        terms: list[tuple[str, str]],
        products: list[tuple[str, str, str]],
    ) -> None:
        self.categories = categories
        self.order = [c["id"] for c in categories]
        self.display = {c["id"]: f'{c["emoji"]} {c["name"]}' for c in categories}
        self.terms = terms
        # Produktname → (Anzeigename, Standard-Einheit, Kategorie)
        self.products = products
        self._product_by_key = {normalize(p[0]): p for p in products}
        self._unit_terms = sorted(
            ((normalize(p[0]), p[1]) for p in products if p[1]), key=lambda kv: len(kv[0]), reverse=True
        )
        self._cache: dict[str, str] = {}

    def guess(self, name: str) -> str:
        """Kategorie laut Paket, sonst "sonstiges"."""
        return self.guess_or_none(name) or FALLBACK_ID

    def guess_or_none(self, name: str) -> str | None:
        key = normalize(name)
        if key in self._cache:
            return self._cache[key] or None
        result = ""
        for term, category_id in self.terms:
            if term in key:
                result = category_id
                break
        if len(self._cache) > 5000:
            self._cache.clear()
        self._cache[key] = result
        return result or None

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
        return category_id in self.display

    def label(self, category_id: str) -> str:
        return self.display.get(category_id, category_id)

    def rank(self, category_id: str) -> int:
        try:
            return self.order.index(category_id)
        except ValueError:
            return len(self.order)

    def as_list(self) -> list[dict[str, str]]:
        return [{"id": c["id"], "label": self.display[c["id"]]} for c in self.categories]


def _load() -> CategoryIndex:
    raw = json.loads(_FILE.read_text(encoding="utf-8"))
    terms = sorted(((normalize(k), v) for k, v in raw["terms"].items()), key=lambda kv: len(kv[0]), reverse=True)
    products = [tuple(p) for p in raw.get("products", [])]
    return CategoryIndex(categories=raw["categories"], terms=terms, products=products)  # type: ignore[arg-type]


async def async_get_categories(hass: HomeAssistant) -> CategoryIndex:
    """Einmal pro HA-Start laden (Datei-Zugriff im Executor)."""
    data = hass.data.setdefault(DOMAIN, {})
    if "categories" not in data:
        data["categories"] = await hass.async_add_executor_job(_load)
    return data["categories"]
