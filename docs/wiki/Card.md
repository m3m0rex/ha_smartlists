# Card `custom:smartlists-card`

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
```

The visual editor starts with the essentials (preset, list, title, view, sort). Turn on
*Show advanced options* for everything else. Only values that differ from the defaults are saved.

## Presets

| Preset | Sets |
|---|---|
| Family shopping | list view, filter bar, input, suggestions, stepper |
| Kitchen tablet | tiles, large rows, bigger font, no import / settings |
| In the store | starts in shopping mode, no input, large rows |
| View only | no input, stepper, import, settings, undo or shopping button |
| Compact dashboard tile | mini view, compact rows |

## Options

| Option | Default | Values |
|---|---|---|
| `entity` | – | one to-do list |
| `entities` | – | several lists; `- todo.a` or `- entity: todo.b` with own `title` / filters |
| `layout` | `tabs` | `tabs`, `columns`, `stack` (several lists) |
| `title` | list name | text |
| `view` | `list` | `list`, `tiles`, `mini` |
| `sort` | `category` | `category`, `alpha`, `added`, `list` (combined lists) |
| `filter_store` / `filter_person` / `filter_tag` | – | e.g. `REWE`, `Anna`, `bio`; several with commas |
| `filter_category` | – | list of category ids, e.g. `[kuehlung, tiefkuehl]` |
| `filter_offers` | `false` | only offers from the app |
| `filter_tags_new_items` | `true` | new items get the single filter tag (`@REWE`) automatically |
| `show_filter_chips` | `false` | filter bar with stores, persons, tags and offers on the list |
| `density` | `normal` | `compact`, `normal`, `comfortable` |
| `font_scale` | `1` | 0.8 – 1.6 |
| `radius` | theme | corner radius in px |
| `accent_color` | theme | colour picker or `"#1747B5"` |
| `max_height` | – | list height in px (scrolls) |
| `drag_drop` | `true` | drag items to another list / reorder |
| `start_shopping` | `false` | open in shopping mode |
| `show_header`, `show_count`, `show_search`, `show_sort`, `show_shopping`, `show_undo`, `show_import`, `show_settings` | `true` | header elements |
| `show_add`, `show_frequent` | `true` | input and "frequently bought" |
| `show_stepper`, `show_offer`, `show_tags`, `show_source`, `show_note`, `show_category_titles` | `true` | list elements |
| `show_completed`, `collapse_completed` | `true` | completed section |

Category ids: `obst_gemuese`, `fleisch`, `kuehlung`, `grundnahrung`, `backwaren`, `getraenke`,
`suessigkeiten`, `haushalt`, `drogerie`, `tiefkuehl`, `tierbedarf`, `sonstiges`.

## Examples

Store card that only shows REWE items; new items get `@REWE`:

```yaml
type: custom:smartlists-card
entity: todo.weekly_shop
filter_store: REWE
start_shopping: true
show_import: false
```

Two lists side by side:

```yaml
type: custom:smartlists-card
entities:
  - todo.anna
  - entity: todo.max
    title: Max (drugstore only)
    filter_category: [drogerie]
layout: columns
```

## Using the card

- **Input**: type `2 kg Äpfel @REWE` – quantity, unit, store and category are recognised. ↑/↓, Tab
  and Enter pick suggestions; tap the category chip to change it (remembered for similar items).
- **Long press** (or right click / double click, see the gear menu) opens the item menu: edit, move,
  copy, change category, delete.
- **Drag & drop** with the mouse: onto another SmartLists card to move (Ctrl/Alt = copy), onto an item in
  the same list to reorder (sort "added").
- **Shopping mode** (cart icon): screen stays on, checked items are hidden, large rows, tap the whole
  row; ↶ in the header undoes the last change.
- **Gear menu**: versions, naming convention (admins), remembered categories, **backup & transfer**
  (export/import as a file, admins), personal controls.
- **Frequently bought** (empty input): due items by your buying rhythm first, marked ⏰.
- Starting the **shopping mode** fires `smartlists_shopping` – see [[Automations and voice]].

## Styling

CSS variables for themes and card-mod: `--smartlists-accent`, `--smartlists-radius`,
`--smartlists-row-height`, `--smartlists-tile-size`.
