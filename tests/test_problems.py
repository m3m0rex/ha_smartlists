"""Harte Fehler mit Kennung."""

import types

from smartlists import problems


def test_problems_are_recorded_with_their_code_and_counted():
    hass = types.SimpleNamespace(data={})
    problems.report(hass, "SL-CAL-01", "calendar.familie")
    problems.report(hass, "SL-CAL-01", "calendar.familie")
    problems.report(hass, "SL-STORE-01", "smartlists.shares: kaputt")
    found = problems.current(hass)
    assert {p["code"]: p["count"] for p in found} == {"SL-CAL-01": 2, "SL-STORE-01": 1}
    assert next(p for p in found if p["code"] == "SL-STORE-01")["where"] == "settings"
    problems.clear(hass, "SL-CAL-01")
    assert [p["code"] for p in problems.current(hass)] == ["SL-STORE-01"]
    problems.clear(hass)
    assert problems.current(hass) == []


def test_only_the_last_ones_are_kept():
    hass = types.SimpleNamespace(data={})
    for i in range(problems.KEEP + 5):
        problems.report(hass, "SL-WS-01", f"cmd{i}: ValueError")
    assert len(problems.current(hass)) == problems.KEEP
