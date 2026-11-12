# SmartLists – Schnittstelle für die App (und andere Oberflächen)

Die Integration bietet ihre Funktionen über die WebSocket-API von Home Assistant an – dieselbe
Verbindung, die die App schon für `todo.*` und `state_changed` nutzt (`/api/websocket`, Anmeldung mit
dem Long-Lived Access Token). Alle Befehle beginnen mit `smartlists/`.

## 1. Koppeln

Nach dem Verbinden einmal:

```json
{"id": 1, "type": "smartlists/info"}
```

- **Erfolg** → Integration ist installiert, die App ist „gekoppelt“. Antwort:

```json
{
  "integration": "smartlists",
  "version": "1.3.0",
  "api_version": 1,
  "features": ["lists", "combined_lists", "categories", "suggestions", "tags", "user_settings"],
  "user": {"id": "…", "name": "Hans", "is_admin": true},
  "categories": [{"id": "obst_gemuese", "label": "🥬 Obst & Gemüse"}, …],
  "tag_rules": [{"prefix": "@", "kind": "store"}, {"prefix": "*", "kind": "person"}, {"prefix": "#", "kind": "tag"}],
  "tag_kinds": ["store", "person", "tag"],
  "allowed_prefixes": "@*#!+~$&%^=",
  "known_stores": [{"value": "REWE", "color": "#CC0000"}, …]
}
```

- **Fehler `unknown_command`** → Integration nicht installiert. Die App arbeitet wie bisher ohne sie.
- **`api_version` größer als die, die die App kennt** → Hinweis „App aktualisieren“, Listen trotzdem
  über die normalen `todo.*`-Dienste weiter nutzbar.

`tag_rules` können sich ändern (Admins stellen sie in HA oder im Zahnrad der Karte ein). Die App
sollte sie beim Verbinden neu holen und nicht fest einbauen.

## 2. Artikeltext

Home Assistant kennt pro Artikel nur einen Namen. Menge und Markierungen stehen deshalb im Namen
selbst – genau so, wie die App Mengen schon heute speichert (`encodeQuantityIntoName`):

```
Name [N× ]Menge [Einheit] [Tags …]
Milch 2 l @REWE
Joghurt 4× 150 g *Anna #bio
```

- Tags: Zeichen aus `tag_rules` direkt vor einem Wort, mit Leerzeichen davor (`Milch@REWE` ist kein Tag).
  Ein Markt mit Leerzeichen wird mit Bindestrich geschrieben (`@Bio-Markt`).
- Bekannte Märkte (`known_stores`) werden unabhängig von Groß-/Kleinschreibung erkannt und in ihrer
  Schreibweise/Farbe angezeigt; unbekannte so, wie getippt.
- Beim Eintippen wird zusätzlich „2 kg Äpfel“ (Menge vorne) erkannt; gespeichert wird immer
  „Äpfel 2 kg“.

Die App muss das nicht selbst nachbauen: `smartlists/get_list` und `smartlists/describe` liefern den
Text bereits zerlegt. Für die Anzeige ohne Netz (Offline-Cache) ist ein eigener Parser mit denselben
Regeln sinnvoll – Referenz: `custom_components/smartlists/itemtext.py`.

## 3. Listen

| Befehl | Felder | Antwort |
|---|---|---|
| `smartlists/lists` | – | `{lists: [{entity_id, name, type, can_add}]}` |
| `smartlists/get_list` | `entity_id` | siehe unten |
| `smartlists/add_item` | `entity_id, text, note?, checked?` | `{uid}` |
| `smartlists/update_item` | `entity_id, uid, checked?, text?, note?` | `{uid}` |
| `smartlists/remove_items` | `entity_id, uids[]` | `{}` |
| `smartlists/clear_completed` | `entity_id` | `{}` |
| `smartlists/move_item` | `entity_id, uid, target, copy?` | `{uid}` (neue uid im Ziel) |

`get_list`:

```json
{
  "entity_id": "todo.grosseinkauf",
  "name": "Großeinkauf",
  "type": "combined",
  "foreign": false,
  "source_lists": ["Anna", "Max"],
  "permissions": {"add": true, "toggle": true, "rename": true, "delete": true, "note": false},
  "categories": [ … ],
  "items": [{
    "uid": "todo.anna::abc", "text": "Milch 2 l @REWE", "note": "", "checked": false,
    "name": "Milch", "quantity": 2.0, "unit": "l", "pack_count": null,
    "tags": [{"kind": "store", "value": "REWE", "prefix": "@", "label": "REWE", "color": "#CC0000"}],
    "category": "kuehlung", "category_source": "pack",
    "source": "Anna",
    "permissions": {"toggle": true, "rename": true, "delete": true}
  }]
}
```

- `offer`: Angebot aus der `⚙OFFER:{…}`-Zeile der Notiz (`store`, `store_label`, `color`, `price`,
  `old_price`, `discount`, `valid_from`, `valid_until`, `added_at`, `expired`) oder `null`. `note` ist
  dann ohne diese Zeile; beim Speichern einer Notiz über `update_item` hängt die Integration die Zeile
  wieder an.
- `type`: `combined` (kombinierte SmartLists-Liste) oder `list` (jede andere HA-To-do-Liste).
- Tags mit `"implicit": true` stehen nicht im Text, sondern kommen aus der Herkunft: bei kombinierten
  Listen wird die Quell-Liste als Person gewertet (`todo.peter` → 👤 Peter), sofern im Artikel keine
  Person steht. Beim Bearbeiten nicht in den Text zurückschreiben.
- Rechte: Bei normalen Listen das, was die Liste kann (`supported_features`). Bei kombinierten Listen
  sind Artikel aus fremden Quellen nur abhakbar.
- `category_source`: `manual` (vom Benutzer gewählt), `learned` (aus ähnlichem Artikel gelernt),
  `pack` (eingebautes Paket), `fallback` (Sonstiges).
- Änderungen laufen über die normalen `todo.*`-Dienste im Namen des angemeldeten Benutzers – andere
  Oberflächen sehen sie sofort. Live-Updates: HA-eigenes `todo/item/subscribe` (die App kann ihr
  bestehendes `state_changed`-Abo weiter nutzen, Umbenennungen kommen aber nur über `todo/item/subscribe`).

Fehler: `{"success": false, "error": {"code": "smartlists_error", "message": "…"}}` – die Meldung ist
deutsch und für Benutzer gedacht.

### Kombinierte Listen erkennen (ohne WebSocket)

Jede kombinierte SmartLists-Liste trägt in ihren Attributen (`/api/states`):

```json
{"smartlists_combined": true, "source_lists": ["todo.anna", "todo.max"], "foreign_lists": ["todo.max"],
 "default_add_list": "todo.anna", "mode": "bidirectional"}
```

Die App zeigt solche Listen als Kombinierte Liste (verwaltet in HA, nicht in der App bearbeitbar) statt
als normale Liste. `mode: bidirectional` → abhaken direkt in der Quelle; `mode: local` → abhaken über die
kombinierte Liste selbst (`todo.update_item` auf deren Entität mit Item-uid `quelle::uid`), damit der
Haken in HA gespeichert und überall gleich ist.

## 4. Kategorien, Vorschläge

| Befehl | Felder | Zweck |
|---|---|---|
| `smartlists/describe` | `texts[]` | Text zerlegen + Kategorie + `unit_hint` (übliche/zuletzt benutzte Einheit) |
| `smartlists/suggest` | `query, entity_id?, limit?` | Vorschläge; `mode`: `name`, `tag` (bei „@Re“) oder `frequent` (leere Eingabe) |
| `smartlists/set_category` | `name, category \| null` | Kategorie merken (gilt künftig für ähnliche Artikel) |
| `smartlists/learned` | – | gemerkte Zuordnungen |
| `smartlists/forget` | `word` | vergessen (Admin) |
| `smartlists/set_tag_rules` | `rules[]` | Namenskonvention ändern (Admin) |

Löschen wird ebenfalls abgeglichen: in der App vergessene Wörter gehen per `smartlists/forget` an die
Integration; Wörter, die beim letzten Abgleich in `smartlists/learned` standen und jetzt fehlen, wurden
in HA vergessen und werden in der App entfernt.

Gemerkte Kategorien gelten für den ganzen Haushalt. Die App sollte ihre lokal gelernten Kategorien
beim Koppeln einmalig per `set_category` übertragen und danach die der Integration verwenden, damit
App, Karte und HA dasselbe zeigen.

## 5. Bedienung pro Benutzer

| Befehl | Felder | Zweck |
|---|---|---|
| `smartlists/user_settings` | – | `{defaults, settings}`: Haushalts-Standard + eigene Abweichungen |
| `smartlists/set_user_settings` | `settings, scope?` | `scope: user` (eigene) oder `household` (Admin) |

Schlüssel: `press_gesture` (long/double/right/off), `press_target` (row/name),
`press_result` (menu/edit/delete), `menu_actions` (rename/move/copy/category/delete),
`row_buttons`, `shop_hide_checked`, `shop_keep_awake`, `shop_large`, `shop_tap_row` (an/aus).
Der Benutzer ergibt sich aus dem Token – ein Token pro Person, damit jeder seine Einstellungen hat.

## Versionierung

`api_version` steigt nur bei inkompatiblen Änderungen. Neue Felder in Antworten und neue Befehle
sind keine inkompatible Änderung – die App soll unbekannte Felder ignorieren.
