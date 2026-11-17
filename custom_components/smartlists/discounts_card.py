"""Die Angebots-Karte (custom:smartdiscounts-card) ist ein eigenes Projekt und wird nicht mehr mitgeliefert.

Bis 4.0.0-beta.6 lag sie in SmartLists. Wer sie auf einem Dashboard benutzt oder eine Merkliste führt, braucht sie
weiterhin – dieses Modul erkennt das und sorgt für einen Hinweis unter Einstellungen → Reparaturen, bis die Karte über
HACS installiert ist. Gesucht wird nur in Dateien dieses Home Assistant; nach außen geht dabei nichts.
"""

from __future__ import annotations

from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN

REPO = "m3m0rex/ha_smartdiscounts-card"
REPO_URL = f"https://github.com/{REPO}"
CARD_TYPE = "custom:smartdiscounts-card"
ISSUE_ID = "discounts_card_missing"
_FOLDER = "ha_smartdiscounts-card"


def _installed(config_dir: str) -> bool:
    """HACS legt Dashboard-Karten unter www/community/<Repository>/ ab."""
    folder = Path(config_dir) / "www" / "community" / _FOLDER
    try:
        return folder.is_dir() and any(folder.glob("*.js"))
    except OSError:
        return False


def _on_a_dashboard(config_dir: str) -> bool:
    """Steht die Karte auf einem Dashboard? Durchsucht die gespeicherten Dashboards und ui-lovelace.yaml."""
    root = Path(config_dir)
    files = [*sorted((root / ".storage").glob("lovelace*")), root / "ui-lovelace.yaml"]
    for path in files:
        try:
            if path.is_file() and path.stat().st_size < 20_000_000 and CARD_TYPE in path.read_text(encoding="utf-8", errors="ignore"):
                return True
        except OSError:
            continue
    return False


async def async_status(hass: HomeAssistant) -> dict[str, bool]:
    """installed: über HACS vorhanden · wanted: wird benutzt (Dashboard oder Merkliste)."""
    config_dir = hass.config.config_dir
    installed = await hass.async_add_executor_job(_installed, config_dir)
    wanted = await hass.async_add_executor_job(_on_a_dashboard, config_dir)
    extras = hass.data.get(DOMAIN, {}).get("extras")
    if extras is not None and getattr(extras, "watch", None):
        wanted = True
    return {"installed": installed, "wanted": wanted}


async def async_check(hass: HomeAssistant) -> dict[str, bool]:
    """Hinweis anlegen oder entfernen."""
    status = await async_status(hass)
    if status["wanted"] and not status["installed"]:
        ir.async_create_issue(hass, DOMAIN, ISSUE_ID, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                              translation_key=ISSUE_ID, learn_more_url=REPO_URL,
                              translation_placeholders={"repo": REPO, "url": REPO_URL})
    else:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_ID)
    return status
