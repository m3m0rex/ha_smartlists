"""Einrichtung über die Oberfläche (Einstellungen → Geräte & Dienste → Helfer)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er, selector

from .const import (
    CONF_DEFAULT_ADD,
    CONF_FOREIGN,
    CONF_MODE,
    CONF_SORT,
    CONF_SOURCE_LABEL,
    CONF_SOURCES,
    DOMAIN,
    LABEL_NONE,
    LABEL_PREFIX,
    LABEL_SUFFIX,
    MODE_BIDIRECTIONAL,
    MODE_LOCAL,
    SORT_ALPHABETICAL,
    SORT_CATEGORY,
    SORT_SOURCE,
    SORT_STATUS,
)

DEFAULTS: dict[str, Any] = {
    CONF_MODE: MODE_BIDIRECTIONAL,
    CONF_SOURCE_LABEL: LABEL_SUFFIX,
    CONF_SORT: SORT_SOURCE,
    CONF_FOREIGN: [],
}


def _todo_selector(multiple: bool) -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain="todo", multiple=multiple))


def _select(options: list[str], key: str) -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options,
            translation_key=key,
            mode=selector.SelectSelectorMode.LIST,
        )
    )


def _settings_schema() -> dict[Any, Any]:
    return {
        vol.Required(CONF_SOURCES): _todo_selector(True),
        vol.Optional(CONF_DEFAULT_ADD): _todo_selector(False),
        vol.Required(CONF_MODE, default=MODE_BIDIRECTIONAL): _select([MODE_BIDIRECTIONAL, MODE_LOCAL], "mode"),
        vol.Required(CONF_SOURCE_LABEL, default=LABEL_SUFFIX): _select(
            [LABEL_SUFFIX, LABEL_PREFIX, LABEL_NONE], "source_label"
        ),
        vol.Required(CONF_SORT, default=SORT_SOURCE): _select(
            [SORT_SOURCE, SORT_CATEGORY, SORT_STATUS, SORT_ALPHABETICAL], "sort"
        ),
        vol.Optional(CONF_FOREIGN, default=[]): _todo_selector(True),
    }


def _validate(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    sources: list[str] = data.get(CONF_SOURCES) or []
    if not sources:
        errors[CONF_SOURCES] = "no_sources"
        return errors
    registry = er.async_get(hass)
    for entity_id in sources:
        entry = registry.async_get(entity_id)
        if entry is not None and entry.platform == DOMAIN:
            # Kombinierte Listen dürfen nicht ineinander verschachtelt werden (Endlosschleifen).
            errors[CONF_SOURCES] = "nested_combined_list"
            return errors
    default_add = data.get(CONF_DEFAULT_ADD)
    if default_add and default_add not in sources:
        errors[CONF_DEFAULT_ADD] = "default_not_in_sources"
    foreign = data.get(CONF_FOREIGN) or []
    if any(f not in sources for f in foreign):
        errors[CONF_FOREIGN] = "foreign_not_in_sources"
    elif default_add and default_add in foreign:
        errors[CONF_DEFAULT_ADD] = "default_is_foreign"
    return errors


class SmartListsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Neue kombinierte Liste anlegen."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate(self.hass, user_input)
            if not errors:
                name = user_input.pop(CONF_NAME)
                return self.async_create_entry(title=name, data={}, options=user_input)

        schema = vol.Schema({vol.Required(CONF_NAME): selector.TextSelector(), **_settings_schema()})
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SmartListsOptionsFlow()


class SmartListsOptionsFlow(OptionsFlow):
    """Bestehende kombinierte Liste bearbeiten."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate(self.hass, user_input)
            if not errors:
                return self.async_create_entry(data=user_input)

        current = {**DEFAULTS, **self.config_entry.data, **self.config_entry.options}
        schema = self.add_suggested_values_to_schema(
            vol.Schema(_settings_schema()), user_input if user_input is not None else current
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)
