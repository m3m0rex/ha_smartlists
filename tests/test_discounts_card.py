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


def test_discounts_card_texts_complete():
    """Alle sechs Sprachen haben dieselben Texte (sonst steht in der Karte „undefined“)."""
    import re

    src = CARD.read_text(encoding="utf-8")
    block = src[src.index("const TEXTS = {"):src.index("const DEFAULTS")]
    langs = {}
    for m in re.finditer(r"^  (\w\w): \{(.*?)\n(?=  \w\w: \{|\};)", block, re.M | re.S):
        langs[m.group(1)] = set(re.findall(r'(?:^|[ ,{])(\w+): "', m.group(2)))
    assert set(langs) == {"de", "en", "fr", "es", "it", "pl"}
    for lang, keys in langs.items():
        assert keys == langs["de"], (lang, keys ^ langs["de"])
    assert {"tab_watch", "w_add", "n_title", "e_notify"} <= langs["de"]


DUP_SCRIPT = """
globalThis.window = globalThis; globalThis.HTMLElement = class {}; globalThis.customElements = { get() {}, define() {} };
globalThis.document = {}; console.info = () => {};
require(process.argv[2]);
const row = (t, p, extra) => Object.assign({ title: t, price: p, end_date: "2999-01-01" }, extra || {});
const st = (id, name, rows) => ({ entity_id: id, state: String(rows.length), last_updated: "x", attributes: { friendly_name: name, discounts: rows } });
const hass = { states: {
  "sensor.rewe_1": st("sensor.rewe_1", "REWE 1", [row("Bio Bananen", "1,79 €"), row("Broccoli", "0,99 €", { price_per_unit: "1 kg = 1,98 €" })]),
  "sensor.rewe_2": st("sensor.rewe_2", "REWE 2", [row("Bio Bananen", "1,79 €", { image_url: "http://x/b.png" }), row("Broccoli", "0,89 €")]),
} };
console.log(JSON.stringify(window.SmartDiscounts.offers(hass).map((o) => [o.store, o.name, o.price, o.image || ""])));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js nicht installiert")
def test_discounts_card_same_offer_from_two_sensors_once(tmp_path):
    """Dasselbe Angebot (Markt, Name, Preis, Datum) aus zwei Sensoren erscheint einmal – ein anderer Preis bleibt eigenes Angebot."""
    script = tmp_path / "d.cjs"
    script.write_text(DUP_SCRIPT, encoding="utf-8")
    out = json.loads(subprocess.run(["node", str(script), str(CARD)], capture_output=True, text=True, check=True).stdout)
    assert out == [["REWE", "Bio Bananen", 1.79, "http://x/b.png"], ["REWE", "Broccoli", 0.99, ""], ["REWE", "Broccoli", 0.89, ""]]
