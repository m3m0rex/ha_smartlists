"""Sensoren von SmartLists.

Je verbundenem Gerät (siehe devices.py) ein HA-Gerät mit „Zuletzt gesehen“ und „App-Version“, dazu – sobald die App
es meldet – Benutzer, letzter Abgleich, ausstehende Änderungen, verfügbare Version und letzte App-Sicherung.
Damit lassen sich z.B. Automationen bauen: „Melde mir, wenn ein Gerät seit 7 Tagen nicht abgeglichen hat.“

Je Liste von SmartLists (eigene und kombinierte): „Offen“, „Zuletzt geändert“, „Nächste Fälligkeit“, „Angebote“ und
„Geschätzte Summe“. Für den Haushalt: „Ausgaben diesen Monat“, „Fällig“, „Letzte Sicherung“ und „Probleme“.
Neu angelegt sind alle außer „Offen“ ausgeschaltet – wer sie braucht, schaltet sie am Gerät ein.
"""

from __future__ import annotations

import time
from datetime import date, datetime, timezone
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import list_stats
from .const import DOMAIN, SUBENTRY_COMBINED, SUBENTRY_OWN, SUBENTRY_OWN_GROUP
from .devices import SIGNAL_DEVICES_CHANGED, Devices

MANUFACTURER_FALLBACK = "SmartLists Go"
# parent device of all connected apps (they are shown as "connected via SmartLists Go")
APPS_DEVICE = (DOMAIN, "apps")


def device_identifier(device_id: str) -> tuple[str, str]:
    return (DOMAIN, f"app_{device_id}")


def app_device_info(hass: HomeAssistant, device_id: str) -> DeviceInfo | None:
    """Vollständige Geräte-Angaben des App-Geräts (nicht nur ein Verweis) – so hängt auch eine kombinierte
    Liste der App sicher an diesem Gerät, egal in welcher Reihenfolge die Plattformen starten."""
    d = (hass.data.get(DOMAIN, {}).get("devices").devices if hass.data.get(DOMAIN, {}).get("devices") else {}).get(device_id)
    if d is None:
        return None
    return DeviceInfo(
        identifiers={device_identifier(device_id)},
        name=d.get("name") or "Gerät",
        manufacturer=d.get("manufacturer") or MANUFACTURER_FALLBACK,
        model=d.get("model"),
        sw_version=d.get("app_version"),
        via_device=APPS_DEVICE,
    )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    devices: Devices = hass.data[DOMAIN]["devices"]
    known: set[str] = set()
    # "SmartLists Go" as the parent of all connected apps: the apps are listed below it (connected via)
    dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={APPS_DEVICE}, name="SmartLists Go", manufacturer="SmartLists",
        model="App", entry_type=dr.DeviceEntryType.SERVICE,
    )

    @callback
    def _add(device_id: str) -> None:
        if device_id in known or device_id not in devices.devices:
            return
        known.add(device_id)
        async_add_entities([cls(devices, device_id) for cls in (
            LastSeenSensor, AppVersionSensor, AppUserSensor, AppLastSyncSensor, AppPendingSensor, AppLatestVersionSensor, AppBackupSensor)])

    # Ausgaben dieses Monats (gebucht beim Abhaken von Artikeln mit Preis) – für Dashboards
    from .features import get_features

    expenses = ExpensesMonthSensor(hass)
    # Statistik und Ausgaben unter Extras ausgeschaltet → neu angelegt wird der Sensor gleich deaktiviert
    expenses._attr_entity_registry_enabled_default = get_features(hass)["stats"]
    async_add_entities([expenses, DueSensor(hass), LastBackupSensor(hass), ProblemsSensor(hass)])

    # je Liste von SmartLists: eigene (own_<Kennung>) und kombinierte (ihr Schlüssel) – am Gerät der Liste
    wanted: set[str] = set()
    for unique, subentry_id in list_uniques(entry):
        sensors = [cls(hass, unique) for cls in LIST_SENSORS]
        wanted |= {str(x.unique_id) for x in sensors}
        async_add_entities(sensors, config_subentry_id=subentry_id)
    # Sensoren gelöschter Listen aufräumen (eine eigene Liste verschwindet, ihre Gruppe bleibt)
    registry = er.async_get(hass)
    for ent in er.async_entries_for_config_entry(registry, entry.entry_id):
        if ent.domain == "sensor" and str(ent.unique_id).startswith("list_") and ent.unique_id not in wanted:
            registry.async_remove(ent.entity_id)

    for device_id in list(devices.devices):
        _add(device_id)

    @callback
    def _changed(device_id: str, is_new: bool) -> None:
        if device_id in devices.devices:
            _add(device_id)  # neu → anlegen; bekannt → Sensoren aktualisieren sich selbst
            _update_device_info(hass, devices, device_id)
            return
        # aus der Liste genommen → HA-Gerät (samt Sensoren) entfernen
        known.discard(device_id)
        registry = dr.async_get(hass)
        if (device := registry.async_get_device(identifiers={device_identifier(device_id)})) is not None:
            registry.async_remove_device(device.id)

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_DEVICES_CHANGED, _changed))


@callback
def _update_device_info(hass: HomeAssistant, devices: Devices, device_id: str) -> None:
    """Name/Modell/Version am HA-Gerät nachziehen (z.B. nach App-Update)."""
    registry = dr.async_get(hass)
    device = registry.async_get_device(identifiers={device_identifier(device_id)})
    if device is None:
        return
    d = devices.devices[device_id]
    parent = registry.async_get_device(identifiers={APPS_DEVICE})
    # the name follows the app (system, user, device); a name the user gave the device in Home Assistant stays
    registry.async_update_device(device.id, sw_version=d.get("app_version"), model=d.get("model"), name=d.get("name") or device.name,
                                 manufacturer=d.get("manufacturer") or device.manufacturer,
                                 **({"via_device_id": parent.id} if parent is not None else {}))


class ExpensesMonthSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "expenses_month"
    _attr_icon = "mdi:cash-multiple"
    _attr_native_unit_of_measurement = "€"
    _attr_state_class = "total"
    _attr_unique_id = "smartlists_expenses_month"
    _attr_should_poll = True  # alle 30 s – Buchungen passieren beim Abhaken

    def __init__(self, hass: HomeAssistant) -> None:
        self._extras = hass.data[DOMAIN]["extras"]
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    @property
    def native_value(self) -> float:
        return self._extras.month_total()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        rows = self._extras.expense_report("month", 1)["rows"]
        return {"stores": rows[-1]["stores"] if rows else {}}


class DueSensor(SensorEntity):
    """Wie viele offene Einträge heute fällig oder überfällig sind – für Dashboards und Automationen
    („wenn > 0, um 18 Uhr ansagen“). Die Einträge selbst stehen in den Attributen."""

    _attr_has_entity_name = True
    _attr_translation_key = "due"
    _attr_icon = "mdi:calendar-clock"
    _attr_unique_id = "smartlists_due"
    _attr_should_poll = True  # alle 30 s – Fälligkeiten ändern sich mit der Uhr und beim Abhaken

    def __init__(self, hass: HomeAssistant) -> None:
        self._extras = hass.data[DOMAIN]["extras"]
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    def _items(self) -> list[dict[str, Any]]:
        from homeassistant.util import dt as dt_util

        items = self._extras.due_now(dt_util.now())
        for item in items:
            state = self.hass.states.get(item["entity_id"]) if self.hass else None
            item["list"] = state.name if state else item["entity_id"]
        return items

    @property
    def native_value(self) -> int:
        return len(self._items())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        items = self._items()
        return {"overdue": sum(1 for i in items if i["overdue"]),
                "items": [{"name": i["name"], "list": i["list"], "due": i["due"], "overdue": i["overdue"]} for i in items[:50]]}


class _DeviceSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _key = ""

    def __init__(self, devices: Devices, device_id: str) -> None:
        self._devices = devices
        self._device_id = device_id
        d = devices.devices[device_id]
        self._attr_unique_id = f"app_{device_id}_{self._key}"
        self._attr_translation_key = self._key
        self._attr_device_info = DeviceInfo(
            identifiers={device_identifier(device_id)},
            name=d.get("name") or "Gerät",
            manufacturer=d.get("manufacturer") or MANUFACTURER_FALLBACK,
            model=d.get("model"),
            sw_version=d.get("app_version"),
            via_device=APPS_DEVICE,
        )

    @property
    def _data(self) -> dict[str, Any]:
        return self._devices.devices.get(self._device_id, {})

    @property
    def available(self) -> bool:
        return self._device_id in self._devices.devices

    async def async_added_to_hass(self) -> None:
        @callback
        def _changed(device_id: str, _is_new: bool) -> None:
            if device_id == self._device_id and self.available:
                self.async_write_ha_state()

        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DEVICES_CHANGED, _changed))


class LastSeenSensor(_DeviceSensor):
    _key = "last_seen"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:cellphone-check"

    @property
    def native_value(self) -> datetime | None:
        ts = self._data.get("last_seen")
        return datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        info = self._devices.describe(self._device_id) if self.available else {}
        first = info.get("first_seen")
        return {
            "user": info.get("user_name"),
            "android_version": info.get("os_version"),
            "first_seen": datetime.fromtimestamp(first, tz=timezone.utc).isoformat() if first else None,
            "stale": info.get("stale"),
        }


def list_uniques(entry: Any) -> list[tuple[str, str]]:
    """(unique_id der To-do-Entität, Unter-Eintrag) aller Listen, die SmartLists selbst führt."""
    out: list[tuple[str, str]] = []
    for sub in entry.subentries.values():
        if sub.subentry_type == SUBENTRY_OWN_GROUP:
            out += [(f"own_{list_id}", sub.subentry_id) for list_id in (sub.data.get("lists") or {})]
        elif sub.subentry_type == SUBENTRY_OWN:
            out.append((f"own_{sub.subentry_id}", sub.subentry_id))
    from .combined_group import refs

    out += [(ref.key, ref.subentry_id) for ref in refs(entry)]
    return out


_LIST_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
LIST_CACHE_SECONDS = 60


async def _list_summary(hass: HomeAssistant, entity_id: str) -> dict[str, Any]:
    """Offen / Angebote / Summe einer Liste – höchstens einmal je Minute berechnet, für alle Sensoren der Liste."""
    hit = _LIST_CACHE.get(entity_id)
    if hit and time.monotonic() - hit[0] < LIST_CACHE_SECONDS:
        return hit[1]
    from . import lists
    from .offers import collect, deals_for

    extras = hass.data[DOMAIN].get("extras")
    payload = await lists.get_list(hass, entity_id)
    offers = collect(hass, extras.watch_settings.get("sources") if extras else None)
    result = list_stats.summary(payload.get("items") or [], offers, deals_for)
    _LIST_CACHE[entity_id] = (time.monotonic(), result)
    return result


class _ListSensor(SensorEntity):
    """Sensor am Gerät einer Liste. Die Liste wird über die unique_id ihrer To-do-Entität gefunden – so stimmt es
    auch, wenn jemand die Entität umbenennt."""

    _attr_has_entity_name = True
    _attr_should_poll = True  # alle 30 s; das Teure (Angebote, Summe) wird je Minute nur einmal berechnet
    _attr_entity_registry_enabled_default = False
    _key = ""

    def __init__(self, hass: HomeAssistant, unique: str) -> None:
        self._unique = unique
        self._attr_unique_id = f"list_{unique}_{self._key}"
        self._attr_translation_key = f"list_{self._key}"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, f"list_{unique}")})

    @property
    def list_entity_id(self) -> str | None:
        return er.async_get(self.hass).async_get_entity_id("todo", DOMAIN, self._unique) if self.hass else None


class ListOpenSensor(_ListSensor):
    _key = "open"
    _attr_icon = "mdi:format-list-checks"
    _attr_state_class = "measurement"
    _attr_entity_registry_enabled_default = True

    @property
    def native_value(self) -> int | None:
        state = self.hass.states.get(self.list_entity_id or "")
        try:
            return int(state.state) if state else None
        except ValueError:
            return None


class ListChangedSensor(_ListSensor):
    _key = "changed"
    _attr_icon = "mdi:history"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime | None:
        log = self.hass.data[DOMAIN].get("itemlog")
        ts = list_stats.last_change(log.log.get(self.list_entity_id or "") if log else None)
        return datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None


class ListNextDueSensor(_ListSensor):
    _key = "next_due"
    _attr_icon = "mdi:calendar-clock"
    _attr_device_class = SensorDeviceClass.DATE

    @property
    def native_value(self) -> date | None:
        extras = self.hass.data[DOMAIN].get("extras")
        day = list_stats.next_due(extras.item_marks.get(self.list_entity_id or "") if extras else None)
        try:
            return date.fromisoformat(day) if day else None
        except ValueError:
            return None


class _ListSummarySensor(_ListSensor):
    _field = ""

    async def async_update(self) -> None:
        entity_id = self.list_entity_id
        if not entity_id or self.hass.states.get(entity_id) is None:
            self._attr_native_value = None
            return
        try:
            data = await _list_summary(self.hass, entity_id)
        except Exception:  # noqa: BLE001 – ein Sensor darf die Liste nicht stören
            self._attr_native_value = None
            return
        self._attr_native_value = data[self._field]
        self._summary = data


class ListOffersSensor(_ListSummarySensor):
    """Für wie viele offene Einträge es gerade ein Angebot gibt."""

    _key = "offers"
    _field = "offers"
    _attr_icon = "mdi:tag-multiple"
    _attr_state_class = "measurement"


class ListTotalSensor(_ListSummarySensor):
    """Was die offenen Einträge zusammen ungefähr kosten (nur die mit bekanntem Preis)."""

    _key = "total"
    _field = "total"
    _attr_icon = "mdi:cash"
    _attr_device_class = SensorDeviceClass.MONETARY
    _summary: dict[str, Any] = {}

    @property
    def native_unit_of_measurement(self) -> str | None:
        return self.hass.config.currency if self.hass else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"priced_items": self._summary.get("priced"), "open_items": self._summary.get("open")}


LIST_SENSORS = (ListOpenSensor, ListChangedSensor, ListNextDueSensor, ListOffersSensor, ListTotalSensor)


class LastBackupSensor(SensorEntity):
    """Wann SmartLists zuletzt eine eigene Sicherung geschrieben hat (.storage/smartlists/backups/integration)."""

    _attr_has_entity_name = True
    _attr_translation_key = "last_backup"
    _attr_icon = "mdi:backup-restore"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_unique_id = "smartlists_last_backup"
    _attr_entity_registry_enabled_default = False
    _attr_should_poll = True

    def __init__(self, hass: HomeAssistant) -> None:
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    async def async_update(self) -> None:
        from . import storage

        ts = await self.hass.async_add_executor_job(storage.newest_backup, self.hass.config.config_dir)
        self._attr_native_value = datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None


class ProblemsSensor(SensorEntity):
    """Wie viele harte Fehler SmartLists seit dem Start festgehalten hat; die Kennungen stehen in den Attributen."""

    _attr_has_entity_name = True
    _attr_translation_key = "problems"
    _attr_icon = "mdi:alert-circle-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_unique_id = "smartlists_problems"
    _attr_entity_registry_enabled_default = False
    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant) -> None:
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, "household")}, name="SmartLists", manufacturer="SmartLists")

    def _current(self) -> list[dict[str, Any]]:
        from . import problems

        return problems.current(self.hass)

    @property
    def native_value(self) -> int:
        return len(self._current())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"codes": sorted({p["code"] for p in self._current()}),
                "problems": [{"code": p["code"], "text": p["text"], "count": p["count"]} for p in self._current()[:20]]}

    async def async_added_to_hass(self) -> None:
        from .problems import SIGNAL_PROBLEMS

        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_PROBLEMS, self.async_write_ha_state))


class _AppExtraSensor(_DeviceSensor):
    """Angaben, die die App beim Abgleich mitschickt – solange sie nichts meldet, bleibt der Sensor leer."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_entity_registry_enabled_default = False


class AppUserSensor(_AppExtraSensor):
    _key = "app_user"
    _attr_icon = "mdi:account"

    @property
    def native_value(self) -> str | None:
        return self._data.get("user_name") or None


class AppLastSyncSensor(_AppExtraSensor):
    _key = "app_last_sync"
    _attr_icon = "mdi:sync"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime | None:
        ts = self._data.get("last_sync")
        return datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None


class AppPendingSensor(_AppExtraSensor):
    _key = "app_pending"
    _attr_icon = "mdi:cloud-upload-outline"
    _attr_state_class = "measurement"

    @property
    def native_value(self) -> int | None:
        return self._data.get("pending")


class AppLatestVersionSensor(_AppExtraSensor):
    """Die neueste Version, die die App bei ihrer eigenen Prüfung gefunden hat (Home Assistant fragt nirgends nach)."""

    _key = "app_latest_version"
    _attr_icon = "mdi:cellphone-arrow-down"

    @property
    def native_value(self) -> str | None:
        return self._data.get("latest_version") or None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        latest, mine = self._data.get("latest_version"), self._data.get("app_version")
        return {"update_available": bool(latest and mine and latest != mine)}


class AppBackupSensor(_AppExtraSensor):
    _key = "app_backup"
    _attr_icon = "mdi:cellphone-lock"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_should_poll = True

    @property
    def native_value(self) -> datetime | None:
        store = self.hass.data[DOMAIN].get("app_backups") if self.hass else None
        backup = (store.backups if store else {}).get(self._device_id)
        ms = (backup or {}).get("updated_at")
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc) if ms else None


class AppVersionSensor(_DeviceSensor):
    _key = "app_version"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_icon = "mdi:information-outline"

    @property
    def native_value(self) -> str | None:
        return self._data.get("app_version")
