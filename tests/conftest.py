"""Tests ohne Home-Assistant-Installation: die wenigen HA-Module, die die getesteten Dateien importieren,
werden durch kleine Platzhalter ersetzt. Getestet werden die reinen Logik-Teile (Text, Rechte, Rhythmus)."""

import importlib.abc
import importlib.machinery
import inspect
import sys
import types
from pathlib import Path


def _mod(name, **attrs):
    module = sys.modules.get(name) or types.ModuleType(name)
    module.__dict__.update(attrs)
    if name.split(".")[0] != "smartlists":  # beim eigenen Paket sollen fehlende Namen echte Unter-Module laden
        module.__dict__.setdefault("__getattr__", lambda attr: _stub_attr(attr))
    module.__path__ = []
    sys.modules[name] = module
    return module


class _Store:
    def __init__(self, *args):
        self.saved = None

    async def async_load(self):
        return None

    def async_delay_save(self, func, delay):
        self.saved = func()

    async def async_save(self, data):
        self.saved = data


class _StubMeta(type):
    def __getattr__(cls, name):
        if name.startswith("__"):
            raise AttributeError(name)
        return _Stub


class _Stub(metaclass=_StubMeta):
    """Platzhalter für alles aus Home Assistant, das die Tests nicht wirklich brauchen: als Basisklasse, als
    Dekorator (mit und ohne Argumente) und als Konstante benutzbar."""

    def __new__(cls, *args, **kwargs):
        if cls is _Stub and len(args) == 1 and not kwargs and (inspect.isfunction(args[0]) or inspect.isclass(args[0])):
            return args[0]  # @dekorator ohne Klammern
        return super().__new__(cls)

    def __init__(self, *args, **kwargs):
        pass

    def __call__(self, *args, **kwargs):
        if len(args) == 1 and not kwargs and inspect.isfunction(args[0]):
            return args[0]  # @dekorator(...) mit Argumenten
        return self

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        return _Stub()

    def __class_getitem__(cls, item):
        return cls


def _ws_command(schema):
    """Wie websocket_api.websocket_command: merkt sich das Schema, damit Tests die Befehle prüfen können."""
    def deco(func):
        func._ws_schema = schema
        return func
    return deco


class _StubFinder(importlib.abc.MetaPathFinder, importlib.abc.Loader):
    """Fehlende homeassistant.*-Module (und voluptuous) entstehen beim Import als Platzhalter."""

    def find_spec(self, fullname, path, target=None):
        if fullname.split(".")[0] in ("homeassistant", "voluptuous", "aiohttp") and fullname not in sys.modules:
            return importlib.machinery.ModuleSpec(fullname, self, is_package=True)
        return None

    def create_module(self, spec):
        module = types.ModuleType(spec.name)
        module.__path__ = []
        module.__getattr__ = lambda name: _stub_attr(name)
        return module

    def exec_module(self, module):
        if module.__name__ == "voluptuous":
            # Schlüssel bleiben einfache Texte: {"type": "smartlists/…", "entity_id": str, …}
            module.Required = module.Optional = lambda key, **kwargs: key


def _stub_attr(name):
    if name.startswith("__"):
        raise AttributeError(name)
    return _Stub


if "homeassistant" not in sys.modules:
    _mod("homeassistant")
    _mod("homeassistant.core", HomeAssistant=object, callback=lambda f: f, Context=object, Event=object)
    _mod("homeassistant.helpers")
    _mod("homeassistant.helpers.storage", Store=_Store)
    _mod("homeassistant.helpers.dispatcher", async_dispatcher_send=lambda *a: None)
    _mod("homeassistant.const", ATTR_FRIENDLY_NAME="friendly_name", EVENT_CALL_SERVICE="call_service",
         EVENT_HOMEASSISTANT_STOP="homeassistant_stop")
    _mod("homeassistant.components")
    _mod("homeassistant.components.http", HomeAssistantView=object)
    _mod("homeassistant.helpers.aiohttp_client", async_get_clientsession=lambda hass: None)
    _mod("homeassistant.helpers.event", async_call_later=lambda *a: (lambda: None), async_track_time_interval=lambda *a: (lambda: None))
    _mod("homeassistant.helpers.issue_registry")
if "aiohttp" not in sys.modules:
    _mod("aiohttp", web=types.SimpleNamespace(Request=object, Response=object, json_response=None))

# Paket „smartlists“ direkt aus custom_components laden, ohne dessen __init__ (braucht echtes HA)
_pkg = _mod("smartlists")
_pkg.__path__ = [str(Path(__file__).resolve().parent.parent / "custom_components" / "smartlists")]

if not any(isinstance(f, _StubFinder) for f in sys.meta_path):
    sys.meta_path.append(_StubFinder())


class HomeAssistantError(Exception):
    pass


class ServiceValidationError(HomeAssistantError):
    def __init__(self, *args, **kwargs):
        super().__init__(*args or (kwargs.get("translation_key", ""),))


# Für die Tests der WebSocket-Befehle: echte Ausnahmen und ein websocket_api, das sich Schema und Anmeldung merkt
if "homeassistant.exceptions" not in sys.modules:
    _mod("homeassistant.exceptions", HomeAssistantError=HomeAssistantError, ServiceValidationError=ServiceValidationError)
if "homeassistant.components.websocket_api" not in sys.modules:
    sys.modules["homeassistant.components"].websocket_api = _mod(
        "homeassistant.components.websocket_api", websocket_command=_ws_command, async_response=lambda func: func,
        require_admin=lambda func: func, ERR_UNAUTHORIZED="unauthorized", ERR_NOT_FOUND="not_found", ActiveConnection=object,
        async_register_command=lambda hass, handler: hass.data.setdefault("_ws", []).append(handler))
