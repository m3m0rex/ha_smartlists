"""Die Karte wird aus src/card/ gebaut – die ausgelieferte Datei muss dazu passen."""

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_card_is_built_from_parts():
    spec = importlib.util.spec_from_file_location("build_card", ROOT / "scripts" / "build_card.py")
    build_card = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_card)
    built = build_card.TARGET.read_text(encoding="utf-8")
    assert built == build_card.build(), "smartlists-card.js ist nicht aktuell – `python scripts/build_card.py` ausführen"
