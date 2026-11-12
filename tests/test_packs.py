import pytest

from smartlists.categories import CATEGORY_IDS, build_index, load_builtin_packs, normalize_pack


def test_builtin_packs_valid():
    packs = load_builtin_packs()
    assert {"de", "en", "fr", "es", "it", "pl"} <= set(packs)
    assert len(packs["de"]["terms"]) > 6000
    for pid, pack in packs.items():
        assert len(pack["terms"]) >= 300, pid
        assert set(pack["terms"].values()) <= set(CATEGORY_IDS), pid


def test_starter_packs_guess():
    packs = load_builtin_packs()
    assert build_index([packs["en"]], "en").guess("2 Bananas") == "obst_gemuese"
    assert build_index([packs["fr"]], "fr").guess("Papier toilette") == "haushalt"
    assert build_index([packs["es"]], "es").guess("Leche de avena") == "kuehlung"
    assert build_index([packs["it"]], "it").guess("Cibo per gatti") == "tierbedarf"
    assert build_index([packs["pl"]], "pl").guess("Masło") == "kuehlung"


def test_first_pack_wins_and_labels():
    own = normalize_pack({"name": "Mine", "terms": {"milk": "getraenke"}})
    index = build_index([own, load_builtin_packs()["en"]], "fr")
    assert index.guess("Oat milk") == "kuehlung"  # längerer Treffer "oat milk" gewinnt
    assert index.guess("Milk") == "getraenke"  # eigenes Pack vor eingebautem
    assert index.label("tiefkuehl") == "❄️ Surgelés"
    assert index.label("tiefkuehl", "pl") == "❄️ Mrożonki"


def test_normalize_pack_formats_and_errors():
    app = normalize_pack({"items": [{"keyword": "Apfel", "aliases": ["Äpfel"], "category": "🥬 Obst & Gemüse",
                                     "displayName": "Äpfel", "defaultUnit": "kg"}, {"keyword": "x", "category": "??"}]})
    assert app["terms"] == {"apfel": "obst_gemuese", "äpfel": "obst_gemuese"}
    assert app["products"] == [["Äpfel", "kg", "obst_gemuese"]] and app["skipped"] == 1
    with pytest.raises(ValueError):
        normalize_pack({"terms": {"a": "nope"}})
    with pytest.raises(ValueError):
        normalize_pack([1, 2])
