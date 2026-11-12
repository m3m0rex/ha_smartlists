"""Eigene Listen: in SmartLists gespeichert, mit Besitzer und Freigaben.

Jede eigene Liste ist ein Unter-Eintrag (Typ „own_list“) mit
    owner:  HA-Benutzer-ID des Besitzers
    shares: {benutzer_id: rolle}

Rollen (aufsteigend):
    viewer  – sehen
    checker – sehen + abhaken
    editor  – alles an den Artikeln (hinzufügen, ändern, löschen, sortieren)
    owner   – wie editor + Freigaben ändern, Liste umbenennen/löschen

Durchgesetzt wird das bei jeder Änderung über den Benutzer der Anfrage (Context) – egal ob sie aus der
Karte, der App, der HA-To-do-Ansicht oder einem Sprachbefehl kommt. Automationen und Skripte ohne
Benutzer dürfen alles (sie hat ein Admin angelegt). Admins haben Besitzer-Rechte an allen Listen.

Grenze: Home Assistant zeigt jede To-do-Entität in seiner eigenen Oberfläche allen Benutzern an. Nur
SmartLists (Karte, Seite, App) blendet Listen aus, die nicht freigegeben sind.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

ROLES = ("viewer", "checker", "editor", "owner")
RANK = {r: i for i, r in enumerate(ROLES)}
CONF_OWNER = "owner"
CONF_SHARES = "shares"


def role_at_least(role: str | None, needed: str) -> bool:
    return role is not None and RANK.get(role, -1) >= RANK[needed]


def role_for(data: dict[str, Any], user_id: str | None, is_admin: bool) -> str | None:
    """Rolle eines Benutzers für eine eigene Liste (None = kein Zugriff)."""
    if user_id is None:
        return "owner"  # Automation/Skript/System
    if is_admin or data.get(CONF_OWNER) == user_id:
        return "owner"
    role = (data.get(CONF_SHARES) or {}).get(user_id)
    return role if role in ROLES else None


def permissions_for(role: str | None) -> dict[str, bool]:
    return {
        "view": role_at_least(role, "viewer"),
        "toggle": role_at_least(role, "checker"),
        "add": role_at_least(role, "editor"),
        "rename": role_at_least(role, "editor"),
        "delete": role_at_least(role, "editor"),
        "note": role_at_least(role, "editor"),
        "reorder": role_at_least(role, "editor"),
        "share": role_at_least(role, "owner"),
    }


async def async_user_info(hass: HomeAssistant, user_id: str | None) -> tuple[bool, str]:
    """(is_admin, Name) eines Benutzers; unbekannt/None → (False, "")."""
    if not user_id:
        return False, ""
    user = await hass.auth.async_get_user(user_id)
    if user is None:
        return False, ""
    return bool(user.is_admin), user.name or ""


async def async_household_users(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Echte Personen (keine System-/deaktivierten Benutzer) für die Freigabe-Auswahl."""
    users = await hass.auth.async_get_users()
    return sorted(
        ({"id": u.id, "name": u.name or u.id, "is_admin": u.is_admin} for u in users if u.is_active and not u.system_generated),
        key=lambda u: u["name"].casefold(),
    )
