"""Listen lesen und ändern – für die Karte (und später die App).

Funktioniert mit
  - kombinierten SmartLists-Listen: Originaltext ohne Herkunfts-Anhängsel, Quelle je Artikel,
    fremde Quellen nur abhakbar
  - jeder anderen To-do-Liste in HA (Einkaufsliste, Local To-do, Google Tasks, Bring!, …):
    erlaubt ist, was die Liste selbst unterstützt (supported_features).

Alle Änderungen laufen über die normalen todo-Dienste. Damit gelten dieselben Regeln wie überall
in HA, und der Verlauf/die Protokolle zeigen, wer was geändert hat.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN, TodoListEntityFeature
from homeassistant.const import ATTR_FRIENDLY_NAME, ATTR_SUPPORTED_FEATURES
from homeassistant.core import Context, HomeAssistant
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .const import DOMAIN
from .learning import Learning

STATUS_DONE = "completed"
STATUS_OPEN = "needs_action"


class ListError(HomeAssistantError):
    """Verständliche Fehlermeldung für die Karte."""


def _learning(hass: HomeAssistant) -> Learning:
    return hass.data[DOMAIN]["learning"]


def combined_entity(hass: HomeAssistant, entity_id: str) -> Any | None:
    """Die Entität einer kombinierten SmartLists-Liste (oder None bei anderen Listen)."""
    return hass.data.get(DOMAIN, {}).get("entities", {}).get(entity_id)


def _state(hass: HomeAssistant, entity_id: str):
    if not entity_id.startswith(f"{TODO_DOMAIN}."):
        raise ListError(f"{entity_id} ist keine To-do-Liste")
    state = hass.states.get(entity_id)
    if state is None:
        raise ListError(f"Liste {entity_id} gibt es nicht (mehr)")
    if state.state == "unavailable":
        raise ListError(f"Liste {state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)} ist gerade nicht erreichbar")
    return state


def _features(hass: HomeAssistant, entity_id: str) -> int:
    return int(_state(hass, entity_id).attributes.get(ATTR_SUPPORTED_FEATURES, 0) or 0)


def list_permissions(hass: HomeAssistant, entity_id: str) -> dict[str, bool]:
    f = _features(hass, entity_id)
    return {
        "add": bool(f & TodoListEntityFeature.CREATE_TODO_ITEM),
        "toggle": bool(f & TodoListEntityFeature.UPDATE_TODO_ITEM),
        "rename": bool(f & TodoListEntityFeature.UPDATE_TODO_ITEM),
        "delete": bool(f & TodoListEntityFeature.DELETE_TODO_ITEM),
        "note": bool(f & TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM),
    }


async def _call(hass: HomeAssistant, service: str, data: dict[str, Any], context: Context | None) -> None:
    try:
        await hass.services.async_call(TODO_DOMAIN, service, data, blocking=True, context=context)
    except ServiceValidationError as err:
        raise ListError(str(err) or "Für diese Liste nicht erlaubt") from err


async def raw_items(hass: HomeAssistant, entity_id: str) -> list[dict[str, Any]]:
    """Einträge einer Liste: uid, text, note, checked (+ source/foreign bei kombinierten)."""
    entity = combined_entity(hass, entity_id)
    if entity is not None:
        return entity.card_items()
    _state(hass, entity_id)
    response = await hass.services.async_call(
        TODO_DOMAIN, "get_items", {"entity_id": entity_id}, blocking=True, return_response=True
    )
    items = ((response or {}).get(entity_id) or {}).get("items", [])
    return [
        {
            "uid": i.get("uid"),
            "text": i.get("summary") or "",
            "note": i.get("description") or "",
            "checked": i.get("status") == STATUS_DONE,
        }
        for i in items
        if i.get("uid")
    ]


async def get_list(hass: HomeAssistant, entity_id: str) -> dict[str, Any]:
    """Alles, was die Karte zum Anzeigen braucht."""
    state = _state(hass, entity_id)
    learning = _learning(hass)
    perms = list_permissions(hass, entity_id)
    entity = combined_entity(hass, entity_id)
    items = []
    person_prefix = next((r["prefix"] for r in learning.tag_rules if r["kind"] == "person"), None)
    for raw in await raw_items(hass, entity_id):
        info = learning.describe(raw["text"])
        # Herkunft als Person (kombinierte Liste, z.B. todo.torben → 👤 Torben) – außer im Artikel
        # steht schon eine Person (*Anna) oder Personen-Tags sind abgeschaltet
        person = raw.get("person")
        if person and person_prefix and not any(t["kind"] == "person" for t in info["tags"]):
            info["tags"] = [*info["tags"], {"kind": "person", "value": person, "prefix": person_prefix, "label": person, "implicit": True}]
        foreign = bool(raw.get("foreign"))
        items.append(
            {
                **info,
                "uid": raw["uid"],
                "text": raw["text"],
                "note": raw.get("note", ""),
                "checked": raw["checked"],
                "source": raw.get("source"),
                "permissions": {
                    "toggle": perms["toggle"],
                    "rename": perms["rename"] and not foreign,
                    "delete": perms["delete"] and not foreign,
                },
            }
        )
    return {
        "entity_id": entity_id,
        "name": state.attributes.get(ATTR_FRIENDLY_NAME, entity_id),
        "type": "combined" if entity is not None else "list",
        # fremd = Liste besteht nur aus fremden Quellen
        "foreign": bool(entity is not None and entity.all_foreign),
        "source_lists": entity.source_names if entity is not None else [],
        "permissions": perms,
        "categories": learning.categories.as_list(),
        "items": items,
    }


async def all_lists(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Alle To-do-Listen als mögliche Ziele (Verschieben/Kopieren)."""
    out = []
    for state in hass.states.async_all(TODO_DOMAIN):
        if state.state == "unavailable":
            continue
        f = int(state.attributes.get(ATTR_SUPPORTED_FEATURES, 0) or 0)
        out.append(
            {
                "entity_id": state.entity_id,
                "name": state.attributes.get(ATTR_FRIENDLY_NAME, state.entity_id),
                "type": "combined" if combined_entity(hass, state.entity_id) else "list",
                "can_add": bool(f & TodoListEntityFeature.CREATE_TODO_ITEM),
            }
        )
    return sorted(out, key=lambda x: str(x["name"]).casefold())


async def add_item(
    hass: HomeAssistant,
    entity_id: str,
    text: str,
    note: str = "",
    checked: bool = False,
    context: Context | None = None,
) -> dict[str, Any]:
    """Hinzufügen; liefert die uid des neuen Artikels (für „Rückgängig“).
    HA meldet die uid beim Hinzufügen nicht zurück – sie wird über den Vorher/Nachher-Vergleich ermittelt."""
    text = text.strip()
    if not text:
        raise ListError("Leerer Artikel")
    perms = list_permissions(hass, entity_id)
    if not perms["add"]:
        raise ListError("Zu dieser Liste kann nichts hinzugefügt werden")
    before = {i["uid"] for i in await raw_items(hass, entity_id)}
    data: dict[str, Any] = {"entity_id": entity_id, "item": text}
    if note and perms["note"]:
        data["description"] = note
    await _call(hass, "add_item", data, context)
    if combined_entity(hass, entity_id) is None:
        # kombinierte Listen merken sich den Verlauf selbst beim Hinzufügen
        _learning(hass).record(text)
    new = [i for i in await raw_items(hass, entity_id) if i["uid"] not in before]
    match = next((i for i in reversed(new) if i["text"] == text), new[-1] if new else None)
    uid = match["uid"] if match else None
    if uid and checked:
        await _call(hass, "update_item", {"entity_id": entity_id, "item": uid, "status": STATUS_DONE}, context)
    return {"uid": uid}


async def update_item(
    hass: HomeAssistant,
    entity_id: str,
    uid: str,
    *,
    checked: bool | None = None,
    text: str | None = None,
    note: str | None = None,
    context: Context | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {"entity_id": entity_id, "item": uid}
    if checked is not None:
        data["status"] = STATUS_DONE if checked else STATUS_OPEN
    if text is not None and text.strip():
        current = next((i for i in await raw_items(hass, entity_id) if i["uid"] == uid), None)
        if current is None:
            raise ListError("Artikel nicht gefunden – die Liste wird neu geladen")
        if text.strip() != current["text"]:
            data["rename"] = text.strip()
        if note is not None and note != current.get("note", "") and list_permissions(hass, entity_id)["note"]:
            data["description"] = note
    if len(data) > 2:
        await _call(hass, "update_item", data, context)
    return {"uid": uid}


async def remove_items(hass: HomeAssistant, entity_id: str, uids: list[str], context: Context | None = None) -> dict[str, Any]:
    if uids:
        await _call(hass, "remove_item", {"entity_id": entity_id, "item": list(uids)}, context)
    return {}


async def clear_completed(hass: HomeAssistant, entity_id: str, context: Context | None = None) -> dict[str, Any]:
    await _call(hass, "remove_completed_items", {"entity_id": entity_id}, context)
    return {}


async def move_item(
    hass: HomeAssistant,
    entity_id: str,
    uid: str,
    target: str,
    copy: bool = False,
    context: Context | None = None,
) -> dict[str, Any]:
    """In eine andere Liste verschieben bzw. kopieren. Text, Notiz und Häkchen wandern mit."""
    if target == entity_id:
        raise ListError("Ziel ist dieselbe Liste")
    item = next((i for i in await raw_items(hass, entity_id) if i["uid"] == uid), None)
    if item is None:
        raise ListError("Artikel nicht gefunden – die Liste wird neu geladen")
    if not copy:
        perms = list_permissions(hass, entity_id)
        if not perms["delete"] or item.get("foreign"):
            raise ListError("Aus dieser Liste darf nichts entfernt werden – nur Kopieren ist möglich")
    result = await add_item(hass, target, item["text"], item.get("note", ""), item["checked"], context)
    if not copy:
        await remove_items(hass, entity_id, [uid], context)
    return result
