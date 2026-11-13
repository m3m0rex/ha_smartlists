"""Benachrichtigungen: „Anna hat Milch 2 l @REWE auf Einkauf gesetzt“.

Jeder Benutzer stellt für sich ein (Karte → allgemeine Einstellungen → Für mich → Benachrichtigungen):
an welches Gerät (notify.mobile_app_…), bei neuen Artikeln und/oder beim Abhaken, welche Listen, von wem
nicht, Ruhezeit. Grundlage sind die todo-Dienstaufrufe in Home Assistant – damit zählen Änderungen aus der
Karte, der App, HA selbst und über geteilte Links. Eigene Änderungen lösen nie eine Nachricht aus.
Mehrere Änderungen kurz hintereinander (60 s) werden zu einer Nachricht zusammengefasst.
"""

from __future__ import annotations

import datetime as dt
import logging
from functools import partial
from typing import Any

from homeassistant.const import ATTR_FRIENDLY_NAME, EVENT_CALL_SERVICE
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
STORAGE_KEY = f"{DOMAIN}.notify"
BATCH_SECONDS = 60
TEXTS = {
    "de": {"via_link": "etwas (über geteilten Link)", "added": "{who} hat {items} auf {list} gesetzt", "checked": "{who} hat {items} abgehakt ({list})",
           "someone": "Jemand", "and": "und", "more": "{n} weitere", "test": "Testnachricht – Benachrichtigungen kommen an."},
    "en": {"via_link": "something (via shared link)", "added": "{who} added {items} to {list}", "checked": "{who} checked off {items} ({list})",
           "someone": "Someone", "and": "and", "more": "{n} more", "test": "Test message – notifications arrive."},
    "fr": {"via_link": "quelque chose (via un lien partagé)", "added": "{who} a ajouté {items} à {list}", "checked": "{who} a coché {items} ({list})",
           "someone": "Quelqu'un", "and": "et", "more": "{n} autres", "test": "Message de test – les notifications arrivent."},
    "es": {"via_link": "algo (mediante enlace compartido)", "added": "{who} ha añadido {items} a {list}", "checked": "{who} ha marcado {items} ({list})",
           "someone": "Alguien", "and": "y", "more": "{n} más", "test": "Mensaje de prueba – las notificaciones llegan."},
    "it": {"via_link": "qualcosa (tramite link condiviso)", "added": "{who} ha aggiunto {items} a {list}", "checked": "{who} ha spuntato {items} ({list})",
           "someone": "Qualcuno", "and": "e", "more": "altri {n}", "test": "Messaggio di prova – le notifiche arrivano."},
    "pl": {"via_link": "coś (przez udostępniony link)", "added": "{who} dodał(a) {items} do {list}", "checked": "{who} odhaczył(a) {items} ({list})",
           "someone": "Ktoś", "and": "i", "more": "{n} więcej", "test": "Wiadomość testowa – powiadomienia docierają."},
}


def _text(hass: HomeAssistant) -> dict[str, str]:
    return TEXTS.get((hass.config.language or "en").split("-")[0], TEXTS["en"])


def validate(settings: Any) -> dict[str, Any]:
    s = settings if isinstance(settings, dict) else {}
    quiet = s.get("quiet") if isinstance(s.get("quiet"), list) and len(s["quiet"]) == 2 else None
    return {
        "service": str(s.get("service") or "").removeprefix("notify.")[:80] or None,
        "added": bool(s.get("added", True)),
        "checked": bool(s.get("checked", False)),
        "own": bool(s.get("own", False)),  # auch eigene Änderungen (z. B. von einem anderen Gerät)
        "lists": [str(x) for x in s.get("lists") or [] if str(x).startswith("todo.")][:50],
        "muted": [str(x) for x in s.get("muted") or []][:50],
        "quiet": [int(quiet[0]) % 24, int(quiet[1]) % 24] if quiet else None,
    }


class Notifier:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
        self.users: dict[str, dict[str, Any]] = {}
        # (empfänger, liste, art) → {"who": set, "items": [..], "cancel": callable}
        self._pending: dict[tuple[str, str, str], dict[str, Any]] = {}

    async def async_load(self) -> None:
        self.users = {k: validate(v) for k, v in ((await self._store.async_load() or {}).get("users") or {}).items()}

    def get(self, user_id: str) -> dict[str, Any]:
        return self.users.get(user_id) or validate({})

    @callback
    def set(self, user_id: str, settings: dict[str, Any]) -> dict[str, Any]:
        self.users[user_id] = validate(settings)
        self._store.async_delay_save(lambda: {"users": self.users}, 1.0)
        return self.users[user_id]

    def services(self) -> list[str]:
        return sorted(s for s in self.hass.services.async_services().get("notify", {}) if s.startswith("mobile_app_"))

    @callback
    def start(self) -> Any:
        return self.hass.bus.async_listen(EVENT_CALL_SERVICE, self._on_call)

    async def _on_call(self, event: Event) -> None:
        data = event.data
        if data.get("domain") != "todo" or data.get("service") not in ("add_item", "update_item"):
            return
        if not self.users:
            return
        sd = data.get("service_data") or {}
        kind = "added" if data["service"] == "add_item" else "checked" if sd.get("status") == "completed" else None
        if kind is None:
            return
        entity_ids = sd.get("entity_id") or []
        entity_ids = [entity_ids] if isinstance(entity_ids, str) else list(entity_ids)
        combined = self.hass.data.get(DOMAIN, {}).get("entities", {})
        actor = event.context.user_id if event.context else None
        from .shares import SHARE_CONTEXTS

        via_link = bool(event.context and event.context.id in SHARE_CONTEXTS)
        for entity_id in entity_ids:
            # kombinierte Listen schreiben in ihre Quellen – dort kommt die Änderung ein zweites Mal an
            if entity_id in combined:
                continue
            # über einen geteilten Link: keinen fremden Text aufs Gerät schicken
            name = _text(self.hass)["via_link"] if via_link else await self._item_name(entity_id, sd, kind)
            if name:
                await self._queue(entity_id, kind, name, actor)

    async def _item_name(self, entity_id: str, sd: dict[str, Any], kind: str) -> str | None:
        item = str(sd.get("item") or "")
        if kind == "added":
            return item or None
        from . import lists

        try:
            for i in await lists.raw_items(self.hass, entity_id):
                if i["uid"] == item or i["text"] == item:
                    return i["text"]
        except Exception:  # noqa: BLE001
            return None
        return item or None

    async def _queue(self, entity_id: str, kind: str, item: str, actor: str | None) -> None:
        from . import lists

        for user_id, s in self.users.items():
            if not s["service"] or not s[kind] or (user_id == actor and not s["own"]) or (actor and actor in s["muted"]):
                continue
            # gewählt werden kann auch eine kombinierte Liste – Änderungen kommen aber an ihren Quell-Listen an
            if s["lists"] and entity_id not in s["lists"] and not any(entity_id in self._sources_of(c) for c in s["lists"]):
                continue
            user = await self.hass.auth.async_get_user(user_id)
            if user is None or lists.own_role(self.hass, entity_id, user) is None:
                continue  # Liste ist für diesen Benutzer nicht sichtbar (eigene Listen / Notizen)
            key = (user_id, entity_id, kind)
            pend = self._pending.get(key)
            if pend is None:
                pend = self._pending[key] = {"who": [], "items": []}
                # Koroutinen-Funktion: HA startet sie als Task in der Ereignisschleife. (Früher eine lambda –
                # die lief in einem Thread, dort scheiterte async_create_task → es kam nie eine Nachricht an.)
                pend["cancel"] = async_call_later(self.hass, BATCH_SECONDS, partial(self._send_later, key))
            if actor not in pend["who"]:
                pend["who"].append(actor)
            pend["items"].append(item)

    async def _send_later(self, key: tuple[str, str, str], _now: Any) -> None:
        await self._send(key)

    def _sources_of(self, entity_id: str) -> list[str]:
        ent = self.hass.data.get(DOMAIN, {}).get("entities", {}).get(entity_id)
        return list(getattr(ent, "_sources", []) or [])

    def _quiet(self, s: dict[str, Any]) -> bool:
        if not s.get("quiet"):
            return False
        start, end = s["quiet"]
        h = dt.datetime.now().hour
        return start <= h < end if start < end else (h >= start or h < end)

    async def _send(self, key: tuple[str, str, str]) -> None:
        pend = self._pending.pop(key, None)
        user_id, entity_id, kind = key
        s = self.users.get(user_id)
        if not pend or not s or not s["service"] or self._quiet(s):
            return
        t = _text(self.hass)
        names = []
        for who in pend["who"]:
            user = await self.hass.auth.async_get_user(who) if who else None
            names.append(user.name if user and user.name else t["someone"])
        items = list(dict.fromkeys(pend["items"]))
        shown = ", ".join(items[:4]) + (f" {t['and']} {t['more'].format(n=len(items) - 4)}" if len(items) > 4 else "")
        state = self.hass.states.get(entity_id)
        list_name = state.attributes.get(ATTR_FRIENDLY_NAME, entity_id) if state else entity_id
        message = t[kind].format(who=f" {t['and']} ".join(dict.fromkeys(names)), items=shown, list=list_name)
        try:
            await self.hass.services.async_call("notify", s["service"], {
                "title": list_name, "message": message,
                "data": {"tag": f"smartlists-{entity_id}", "group": "smartlists", "clickAction": "/smartlists"},
            })
        except Exception as err:  # noqa: BLE001 – falscher Dienst o.ä. soll nichts anderes stören
            _LOGGER.warning("SmartLists: Benachrichtigung über notify.%s fehlgeschlagen: %s", s["service"], err)
            return

    async def async_test(self, user_id: str) -> None:
        """Testnachricht an das eingestellte Gerät (Fehler gehen an die Karte zurück)."""
        s = self.get(user_id)
        if not s["service"]:
            raise ValueError("no_service")
        await self.hass.services.async_call("notify", s["service"], {
            "title": "SmartLists", "message": _text(self.hass)["test"],
            "data": {"tag": "smartlists-test", "group": "smartlists", "clickAction": "/smartlists"},
        }, blocking=True)


async def async_get_notifier(hass: HomeAssistant) -> Notifier:
    data = hass.data.setdefault(DOMAIN, {})
    if "notifier" not in data:
        n = Notifier(hass)
        await n.async_load()
        data["notifier"] = n
    return data["notifier"]
