"""Einrichtung über Einstellungen → Geräte & Dienste → Integrationen → SmartLists.

- Die Integration wird EINMAL eingerichtet (single_config_entry).
- Kombinierte Listen sind Unter-Einträge: bei der Integration „Kombinierte Liste hinzufügen“,
  jede einzeln über ⋮ → „Neu konfigurieren“ änderbar.
- „Konfigurieren“ öffnet die Einstellungen für den ganzen Haushalt: Namenskonvention,
  Bedienung (Standard für alle) und gemerkte Kategorien. Persönliche Abweichungen je Benutzer
  bzw. Gerät stellt jeder selbst im Zahnrad der Karte ein.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er, selector

from . import itemtext
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
    SUBENTRY_COMBINED,
)
from .learning import MENU_ACTIONS, Learning

DEFAULTS: dict[str, Any] = {
    CONF_MODE: MODE_BIDIRECTIONAL,
    CONF_SOURCE_LABEL: LABEL_SUFFIX,
    CONF_SORT: SORT_SOURCE,
    CONF_FOREIGN: [],
}
# Bedienung: eingebaute Werte (gleich wie UI_DEFAULTS in der Karte)
UI_BUILTIN: dict[str, Any] = {
    "press_gesture": "long",
    "press_target": "row",
    "press_result": "menu",
    "menu_actions": list(MENU_ACTIONS),
    "row_buttons": True,
    "shop_hide_checked": True,
    "shop_keep_awake": True,
    "shop_large": True,
    "shop_tap_row": True,
}
OFF = "off"
TAG_FIELDS = {"store": "prefix_store", "person": "prefix_person", "tag": "prefix_tag"}


def _todo_selector(multiple: bool) -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain="todo", multiple=multiple))


def _select(options: list[str], key: str, multiple: bool = False, dropdown: bool = False) -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=options,
            translation_key=key,
            multiple=multiple,
            mode=selector.SelectSelectorMode.DROPDOWN if dropdown else selector.SelectSelectorMode.LIST,
        )
    )


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


# ----------------------------------------------------------------------
# Integration selbst
# ----------------------------------------------------------------------
class SmartListsConfigFlow(ConfigFlow, domain=DOMAIN):
    """SmartLists einmal einrichten."""

    VERSION = 2

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="SmartLists", data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @classmethod
    @callback
    def async_get_supported_subentry_types(cls, config_entry: ConfigEntry) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_COMBINED: CombinedListSubentryFlow}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SmartListsOptionsFlow()


# ----------------------------------------------------------------------
# Kombinierte Liste (Unter-Eintrag)
# ----------------------------------------------------------------------
def combined_schema() -> dict[Any, Any]:
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


def validate_combined(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, str]:
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


class CombinedListSubentryFlow(ConfigSubentryFlow):
    """Kombinierte Liste anlegen bzw. neu konfigurieren."""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_combined(self.hass, user_input)
            if not errors:
                name = user_input.pop(CONF_NAME)
                return self.async_create_entry(title=name, data=user_input)
        schema = vol.Schema({vol.Required(CONF_NAME): selector.TextSelector(), **combined_schema()})
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = validate_combined(self.hass, user_input)
            if not errors:
                name = user_input.pop(CONF_NAME)
                # interne Felder (z.B. legacy_unique_id aus der Migration) behalten
                keep = {k: v for k, v in subentry.data.items() if k.startswith("legacy_")}
                return self.async_update_and_abort(
                    self._get_entry(), subentry, title=name, data={**keep, **user_input}
                )
        current = {**DEFAULTS, **subentry.data, CONF_NAME: subentry.title}
        schema = self.add_suggested_values_to_schema(
            vol.Schema({vol.Required(CONF_NAME): selector.TextSelector(), **combined_schema()}),
            user_input if user_input is not None else current,
        )
        return self.async_show_form(step_id="reconfigure", data_schema=schema, errors=errors)


# ----------------------------------------------------------------------
# Konfigurieren: Einstellungen für den ganzen Haushalt
# ----------------------------------------------------------------------
class SmartListsOptionsFlow(OptionsFlow):
    """Menü: Namenskonvention, Bedienung, gemerkte Kategorien.

    Gespeichert wird im Gedächtnis der Integration (dieselben Werte, die Admins auch im Zahnrad der
    Karte ändern können) – nicht in den Optionen des Eintrags, damit beide Wege dasselbe zeigen."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_show_menu(step_id="init", menu_options=["naming", "controls", "learned"])

    def _done(self) -> ConfigFlowResult:
        # Optionen unverändert lassen → kein unnötiges Neuladen der Integration
        return self.async_create_entry(data=dict(self.config_entry.options))

    async def async_step_naming(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Namenskonvention: welches Zeichen macht aus einem Wort welches Badge."""
        learning = _learning(self.hass)
        errors: dict[str, str] = {}
        if user_input is not None:
            rules = [
                {"prefix": user_input[field], "kind": kind}
                for kind, field in TAG_FIELDS.items()
                if user_input.get(field, OFF) != OFF
            ]
            try:
                learning.set_tag_rules(rules)
            except ValueError:
                errors["base"] = "duplicate_prefix"
            else:
                return self._done()
        current = {r["kind"]: r["prefix"] for r in learning.tag_rules}
        # feste Beschriftungen: Übersetzungs-Schlüssel dürfen kein "@" enthalten
        prefix_select = selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=[
                    selector.SelectOptionDict(value=OFF, label="—"),
                    *(selector.SelectOptionDict(value=c, label=c) for c in itemtext.ALLOWED_PREFIXES),
                ],
                mode=selector.SelectSelectorMode.DROPDOWN,
            )
        )
        schema = vol.Schema(
            {vol.Required(field, default=current.get(kind, OFF)): prefix_select for kind, field in TAG_FIELDS.items()}
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="naming", data_schema=schema, errors=errors)

    async def async_step_controls(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Bedienung – Standard für alle, die nichts Eigenes eingestellt haben."""
        learning = _learning(self.hass)
        if user_input is not None:
            # Nur speichern, was vom eingebauten Wert abweicht → spätere Verbesserungen wirken weiter
            changed = {k: v for k, v in user_input.items() if UI_BUILTIN.get(k) != v}
            learning.set_ui_defaults(changed, "")
            return self._done()
        cur = {**UI_BUILTIN, **learning.ui_defaults}
        schema = vol.Schema(
            {
                vol.Required("press_gesture", default=cur["press_gesture"]): _select(
                    ["long", "double", "right", "off"], "press_gesture", dropdown=True
                ),
                vol.Required("press_target", default=cur["press_target"]): _select(["row", "name"], "press_target"),
                vol.Required("press_result", default=cur["press_result"]): _select(
                    ["menu", "edit", "delete"], "press_result"
                ),
                vol.Required("menu_actions", default=cur["menu_actions"]): _select(
                    list(MENU_ACTIONS), "menu_actions", multiple=True
                ),
                vol.Required("row_buttons", default=cur["row_buttons"]): selector.BooleanSelector(),
                vol.Required("shop_hide_checked", default=cur["shop_hide_checked"]): selector.BooleanSelector(),
                vol.Required("shop_keep_awake", default=cur["shop_keep_awake"]): selector.BooleanSelector(),
                vol.Required("shop_large", default=cur["shop_large"]): selector.BooleanSelector(),
                vol.Required("shop_tap_row", default=cur["shop_tap_row"]): selector.BooleanSelector(),
            }
        )
        return self.async_show_form(step_id="controls", data_schema=schema)

    async def async_step_learned(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Gemerkte Kategorien ansehen und einzelne vergessen; Verlauf zurücksetzen."""
        learning = _learning(self.hass)
        if user_input is not None:
            for word in user_input.get("forget", []):
                learning.forget(word)
            if user_input.get("clear_history"):
                learning.clear_history()
            return self._done()
        learned = learning.learned_list()
        options = [
            selector.SelectOptionDict(value=entry["word"], label=f'{entry["word"]} → {entry["label"]}')
            for entry in learned
        ]
        fields: dict[Any, Any] = {}
        if options:
            fields[vol.Optional("forget", default=[])] = selector.SelectSelector(
                selector.SelectSelectorConfig(options=options, multiple=True, mode=selector.SelectSelectorMode.LIST)
            )
        fields[vol.Optional("clear_history", default=False)] = selector.BooleanSelector()
        return self.async_show_form(
            step_id="learned",
            data_schema=vol.Schema(fields),
            description_placeholders={"count": str(len(learned)), "history": str(len(learning.history))},
        )
