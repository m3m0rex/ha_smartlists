"""Zahlen je Liste für die Sensoren (sensor.py): nächste Fälligkeit, passende Angebote, geschätzte Summe.

Reine Funktionen – ohne Home Assistant prüfbar (tests/test_list_stats.py).
"""

from __future__ import annotations

from typing import Any, Callable


def next_due(marks: dict[str, dict[str, Any]] | None) -> str | None:
    """Früheste Fälligkeit der offenen Einträge einer Liste als Datum (JJJJ-MM-TT)."""
    days = sorted(str(m["due"])[:10] for m in (marks or {}).values() if m.get("due") and not m.get("closed"))
    return days[0] if days else None


def last_change(rows: list[dict[str, Any]] | None) -> int | None:
    """Zeitpunkt der letzten Änderung laut Verlauf (itemlog), in Sekunden."""
    times = [int(r["t"]) for r in rows or [] if r.get("t")]
    return max(times) if times else None


def summary(items: list[dict[str, Any]], offers: list[dict[str, Any]] | None = None,
            deals_for: Callable[[list[dict[str, Any]], str], list[dict[str, Any]]] | None = None) -> dict[str, Any]:
    """Aus den Einträgen einer Liste (lists.get_list): wie viele offen sind, für wie viele offene es gerade ein
    Angebot gibt und was die offenen zusammen ungefähr kosten (nur Einträge mit bekanntem Preis; priced = wie viele)."""
    open_items = [i for i in items if not i.get("checked")]
    with_offer = 0
    for item in open_items:
        name = str(item.get("name") or "")
        if item.get("offer") or (offers and deals_for and name and deals_for(offers, name)):
            with_offer += 1
    prices = [float(i["price"]["total"]) for i in open_items if isinstance(i.get("price"), dict) and i["price"].get("total") is not None]
    return {"open": len(open_items), "offers": with_offer, "total": round(sum(prices), 2), "priced": len(prices)}
