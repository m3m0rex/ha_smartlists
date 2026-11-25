"""Öffentliche Adresse für Links: eigene Adresse prüfen, nie stiller Rückfall auf die HA-Adresse, alte Einstellungen
(eingebauter Tunnel, eigener Server auf Port 8126) werden umgestellt. SmartLists startet keine Programme und keinen
eigenen Server."""

import asyncio
import inspect
import types

import pytest

from smartlists import public as public_mod
from smartlists.public import SHARE_PATHS, PublicShare, normalize_url


def test_normalize_url():
    assert normalize_url(" https://liste.example.org/ ") == "https://liste.example.org"
    assert normalize_url("https://example.org/smartlists") == "https://example.org/smartlists"
    assert normalize_url("") == ""
    for bad in ("ftp://x.org", "liste.example.org", "https://user:pw@x.org", "https://x.org/?a=1", "javascript:alert(1)"):
        with pytest.raises(ValueError):
            normalize_url(bad)


def _public(mode, **kw):
    hass = types.SimpleNamespace(data={}, config=types.SimpleNamespace(config_dir="/config"))
    p = PublicShare(hass)
    p.mode = mode
    for k, v in kw.items():
        setattr(p, k, v)
    return p


def test_base_url_never_falls_back_to_ha_address():
    assert _public("ha").base_url() is None
    with pytest.raises(ValueError):
        _public("proxy").base_url()  # eigene Adresse gewählt, aber nicht eingetragen → kein Link
    assert _public("proxy", url="https://liste.example.org").base_url() == "https://liste.example.org"


def test_update_validates_and_saves():
    p = _public("ha")
    with pytest.raises(ValueError):
        asyncio.run(p.async_update(mode="proxy"))  # ohne Adresse
    for gone in ("tunnel", "named"):
        with pytest.raises(ValueError):
            asyncio.run(p.async_update(mode=gone, url="https://liste.example.org"))
    assert p.mode == "ha"
    status = asyncio.run(p.async_update(mode="proxy", url="https://liste.example.org/"))
    assert (p.mode, p.url) == ("proxy", "https://liste.example.org")
    assert p._store.saved == {"mode": "proxy", "url": "https://liste.example.org"}
    assert status == {"mode": "proxy", "url": "https://liste.example.org", "paths": list(SHARE_PATHS), "moved_from": None}


@pytest.mark.parametrize(("stored", "mode", "url", "moved"), [
    # Quick Tunnel: keine feste Adresse → eigene Adresse ohne Eintrag (kein Link, bis sie eingetragen ist)
    ({"mode": "tunnel", "port": 8126, "url": "", "token": ""}, "proxy", "", "tunnel"),
    # benannter Tunnel: Adresse bleibt, der Token wird nicht weiter aufbewahrt
    ({"mode": "named", "port": 8126, "url": "https://liste.example.org", "token": "eyJ" + "A" * 60}, "proxy", "https://liste.example.org", "named"),
    # eigener Proxy zeigte auf Port 8126 → muss jetzt auf Home Assistant zeigen
    ({"mode": "proxy", "port": 8200, "url": "https://liste.example.org", "token": ""}, "proxy", "https://liste.example.org", "proxy"),
    ({"mode": "ha", "port": 8126, "url": "", "token": ""}, "ha", "", None),
])
def test_old_settings_are_moved(stored, mode, url, moved):
    p = _public("ha")

    async def load():
        return dict(stored)

    p._store.async_load = load
    asyncio.run(p.async_load())
    assert (p.mode, p.url, p.moved_from) == (mode, url, moved)
    assert p._store.saved == {"mode": mode, "url": url}  # ohne Token und Port wieder gespeichert
    p.report_moved()  # Hinweis unter Reparaturen (Platzhalter in den Tests)
    if moved:
        asyncio.run(p.async_update(mode="ha"))  # einmal speichern → Hinweis erledigt
        assert p.moved_from is None


def test_current_settings_load_unchanged():
    p = _public("ha")

    async def load():
        return {"mode": "proxy", "url": "https://liste.example.org"}

    p._store.async_load = load
    asyncio.run(p.async_load())
    assert (p.mode, p.url, p.moved_from, p._store.saved) == ("proxy", "https://liste.example.org", None, None)


def test_no_programs_and_no_own_server():
    """Die Integration startet kein cloudflared (oder sonst etwas) und öffnet keinen eigenen Port."""
    source = inspect.getsource(public_mod)
    for forbidden in ("subprocess", "os.chmod", "TCPSite", "AppRunner", "0.0.0.0", "shutil.which"):
        assert forbidden not in source, forbidden


def test_share_link_update_keeps_address():
    """4.0: Rechte, Laufzeit und Passwort eines Links lassen sich nachträglich ändern – der Link bleibt gleich."""
    import types

    from smartlists import shares
    from smartlists.shares import Shares

    sh = Shares(types.SimpleNamespace(data={}))
    r = sh.create("todo.a", "u1", "off", False, 24)
    h = next(iter(sh.links))
    out = sh.update(r["id"], "todo.a", check="soft", add=True, approve=True, notes=True, hours=None, password="geheim")
    assert next(iter(sh.links)) == h and out["id"] == r["id"]  # derselbe Link
    assert (out["check"], out["add"], out["approve"], out["notes"], out["expires"], out["password"]) == ("soft", True, True, True, None, True)
    assert shares.check_password(sh.links[h], "geheim")
    # nichts angegeben → alles bleibt; Passwort "" entfernt den Schutz; ohne „hinzufügen“ keine Freigabe-Pflicht
    assert sh.update(r["id"], "todo.a")["password"] is True
    out = sh.update(r["id"], "todo.a", add=False, password="")
    assert out["password"] is False and out["approve"] is False and "pw" not in sh.links[h]
    assert sh.update(r["id"], "todo.b", check="on") is None and sh.update("x" * 16, "todo.a") is None
