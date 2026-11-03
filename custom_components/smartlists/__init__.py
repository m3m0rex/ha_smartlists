"""SmartLists: kombinierte To-do-Listen für Home Assistant.

Jeder Konfigurationseintrag ist eine kombinierte Liste, die mehrere vorhandene To-do-Listen
(Einkaufsliste, Local To-do, Google Tasks, Bring!, …) zu einer gemeinsamen To-do-Entität
zusammenführt. Abhaken, Umbenennen und Löschen wirken je nach Modus direkt in der
Ursprungsliste; neue Artikel landen in der eingestellten Standard-Liste.

Haushaltsweit (unabhängig von einzelnen Listen): gemerkte Kategorien, Verlauf für Vorschläge,
Tag-Regeln (@REWE …) – siehe learning.py – und die Lovelace-Karte unter /smartlists/.
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import websocket
from .const import DOMAIN, STORAGE_VERSION
from .learning import async_get_learning

_LOGGER = logging.getLogger(__name__)
PLATFORMS: list[Platform] = [Platform.TODO]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
CARD_URL = f"/{DOMAIN}/smartlists-card.js"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Einmal pro HA-Start: Gedächtnis laden, WebSocket-Befehle und Karte bereitstellen."""
    await async_get_learning(hass)
    websocket.async_register(hass)
    await _async_register_card(hass)
    return True


async def _async_register_card(hass: HomeAssistant) -> None:
    """Karte automatisch laden – keine manuelle Dashboard-Ressource nötig.
    Die Version im URL-Parameter sorgt nach Updates für frisches Laden statt Browser-Cache."""
    path = Path(__file__).parent / "www" / "smartlists-card.js"
    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(path), True)])
    except RuntimeError:
        return  # bereits registriert (z.B. Neuladen der Integration)
    version = (await async_get_integration(hass, DOMAIN)).version
    add_extra_js_url(hass, f"{CARD_URL}?v={version}")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Kombinierte Liste einrichten."""
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Nach Änderung der Optionen neu laden."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Kombinierte Liste entfernen."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Gespeicherte lokale Häkchen beim Löschen der Liste mit entfernen."""
    from homeassistant.helpers.storage import Store

    await Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}").async_remove()
