"""Vorhandene To-do-Listen (Einkaufsliste, Local To-do, …) in eigene SmartLists-Listen übernehmen.

- je Liste eine eigene SmartLists-Liste (gleicher Name) oder alle zusammen in eine
- Artikel mit Text, Notiz und Häkchen; beim Zusammenlegen optional die Herkunft als *Person bzw. #Tag
- die alte Liste bleibt immer unverändert – aufräumen (löschen) macht der Benutzer selbst

Die neuen Listen bekommen ihre Artikel, bevor sie entstehen (Speicher wird vorab geschrieben) – so
erscheinen sie nach dem Neuladen der Integration sofort vollständig.
"""

from __future__ import annotations

import uuid
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigSubentry
from homeassistant.const import ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from . import lists
from .const import DOMAIN, STORAGE_VERSION, SUBENTRY_OWN

OLD_ACTIONS = ("keep",)
MAX_ITEMS = 2000


def candidates(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Listen, die sich übernehmen lassen: alle To-do-Listen außer SmartLists-eigenen, kombinierten und Notizen."""
    combined = hass.data.get(DOMAIN, {}).get("entities", {})
    own = hass.data.get(DOMAIN, {}).get("own", {})
    out = []
    for st in hass.states.async_all("todo"):
        eid = st.entity_id
        if eid in combined or eid in own or lists.is_notes(hass, eid) or st.state == "unavailable":
            continue
        used_in = [e.name or k for k, e in combined.items() if eid in getattr(e, "_sources", [])]
        reg = er.async_get(hass).async_get(eid)
        out.append({"entity_id": eid, "name": st.attributes.get(ATTR_FRIENDLY_NAME, eid), "open": _int(st.state),
                    "platform": reg.platform if reg else None, "used_in": used_in})
    return sorted(out, key=lambda x: str(x["name"]).casefold())


def _int(v: Any) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def _tagged(text: str, tag: str | None) -> str:
    return f"{text} {tag}" if tag and tag.split()[0] not in text.split() else text


async def async_migrate(hass: HomeAssistant, owner: str, sources: list[str], mode: str = "each", name: str | None = None,
                        old: str = "keep", tag_kind: str | None = None) -> dict[str, Any]:
    """Liefert {"lists": [{"name", "subentry_id", "items"}], "old": {entity_id: "kept"}}. Alte Listen werden nie verändert."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        raise ValueError("SmartLists ist nicht eingerichtet.")
    entry = entries[0]
    if old not in OLD_ACTIONS:
        raise ValueError("Unbekannte Aktion für die alte Liste")
    allowed = {c["entity_id"]: c for c in candidates(hass)}
    sources = [s for s in dict.fromkeys(sources) if s in allowed]
    if not sources:
        raise ValueError("Keine passende Liste ausgewählt.")
    # Herkunft beim Zusammenlegen als Badge: "*Anna" (Person) bzw. "#Anna" (Schlagwort) – Zeichen aus der Namenskonvention
    prefix = None
    if mode == "one" and tag_kind in ("person", "tag"):
        rule = next((r for r in hass.data[DOMAIN]["learning"].tag_rules if r.get("kind") == tag_kind), None)
        prefix = rule["prefix"] if rule else None

    items_by_source: dict[str, list[dict[str, Any]]] = {}
    for s in sources:
        items_by_source[s] = (await lists.raw_items(hass, s))[:MAX_ITEMS]

    def own_items(src_items: list[tuple[str, dict[str, Any]]]) -> list[dict[str, Any]]:
        out = []
        for src, i in src_items:
            tag = None
            if prefix:
                label = str(allowed[src]["name"]).split()[0] if allowed[src]["name"] else src.split(".")[1]
                tag = prefix + label.replace(" ", "_")
            out.append({"uid": uuid.uuid4().hex, "summary": _tagged(i["text"], tag), "status": "completed" if i["checked"] else "needs_action",
                        "description": i.get("note") or ""})
        return out

    # (Titel, Artikel, Quelle bei „je Liste“)
    groups: list[tuple[str, list[dict[str, Any]], str | None]]
    if mode == "one":
        title = (name or "").strip() or str(allowed[sources[0]]["name"])
        groups = [(title, own_items([(s, i) for s in sources for i in items_by_source[s]])[:MAX_ITEMS], None)]
    else:
        groups = [(str(allowed[s]["name"]), own_items([(s, i) for i in items_by_source[s]]), s) for s in sources]

    created = []
    for title, items, _src in groups:
        sub = ConfigSubentry(data=MappingProxyType({"owner": owner, "shares": {}}), subentry_type=SUBENTRY_OWN, title=title[:60], unique_id=None)
        await Store(hass, STORAGE_VERSION, f"{DOMAIN}.own.{sub.subentry_id}").async_save({"items": items})
        created.append((sub, len(items)))

    result_old = {s: "kept" for s in sources}

    # zum Schluss anlegen (jede neue Unter-Liste lädt die Integration neu)
    for sub, _ in created:
        hass.config_entries.async_add_subentry(entry, sub)
    return {"lists": [{"name": sub.title, "subentry_id": sub.subentry_id, "items": n} for sub, n in created], "old": result_old}
