"""Stern, Fälligkeit und Erinnerung je Eintrag."""

import asyncio
import types
from datetime import datetime

import pytest

from smartlists.extras import Extras, item_marks
from smartlists.reminders import message


def _extras():
    e = Extras(types.SimpleNamespace(data={}))
    asyncio.run(e.async_load())
    return e


def test_favourite_and_due_are_kept_and_removed():
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"favorite": True})
    assert item_marks(e, "todo.a", "u1") == {"favorite": True, "due": None, "remind": False, "repeat": None, "overdue": False, "calendar": None}
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20T18:00", "remind": True, "by": "user1", "name": "Milch"})
    assert item_marks(e, "todo.a", "u1", today="2026-11-17") == {"favorite": True, "due": "2026-11-20T18:00", "remind": True, "repeat": None, "overdue": False, "calendar": None}
    assert item_marks(e, "todo.a", "u1", today="2026-11-21")["overdue"] is True
    assert item_marks(e, "todo.a", "u1", today="2026-11-20")["overdue"] is False  # am Tag selbst noch nicht überfällig
    e.set_item_mark("todo.a", "u1", {"due": None})
    assert item_marks(e, "todo.a", "u1")["remind"] is False
    e.set_item_mark("todo.a", "u1", {"favorite": False})
    assert e.item_marks == {}  # nichts mehr gemerkt: kein Rest im Speicher


def test_bad_date_is_refused_and_reminder_needs_a_date():
    e = _extras()
    with pytest.raises(ValueError):
        e.set_item_mark("todo.a", "u1", {"due": "morgen"})
    e.set_item_mark("todo.a", "u1", {"remind": True})
    assert e.item_marks == {}


def test_combined_list_marks_live_with_the_source_list():
    e = _extras()
    e.set_item_mark("todo.kombi", "todo.rewe::u7", {"favorite": True})
    assert e.item_marks == {"todo.rewe": {"u7": {"fav": True}}}
    assert item_marks(e, "todo.rewe", "u7")["favorite"] is True
    assert item_marks(e, "todo.kombi", "todo.rewe::u7")["favorite"] is True
    e.clear_item_mark("todo.kombi", "todo.rewe::u7")
    assert e.item_marks == {}


def test_due_reminders_fire_once_and_again_after_a_new_date():
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20T18:00", "remind": True, "by": "x"})
    e.set_item_mark("todo.a", "u2", {"due": "2026-11-20", "remind": True})   # ohne Uhrzeit: ab 9 Uhr
    e.set_item_mark("todo.a", "u3", {"due": "2026-11-20T08:00"})              # ohne Erinnerung
    assert e.due_reminders(datetime(2026, 11, 20, 8, 59)) == []
    assert [u for _, u, _ in e.due_reminders(datetime(2026, 11, 20, 9, 0))] == ["u2"]
    assert sorted(u for _, u, _ in e.due_reminders(datetime(2026, 11, 20, 18, 0))) == ["u1", "u2"]
    e.mark_reminded("todo.a", "u1")
    e.mark_reminded("todo.a", "u2")
    assert e.due_reminders(datetime(2026, 11, 21, 12, 0)) == []
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-22T10:00"})
    assert [u for _, u, _ in e.due_reminders(datetime(2026, 11, 22, 10, 0))] == ["u1"]


def test_marks_survive_a_reload():
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"favorite": True, "due": "2026-12-01"})
    saved = e._data() if hasattr(e, "_data") else None
    assert saved and saved["item_marks"] == {"todo.a": {"u1": {"fav": True, "due": "2026-12-01"}}}


def test_message():
    assert message("Milch", "Familie", "2026-11-20T18:00") == "Milch – Familie (20.11. 18:00)"
    assert message("Milch", "", "2026-11-20") == "Milch (20.11.)"


def test_calendar_event_is_remembered_and_goes_with_the_due_date():
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"cal": {"entity": "calendar.x", "due": "2026-11-20", "summary": "Milch"}})
    assert e.item_marks == {}  # ohne Fälligkeit kein Termin
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20"})
    e.set_item_mark("todo.a", "u1", {"cal": {"entity": "calendar.x", "due": "2026-11-20", "summary": "Milch"}})
    assert item_marks(e, "todo.a", "u1", today="2026-11-17")["calendar"] == "calendar.x"
    e.set_item_mark("todo.a", "u1", {"due": None})
    assert e.item_marks == {}


def test_calendar_event_data():
    from smartlists.calendar_sync import event_data

    assert event_data("Milch", "2026-11-20T18:00", "Familie") == {
        "summary": "Milch", "description": "SmartLists · Familie",
        "start_date_time": "2026-11-20 18:00:00", "end_date_time": "2026-11-20 18:30:00"}
    assert event_data("Milch", "2026-11-30") == {"summary": "Milch", "description": "SmartLists",
                                                 "start_date": "2026-11-30", "end_date": "2026-12-01"}


def test_calendar_follows_ticking(monkeypatch):
    """Abgehakt → Termin weg (gemerkt als „off“), wieder geöffnet → wieder eingetragen."""
    from smartlists import calendar_sync

    calls = []

    async def fake_remove(hass, cal):
        calls.append(("remove", cal["entity"]))
        return True

    async def fake_add(hass, entity, summary, due, list_name=""):
        calls.append(("add", entity, summary, due))
        return {"entity": entity, "due": due, "summary": summary, "list": list_name}

    monkeypatch.setattr(calendar_sync, "async_remove", fake_remove)
    monkeypatch.setattr(calendar_sync, "async_add", fake_add)
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20"})
    e.set_item_mark("todo.a", "u1", {"cal": {"entity": "calendar.x", "due": "2026-11-20", "summary": "Milch", "list": "A"}})
    asyncio.run(calendar_sync.async_follow(None, e, "todo.a", "u1", True))
    assert e.item_mark("todo.a", "u1")["cal"]["off"] is True
    asyncio.run(calendar_sync.async_follow(None, e, "todo.a", "u1", True))  # schon entfernt: nichts mehr
    asyncio.run(calendar_sync.async_follow(None, e, "todo.a", "u1", False))
    assert "off" not in e.item_mark("todo.a", "u1")["cal"]
    assert calls == [("remove", "calendar.x"), ("add", "calendar.x", "Milch", "2026-11-20")]


def test_next_due_of_a_repeating_item():
    from smartlists.extras import next_due

    assert next_due("2026-11-20", "weekly", "2026-11-20") == "2026-11-27"
    assert next_due("2026-11-20", "weekly", "2026-11-19") == "2026-11-27"   # früh abgehakt: trotzdem erst die Woche darauf
    assert next_due("2026-11-06", "weekly", "2026-11-20") == "2026-11-27"   # lange überfällig: nächster Termin nach heute
    assert next_due("2026-11-20T07:30", "daily", "2026-11-20") == "2026-11-21T07:30"
    assert next_due("2026-01-31", "monthly", "2026-01-31") == "2026-02-28"
    assert next_due("2026-12-15", "monthly", "2026-12-15") == "2027-01-15"


def test_repeating_item_gets_its_next_date_when_ticked_and_is_reopened(monkeypatch):
    from smartlists import calendar_sync

    e = _extras()
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20", "remind": True, "repeat": "weekly", "name": "Brötchen"})
    assert item_marks(e, "todo.a", "u1", today="2026-11-20")["repeat"] == "weekly"
    monkeypatch.setattr(calendar_sync.dt_util, "now", lambda: datetime(2026, 11, 20, 10, 0))
    asyncio.run(calendar_sync.async_follow(None, e, "todo.a", "u1", True))
    mark = e.item_mark("todo.a", "u1")
    assert mark["due"] == "2026-11-27" and mark["closed"] is True
    assert e.due_now(datetime(2026, 11, 27, 8, 0)) == []                       # abgehakt: zählt nicht als fällig
    assert e.to_reopen(datetime(2026, 11, 26, 23, 59)) == []
    assert [u for _, u, _ in e.to_reopen(datetime(2026, 11, 27, 0, 1))] == ["u1"]
    e.set_item_mark("todo.a", "u1", {"closed": False})
    assert [i["name"] for i in e.due_now(datetime(2026, 11, 27, 8, 0))] == ["Brötchen"]
    assert [u for _, u, _ in e.due_reminders(datetime(2026, 11, 27, 9, 0))] == ["u1"]   # und erinnert wieder


def test_quick_actions_from_a_notification():
    from smartlists import reminders

    e = _extras()
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20T18:00", "remind": True})
    token = e.mark_token("todo.a", "u1")
    assert token and e.mark_token("todo.a", "u1") == token
    assert e.mark_by_token(token)[:2] == ("todo.a", "u1") and e.mark_by_token("nope") is None
    assert reminders.later("2026-11-20T18:00") == "2026-11-21T18:00" and reminders.later("2026-12-31") == "2027-01-01"
    e.mark_reminded("todo.a", "u1")
    hass = types.SimpleNamespace(data={"smartlists": {"extras": e}})
    assert asyncio.run(reminders.async_handle_action(hass, reminders.ACTION_LATER + token)) is True
    mark = e.item_mark("todo.a", "u1")
    assert mark["due"] == "2026-11-21T18:00" and "sent" not in mark   # neuer Tag: es wird wieder erinnert
    assert asyncio.run(reminders.async_handle_action(hass, "SMARTLISTS_DONE_unknown")) is False


class _Event:
    def __init__(self, uid, summary, start, description="SmartLists · A"):
        self.uid, self.summary, self.start, self.description = uid, summary, start, description


class _Calendar:
    """Kalender-Entität zum Testen: merkt sich Termine, kann das Löschen verweigern."""

    def __init__(self, events, can_delete=True):
        self.events, self.can_delete, self.deleted = list(events), can_delete, []

    async def async_get_events(self, hass, start, end):
        return list(self.events)

    async def async_delete_event(self, uid):
        if not self.can_delete:
            raise RuntimeError("nicht erreichbar")
        self.deleted.append(uid)
        self.events = [e for e in self.events if e.uid != uid]


def _cal_hass(calendar, notes=None):
    async def call(domain, service, data, blocking=False):
        (notes if notes is not None else []).append((domain, service, data))

    return types.SimpleNamespace(data={"calendar": types.SimpleNamespace(get_entity=lambda entity_id: calendar)},
                                 services=types.SimpleNamespace(async_call=call), config=types.SimpleNamespace(language="de"))


def test_calendar_event_is_found_by_its_id_or_by_day_and_title(monkeypatch):
    from datetime import date, timezone

    from smartlists import calendar_sync

    monkeypatch.setattr(calendar_sync.dt_util, "get_default_time_zone", lambda: timezone.utc)

    cal = {"entity": "calendar.x", "due": "2026-11-20", "summary": "Bio-Bananen", "list": "A"}
    calendar = _Calendar([_Event("other", "Bio-Bananen", date(2026, 11, 20), description="von Hand"),      # fremder Termin: bleibt
                          _Event("e1", "Bio-Bananen", date(2026, 11, 20))])
    assert asyncio.run(calendar_sync.async_remove(_cal_hass(calendar), cal)) is True
    assert calendar.deleted == ["e1"]
    assert asyncio.run(calendar_sync.async_remove(_cal_hass(calendar), cal)) is True                       # schon weg: auch gut
    renamed = _Calendar([_Event("e2", "Bananen (umbenannt)", date(2026, 11, 20))])
    assert asyncio.run(calendar_sync.async_remove(_cal_hass(renamed), {**cal, "uid": "e2"})) is True       # über die Kennung
    assert renamed.deleted == ["e2"]


def test_calendar_event_that_could_not_be_removed_is_tried_again(monkeypatch):
    from datetime import date, timezone

    from smartlists import calendar_sync

    monkeypatch.setattr(calendar_sync.dt_util, "get_default_time_zone", lambda: timezone.utc)

    calendar = _Calendar([_Event("e1", "Bio-Bananen", date(2026, 11, 20))], can_delete=False)
    notes = []
    hass = _cal_hass(calendar, notes)
    e = _extras()
    e.set_item_mark("todo.a", "u1", {"due": "2026-11-20"})
    e.set_item_mark("todo.a", "u1", {"cal": {"entity": "calendar.x", "due": "2026-11-20", "summary": "Bio-Bananen", "list": "A", "uid": "e1"}})
    asyncio.run(calendar_sync.async_follow(hass, e, "todo.a", "u1", True))
    assert e.item_mark("todo.a", "u1")["cal"]["pending"] is True
    assert asyncio.run(calendar_sync.async_retry(hass, e)) == 0 and e.item_mark("todo.a", "u1")["cal"]["tries"] == 1
    calendar.can_delete = True
    assert asyncio.run(calendar_sync.async_retry(hass, e)) == 1
    assert calendar.deleted == ["e1"] and "pending" not in e.item_mark("todo.a", "u1")["cal"] and notes == []
    # bleibt es dabei, kommt nach RETRIES Versuchen eine Meldung
    calendar2 = _Calendar([_Event("e1", "Bio-Bananen", date(2026, 11, 20))], can_delete=False)
    hass2 = _cal_hass(calendar2, notes)
    e.set_item_mark("todo.a", "u1", {"cal": {"entity": "calendar.x", "due": "2026-11-20", "summary": "Bio-Bananen", "pending": True, "off": True}})
    for _ in range(calendar_sync.RETRIES):
        asyncio.run(calendar_sync.async_retry(hass2, e))
    assert len(notes) == 1 and notes[0][:2] == ("persistent_notification", "create")
    assert "pending" not in e.item_mark("todo.a", "u1")["cal"]
