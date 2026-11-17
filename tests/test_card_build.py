"""Die Karte wird aus src/card/ gebaut – die ausgelieferte Datei muss dazu passen."""

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_card_is_built_from_parts():
    spec = importlib.util.spec_from_file_location("build_card", ROOT / "scripts" / "build_card.py")
    build_card = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_card)
    for name, (_, _, target) in build_card.CARDS.items():
        assert target.read_text(encoding="utf-8") == build_card.build(name), f"{target.name} ist nicht aktuell – `python scripts/build_card.py` ausführen"


def test_language_files_complete():
    """Je Sprache eine Datei in src/lang/card/ – die sechs mitgelieferten sind vollständig und kennen nichts Fremdes."""
    import json

    files = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in (ROOT / "src" / "lang" / "card").glob("*.json")}
    assert {"de", "en", "fr", "es", "it", "pl"} <= set(files)
    for lang, texts in files.items():
        assert all(isinstance(v, str) for v in texts.values()), lang
        assert not set(texts) - set(files["de"]), (lang, set(texts) - set(files["de"]))
        if lang in ("de", "en", "fr", "es", "it", "pl"):
            assert set(texts) == set(files["de"]), (lang, set(files["de"]) - set(texts))


def test_wizard_and_watch_list_titles_are_not_mixed_up():
    """w_title = Einrichtungsassistent, wl_title = Merkliste (waren einmal vertauscht)."""
    import json

    de = json.loads((ROOT / "src" / "lang" / "card" / "de.json").read_text(encoding="utf-8"))
    assert de["w_title"] == "SmartLists einrichten" and de["wl_title"] == "Merkliste"
    assert '"aria-label": t.w_title' in (ROOT / "src" / "card" / "36-card-settings.js").read_text(encoding="utf-8")
