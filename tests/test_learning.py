import asyncio
import time

from smartlists.categories import _load
from smartlists.learning import Learning

DAY = 86400


class _Hass:
    data = {}


def _learning() -> Learning:
    learning = Learning(_Hass(), _load())
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
