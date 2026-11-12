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

from .categories import CATEGORY_IDS, MAX_TERMS, CategoryIndex, _lang, build_index, load_builtin_packs, normalize, normalize_pack
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
                "extends": p.get("extends"),
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
        pid = self._custom_id(pack["name"])
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

    # ---- Bearbeiten in der Karte ------------------------------------------------
    @callback
    def create(self, name: str, language: str = "") -> str:
        """Leeres eigenes Pack anlegen (und aktivieren, ganz oben)."""
        name = name.strip()[:60] or "Eigenes Pack"
        pid = self._custom_id(name)
        if pid in self.custom:
            raise ValueError("Ein eigenes Pack mit diesem Namen gibt es schon")
        if len(self.custom) >= MAX_CUSTOM:
            raise ValueError(f"Höchstens {MAX_CUSTOM} eigene Packs")
        self.custom[pid] = {"name": name, "language": _lang(language) if language else "", "version": 1, "terms": {}, "products": []}
        self.active.insert(0, pid)
        self._save()
        self._rebuild()
        return pid

    def _custom_id(self, name: str) -> str:
        return "custom_" + (re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "pack")

    def editable_id(self, pid: str) -> str:
        """Eigene Packs werden direkt bearbeitet. Eingebaute bleiben unverändert (Updates überschreiben
        sie) – Änderungen landen in einem Ergänzungs-Pack „<Name> +“, das direkt darüber aktiv ist."""
        if pid in self.custom:
            return pid
        if pid not in self.builtin:
            raise ValueError("Pack nicht gefunden")
        xid = f"custom_{pid}_plus"
        if xid not in self.custom:
            base = self.builtin[pid]
            self.custom[xid] = {"name": f"{base['name']} +", "language": base.get("language", ""), "version": 1,
                                "terms": {}, "products": [], "extends": pid}
        if xid not in self.active:
            pos = self.active.index(pid) if pid in self.active else 0
            self.active.insert(pos, xid)
        return xid

    def terms(self, pid: str, query: str = "", offset: int = 0, limit: int = 100) -> dict[str, Any]:
        """Stichwörter eines Packs (für eingebaute inkl. Ergänzungen), gefiltert und seitenweise."""
        packs = self._all()
        if pid not in packs:
            raise ValueError("Pack nicht gefunden")
        merged = dict(packs[pid]["terms"])
        changed: set[str] = set()
        xid = f"custom_{pid}_plus"
        if pid in self.builtin and xid in self.custom:
            merged.update(self.custom[xid]["terms"])
            changed = set(self.custom[xid]["terms"])
        q = normalize(query) if query else ""
        rows = sorted((t, c) for t, c in merged.items() if not q or q in t)
        return {"pack_id": pid, "total": len(rows), "offset": offset,
                "terms": [{"term": t, "category": c, "changed": t in changed} for t, c in rows[offset:offset + limit]]}

    @callback
    def update_terms(self, pid: str, changes: dict[str, str | None], name: str | None = None) -> dict[str, Any]:
        """changes: Stichwort → Kategorie-ID (hinzufügen/ändern) oder None (löschen).
        Bei eingebauten Packs: None = Ergänzung zurücknehmen; "sonstiges" = Stichwort ignorieren."""
        target = self.editable_id(pid)
        pack = self.custom[target]
        for raw, cid in changes.items():
            term = normalize(str(raw))
            if not term:
                continue
            if cid is None:
                pack["terms"].pop(term, None)
            elif cid in CATEGORY_IDS:
                pack["terms"][term] = cid
            else:
                raise ValueError(f"Unbekannte Kategorie: {cid}")
        if len(pack["terms"]) > MAX_TERMS:
            raise ValueError(f"Pack hat mehr als {MAX_TERMS} Stichwörter")
        if name and target == pid:
            pack["name"] = name.strip()[:60]
        self._save()
        self._rebuild()
        return {"pack_id": pid, "edited": target, "terms": len(pack["terms"])}

    def export(self, pid: str) -> dict[str, Any]:
        """Als Datei; bei eingebauten Packs inklusive eigener Ergänzungen (zum Teilen/Weitergeben)."""
        p = self._all()[pid]
        terms = dict(p["terms"])
        extra = self.custom.get(f"custom_{pid}_plus") if pid in self.builtin else None
        if extra:
            terms.update(extra["terms"])
        return {"name": p["name"], "language": p.get("language", ""), "version": p.get("version", 1),
                "terms": dict(sorted(terms.items())), "products": p.get("products", [])}


async def async_get_packs(hass: HomeAssistant) -> Packs:
    data = hass.data.setdefault(DOMAIN, {})
    if "packs" not in data:
        packs = Packs(hass)
        await packs.async_load()
        data["packs"] = packs
    return data["packs"]
