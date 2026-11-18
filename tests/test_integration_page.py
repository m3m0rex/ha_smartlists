"""Seite der Integration: Zeilen der eigenen Listen und der Notizen (Name mit Besitzer, darunter die Rechte)."""

import types


def _hass(lang="de"):
    return types.SimpleNamespace(config=types.SimpleNamespace(language=lang))


def test_notes_lines():
    from smartlists import notes_group

    assert notes_group.short_name("HA Smartlists Notes Urlaub", "Notizen") == "Urlaub"
    assert notes_group.short_name("HA Smartlists Notes", "Notizen") == "Notizen"
    assert notes_group.device_line(_hass(), "HA Smartlists Notes Urlaub", "Anna", "owner") == ("Urlaub (Anna)", "Nur Besitzer")
    assert notes_group.device_line(_hass(), "HA Smartlists Notes Urlaub", "Anna", "household") == ("Urlaub (Anna)", "Ganzer Haushalt")
    name, line = notes_group.device_line(_hass(), "HA Smartlists Notes 2", None, "owner")
    assert name == "2 (kein Besitzer)" and line.startswith("Nur für Admins sichtbar")
    assert notes_group.device_line(_hass("en"), "HA Smartlists Notes", "Ben", "owner") == ("Notes (Ben)", "Owner only")


def test_own_list_line_keeps_the_owner_out_of_the_name():
    """Der Gerätename ist der Name der Liste – sonst zeigt Home Assistant „Barcodes (Admin) Barcodes“."""
    from smartlists.todo import own_device_line

    assert own_device_line(_hass(), "Barcodes", "Admin", {}) == ("Barcodes", "Nur Besitzer: Admin")
    assert own_device_line(_hass(), "Einkauf", "Anna", {"Ben": "checker", "Max": "viewer"}) == ("Einkauf", "Besitzer: Anna · Ben: abhaken · Max: sehen")
    assert own_device_line(_hass("en"), "Party", "", {"Ben": "editor"}) == ("Party", "no owner · Ben: edit")
    name, line = own_device_line(_hass(), "Viele", "Anna", {f"P{i}": "viewer" for i in range(5)})
    assert name == "Viele" and line.endswith("· +2")
