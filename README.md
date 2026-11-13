<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/custom_components/smartlists/brand/logo@2x.png" alt="SmartLists" height="96"></p>

# SmartLists – combined to-do lists for Home Assistant

🇩🇪 [Deutsche Version](README.de.md) · 📖 [Wiki](https://github.com/m3m0rex/ha_smartlists/wiki) · 🔒 [Security](SECURITY.md)

A standalone Home Assistant integration (HACS), independent of the HA SmartLists Android app.
It brings the app's key feature straight into Home Assistant: **merge several to-do lists into one
shared list** – e.g. Anna's and Max's shopping lists into one list "Weekly shop".

A combined list is a regular to-do entity (`todo.weekly_shop`). It works in the to-do view, on
dashboards, with voice assistants, in automations and in the HA SmartLists app.

## Features

- Combine any to-do lists: Shopping List, Local To-do, Google Tasks, Bring!, CalDAV and others.
- **Check off, rename, edit description and delete** act directly on the source list.
- **New items** go to a default list of your choice.
- **"This combined list only" mode**: checkmarks stay in the combined list, source lists are left
  untouched (same as "local only" in the app).
- **Foreign lists**: items from other people's lists can only be checked off, not renamed or deleted.
- **Source as person**: items from `todo.peter` get the badge 👤 Peter in the card and the sidebar page
  (same as `*Peter`); filler words like "shopping list" are dropped. Can be turned off per list.
- **Show source**: `Milk · Anna` or `[Anna] Milk`, or off.
- **Sorting**: by list, by shopping category, open first, or alphabetical. Category detection uses
  **keyword packs**: built in are German (the app's pack, 6,500 terms, 1,049 products) plus starter
  packs for English, French, Spanish, Italian and Polish (about 400 terms each). Several packs can be
  active at once, and admins can **upload their own packs** (JSON) in the card's gear menu →
  *Global* → *Categories*.
- Attributes for dashboards and automations: `open_items`, `completed_items`, `open_by_category`,
  `source_lists`, `unavailable_sources`.
- "Remove completed" (`todo.remove_completed_items`) works across all source lists.
- Updates automatically whenever a source list changes.

## Shared memory

Shared by all lists and all HA users, stored in `.storage/smartlists.learning`:

- **Remembered categories:** once an item is assigned to a category by hand, similar items follow
  ("Hafermilch" → chilled also matches "Hafermilch Barista" later). Order as in the app:
  remembered > learned > built-in pack > other.
- **History & suggestions:** frequently and recently bought items, items on the list and the
  products of the app's pack, plus the last used or usual unit.
- **Naming convention:** `@REWE` becomes a store badge (known stores in their brand colour), `*Anna`
  a person, `#organic` a tag. Admins choose which character means what. Tags stay in the item name,
  so other interfaces still show them as text.
- **Automations & voice:** "I'm at the store" notification, store reminder, recurring items, Assist sentences – see the [wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Automations-and-voice).
- **Own lists with sharing:** lists with an owner, shared per person to view, check off or edit – see the [wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Own-lists-and-sharing).
- **Connected devices:** every device with the app appears under *Configure → Connected devices* and as an HA device with *Last seen* and *App version* sensors.
- **Controls:** default for everyone (admin) → per user → optionally per device.
- **Shopping helpers:** aisle order per store/branch, prices & monthly expenses, templates/recipes with
  servings, barcode scan (Open Food Facts), statistics, notifications when others add items (to any notify service, notify entity or custom service such as Telegram), and
  **sharing a list via link or QR code** for people without an HA account – see the
  [wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Shopping-helpers).
- **Select several items** to move, copy, check off or delete them at once; prices typed into the item
  text (`Milk 2 l 1,19€ @REWE`) are recognised.
- **Meal plan** (also as a tab on the sidebar page) with a calendar entity and optional **Mealie** import, **history per item**, a one-click
  **shopping dashboard**, **diagnostics** download and hints under **Repairs**.
- **Settings in one place:** general settings with areas (*For me*, *Global* for admins, *Insights*) and a
  separate settings window per list – see the [wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Settings).

Quantities are stored in the name, as in the app ("Milch 2 l @REWE"). "2 kg apples" is recognised
while typing, too.

## Sidebar page "SmartLists"

After setup there is a **SmartLists** entry in the HA sidebar: all to-do lists (combined lists first)
as tabs, each shown like the card (badges, categories, stepper, search, shopping mode) – no dashboard
needed. The toolbar switches between **one list** and **several lists side by side** (any number, wrapping
into rows; order adjustable) and between
normal and **wide** layout; with several lists you can **drag items** from one list to another with the
mouse (Ctrl = copy). Home Assistant's built-in to-do page shows items as plain text only
("Milch 2 l @REWE"). Hide the entry like any other via *Edit sidebar*.

## Lovelace card `custom:smartlists-card`

Loaded automatically by the integration (no dashboard resource needed).

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
```

The visual editor starts simple – **preset**, list, title, view, sort – and shows everything else with
*Show advanced options*. Presets: family shopping, kitchen tablet, in the store, view only, compact
dashboard tile.

| Option | Values |
|---|---|
| `entity` / `entities` | one list, or several lists in one card |
| `layout` | `tabs` · `columns` · `stack` (several lists) |
| `view` | `list` · `tiles` (big tiles, e.g. kitchen tablet) · `mini` (summary tile, tap to open) |
| `sort` | `category` · `alpha` · `added` · `list` |
| `filter_store`, `filter_person`, `filter_tag` | only items with `@REWE`, `*Anna`, `#bio` (comma-separated); new items get the tag automatically |
| `filter_category`, `filter_offers` | only these categories / only offers from the app |
| `show_filter_chips` | filter bar with the stores, persons and tags currently on the list |
| `density`, `font_scale`, `radius`, `accent_color` | row height, text size, corner radius, accent colour |
| `drag_drop` | drag items into another list (move, Ctrl = copy) or reorder (sort "added") |
| `show_*` | every element of header, input and list can be hidden |

Themes and card-mod can use the CSS variables `--smartlists-accent`, `--smartlists-radius`,
`--smartlists-row-height` and `--smartlists-tile-size`.

Search (also by store, person, note and category; "apfel" finds "Äpfel"), quantity stepper − +,
a single input with live preview and suggestions, "frequently bought", category picker, offers from the
app (store, price, valid until), long press → menu (edit, move, copy, category, delete), shopping mode,
↶ undo, import from an HA to-do list or as text.

### Status

The card works with combined SmartLists lists **and every regular to-do list** (Shopping List, Local
To-do, Google Tasks, Bring!, …). Allowed is whatever the list itself supports; in combined lists,
items from foreign sources can only be checked off. Changes from other devices appear live.

### Interface for the app

The HA SmartLists app can pair with the integration (`smartlists/info`) and then shows the same badges,
categories and suggestions. All commands, responses and the text format:
[docs/app-api.md](docs/app-api.md).

The category pack is generated from the app's pack: `python scripts/build_categories.py` (looks for the
app in the sibling folder `shopping_manager_app`).

## Installation

### Via HACS (custom repository)

1. HACS → ⋮ → *Custom repositories*
2. URL `https://github.com/m3m0rex/ha_smartlists`, type **Integration** → Add
3. Download "SmartLists" and restart Home Assistant.

### Manual

Copy the folder `custom_components/smartlists` to `/config/custom_components/smartlists` and restart
Home Assistant.

## Setup

On first opening, a **setup assistant** guides admins through lists, stores, notation, language,
people and extras – see the [wiki](https://github.com/m3m0rex/ha_smartlists/wiki/Setup#setup-assistant).
It can be run again any time (also linked under *Configure* of the integration), optionally **starting from scratch** (reset settings, learned data, share
links or combined lists – to-do lists are never deleted).

*Settings → Devices & services → Integrations → Add integration → **SmartLists***

SmartLists is set up once. The Lovelace card and the sidebar page are available right away, and the
integration offers:

- **"Add combined list"** – name, lists, default list, mode, source display, sorting, foreign lists,
  source as person. Each list can be changed or deleted later via ⋮ → *Reconfigure*.
- **"Configure"** – global settings for all users:
  - *Naming convention:* which character starts a store, person or tag (or off)
  - *Controls – default for everyone:* gesture for the item menu, menu entries, shopping mode
  - *Remembered categories & history:* forget single assignments, clear history

Personal differences (per user, or on one device only) are set by everyone themselves via the gear
icon in the card; admins can change the global settings there as well – both show the same values.

**Updating from 1.1:** existing SmartLists helpers are moved automatically to lists under the single
"SmartLists" entry on first start. entity_id, dashboards, automations and local checkmarks are kept.

## Notes

- Combined lists cannot be nested (protection against loops).
- In "this combined list only" mode the local checkmarks are stored in Home Assistant
  (`.storage/smartlists.<id>`) and removed together with the integration.
- Items without a unique ID (very old integrations) are skipped.
- Requires Home Assistant 2025.3 or newer (sub-entries for the lists).
- The user interface (card, sidebar page, setup dialogs, Assist sentences) is available in German, English,
  French, Spanish, Italian and Polish. Category names follow the Home Assistant language.

## License

MIT – see [LICENSE](LICENSE). The HA SmartLists Android app is a separate project with its own license.

## Structure

```
hacs.json
custom_components/smartlists/
  manifest.json      metadata (type: service, single instance)
  __init__.py        setup/unload, card and sidebar page, migration from 1.1
  config_flow.py     setup, combined lists (sub-entries), configure menu
  todo.py            to-do entities: combined lists and own lists
  categories.py/json category pack (generated from the app, with products + units)
  itemtext.py        parse item text: quantity, unit, tags (@REWE …)
  learning.py        memory: categories, history, suggestions, tag rules, controls
  own.py             own lists: roles and permissions
  automation.py      shopping event, get_items, Assist intents, due items
  lists.py           read/change lists (combined and regular to-do lists)
  websocket.py       commands for card and app (see docs/app-api.md)
  www/smartlists-card.js   Lovelace card and sidebar page
  strings.json, translations/   texts (de, en, fr, es, it, pl)
  packs/                        built-in keyword packs (one JSON per language)
blueprints/automation/smartlists/   ready-made automations
tests/                          tests (pytest, no HA needed)
scripts/build_categories.py     generate categories.json from the app's pack
```
