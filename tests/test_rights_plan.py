import asyncio
import datetime as dt
import types

from smartlists.extras import Extras
from smartlists.learning import RIGHTS_DEFAULT, clamp_link


def test_clamp_link_limits_non_admins():
    rights = {**RIGHTS_DEFAULT, "share_max": "soft", "share_max_hours": 24}
    assert clamp_link(rights, "on", True, None) == ("soft", False, 24)  # höchstens soft, kein Hinzufügen, max 1 Tag
    assert clamp_link(rights, "off", False, 2) == ("off", False, 2)
    assert clamp_link(RIGHTS_DEFAULT, "on", True, None) == ("on", True, None)  # Standard: keine Grenzen


def test_rights_validation():
    from smartlists.learning import Learning
    from smartlists.categories import build_index, load_builtin_packs

    class _Hass:
        data = {}

    learning = Learning(_Hass(), build_index([load_builtin_packs()["de"]], "de"))
    asyncio.run(learning.async_load())
    learning.automation["rights"] = {"share_who": "everyone", "share_max": "soft", "templates": "ja", "prices": False}
    r = learning.rights()
    assert r["share_who"] == "owners"  # ungültig → Standard
    assert r["share_max"] == "soft" and r["templates"] is True and r["prices"] is False
    learning.set_automation({"voice_default_list": "todo.x"})  # darf Rechte nicht löschen
    assert learning.rights()["prices"] is False


def test_mealplan():
    e = Extras(types.SimpleNamespace(data={}))
    asyncio.run(e.async_load())
    tid = e.save_template(None, "Pfannkuchen", ["Mehl 250 g"], "🥞", 4)
    today = dt.date.today().isoformat()
    assert e.set_meals(today, [tid, "gibtsnicht", tid]) == [tid]
    assert e.meal_names(today) == ["🥞 Pfannkuchen"]
    week = e.plan(today, 7)
    assert len(week) == 7 and week[0]["templates"][0]["name"] == "Pfannkuchen" and not week[1]["templates"]
    e.set_meals(today, [])
    assert today not in e.mealplan
    try:
        e.set_meals("kein-datum", [tid])
        raise AssertionError("ValueError erwartet")
    except ValueError:
        pass


def test_mealie_ingredient_text():
    from smartlists.extras import ingredient_text

    assert ingredient_text({"display": "250 g  Mehl"}) == "250 g Mehl"
    assert ingredient_text({"food": {"name": "Eier"}, "quantity": 3, "unit": None}) == "Eier 3"
    assert ingredient_text({"food": {"name": "Milch"}, "quantity": 0.5, "unit": {"abbreviation": "l"}}) == "Milch 0.5 l"
    assert ingredient_text({"note": ""}) == ""


def test_notify_settings_own_changes():
    from smartlists.notify import validate

    assert validate({})["own"] is False
    s = validate({"service": "notify.mobile_app_pixel", "own": True, "quiet": [22, 7]})
    assert s["service"] == "mobile_app_pixel" and s["own"] is True and s["quiet"] == [22, 7]
