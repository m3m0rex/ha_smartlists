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

    hass = types.SimpleNamespace(config=types.SimpleNamespace(language="de"), auth=types.SimpleNamespace(async_get_user=get_user),
                                 config_entries=types.SimpleNamespace(async_entries=lambda d: [entry], async_add_subentry=add,
                                                                      async_update_subentry=update, async_remove_subentry=remove))
    return hass, entry


def test_legacy_lists_move_into_owner_groups():
    og, reg = _setup()
    hass, entry = _hass()
    for title, owner in (("Angebote", "u1"), ("Barcodes", "u1"), ("Drogerie", "u2")):
        s = _Sub(MappingProxyType({"owner": owner, "shares": {"u2": "checker"} if title == "Angebote" else {}}), "own_list", title)
        entry.subentries[s.subentry_id] = s
        reg["entities"][f"todo.{title.lower()}"] = f"own_{s.subentry_id}"
    old_ids = list(entry.subentries)
    assert asyncio.run(og.async_migrate_legacy(hass, entry)) == 3
    groups = og.groups(entry)
    assert sorted(g.title for g in groups) == ["Eigene Listen · Anna", "Eigene Listen · Julia"]
    assert not any(s.subentry_type == "own_list" for s in entry.subentries.values())
    julia = og.group_of_owner(entry, "u1")
    # list_id = alte subentry_id → unique_id/Speicher/Entitäts-ID bleiben gleich
    assert list(julia.data["lists"]) == old_ids[:2]
    assert julia.data["lists"][old_ids[0]] == {"title": "Angebote", "shares": {"u2": "checker"}}
    # Entitäten wurden an den neuen Eintrag gehängt und vom alten Gerät gelöst
    assert ("todo.angebote", julia.subentry_id, None) in reg["updates"] and len(reg["updates"]) == 3


def test_add_move_remove():
    og, reg = _setup()
    hass, entry = _hass()
    a = asyncio.run(og.async_add_list(hass, "u1", "Einkauf"))
    b = asyncio.run(og.async_add_list(hass, "u1", "Garten", {"u2": "editor"}))
    assert len(og.groups(entry)) == 1 and len(og.group_of_owner(entry, "u1").data["lists"]) == 2
    reg["entities"]["todo.garten"] = f"own_{b}"
    # Besitzer wechseln: Liste wandert zu Anna (neuer Eintrag), Anna verliert ihre Freigabe (sie ist jetzt Besitzerin)
    asyncio.run(og.async_update_list(hass, b, owner="u2"))
    anna = og.group_of_owner(entry, "u2")
    assert anna.data["lists"][b] == {"title": "Garten", "shares": {}}
    assert b not in og.group_of_owner(entry, "u1").data["lists"]
    assert ("todo.garten", anna.subentry_id, None) in reg["updates"]
    # letzte Liste weg → Eintrag des Besitzers verschwindet
    og.async_remove_list(hass, b)
    assert og.group_of_owner(entry, "u2") is None and reg["removed"] == ["todo.garten"]
    asyncio.run(og.async_update_list(hass, a, title="Wocheneinkauf"))
    assert og.find(entry, a)[1]["title"] == "Wocheneinkauf"
