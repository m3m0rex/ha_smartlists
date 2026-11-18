"""SmartLists: kombinierte To-do-Listen für Home Assistant.

Die Integration wird einmal eingerichtet (Einstellungen → Geräte & Dienste → Integrationen).
Jede kombinierte Liste ist ein Unter-Eintrag davon und führt mehrere vorhandene To-do-Listen
(Einkaufsliste, Local To-do, Google Tasks, Bring!, …) zu einer gemeinsamen To-do-Entität
zusammen. Abhaken, Umbenennen und Löschen wirken je nach Modus direkt in der Ursprungsliste;
neue Artikel landen in der eingestellten Standard-Liste.

Haushaltsweit (unabhängig von einzelnen Listen): gemerkte Kategorien, Verlauf für Vorschläge,
Tag-Regeln (@REWE …) – siehe learning.py – und die Lovelace-Karte unter /smartlists/.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from types import MappingProxyType

from homeassistant.components import frontend, panel_custom
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import automation, websocket
from .const import DOMAIN, LEGACY_UNIQUE_ID, STORAGE_VERSION, SUBENTRY_COMBINED
from .app_backups import async_get_app_backups
from .devices import async_get_devices
from .packs import async_get_packs
from .notes import async_get_notes
from .extras import async_get_extras
from .shares import async_get_shares, async_register_views
from .public import async_get_public, async_setup_public
from .notify import async_get_notifier
from .itemlog import async_get_itemlog
from . import repairs
from .learning import async_get_learning

_LOGGER = logging.getLogger(__name__)
PLATFORMS: list[Platform] = [Platform.TODO, Platform.SENSOR, Platform.CALENDAR, Platform.BUTTON]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
# eigener Pfad, damit er sich nicht mit der Seitenleisten-Seite /smartlists überschneidet
CARD_URL = "/smartlists-files/smartlists-card.js"
# Die Angebots-Karte (custom:smartdiscounts-card) wird seit 4.0.0-beta.7 nicht mehr mitgeliefert – eigenes Repository,
# über HACS zu installieren. Siehe discounts_card.py (Hinweis, wenn sie gebraucht wird und fehlt).
PANEL_URL_PATH = DOMAIN


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Einmal pro HA-Start: Gedächtnis laden, WebSocket-Befehle und Karte bereitstellen."""
    await _async_move_files(hass)  # vor allem anderen: die Dateien liegen ab 4.0.0-beta.12 unter .storage/smartlists/
    await async_get_packs(hass)
    await async_get_learning(hass)
    await async_get_devices(hass)
    await async_get_app_backups(hass)
    await async_get_notes(hass)
    await async_get_extras(hass)
    from .offer_history import async_get_offer_history

    await async_get_offer_history(hass)
    await async_get_shares(hass)
    async_register_views(hass)  # geteilte Links (ohne Anmeldung, nur mit 256-Bit-Schlüssel)
    # Teilen ohne die HA-Adresse zu verraten: eigener kleiner Server + Quick Tunnel / eigener Proxy
    await async_get_public(hass)
    async_setup_public(hass)

    @callback
    def _entity_removed(event) -> None:
        # Liste gelöscht → ihre Links ungültig (eine neue Liste gleichen Namens erbt sie nicht)
        if event.data.get("action") == "remove" and str(event.data.get("entity_id", "")).startswith("todo."):
            hass.data[DOMAIN]["shares"].drop_entity(event.data["entity_id"])

    hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _entity_removed)
    (await async_get_notifier(hass)).start()
    (await async_get_itemlog(hass)).start()
    websocket.async_register(hass)
    automation.async_setup_services(hass)
    automation.async_setup_intents(hass)
    await _async_register_card(hass)
    return True


async def _async_register_card(hass: HomeAssistant) -> None:
    """Karte automatisch laden – keine manuelle Dashboard-Ressource nötig.
    Die Version im URL-Parameter sorgt nach Updates für frisches Laden statt Browser-Cache."""
    path = Path(__file__).parent / "www" / "smartlists-card.js"
    from .pwa import BRAND_URL, ManifestView

    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(path), True),
                                                     # Symbole für „Als App auf dem Startbildschirm“ (pwa.py)
                                                     StaticPathConfig(BRAND_URL, str(Path(__file__).parent / "brand"), True)])
    except RuntimeError:
        return  # bereits registriert (z.B. Neuladen der Integration)
    hass.http.register_view(ManifestView())
    version = (await async_get_integration(hass, DOMAIN)).version
    hass.data[DOMAIN]["version"] = str(version)
    hass.data[DOMAIN]["card_url"] = f"{CARD_URL}?v={version}"
    add_extra_js_url(hass, hass.data[DOMAIN]["card_url"])


async def _async_register_panel(hass: HomeAssistant) -> None:
    """Eigene Seite „SmartLists“ in der Seitenleiste: alle Listen mit der Karte, ohne Dashboard.
    Die eingebaute To-do-Seite von HA zeigt nur Text – hier gibt es Badges, Kategorien, Stepper."""
    try:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name="smartlists-panel",
            sidebar_title="SmartLists",
            sidebar_icon="mdi:cart-variant",
            module_url=hass.data[DOMAIN].get("card_url", CARD_URL),
            require_admin=False,
        )
    except ValueError:
        pass  # schon registriert (Neuladen)


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """1.1 → 1.2: Bis 1.1 war jede kombinierte Liste ein eigener Helfer-Eintrag. Jetzt gibt es einen
    Eintrag „SmartLists“ mit den Listen als Unter-Einträgen. Die alte unique_id wird mitgenommen,
    damit entity_id, Dashboards, Automationen und lokale Häkchen gleich bleiben."""
    if entry.version > 2:
        return False  # neuere Version als dieser Code
    if entry.version == 2:
        return True
    sub = ConfigSubentry(
        data=MappingProxyType({**entry.data, **entry.options, LEGACY_UNIQUE_ID: entry.entry_id}),
        subentry_type=SUBENTRY_COMBINED,
        title=entry.title,
        unique_id=None,
    )
    main = next(
        (e for e in hass.config_entries.async_entries(DOMAIN) if e.version >= 2 and e.entry_id != entry.entry_id),
        None,
    )
    if main is None:
        # erster alter Eintrag wird zum Haupteintrag
        hass.config_entries.async_update_entry(entry, version=2, title="SmartLists", data={}, options={})
        hass.config_entries.async_add_subentry(entry, sub)
        _LOGGER.info("SmartLists: Liste '%s' in die neue Struktur übernommen", sub.title)
        return True
    # weitere alte Einträge: als Unter-Eintrag beim Haupteintrag, alten Eintrag entfernen
    hass.config_entries.async_add_subentry(main, sub)
    _LOGGER.info("SmartLists: Liste '%s' zum Eintrag SmartLists verschoben", sub.title)
    hass.async_create_task(hass.config_entries.async_remove(entry.entry_id))
    return False


async def _async_move_files(hass: HomeAssistant) -> None:
    """Alte Dateien (.storage/smartlists.* und Sicherungen im Konfigurations-Ordner) nach .storage/smartlists/ umziehen."""
    from . import storage

    try:
        report = await hass.async_add_executor_job(storage.migrate_files, hass.config.config_dir)
    except Exception:  # noqa: BLE001 – ohne Umzug laufen die alten Dateien nicht mehr mit; das muss man sehen
        _LOGGER.exception("SmartLists: Umzug der Dateien nach .storage/smartlists fehlgeschlagen")
        report = {"moved": [], "kept_newer": [], "failed": ["unexpected error, see the log"]}
    if report["moved"] or report["kept_newer"]:
        _LOGGER.info("SmartLists: %d Dateien nach .storage/smartlists umgezogen%s", len(report["moved"]),
                     f", {len(report['kept_newer'])} ältere nach backups/integration/leftover gelegt" if report["kept_newer"] else "")
    if report["failed"]:
        _LOGGER.error("SmartLists: Dateien nicht umgezogen (bleiben am alten Ort): %s", "; ".join(report["failed"]))
        from . import problems

        problems.report(hass, "SL-STORE-01", "; ".join(report["failed"]))
        german = str(hass.config.language).startswith("de")
        from homeassistant.components import persistent_notification

        persistent_notification.async_create(
            hass, ("Einige Dateien ließen sich nicht nach `.storage/smartlists/` umziehen und liegen weiter am alten Ort. "
                   "Die betroffenen Daten fehlen bis dahin in SmartLists:\n\n- " if german else
                   "Some files could not be moved to `.storage/smartlists/` and are still in the old place. "
                   "Until then that data is missing in SmartLists:\n\n- ") + "\n- ".join(report["failed"]),
            title="SmartLists (SL-STORE-01)", notification_id="smartlists_move_failed")


async def _async_tidy_files(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Speicherdateien früher gelöschter Listen nach backups/deleted/ legen."""
    from . import storage
    from .const import SUBENTRY_OWN
    from .own_groups import iter_lists
    from .todo import list_key

    known = {name for name in storage.GLOBAL_STORES if name != "app_backups"} | {f"own.{list_id}" for _, list_id, _ in iter_lists(entry)}
    for sub in entry.subentries.values():
        known.add(f"own.{sub.subentry_id}" if sub.subentry_type == SUBENTRY_OWN else list_key(sub))
    from .combined_group import refs

    known |= {ref.key for ref in refs(entry)}
    try:
        moved = await hass.async_add_executor_job(storage.set_aside_unknown, hass.config.config_dir, known)
        if moved:
            _LOGGER.info("SmartLists: %d Speicherdateien gelöschter Listen nach backups/deleted gelegt", len(moved))
    except Exception:  # noqa: BLE001 – Aufräumen darf den Start nicht aufhalten
        _LOGGER.warning("SmartLists: Aufräumen alter Speicherdateien fehlgeschlagen", exc_info=True)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration einrichten: je kombinierter Liste (Unter-Eintrag) eine To-do-Entität."""
    await _async_register_panel(hass)
    # bis 3.6 war jede eigene Liste ein Unter-Eintrag → einmalig in Gruppen je Besitzer umziehen
    from .own_groups import async_migrate_legacy

    await async_migrate_legacy(hass, entry)
    # bis 4.0.0-beta.12 gab es je Besitzer eine Gruppe → eine gemeinsame Gruppe „Eigene Listen“
    from .own_groups import async_merge_groups

    await async_merge_groups(hass, entry)
    # bis 4.0.0-beta.16 war jede kombinierte Liste ein Unter-Eintrag → eine gemeinsame Gruppe „Kombinierte Listen“
    from .combined_group import async_merge as async_merge_combined

    await async_merge_combined(hass, entry)
    await _async_tidy_files(hass, entry)
    # fällige Artikel stündlich auf die eingestellte Liste (Konfigurieren → Sprache & Automationen)
    entry.async_on_unload(automation.async_setup_due_timer(hass))
    # Hinweise unter Einstellungen → Reparaturen (fehlende Quell-Listen, lange nicht gesehene Geräte)
    entry.async_on_unload(repairs.async_setup_checks(hass, entry))
    # Merkliste: alle 30 Minuten prüfen, ob etwas davon neu im Angebot ist (nur wenn die Benachrichtigung an ist)
    from .offers import async_setup_watch_timer

    entry.async_on_unload(async_setup_watch_timer(hass))
    from .reminders import async_setup_timer as async_setup_reminders

    entry.async_on_unload(async_setup_reminders(hass))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Gruppe „Notizen“ auf der Seite der Integration (je Notizliste eine Zeile)
    from . import notes_group

    entry.async_on_unload(notes_group.async_setup(hass, entry))
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


_RELOAD_PENDING = f"{DOMAIN}_reload_pending"


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Liste hinzugefügt/geändert/entfernt → neu laden.
    Mehrere Änderungen kurz hintereinander (z. B. mehrere Listen übernommen) ergeben genau EIN Neuladen:
    sonst liefen mehrere Neuladevorgänge ineinander und nur die erste neue Liste bekam ihre Entität."""
    pending: set[str] = hass.data.setdefault(_RELOAD_PENDING, set())
    if entry.entry_id in pending:
        return
    pending.add(entry.entry_id)
    try:
        await asyncio.sleep(0.5)
    finally:
        pending.discard(entry.entry_id)
    await hass.config_entries.async_reload(entry.entry_id)


async def async_remove_config_entry_device(hass: HomeAssistant, entry: ConfigEntry, device_entry) -> bool:
    """Gerät über die HA-Oberfläche löschen (⋮ → Löschen) – nur verbundene Geräte, nicht die Listen."""
    for domain, ident in device_entry.identifiers:
        if domain == DOMAIN and ident.startswith("app_"):
            hass.data[DOMAIN]["devices"].remove(ident.removeprefix("app_"))
            return True
    return False


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Integration entladen."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Integration gelöscht: erst alles sichern (removal_backup.py), dann alle Dateien unter .storage/smartlists/
    entfernen – nur backups/ bleibt (Sicherungen von SmartLists und aus SmartLists Go). Beim erneuten Einrichten
    bietet der Assistent an, die neueste Sicherung wiederherzustellen."""
    from . import storage
    from .removal_backup import async_backup_on_remove

    try:
        await async_backup_on_remove(hass, entry)
    except Exception:  # noqa: BLE001 – das Löschen darf an der Sicherung nicht scheitern
        _LOGGER.exception("SmartLists: Sicherung vor dem Entfernen fehlgeschlagen")
        from . import problems

        problems.report(hass, "SL-BACKUP-01", "on removal")

    try:
        await hass.async_add_executor_job(storage.remove_all_but_backups, hass.config.config_dir)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("SmartLists: Dateien beim Entfernen nicht gelöscht")
