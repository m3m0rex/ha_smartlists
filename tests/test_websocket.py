"""WebSocket-Befehle (websocket.py + ws_*.py): Anmeldung aller Befehle, Rechte und die wichtigsten Abläufe.

Home Assistant selbst wird durch die Platzhalter aus conftest.py ersetzt – geprüft wird die Logik der Befehle."""

import asyncio
import importlib
import types

import pytest

WS_MODULES = ("ws_core", "ws_lists", "ws_home", "ws_own", "ws_data", "ws_prices", "ws_share", "ws_more")


@pytest.fixture(autouse=True)
def _real_modules():
    """Andere Tests ersetzen smartlists.lists durch eine Attrappe – hier wird das echte Modul gebraucht."""
    import sys

    fake = sys.modules.get("smartlists.lists")
    if fake is not None and not hasattr(fake, "clear_expired_offers"):
        for name in [n for n in sys.modules if n == "smartlists.lists" or n == "smartlists.websocket" or n.startswith("smartlists.ws_")]:
            del sys.modules[name]
            sys.modules["smartlists"].__dict__.pop(name.split(".")[1], None)
    yield


class Conn:
    """Verbindung der Karte: merkt sich Antwort bzw. Fehler."""

    def __init__(self, admin=True, user_id="u1"):
        self.user = types.SimpleNamespace(id=user_id, name="Test", is_admin=admin)
        self.result = self.error = None

    def send_result(self, msg_id, result=None):
        self.result = result

    def send_error(self, msg_id, code, message):
        self.error = (code, message)

    def context(self, msg):
        return None


def _hass(**data):
    from test_learning import _learning

    from smartlists.shares import Shares

    hass = types.SimpleNamespace(data={}, states=types.SimpleNamespace(get=lambda entity_id: object() if entity_id == "todo.a" else None))
    hass.data["smartlists"] = {"learning": _learning(), "extras": None, "shares": Shares(hass), "public": None, **data}
    return hass


def test_every_command_is_registered_once():
    from smartlists import websocket

    hass = types.SimpleNamespace(data={})
    websocket.async_register(hass)
    registered = hass.data["_ws"]
    types_ = [h._ws_schema["type"] for h in registered]
    assert all(t.startswith("smartlists/") for t in types_)
    assert len(types_) == len(set(types_)), "Befehl doppelt angemeldet"
    # nichts vergessen: jeder mit @websocket_command versehene Befehl aus ws_*.py ist angemeldet
    defined = {h._ws_schema["type"] for name in WS_MODULES for h in vars(importlib.import_module(f"smartlists.{name}")).values()
               if isinstance(getattr(h, "_ws_schema", None), dict)}
    assert defined == set(types_)
    assert {"smartlists/get_list", "smartlists/share_update", "smartlists/clear_expired_offers", "smartlists/config"} <= set(types_)


def test_config_for_the_card():
    from smartlists.ws_core import ws_config

    conn = Conn()
    ws_config(_hass(), conn, {"id": 1, "language": "de"})
    assert {"categories", "tag_rules", "known_stores", "appearance", "rights", "store_order", "features"} <= set(conn.result)
    assert conn.result["categories"] and conn.result["tag_rules"]


def test_share_link_create_update_revoke(monkeypatch):
    from smartlists import lists, ws_share

    monkeypatch.setattr(lists, "is_notes", lambda hass, entity_id: False)
    hass = _hass()
    conn = Conn()
    ws_share.ws_share_create(hass, conn, {"id": 1, "entity_id": "todo.a", "check": "soft", "add": True, "notes": False, "approve": True, "hours": 24})
    link = conn.result
    assert link["path"].startswith("/smartlists-share/") and link["check"] == "soft" and link["approve"] is True

    conn = Conn()
    ws_share.ws_share_update(hass, conn, {"id": 2, "entity_id": "todo.a", "link_id": link["id"], "check": "on", "add": False, "password": "geheim", "hours": None})
    (updated,) = conn.result["links"]
    assert (updated["id"], updated["check"], updated["add"], updated["approve"], updated["password"], updated["expires"]) == (link["id"], "on", False, False, True, None)

    conn = Conn()
    ws_share.ws_share_update(hass, conn, {"id": 3, "entity_id": "todo.a", "link_id": "x" * 16})
    assert conn.error and conn.error[0] == "not_found"

    conn = Conn()
    ws_share.ws_share_revoke(hass, conn, {"id": 4, "entity_id": "todo.a", "link_id": link["id"]})
    assert conn.result == {"links": []}


def test_share_link_needs_permission(monkeypatch):
    from smartlists import lists, ws_share

    monkeypatch.setattr(lists, "is_notes", lambda hass, entity_id: False)
    monkeypatch.setattr(lists, "own_entity", lambda hass, entity_id: None)
    monkeypatch.setattr(lists, "own_role", lambda hass, entity_id, user: "viewer")
    hass = _hass()
    for msg in ({"id": 1, "entity_id": "todo.a", "check": "off", "add": False, "notes": False, "approve": False},
                {"id": 1, "entity_id": "todo.missing", "check": "off", "add": False, "notes": False, "approve": False}):
        conn = Conn(admin=msg["entity_id"] == "todo.missing")  # Liste gibt es nicht → auch Admins bekommen einen Fehler
        ws_share.ws_share_create(hass, conn, msg)
        assert conn.result is None and conn.error[0] == "unauthorized"
    assert hass.data["smartlists"]["shares"].links == {}


def test_list_command_reports_errors_instead_of_hanging(monkeypatch):
    from smartlists import lists
    from smartlists.ws_common import _list_command

    monkeypatch.setattr(lists, "notes_allowed", lambda hass, entity_id, user: True)

    @_list_command({"type": "smartlists/test"})
    async def boom(hass, msg, context):
        raise lists.ListError("Artikel nicht gefunden")

    @_list_command({"type": "smartlists/test2"})
    async def fine(hass, msg, context):
        return {"ok": msg["_user"].id}

    conn = Conn()
    asyncio.run(boom(_hass(), conn, {"id": 1, "entity_id": "todo.a"}))
    assert conn.error == ("smartlists_error", "Artikel nicht gefunden")
    conn = Conn(user_id="u7")
    asyncio.run(fine(_hass(), conn, {"id": 2, "entity_id": "todo.a"}))
    assert conn.result == {"ok": "u7"}


def test_clear_expired_offers_keeps_items_and_notes(monkeypatch):
    """4.0: nur abgelaufene Angebote werden entfernt – Artikel, Notiz und gültige Angebote bleiben."""
    from smartlists import lists

    old = '⚙OFFER:{"s":"REWE","p":1.29,"e":"2020-01-01"}'
    new = '⚙OFFER:{"s":"REWE","p":1.29,"e":"2999-01-01"}'
    items = [{"uid": "1", "text": "Butter", "note": f"die gute\n{old}", "checked": False},
             {"uid": "2", "text": "Milch", "note": new, "checked": False},
             {"uid": "3", "text": "Brot", "note": "geschnitten", "checked": False},
             {"uid": "4", "text": "Kaffee", "note": old, "checked": False}]
    calls = []

    async def raw_items(hass, entity_id):
        return items

    async def call(hass, service, data, context=None):
        calls.append((service, data))

    monkeypatch.setattr(lists, "raw_items", raw_items)
    monkeypatch.setattr(lists, "_call", call)
    monkeypatch.setattr(lists, "combined_entity", lambda hass, entity_id: None)
    assert asyncio.run(lists.clear_expired_offers(_hass(), "todo.a")) == {"removed": 2}
    assert calls == [("update_item", {"entity_id": "todo.a", "item": "1", "description": "die gute"}),
                     ("update_item", {"entity_id": "todo.a", "item": "4", "description": ""})]


@pytest.mark.parametrize("module", WS_MODULES)
def test_ws_modules_stay_small(module):
    """Die Aufteilung soll bleiben: kein Bereich wächst wieder zu einer 1700-Zeilen-Datei."""
    path = importlib.import_module(f"smartlists.{module}").__file__
    assert sum(1 for _ in open(path, encoding="utf-8")) < 700
