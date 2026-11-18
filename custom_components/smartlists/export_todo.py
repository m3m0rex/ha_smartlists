"""SmartLists-Listen als normale To-do-Listen kopieren (Local To-do von Home Assistant).

Für alle, die SmartLists wieder entfernen und ihre Listen behalten wollen: je gewählter Liste entsteht eine neue
lokale To-do-Liste mit denselben Einträgen. Die SmartLists-Liste bleibt unverändert – es ist eine Kopie. Die neue
Liste gehört Home Assistant selbst und bleibt, wenn SmartLists entfernt wird.

Was mitkommt: der Text des Eintrags, wie er eingegeben wurde (mit Menge, @Markt, #Schlagwort), die Notiz (ohne die
technische Angebots-Zeile), erledigt/offen und die Fälligkeit. Nicht übertragbar, weil die To-do-Liste von Home
Assistant das nicht kennt: Rechte je Benutzer, Vormerkungen, Preise, Favoriten. Eine kombinierte Liste wird als eine
zusammengeführte Liste kopiert.
"""

from __future__ import annotations

import asyncio
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .itemtext import split_offer

MAX_ITEMS = 2000


def candidates(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Alle SmartLists-Listen (eigene und kombinierte), ohne Notizlisten."""
    from . import lists  # erst hier: lists zieht die To-do-Plattform von Home Assistant nach

    data = hass.data.get(DOMAIN, {})
    out = []
    for kind, entities in (("combined", data.get("entities", {})), ("own", data.get("own", {}))):
        for entity_id in entities:
            state = hass.states.get(entity_id)
            if state is None or lists.is_notes(hass, entity_id):
                continue
            out.append({"entity_id": entity_id, "name": state.name, "kind": kind, "open": int(state.state) if str(state.state).isdigit() else 0})
    return sorted(out, key=lambda x: str(x["name"]).casefold())


def item_fields(item: dict[str, Any], mark: dict[str, Any] | None = None) -> dict[str, Any]:
    """Felder für todo.add_item: Text, Notiz ohne Angebots-Zeile, Fälligkeit."""
    note, _, _ = split_offer(item.get("note"))
    fields: dict[str, Any] = {"item": str(item.get("text") or "").strip()[:250]}
    if note.strip():
        fields["description"] = note.strip()
    due = str((mark or {}).get("due") or "")
    if "T" in due:
        fields["due_datetime"] = due.replace("T", " ") + ":00"
    elif due:
        fields["due_date"] = due
    return fields


PROGRESS_EVENT = "smartlists_export_progress"


async def _create_list(hass: HomeAssistant, name: str) -> tuple[str, str]:
    """Neue lokale To-do-Liste; gibt es den Namen schon, mit Zusatz. Liefert (entity_id, Name)."""
    before = {s.entity_id for s in hass.states.async_all("todo")}
    german = str(hass.config.language).startswith("de")
    for candidate in (name, f"{name} ({'Kopie' if german else 'copy'})", f"{name} ({'Kopie' if german else 'copy'} 2)"):
        try:
            result = await hass.config_entries.flow.async_init("local_todo", context={"source": "user"}, data={"todo_list_name": candidate})
        except Exception as err:  # noqa: BLE001 – z. B. Local To-do nicht verfügbar
            raise ValueError(f"Die lokale To-do-Liste konnte nicht angelegt werden: {err}") from err
        if result.get("type") != "create_entry":
            continue  # Name vergeben: nächster Versuch
        for _ in range(40):  # die Entität erscheint kurz nach dem Einrichten
            new = [s.entity_id for s in hass.states.async_all("todo") if s.entity_id not in before]
            if new:
                return new[0], candidate
            await asyncio.sleep(0.25)
        raise ValueError(f"„{candidate}“ wurde angelegt, ist aber noch nicht bereit – bitte gleich noch einmal versuchen.")
    raise ValueError(f"Für „{name}“ ließ sich kein freier Name finden.")


async def async_export(hass: HomeAssistant, entity_ids: list[str]) -> dict[str, Any]:
    """Die genannten SmartLists-Listen kopieren. Liefert je Liste Name, neue Entität und Zahl der Einträge."""
    from . import lists

    known = {c["entity_id"]: c for c in candidates(hass)}
    wanted = [e for e in dict.fromkeys(entity_ids) if e in known]
    if not wanted:
        raise ValueError("Bitte mindestens eine SmartLists-Liste wählen.")
    extras = hass.data.get(DOMAIN, {}).get("extras")
    created = []

    def progress(index: int, name: str, done: int, total: int) -> None:
        # für den Fortschritt in den Einstellungen (Ereignis, das die Seite während des Kopierens abonniert)
        hass.bus.async_fire(PROGRESS_EVENT, {"list": index + 1, "lists": len(wanted), "name": name, "done": done, "total": total})

    for index, entity_id in enumerate(wanted):
        items = (await lists.raw_items(hass, entity_id))[:MAX_ITEMS]
        progress(index, str(known[entity_id]["name"]), 0, len(items))
        target, name = await _create_list(hass, str(known[entity_id]["name"]))
        copied = 0
        done: list[int] = []  # Stellen der erledigten Einträge in der neuen Liste
        for item in items:
            fields = item_fields(item, extras.item_mark(entity_id, item["uid"]) if extras else None)
            if not fields["item"]:
                continue
            try:
                await hass.services.async_call("todo", "add_item", {"entity_id": target, **fields}, blocking=True)
            except Exception:  # noqa: BLE001 – Fälligkeit nicht unterstützt: ohne sie
                await hass.services.async_call("todo", "add_item", {"entity_id": target, "item": fields["item"],
                                                                    **({"description": fields["description"]} if "description" in fields else {})}, blocking=True)
            if item.get("checked"):
                done.append(copied)
            copied += 1
            progress(index, name, copied, len(items))
        if done:  # abhaken über die Kennung (zwei Einträge können gleich heißen): die neue Liste hat sie in der Reihenfolge des Anlegens
            answer = await hass.services.async_call("todo", "get_items", {"entity_id": target}, blocking=True, return_response=True)
            new_items = ((answer or {}).get(target) or {}).get("items") or []
            if len(new_items) == copied:
                for index in done:
                    await hass.services.async_call("todo", "update_item", {"entity_id": target, "item": new_items[index]["uid"], "status": "completed"}, blocking=True)
        created.append({"source": entity_id, "name": name, "entity_id": target, "items": copied})
    return {"lists": created}
