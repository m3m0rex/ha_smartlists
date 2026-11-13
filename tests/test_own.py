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
