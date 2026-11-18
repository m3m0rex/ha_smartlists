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


def test_own_currency_symbol():
    """4.0: eigenes Symbol für Währungen, die nicht in der Liste stehen."""
    from smartlists.extras import split_price
    from smartlists.learning import currency_symbols, validate_appearance

    look = validate_appearance({"currency": "custom", "currency_symbol": " ₺ "})
    assert look == {"kinds": {}, "values": {}, "currency": "custom", "currency_symbol": "₺"}
    assert currency_symbols(look) == ("₺",)
    assert split_price("Ekmek 12,50 ₺", currency_symbols(look)) == ("Ekmek", 12.5)
    assert split_price("Susu Rp 15", currency_symbols({"currency": "custom", "currency_symbol": "Rp"})) == ("Susu", 15.0)
    # ungültig (Ziffern, Leerzeichen, Zeichen der Badges, zu lang) → bleibt beim Euro
    for bad in ("", "1", "a b", "@", "#x", "toolong7", None):
        assert validate_appearance({"currency": "custom", "currency_symbol": bad}) == {"kinds": {}, "values": {}}
    assert currency_symbols({"currency": "custom"}) == ("€", "EUR")


def test_watch_list_and_offer_matching():
    """4.0-beta.2: Merkliste des Haushalts und der Abgleich mit Angeboten (gleiche Regeln wie die Karte)."""
    import types

    from smartlists.extras import Extras
    from smartlists.offers import deals_for, matches, num

    ex = Extras(types.SimpleNamespace(data={}))
    ex.set_watch(["Kaffee", " kaffee ", "Nutella", ""], {"notify": True, "targets": [
        {"id": "x", "kind": "hass"}, {"id": "notify.mobile_app_x", "kind": "service"}, {"id": "notify.mobile_app_x", "kind": "service"},
        {"id": "light.turn_on", "kind": "service"}, {"id": "notify.tv", "kind": "entity"}, "kaputt"]})
    assert ex.watch == ["Kaffee", "Nutella"] and ex.watch_settings == {"notify": True, "targets": [
        {"id": "persistent_notification", "kind": "hass"}, {"id": "notify.mobile_app_x", "kind": "service"}, {"id": "notify.tv", "kind": "entity"}]}
    ex.mark_watch_seen(["a", "b"])
    assert ex.watch_seen == ["a", "b"]
    assert [num(x) for x in ("11,49 €", "1.11 €", "€ 10.98", 5.49, "gratis")] == [11.49, 1.11, 10.98, 5.49, None]
    assert matches("Kaffee", "Melitta Filterkaffee") and matches("Butter", "Landliebe Butter") and matches("Bananen", "Banane Chiquita")
    assert not matches("Butter", "Butterkeks") and not matches("", "x")
    offers = [{"name": "Melitta Filterkaffee", "price": 5.49, "until": None, "store": "EDEKA"}, {"name": "Dallmayr Prodomo Kaffee", "price": 4.99, "until": None, "store": "Lidl"},
              {"name": "Butterkeks", "price": 0.99, "until": None, "store": "REWE"}]
    assert [o["store"] for o in deals_for(offers, "Kaffee")] == ["Lidl", "EDEKA"] and deals_for(offers, "Butter") == []


def test_offers_from_own_sources():
    """Eigene Quellen mit Feld-Zuordnung (wie in der Karte) werden auch im Hintergrund gelesen."""
    import types

    from smartlists.offers import clean_sources, collect

    def st(entity_id, attrs):
        return types.SimpleNamespace(entity_id=entity_id, attributes=attrs)

    states = [st("sensor.rewe_1", {"friendly_name": "REWE", "discounts": [{"product": "Kaffee Gold", "price": "4,99 €", "valid_until": "2999-01-01"}, {"product": "Alt", "price": "1 €", "valid_until": "2000-01-01"}]}),
              st("sensor.mein_markt", {"results": [{"product": {"name": "Filterkaffee"}, "prices": {"current": 3.49}, "validity": {"to": "2999-02-02"}}]}),
              st("sensor.temperatur", {"unit": "°C"})]
    hass = types.SimpleNamespace(states=types.SimpleNamespace(async_all=lambda domain: states))
    src = clean_sources([{"entity": "sensor.mein_markt", "attribute": "results", "store": "Kaufland", "color": "#fff",
                          "map": {"name": "product.name", "price": "prices.current", "until": "validity.to", "image": "x", "bogus": "y"}},
                         {"entity": "light.x", "store": "nein"}, "kaputt", {"entity": "sensor.ohne_angaben"}])
    assert src == [{"entity": "sensor.mein_markt", "attribute": "results", "store": "Kaufland", "map": {"name": "product.name", "price": "prices.current", "until": "validity.to", "image": "x"}}]
    assert collect(hass) == [{"name": "Kaffee Gold", "price": 4.99, "until": "2999-01-01", "store": "REWE"}]
    assert collect(hass, src) == [{"name": "Kaffee Gold", "price": 4.99, "until": "2999-01-01", "store": "REWE"},
                                  {"name": "Filterkaffee", "price": 3.49, "until": "2999-02-02", "store": "Kaufland"}]


def test_offers_same_offer_from_two_sensors_once():
    """Dasselbe Angebot aus zwei Sensoren zählt in der Hintergrund-Prüfung einmal."""
    import types

    from smartlists.offers import collect

    def st(entity_id, name, rows):
        return types.SimpleNamespace(entity_id=entity_id, attributes={"friendly_name": name, "discounts": rows})

    row = {"title": "Bio Bananen", "price": "1,79 €", "end_date": "2999-01-01"}
    states = [st("sensor.rewe_1", "REWE 1", [row]), st("sensor.rewe_2", "REWE 2", [dict(row), {**row, "price": "1,59 €"}])]
    hass = types.SimpleNamespace(states=types.SimpleNamespace(async_all=lambda domain: states))
    assert [(o["store"], o["price"]) for o in collect(hass)] == [("REWE", 1.79), ("REWE", 1.59)]


def test_done_ops_repeat_is_not_executed_twice():
    """Die Karte wiederholt eine Änderung nach einem Verbindungsabbruch: ausgeführt wird sie nur einmal."""
    import asyncio

    from smartlists.doneops import DoneOps

    async def run():
        done, calls = DoneOps(limit=3), []

        async def add():
            calls.append(1)
            await asyncio.sleep(0)
            return {"uid": f"u{len(calls)}"}

        first = await done.run(("user", "op-1"), add)
        again = await done.run(("user", "op-1"), add)
        other_user = await done.run(("other", "op-1"), add)
        # zwei Karten senden dieselbe Änderung gleichzeitig: die zweite wartet auf die erste
        both = await asyncio.gather(done.run(("user", "op-2"), add), done.run(("user", "op-2"), add))

        async def boom():
            calls.append(1)
            raise ValueError("weg")

        for _ in range(2):  # ein Fehler wird nicht gemerkt – der nächste Versuch läuft wirklich
            try:
                await done.run(("user", "op-3"), boom)
            except ValueError:
                pass
        for i in range(10):
            await done.run(("user", f"x{i}"), add)
        return first, again, other_user, both, len(calls), len(done)

    first, again, other_user, both, calls, size = asyncio.run(run())
    assert first == again == {"uid": "u1"} and other_user == {"uid": "u2"}
    assert both[0] == both[1] == {"uid": "u3"}
    assert calls == 3 + 2 + 10 and size == 3


def test_barcode_lookup_is_off_unless_switched_on():
    """Nach außen geht nur etwas, wenn die Online-Suche ausdrücklich eingeschaltet ist."""
    import asyncio
    import types

    from smartlists import barcode
    from smartlists.const import DOMAIN

    asked = []

    def session(hass):
        asked.append(1)
        raise RuntimeError("kein Netz im Test")

    barcode.async_get_clientsession = session
    known = {"4000000000001": {"name": "Milch", "brand": "", "quantity": "1 l"}}

    def hass(settings):
        return types.SimpleNamespace(config=types.SimpleNamespace(language="de"), data={DOMAIN: {
            "extras": types.SimpleNamespace(barcodes=dict(known)), "learning": types.SimpleNamespace(automation=settings)}})

    for settings in ({}, {"barcode_lookup": False}, {"barcode_lookup": None}):
        assert asyncio.run(barcode.async_lookup(hass(settings), "4999999999999")) == {"code": "4999999999999", "found": False, "source": "off"}
    assert not asked
    # schon gelernte Codes gehen auch ohne Online-Suche
    assert asyncio.run(barcode.async_lookup(hass({}), "4000000000001"))["source"] == "memory" and not asked
    # eingeschaltet, aber kein Dienst gewählt: weiterhin nichts nach außen (nichts ist vorausgewählt)
    assert asyncio.run(barcode.async_lookup(hass({"barcode_lookup": True}), "4999999999999"))["source"] == "off" and not asked
    try:
        asyncio.run(barcode.async_lookup(hass({"barcode_lookup": True, "barcode_providers": ["off"]}), "4999999999999"))
    except RuntimeError:
        pass
    assert asked == [1]


def test_barcode_request_identifies_the_app_and_respects_429():
    """Open * Facts verlangen „AppName/Version (Kontakt)“ als User-Agent; nach „zu viele Anfragen“ macht der Dienst Pause."""
    import asyncio
    import types

    from smartlists import barcode
    from smartlists.const import DOMAIN

    calls = []

    class _Resp:
        def __init__(self, status, data):
            self.status, self._data = status, data

        async def json(self, content_type=None):
            return self._data

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

    class _Session:
        def get(self, url, headers=None, timeout=None):
            calls.append((url, headers))
            if "upcitemdb" in url:
                return _Resp(429, None)
            return _Resp(200, {"product": {"product_name": "Hafermilch", "brands": "Hofgut", "quantity": "1 l"}})

    barcode.async_get_clientsession = lambda hass: _Session()
    remembered = {}
    data = {"version": "4.0.0", "extras": types.SimpleNamespace(barcodes={}, remember_barcode=lambda c, i: remembered.update({c: i})),
            "learning": types.SimpleNamespace(automation={"barcode_lookup": True, "barcode_providers": ["upcitemdb", "off"]})}
    hass = types.SimpleNamespace(config=types.SimpleNamespace(language="de-DE"), data={DOMAIN: data})
    first = asyncio.run(barcode.async_lookup(hass, "4999999999999"))
    assert first["found"] and first["source"] == "off" and first["name"] == "Hafermilch" and "4999999999999" in remembered
    assert [h["User-Agent"] for _, h in calls] == ["SmartLists-HomeAssistant/4.0.0 (https://github.com/m3m0rex/ha_smartlists)"] * 2
    # kein Konto, keine E-Mail: nur der Code (und die Sprache für den Produktnamen) stehen in der Adresse
    assert "@" not in calls[1][0] + calls[1][1]["User-Agent"] and "product_name_de" in calls[1][0]
    # UPCitemdb hat 429 gemeldet → beim nächsten Code wird es übersprungen
    calls.clear()
    asyncio.run(barcode.async_lookup(hass, "4888888888888"))
    assert len(calls) == 1 and "openfoodfacts" in calls[0][0]


def test_watch_lists_are_per_user_and_there_can_be_several():
    import pytest

    from smartlists.extras import MAX_WATCH_LISTS, Extras

    ex = Extras(None)
    ex.set_watch(["Kaffee", "Nutella"], {"notify": True, "targets": [{"id": "persistent_notification", "kind": "hass"}]})
    # erster Zugriff: die frühere gemeinsame Merkliste als Kopie, samt Benachrichtigung
    anna = ex.watch_user("anna")
    assert [x["names"] for x in anna["lists"]] == [["Kaffee", "Nutella"]] and anna["notify"] is True and anna["lists"][0]["name"] == "Merkliste"
    ex.set_user_watch("anna", None, ["Kaffee", "Nutella", "Butter"])
    assert ex.watch_list("ben")["names"] == ["Kaffee", "Nutella"]            # Ben sieht Annas Änderung nicht
    assert ex.watch == ["Kaffee", "Nutella"]                                 # die alte Liste bleibt, wie sie war
    # mehrere Listen je Benutzer
    party = ex.add_watch_list("anna", "Party")
    ex.set_user_watch("anna", party, ["Chips", " chips ", "Cola"])
    assert ex.watch_list("anna", party)["names"] == ["Chips", "Cola"]
    assert ex.watch_list("anna")["names"] == ["Kaffee", "Nutella", "Butter"]  # ohne Angabe: die Standard-Liste
    assert ex.watch_list("anna", "gibtsnicht")["names"] == ["Kaffee", "Nutella", "Butter"]
    with pytest.raises(ValueError):
        ex.add_watch_list("anna", "party")                                   # gleicher Name
    ex.change_watch_list("anna", party, name="Feier", default=True)
    assert ex.watch_list("anna")["name"] == "Feier"
    first = anna["lists"][0]["id"]
    ex.change_watch_list("anna", party, delete=True)
    assert [x["id"] for x in anna["lists"]] == [first] and anna["default"] == first
    with pytest.raises(ValueError):
        ex.change_watch_list("anna", first, delete=True)                     # die letzte bleibt
    for i in range(MAX_WATCH_LISTS - 1):
        ex.add_watch_list("anna", f"Liste {i}")
    with pytest.raises(ValueError):
        ex.add_watch_list("anna", "eine zu viel")
    ex.mark_user_watch_seen("anna", ["a", "b"])
    assert anna["seen"] == ["a", "b"] and ex.watch_user("ben")["seen"] == []


def test_new_offers_for_a_watch_list_are_found_once():
    from smartlists.offers import _key, fresh_for

    offers = [{"name": "Jacobs Kaffee 500 g", "price": 4.99, "until": "2026-11-22", "store": "REWE"},
              {"name": "Butter", "price": 1.49, "until": None, "store": "ALDI"}]
    fresh = fresh_for(offers, ["Kaffee", "Milch"], [])
    assert [(t, o["store"]) for t, o in fresh] == [("Kaffee", "REWE")]
    assert fresh_for(offers, ["Kaffee"], [_key("Kaffee", offers[0])]) == []


def _watch_env(monkeypatch, files, listed):
    """Extras mit Speicherdateien im Arbeitsspeicher: files = {Schlüssel: Inhalt}, listed = Namen unter watch/."""
    from smartlists import extras as mod, storage

    class Store:
        def __init__(self, hass, version, key):
            self.key = key

        async def async_load(self):
            return files.get(self.key)

        async def async_save(self, data):
            files[self.key] = data

        def async_delay_save(self, func, delay):
            files[self.key] = func()

    async def job(func, *args):
        return func(*args)

    monkeypatch.setattr(mod, "Store", Store)
    monkeypatch.setattr(storage, "watch_files", lambda config_dir: list(listed))
    return types.SimpleNamespace(config=types.SimpleNamespace(config_dir="/config"), async_add_executor_job=job)


def test_watch_lists_move_into_one_file_per_user(monkeypatch):
    anna = {"lists": [{"id": "a1", "name": "Merkliste", "names": ["Kaffee"]}], "default": "a1", "notify": True, "targets": [], "seen": ["x"]}
    ben = {"lists": [{"id": "b1", "name": "Merkliste", "names": ["Butter"]}], "default": "b1", "notify": False, "targets": [], "seen": []}
    files = {"smartlists/extras": {"watch": ["Kaffee"], "watch_users": {"anna": anna, "ben": ben}}}
    ex = Extras(_watch_env(monkeypatch, files, []))
    asyncio.run(ex.async_load())
    # jeder Benutzer hat seine eigene Datei, in extras stehen sie nicht mehr
    assert files["smartlists/watch/anna"] == {"user": "anna", **anna} and files["smartlists/watch/ben"]["lists"][0]["names"] == ["Butter"]
    assert "watch_users" not in files["smartlists/extras"] and files["smartlists/extras"]["watch"] == ["Kaffee"]
    # eine Änderung landet nur in der Datei dieses Benutzers
    before = dict(files["smartlists/watch/ben"])
    ex.set_user_watch("anna", None, ["Kaffee", "Nutella"])
    assert files["smartlists/watch/anna"]["lists"][0]["names"] == ["Kaffee", "Nutella"] and files["smartlists/watch/ben"] == before
    # Neustart: geladen wird aus den Dateien; steht derselbe Benutzer noch in einer alten extras-Datei, gilt seine Datei
    files["smartlists/extras"]["watch_users"] = {"anna": {"lists": [{"id": "old", "name": "alt", "names": []}], "default": "old"}}
    again = Extras(_watch_env(monkeypatch, files, ["anna", "ben"]))
    asyncio.run(again.async_load())
    assert again.watch_list("anna")["names"] == ["Kaffee", "Nutella"] and again.watch_list("ben")["names"] == ["Butter"]
    assert again.watch_user("anna")["seen"] == ["x"]


def test_watch_lists_stay_in_extras_while_the_own_file_cannot_be_written(monkeypatch):
    from smartlists import extras as mod

    anna = {"lists": [{"id": "a1", "name": "Merkliste", "names": ["Kaffee"]}], "default": "a1"}
    files = {"smartlists/extras": {"watch_users": {"anna": anna}}}
    hass = _watch_env(monkeypatch, files, [])

    async def fail(self, data):
        raise OSError("voll")

    monkeypatch.setattr(mod.Store, "async_save", fail)
    ex = Extras(hass)
    asyncio.run(ex.async_load())
    assert files["smartlists/extras"]["watch_users"]["anna"]["lists"][0]["names"] == ["Kaffee"]   # nichts verloren
    assert ex.watch_list("anna")["names"] == ["Kaffee"]


def test_all_watch_lists_together():
    ex = Extras(None)
    first = ex.watch_user("anna")["default"]
    ex.set_user_watch("anna", first, ["Kaffee", "Butter"])
    party = ex.add_watch_list("anna", "Party")
    ex.set_user_watch("anna", party, ["Chips", "butter"])
    assert ex.watch_view("anna")[0] == first                                 # ohne Wunsch: die Standard-Liste
    assert ex.watch_view("anna", "all") == ("all", [
        {"name": "Kaffee", "list": first}, {"name": "Butter", "list": first}, {"name": "Chips", "list": party}])
    # Hinzufügen in der Gesamtansicht: in die Standard-Liste; was schon irgendwo steht, kommt nicht doppelt
    ex.change_all_watch("anna", ["Cola", "chips"])
    assert ex.watch_list("anna", first)["names"] == ["Kaffee", "Butter", "Cola"] and ex.watch_list("anna", party)["names"] == ["Chips", "butter"]
    # Entfernen in der Gesamtansicht: aus jeder Liste
    ex.change_all_watch("anna", [], "Butter")
    assert [x["name"] for x in ex.watch_view("anna", "all")[1]] == ["Kaffee", "Cola", "Chips"] and ex.watch_list("anna", party)["names"] == ["Chips"]
    # gemerkte Ansicht: ohne Angabe einer Liste kommen danach alle zusammen – eine genannte Liste geht weiter
    ex.set_user_watch("anna", None, None, {"show_all": True})
    assert ex.watch_view("anna")[0] == "all" and ex.watch_view("anna", party)[0] == party
    ex.set_user_watch("anna", None, None, {"show_all": False})
    assert ex.watch_view("anna")[0] == first
    # mit nur einer Liste gibt es nichts zusammenzufassen
    ex.set_user_watch("ben", None, None, {"show_all": True})
    assert ex.watch_view("ben")[0] == ex.watch_user("ben")["default"]


def test_own_barcode_service_can_get_its_own_user_agent():
    """Der eigene User-Agent gilt nur für den eigenen Dienst – die öffentlichen bekommen immer den von SmartLists."""
    from smartlists import barcode
    from smartlists.const import DOMAIN

    assert barcode.clean_agent("  Mein\r\nDienst/1.0 (ich@example.org) ä ") == "MeinDienst/1.0 (ich@example.org)"
    assert barcode.clean_agent(None) == "" and len(barcode.clean_agent("x" * 300)) == 120
    calls = []

    class _Resp:
        status = 200

        async def json(self, content_type=None):
            return {}

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

    class _Session:
        def get(self, url, headers=None, timeout=None):
            calls.append((url, headers["User-Agent"]))
            return _Resp()

    barcode.async_get_clientsession = lambda hass: _Session()
    settings = {"barcode_lookup": True, "barcode_providers": ["custom", "off"], "barcode_custom_url": "https://example.org/api/{code}",
                "barcode_custom_field": "name", "barcode_custom_agent": "MeinDienst/1.0"}
    data = {"version": "4.0.0", "extras": types.SimpleNamespace(barcodes={}, remember_barcode=lambda c, i: None),
            "learning": types.SimpleNamespace(automation=settings)}
    hass = types.SimpleNamespace(config=types.SimpleNamespace(language="de"), data={DOMAIN: data})
    asyncio.run(barcode.async_lookup(hass, "4777777777777"))
    assert calls[0] == ("https://example.org/api/4777777777777", "MeinDienst/1.0")
    assert calls[1][1].startswith("SmartLists-HomeAssistant/4.0.0")
    calls.clear()
    settings["barcode_custom_agent"] = ""
    asyncio.run(barcode.async_lookup(hass, "4777777777778"))
    assert calls[0][1].startswith("SmartLists-HomeAssistant/4.0.0")


def test_only_one_user_inherits_the_notification_of_the_former_shared_watch_list():
    ex = Extras(None)
    ex.set_watch(["Kaffee"], {"notify": True, "targets": [{"id": "notify.mobile_app_anna", "kind": "service"}]})
    anna, ben = ex.watch_user("anna"), ex.watch_user("ben")
    assert anna["notify"] is True and [t["id"] for t in anna["targets"]] == ["notify.mobile_app_anna"]
    assert ben["notify"] is False and ben["targets"] == [] and ben["lists"][0]["names"] == ["Kaffee"]   # die Produkte bekommt jeder
    assert ex.watch_settings["claimed"] == "anna" and ex.repair_watch_targets({"ben"}) == []            # schon geregelt


def test_repair_for_installs_where_everyone_inherited_the_targets():
    ex = Extras(None)
    legacy = [{"id": "persistent_notification", "kind": "hass"}, {"id": "notify.mobile_app_admin", "kind": "service"}]
    ex.watch_settings = {"notify": True, "targets": list(legacy)}

    def user(targets, notify=True):
        return {"lists": [{"id": "l", "name": "Merkliste", "names": []}], "default": "l", "notify": notify, "targets": list(targets), "seen": []}

    ex.watch_users = {"ben": user(legacy), "admin": user(legacy), "cara": user([{"id": "notify.mobile_app_cara", "kind": "service"}])}
    assert ex.repair_watch_targets({"admin"}) == ["ben"]
    assert ex.watch_users["admin"]["notify"] is True and len(ex.watch_users["admin"]["targets"]) == 2   # der Admin behält sie
    assert ex.watch_users["ben"]["notify"] is False and ex.watch_users["ben"]["targets"] == []
    assert ex.watch_users["cara"]["targets"][0]["id"] == "notify.mobile_app_cara"                       # selbst gewählt: bleibt
    assert ex.repair_watch_targets({"admin"}) == []                                                       # nur einmal
