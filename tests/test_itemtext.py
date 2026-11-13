from smartlists import itemtext as t

R = t.DEFAULT_TAG_RULES


def test_quantity_and_tags():
    p = t.parse("Milch 2 l @REWE *Anna #bio", R)
    assert (p.name, p.quantity, p.unit) == ("Milch", 2.0, "l")
    assert [x["kind"] for x in p.tags] == ["store", "person", "tag"]
    assert p.tags[0]["label"] == "REWE" and p.tags[0]["color"] == "#CC0000"


def test_typed_quantity_first_and_roundtrip():
    p = t.parse("2 kg Äpfel @lidl", R, allow_prefix_quantity=True)
    assert (p.name, p.quantity, p.unit) == ("Äpfel", 2.0, "kg")
    assert t.encode(p, R) == "Äpfel 2 kg @lidl"


def test_number_without_unit_is_not_a_unit():
    p = t.parse("2 Bananen", R, allow_prefix_quantity=True)
    assert (p.name, p.quantity, p.unit) == ("Bananen", 2.0, None)


def test_multipack_and_decimal_comma():
    p = t.parse("Joghurt 4× 150 g", R)
    assert (p.pack_count, p.quantity, p.unit) == (4, 150.0, "g")
    assert t.encode(t.parse("Milch 1,5 l", R), R) == "Milch 1,5 l"


def test_no_tag_without_space_and_duplicates():
    assert t.parse("Milch@REWE", R).tags == []
    assert len(t.parse("Spülmittel @dm @DM", R).tags) == 1


def test_custom_rules_and_validation():
    rules = t.validate_rules([{"prefix": "!", "kind": "store"}])
    p = t.parse("Brot !REWE @alt", rules)
    assert p.name == "Brot @alt" and p.tags[0]["label"] == "REWE"
    for bad in ([{"prefix": "a", "kind": "store"}], [{"prefix": "!", "kind": "store"}, {"prefix": "!", "kind": "tag"}]):
        try:
            t.validate_rules(bad)
        except ValueError:
            continue
        raise AssertionError(f"not rejected: {bad}")


def test_offer_line_variants_and_roundtrip():
    raw = '⚙OFFER:{"s":"REWE","e":"2026-11-14","p":0.39}'
    for text in (raw, "Erdbeere\n" + raw, raw.replace("⚙", "⚙️")):
        clean, offer, line = t.split_offer(text)
        assert offer["store_label"] == "REWE" and offer["price"] == 0.39
        assert t.join_offer(clean, line).replace("⚙️", "⚙") == text.strip().replace("⚙️", "⚙")
    assert t.split_offer("⚙OFFER:{kaputt")[1] is None
    assert t.split_offer("normale Notiz") == ("normale Notiz", None, "")


def test_person_from_list_name_and_list_names():
    assert t.person_from_list_name("", "todo.peter") == "Peter"
    assert t.person_from_list_name("Einkaufsliste Peter") == "Peter"
    assert t.person_from_list_name("Einkaufsliste") is None
    assert t.normalize_list_name("die Einkaufsliste") == t.normalize_list_name("todo.einkaufsliste")


def test_import_text_from_other_cards():
    """Texte anderer Quellen (Angebote-Karte): "2x Butcher's Burger Buns (REWE) - 0,99 €" → Menge, Markt-Badge, Preis."""
    rules = [{"kind": "store", "prefix": "@"}, {"kind": "person", "prefix": "*"}, {"kind": "tag", "prefix": "#"}]
    p = t.parse("2x Butcher’s Burger Buns (REWE) - 0,99 €", rules)
    assert (p.name, p.quantity, p.unit, p.price, p.imported) == ("Butcher’s Burger Buns", 2.0, None, 0.99, True)
    assert [(t["kind"], t["label"]) for t in p.tags] == [("store", "REWE")]
    assert t.encode(p, rules) == "Butcher’s Burger Buns 2 @REWE"
    q = t.parse("Meggle Kräuter-Butter (REWE) - 1,49 €", rules)
    assert (q.name, q.quantity, q.price) == ("Meggle Kräuter-Butter", None, 1.49) and q.tags[0]["label"] == "REWE"
    # nichts Fremdes anfassen: unbekannte Klammer, normale Texte, „2x4 Batterien“
    for text in ("Pizza (bio)", "Milch 2 l @REWE", "2x4 Batterien", "Kaffee (Tchibo)"):
        r = t.parse(text, rules)
        assert not r.imported and r.price is None, text
    assert t.parse("Bier (Lidl) - 10,99 EUR", rules).price == 10.99
