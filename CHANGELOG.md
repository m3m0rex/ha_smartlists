# Changelog

All notable changes to SmartLists are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

## [1.5.2] – 2026-11-04

### Fixed

- Checking off an item in a combined list failed with "'str' object has no attribute 'value'"
  (`todo.update_item`). Newer Home Assistant versions pass the item status as plain text; both
  forms are handled now.

## [1.5.1] – 2026-11-04

### Added

- Combined lists now expose the attributes `smartlists_combined` and `foreign_lists`, so the
  HA SmartLists app recognises them and shows them as combined lists (see `docs/app-api.md`).

## [1.5.0] – 2026-11-04

### Added

- Visual card editor with collapsible sections: *Header*, *Input*, *List*, *Completed* and
  *Shopping mode*. Every element can be shown or hidden per card (header, count, search, sort
  selector, shopping cart, undo, import, gear, input field, "frequently bought", stepper, badges,
  source, notes, category headings), plus compact rows, maximum list height, "completed collapsed
  at start" and "start in shopping mode". Only values that differ from the defaults are saved.
- English README (`README.md`); the German version moved to `README.de.md`.

### Changed

- Example names in code, docs and mockup replaced with generic names.

## [1.4.0] – 2026-11-04

### Added

- **Sidebar page "SmartLists"**: all to-do lists as tabs, each shown like the card (badges,
  categories, stepper, search, shopping mode) – no dashboard needed.
- **Search** in the card: name, note, store, person, source list and category; ignores accents
  ("apfel" finds "Äpfel"); highlights matches; offers to add the term if nothing is found.
- **Quantity stepper − +** as in the app: ±1, never below 0; changes the pack count for multipacks
  ("4× 150 g"); rapid taps are saved once.
- **Source as person**: in combined lists, items from e.g. `todo.peter` get the badge 👤 Peter
  (like `*Peter`); filler words like "shopping list" are dropped. Can be turned off per list.

### Changed

- The card file is now served from `/smartlists-files/smartlists-card.js`.

## [1.3.0] – 2026-11-03

### Added

- The card works with real lists: combined SmartLists lists **and every regular to-do list**
  (Shopping List, Local To-do, Google Tasks, Bring!, …). Permissions follow the list's own
  capabilities; items from foreign sources in combined lists can only be checked off.
- WebSocket commands `smartlists/get_list`, `lists`, `add_item`, `update_item`, `remove_items`,
  `clear_completed` and `move_item`; all changes go through the regular `todo.*` services on behalf
  of the logged-in user.
- Live updates in the card via `todo/item/subscribe`.
- `smartlists/info` for pairing the HA SmartLists app, and the interface description
  `docs/app-api.md`.

## [1.2.0] – 2026-11-03

### Changed

- SmartLists is now set up once under *Integrations* instead of as a helper. Combined lists are
  sub-entries ("Add combined list", reconfigure or delete directly at the integration).
- Requires Home Assistant 2025.3 or newer.

### Added

- "Configure" menu with household settings: naming convention, controls (default for everyone),
  remembered categories & history.
- The card is loaded as soon as the integration is set up, even without any list.
- Automatic migration of existing 1.1 helpers; entity_id and local checkmarks are kept.

## [1.1.0] – 2026-11-03

### Added

- Household memory: remembered categories, history and suggestions, naming convention
  (`@store`, `*person`, `#tag`) and controls per household, user and device.
- Lovelace card `custom:smartlists-card`, loaded automatically: single input with live preview,
  suggestions, "frequently bought", category picker, fixed columns name | quantity | unit,
  sorting, long-press menu (edit, move, copy, category, delete), shopping mode, undo, import from
  an HA to-do list or as text.
- Category pack generated from the app (6,500 terms, 1,049 products with usual units).

### Fixed

- Keywords containing "ß" (e.g. "Süßkartoffel") were never matched.

## [1.0.0]

- First version: combined to-do lists as helpers, foreign lists, local mode, source display,
  sorting by list, category, status or alphabet.
