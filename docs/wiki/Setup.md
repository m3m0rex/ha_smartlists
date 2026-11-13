# Setup

*Settings → Devices & services → SmartLists*

## First setup

The setup suggests your existing to-do lists: pick two or more to create the first combined list right
away, or leave it empty.

## Setup assistant

When an admin opens SmartLists for the first time (sidebar page or card), a short assistant appears.
Every step can be skipped and everything can be changed later in the settings. It is not shown to
installations that were already in use before 3.0.0; start it any time under *General settings →
Global → Voice, backup, defaults → Run setup again*.

1. **Lists** – use the existing to-do lists (optionally combined into one shared list) or create a new
   own list.
2. **Stores** – the stores you shop at; they are offered while typing.
3. **Notation** – the characters for store, person and tag (`@` `*` `#` by default), with a live
   example. The app takes them when pairing.
4. **Language** – which keyword packs recognise the categories.
5. **People and app** – permissions for a new own list; how to pair the app.
6. **Extras** – notifications to your device, Assist, prices and expenses, barcode lookup, sharing via
   link for owners.
7. **Done** – a summary; *Set up* applies everything at once.

The assistant is available in all six languages of the interface.

### Run again or start from scratch

Both are in *General settings → Global → Voice, backup, defaults* (admins):

- **Run setup again** opens the assistant with your current data – nothing is reset, it only adds or
  changes what you pick.
- **Start from scratch …** first resets the parts you choose, then opens the assistant:
  - *Reset settings* (on by default) – notation, badges and colours, stores and zones, aisle orders,
    permissions, voice and automations, list display, keyword packs (back to the Home Assistant language).
  - *Delete learned data* – remembered categories, history and statistics, prices and expenses,
    templates and meal plan.
  - *Revoke all share links* – shared links stop working immediately.
  - *Remove combined lists* – only the combined views; the source lists stay unchanged.

To-do lists and their items are **never** deleted, and users' personal settings (*For me*) stay.
The same options are available without the card under *Settings → Devices & services → SmartLists →
Configure → Run setup again / start from scratch*. Tip: export a backup first (*Voice, backup, defaults → Export*).

## Combined lists

**Add combined list** merges several to-do lists into one new to-do entity (e.g. `todo.weekly_shop`).

| Field | Meaning |
|---|---|
| Lists to combine | any to-do lists (Shopping List, Local To-do, Google Tasks, Bring!, CalDAV, …) |
| Default list for new items | where items added to the combined list go; empty = adding disabled |
| Checking off affects | *source list* (bidirectional) or *this combined list only* (sources stay untouched) |
| Show source in item name | `Milk · Anna`, `[Anna] Milk` or hidden (HA's own to-do view) |
| Sort order | by list, by shopping category, open first, alphabetical |
| Foreign lists | items from these lists can only be checked off |
| Show source as person | items from `todo.peter` get the badge 👤 Peter |

Change or delete a list via ⋮ → *Reconfigure*.

## Configure (global settings, admins)

- **Naming convention** – which character starts a store, person or tag (or off). See
  [[Item text and naming convention]].
- **Controls – default for everyone** – gesture for the item menu (long press, double click, right
  click), what it does, menu entries, shopping-mode behaviour. Every user can override this in the
  card's gear menu, optionally per device.
- **Remembered categories & history** – forget single assignments, clear history.
- **Voice & automations** – default list for Assist, automatically add due items, install the Assist
  sentences. See [[Automations and voice]].
- **Connected devices** – devices with the HA SmartLists app. See [[App pairing and devices]].

## Entity IDs

New lists created by SmartLists use the same scheme as the app: own lists `todo.ha_smartlists_list_<name>`,
combined lists `todo.ha_smartlists_list_merged_<name>`. The display name is the name you typed. Lists
created before 2.8.0 keep their IDs.
