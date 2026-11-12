"""To-do-Plattform: die kombinierte Liste."""

from __future__ import annotations

import asyncio
from datetime import timedelta
import datetime
import logging
from typing import Any

from homeassistant.components.todo import (
    DOMAIN as TODO_DOMAIN,
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME, EVENT_CALL_SERVICE
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .categories import CategoryIndex
from .itemtext import join_offer, offer_summary, person_from_list_name, split_offer
from .learning import Learning
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
    LEGACY_UNIQUE_ID,
    SIGNAL_LEARNING_CHANGED,
    SUBENTRY_COMBINED,
    STORAGE_VERSION,
    UID_SEPARATOR,
)

_LOGGER = logging.getLogger(__name__)

SUFFIX_SEPARATOR = " · "
PREFIX_TEMPLATE = "[{}] "
# Fallback für Integrationen, die Änderungen ohne Zustandswechsel melden (z.B. reine Umbenennungen).
FALLBACK_REFRESH = timedelta(minutes=5)


def _status_text(status: Any) -> str | None:
    """TodoItemStatus oder str → "needs_action"/"completed" (None bleibt None)."""
    if status is None:
        return None
    return str(getattr(status, "value", status))


def list_key(subentry: ConfigSubentry) -> str:
    """Stabiler Schlüssel je kombinierter Liste (unique_id der Entität, Name der Speicherdatei).
    Nach der Migration aus 1.1 bleibt der alte Schlüssel, damit entity_id und Häkchen erhalten bleiben."""
    return str(subentry.data.get(LEGACY_UNIQUE_ID) or subentry.subentry_id)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Je kombinierter Liste (Unter-Eintrag) eine To-do-Entität."""
    learning: Learning = hass.data[DOMAIN]["learning"]
    for subentry in entry.subentries.values():
        if subentry.subentry_type != SUBENTRY_COMBINED:
            continue
        key = list_key(subentry)
        store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{key}")
        stored = await store.async_load() or {}
        async_add_entities(
            [CombinedTodoListEntity(hass, dict(subentry.data), subentry.title, key, store, stored, learning)],
            config_subentry_id=subentry.subentry_id,
        )


class CombinedTodoListEntity(TodoListEntity):
    """Fasst mehrere To-do-Listen zu einer zusammen."""

    _attr_should_poll = False
    _attr_icon = "mdi:format-list-checks"

    def __init__(
        self,
        hass: HomeAssistant,
        opts: dict[str, Any],
        title: str,
        unique_id: str,
        store: Store[dict[str, Any]],
        stored: dict[str, Any],
        learning: Learning,
    ) -> None:
        self.hass = hass
        self._store = store
        self._learning = learning
        self._categories: CategoryIndex = learning.categories
        self._sources: list[str] = list(opts.get(CONF_SOURCES, []))
        self._foreign: set[str] = set(opts.get(CONF_FOREIGN, []))
        self._default_add: str | None = opts.get(CONF_DEFAULT_ADD) or None
        self._mode: str = opts.get(CONF_MODE, MODE_BIDIRECTIONAL)
        self._label: str = opts.get(CONF_SOURCE_LABEL, LABEL_SUFFIX)
        self._sort: str = opts.get(CONF_SORT, SORT_SOURCE)
        self._source_as_person: bool = bool(opts.get(CONF_SOURCE_AS_PERSON, True))
        # Nur im Modus "lokal": abweichender Status je kombinierter UID.
        self._overrides: dict[str, str] = dict(stored.get("overrides", {}))
        # Zuordnung kombinierte UID -> (Quell-Entität, Quell-UID, Original-Name)
        self._index: dict[str, tuple[str, str, str]] = {}
        self._source_states: dict[str, dict[str, Any]] = {}
        # kombinierte UID → Beschreibung, wie sie in der Quelle steht (inkl. ⚙OFFER-Zeile der App)
        self._raw_desc: dict[str, str] = {}

        self._attr_unique_id = unique_id
        self._attr_name = title
        self._attr_todo_items = []
        self._refresh_debouncer = Debouncer(
            hass, _LOGGER, cooldown=0.5, immediate=False, function=self._async_refresh
        )

        features = TodoListEntityFeature.UPDATE_TODO_ITEM | TodoListEntityFeature.DELETE_TODO_ITEM
        if self._default_add:
            features |= TodoListEntityFeature.CREATE_TODO_ITEM
        features |= TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
        self._attr_supported_features = features

    # ------------------------------------------------------------------
    # Lebenszyklus
    # ------------------------------------------------------------------
    async def async_added_to_hass(self) -> None:
        """Auf Änderungen der Quell-Listen hören und erstmalig laden."""
        await super().async_added_to_hass()
        # für die Karte (lists.py) auffindbar machen
        registry: dict[str, CombinedTodoListEntity] = self.hass.data[DOMAIN].setdefault("entities", {})
        registry[self.entity_id] = self
        self.async_on_remove(lambda: registry.pop(self.entity_id, None))
        if self._sources:
            self.async_on_remove(
                async_track_state_change_event(self.hass, self._sources, self._async_source_changed)
            )
            # Umbenennen/Beschreibung ändern ändert den Zustand (= Anzahl offener Artikel) nicht –
            # deshalb zusätzlich auf todo-Dienstaufrufe für unsere Quell-Listen hören.
            self.async_on_remove(
                self.hass.bus.async_listen(EVENT_CALL_SERVICE, self._async_service_called)
            )
            self.async_on_remove(
                async_track_time_interval(self.hass, self._async_interval_refresh, FALLBACK_REFRESH)
            )
        self.async_on_remove(self._refresh_debouncer.async_shutdown)
        # Kategorie gemerkt / Tag-Regeln geändert → Sortierung und Attribute neu berechnen
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_LEARNING_CHANGED, self._async_learning_changed)
        )
        # Beim HA-Start können Quell-Listen noch fehlen – dann kommt der State-Change später.
        self.hass.async_create_task(self._async_refresh())

    @callback
    def _async_source_changed(self, event: Event[EventStateChangedData]) -> None:
        """Quell-Liste hat sich geändert (Zähler/Status) → neu laden."""
        self.hass.async_create_task(self._refresh_debouncer.async_call())

    @callback
    def _async_learning_changed(self) -> None:
        self.hass.async_create_task(self._refresh_debouncer.async_call())

    @callback
    def _async_service_called(self, event: Event[dict[str, Any]]) -> None:
        if event.data.get("domain") != TODO_DOMAIN:
            return
        targets = (event.data.get("service_data") or {}).get(ATTR_ENTITY_ID)
        if isinstance(targets, str):
            targets = [targets]
        if targets and any(t in self._sources for t in targets):
            self.hass.async_create_task(self._refresh_debouncer.async_call())

    async def _async_interval_refresh(self, _now: datetime.datetime) -> None:
        await self._refresh_debouncer.async_call()

    # ------------------------------------------------------------------
    # Für die Karte (lists.py)
    # ------------------------------------------------------------------
    def card_items(self) -> list[dict[str, Any]]:
        """Einträge mit Originaltext (ohne „· Anna“-Anhängsel), Quelle und Fremd-Kennzeichen."""
        out: list[dict[str, Any]] = []
        for item in self._attr_todo_items or []:
            if not item.uid or item.uid not in self._index:
                continue
            source, _source_uid, original = self._index[item.uid]
            out.append(
                {
                    "uid": item.uid,
                    "text": original,
                    "note": self._raw_desc.get(item.uid, item.description or ""),
                    "checked": item.status == TodoItemStatus.COMPLETED,
                    "source": self._source_name(source) if len(self._sources) > 1 else None,
                    "person": person_from_list_name(self._source_name(source), source) if self._source_as_person else None,
                    "foreign": source in self._foreign,
                }
            )
        return out

    @property
    def source_names(self) -> list[str]:
        return [self._source_name(s) for s in self._sources]

    @property
    def all_foreign(self) -> bool:
        return bool(self._sources) and all(s in self._foreign for s in self._sources)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        items = self._attr_todo_items or []
        done = sum(1 for i in items if i.status == TodoItemStatus.COMPLETED)
        return {
            # Kennung für die App: diese Liste von SmartLists als Kombinierte Liste anzeigen
            "smartlists_combined": True,
            "source_lists": self._sources,
            "foreign_lists": sorted(self._foreign),
            "default_add_list": self._default_add,
            "mode": self._mode,
            "open_items": len(items) - done,
            "completed_items": done,
            "unavailable_sources": [s for s in self._sources if s not in self._source_states],
            "open_by_category": self._open_by_category(items),
        }

    def _open_by_category(self, items: list[TodoItem]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for item in items:
            if item.status == TodoItemStatus.COMPLETED or not item.uid or item.uid not in self._index:
                continue
            category_id = self._learning.resolve_text(self._index[item.uid][2])
            counts[category_id] = counts.get(category_id, 0) + 1
        return {
            self._categories.label(cid): n
            for cid, n in sorted(counts.items(), key=lambda kv: self._categories.rank(kv[0]))
        }

    # ------------------------------------------------------------------
    # Laden
    # ------------------------------------------------------------------
    def _source_name(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is not None:
            return str(state.attributes.get(ATTR_FRIENDLY_NAME) or entity_id)
        return entity_id

    async def _async_fetch_source(self, entity_id: str) -> list[dict[str, Any]] | None:
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unavailable", "unknown"):
            return None
        try:
            response = await self.hass.services.async_call(
                TODO_DOMAIN,
                "get_items",
                {"entity_id": entity_id},
                blocking=True,
                return_response=True,
            )
        except (HomeAssistantError, ValueError) as err:
            _LOGGER.debug("Liste %s konnte nicht gelesen werden: %s", entity_id, err)
            return None
        data = (response or {}).get(entity_id) or {}
        items = data.get("items") if isinstance(data, dict) else None
        return list(items) if isinstance(items, list) else []

    def _display_description(self, combined_uid: str, raw: str | None) -> str | None:
        """Für die To-do-Ansicht von HA: ⚙OFFER-Zeile der App als lesbaren Text statt JSON."""
        self._raw_desc[combined_uid] = raw or ""
        clean, offer, raw_line = split_offer(raw)
        if not raw_line:
            return raw
        pretty = offer_summary(offer) if offer else ""
        return "\n".join(p for p in (clean, pretty) if p) or None

    def _display_summary(self, summary: str, source: str) -> str:
        if self._label == LABEL_NONE or len(self._sources) < 2:
            return summary
        name = self._source_name(source)
        if self._label == LABEL_PREFIX:
            return PREFIX_TEMPLATE.format(name) + summary
        return f"{summary}{SUFFIX_SEPARATOR}{name}"

    @staticmethod
    def _parse_due(raw: Any) -> datetime.date | datetime.datetime | None:
        if not raw or not isinstance(raw, str):
            return None
        if "T" in raw or " " in raw:
            parsed = dt_util.parse_datetime(raw)
            return dt_util.as_local(parsed) if parsed else None
        return dt_util.parse_date(raw)

    async def _async_refresh(self) -> None:
        results = await asyncio.gather(*(self._async_fetch_source(s) for s in self._sources))
        index: dict[str, tuple[str, str, str]] = {}
        per_source: list[list[TodoItem]] = []
        states: dict[str, dict[str, Any]] = {}
        for source, items in zip(self._sources, results, strict=True):
            if items is None:
                per_source.append([])
                continue
            states[source] = {"count": len(items)}
            converted: list[TodoItem] = []
            for raw in items:
                uid = raw.get("uid")
                summary = raw.get("summary") or ""
                if not uid:
                    continue
                combined_uid = f"{source}{UID_SEPARATOR}{uid}"
                status = TodoItemStatus(raw.get("status") or TodoItemStatus.NEEDS_ACTION)
                if self._mode == MODE_LOCAL and combined_uid in self._overrides:
                    status = TodoItemStatus(self._overrides[combined_uid])
                index[combined_uid] = (source, uid, summary)
                converted.append(
                    TodoItem(
                        uid=combined_uid,
                        summary=self._display_summary(summary, source),
                        status=status,
                        description=self._display_description(combined_uid, raw.get("description")),
                        due=self._parse_due(raw.get("due")),
                    )
                )
            per_source.append(converted)

        flat = [item for chunk in per_source for item in chunk]
        if self._sort == SORT_ALPHABETICAL:
            flat.sort(key=lambda i: (index[i.uid][2].casefold() if i.uid else ""))
        elif self._sort == SORT_CATEGORY:
            cats = self._categories
            resolve = self._learning.resolve_text
            flat.sort(
                key=lambda i: (
                    i.status == TodoItemStatus.COMPLETED,
                    cats.rank(resolve(index[i.uid][2])) if i.uid else 0,
                    index[i.uid][2].casefold() if i.uid else "",
                )
            )
        elif self._sort == SORT_STATUS:
            flat.sort(
                key=lambda i: (
                    i.status == TodoItemStatus.COMPLETED,
                    index[i.uid][2].casefold() if i.uid else "",
                )
            )

        # Lokale Häkchen für nicht mehr existierende Artikel aufräumen.
        stale = [uid for uid in self._overrides if uid not in index and uid.split(UID_SEPARATOR, 1)[0] in states]
        if stale:
            for uid in stale:
                self._overrides.pop(uid, None)
            self._save()

        self._index = index
        self._source_states = states
        self._attr_todo_items = flat
        self.async_write_ha_state()

    # ------------------------------------------------------------------
    # Änderungen
    # ------------------------------------------------------------------
    def _lookup(self, combined_uid: str | None) -> tuple[str, str, str]:
        if combined_uid and combined_uid in self._index:
            return self._index[combined_uid]
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="item_not_found", translation_placeholders={"uid": str(combined_uid)}
        )

    def _strip_label(self, summary: str, source: str) -> str:
        if self._label == LABEL_NONE or len(self._sources) < 2:
            return summary
        name = self._source_name(source)
        if self._label == LABEL_SUFFIX:
            suffix = f"{SUFFIX_SEPARATOR}{name}"
            if summary.endswith(suffix):
                return summary[: -len(suffix)]
        if self._label == LABEL_PREFIX:
            prefix = PREFIX_TEMPLATE.format(name)
            if summary.startswith(prefix):
                return summary[len(prefix) :]
        return summary

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"overrides": self._overrides}, 1.0)

    async def _call(self, service: str, data: dict[str, Any]) -> None:
        await self.hass.services.async_call(TODO_DOMAIN, service, data, blocking=True)

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Neuer Artikel → Standard-Hinzufügeliste."""
        if not self._default_add:
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="no_default_list")
        data: dict[str, Any] = {"entity_id": self._default_add, "item": item.summary or ""}
        if item.description:
            data["description"] = item.description
        await self._call("add_item", data)
        self._learning.record(item.summary or "")
        await self._async_refresh()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Abhaken / Umbenennen / Beschreibung ändern."""
        source, source_uid, original = self._lookup(item.uid)
        current = next((i for i in self._attr_todo_items or [] if i.uid == item.uid), None)

        data: dict[str, Any] = {"entity_id": source, "item": source_uid}
        new_summary = self._strip_label(item.summary or "", source) if item.summary is not None else original
        if new_summary and new_summary != original:
            if source in self._foreign:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="foreign_list")
            data["rename"] = new_summary
        if current is None or item.description != current.description:
            if item.description is not None:
                # lesbare Angebots-Zeile wieder gegen die originale ⚙OFFER-Zeile tauschen,
                # damit die App das Angebot weiter erkennt
                _, offer, raw_line = split_offer(self._raw_desc.get(item.uid))
                text = item.description
                if offer:
                    text = "\n".join(l for l in text.splitlines() if l.strip() != offer_summary(offer))
                data["description"] = join_offer(text, raw_line)

        # HA übergibt den Status je nach Version als TodoItemStatus oder als reinen Text ("completed")
        new_status = _status_text(item.status)
        status_changed = new_status is not None and (current is None or new_status != _status_text(current.status))
        if status_changed and self._mode == MODE_LOCAL:
            self._overrides[item.uid] = new_status  # type: ignore[index, assignment]
            self._save()
        elif status_changed:
            data["status"] = new_status

        if len(data) > 2:
            await self._call("update_item", data)
        await self._async_refresh()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Löschen – gruppiert je Quell-Liste. Fremde Listen sind geschützt."""
        grouped: dict[str, list[str]] = {}
        for uid in uids:
            source, source_uid, _ = self._lookup(uid)
            if source in self._foreign:
                raise ServiceValidationError(translation_domain=DOMAIN, translation_key="foreign_list")
            grouped.setdefault(source, []).append(source_uid)
            self._overrides.pop(uid, None)
        for source, items in grouped.items():
            await self._call("remove_item", {"entity_id": source, "item": items})
        self._save()
        await self._async_refresh()

