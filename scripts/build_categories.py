"""Erzeugt custom_components/smartlists/packs/de.json (eingebautes deutsches Keyword-Pack) aus dem Paket der App.

Damit App und Integration dieselben Stichwörter nutzen. Aufruf im Repo-Ordner:
    python scripts/build_categories.py [Pfad/zu/category_pack_v2.json]
Ohne Pfad wird das App-Projekt im Nachbarordner gesucht (../shopping_manager_app).

Format der Ausgabe:
  categories: [{id, emoji, name}]          Reihenfolge = Sortierung in der Karte
  terms:      {stichwort: category_id}     für die Erkennung (längster Treffer gewinnt)
  products:   [[anzeigename, einheit, category_id]]   für Autovervollständigung + Standard-Einheit
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

CATEGORIES = [
    ("obst_gemuese", "🥬", "Obst & Gemüse", "🥬 Obst & Gemüse"),
    ("fleisch", "🥩", "Fleisch- & Fischtheke", "🥩 Fleisch"),
    ("kuehlung", "🥛", "Kühlung", "🥛 Kühlung"),
    ("grundnahrung", "🥫", "Konserven & Trockensortiment", "🥫 Konserven"),
    ("backwaren", "🍞", "Brot & Backwaren", "🍞 Backwaren"),
    ("getraenke", "🥤", "Getränke", "🥤 Getränke"),
    ("suessigkeiten", "🍫", "Süßwaren & Snacks", "🍫 Süßigkeiten"),
    ("haushalt", "🧹", "Haushalt", "🧹 Haushalt"),
    ("drogerie", "🧴", "Drogerie", "🧴 Drogerie"),
    ("tiefkuehl", "❄️", "Tiefkühl", "❄️ Tiefkühl"),
    ("tierbedarf", "🐕", "Tierbedarf", "🐕 Tierbedarf"),
    ("sonstiges", "📦", "Sonstiges", "📦 Sonstiges"),
]
# Einheiten der App ("Packung", "Flasche") → kurze Schreibweise für die Karte
UNIT_SHORT = {"Packung": "Pck", "Flasche": "Fl", "Stück": "Stk", "L": "l", "Becher": "Becher", "Dose": "Dose"}


def main(src: Path, dst: Path) -> None:
    pack = json.loads(src.read_text(encoding="utf-8"))
    # Das Paket nennt Kategorien je nach Version per Anzeigename ("🥩 Fleisch") oder per ID ("fleisch");
    # "konserven" heißt in der Integration "grundnahrung".
    by_label = {label: cid for cid, _, _, label in CATEGORIES}
    by_label.update({cid: cid for cid, *_ in CATEGORIES})
    by_label["konserven"] = "grundnahrung"
    terms: dict[str, str] = {}
    products: list[list[str]] = []
    unknown: set[str] = set()
    for item in pack["items"]:
        cid = by_label.get(item["category"])
        if cid is None:
            unknown.add(item["category"])
            continue
        for term in [item["keyword"], *item.get("aliases", [])]:
            terms[term.strip().lower()] = cid  # wie in der App: letzter Eintrag gewinnt
        unit = item.get("defaultUnit") or ""
        products.append([item["displayName"], UNIT_SHORT.get(unit, unit), cid])
    # Anzeigename immer auch als Stichwort – im Paket fehlt er teils (z.B. Stichwort
    # "milchpulver haushalt" statt "milchpulver"). Vorhandene Zuordnungen bleiben unverändert.
    for name, _unit, cid in products:
        terms.setdefault(name.strip().lower(), cid)
    if unknown:
        sys.exit(f"Unbekannte Kategorien im Paket: {sorted(unknown)}")
    out = {
        "name": "Deutsch – HA SmartLists App",
        "language": "de",
        "version": pack.get("version", 2),
        "source": f"HA SmartLists Category Pack v{pack.get('version', '?')}",
        "terms": dict(sorted(terms.items())),
        "products": sorted(products, key=lambda p: p[0].casefold()),
    }
    dst.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{dst}: {len(terms)} Stichwörter, {len(products)} Produkte")


if __name__ == "__main__":
    here = Path(__file__).resolve().parent.parent
    source = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else here.parent / "shopping_manager_app/app/src/main/assets/category_pack_v2.json"
    )
    if not source.exists():
        sys.exit(f"Kategorie-Paket nicht gefunden: {source}\nPfad als Argument angeben.")
    main(source, here / "custom_components/smartlists/packs/de.json")
