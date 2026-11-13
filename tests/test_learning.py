import asyncio
import time

from smartlists.categories import build_index, load_builtin_packs
from smartlists.learning import Learning

DAY = 86400


class _Hass:
    data = {}


def _learning() -> Learning:
    learning = Learning(_Hass(), build_index([load_builtin_packs()["de"]], "de"))
    asyncio.run(learning.async_load())
    return learning


def _history(learning, name, ago_days):
    now = time.time()
    learning.history[name.lower()] = {"name": name, "count": len(ago_days), "last": int(now - ago_days[-1] * DAY),
                                      "times": [int(now - d * DAY) for d in ago_days]}


def test_category_order_manual_learned_pack():
    learning = _learning()
    assert learning.resolve("Süßkartoffel") == ("obst_gemuese", "pack")  # ß bleibt erhalten
    learning.set_category("Hafermilch", "getraenke")
    assert learning.resolve("Hafermilch") == ("getraenke", "manual")
    assert learning.resolve("Hafermilch Barista") == ("getraenke", "learned")
    assert learning.resolve("xyzzy") == ("sonstiges", "fallback")


def test_rhythm_and_due():
    learning = _learning()
    _history(learning, "Milch", [17, 13, 9, 5])
    _history(learning, "Brot", [16, 9, 2])
    _history(learning, "Senf", [30, 1])
    assert learning.rhythm("Milch")["every_days"] == 4.0
    assert [d["name"] for d in learning.due_items()] == ["Milch"]
    assert learning.due_items(["Milch 2 l @REWE"]) == []
    assert learning.rhythm("Senf") is None


def test_export_import_roundtrip():
    a = _learning()
    a.set_category("Hafermilch", "kuehlung")
    data = a.export()
    assert "users" not in data
    b = _learning()
    b.import_data(data)
    assert b.resolve("Hafermilch") == ("kuehlung", "manual")
    try:
        b.import_data({"nope": 1})
    except ValueError:
        pass
    else:
        raise AssertionError("invalid export accepted")


def test_appearance_and_store_overrides():
    from smartlists import itemtext
    from smartlists.learning import validate_appearance

    look = validate_appearance({
        "kinds": {"person": {"style": "outline", "color": "#AA00FF", "icon": "🙂"}, "bogus": {"style": "x"}, "tag": {"style": "nope"}},
        "values": {"store:REWE": {"color": "#112233", "label": "Rewe City"}, "tag:bio": {"color": "red"}, "tag:vegan": {"text": "#FFFFFF", "color": "#2E7D32"}, "x:y": {"color": "#000000"}},
    })
    assert look == {"kinds": {"person": {"style": "outline", "color": "#aa00ff", "icon": "🙂"}},
                    "values": {"store:rewe": {"color": "#112233", "label": "Rewe City"},
                               "tag:vegan": {"color": "#2e7d32", "text": "#ffffff"}}}
    learning = _learning()
    learning.set_appearance(look)
    assert itemtext.store_display("rewe") == ("Rewe City", "#112233")
    assert itemtext.store_display("lidl") == ("LIDL", "#FF6F00")  # unverändert
    assert any(s["value"] == "Rewe City" and s["color"] == "#112233" for s in learning.config()["known_stores"])
    learning.set_appearance({})
    assert itemtext.store_display("rewe")[0] == "REWE"


def test_store_zones_multiple_and_legacy():
    learning = _learning()
    learning.automation["store_zones"] = {"rewe": "zone.rewe_alt"}  # Format von 2.4.0
    assert learning.store_zones == {"rewe": ["zone.rewe_alt"]}
    learning.set_store_zone("@REWE", "zone.rewe_nord", add=True)
    assert learning.store_zones["rewe"] == ["zone.rewe_alt", "zone.rewe_nord"]
    learning.set_store_zone("rewe", zones=["zone.rewe_nord"])
    assert learning.store_zones["rewe"] == ["zone.rewe_nord"]
    learning.set_automation({"voice_default_list": "todo.x"})  # darf Zonen nicht löschen
    assert learning.store_zones["rewe"] == ["zone.rewe_nord"]
    learning.set_store_zone("rewe", None)
    assert "rewe" not in learning.store_zones


def test_reset_settings_and_data():
    learning = _learning()
    learning.set_category("Hafermilch", "getraenke")
    _history(learning, "Milch", [1, 8])
    learning.automation["setup_done"] = True
    learning.automation["voice"] = True
    learning.reset(settings=True, data=False)
    assert learning.resolve("Hafermilch")[1] == "manual" and "milch" in learning.history
    assert learning.config()["setup_needed"]  # nach dem Zurücksetzen erscheint der Assistent wieder
    assert set(learning.automation) == {"setup_pending"}
    learning.reset(settings=False, data=True)
    assert learning.resolve("Hafermilch")[1] != "manual" and not learning.history
    assert learning.config()["setup_needed"]  # alles leer → Assistent erscheint wieder von selbst
