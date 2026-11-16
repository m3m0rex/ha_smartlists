#!/usr/bin/env python3
"""Baut custom_components/smartlists/www/smartlists-card.js aus den Teilen in src/card/.

Die Karte wird von Home Assistant als EINE Datei geladen. Bearbeitet wird sie in src/card/ – die Teile werden in
Reihenfolge ihrer Dateinamen (00-…, 05-…) aneinandergehängt. Es sind bewusst keine ES-Module und es gibt keine
Abhängigkeiten: die Teile 30–39 sind Abschnitte derselben Klasse SmartListsCard.

    python scripts/build_card.py          # bauen
    python scripts/build_card.py --check  # prüfen, ob die gebaute Datei aktuell ist (CI/Tests)
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / "src" / "card"
TARGET = ROOT / "custom_components" / "smartlists" / "www" / "smartlists-card.js"


def build() -> str:
    parts = sorted(PARTS.glob("*.js"))
    if not parts:
        raise SystemExit(f"Keine Teile in {PARTS}")
    text = "".join(p.read_text(encoding="utf-8") for p in parts)
    return text[:-1] if text.endswith("\n\n") else text


def main() -> int:
    text = build()
    if "--check" in sys.argv:
        if TARGET.read_text(encoding="utf-8") != text:
            print("smartlists-card.js ist nicht aktuell – bitte `python scripts/build_card.py` ausführen.")
            return 1
        print("smartlists-card.js ist aktuell.")
        return 0
    TARGET.write_text(text, encoding="utf-8", newline="\n")
    print(f"{TARGET.relative_to(ROOT)}: {len(text.splitlines())} Zeilen aus {len(list(PARTS.glob('*.js')))} Teilen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
