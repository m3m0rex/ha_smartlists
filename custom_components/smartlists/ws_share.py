"""WebSocket-Befehle: Teilen per Link, öffentliche Adresse, Benachrichtigungen, Strichcodes."""

from __future__ import annotations

import json

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import lists
from .const import DOMAIN
from .ws_common import (
    _learning,
    _may_share,
    _public_info,
)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_links", vol.Required("entity_id"): str})
@callback
def ws_share_links(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"]), **_public_info(hass)})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_create", vol.Required("entity_id"): str,
                                  vol.Optional("check", default="off"): vol.In(["off", "soft", "on"]),
                                  vol.Optional("add", default=False): bool,
                                  vol.Optional("notes", default=False): bool,
                                  vol.Optional("approve", default=False): bool,
                                  vol.Optional("password"): vol.Any(vol.All(str, vol.Length(max=100)), None),
                                  vol.Optional("hours"): vol.Any(vol.All(int, vol.Range(min=1, max=24 * 365)), None)})
@callback
def ws_share_create(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Link erstellen. Der Schlüssel kommt nur in dieser Antwort vor (gespeichert wird nur sein Hash)."""
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    check, add, hours = msg["check"], msg["add"], msg.get("hours", 24 * 7)
    if not connection.user.is_admin:
        # Grenzen des Admins: höchstens erlaubte Rechte und Gültigkeit
        from .learning import clamp_link

        check, add, hours = clamp_link(_learning(hass).rights(), check, add, hours)
    # Öffentliche Adresse (Tunnel/Proxy) – ist sie gewählt, aber nicht bereit, gibt es keinen Link (sonst
    # baute die Karte ihn mit der HA-Adresse, und genau die soll nicht herausgegeben werden)
    public = hass.data[DOMAIN].get("public")
    try:
        base = public.base_url() if public is not None else None
    except ValueError as err:
        connection.send_error(msg["id"], "public_unavailable", str(err))
        return
    try:
        link = hass.data[DOMAIN]["shares"].create(msg["entity_id"], connection.user.id, check, add, hours=hours, base=base,
                                                   notes=msg["notes"], password=(msg.get("password") or "").strip() or None,
                                                   approve=msg["approve"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {**link, "path": f"/smartlists-share/{link['token']}", "base": base})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_pending", vol.Required("entity_id"): str,
                                  vol.Required("pending_id"): str, vol.Required("approve"): bool})
@websocket_api.async_response
async def ws_share_pending(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Über einen Link Hinzugefügtes übernehmen (approve) oder verwerfen – wer die Liste teilen darf."""
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    p = hass.data[DOMAIN]["shares"].take_pending(msg["entity_id"], msg["pending_id"])
    if p is None:
        connection.send_error(msg["id"], "not_found", "Nicht mehr vorhanden.")
        return
    if msg["approve"]:
        from homeassistant.core import Context

        from .shares import SHARE_CONTEXTS

        context = Context()
        SHARE_CONTEXTS[context.id] = p.get("by", "")
        added = await lists.add_item(hass, msg["entity_id"], p["text"], context=context, from_share=True)
        shares = hass.data[DOMAIN]["shares"]
        if added and added.get("uid"):
            for link in shares.links.values():
                if link["entity_id"] == msg["entity_id"]:
                    link.setdefault("added", {})[added["uid"]] = {"t": p.get("t", 0), "by": p.get("by", "")}
                    shares._save()
                    break
    connection.send_result(msg["id"], {})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_public"})
@websocket_api.async_response
async def ws_share_public(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Teilen und Rechte → Öffentliche Adresse: Einstellung und Zustand (Server, Tunnel, cloudflared).
    Sucht cloudflared jedes Mal neu – so sieht man gleich, ob eine eben abgelegte Datei gefunden wird."""
    from .public import find_cloudflared

    public = hass.data[DOMAIN]["public"]
    path, problem = await hass.async_add_executor_job(find_cloudflared, hass.config.config_dir)
    # Datei inzwischen abgelegt, Tunnel stand auf „cloudflared fehlt“ → ohne erneutes Speichern starten
    if path and public.mode in ("tunnel", "named") and str(public.error or "").startswith(("cloudflared_missing", "cloudflared_not_executable", "cloudflared_wrong")):
        await public.async_apply()
    connection.send_result(msg["id"], {**public.status(), "cloudflared": path, "cloudflared_problem": problem})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_share_public",
                                  vol.Optional("mode"): vol.In(["ha", "tunnel", "named", "proxy"]),
                                  vol.Optional("port"): vol.All(int, vol.Range(min=1024, max=65535)),
                                  vol.Optional("url"): str,
                                  vol.Optional("token"): vol.All(str, vol.Length(max=4000))})
@websocket_api.async_response
async def ws_set_share_public(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        status = await hass.data[DOMAIN]["public"].async_update(msg.get("mode"), msg.get("port"), msg.get("url"), msg.get("token"))
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], status)


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_update", vol.Required("entity_id"): str,
                                  vol.Required("link_id"): str,
                                  vol.Optional("check"): vol.In(["off", "soft", "on"]),
                                  vol.Optional("add"): bool, vol.Optional("notes"): bool, vol.Optional("approve"): bool,
                                  # weglassen = unverändert, "" = Schutz entfernen
                                  vol.Optional("password"): vol.All(str, vol.Length(max=100)),
                                  # weglassen = Ablauf unverändert, null = unbegrenzt
                                  vol.Optional("hours"): vol.Any(vol.All(int, vol.Range(min=1, max=24 * 365)), None)})
@callback
def ws_share_update(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Rechte, Laufzeit oder Passwort eines Links nachträglich ändern – die Adresse bleibt gleich."""
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    shares = hass.data[DOMAIN]["shares"]
    current = next((x for x in shares.for_list(msg["entity_id"]) if x["id"] == msg["link_id"]), None)
    if current is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Link nicht gefunden")
        return
    check, add = msg.get("check", current["check"]), msg.get("add", current["add"])
    hours: Any = msg["hours"] if "hours" in msg else False
    if not connection.user.is_admin:
        # dieselben Grenzen wie beim Erstellen
        from .learning import clamp_link

        check, add, limited = clamp_link(_learning(hass).rights(), check, add, hours if hours is not False else 1)
        if hours is not False:
            hours = limited
    try:
        shares.update(msg["link_id"], msg["entity_id"], check=check, add=add, notes=msg.get("notes"),
                      approve=msg.get("approve"), hours=hours,
                      password=msg["password"].strip() if "password" in msg else None)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"links": shares.for_list(msg["entity_id"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/share_revoke", vol.Required("entity_id"): str, vol.Required("link_id"): str})
@callback
def ws_share_revoke(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (err := _may_share(hass, msg["entity_id"], connection.user)) is not None:
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, err)
        return
    hass.data[DOMAIN]["shares"].revoke(msg["link_id"], msg["entity_id"])
    connection.send_result(msg["id"], {"links": hass.data[DOMAIN]["shares"].for_list(msg["entity_id"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notify"})
@callback
def ws_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Eigene Benachrichtigungs-Einstellungen + mögliche Ziele (alle notify-Dienste und -Entitäten)."""
    n = hass.data[DOMAIN]["notifier"]
    connection.send_result(msg["id"], {"settings": n.get(connection.user.id), "services": n.services(), "entities": n.entities(),
                                       "custom_allowed": bool(connection.user.is_admin)})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/set_notify", vol.Required("settings"): dict})
@callback
def ws_set_notify(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    n = hass.data[DOMAIN]["notifier"]
    from .notify import validate_targets

    targets = validate_targets(msg["settings"].get("targets"), msg["settings"].get("service"))
    # unverändert gespeicherte Ziele (z. B. ein später entfernter Dienst) blockieren andere Änderungen nicht
    old = {json.dumps(t, sort_keys=True, default=str) for t in n.get(connection.user.id)["targets"]}
    new = [t for t in targets if json.dumps(t, sort_keys=True, default=str) not in old]
    if (err := n.check_targets(new, bool(connection.user.is_admin))) is not None:
        connection.send_error(msg["id"], "invalid", err)
        return
    connection.send_result(msg["id"], {"settings": n.set(connection.user.id, msg["settings"])})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/notify_test"})
@websocket_api.async_response
async def ws_notify_test(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    try:
        result = await hass.data[DOMAIN]["notifier"].async_test(connection.user.id)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "notify_failed", str(err))
        return
    connection.send_result(msg["id"], {"ok": True, **result})


@websocket_api.websocket_command({vol.Required("type"): "smartlists/barcode", vol.Required("code"): vol.All(str, vol.Match(r"^\d{6,14}$"))})
@websocket_api.async_response
async def ws_barcode(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Strichcode → Produkt. Erst aus dem eigenen Speicher, sonst Open Food Facts (nur der Code wird gesendet)."""
    from .barcode import async_lookup

    connection.send_result(msg["id"], await async_lookup(hass, msg["code"]))


@websocket_api.websocket_command({vol.Required("type"): "smartlists/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Live-Meldung an offene Karten/Seiten, wenn sich Haushaltsdaten ändern (Kategorien, Packs, Badges,
    Preise, Vorlagen, Reihenfolgen, geteilte Links, Notizen, Geräte/App-Listen). Die Karte lädt dann neu –
    die Artikel selbst kommen weiter über todo/item/subscribe."""
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    from .const import SIGNAL_DATA_CHANGED, SIGNAL_LEARNING_CHANGED
    from .devices import SIGNAL_DEVICES_CHANGED

    @callback
    def forward(*_args: Any) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"changed": True}))

    unsubs = [async_dispatcher_connect(hass, sig, forward)
              for sig in (SIGNAL_DATA_CHANGED, SIGNAL_LEARNING_CHANGED, SIGNAL_DEVICES_CHANGED)]

    @callback
    def unsubscribe() -> None:
        for u in unsubs:
            u()

    connection.subscriptions[msg["id"]] = unsubscribe
    connection.send_result(msg["id"])
