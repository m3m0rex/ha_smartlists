from smartlists import list_stats


def test_next_due_and_last_change():
    marks = {"a": {"due": "2026-12-03T18:00"}, "b": {"due": "2026-11-20"}, "c": {"due": "2026-11-01", "closed": True}, "d": {"fav": True}}
    assert list_stats.next_due(marks) == "2026-11-20"
    assert list_stats.next_due({}) is None and list_stats.next_due(None) is None
    assert list_stats.last_change([{"t": 5, "a": "add"}, {"t": 9, "a": "check"}, {"a": "x"}]) == 9
    assert list_stats.last_change([]) is None


def test_summary_counts_open_items_offers_and_prices():
    items = [
        {"name": "Kaffee", "checked": False, "price": {"total": 4.99}},
        {"name": "Butter", "checked": False, "price": None, "offer": {"price": 1.49}},
        {"name": "Milch", "checked": False, "price": {"total": 1.19}},
        {"name": "Brot", "checked": True, "price": {"total": 2.5}},
    ]
    deals = lambda offers, name: [o for o in offers if o["title"] == name]  # noqa: E731
    assert list_stats.summary(items, [{"title": "Kaffee"}, {"title": "Brot"}], deals) == {"open": 3, "offers": 2, "total": 6.18, "priced": 2}
    assert list_stats.summary(items) == {"open": 3, "offers": 1, "total": 6.18, "priced": 2}
    assert list_stats.summary([]) == {"open": 0, "offers": 0, "total": 0, "priced": 0}


def test_app_reports_numbers_for_its_sensors():
    from smartlists.devices import Devices

    d = Devices(None)
    d.register("dev1", {"name": "S24", "app_version": "0.3.0", "latest_version": "0.4.0", "last_sync": 1795000000, "pending": 3}, "u1", "Anna")
    e = d.devices["dev1"]
    assert (e["latest_version"], e["last_sync"], e["pending"]) == ("0.4.0", 1795000000, 3)
    # Unsinn wird nicht übernommen, das Gemeldete bleibt stehen
    d.register("dev1", {"pending": -1, "last_sync": "gestern"}, "u1", "Anna")
    assert (d.devices["dev1"]["last_sync"], d.devices["dev1"]["pending"]) == (1795000000, 3)
    d.register("dev1", {"pending": 0}, "u1", "Anna")
    assert d.devices["dev1"]["pending"] == 0
