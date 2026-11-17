"""Die Angebots-Karte ist ein eigenes Projekt: SmartLists liefert sie nicht mehr aus und weist darauf hin."""

import asyncio
import json
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PKG = ROOT / "custom_components" / "smartlists"
CASES = ROOT / "tests" / "cases" / "offers.json"


def test_card_is_not_shipped_any_more():
    assert not (PKG / "www" / "smartdiscounts-card.js").exists()
    assert "smartdiscounts-card.js" not in (PKG / "__init__.py").read_text(encoding="utf-8")


def test_offer_matching_cases_shared_with_the_card():
    """Dieselben Fälle liegen im Repository der Karte – beide Seiten müssen gleich rechnen."""
    from smartlists.offers import matches, num

    cases = json.loads(CASES.read_text(encoding="utf-8"))
    assert [matches(a, b) for a, b, _ in cases["matches"]] == [want for *_, want in cases["matches"]]
    assert [num(v) for v, _ in cases["num"]] == [want for _, want in cases["num"]]


def test_hint_only_when_used_and_missing(tmp_path):
    created, deleted = [], []
    ir = types.ModuleType("homeassistant.helpers.issue_registry")
    ir.IssueSeverity = types.SimpleNamespace(WARNING="warning")
    ir.async_create_issue = lambda hass, domain, issue_id, **kw: created.append((issue_id, kw.get("learn_more_url")))
    ir.async_delete_issue = lambda hass, domain, issue_id: deleted.append(issue_id)
    sys.modules["homeassistant.helpers.issue_registry"] = ir
    sys.modules["homeassistant.helpers"].issue_registry = ir
    sys.modules.pop("smartlists.discounts_card", None)
    from smartlists import discounts_card as dc
    from smartlists.const import DOMAIN

    async def job(func, *args):
        return func(*args)

    def hass(watch):
        return types.SimpleNamespace(config=types.SimpleNamespace(config_dir=str(tmp_path)), async_add_executor_job=job,
                                     data={DOMAIN: {"extras": types.SimpleNamespace(watch=watch)}})

    # nichts benutzt → kein Hinweis
    assert asyncio.run(dc.async_check(hass([]))) == {"installed": False, "wanted": False}
    assert not created and deleted == [dc.ISSUE_ID]
    # Merkliste geführt → Hinweis mit Verweis auf das Repository
    assert asyncio.run(dc.async_check(hass(["Kaffee"])))["wanted"] is True
    assert created == [(dc.ISSUE_ID, "https://github.com/m3m0rex/ha_smartdiscounts-card")]
    # Karte auf einem Dashboard → ebenfalls
    created.clear()
    (tmp_path / ".storage").mkdir()
    (tmp_path / ".storage" / "lovelace.dashboard_einkauf").write_text('{"cards":[{"type":"custom:smartdiscounts-card"}]}', encoding="utf-8")
    assert asyncio.run(dc.async_check(hass([])))["wanted"] is True and len(created) == 1
    # über HACS installiert → Hinweis verschwindet
    created.clear()
    deleted.clear()
    folder = tmp_path / "www" / "community" / "ha_smartdiscounts-card"
    folder.mkdir(parents=True)
    (folder / "ha_smartdiscounts-card.js").write_text("//", encoding="utf-8")
    assert asyncio.run(dc.async_check(hass(["Kaffee"]))) == {"installed": True, "wanted": True}
    assert not created and deleted == [dc.ISSUE_ID]
