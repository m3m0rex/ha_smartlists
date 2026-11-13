# Own lists and sharing

Besides combining existing to-do lists, SmartLists can store lists itself – with an **owner** and
**sharing** per person.

## Create

- Sidebar page **SmartLists** → **+** (you become the owner), or
- *Settings → Devices & services → SmartLists → Add own list* (choose the owner and who may do what).

Own lists are regular to-do entities: they work in the card, the sidebar page, the app, Assist and
automations, and can be part of a combined list.

## Take over existing lists

*General settings → Global → Voice, backup, defaults → Take over lists …* (admins) turns existing to-do
lists – the HA shopping list, Local To-do lists, lists of other integrations – into own SmartLists lists,
with items, notes and checkmarks. You become the owner and can share them afterwards. Each list shows its origin
(*Local To-do*, *Shopping list* or the integration, e.g. *Google Tasks*).

- **Several lists**: one own list each (same name) **or all into one list**; optionally the origin is
  added as `*Person` or `#tag` (characters from your naming convention), e.g. "Soap *Anna".
- **Old lists stay unchanged** – nothing is emptied or deleted. Afterwards SmartLists lists them and asks you
  to delete them yourself once the new list is fine (*Settings → Devices & services*, e.g. Local To-do or the
  respective integration). If an old list is a source of a combined list, add the new list there first.

SmartLists' own lists, combined lists and app notes are not offered.

## Roles

<img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists/main/docs/images/share.svg" alt="Sharing with people and via link" width="620">

| Role | See | Check off | Add / edit / delete / reorder | Change sharing, delete list |
|---|---|---|---|---|
| Viewer | ✅ | – | – | – |
| Checker | ✅ | ✅ | – | – |
| Editor | ✅ | ✅ | ✅ | – |
| Owner | ✅ | ✅ | ✅ | ✅ |

**Admins** always have owner rights. **Automations and scripts** (no user) may do everything – they
were created by an admin.

Change sharing in the card's gear menu (owner) under **Sharing**, or via ⋮ → *Reconfigure* at the
integration.

## What is enforced where

- **Changes** are checked for every request, no matter where it comes from – card, app, Home
  Assistant's own to-do view, voice or the REST API. A user without the right gets "You are not
  allowed to do this".
- **Visibility**: lists that are not shared with someone are hidden in the SmartLists card, the
  sidebar page, `smartlists/lists` (app) and Assist answers. Home Assistant's built-in to-do view and
  entity list, however, show every to-do entity to every user – Home Assistant has no per-user
  visibility for entities. Do not use own lists for secrets.
