"""Keyword-Packs verwalten: eingebaute (packs/*.json) und eigene (hochgeladen, .storage/smartlists.packs).

Welche Packs aktiv sind, gilt für den ganzen Haushalt (Admins ändern es in der Karte/Seite →
Haushalt → Kategorie-Erkennung). Standard: das eingebaute Pack in der Sprache von Home Assistant,
sonst Deutsch.
"""

from __future__ import annotations

import re
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .categories import CategoryIndex, _lang, build_index, load_builtin_packs, normalize_pack
from .const import DOMAIN, SIGNAL_LEARNING_CHANGED

STORAGE_KEY = f"{DOMAIN}.packs"
MAX_CUSTOM = 20


class Packs:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.builtin: dict[str, dict[str, Any]] = {}
        self.custom: dict[str, dict[str, Any]] = {}
        self.active: list[str] = []
        self.index: CategoryIndex = CategoryIndex([], [], "de")

    async def async_load(self) -> None:
        self.builtin = await self.hass.async_add_executor_job(load_builtin_packs)
        data = await self._store.async_load() or {}
        self.custom = dict(data.get("custom", {}))
        active = data.get("active")
        if not active:
            lang = _lang(self.hass.config.language)
            active = [lang] if lang in self.builtin else ["de"]
        self.active = [p for p in active if p in self.builtin or p in self.custom] or ["de"]
        self._rebuild(notify=False)

    def _all(self) -> dict[str, dict[str, Any]]:
        return {**self.builtin, **self.custom}

    def _rebuild(self, notify: bool = True) -> None:
        packs = self._all()
        self.index = build_index([packs[p] for p in self.active if p in packs], self.hass.config.language)
        learning = self.hass.data.get(DOMAIN, {}).get("learning")
        if learning is not None:
            learning.categories = self.index
        if notify:
            async_dispatcher_send(self.hass, SIGNAL_LEARNING_CHANGED)

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"custom": self.custom, "active": self.active}, 1.0)

    def describe(self) -> list[dict[str, Any]]:
        out = []
        for pid, p in self._all().items():
            out.append({
                "id": pid, "name": p["name"], "language": p.get("language", ""), "builtin": bool(p.get("builtin")),
                "terms": len(p["terms"]), "products": len(p.get("products", [])),
                "active": pid in self.active, "priority": self.active.index(pid) if pid in self.active else None,
            })
        return sorted(out, key=lambda x: (x["priority"] is None, x["priority"] or 0, not x["builtin"], x["name"].casefold()))

    @callback
    def set_active(self, ids: list[str]) -> None:
        known = self._all()
        ids = [i for i in dict.fromkeys(ids) if i in known]
        if not ids:
            raise ValueError("Mindestens ein Pack muss aktiv sein")
        self.active = ids
        self._save()
        self._rebuild()

    @callback
    def add_custom(self, raw: Any, name: str | None = None, activate: bool = True) -> dict[str, Any]:
        pack = normalize_pack(raw, name or "Eigenes Pack")
        if name:
            pack["name"] = name.strip()[:60]
        slug = re.sub(r"[^a-z0-9]+", "_", pack["name"].lower()).strip("_") or "pack"
        pid = f"custom_{slug}"
        if pid not in self.custom and len(self.custom) >= MAX_CUSTOM:
            raise ValueError(f"Höchstens {MAX_CUSTOM} eigene Packs")
        pack.pop("builtin", None)
        self.custom[pid] = pack
        if activate and pid not in self.active:
            # eigene Packs vorne: ihre Zuordnungen gewinnen gegen eingebaute
            self.active.insert(0, pid)
        self._save()
        self._rebuild()
        return {"id": pid, "terms": len(pack["terms"]), "products": len(pack["products"]), "skipped": pack.get("skipped", 0)}

    @callback
    def delete_custom(self, pid: str) -> None:
        if pid not in self.custom:
            raise ValueError("Nur eigene Packs können gelöscht werden")
        self.custom.pop(pid)
        self.active = [p for p in self.active if p != pid] or ["de"]
        self._save()
        self._rebuild()

    def export(self, pid: str) -> dict[str, Any]:
        p = self._all()[pid]
        return {"name": p["name"], "language": p.get("language", ""), "version": p.get("version", 1),
                "terms": p["terms"], "products": p.get("products", [])}


async def async_get_packs(hass: HomeAssistant) -> Packs:
    data = hass.data.setdefault(DOMAIN, {})
    if "packs" not in data:
        packs = Packs(hass)
        await packs.async_load()
        data["packs"] = packs
    return data["packs"]
