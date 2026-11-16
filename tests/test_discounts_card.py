"""SmartDiscounts-Karte: Erkennung von Preisen, Grundpreisen und Treffern (reine Funktionen, mit Node geprüft)."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

CARD = Path(__file__).resolve().parent.parent / "custom_components" / "smartlists" / "www" / "smartdiscounts-card.js"

SCRIPT = """
globalThis.window = globalThis; globalThis.HTMLElement = class {}; globalThis.customElements = { get() {}, define() {} };
globalThis.document = {}; console.info = () => {};
require(process.argv[2]);
const S = window.SmartDiscounts;
console.log(JSON.stringify({
  num: ["11,49 €", "1.11 €", "€ 10.98", 5.49, "gratis"].map(S.num),
  unit: ["je 250-g-Pckg. (1 kg = 5,16 €)", "1\\u00a0kg\\u00a0= ab €\\u00a03.85", "1 kg = 5.97/5.11", "je 1000-g-Btl."].map(S.unitPrice),
  names: ["Butter 2 @REWE", "Milch 2x 1l #bio", "Pils 1 Kasten", "Kartoffeln 2,5kg *Anna"].map(S.itemName),
  word: [["Butter", "Landliebe Butter"], ["Butter", "Butterkeks"], ["Kaffee", "Melitta Filterkaffee"], ["Bananen", "Banane Chiquita"], ["Pizza", "Steinofen Pizza Speciale"]].map(([a, b]) => S.matches(a, b, "word")),
  exact: S.matches("Kaffee", "Melitta Filterkaffee", "exact"), part: S.matches("Butter", "Butterkeks", "part"),
}));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js nicht installiert")
def test_discounts_card_parsing(tmp_path):
    script = tmp_path / "t.cjs"
    script.write_text(SCRIPT, encoding="utf-8")
    out = json.loads(subprocess.run(["node", str(script), str(CARD)], capture_output=True, text=True, check=True).stdout)
    assert out["num"] == [11.49, 1.11, 10.98, 5.49, None]
    assert out["unit"] == [{"value": 5.16, "unit": "kg"}, {"value": 3.85, "unit": "kg"}, {"value": 5.97, "unit": "kg"}, None]
    assert out["names"] == ["Butter", "Milch", "Pils", "Kartoffeln"]
    assert out["word"] == [True, False, True, True, True]
    assert out["exact"] is False and out["part"] is True


def test_discounts_card_version_matches_manifest():
    import re

    manifest = json.loads((CARD.parent.parent / "manifest.json").read_text(encoding="utf-8"))["version"]
    assert re.search(r'const VERSION = "([^"]+)"', CARD.read_text(encoding="utf-8")).group(1) == manifest
