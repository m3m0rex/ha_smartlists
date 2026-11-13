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

    lists = types.ModuleType("smartlists.lists")
    lists.raw_items, lists.remove_items, lists.is_notes = raw_items, remove_items, (lambda hass, e: False)
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
              for e, s, n in [("todo.einkaufsliste", "1", "Einkaufsliste"), ("todo.anna", "1", "Anna"), ("todo.ha_smartlists_list_x", "0", "X")]]
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
    cands = m.candidates(hass)
    assert [c["entity_id"] for c in cands] == ["todo.anna", "todo.einkaufsliste"]  # eigene SmartLists-Liste nicht
    assert [c["can_delete"] for c in cands] == [True, False]
    r = asyncio.run(m.async_migrate(hass, "u1", ["todo.einkaufsliste", "todo.anna"], "each", old="delete"))
    assert [x["name"] for x in r["lists"]] == ["Einkaufsliste", "Anna"] and [x["items"] for x in r["lists"]] == [2, 1]
    first = saved[f"smartlists.own.{added[0].subentry_id}"]["items"]
    assert [(i["summary"], i["status"], i["description"]) for i in first] == [("Milch 2 l", "needs_action", ""), ("Brot", "completed", "Vollkorn")]
    assert added[0].data["owner"] == "u1"
    # gelöschte Local-To-do-Liste: neue Liste übernimmt deren Entitäts-ID; geleerte nicht
    assert added[1].data["entity_id"] == "todo.anna" and "entity_id" not in added[0].data
    # Einkaufsliste (shopping_list) lässt sich nicht löschen → geleert; Local To-do „Anna“ → gelöscht
    assert r["old"] == {"todo.einkaufsliste": "cleared", "todo.anna": "deleted"}
    assert removed == [("todo.einkaufsliste", ["a", "b"])] and removed_entries == ["e2"]

    hass, added, _ = _hass(m)
    r = asyncio.run(m.async_migrate(hass, "u1", ["todo.einkaufsliste", "todo.anna", "todo.ha_smartlists_list_x"], "one", "Wocheneinkauf", "keep", "person"))
    assert r["lists"] == [{"name": "Wocheneinkauf", "subentry_id": added[0].subentry_id, "items": 3}] and r["old"]["todo.anna"] == "kept"
    texts = [i["summary"] for i in saved[f"smartlists.own.{added[0].subentry_id}"]["items"]]
    assert texts == ["Milch 2 l *Einkaufsliste", "Brot *Einkaufsliste", "Seife *Anna"]
