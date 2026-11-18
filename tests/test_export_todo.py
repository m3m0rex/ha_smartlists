"""Als normale To-do-Liste kopieren: was je Eintrag mitkommt."""

from smartlists.export_todo import item_fields


def test_text_note_and_due_date_are_carried_over():
    assert item_fields({"text": "2 l Milch @REWE", "note": "fettarm"}) == {"item": "2 l Milch @REWE", "description": "fettarm"}
    assert item_fields({"text": "Bananen", "note": ""}, {"due": "2026-11-20"}) == {"item": "Bananen", "due_date": "2026-11-20"}
    assert item_fields({"text": "Müll", "note": None}, {"due": "2026-11-20T18:00"}) == {"item": "Müll", "due_datetime": "2026-11-20 18:00:00"}


def test_the_technical_offer_line_is_left_out():
    fields = item_fields({"text": "Butter", "note": "die gute\n⚙️OFFER:{\"store\":\"REWE\",\"price\":1.49}"})
    assert fields["item"] == "Butter" and "OFFER" not in fields.get("description", "")
