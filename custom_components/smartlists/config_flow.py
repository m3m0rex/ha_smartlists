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
    CONF_SOURCE_AS_PERSON,
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
    SUBENTRY_OWN,
)
from .learning import MENU_ACTIONS, Learning

DEFAULTS: dict[str, Any] = {
    CONF_MODE: MODE_BIDIRECTIONAL,
    CONF_SOURCE_LABEL: LABEL_SUFFIX,
    CONF_SORT: SORT_SOURCE,
    CONF_FOREIGN: [],
    CONF_SOURCE_AS_PERSON: True,
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
    "shop_untagged": False,
    "shop_auto_store": True,
}
OFF = "off"
TAG_FIELDS = {"store": "prefix_store", "person": "prefix_person", "tag": "prefix_tag"}


def _notes_ids(hass: HomeAssistant) -> list[str]:
    """Notizlisten der App – in Auswahlfeldern für Einkaufslisten nicht anbieten."""
    from .notes import looks_like_notes

    return sorted(s.entity_id for s in hass.states.async_all("todo")
                  if looks_like_notes(s.entity_id, s.attributes.get("friendly_name")))


def _todo_selector(multiple: bool, exclude: list[str] | None = None) -> selector.EntitySelector:
    cfg: dict[str, Any] = {"domain": "todo", "multiple": multiple}
    if exclude:
        cfg["exclude_entities"] = exclude
    return selector.EntitySelector(selector.EntitySelectorConfig(**cfg))


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
        """Einrichtungs-Assistent: optional gleich eine kombinierte Liste anlegen.
        Vorgeschlagen werden alle vorhandenen To-do-Listen; mit zwei oder mehr ausgewählten entsteht
        die erste kombinierte Liste direkt mit."""
        errors: dict[str, str] = {}
        notes = _notes_ids(self.hass)
        todo_ids = sorted(s.entity_id for s in self.hass.states.async_all("todo") if s.entity_id not in notes)
        if user_input is not None:
            combine = list(user_input.get("combine") or [])
            subentries = []
            if len(combine) == 1:
                errors["combine"] = "combine_two"
            elif combine:
                data = {CONF_SOURCES: combine, CONF_MODE: MODE_BIDIRECTIONAL, CONF_SOURCE_LABEL: LABEL_SUFFIX, CONF_SORT: SORT_CATEGORY,
                        CONF_FOREIGN: []}
                if user_input.get(CONF_DEFAULT_ADD) in combine:
                    data[CONF_DEFAULT_ADD] = user_input[CONF_DEFAULT_ADD]
                subentries.append({"subentry_type": SUBENTRY_COMBINED, "title": user_input.get(CONF_NAME) or "Einkauf",
                                   "data": data, "unique_id": None})
            if not errors:
                return self.async_create_entry(title="SmartLists", data={}, subentries=subentries)
        schema = vol.Schema(
            {
                vol.Optional("combine", default=todo_ids if 2 <= len(todo_ids) <= 4 else []): _todo_selector(True, notes),
                vol.Optional(CONF_NAME, default="Einkauf"): selector.TextSelector(),
                vol.Optional(CONF_DEFAULT_ADD): _todo_selector(False, notes),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors,
                                    description_placeholders={"count": str(len(todo_ids))})

    @classmethod
    @callback
    def async_get_supported_subentry_types(cls, config_entry: ConfigEntry) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_COMBINED: CombinedListSubentryFlow, SUBENTRY_OWN: OwnListSubentryFlow}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SmartListsOptionsFlow()


# ----------------------------------------------------------------------
# Kombinierte Liste (Unter-Eintrag)
# ----------------------------------------------------------------------
def combined_schema(exclude: list[str] | None = None) -> dict[Any, Any]:
    return {
        vol.Required(CONF_SOURCES): _todo_selector(True, exclude),
        vol.Optional(CONF_DEFAULT_ADD): _todo_selector(False, exclude),
        vol.Required(CONF_MODE, default=MODE_BIDIRECTIONAL): _select([MODE_BIDIRECTIONAL, MODE_LOCAL], "mode"),
        vol.Required(CONF_SOURCE_LABEL, default=LABEL_SUFFIX): _select(
            [LABEL_SUFFIX, LABEL_PREFIX, LABEL_NONE], "source_label"
        ),
        vol.Required(CONF_SORT, default=SORT_SOURCE): _select(
            [SORT_SOURCE, SORT_CATEGORY, SORT_STATUS, SORT_ALPHABETICAL], "sort"
        ),
        vol.Optional(CONF_FOREIGN, default=[]): _todo_selector(True, exclude),
        vol.Optional(CONF_SOURCE_AS_PERSON, default=True): selector.BooleanSelector(),
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
        schema = vol.Schema({vol.Required(CONF_NAME): selector.TextSelector(), **combined_schema(_notes_ids(self.hass))})
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
                # … und die Verknüpfung mit der App (Liste gehört zum Handy)
                keep = {k: v for k, v in subentry.data.items() if k.startswith("legacy_") or k in ("app_device", "app_list")}
                return self.async_update_and_abort(
                    self._get_entry(), subentry, title=name, data={**keep, **user_input}
                )
        current = {**DEFAULTS, **subentry.data, CONF_NAME: subentry.title}
        schema = self.add_suggested_values_to_schema(
            vol.Schema({vol.Required(CONF_NAME): selector.TextSelector(), **combined_schema(_notes_ids(self.hass))}),
            user_input if user_input is not None else current,
        )
        return self.async_show_form(step_id="reconfigure", data_schema=schema, errors=errors)


# ----------------------------------------------------------------------
# Eigene Liste (Unter-Eintrag) mit Besitzer und Freigaben
# ----------------------------------------------------------------------
class OwnListSubentryFlow(ConfigSubentryFlow):
    """Eigene Liste anlegen/bearbeiten: Name, Besitzer, wer sehen / abhaken / bearbeiten darf."""

    async def _schema(self, current: dict[str, Any]) -> vol.Schema:
        from .own import async_household_users

        users = await async_household_users(self.hass)
        opts = [selector.SelectOptionDict(value=u["id"], label=u["name"]) for u in users]

        def users_sel(multiple: bool) -> selector.SelectSelector:
            return selector.SelectSelector(selector.SelectSelectorConfig(options=opts, multiple=multiple, mode=selector.SelectSelectorMode.DROPDOWN))

        shares = current.get("shares") or {}
        by_role = {r: [u for u, role in shares.items() if role == r] for r in ("viewer", "checker", "editor")}
        return vol.Schema(
            {
                vol.Required(CONF_NAME, default=current.get(CONF_NAME, "")): selector.TextSelector(),
                vol.Required("owner", default=current.get("owner") or (self.context.get("user_id") or (users[0]["id"] if users else ""))): users_sel(False),
                vol.Optional("editors", default=by_role["editor"]): users_sel(True),
                vol.Optional("checkers", default=by_role["checker"]): users_sel(True),
                vol.Optional("viewers", default=by_role["viewer"]): users_sel(True),
            }
        )

    @staticmethod
    def _data(user_input: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        owner = user_input["owner"]
        shares: dict[str, str] = {}
        # höhere Rolle gewinnt, falls jemand mehrfach gewählt wurde
        for key, role in (("viewers", "viewer"), ("checkers", "checker"), ("editors", "editor")):
            for uid in user_input.get(key) or []:
                if uid != owner:
                    shares[uid] = role
        return user_input[CONF_NAME].strip(), {"owner": owner, "shares": shares}

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None and user_input.get(CONF_NAME, "").strip():
            title, data = self._data(user_input)
            return self.async_create_entry(title=title, data=data)
        return self.async_show_form(step_id="user", data_schema=await self._schema({}))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        if user_input is not None and user_input.get(CONF_NAME, "").strip():
            title, data = self._data(user_input)
            return self.async_update_and_abort(self._get_entry(), subentry, title=title, data=data)
        return self.async_show_form(step_id="reconfigure", data_schema=await self._schema({**subentry.data, CONF_NAME: subentry.title}))


# ----------------------------------------------------------------------
# Konfigurieren: Einstellungen für den ganzen Haushalt
# ----------------------------------------------------------------------
class SmartListsOptionsFlow(OptionsFlow):
    """Menü: Namenskonvention, Bedienung, gemerkte Kategorien.

    Gespeichert wird im Gedächtnis der Integration (dieselben Werte, die Admins auch im Zahnrad der
    Karte ändern können) – nicht in den Optionen des Eintrags, damit beide Wege dasselbe zeigen."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_show_menu(step_id="init", menu_options=["naming", "controls", "learned", "automation", "devices", "app_lists"])

    async def async_step_app_lists(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Kombinierte Listen aus der App übernehmen – sie gehören dann zum jeweiligen Handy-Gerät."""
        from . import app_lists

        rows = app_lists.describe(self.hass)
        if user_input is not None:
            for key in user_input.get("connect") or []:
                device_id, _, list_id = key.partition("/")
                try:
                    app_lists.connect(self.hass, device_id, list_id)
                except ValueError:
                    continue
            return self._done()
        open_rows = [r for r in rows if not r["connected"]]
        done = [r for r in rows if r["connected"]]
        listing = "\n".join(f"- {'✅' if r['connected'] else '➕'} **{r['name']}** ({r['device_name']}): "
                             f"{', '.join(r['sources'])}" for r in [*open_rows, *done]) or "—"
        options = [selector.SelectOptionDict(value=r["key"], label=f"{r['name']} – {r['device_name']}") for r in open_rows]
        schema = vol.Schema({vol.Optional("connect", default=[]): selector.SelectSelector(
            selector.SelectSelectorConfig(options=options, multiple=True, mode=selector.SelectSelectorMode.LIST))}) if options else vol.Schema({})
        return self.async_show_form(step_id="app_lists", data_schema=schema,
                                    description_placeholders={"count": str(len(rows)), "lists": listing})

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

    async def async_step_devices(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Verbundene Geräte (App-Installationen) ansehen und aus der Liste nehmen."""
        from datetime import datetime

        devices = self.hass.data[DOMAIN]["devices"]
        if user_input is not None:
            for device_id in user_input.get("remove", []):
                devices.remove(device_id)
            return self._done()
        entries = devices.entries()

        def ago(ts: int | None) -> str:
            if not ts:
                return "?"
            return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")

        lines = [
            f"• **{d['name']}** ({d.get('model') or '?'}) – {d.get('user_name') or '?'}, App {d.get('app_version') or '?'}, "
            f"Android {d.get('os_version') or '?'}, zuletzt {ago(d['last_seen'])}" + (" ⚠️" if d["stale"] else "")
            for d in entries
        ]
        fields: dict[Any, Any] = {}
        if entries:
            fields[vol.Optional("remove", default=[])] = selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[selector.SelectOptionDict(value=d["device_id"], label=f"{d['name']} ({d.get('user_name') or '?'})") for d in entries],
                    multiple=True,
                    mode=selector.SelectSelectorMode.LIST,
                )
            )
        return self.async_show_form(
            step_id="devices",
            data_schema=vol.Schema(fields),
            description_placeholders={"count": str(len(entries)), "devices": "\n".join(lines) or "–"},
        )

    async def async_step_automation(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Sprache & Automationen: Standard-Liste für Assist, fällige Artikel automatisch, Assist-Sätze."""
        from .automation import async_install_sentences

        learning = _learning(self.hass)
        if user_input is not None:
            learning.set_automation(
                {k: user_input.get(k) for k in ("voice_default_list", "auto_due_list")}
            )
            if user_input.get("install_sentences"):
                await async_install_sentences(self.hass)
            return self._done()
        cur = learning.automation
        fields: dict[Any, Any] = {}
        for key in ("voice_default_list", "auto_due_list"):
            fields[vol.Optional(key, description={"suggested_value": cur.get(key)})] = _todo_selector(False, _notes_ids(self.hass))
        fields[vol.Optional("install_sentences", default=False)] = selector.BooleanSelector()
        due = learning.due_items()
        return self.async_show_form(
            step_id="automation",
            data_schema=vol.Schema(fields),
            description_placeholders={
                "due": ", ".join(f"{d['name']} (alle {d['every_days']:g} Tage)" for d in due[:8]) or "–",
            },
        )
