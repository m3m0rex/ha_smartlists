"""Notizlisten der HA-SmartLists-App (todo.ha_smartlists_note…).

Die App speichert ihre Notizen als eigene To-do-Liste in Home Assistant. In SmartLists (Karte, Seite,
Assist, Dienste, kombinierte Listen) sind das keine Einkaufslisten – sie werden deshalb standardmäßig
ausgeblendet. Admins können sie unter Haushalt → Notizen als eigenen Bereich einblenden.

Notizen sind an ein Konto gebunden: Standardmäßig sieht eine Notizliste nur ihr Besitzer. Den Besitzer
meldet die App beim Anmelden (smartlists/register_device mit notes_lists); Admins können ihn ändern.
Notizlisten ohne bekannten Besitzer sehen nur Admins. Optional: „für den ganzen Haushalt“.

Grenze: Home Assistant selbst (To-do-Ansicht, Dienste) zeigt jede To-do-Entität allen Benutzern. Die
App blendet ihre Notizliste dort zusätzlich aus (hidden_by).
"""

from __future__ import annotations

from typing import Any

from homeassistant.const import ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.notes"
# Entity-Ids der App: todo.ha_smartlists_note, …_note_2, ältere todo.ha_smartlists_note_<name>/notiz_<name>
_PREFIXES = ("ha_smartlists_note", "notiz_")
_PRETTY = "ha smartlists notes"
MODES = ("hidden", "section")
SCOPES = ("owner", "household")


def looks_like_notes(entity_id: str, friendly_name: str | None = None) -> bool:
    object_id = entity_id.split(".", 1)[-1].lower()
    if any(object_id.startswith(p) for p in _PREFIXES):
        return True
    return bool(friendly_name) and str(friendly_name).strip().lower().startswith(_PRETTY)


class Notes:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.mode = "hidden"
        self.scope = "owner"
        self.owners: dict[str, str] = {}

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.mode = data.get("mode") if data.get("mode") in MODES else "hidden"
        self.scope = data.get("scope") if data.get("scope") in SCOPES else "owner"
        self.owners = dict(data.get("owners") or {})

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"mode": self.mode, "scope": self.scope, "owners": self.owners}, 1.0)
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        from .const import SIGNAL_DATA_CHANGED

        if hasattr(self.hass, "loop"):
            async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGED)

    def is_notes(self, entity_id: str) -> bool:
        state = self.hass.states.get(entity_id)
        return looks_like_notes(entity_id, state.attributes.get(ATTR_FRIENDLY_NAME) if state else None)

    def can_see(self, entity_id: str, user: Any | None) -> bool:
        """Darf `user` diese Notizliste sehen/ändern? (Andere Listen: immer True.)"""
        if not self.is_notes(entity_id):
            return True
        if user is None:  # interne Aufrufe ohne Benutzer (z.B. Dienste) bekommen Notizen nie
            return False
        if self.scope == "household":
            return True
        owner = self.owners.get(entity_id)
        if owner:
            return owner == user.id
        return bool(user.is_admin)

    def shown(self, entity_id: str, user: Any | None) -> bool:
        """Erscheint die Liste in SmartLists-Übersichten (Listen-Auswahl, Seite)?"""
        if not self.is_notes(entity_id):
            return True
        return self.mode == "section" and self.can_see(entity_id, user)

    def entity_ids(self) -> list[str]:
        return sorted(s.entity_id for s in self.hass.states.async_all("todo") if self.is_notes(s.entity_id))

    @callback
    def claim(self, entity_ids: list[str], user_id: str) -> None:
        """Von der App gemeldete Notizlisten: Besitzer setzen, wenn noch keiner bekannt ist."""
        changed = False
        for eid in entity_ids:
            if eid.startswith("todo.") and eid not in self.owners and looks_like_notes(eid):
                self.owners[eid] = user_id
                changed = True
        if changed:
            self._save()

    @callback
    def update(self, mode: str | None = None, scope: str | None = None, owners: dict[str, str | None] | None = None) -> None:
        if mode is not None:
            if mode not in MODES:
                raise ValueError(f"mode: {', '.join(MODES)}")
            self.mode = mode
        if scope is not None:
            if scope not in SCOPES:
                raise ValueError(f"scope: {', '.join(SCOPES)}")
            self.scope = scope
        for eid, uid in (owners or {}).items():
            if uid:
                self.owners[eid] = uid
            else:
                self.owners.pop(eid, None)
        self._save()

    def describe(self) -> dict[str, Any]:
        lists = []
        for eid in self.entity_ids():
            state = self.hass.states.get(eid)
            lists.append({"entity_id": eid, "name": state.attributes.get(ATTR_FRIENDLY_NAME, eid) if state else eid,
                          "owner_id": self.owners.get(eid)})
        return {"mode": self.mode, "scope": self.scope, "lists": lists}


async def async_get_notes(hass: HomeAssistant) -> Notes:
    data = hass.data.setdefault(DOMAIN, {})
    if "notes" not in data:
        notes = Notes(hass)
        await notes.async_load()
        data["notes"] = notes
    return data["notes"]


def get_notes(hass: HomeAssistant) -> Notes | None:
    return hass.data.get(DOMAIN, {}).get("notes")
