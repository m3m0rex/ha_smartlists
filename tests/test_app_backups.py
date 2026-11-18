"""App-Sicherungen: eine Datei je HA-Benutzer, Umzug aus der alten gemeinsamen Datei."""

import asyncio

from smartlists import app_backups

FILES: dict = {}


class _Store:
    def __init__(self, hass, version, key):
        self.key = key

    async def async_load(self):
        return FILES.get(self.key)

    async def async_save(self, data):
        FILES[self.key] = data

    def async_delay_save(self, func, delay):
        FILES[self.key] = func()


class _Hass:
    class config:
        config_dir = "/nirgends"

    def __init__(self):
        self.aside = []

    async def async_add_executor_job(self, func, *args):
        if func.__name__ == "set_aside":
            self.aside.append(args[1])
            FILES.pop(app_backups.LEGACY_KEY, None)
            return "x"
        return [k.rsplit("/", 1)[1] for k in FILES if k.startswith("smartlists/backups/app/")]


def test_legacy_moves_to_one_file_per_user(monkeypatch):
    monkeypatch.setattr(app_backups, "Store", _Store)
    FILES.clear()
    FILES[app_backups.LEGACY_KEY] = {"backups": {
        "a1": {"user_id": "anna", "data": "{}", "profile_name": "A", "updated_at": 1},
        "b1": {"user_id": "ben", "data": "{}", "profile_name": "B", "updated_at": 2}}}
    hass = _Hass()
    store = app_backups.AppBackups(hass)
    asyncio.run(store.async_load())
    assert set(FILES["smartlists/backups/app/anna"]["backups"]) == {"a1"}
    assert set(FILES["smartlists/backups/app/ben"]["backups"]) == {"b1"}
    assert hass.aside == ["app_backups"] and app_backups.LEGACY_KEY not in FILES
    # neu laden: kommt aus den Dateien je Benutzer
    again = app_backups.AppBackups(hass)
    asyncio.run(again.async_load())
    assert set(again.backups) == {"a1", "b1"}


def test_save_and_delete_touch_only_own_file(monkeypatch):
    monkeypatch.setattr(app_backups, "Store", _Store)
    FILES.clear()
    store = app_backups.AppBackups(_Hass())
    store.save("d1", "Smartphone", "{}", "anna", "Anna")
    store.save("d2", "Tablet", "{}", "ben", "Ben")
    assert set(FILES["smartlists/backups/app/anna"]["backups"]) == {"d1"}
    store.save("d1", "Smartphone", "{}", "ben", "Ben")  # Gerät gehört jetzt Ben
    assert FILES["smartlists/backups/app/anna"]["backups"] == {}
    assert set(FILES["smartlists/backups/app/ben"]["backups"]) == {"d1", "d2"}
    assert store.delete("d2") and set(FILES["smartlists/backups/app/ben"]["backups"]) == {"d1"}
