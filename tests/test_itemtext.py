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
    for bad in ([{"prefix": "a", "kind": "store"}], [{"prefix": "!", "kind": "store"}, {"prefix": "!", "kind": "tag"}],
                [{"prefix": "#", "kind": "tag"}, {"prefix": "!", "kind": "tag"}]):
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


def test_unit_glued_to_number():
    """4.0: "1l", "2,5kg", "150g" ohne Leerzeichen sind Menge + Einheit – wie "1 l"."""
    from smartlists.itemtext import _parse_core

    for text, name, qty, unit, packs in [
        ("Milch 1l", "Milch", 1, "l", None),
        ("Milch 1L", "Milch", 1, "l", None),
        ("Kartoffeln 2,5kg", "Kartoffeln", 2.5, "kg", None),
        ("Joghurt 4x 150g", "Joghurt", 150, "g", 4),
        ("Zahnpasta 75ml", "Zahnpasta", 75, "ml", None),
    ]:
        item = _parse_core(text, [])
        assert (item.name, item.quantity, item.unit, item.pack_count) == (name, qty, unit, packs), text
    # keine Maßeinheit → bleibt Teil des Namens
    assert _parse_core("Batterien AA4", []).quantity is None
    assert _parse_core("Milch 1 l", []).unit == "l"


def test_password_iterations():
    """Neue Link-Passwörter mit 600 000 Runden; alte (ohne "iter") bleiben mit 120 000 gültig."""
    from smartlists import shares

    new = shares.make_password("geheim")
    assert new["iter"] == shares.PW_ITERATIONS == 600_000
    assert shares.check_password({"pw": new}, "geheim") and not shares.check_password({"pw": new}, "falsch")
    old = {"salt": "00" * 16, "hash": shares._pw_hash("alt", "00" * 16, 120_000)}
    assert shares.check_password({"pw": old}, "alt") and not shares.check_password({"pw": old}, "neu")
    assert not shares.check_password({"pw": {**old, "iter": 1}}, "alt")


def test_count_word_anywhere():
    """4.0: „2x“ als eigenes Wort ist die Anzahl, egal wo es steht; in Anführungszeichen bleibt es Text."""
    from smartlists.itemtext import parse

    def p(text):
        i = parse(text, [])
        return i.name, i.quantity, i.unit, i.pack_count

    assert p("milk 2l 2x") == ("milk", 2.0, "l", 2)
    assert p("milk 2x 2l") == ("milk", 2.0, "l", 2)
    assert p("2x milk 2l") == ("milk", 2.0, "l", 2)
    assert p("Joghurt 4x 150g") == ("Joghurt", 150.0, "g", 4)
    assert p("Cola 2x") == ("Cola", 2.0, None, None)
    assert p("2x Milch") == ("Milch", 2.0, None, None)
    assert p("Milch 3× Bio") == ("Milch Bio", 3.0, None, None)
    # kein eigenes Wort / in Anführungszeichen → Text
    assert p('Persil "2x" konzentriert') == ('Persil "2x" konzentriert', None, None, None)
    assert p("Batterien AA4") == ("Batterien AA4", None, None, None)
    assert p("Max2x Pulver") == ("Max2x Pulver", None, None, None)
    assert p("2x") == ("2x", None, None, None)
