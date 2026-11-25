"""Öffentliche Adresse für Teilen-Links.

Teilen-Seite und Teilen-API laufen immer über Home Assistant selbst: shares.py registriert
/smartlists-share/{token} und /api/smartlists/share/{token} als Views ohne Anmeldung (nur mit 256-Bit-Schlüssel).
Hier wird nur festgelegt, mit welcher Adresse neue Links gebaut werden:

- "ha":    externe Adresse von Home Assistant (baut die Karte).
- "proxy": eigene Adresse, z. B. ein Reverse-Proxy oder das Cloudflared-Add-on. Der Proxy leitet nur die beiden
           Teilen-Pfade (SHARE_PATHS) an Home Assistant weiter – wer den Link bekommt, erfährt die Adresse von Home
           Assistant nicht.

SmartLists startet dafür keine Programme und keinen eigenen Webserver. Bis 4.0.4 gab es "tunnel"/"named"
(cloudflared von SmartLists gestartet) und einen eigenen Server auf Port 8126; gespeicherte Einstellungen werden
beim Laden umgestellt (siehe async_load).
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlsplit

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.storage import Store

from . import storage
from .const import DOMAIN, SIGNAL_DATA_CHANGED

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = storage.key("public")
MODES = ("ha", "proxy")
# bis 4.0.4: Quick Tunnel bzw. benannter Tunnel, beide über ein von SmartLists gestartetes cloudflared
_LEGACY_MODES = ("tunnel", "named")
# Pfade, die ein Proxy an Home Assistant weiterleiten muss
SHARE_PATHS = ("/smartlists-share/", "/api/smartlists/share/")
ISSUE_MOVED = "public_share_moved"


def normalize_url(url: str) -> str:
    """Eigene Adresse prüfen: nur http(s), ohne Query, Fragment oder Zugangsdaten."""
    url = (url or "").strip().rstrip("/")
    if not url:
        return ""
    parts = urlsplit(url)
    if parts.scheme not in ("https", "http") or not parts.hostname:
        raise ValueError("Adresse muss mit https:// beginnen, z. B. https://liste.example.org")
    if parts.username or parts.password or parts.query or parts.fragment:
        raise ValueError("Adresse ohne Benutzername, Passwort, ? oder #")
    return url


class PublicShare:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.mode = "ha"
        self.url = ""  # eigene Adresse (nur bei "proxy")
        # gespeicherte Art vor der Umstellung, wenn deren Ziel nicht mehr existiert (Tunnel bzw. Port 8126)
        self.moved_from: str | None = None

    def _data(self) -> dict[str, Any]:
        return {"mode": self.mode, "url": self.url}

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        old = data.get("mode")
        url = str(data.get("url") or "")
        if old in MODES:
            self.mode, self.url = old, url
        elif old in _LEGACY_MODES:
            # Eigene Adresse bleibt gewählt: ein Quick Tunnel hatte keine feste Adresse, dann gibt es bis zur
            # Eingabe keinen Link – statt eines Links mit der Adresse von Home Assistant
            self.mode, self.url = "proxy", url if old == "named" else ""
        if old in _LEGACY_MODES or (old == "proxy" and "port" in data):
            self.moved_from = old
        if "token" in data or "port" in data:
            # Tunnel-Token und Port des alten Servers nicht weiter aufbewahren
            await self._store.async_save(self._data())

    def report_moved(self) -> None:
        """Hinweis unter Reparaturen: Tunnel/Proxy muss jetzt auf Home Assistant zeigen. Bleibt bis zum Speichern."""
        if self.moved_from is None:
            return
        ir.async_create_issue(self.hass, DOMAIN, ISSUE_MOVED, is_fixable=False, is_persistent=True,
                              severity=ir.IssueSeverity.WARNING, translation_key=ISSUE_MOVED,
                              translation_placeholders={"paths": ", ".join(SHARE_PATHS)})
        _LOGGER.warning("SmartLists: der eingebaute Tunnel und der eigene Teilen-Server (Port 8126) wurden entfernt. "
                        "Tunnel oder Proxy bitte auf Home Assistant zeigen lassen (nur %s).", ", ".join(SHARE_PATHS))

    def _changed(self) -> None:
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        if hasattr(self.hass, "loop"):
            async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGED)

    # ------------------------------------------------------------------ Einstellungen
    async def async_update(self, mode: str | None = None, url: str | None = None) -> dict[str, Any]:
        if mode is not None and mode not in MODES:
            raise ValueError(f"mode: {', '.join(MODES)}")
        if url is not None:
            url = normalize_url(url)
        new_mode = mode or self.mode
        new_url = self.url if url is None else url
        if new_mode == "proxy" and not new_url:
            raise ValueError("Für einen eigenen Proxy bitte die öffentliche Adresse eintragen.")
        self.mode, self.url = new_mode, new_url
        self._store.async_delay_save(self._data, 1.0)
        if self.moved_from is not None:
            self.moved_from = None
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_MOVED)
        self._changed()
        return self.status()

    def base_url(self) -> str | None:
        """Adresse für neue Links. None = Adresse von Home Assistant (baut die Karte). ValueError, wenn eine eigene
        Adresse gewählt, aber nicht eingetragen ist – dann lieber kein Link als einer mit der HA-Adresse."""
        if self.mode == "ha":
            return None
        if not self.url:
            raise ValueError("Keine öffentliche Adresse eingetragen (Teilen und Rechte → Öffentliche Adresse).")
        return self.url

    def status(self) -> dict[str, Any]:
        return {"mode": self.mode, "url": self.url, "paths": list(SHARE_PATHS), "moved_from": self.moved_from}


async def async_get_public(hass: HomeAssistant) -> PublicShare:
    data = hass.data.setdefault(DOMAIN, {})
    if "public" not in data:
        public = PublicShare(hass)
        await public.async_load()
        public.report_moved()
        data["public"] = public
    return data["public"]
