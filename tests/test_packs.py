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


def _packs():
    import asyncio

    from smartlists.packs import Packs

    class _Cfg:
        language = "de"

    class _H:
        config = _Cfg()
        data = {}

        async def async_add_executor_job(self, f, *a):
            return f(*a)

    p = Packs(_H())
    asyncio.run(p.async_load())
    return p


def test_pack_editor_custom_and_builtin_extension():
    p = _packs()
    assert p.active == ["de"]
    pid = p.create("Schwäbisch", "de")
    assert p.active[0] == pid
    p.update_terms(pid, {"Weckle": "backwaren", "Gsälz": "grundnahrung"})
    assert p.index.guess("4 Weckle") == "backwaren"
    p.update_terms(pid, {"weckle": None})
    assert p.terms(pid)["total"] == 1
    # eingebautes Pack erweitern → Ergänzungs-Pack direkt darüber
    r = p.update_terms("de", {"Hafermilch Barista": "getraenke"})
    assert r["edited"] == "custom_de_plus" and p.active.index("custom_de_plus") < p.active.index("de")
    assert p.index.guess("Hafermilch Barista") == "getraenke"
    hits = p.terms("de", "hafermilch barista")
    assert hits["terms"][0]["changed"] is True
    assert p.export("de")["terms"]["hafermilch barista"] == "getraenke"
    assert len(p.builtin["de"]["terms"]) > 6000 and "hafermilch barista" not in p.builtin["de"]["terms"]
