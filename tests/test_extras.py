import asyncio
import time
import types

from smartlists.extras import Extras, scale_quantity, split_price
from smartlists.shares import Shares, _hash


def _extras():
    e = Extras(types.SimpleNamespace(data={}))
    asyncio.run(e.async_load())
    return e


def test_split_price():
    assert split_price("Milch 2 l 1,19€") == ("Milch 2 l", 1.19)
    assert split_price("Butter 1.79 €") == ("Butter", 1.79)
    assert split_price("Kaffee €6,49") == ("Kaffee", 6.49)
    assert split_price("Kaffee 500 g") == ("Kaffee 500 g", None)
    assert split_price("Euro-Paletten") == ("Euro-Paletten", None)


def test_scale_quantity():
    assert scale_quantity("Mehl 250 g", 2) == "Mehl 500 g"
    assert scale_quantity("Eier 3", 2) == "Eier 6"
    assert scale_quantity("Salz", 2) == "Salz"


def test_prices_and_expenses():
    e = _extras()
    e.set_price("Milch", 1.19, "REWE")
    entry = e.book("Milch", 2, "REWE", "u1", "todo.einkauf")
    assert entry["amount"] == 2.38 and entry["store"] == "rewe"
    e.book("Butter", 1, "Lidl", "u1", "todo.einkauf", price=1.79)  # Angebot → merkt Preis
    assert e.price_for("butter")["price"] == 1.79
    assert e.book("Unbekannt", 1, None, None, "todo.x") is None  # ohne Preis keine Buchung
    rep = e.expense_report("month")
    assert rep["rows"][-1]["total"] == 4.17 and rep["rows"][-1]["stores"] == {"rewe": 2.38, "lidl": 1.79}
    assert e.month_total() == 4.17
    e.unbook("Butter", "todo.einkauf")
    assert e.month_total() == 2.38


def test_store_order_and_templates():
    e = _extras()
    order = e.set_store_order("@REWE", ["backwaren", "obst_gemuese", "quatsch"])["rewe"]
    assert order[:2] == ["backwaren", "obst_gemuese"] and len(order) == 12
    e.set_store_order("rewe", ["kuehlung"], zone="zone.rewe_nord")
    assert "rewe@zone.rewe_nord" in e.store_order
    e.set_store_order("rewe", None)
    assert "rewe" not in e.store_order
    tid = e.save_template(None, "Pfannkuchen", ["Mehl 250 g", "Milch 0,5 l", "Eier 3", " "], "🥞", 4)
    assert e.templates[tid]["items"] == ["Mehl 250 g", "Milch 0,5 l", "Eier 3"]
    assert e.find_template("pfannkuchen") == tid and e.find_template("Grillabend") is None


def test_share_links_secure():
    s = Shares(types.SimpleNamespace(data={}))
    asyncio.run(s.async_load())
    link = s.create("todo.einkauf", "u1")
    token = link["token"]
    assert len(token) >= 43 and link["check"] == "off" and not link["add"]  # Standard: nur ansehen
    assert token not in str(s.links) and _hash(token) in s.links  # nur der Hash wird gespeichert
    assert s.resolve(token)[1]["entity_id"] == "todo.einkauf"
    assert s.resolve(token[:-1] + ("A" if token[-1] != "A" else "B")) is None
    assert s.resolve("") is None and s.resolve("x" * 500) is None
    s.links[_hash(token)]["expires"] = time.time() - 1
    assert s.resolve(token) is None  # abgelaufen
    soft = s.create("todo.einkauf", "u1", check="soft", hours=2)
    assert s.revoke(soft["id"], "todo.anders") is False and s.revoke(soft["id"], "todo.einkauf") is True
    assert s.resolve(soft["token"]) is None
