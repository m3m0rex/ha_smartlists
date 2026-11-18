"""Knopf je Liste von SmartLists: „Erledigte entfernen“ – für Dashboards und Automationen (z. B. jeden Sonntag).

Neu angelegt ist der Knopf ausgeschaltet; wer ihn braucht, schaltet ihn am Gerät der Liste ein.
"""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    from .sensor import list_uniques

    wanted: set[str] = set()
    for unique, subentry_id in list_uniques(entry):
        button = ClearCompletedButton(unique)
        wanted.add(str(button.unique_id))
        async_add_entities([button], config_subentry_id=subentry_id)
    registry = er.async_get(hass)
    for ent in er.async_entries_for_config_entry(registry, entry.entry_id):
        if ent.domain == "button" and str(ent.unique_id).startswith("list_") and ent.unique_id not in wanted:
            registry.async_remove(ent.entity_id)


class ClearCompletedButton(ButtonEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "list_clear_completed"
    _attr_icon = "mdi:broom"
    _attr_entity_registry_enabled_default = False

    def __init__(self, unique: str) -> None:
        self._unique = unique
        self._attr_unique_id = f"list_{unique}_clear_completed"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, f"list_{unique}")})

    async def async_press(self) -> None:
        from . import lists

        entity_id = er.async_get(self.hass).async_get_entity_id("todo", DOMAIN, self._unique)
        if entity_id:
            await lists.clear_completed(self.hass, entity_id, self._context)
