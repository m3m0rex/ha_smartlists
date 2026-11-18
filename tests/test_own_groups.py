"""Eigene Listen je Besitzer: Umzug der alten Unter-Einträge, Anlegen, Besitzer wechseln, Löschen."""

import asyncio
import sys
import types
from types import MappingProxyType


class _Sub:
    n = 0

    def __init__(self, data, subentry_type, title, unique_id=None):
        _Sub.n += 1
        self.data, self.subentry_type, self.title, self.unique_id = data, subentry_type, title, unique_id
        self.subentry_id = f"g{_Sub.n}"


def _setup():
    ce = sys.modules.setdefault("homeassistant.config_entries", types.ModuleType("homeassistant.config_entries"))
    ce.ConfigSubentry, ce.ConfigEntry = _Sub, object
    reg = {"entities": {}, "updates": [], "removed": []}

    class _Reg:
        def async_get_entity_id(self, domain, platform, unique_id):
            return next((e for e, u in reg["entities"].items() if u == unique_id), None)

        def async_update_entity(self, entity_id, *, config_subentry_id=None, device_id=None, name=None):
            reg["updates"].append((entity_id, config_subentry_id, device_id))

        def async_remove(self, entity_id):
            reg["removed"].append(entity_id)

    er = types.ModuleType("homeassistant.helpers.entity_registry")
    er.async_get = lambda hass: _Reg()
    sys.modules["homeassistant.helpers.entity_registry"] = er
    sys.modules["homeassistant.helpers"].entity_registry = er
    sys.modules.pop("smartlists.own_groups", None)
    import smartlists.own_groups as og

    return og, reg


def _hass():
    entry = types.SimpleNamespace(entry_id="main", subentries={})

    def add(e, sub):
        e.subentries[sub.subentry_id] = sub

    def update(e, sub, data=None, title=None):
        sub.data = data

    def remove(e, sid):
        e.subentries.pop(sid)

    async def get_user(uid):
        return types.SimpleNamespace(name={"u1": "Julia", "u2": "Anna"}.get(uid))

    hass = types.SimpleNamespace(config=types.SimpleNamespace(language="de", config_dir="/nonexistent"), async_add_executor_job=lambda func, *args: None, auth=types.SimpleNamespace(async_get_user=get_user),
                                 config_entries=types.SimpleNamespace(async_entries=lambda d: [entry], async_add_subentry=add,
                                                                      async_update_subentry=update, async_remove_subentry=remove))
    return hass, entry


def test_legacy_lists_move_into_the_one_group():
    og, reg = _setup()
    hass, entry = _hass()
    for title, owner in (("Angebote", "u1"), ("Barcodes", "u1"), ("Drogerie", "u2")):
        s = _Sub(MappingProxyType({"owner": owner, "shares": {"u2": "checker"} if title == "Angebote" else {}}), "own_list", title)
        entry.subentries[s.subentry_id] = s
        reg["entities"][f"todo.{title.lower()}"] = f"own_{s.subentry_id}"
    old_ids = list(entry.subentries)
    assert asyncio.run(og.async_migrate_legacy(hass, entry)) == 3
    groups = og.groups(entry)
    assert [g.title for g in groups] == ["Eigene Listen"] and groups[0].unique_id == "own_lists"   # eine Gruppe für alle Besitzer
    assert not any(s.subentry_type == "own_list" for s in entry.subentries.values())
    group = og.the_group(entry)
    # list_id = alte subentry_id → unique_id/Speicher/Entitäts-ID bleiben gleich; der Besitzer steht bei der Liste
    assert list(group.data["lists"]) == old_ids
    assert group.data["lists"][old_ids[0]] == {"title": "Angebote", "owner": "u1", "shares": {"u2": "checker"}}
    assert [og.owner_of(group, d) for d in group.data["lists"].values()] == ["u1", "u1", "u2"]
    # Entitäten wurden an den neuen Eintrag gehängt und vom alten Gerät gelöst
    assert ("todo.angebote", group.subentry_id, None) in reg["updates"] and len(reg["updates"]) == 3


def test_groups_per_owner_are_merged_into_one():
    """3.7 bis 4.0.0-beta.12: je Besitzer ein Unter-Eintrag – beim Start werden sie zusammengeführt."""
    og, reg = _setup()
    hass, entry = _hass()
    julia = _Sub(MappingProxyType({"owner": "u1", "lists": {"a": {"title": "Einkauf", "shares": {"u2": "editor"}, "entity_id": "todo.einkauf"},
                                                            "b": {"title": "Garten", "shares": {}}}}), "own_lists", "Eigene Listen · Julia", "owner_u1")
    anna = _Sub(MappingProxyType({"owner": "u2", "lists": {"c": {"title": "Geschenke", "shares": {}}}}), "own_lists", "Eigene Listen · Anna", "owner_u2")
    for s in (julia, anna):
        entry.subentries[s.subentry_id] = s
    reg["entities"].update({"todo.einkauf": "own_a", "todo.garten": "own_b", "todo.geschenke": "own_c"})
    assert og.owner_of(julia, julia.data["lists"]["a"]) == "u1"                       # alte Form: Besitzer von der Gruppe
    assert asyncio.run(og.async_merge_groups(hass, entry)) == 3
    assert [g.title for g in og.groups(entry)] == ["Eigene Listen"]
    group = og.the_group(entry)
    assert group.data["lists"] == {"a": {"title": "Einkauf", "owner": "u1", "shares": {"u2": "editor"}, "entity_id": "todo.einkauf"},
                                   "b": {"title": "Garten", "owner": "u1", "shares": {}}, "c": {"title": "Geschenke", "owner": "u2", "shares": {}}}
    assert {u[:2] for u in reg["updates"]} == {("todo.einkauf", group.subentry_id), ("todo.garten", group.subentry_id), ("todo.geschenke", group.subentry_id)}
    assert reg["removed"] == []                                                       # keine Entität ging verloren
    assert asyncio.run(og.async_merge_groups(hass, entry)) == 0                       # zweiter Start: nichts zu tun


def test_add_change_owner_remove():
    og, reg = _setup()
    hass, entry = _hass()
    a = asyncio.run(og.async_add_list(hass, "u1", "Einkauf"))
    b = asyncio.run(og.async_add_list(hass, "u2", "Garten", {"u1": "editor"}))
    group = og.the_group(entry)
    assert len(og.groups(entry)) == 1 and list(group.data["lists"]) == [a, b]         # auch bei zwei Besitzern eine Gruppe
    reg["entities"]["todo.garten"] = f"own_{b}"
    # Besitzer wechseln: wird bei der Liste umgetragen; die neue Besitzerin verliert ihre Freigabe (sie darf jetzt alles)
    asyncio.run(og.async_update_list(hass, b, owner="u1"))
    assert og.find(entry, b)[1] == {"title": "Garten", "owner": "u1", "shares": {}}
    assert reg["updates"] == [] and "todo.garten" in reg["entities"]                  # die Entität wurde dafür nicht angefasst
    og.async_remove_list(hass, b)
    assert list(og.the_group(entry).data["lists"]) == [a] and reg["removed"] == ["todo.garten"]
    asyncio.run(og.async_update_list(hass, a, title="Wocheneinkauf"))
    assert og.find(entry, a)[1]["title"] == "Wocheneinkauf"
    og.async_remove_list(hass, a)                                                     # letzte Liste weg → die Gruppe verschwindet
    assert og.groups(entry) == []


def test_rename_changes_the_list_not_the_entity():
    """Umbenennen ändert den Namen der Liste (Gruppe bzw. Unter-Eintrag); an der Entität steht kein eigener Name."""
    import asyncio
    import types

    from smartlists import own_groups
    from smartlists.const import SUBENTRY_COMBINED, SUBENTRY_OWN_GROUP

    group = types.SimpleNamespace(subentry_id="g", subentry_type=SUBENTRY_OWN_GROUP, unique_id="own_lists", title="Eigene Listen",
                                  data={"lists": {"l1": {"title": "Test share", "owner": "u1", "shares": {}}}})
    combined = types.SimpleNamespace(subentry_id="c1", subentry_type=SUBENTRY_COMBINED, unique_id=None, title="Alt", data={"sources": []})
    changes = []

    def update(entry, sub, **kw):
        changes.append((sub.subentry_id, kw))
        for k, v in kw.items():
            setattr(sub, k, v)

    entry = types.SimpleNamespace(entry_id="e", subentries={"g": group, "c1": combined})
    hass = types.SimpleNamespace(config_entries=types.SimpleNamespace(async_entries=lambda domain: [entry], async_update_subentry=update))
    own = types.SimpleNamespace(grouped=True, list_id="l1", unique_id="own_l1")
    assert asyncio.run(own_groups.async_rename_list(hass, own, "  xxx  ")) is True
    assert group.data["lists"]["l1"]["title"] == "xxx" and group.data["lists"]["l1"]["owner"] == "u1"
    comb = types.SimpleNamespace(grouped=False, unique_id="c1")
    assert asyncio.run(own_groups.async_rename_list(hass, comb, "Wocheneinkauf")) is True and combined.title == "Wocheneinkauf"
    assert asyncio.run(own_groups.async_rename_list(hass, types.SimpleNamespace(grouped=False, unique_id="fremd"), "x")) is False
    assert asyncio.run(own_groups.async_rename_list(hass, own, "   ")) is False
