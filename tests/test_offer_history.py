"""Preisverlauf der Angebote: zentral, für alle Browser gleich."""

from smartlists.offer_history import KEEP_DAYS, OfferHistory, offer_key


def test_key_matches_the_card():
    assert offer_key("REWE", "Bio-Bananen") == "rewe|bio-bananen"
    assert offer_key("Müller", "Weißbrot Crème") == "muller|weissbrot creme"


def test_price_change_keeps_the_previous_price_with_its_date():
    h = OfferHistory(None)
    assert h.merge([("rewe|milch", 1.19)], "2026-11-01") == {"rewe|milch": {"p": 1.19, "d": "2026-11-01"}}
    assert h.merge([("rewe|milch", 1.19)], "2026-11-05")["rewe|milch"] == {"p": 1.19, "d": "2026-11-05"}       # gleicher Preis: nur das Datum
    now = h.merge([("rewe|milch", 0.99)], "2026-11-10")["rewe|milch"]
    assert now == {"p": 0.99, "d": "2026-11-10", "pp": 1.19, "pd": "2026-11-05"}
    h.merge([("rewe|milch", 1.29)], "2026-11-17")
    assert h.seen["rewe|milch"]["h"] == [["2026-11-10", 0.99], ["2026-11-05", 1.19]]                            # neuester zuerst
    # dieselbe Abfrage aus einem zweiten Browser am selben Tag ändert nichts
    assert h.merge([("rewe|milch", 1.29)], "2026-11-17")["rewe|milch"]["pp"] == 0.99


def test_same_name_twice_in_one_store_is_left_out():
    h = OfferHistory(None)
    assert h.merge([("rewe|cola", 0.99), ("rewe|cola", 1.49), ("aldi|cola", 0.89)], "2026-11-01") == {"aldi|cola": {"p": 0.89, "d": "2026-11-01"}}


def test_old_entries_fall_out():
    h = OfferHistory(None)
    h.merge([("rewe|alt", 1.0)], "2026-01-01")
    h.merge([("rewe|neu", 2.0)], "2026-11-18")
    assert list(h.seen) == ["rewe|neu"] and KEEP_DAYS == 90


def test_history_of_a_browser_is_adopted_once():
    h = OfferHistory(None)
    h.merge([("rewe|milch", 1.29)], "2026-11-17")
    taken = h.adopt({"rewe|milch": {"p": 1.29, "d": "2026-11-17", "pp": 0.99, "pd": "2026-11-10"},     # Vorpreis fehlt hier: übernehmen
                     "aldi|brot": {"p": 1.49, "d": "2026-11-12"},                                      # unbekannt: übernehmen
                     "kaputt": {"p": "x"}, "rewe|falsch": {"p": 1, "d": "gestern"}})
    assert taken == 2 and h.seen["rewe|milch"]["pp"] == 0.99 and h.seen["aldi|brot"]["p"] == 1.49
    assert h.adopt({"rewe|milch": {"p": 1.29, "d": "2026-11-17", "pp": 0.79, "pd": "2026-11-01"}}) == 0   # schon bekannt: bleibt


def test_background_record_from_the_sensors():
    h = OfferHistory(None)
    assert h.record([{"name": "Bio-Bananen", "price": 1.79, "store": "REWE", "until": None}]) == 1
    assert "rewe|bio-bananen" in h.seen
