from smartlists.own import permissions_for, role_for

DATA = {"owner": "anna", "shares": {"max": "editor", "lisa": "checker", "tom": "viewer", "x": "superuser"}}


def test_roles():
    assert role_for(DATA, "anna", False) == "owner"
    assert role_for(DATA, "max", False) == "editor"
    assert role_for(DATA, "lisa", False) == "checker"
    assert role_for(DATA, "tom", False) == "viewer"
    assert role_for(DATA, "stranger", False) is None
    assert role_for(DATA, "x", False) is None  # unbekannte Rolle = kein Zugriff
    assert role_for(DATA, "hans", True) == "owner"  # Admin
    assert role_for(DATA, None, False) == "owner"  # Automation / System


def test_permissions_are_cumulative():
    assert permissions_for(None) == {k: False for k in permissions_for(None)}
    assert permissions_for("viewer")["view"] and not permissions_for("viewer")["toggle"]
    assert permissions_for("checker")["toggle"] and not permissions_for("checker")["rename"]
    e = permissions_for("editor")
    assert e["add"] and e["delete"] and e["reorder"] and not e["share"]
    assert permissions_for("owner")["share"]


def test_context_age_float_and_datetime():
    """HA speichert _context_set je nach Version als time.time()-Zahl oder datetime – beides muss gehen."""
    import ast
    import datetime
    import time
    import types
    from pathlib import Path

    src = (Path(__file__).resolve().parent.parent / "custom_components" / "smartlists" / "todo.py").read_text(encoding="utf-8")
    fn = next(n for n in ast.parse(src).body if isinstance(n, ast.FunctionDef) and n.name == "_age_seconds")
    ns = {"datetime": datetime, "Any": object,
          "dt_util": types.SimpleNamespace(utcnow=lambda: datetime.datetime.now(datetime.timezone.utc))}
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "todo.py", "exec"), ns)
    age = ns["_age_seconds"]
    assert age(time.time()) < 1
    assert age(time.time() - 10) > 5
    assert age(datetime.datetime.now(datetime.timezone.utc)) < 1
    assert age(None) == float("inf")


def test_combined_access_fields():
    """Kombinierte Liste: „— alle“ = ohne Besitzer (wie bisher), sonst owner + shares; Besitzer nicht in shares."""
    import ast
    from pathlib import Path

    src = (Path(__file__).resolve().parent.parent / "custom_components" / "smartlists" / "config_flow.py").read_text(encoding="utf-8")
    nodes = [n for n in ast.parse(src).body if (isinstance(n, ast.FunctionDef) and n.name == "_apply_access")
             or (isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "EVERYONE")]
    ns = {"Any": object}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "config_flow.py", "exec"), ns)
    apply = ns["_apply_access"]
    assert apply({"name": "X", "sources": ["todo.a"], "owner": "everyone", "editors": ["u2"]}) == {"name": "X", "sources": ["todo.a"]}
    assert apply({"owner": "u1", "editors": ["u2", "u1"], "viewers": ["u3"], "checkers": []}) == {
        "owner": "u1", "shares": {"u3": "viewer", "u2": "editor"}}


def test_source_label_modes():
    """Herkunfts-Badge: Listenname / Besitzer / „Besitzer Liste“, nur für gewählte Quell-Listen."""
    import ast
    import types
    from pathlib import Path

    from smartlists.itemtext import person_from_list_name

    src = (Path(__file__).resolve().parent.parent / "custom_components" / "smartlists" / "todo.py").read_text(encoding="utf-8")
    cls = next(n for n in ast.parse(src).body if isinstance(n, ast.ClassDef) and n.name == "CombinedTodoListEntity")
    fn = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == "_source_label")
    ns = {"person_from_list_name": person_from_list_name, "DOMAIN": "smartlists"}
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "todo.py", "exec"), ns)
    label = ns["_source_label"]

    names = {"todo.angebote": "HA Smartlists Angebote", "todo.admin_liste": "Admin Angebote", "todo.local": "Einkaufsliste Peter"}
    own = {"todo.angebote": types.SimpleNamespace(_owner_name="Admin"), "todo.admin_liste": types.SimpleNamespace(_owner_name="Admin")}

    def make(show, only=()):
        return types.SimpleNamespace(
            _label_sources=set(only), _label_show=show, _source_name=lambda e: names[e],
            hass=types.SimpleNamespace(data={"smartlists": {"own": own}}))

    assert label(make("list"), "todo.angebote") == "HA Smartlists Angebote"            # wie bisher
    assert label(make("owner"), "todo.angebote") == "Admin"
    assert label(make("owner_list"), "todo.angebote") == "Admin Angebote"              # Füllwörter weg
    assert label(make("owner_list"), "todo.admin_liste") == "Admin Angebote"           # Besitzer nicht doppelt
    assert label(make("owner"), "todo.local") == "Einkaufsliste Peter"                 # ohne Besitzer: Listenname
    assert label(make("owner_list", ["todo.angebote"]), "todo.local") is None          # nicht ausgewählt → kein Badge
    assert label(make("owner_list", ["todo.angebote"]), "todo.angebote") == "Admin Angebote"
