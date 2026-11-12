# Setup

*Settings → Devices & services → SmartLists*

## First setup

The setup suggests your existing to-do lists: pick two or more to create the first combined list right
away, or leave it empty.

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

## Configure (household settings, admins)

- **Naming convention** – which character starts a store, person or tag (or off). See
  [[Item text and naming convention]].
- **Controls – default for everyone** – gesture for the item menu (long press, double click, right
  click), what it does, menu entries, shopping-mode behaviour. Every user can override this in the
  card's gear menu, optionally per device.
- **Remembered categories & history** – forget single assignments, clear history.
- **Voice & automations** – default list for Assist, automatically add due items, install the Assist
  sentences. See [[Automations and voice]].
- **Connected devices** – phones with the HA SmartLists app. See [[App pairing and devices]].
