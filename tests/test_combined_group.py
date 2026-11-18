"""Kombinierte Listen: eine Gruppe „Kombinierte Listen“ statt eines Unter-Eintrags je Liste (combined_group.py)."""

import asyncio
import sys
import types
from types import MappingProxyType

from test_own_groups import _hass, _setup, _Sub


def _cg(monkeypatch):
    og, reg = _setup()
    devices = {"removed": []}
    import importlib

    dr = importlib.import_module("homeassistant.helpers.device_registry")

    class _Dev:
        def async_get_device(self, identifiers):
            return types.SimpleNamespace(id="dev-" + next(iter(identifiers))[1])

        def async_remove_device(self, device_id):
            devices["removed"].append(device_id)

    monkeypatch.setattr(dr, "async_get", lambda hass: _Dev(), raising=False)
    sys.modules.pop("smartlists.combined_group", None)
    import smartlists.combined_group as cg

    return cg, reg, devices


def test_old_combined_lists_move_into_one_group_and_keep_their_key(monkeypatch):
    cg, reg, _ = _cg(monkeypatch)
    hass, entry = _hass()
    old = _Sub(MappingProxyType({"sources": ["todo.a", "todo.b"], "mode": "bidirectional", "legacy_unique_id": "abc123"}), "combined_list", "Großeinkauf")
    new = _Sub(MappingProxyType({"sources": ["todo.c"], "owner": "u1", "shares": {"u2": "viewer"}, "app_device": "d1", "app_list": "l1"}),
               "combined_list", "Drogerie")
    for s in (old, new):
        entry.subentries[s.subentry_id] = s
    reg["entities"].update({"todo.grosseinkauf": "abc123", "todo.drogerie": new.subentry_id})
    keys = [r.key for r in cg.refs(entry)]
    assert keys == ["abc123", new.subentry_id] and not any(r.grouped for r in cg.refs(entry))
    assert asyncio.run(cg.async_merge(hass, entry)) == 2
    group = cg.the_group(entry)
    assert group.title == "Kombinierte Listen" and group.unique_id == "combined_lists"
    assert not any(s.subentry_type == "combined_list" for s in entry.subentries.values())
    # Schlüssel = bisheriger Schlüssel → unique_id, Speicherdatei und Entitäts-ID bleiben gleich
    assert list(group.data["lists"]) == ["abc123", new.subentry_id]
    assert group.data["lists"]["abc123"] == {"sources": ["todo.a", "todo.b"], "mode": "bidirectional", "title": "Großeinkauf"}
    assert group.data["lists"][new.subentry_id]["app_device"] == "d1" and group.data["lists"][new.subentry_id]["owner"] == "u1"
    assert {u[:2] for u in reg["updates"]} == {("todo.grosseinkauf", group.subentry_id), ("todo.drogerie", group.subentry_id)}
    assert reg["removed"] == []                                              # keine Entität ging verloren
    refs = cg.refs(entry)
    assert [(r.key, r.title, r.grouped) for r in refs] == [("abc123", "Großeinkauf", True), (new.subentry_id, "Drogerie", True)]
    assert "title" not in refs[0].data and refs[0].data["sources"] == ["todo.a", "todo.b"]
    assert asyncio.run(cg.async_merge(hass, entry)) == 0                     # zweiter Start: nichts zu tun


def test_add_update_and_remove_inside_the_group(monkeypatch):
    cg, reg, devices = _cg(monkeypatch)
    hass, entry = _hass()
    key = cg.async_add(hass, "  Wocheneinkauf ", {"sources": ["todo.a"]})
    ref = cg.find(entry, key)
    assert ref.grouped and ref.title == "Wocheneinkauf" and dict(ref.data) == {"sources": ["todo.a"]}
    second = cg.async_add(hass, "Party", {"sources": ["todo.b"]})
    assert len(cg.the_group(entry).data["lists"]) == 2                       # beide in derselben Gruppe
    cg.async_update(hass, ref, title="Großeinkauf")
    assert cg.find(entry, key).title == "Großeinkauf" and cg.find(entry, key).data["sources"] == ["todo.a"]   # Daten bleiben
    cg.async_update(hass, cg.find(entry, key), data={"sources": ["todo.a", "todo.c"], "owner": "u1"})
    assert cg.find(entry, key).title == "Großeinkauf" and cg.find(entry, key).data["owner"] == "u1"           # Name bleibt
    reg["entities"]["todo.party"] = second
    cg.async_remove(hass, cg.find(entry, second))
    assert cg.find(entry, second) is None and "todo.party" in reg["removed"] and devices["removed"] == [f"dev-list_{second}"]
    cg.async_remove(hass, cg.find(entry, key))
    assert cg.the_group(entry) is None                                       # leere Gruppe verschwindet


def test_backup_resolves_the_group_into_single_lists():
    from smartlists import removal_backup as rb

    group = {"subentry_id": "g", "subentry_type": "combined_lists", "title": "Kombinierte Listen", "unique_id": "combined_lists",
             "data": {"lists": {"abc": {"title": "Einkauf", "sources": ["todo.a", "todo.b"]}}}}
    own = {"subentry_id": "o", "subentry_type": "own_lists", "title": "Eigene Listen", "data": {"lists": {"l1": {"title": "X"}}}}
    assert rb.store_keys([group, own]) == ["smartlists.abc", "smartlists.own.l1"]
    backup = rb.build("4.0.0", {}, [group, own], {"smartlists.own.l1": {"items": []}})
    assert rb.summary(backup) == {"own": 1, "combined": 1}
    assert rb.report(backup)["combined"] == [{"title": "Einkauf", "sources": 2}]
    restored = rb.subentries_for_restore(backup)
    assert [s["subentry_type"] for s in restored] == ["combined_lists", "own_lists"] and restored[0]["unique_id"] == "combined_lists"
