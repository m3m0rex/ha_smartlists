import asyncio
import types

from smartlists.notes import Notes, looks_like_notes


class _State:
    def __init__(self, entity_id, name):
        self.entity_id = entity_id
        self.attributes = {"friendly_name": name}


class _States:
    def __init__(self, *states):
        self._s = {s.entity_id: s for s in states}

    def get(self, eid):
        return self._s.get(eid)

    def async_all(self, domain):
        return [s for s in self._s.values() if s.entity_id.startswith(domain + ".")]


class _User:
    def __init__(self, uid, admin=False):
        self.id, self.is_admin = uid, admin


def _notes():
    hass = types.SimpleNamespace(data={}, states=_States(
        _State("todo.ha_smartlists_note", "HA Smartlists Notes"),
        _State("todo.ha_smartlists_note_2", "HA Smartlists Notes"),
        _State("todo.einkauf", "Einkauf"),
        _State("todo.anna", "HA Smartlists Notes Anna"),
    ))
    n = Notes(hass)
    asyncio.run(n.async_load())
    return n


def test_detection():
    assert looks_like_notes("todo.ha_smartlists_note")
    assert looks_like_notes("todo.ha_smartlists_notes_peter")
    assert looks_like_notes("todo.notiz_einkauf")
    assert looks_like_notes("todo.x", "HA Smartlists Notes")
    assert not looks_like_notes("todo.ha_smartlists_list_einkauf", "HA Smartlists Einkauf")
    assert not looks_like_notes("todo.einkaufsliste")


def test_hidden_by_default_and_account_bound():
    n = _notes()
    anna, max_, admin = _User("anna"), _User("max"), _User("adm", admin=True)
    assert n.entity_ids() == ["todo.anna", "todo.ha_smartlists_note", "todo.ha_smartlists_note_2"]
    assert n.shown("todo.einkauf", anna) and not n.shown("todo.ha_smartlists_note", admin)  # Standard: ausgeblendet
    n.update(mode="section")
    # ohne Besitzer: nur Admins
    assert n.shown("todo.ha_smartlists_note", admin) and not n.shown("todo.ha_smartlists_note", anna)
    n.claim(["todo.ha_smartlists_note", "todo.einkauf"], "anna")
    assert n.owners == {"todo.ha_smartlists_note": "anna"}  # normale Listen werden nie beansprucht
    assert n.can_see("todo.ha_smartlists_note", anna)
    assert not n.can_see("todo.ha_smartlists_note", max_) and not n.can_see("todo.ha_smartlists_note", admin)
    n.claim(["todo.ha_smartlists_note"], "max")  # schon vergeben → bleibt bei Anna
    assert n.owners["todo.ha_smartlists_note"] == "anna"
    assert not n.can_see("todo.ha_smartlists_note", None)  # Dienste/Assist ohne Benutzer: nie
    n.update(scope="household")
    assert n.can_see("todo.ha_smartlists_note", max_)
    n.update(owners={"todo.ha_smartlists_note": None})
    assert n.owners == {}
