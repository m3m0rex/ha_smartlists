"""Listen übernehmen: Artikel landen vorab im Speicher der neuen Liste, alte Liste je nach Wahl."""

import asyncio
import sys
import types

saved = {}


class _Sub:
    n = 0

    def __init__(self, data, subentry_type, title, unique_id):
        _Sub.n += 1
        self.data, self.subentry_type, self.title, self.subentry_id = data, subentry_type, title, f"sub{_Sub.n}"


class _Store:
    def __init__(self, hass, version, key):
        self.key = key

    async def async_save(self, data):
        saved[self.key] = data


def _setup():
    sys.modules.setdefault("homeassistant.config_entries", types.ModuleType("homeassistant.config_entries")).ConfigSubentry = _Sub
    regs = {"todo.einkaufsliste": types.SimpleNamespace(platform="shopping_list", config_entry_id="e1"),
            "todo.anna": types.SimpleNamespace(platform="local_todo", config_entry_id="e2")}
    er = types.ModuleType("homeassistant.helpers.entity_registry")
    er.async_get = lambda hass: types.SimpleNamespace(async_get=lambda eid: regs.get(eid))
    sys.modules["homeassistant.helpers.entity_registry"] = er
    sys.modules["homeassistant.helpers"].entity_registry = er
    items = {"todo.einkaufsliste": [{"uid": "a", "text": "Milch 2 l", "note": "", "checked": False}, {"uid": "b", "text": "Brot", "note": "Vollkorn", "checked": True}],
             "todo.anna": [{"uid": "c", "text": "Seife", "note": "", "checked": False}]}
    removed = []

    async def raw_items(hass, eid):
        return items[eid]

    async def remove_items(hass, eid, uids, context=None):
        removed.append((eid, uids))

    added_items = []

    async def add_item(hass, eid, text, note="", checked=False, context=None, from_share=False):
        added_items.append((eid, text, note, checked))
        return {"uid": "n"}

    items["todo.ha_smartlists_note_julia"] = [{"uid": "x", "text": "Party", "note": "Snacks, ice", "checked": False},
                                             {"uid": "y", "text": "Geheim", "note": "ENC:abc", "checked": False}]
    lists = types.ModuleType("smartlists.lists")
    lists.raw_items, lists.remove_items, lists.add_item = raw_items, remove_items, add_item
    lists.is_notes = lambda hass, e: "note" in e
    lists.notes_allowed = lambda hass, e, user: user is not None and getattr(user, "id", None) == "u1"
    lists.added_items = added_items
    sys.modules["smartlists.lists"] = lists
    created_notes = []

    async def async_create_notes_list(hass, user, name=""):
        if name == "Julia":  # gibt es schon → nächster Name
            raise ValueError("exists")
        created_notes.append(name)
        return "todo.ha_smartlists_notes_" + name.lower().replace(" ", "_")

    lists.created_notes = created_notes
    lists.fake_create_notes = async_create_notes_list
    sys.modules["smartlists.lists"] = lists
    sys.modules.pop("smartlists.migrate", None)
    import smartlists.migrate as m

    m.Store = _Store
    return m, removed


def _hass(m):
    added, removed_entries = [], []

    async def async_remove(entry_id):
        removed_entries.append(entry_id)

    states = [types.SimpleNamespace(entity_id=e, state=s, attributes={"friendly_name": n})
              for e, s, n in [("todo.einkaufsliste", "1", "Einkaufsliste"), ("todo.anna", "1", "Anna"), ("todo.ha_smartlists_list_x", "0", "X"),
                              ("todo.ha_smartlists_note_julia", "2", "HA Smartlists Notes Julia")]]
    learning = types.SimpleNamespace(tag_rules=[{"kind": "person", "prefix": "*"}, {"kind": "tag", "prefix": "#"}])
    hass = types.SimpleNamespace(
        data={"smartlists": {"entities": {}, "own": {"todo.ha_smartlists_list_x": object()}, "learning": learning}},
        states=types.SimpleNamespace(async_all=lambda domain: states),
        config_entries=types.SimpleNamespace(async_entries=lambda d: [types.SimpleNamespace(entry_id="main")],
                                             async_add_subentry=lambda entry, sub: added.append(sub), async_remove=async_remove))
    return hass, added, removed_entries


def test_migrate_each_and_one():
    m, removed = _setup()
    hass, added, removed_entries = _hass(m)
    cands = m.candidates(hass)  # ohne Benutzer: keine Notizen
    assert [c["entity_id"] for c in cands] == ["todo.anna", "todo.einkaufsliste"]  # eigene SmartLists-Liste nicht
    assert [c["platform"] for c in cands] == ["local_todo", "shopping_list"]
    for bad in ("delete", "clear"):  # alte Listen werden weder gelöscht noch geleert
        try:
            asyncio.run(m.async_migrate(hass, "u1", ["todo.anna"], "each", old=bad))
            raise AssertionError(bad)
        except ValueError:
            pass
    r = asyncio.run(m.async_migrate(hass, "u1", ["todo.einkaufsliste", "todo.anna"], "each"))
    assert [x["name"] for x in r["lists"]] == ["Einkaufsliste", "Anna"] and [x["items"] for x in r["lists"]] == [2, 1]
    first = saved[f"smartlists.own.{added[0].subentry_id}"]["items"]
    assert [(i["summary"], i["status"], i["description"]) for i in first] == [("Milch 2 l", "needs_action", ""), ("Brot", "completed", "Vollkorn")]
    assert added[0].data["owner"] == "u1"
    # alte Listen bleiben unverändert
    assert r["old"] == {"todo.einkaufsliste": "kept", "todo.anna": "kept"}
    assert removed == [] and removed_entries == []

    hass, added, _ = _hass(m)
    r = asyncio.run(m.async_migrate(hass, "u1", ["todo.einkaufsliste", "todo.anna", "todo.ha_smartlists_list_x"], "one", "Wocheneinkauf", "keep", "person"))
    assert r["lists"] == [{"name": "Wocheneinkauf", "subentry_id": added[0].subentry_id, "items": 3}] and r["old"]["todo.anna"] == "kept"
    texts = [i["summary"] for i in saved[f"smartlists.own.{added[0].subentry_id}"]["items"]]
    assert texts == ["Milch 2 l *Einkaufsliste", "Brot *Einkaufsliste", "Seife *Anna"]


def test_nice_title():
    m, _ = _setup()
    assert m.nice_title("ha_smartlists_list_barcodes", "todo.ha_smartlists_list_barcodes") == "Barcodes"
    assert m.nice_title("HA Smartlists Angebote", "todo.ha_smartlists_list_angebote") == "Angebote"
    assert m.nice_title("Einkaufsliste", "todo.einkaufsliste") == "Einkaufsliste"
    assert m.nice_title("HA Smartlists", "todo.x") == "HA Smartlists"


def test_migrate_notes():
    m, _ = _setup()
    import smartlists.lists as lists
    hass, added, _ = _hass(m)
    u1 = types.SimpleNamespace(id="u1", name="Julia", is_admin=True)
    other = types.SimpleNamespace(id="u2", name="Max", is_admin=True)
    assert "todo.ha_smartlists_note_julia" in [c["entity_id"] for c in m.candidates(hass, u1)]
    assert "todo.ha_smartlists_note_julia" not in [c["entity_id"] for c in m.candidates(hass, other)]  # fremde Notizen privat
    # smartlists.notes nur für diesen Aufruf ersetzen (andere Tests brauchen das echte Modul)
    real = sys.modules.get("smartlists.notes")
    fake = types.ModuleType("smartlists.notes")
    fake.async_create_notes_list = lists.fake_create_notes
    sys.modules["smartlists.notes"] = fake
    try:
        r = asyncio.run(m.async_migrate(hass, "u1", ["todo.ha_smartlists_note_julia"], "each", target="notes", user=u1))
    finally:
        if real is not None:
            sys.modules["smartlists.notes"] = real
        else:
            sys.modules.pop("smartlists.notes", None)
    # Name „HA Smartlists Notes Julia“ → „Julia“ gibt es schon → „Julia 2“; keine SmartLists-Unterliste
    assert lists.created_notes == ["Julia 2"] and added == []
    assert r["lists"] == [{"name": "Julia 2", "entity_id": "todo.ha_smartlists_notes_julia_2", "items": 2}]
    assert lists.added_items == [("todo.ha_smartlists_notes_julia_2", "Party", "Snacks, ice", False),
                                 ("todo.ha_smartlists_notes_julia_2", "Geheim", "ENC:abc", False)]
    assert r["old"] == {"todo.ha_smartlists_note_julia": "kept"}
