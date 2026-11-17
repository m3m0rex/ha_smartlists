#!/usr/bin/env python3
"""Baut die SmartLists-Karte aus ihren Teilen und den Sprachdateien.

    src/card/*.js  + src/lang/card/*.json  →  custom_components/smartlists/www/smartlists-card.js

(Die Angebots-Karte ist ein eigenes Projekt: github.com/m3m0rex/ha_smartdiscounts-card.)

Home Assistant lädt die Karte als EINE Datei. Bearbeitet wird in src/ – die Teile werden in der Reihenfolge ihrer
Dateinamen (00-…, 05-…) aneinandergehängt. Es sind bewusst keine ES-Module und es gibt keine Abhängigkeiten.

Sprachen: je Sprache eine JSON-Datei (de.json ist die Vorlage, en.json der Ersatz für fehlende Einträge). Eine neue
Sprache ist eine neue Datei – siehe src/lang/README.md.

    python scripts/build_card.py          # bauen
    python scripts/build_card.py --check  # prüfen, ob die gebaute Datei aktuell ist (CI/Tests)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WWW = ROOT / "custom_components" / "smartlists" / "www"
PARTS = ROOT / "src" / "card"
TARGET = WWW / "smartlists-card.js"
CARDS = {
    "card": (PARTS, ROOT / "src" / "lang" / "card", TARGET),
}
PLACEHOLDER = "/*__TEXTS__*/"


def languages(folder: Path) -> dict[str, dict[str, str]]:
    """Alle Sprachdateien eines Ordners: Deutsch und Englisch zuerst, fehlende Einträge aus dem Englischen."""
    raw = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(folder.glob("*.json"))}
    if "de" not in raw or "en" not in raw:
        raise SystemExit(f"{folder}: de.json und en.json werden gebraucht")
    order = ["de", "en", *[code for code in raw if code not in ("de", "en")]]
    out = {}
    for code in order:
        texts = raw[code]
        unknown = [key for key in texts if key not in raw["de"]]
        if unknown:
            raise SystemExit(f"{folder.name}/{code}.json: unbekannte Einträge (nicht in de.json): {', '.join(unknown[:8])}")
        # ein leerer Text ist erlaubt (z. B. eine Endung, die es in der Sprache nicht gibt) – ersetzt wird nur Fehlendes
        out[code] = {key: texts[key] if key in texts else raw["en"].get(key, raw["de"][key]) for key in raw["de"]}
    return out


def texts_js(folder: Path) -> str:
    rows = [f"  {json.dumps(code)}: {json.dumps(texts, ensure_ascii=False)}," for code, texts in languages(folder).items()]
    return "const TEXTS = {\n" + "\n".join(rows) + "\n};"


def build(name: str = "card") -> str:
    parts_dir, lang_dir, _ = CARDS[name]
    parts = sorted(parts_dir.glob("*.js"))
    if not parts:
        raise SystemExit(f"Keine Teile in {parts_dir}")
    text = "".join(p.read_text(encoding="utf-8") for p in parts)
    if text.count(PLACEHOLDER) != 1:
        raise SystemExit(f"{parts_dir}: genau ein {PLACEHOLDER} erwartet")
    text = text.replace(PLACEHOLDER, texts_js(lang_dir))
    return text[:-1] if text.endswith("\n\n") else text


def main() -> int:
    stale = []
    for name, (parts_dir, _, target) in CARDS.items():
        text = build(name)
        if "--check" in sys.argv:
            if not target.exists() or target.read_text(encoding="utf-8") != text:
                stale.append(target.name)
            continue
        target.write_text(text, encoding="utf-8", newline="\n")
        print(f"{target.relative_to(ROOT)}: {len(text.splitlines())} Zeilen aus {len(list(parts_dir.glob('*.js')))} Teilen")
    if "--check" in sys.argv:
        if stale:
            print(f"{', '.join(stale)} nicht aktuell – bitte `python scripts/build_card.py` ausführen.")
            return 1
        print("smartlists-card.js ist aktuell.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
