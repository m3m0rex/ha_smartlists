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
    assert split_price("Milch 2 l 1,19€ @rewe") == ("Milch 2 l @rewe", 1.19)
    assert split_price("Milch 1,19 € @REWE *Anna") == ("Milch @REWE *Anna", 1.19)
    assert split_price("Käse 2,49 EUR") == ("Käse", 2.49)
    assert split_price("Cola - 1,5 €") == ("Cola", 1.5)
    assert split_price("Cola 1,5€uro") == ("Cola 1,5€uro", None)


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


def test_delete_expense_and_trip():
    e = _extras()
    e.set_price("Milch", 1.0)
    a = e.book("Milch", 1, None, "u1", "todo.x")
    b = e.book("Milch", 2, None, "u2", "todo.x")
    assert e.delete_expense(b["id"], user_id="u1") is False  # fremde Buchung
    assert e.delete_expense(b["id"]) is True and e.month_total() == 1.0
    e.expenses.append({"t": 1, "name": "Alt", "amount": 5, "store": None, "user": None, "list": "todo.x"})  # vor 2.9.0
    assert e.delete_expense("1:Alt") is True
    e.mark_checked("todo.x", "uid1", True)
    assert "uid1" in e.checked_at["todo.x"]
    start = e.finish_trip("todo.x")
    assert e.trips["todo.x"] == start and "todo.x" not in e.checked_at
    assert a["id"]


def test_barcode_parsers():
    from smartlists.barcode import _parse, _path

    off = {"product": {"product_name": "Oat Drink", "product_name_de": "Haferdrink", "brands": "Oatly, X", "quantity": "1 l"}}
    assert _parse("off", off, "de") == {"name": "Haferdrink", "brand": "Oatly", "quantity": "1 l"}
    assert _parse("off", {"status": 0}, "de") is None
    upc = {"items": [{"title": "Nutella 450g", "brand": "Ferrero"}]}
    assert _parse("upcitemdb", upc, "de")["name"] == "Nutella 450g"
    assert _parse("custom", {"data": {"items": [{"label": "Seife"}]}}, "de", "data.items.0.label")["name"] == "Seife"
    assert _path({"a": [1]}, "a.5") is None


def test_reset_parts():
    e = _extras()
    e.set_price("Milch", 1.19, "REWE")
    e.set_store_order("rewe", ["backwaren"])
    e.save_template(None, "Pfannkuchen", ["Mehl 250 g"], "🥞", 4)
    e.reset(settings=True, data=False)
    assert not e.store_order and e.price_for("milch") and e.templates
    e.reset(settings=False, data=True)
    assert not e.templates and not e.price_for("milch")
    s = Shares(types.SimpleNamespace(data={}))
    asyncio.run(s.async_load())
    token = s.create("todo.einkauf", "u1")["token"]
    s.create("todo.anders", "u1")
    assert s.revoke_all() == 2 and s.resolve(token) is None


def test_list_settings_categories_and_suggest_scope():
    import types

    from smartlists.extras import Extras

    ex = Extras(types.SimpleNamespace(data={}))
    assert ex.set_list_settings("todo.a", categories=False, suggest_scope="all") == {"categories": False, "suggest_scope": "all"}
    assert ex.set_list_settings("todo.a", categories=True, suggest_scope="list") == {}
    assert "todo.a" not in ex.list_settings


def test_currency_of_the_household():
    """4.0: andere Währungen – Schreibweisen werden beim Eintippen erkannt, € bleibt Standard."""
    from smartlists.extras import split_price
    from smartlists.learning import ROW_ORDER, currency_symbols, validate_appearance

    assert split_price("Milch 2 l 1,19€ @REWE") == ("Milch 2 l @REWE", 1.19)
    chf = currency_symbols({"currency": "CHF"})
    assert split_price("Milch 2 l CHF 2.50", chf) == ("Milch 2 l", 2.5)
    assert split_price("Brot 3,20 Fr. @Migros", chf) == ("Brot @Migros", 3.2)
    assert split_price("Milch 1,19€", chf) == ("Milch 1,19€", None)  # € ist dann kein Preis mehr
    assert split_price("Tea £1.20", currency_symbols({"currency": "GBP"})) == ("Tea", 1.2)
    assert split_price("Mjölk 12 kr", currency_symbols({"currency": "SEK"})) == ("Mjölk", 12.0)
    assert currency_symbols({}) == ("€", "EUR") and currency_symbols({"currency": "XXX"}) == ("€", "EUR")
    # Aussehen: nur gültige Währung / Reihenfolge, Standard wird nicht gespeichert
    assert validate_appearance({"currency": "CHF", "order": ["price", "store", "bogus"]}) == {
        "kinds": {}, "values": {}, "currency": "CHF", "order": ["price", "store", "tag", "person", "note"]}
    assert validate_appearance({"currency": "EUR", "order": list(ROW_ORDER)}) == {"kinds": {}, "values": {}}
    assert validate_appearance({"currency": "DOGE", "order": "x"}) == {"kinds": {}, "values": {}}


def test_price_per_entry_and_price_history():
    """4.0: ein getippter Preis gehört zum Eintrag; jede Änderung landet im Preis-Verlauf."""
    import types

    from smartlists.extras import MAX_PRICE_LOG, Extras
    from smartlists.learning import validate_appearance

    ex = Extras(types.SimpleNamespace(data={}))
    ex.set_item_price("todo.a", "u1", 1.19)
    assert ex.item_price("todo.a", "u1") == 1.19 and ex.item_price("todo.a", "u2") is None and ex.item_price("todo.b", "u1") is None
    ex.set_item_price("todo.a", "u1", None)
    assert ex.item_price("todo.a", "u1") is None
    # Verlauf: gleicher Preis im selben Markt wird nicht doppelt geführt, neueste zuerst
    ex.set_price("Milch", 1.19, "rewe")
    ex.set_price("Milch", 1.19, "rewe")
    ex.set_price("Milch 2 l", 1.29, "aldi")
    ex.book("Milch", 2, "aldi", "u", "todo.a", price=1.09)
    assert [(e["price"], e["store"], e["source"]) for e in ex.price_history("Milch")] == [(1.09, "aldi", "paid"), (1.29, "aldi", "manual"), (1.19, "rewe", "manual")]
    for n in range(40):
        ex.set_price("Brot", 1 + n / 100)
    assert len(ex.price_history("Brot")) == MAX_PRICE_LOG and ex.price_history("Unbekannt") == []
    # Schalter des Haushalts: nur „aus“ wird gespeichert
    assert validate_appearance({"auto_price": False}) == {"kinds": {}, "values": {}, "auto_price": False}
    assert validate_appearance({"auto_price": True}) == {"kinds": {}, "values": {}}
