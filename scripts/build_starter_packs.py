"""Erzeugt die Start-Packs packs/<sprache>.json aus kompakten Wortlisten (scripts/packsrc/<sprache>.py).

Format der Quellen: P = {"kategorie_id": "grundform|variante|variante;nächster eintrag;…"}.
Die erste Form jedes Eintrags wird auch als Produkt für Vorschläge verwendet.
"""

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(__file__).resolve().parent / "packsrc"
OUT = ROOT / "custom_components/smartlists/packs"
VALID = {"obst_gemuese", "fleisch", "kuehlung", "grundnahrung", "backwaren", "getraenke", "suessigkeiten",
         "haushalt", "drogerie", "tiefkuehl", "tierbedarf", "sonstiges"}

for src in sorted(SRC.glob("*.py")):
    spec = importlib.util.spec_from_file_location(src.stem, src)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    terms, products = {}, []
    for cid, text in mod.P.items():
        assert cid in VALID, (src.stem, cid)
        for entry in text.split(";"):
            forms = [f.strip() for f in entry.split("|") if f.strip()]
            if not forms:
                continue
            for f in forms:
                terms.setdefault(f.lower(), cid)
            products.append([forms[0][:1].upper() + forms[0][1:], "", cid])
    pack = {"name": mod.NAME, "language": src.stem, "version": 1, "terms": dict(sorted(terms.items())), "products": products}
    (OUT / f"{src.stem}.json").write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{src.stem}: {len(terms)} Stichwörter, {len(products)} Produkte")
