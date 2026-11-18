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
