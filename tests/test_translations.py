"""Übersetzungen: gleiche Schlüssel überall und nur gültige Platzhalter (sonst schlägt hassfest fehl)."""

import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "custom_components" / "smartlists"
FILES = [BASE / "strings.json", *sorted((BASE / "translations").glob("*.json"))]


def _strings(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _strings(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, str):
        yield path, obj


def test_placeholders_valid():
    bad = []
    for f in FILES:
        for path, text in _strings(json.loads(f.read_text(encoding="utf-8"))):
            if text.count("{") != text.count("}"):
                bad.append((f.name, path, "unbalanced"))
            for m in re.finditer(r"\{([^{}]*)\}", text):
                if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", m.group(1)):
                    bad.append((f.name, path, m.group(0)))
    assert not bad, bad


def test_same_keys_and_placeholders():
    ref = dict(_strings(json.loads(FILES[0].read_text(encoding="utf-8"))))
    for f in FILES[1:]:
        other = dict(_strings(json.loads(f.read_text(encoding="utf-8"))))
        assert set(other) == set(ref), (f.name, set(ref) ^ set(other))
        for key, text in ref.items():
            assert set(re.findall(r"\{(\w+)\}", other[key])) == set(re.findall(r"\{(\w+)\}", text)), (f.name, key)


def test_keys_valid_for_hassfest():
    """hassfest: Schlüssel nur [a-z0-9-_], nicht mit - oder _ beginnen/enden (z. B. kein "__all__")."""
    bad = []

    def walk(obj, path):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*[a-z0-9]|[a-z0-9]", k):
                    bad.append((path, k))
                walk(v, f"{path}.{k}")

    for f in FILES:
        walk(json.loads(f.read_text(encoding="utf-8")), f.name)
    assert not bad, bad[:10]
