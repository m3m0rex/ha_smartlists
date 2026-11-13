# Changelog

All notable changes to SmartLists are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

## [3.0.0] – 2026-11-13

### Added

- Sidebar page: the list overview at the top is **collapsed by default** – one line with the selected
  lists and *All lists ▾*; expand to see all groups (remembered per browser, always open while sorting).
- **Barcode scan uses the companion app's own scanner** (Android/iOS) when available – much more reliable
  than the camera in the app's web view. Non-product codes (QR etc.) are rejected with a hint, *Type the
  number* opens manual entry. In browsers the camera/number dialog stays.
- **Scanner settings** – per user (*For me → Shopping and scanning*): target list (this card's list or any other) and
  whether scanned products go into the input field or are added directly. Global (*Voice, backup,
  defaults*): which lookup services in which order – Open Food Facts, Open Beauty Facts, Open Pet Food
  Facts, Open Products Facts, UPCitemdb, or your own service (URL with `{code}` + JSON field for the name).
- **Meal plan**: dishes (templates) per day, *Add ingredients to list* for the whole week, calendar entity
  *SmartLists Meal plan*; optional **Mealie** import (recipes of the Mealie meal plan become templates).
- **History per item** (long press → History): who added, checked off, reopened, renamed or deleted it, and
  when – including the app, automations and shared links.
- **Shopping dashboard** with one click (Global → Voice, backup, defaults): lists, meal plan, statistics.
- **Diagnostics** download (no item texts, tokens or names) and hints under **Repairs**: missing source list
  of a combined list, devices not synced for 30 days; share links of deleted lists are removed.
- **Slimmer card header**: search, undo, shopping mode and ⋯ (sort, import, templates, meal plan, settings).
- More automated tests (permissions, link limits, meal plan, Mealie ingredients, item history).
- **Setup assistant** on first opening (admins): lists (use existing, combine or create new), stores,
  notation (`@` `*` `#` with live example), language (keyword packs), people (permissions for a new own
  list) and extras (notifications, Assist, prices, barcode lookup, link sharing) – every step can be
  skipped, all in six languages. Not shown to installations already in use; *Run setup again* under
  Global. WebSocket `smartlists/setup`, `config.setup_needed`.
- **New settings layout**: the general settings are organised in areas – *For me* (controls, shopping and
  scanning, notifications), *Global* for admins (badges and colours, stores & zones, categories, devices
  and notes, sharing and permissions, voice/backup/defaults) and *Insights*. Wide screens show the areas
  on the left and the selected area in two columns; narrow screens show the areas first. With search.
  Calmer look without boxes.
- **Settings window per list** (⋯ → Settings of this list): name, default sort order and prices on/off for the list
  on all devices, sharing with people and sharing via link – two columns on wide screens, a sheet on small.
- **Sharing and permissions** (Global): admins decide who may create share links (admins · admins and
  owner · everyone who may edit · nobody), what a link may allow at most and the longest validity, see and
  revoke the active links of all lists, and switch off for non-admins: creating own lists, changing
  templates, assigning categories, entering prices.
- WebSocket: `smartlists/set_rights`, `share_links_all`, `set_list_settings`; `config` returns `rights`,
  `get_list` returns `settings`.

### Changed

- "Household" is now called **Global** in the settings; "phone" is now **device** everywhere (interface in
  all six languages, setup dialogs, documentation).
- New wiki page *Settings*; the pages on sharing, scanning, devices and the sidebar page were updated.

### Fixed

- **No more refresh while you edit**: background updates only redraw the list when something really
  changed (someone else checked, added or deleted items), and never while you are editing an item, typing,
  have a menu, dialog or the settings open or are dragging – they are applied right after you finish.

## [2.9.1] – 2026-11-12

### Fixed

- Narrow cards (phones, several columns): the header buttons wrap into a second line instead of making the
  card wider than the screen.
- Barcode scanner: the camera picture starts in the Android companion app (muted inline playback, tap the
  picture if it stays black).

## [2.9.0] – 2026-11-12

### Added

- **Live updates without reloading**: cards and the sidebar page refresh by themselves when household data
  changes (categories, packs, badges, prices, templates, aisle orders, links, notes, devices) – new
  WebSocket subscription `smartlists/subscribe`. Items were already live. Safety net for tablets/phones:
  silent reload after waking up / returning to the tab and once a minute.
- **Symbol picker** for templates and badge symbols (people, tags): grid by group, tap to preview, OK to
  apply; own symbols can still be typed.
- **Aisle order by drag & drop**: *Sort* button in the order editor, then drag the rows by ⠿ (mouse,
  finger or pen); ▲▼ stay available.
- **Remembered categories can be changed** afterwards directly in the list (Household → Remembered
  categories).
- **Shopping done** button next to the total: the "in cart" sum starts at 0 again (expenses stay booked);
  optionally reopen all checked items for lists you reuse. WebSocket `smartlists/finish_shopping`.
- **Fix wrong data afterwards**: delete single expense bookings (admins all, others their own) and remove
  items from the history/statistics (admins).
- **Create a note list** even if the app has none yet (Household → App notes, or ＋📝 on the sidebar page):
  Local To-do list `todo.ha_smartlists_notes_<name>`, owned by you.

### Fixed

- Colour pickers in *Badges & colours* no longer close on the first click – the preview changes while you
  pick, saved when the picker is closed.
- CI: Node 24 actions (checkout v5, setup-python v6), runners pinned to ubuntu-24.04; releases are now
  created automatically when the manifest version changes.

## [2.8.0] – 2026-11-12

### Added

- **Aisle order per store** (and optionally per branch/zone): shopping mode groups the list in the order of
  the store's aisles. Household → Stores & zones → 🛤️ Order.
- **Prices & expenses**: price per item (typed at the end, `Milk 2 l 1,19€`, in ✏️, or from the app's
  offers), unit price and total in the list, expenses booked when checking off, weekly/monthly/yearly
  overview per store, sensor *Expenses this month*.
- **Templates & recipes**: 📋 in the card – add with servings (quantities scaled), untick items, increase
  quantities of items already on the list; create from scratch or from the current list; Assist
  ("Put pancakes on the shopping list") and action `smartlists.add_template`.
- **Share via link / QR code** for people without an HA account: view only by default; optional "soft"
  check (marked, stays open), real check off, adding; validity 2 h – 30 days or until revoked; revoke
  any time. 256-bit keys, only hashes stored, nothing but item texts exposed.
- **Notifications** when someone else adds or checks off items – per user: phone, lists, people, quiet
  hours; bundled per minute.
- **Barcode scan** with the camera (or typing the number); names via Open Food Facts (only the number is
  sent, can be turned off) and remembered.
- **Statistics**: bought most often with rhythm, not bought for a while, shares per category and store
  (📊 on the sidebar page, tab *Statistics* in the general settings).

- **Configure → All SmartLists lists**: every `todo.ha_smartlists_…` list (from the app or the
  integration) grouped as combined lists, lists and notes, with entity ID, open items and origin.
- **Sidebar page grouped**: chips are shown in three groups – *Combined lists*, *Lists*, *Notes*. Combined
  lists reported by the app that are not connected yet appear dashed (📱) and can be connected with a tap
  (admins).

### Changed

- **Entity IDs of new lists** follow the app's scheme: own lists `todo.ha_smartlists_list_<name>`,
  combined lists `todo.ha_smartlists_list_merged_<name>` (note lists of the app: `todo.ha_smartlists_note…`).
  Existing lists keep their IDs – no automations break.
- Share links: changes via a link never alter household prices or suggestions, notifications for them
  don't include the typed text, adding is limited to 6 per minute, request bodies to 2 KB, reading to
  120 per minute; links of deleted lists (or lists that became notes) stop working immediately.
- Placeholder examples no longer contain real place names or coordinates.

## [2.7.0] – 2026-11-12

### Changed

- **Two settings menus**: in the card the slider icon opens the **general settings** (For me, Household),
  the gear the **settings of this list**. On the sidebar page ⚙ at the top right is the general menu and
  every list card only has its list gear – no duplicate menus any more.

### Added

- Works with the app's new *Send to Home Assistant* for combined lists: local source lists are moved to
  Home Assistant and the combined list is connected right away (device of the phone).

## [2.6.2] – 2026-11-12

### Fixed

- Hassfest: the example JSON in the "Paste pack as JSON" description is now passed as a placeholder
  (curly braces in translations are not allowed). New test checks all translation placeholders.

## [2.6.1] – 2026-11-12

### Fixed

- Keyword pack editor: the add row no longer squeezes the keyword field and the button – keyword on its own
  line, category and *Add* below.

## [2.6.0] – 2026-11-12

### Added

- **App notes as notes**: note lists of the app are shown like in the app – note cards with title and
  text (grid or list), *New note* with title + text, tap to edit or delete. No categories, quantities,
  tags or checkboxes; `get_list` returns no categories for them. Notes encrypted in the app are shown
  locked (🔒).
- **Keyword packs under Configure**: *Settings → Devices & services → SmartLists → Configure → Category
  detection* – choose active packs, add/remove keywords (several at once with one category), create a
  pack, paste a pack as JSON. Same data as in the card.

## [2.5.1] – 2026-11-12

### Changed

- **New zone** now asks where to create it: current location, home, pick on the map (Home Assistant's map
  editor, if loaded) or coordinates / a Google Maps, Apple Maps or OpenStreetMap link – plus the radius.
  Previously it always used the current location.

### Fixed

- Stores & zones: the store column no longer gets squeezed ("2 Zonen" one letter per line) when a store
  has several zones; zones wrap below.

## [2.5.0] – 2026-11-12

### Added

- **Badges & colours** (⚙ → Household): style per kind (filled, subtle, outline, text only), colour and
  symbol for stores, people and tags; colour per individual badge (`@REWE`, `*Anna`, `#bio`) and a display
  name for stores. Store colours/names also reach the app (known stores). Nothing is written into items –
  reset any time with ↺.
- **Several zones per store** (branches): link REWE Nord and REWE Süd to `@REWE`; shopping mode picks the
  store if you are in any of its zones.
- **Combined lists from the app**: lists created in the app (from HA lists) are reported on sync and can be
  **connected** – in the card (Household → Connected devices) or under *Configure → Lists from the app*.
  The new combined list belongs to the phone's device; the app then shows it instead of its own.
- WebSocket: `smartlists/appearance`, `set_appearance`, `app_lists`, `connect_app_list`;
  `set_store_zone` accepts `zones` / `add`; `register_device` accepts `app_lists`.

### Changed

- `store_zones` values are now lists of zones (a single zone from 2.4.0 is read as a list).

## [2.4.0] – 2026-11-12

### Added

- **Stores & zones**: link stores (`@REWE`, `@Lidl`, …) to Home Assistant zones – or create a zone right
  from SmartLists at the current location (⚙ → Household → Stores & zones). In **shopping mode** a store bar
  (All | REWE · 4 | Lidl · 2) shows only the items of one store, and the store whose zone you are in is
  selected automatically. Optional: also show items without a store.
- **Keyword pack editor**: search, add, change and delete keywords of any pack in the card; create new
  packs (e.g. for another language). Built-in packs are extended through an add-on pack "<name> +" so
  updates never overwrite your changes. Downloading a built-in pack includes your additions.
- **App notes hidden**: the note lists of the HA SmartLists app (`todo.ha_smartlists_note…`) no longer
  appear as shopping lists. Admins can show them as a separate 📝 section on the sidebar page. Notes are
  bound to an account: by default only the owner sees them (reported by the app, changeable by admins),
  optionally the whole household. They are never used by Assist, `get_items` or due items, and are not
  offered when creating combined lists.
- **Sidebar page**: any number of lists side by side (wrapping into rows, up to 4 columns in wide layout)
  and a custom **order** – ◀ ▶ or drag the chips with the mouse; remembered per browser.
- WebSocket: `smartlists/pack_create`, `pack_terms`, `pack_update`, `stores`, `set_store_zone`, `notes`,
  `set_notes`; `register_device` accepts `notes_lists`.

## [2.3.1] – 2026-11-12

### Changed

- The repository was renamed to **m3m0rex/ha_smartlists**. All links (documentation, issue tracker,
  wiki, blueprints) point to the new address. GitHub redirects the old URL, so existing HACS
  installations keep updating; you can optionally re-add the repository under the new URL.

## [2.3.0] – 2026-11-12

### Added

- **Keyword packs for category detection.** Built in: German (the app's pack, 6,500 terms, 1,049
  products) and new starter packs for **English, French, Spanish, Italian and Polish** (about 400
  terms and 200 products each). Several packs can be active at once; on equal keywords the pack
  higher up wins, otherwise the longest match. By default the pack in Home Assistant's language is
  active.
- **Custom packs:** admins upload their own packs (JSON) in the card's gear menu → *Household* →
  *Category detection* – switch packs on/off, change their order, download any pack as a template.
  The app's `category_pack_v2.json` format is accepted too. Up to 20 custom packs, 50,000 keywords each.
- **Four more UI languages: French, Spanish, Italian and Polish** – card, card editor, sidebar page,
  setup and options dialogs, services, and Assist sentences. Assist now answers in the language of
  the conversation.
- Category names follow the user's language (`language` in `smartlists/config` and `smartlists/get_list`;
  category ids are unchanged).
- WebSocket commands `smartlists/packs`, `pack_upload`, `pack_set_active`, `pack_delete`, `pack_export`.
- Units in more languages are recognised in item text (e.g. `2 bottles`, `3 szt`, `Leche 2 botellas`).

### Changed

- The card editor (dashboard dialog) is now translated as well (previously German only).
- `categories.json` was replaced by `packs/<language>.json`.

## [2.2.1] – 2026-11-12

### Added

- App backups report whether they are **encrypted** (`encrypted` in `smartlists/app_backups`). With a
  backup password set in the HA SmartLists app, backups arrive encrypted (AES-256-GCM, key derived from
  the password with PBKDF2) and cannot be read in Home Assistant – not even by admins.

## [2.2.0] – 2026-11-12

### Added

- **Persistent app backups**: the HA SmartLists app (when paired) now stores its backup in the
  integration (`.storage/smartlists.app_backups`) instead of a loose sensor that Home Assistant forgets
  on every restart. One backup per installation, up to 5 MB; everyone sees their own, admins all.
  WebSocket commands `smartlists/app_backup_save`, `app_backups`, `app_backup_get`, `app_backup_delete`.

## [2.1.0] – 2026-11-12

### Added

- **Settings on the sidebar page**: the ⚙ button opens all settings in one place – the same as in the
  card's gear menu, including voice & automations and connected devices. *Configure* at the
  integration stays available.
- Voice & automations, connected devices and "install Assist sentences" in the card's settings
  (household tab, admins).

### Changed

- **Redesigned settings menu**: tabs *For me* / *Household* / *This list*, separated sections with
  icons, switches instead of checkboxes, aligned controls, searchable remembered categories and
  buttons that no longer overflow the card. German and English throughout.
- **Own dialogs** instead of the browser's pop-ups for "new list" and all delete confirmations.

## [2.0.0] – 2026-11-12

### Added

- **Own lists with owner and sharing**: lists stored by SmartLists itself. Create them on the sidebar
  page (**+**) or with *Add own list* at the integration. Share per person as **viewer**, **checker**
  (check off only) or **editor**; the owner and admins can do everything and manage sharing (card gear
  menu → *Sharing*). Rights are enforced for every change – card, app, HA's to-do view, voice, REST.
  Lists not shared with a user are hidden in the card, the sidebar page, the app list and Assist
  answers (HA's own to-do view still lists every entity – see the wiki).
- WebSocket commands `smartlists/users`, `create_list`, `share`, `delete_list`; `get_list` reports the
  caller's role.
- **Automated tests** (`tests/`, GitHub workflow *Tests*) for item text, offers, roles, categories,
  buying rhythm and export/import.

### Changed

- `smartlists/get_list` and `smartlists/lists` take the calling user into account (own lists).

## [1.9.0] – 2026-11-12

### Added

- **"I'm at the store"**: starting the shopping mode in the card or the app fires the event
  `smartlists_shopping` (who, list, store, open items). Blueprint `shopping_notify.yaml` notifies the
  others with a reply field that adds the answer to the list.
- **Store reminder** blueprint `store_reminder.yaml`: entering a store zone sends the open items for
  that store.
- Action **`smartlists.get_items`** (with response): open items of one or all lists, filtered by
  store, person, tag or category, including a spoken summary.
- **Recurring items**: SmartLists learns how often items are bought. Due items are suggested first
  (⏰) and can be added automatically every hour (*Configure → Voice & automations*); action
  `smartlists.add_due_items`.
- **Assist**: intents `SmartListsAddItem` and `SmartListsListItems` with German and English sentences
  ("Setz 2 kg Äpfel bei REWE auf die Einkaufsliste", "Was muss ich bei REWE kaufen?"); install them via
  *Configure → Voice & automations*, with a default list for sentences without a list name.
- **Backup & transfer**: export/import of remembered categories, history, naming convention and
  controls as a file (card gear menu, admins).
- **Setup assistant**: the first setup suggests the existing to-do lists and can create the first
  combined list right away.
- The app reports its shopping mode as well (HA SmartLists app, when paired).

## [1.8.0] – 2026-11-12

### Added

- **Several lists in one card** (`entities`) as tabs, side by side or stacked.
- **Filters per card**: only a store, person or tag (`@REWE`, `*Anna`, `#bio`), only certain
  categories or only offers; new items added in a filtered card get the tag automatically.
  Optional **filter bar** with the stores, persons and tags currently on the list.
- **Views**: list, **tiles** (big tap targets, e.g. kitchen tablet) and **mini** (summary tile with
  open count, stores and the next ending offer; tap to open).
- **Appearance per card**: row height, font size, corner radius, accent colour; CSS variables
  `--smartlists-accent`, `--smartlists-radius`, `--smartlists-row-height`, `--smartlists-tile-size`
  for themes and card-mod.
- **Drag & drop** (mouse): drag an item into another SmartLists card or list to move it (Ctrl/Alt =
  copy), or within a list to reorder it (sort "added", lists that support reordering).
- **Card editor**: presets (family shopping, kitchen tablet, in the store, view only, dashboard tile)
  and a simple mode with *Show advanced options* for everything else.
- **Sidebar page**: one list or up to three side by side (with drag & drop between them) and a
  wide layout; the choice is remembered per browser.

- **Wiki** with installation, setup, all card options, naming convention, app pairing and
  troubleshooting – generated from `docs/wiki` and published automatically on every change.
- `SECURITY.md` with how to report vulnerabilities privately.

### Changed

- The clickable mockup was removed from the repository; `docs/app-api.md` is now in English.

## [1.7.3] – 2026-11-12

### Added

- Releases are created automatically when a version tag is pushed: Hassfest and HACS validation
  run first, then the GitHub release is published with the matching CHANGELOG section.

## [1.7.2] – 2026-11-12

### Fixed

- Added integration categories to `manifest.json` (Productivity & information → shopping & groceries,
  calendars & to-dos), required by the HACS validation.

## [1.7.1] – 2026-11-12

### Changed

- Licensed under the MIT license (`LICENSE`); the HA SmartLists Android app remains a separate project.
- Prepared for the default HACS / Marketplace catalog: validation workflow (Hassfest + HACS action)
  without exceptions and with a weekly run, short catalog name "SmartLists".

## [1.7.0] – 2026-11-12

### Added

- **Connected devices**: every phone with the HA SmartLists app registers when pairing and on each
  sync. *Configure → Connected devices* lists name, model, user, app and Android version and last
  seen (⚠️ after 7 days without sync) and lets you remove devices from the list.
- Each phone also appears as a **Home Assistant device** under SmartLists with the sensors
  *Last seen* (timestamp, usable in automations) and *App version*; deleting the device in HA removes
  it from the list.
- WebSocket commands `smartlists/register_device`, `smartlists/devices`, `smartlists/remove_device`.

### Fixed

- Dashboard cards showed an old version (e.g. no offer prices) while the sidebar page was up to
  date, when an older copy of the card was still loaded as a dashboard resource. A newer card file
  now replaces an already loaded older one; the browser console shows the loaded version.

## [1.6.1] – 2026-11-12

### Added

- Own integration icon and logo (`brand/`, light and dark: checklist with shopping cart, no
  Home Assistant branding), shown on the Integrations page (Home Assistant 2026.3+) and in the README.
- The card's gear menu shows the installed integration and card version, and the card warns when
  the browser still has an outdated card cached.

### Fixed

- Offer prices and "until" dates from the app were not shown in some setups: the offer line is
  now also recognised with emoji variants (⚙️), spaces or lower case, and the card parses it itself
  as a fallback.

## [1.6.0] – 2026-11-12

### Added

- Offers added in the HA SmartLists app (the `⚙OFFER:{…}` line in the item description) are now
  read instead of shown as raw text: the card and sidebar page show store badge, price, old price,
  discount and "until 14.11." (red when expired); search also finds the offer's store.
- Home Assistant's own to-do view shows a readable line for combined lists
  ("🏷️ REWE · 0,39 € · bis 14.11.") instead of the JSON.
- Card editor option "Offers from the app".

### Fixed

- Editing the note of an offer item keeps the offer line, so the app still recognises the offer.

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
