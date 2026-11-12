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
