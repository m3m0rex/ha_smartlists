# SmartLists – interface for the app (and other front ends)

The integration exposes its features through Home Assistant's WebSocket API – the same connection
the app already uses for `todo.*` and `state_changed` (`/api/websocket`, authenticated with a
long-lived access token). All commands start with `smartlists/`.

## 1. Pairing

Once after connecting:

```json
{"id": 1, "type": "smartlists/info"}
```

- **Success** → the integration is installed and the app is "paired". Response:

```json
{
  "integration": "smartlists",
  "version": "1.8.0",
  "api_version": 1,
  "features": ["lists", "combined_lists", "categories", "suggestions", "tags", "user_settings", "devices"],
  "user": {"id": "…", "name": "Hans", "is_admin": true},
  "categories": [{"id": "obst_gemuese", "label": "🥬 Obst & Gemüse"}, …],
  "tag_rules": [{"prefix": "@", "kind": "store"}, {"prefix": "*", "kind": "person"}, {"prefix": "#", "kind": "tag"}],
  "tag_kinds": ["store", "person", "tag"],
  "allowed_prefixes": "@*#!+~$&%^=",
  "known_stores": [{"value": "REWE", "color": "#CC0000"}, …]
}
```

- **Error `unknown_command`** → the integration is not installed; the app keeps working without it.
- **`api_version` higher than the app knows** → show "please update the app"; lists keep working
  through the regular `todo.*` services.

`tag_rules` can change (admins set them in HA or in the card's gear menu). Fetch them on every
connect instead of hard-coding them.

## 2. Item text

Home Assistant stores only one name per item. Quantity and markers are therefore part of the name –
exactly the format the app already uses for quantities (`encodeQuantityIntoName`):

```
Name [N× ]quantity [unit] [tags …]
Milch 2 l @REWE
Joghurt 4× 150 g *Anna #bio
```

- Tags: a character from `tag_rules` directly in front of a word, preceded by a space
  (`Milch@REWE` is not a tag). Stores with spaces use a hyphen (`@Bio-Markt`).
- Known stores (`known_stores`) are matched case-insensitively and shown with their spelling and
  colour; unknown ones as typed.
- While typing, "2 kg Äpfel" (quantity first) is recognised too; it is always stored as "Äpfel 2 kg".

The app does not need to re-implement this: `smartlists/get_list` and `smartlists/describe` return the
text already parsed. For offline display a local parser with the same rules is useful – reference:
`custom_components/smartlists/itemtext.py`.

### Offers

When an item is added from the app's offer overview, the app appends a line to the description:

```
⚙OFFER:{"s":"REWE","e":"2026-11-14","v":"2026-11-09","a":1794055898321,"p":0.39}
```

`s` store, `p` price, `o` old price, `d` discount, `v`/`e` valid from/until (YYYY-MM-DD),
`a` added (epoch millis). The integration returns it parsed as `offer` (see below) and keeps the line
when a note is edited.

## 3. Lists

| Command | Fields | Response |
|---|---|---|
| `smartlists/lists` | – | `{lists: [{entity_id, name, type, can_add}]}` |
| `smartlists/get_list` | `entity_id, language?` | see below (`language` = UI language for category names, e.g. `en`) |
| `smartlists/add_item` | `entity_id, text, note?, checked?` | `{uid}` |
| `smartlists/update_item` | `entity_id, uid, checked?, text?, note?` | `{uid}` |
| `smartlists/remove_items` | `entity_id, uids[]` | `{}` |
| `smartlists/clear_completed` | `entity_id` | `{}` |
| `smartlists/move_item` | `entity_id, uid, target, copy?` | `{uid}` (new uid in the target) |

`get_list`:

```json
{
  "entity_id": "todo.weekly_shop",
  "name": "Weekly shop",
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
    "offer": null,
    "source": "Anna",
    "permissions": {"toggle": true, "rename": true, "delete": true}
  }]
}
```

- `type`: `combined` (combined SmartLists list) or `list` (any other HA to-do list).
- `offer`: parsed `⚙OFFER` line (`store`, `store_label`, `color`, `price`, `old_price`, `discount`,
  `valid_from`, `valid_until`, `added_at`, `expired`) or `null`. `note` then excludes that line; when a
  note is saved via `update_item` the integration appends the line again.
- Tags with `"implicit": true` are not part of the text but come from the source: in combined lists the
  source list counts as a person (`todo.peter` → 👤 Peter) unless the item names a person itself. Do
  not write them back into the text when editing.
- Permissions: for regular lists whatever the list supports (`supported_features`); in combined lists
  items from foreign sources can only be checked off.
- `category_source`: `manual` (chosen by a user), `learned` (from a similar item), `pack` (built-in
  pack), `fallback` (other).
- Changes go through the regular `todo.*` services on behalf of the logged-in user, so all other
  interfaces see them immediately. Live updates: HA's own `todo/item/subscribe` (renames are not
  visible through `state_changed`).

Errors: `{"success": false, "error": {"code": "smartlists_error", "message": "…"}}` – the message is
user-facing.

### Recognising combined lists (without WebSocket)

Every combined SmartLists list carries these attributes (`/api/states`):

```json
{"smartlists_combined": true, "source_lists": ["todo.anna", "todo.max"], "foreign_lists": ["todo.max"],
 "default_add_list": "todo.anna", "mode": "bidirectional"}
```

The app shows such lists as combined lists (managed in HA, not editable in the app) instead of regular
lists. `mode: bidirectional` → check off directly in the source; `mode: local` → check off via the
combined list itself (`todo.update_item` on its entity with item uid `source::uid`) so the checkmark is
stored in HA and identical everywhere.

## 4. Devices

When pairing (together with `smartlists/info`) and on every sync:

```json
{"type": "smartlists/register_device", "device_id": "<UUID of the installation>", "name": "Pixel 8",
 "model": "Google Pixel 8", "manufacturer": "Google", "app_version": "1.2.68", "os_version": "16"}
```

The user is taken from the token. `smartlists/devices` returns the devices (admins: all, others: their
own); `smartlists/remove_device` (admin) removes one from the list. Each device is an HA device with the
sensors "Last seen" and "App version".

## 5. Shopping mode, due items, backup

| Command | Fields | Purpose |
|---|---|---|
| `smartlists/shopping` | `entity_id, active, store?, open_items?` | shopping mode started/ended → event `smartlists_shopping` |
| `smartlists/due` | `entity_id?` | due items by buying rhythm (`every_days`, `next_due`), excluding open items of that list |
| `smartlists/export` | `include_history?` | household data as JSON (admin) |
| `smartlists/import` | `data, replace?` | import an export (admin; merge by default) |
| `smartlists/automation`, `smartlists/set_automation` | `settings` | `voice_default_list`, `auto_due_list` (set: admin) |

`smartlists/suggest` with an empty query returns due items first (`source: "due"`, `every_days`).

## 6. Own lists and sharing

| Command | Fields | Purpose |
|---|---|---|
| `smartlists/users` | – | `{users: [{id, name, is_admin}], me}` for the sharing picker |
| `smartlists/create_list` | `name` | new own list, the caller is the owner |
| `smartlists/share` | `entity_id, user_id, role` | `viewer` / `checker` / `editor`, `null` removes (owner/admin) |
| `smartlists/delete_list` | `entity_id` | delete an own list (owner/admin) |

`get_list` returns `type: "own"` and `own: {role, owner, owner_id, shares, can_share}`; `permissions`
reflect the caller's role. `lists` omits own lists that are not shared with the caller and adds `role`.
Every change is enforced by the list entity for the requesting user – also through the regular
`todo.*` services the app uses. Own lists carry the attributes `smartlists_own: true`, `owner` and
`shared_with`.

## 7. Categories and suggestions

| Command | Fields | Purpose |
|---|---|---|
| `smartlists/describe` | `texts[]` | parse text + category + `unit_hint` (usual/last used unit) |
| `smartlists/suggest` | `query, entity_id?, limit?` | suggestions; `mode`: `name`, `tag` (for "@Re") or `frequent` (empty input) |
| `smartlists/set_category` | `name, category \| null` | remember a category (applies to similar items from now on) |
| `smartlists/learned` | – | remembered assignments |
| `smartlists/forget` | `word` | forget (admin) |
| `smartlists/set_tag_rules` | `rules[]` | change the naming convention (admin) |
| `smartlists/config` | `language?` | naming convention, categories (names in `language`), … |
| `smartlists/packs` | – | keyword packs `{id, name, language, builtin, terms, products, active, priority}` |
| `smartlists/pack_upload` | `pack, name?, activate?` | add/replace a custom pack (admin); format: wiki → Categories and suggestions |
| `smartlists/pack_set_active` | `active[]` | active pack ids in order of precedence (admin) |
| `smartlists/pack_delete` | `pack_id` | delete a custom pack (admin) |
| `smartlists/pack_export` | `pack_id` | download a pack in the integration format |
| `smartlists/pack_create` | `name, language?` | new empty custom pack (admin) |
| `smartlists/pack_terms` | `pack_id, query?, offset?, limit?` | keywords of a pack (paged) |
| `smartlists/pack_update` | `pack_id, terms{term: category \| null}, name?` | add/change/delete keywords (admin); built-in packs via add-on pack |
| `smartlists/stores` | – | stores with linked zone |
| `smartlists/set_store_zone` | `store, zones[] \| zone (+add)` | link a store to one or more `zone.*` (admin); `store_zones` values are lists |
| `smartlists/appearance` | – | badges & colours `{kinds, values}` + all known badges |
| `smartlists/set_appearance` | `appearance` | (admin); invalid parts are dropped |
| `smartlists/app_lists` | – | combined lists reported by apps, per device, with `connected` |
| `smartlists/store_order` | `store, zone?, order[] \| null` | aisle order of categories (admin) |
| `smartlists/set_price` | `name, price \| null, store?` | price per unit |
| `smartlists/expenses` | `period (week\|month\|year), count` | totals per period and store |
| `smartlists/templates` / `save_template` / `delete_template` | … | templates `{id, name, emoji, servings, items[]}` |
| `smartlists/add_template` | `entity_id, template_id, servings?, skip[]` | add a template to a list |
| `smartlists/stats` | `days` | top items, overdue, shares |
| `smartlists/share_links` / `share_create` / `share_revoke` | `entity_id`, … | links per list; `share_create {check: off\|soft\|on, add, hours \| null}` returns the token once |
| `smartlists/notify` / `set_notify` | `settings` | own notification settings |
| `smartlists/barcode` | `code` | product name (memory → Open Food Facts) |
| `smartlists/connect_app_list` | `device_id, list_id` | create a combined list from it (admin); attribute `smartlists_app_list: "<device_id>/<list_id>"` |
| `smartlists/notes` | – | app notes: `mode` (`hidden`/`section`), `scope` (`owner`/`household`), lists with owner |
| `smartlists/set_notes` | `mode?, scope?, owners?{entity: user_id \| null}` | (admin) |

`smartlists/register_device` accepts `app_lists: [{id, name, sources[], default_add, mode}]` (only if
`info.features` contains `app_lists`; only lists made of `todo.*` sources) and `notes_lists: [entity ids]` (only if `info.features` contains
`notes`): the note lists of this app installation – they are assigned to the logged-in account if they
have no owner yet. `smartlists/lists` and `get_list` return `type: "notes"` for them.

Category **ids** never change and are the same in every language; only the labels follow `language`.

Remembered categories apply to the whole household. On first pairing the app uploads its manual
assignments once via `set_category` and then uses the integration's, so app, card and HA agree.
Deletions are synced too: words forgotten in the app are sent via `smartlists/forget`; words that were
in `smartlists/learned` at the last sync and are missing now were forgotten in HA and are removed in
the app.

## 8. App backups

| Command | Fields | Purpose |
|---|---|---|
| `smartlists/app_backup_save` | `device_id, profile_name?, data` | store the app's backup (JSON text, max 5 MB); one per installation |
| `smartlists/app_backups` | – | list `{device_id, profile_name, updated_at, user_name, size}` (own; admins: all) |
| `smartlists/app_backup_get` | `device_id` | the backup including `data` |
| `smartlists/app_backup_delete` | `device_id` | delete a backup |

Backups are kept in `.storage/smartlists.app_backups` and survive Home Assistant restarts. With a backup
password set in the app, `data` is an encrypted envelope
`{"smartlists_encrypted":1,"kdf":"pbkdf2-sha256","iter":210000,"salt","iv","ct"}` (AES-256-GCM, AAD
`ha-smartlists-backup-v1`); the list reports `encrypted: true`.

## 9. Controls per user

| Command | Fields | Purpose |
|---|---|---|
| `smartlists/user_settings` | – | `{defaults, settings}`: household default + own differences |
| `smartlists/set_user_settings` | `settings, scope?` | `scope: user` (own) or `household` (admin) |

Keys: `press_gesture` (long/double/right/off), `press_target` (row/name),
`press_result` (menu/edit/delete), `menu_actions` (rename/move/copy/category/delete),
`row_buttons`, `shop_hide_checked`, `shop_keep_awake`, `shop_large`, `shop_tap_row` (on/off).
The user is derived from the token – use one token per person so everyone has their own settings.

## Versioning

`api_version` only increases for incompatible changes. New response fields and new commands are not
incompatible – the app should ignore unknown fields.
