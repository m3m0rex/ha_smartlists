<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists_hacs/main/custom_components/smartlists/brand/logo@2x.png" alt="SmartLists" height="96"></p>

# SmartLists – combined to-do lists for Home Assistant

🇩🇪 [Deutsche Version](README.de.md)

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
  the same keyword pack as the app (6,500 German terms, 1,049 products).
- Attributes for dashboards and automations: `open_items`, `completed_items`, `open_by_category`,
  `source_lists`, `unavailable_sources`.
- "Remove completed" (`todo.remove_completed_items`) works across all source lists.
- Updates automatically whenever a source list changes.

## Household memory

Shared by all lists and all HA users, stored in `.storage/smartlists.learning`:

- **Remembered categories:** once an item is assigned to a category by hand, similar items follow
  ("Hafermilch" → chilled also matches "Hafermilch Barista" later). Order as in the app:
  remembered > learned > built-in pack > other.
- **History & suggestions:** frequently and recently bought items, items on the list and the
  products of the app's pack, plus the last used or usual unit.
- **Naming convention:** `@REWE` becomes a store badge (known stores in their brand colour), `*Anna`
  a person, `#organic` a tag. Admins choose which character means what. Tags stay in the item name,
  so other interfaces still show them as text.
- **Controls:** default for everyone (admin) → per user → optionally per device.

Quantities are stored in the name, as in the app ("Milch 2 l @REWE"). "2 kg apples" is recognised
while typing, too.

## Sidebar page "SmartLists"

After setup there is a **SmartLists** entry in the HA sidebar: all to-do lists (combined lists first)
as tabs at the top, below them the list with badges, categories, quantity stepper, search and
shopping mode – no dashboard needed. Home Assistant's built-in to-do page shows items as plain text
only ("Milch 2 l @REWE"); badges are only available on this page and in the card. Hide the entry like
any other via *Edit sidebar*.

## Lovelace card `custom:smartlists-card`

Loaded automatically by the integration (no dashboard resource needed).

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
sort: category        # category | alpha | added | list
```

Search (also by store, person, note and category; "apfel" finds "Äpfel"), quantity stepper − +,
a single input with live preview (quantity, category, badges) and suggestions (↑/↓, Tab, Enter),
"frequently bought", change the category with one click (remembered), fixed columns
name | quantity | unit, sorting (category, A–Z, added, by list), long press → menu (edit, move, copy,
category, delete), shopping mode (screen stays on, hide checked, large rows, tap the row), ↶ to undo
the last change, import from an HA to-do list or as text.

All display options are available in the visual card editor, grouped into *Header*, *Input*, *List*,
*Completed* and *Shopping mode* (e.g. hide search or stepper, compact rows, no category headings,
maximum height, start in shopping mode). Personal controls (gesture, menu, shopping-mode behaviour)
stay per user in the card's gear menu.

A clickable mockup with simulated data is in `mockup/card-mockup.html`
(rebuild: `python mockup/build_mockup.py`).

### Status

The card works with combined SmartLists lists **and every regular to-do list** (Shopping List, Local
To-do, Google Tasks, Bring!, …). Allowed is whatever the list itself supports; in combined lists,
items from foreign sources can only be checked off. Changes from other devices appear live.

Not yet available: lists stored directly in SmartLists and sharing per user (A shares a list with B
with specific permissions).

### Interface for the app

The HA SmartLists app can pair with the integration (`smartlists/info`) and then shows the same badges,
categories and suggestions. All commands, responses and the text format:
[docs/app-api.md](docs/app-api.md) (German).

The category pack is generated from the app's pack: `python scripts/build_categories.py` (looks for the
app in the sibling folder `shopping_manager_app`).

## Installation

### Via HACS (custom repository)

1. HACS → ⋮ → *Custom repositories*
2. URL `https://github.com/m3m0rex/ha_smartlists_hacs`, type **Integration** → Add
3. Download "SmartLists" and restart Home Assistant.

### Manual

Copy the folder `custom_components/smartlists` to `/config/custom_components/smartlists` and restart
Home Assistant.

## Setup

*Settings → Devices & services → Integrations → Add integration → **SmartLists***

SmartLists is set up once. The Lovelace card and the sidebar page are available right away, and the
integration offers:

- **"Add combined list"** – name, lists, default list, mode, source display, sorting, foreign lists,
  source as person. Each list can be changed or deleted later via ⋮ → *Reconfigure*.
- **"Configure"** – settings for the whole household:
  - *Naming convention:* which character starts a store, person or tag (or off)
  - *Controls – default for everyone:* gesture for the item menu, menu entries, shopping mode
  - *Remembered categories & history:* forget single assignments, clear history

Personal differences (per user, or on one device only) are set by everyone themselves via the gear
icon in the card; admins can change the household settings there as well – both show the same values.

**Updating from 1.1:** existing SmartLists helpers are moved automatically to lists under the single
"SmartLists" entry on first start. entity_id, dashboards, automations and local checkmarks are kept.

## Notes

- Combined lists cannot be nested (protection against loops).
- In "this combined list only" mode the local checkmarks are stored in Home Assistant
  (`.storage/smartlists.<id>`) and removed together with the integration.
- Items without a unique ID (very old integrations) are skipped.
- Requires Home Assistant 2025.3 or newer (sub-entries for the lists).
- The user interface is available in German and English; category detection is German.

## Structure

```
hacs.json
custom_components/smartlists/
  manifest.json      metadata (type: service, single instance)
  __init__.py        setup/unload, card and sidebar page, migration from 1.1
  config_flow.py     setup, combined lists (sub-entries), configure menu
  todo.py            the combined to-do entity
  categories.py/json category pack (generated from the app, with products + units)
  itemtext.py        parse item text: quantity, unit, tags (@REWE …)
  learning.py        memory: categories, history, suggestions, tag rules, controls
  lists.py           read/change lists (combined and regular to-do lists)
  websocket.py       commands for card and app (see docs/app-api.md)
  www/smartlists-card.js   Lovelace card and sidebar page
  strings.json, translations/   texts (German/English)
scripts/build_categories.py     generate categories.json from the app's pack
mockup/                         clickable mockup of the card
```
