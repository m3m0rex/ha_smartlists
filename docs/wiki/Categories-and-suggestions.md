# Categories and suggestions

Every item gets a shopping category (🥬 fruit & veg, 🥛 chilled, …) in this order:

1. **remembered** – chosen by hand for this item
2. **learned** – chosen for a similar item ("Hafermilch" → also "Hafermilch Barista")
3. **keyword packs** – the active packs (see below)
4. **other**

Change the category in the card (tap the chip while typing, or long press → *Change category*). It
applies to the whole household and is synced with the app.

**Suggestions** while typing come from the history (frequent and recent items), the list itself and
the products of the active packs (about 1,050 in the German pack), including the usual or last used unit. An empty input shows
"frequently bought" items that are not on the list.

Manage everything under *Configure → Remembered categories & history* or in the card's gear menu.

## Keyword packs

A pack maps keywords to the 12 fixed categories. Built in:

| Pack | Keywords | Products |
|---|---|---|
| German – HA SmartLists app | ~6,500 | 1,049 (with usual unit) |
| English / French / Spanish / Italian / Polish – starter packs | ~360–410 each | ~200 each |

By default the pack in Home Assistant's language is active (German if there is none). Admins manage
packs in the card's gear menu (or the sidebar page's ⚙) → **Household → Category detection**:

- **switch** a pack on or off – several can be active, e.g. German + English in a bilingual household,
- **▲** moves a pack up: on equal keywords the pack higher up wins. Otherwise the **longest matching
  keyword** wins across all packs ("oat milk" beats "milk"),
- **✏️** edits a pack's keywords: search, change the category, delete, add (several at once,
  separated by commas). Built-in packs stay untouched – your changes go into an add-on pack
  "<name> +" right above it, so updates of the integration never overwrite them. On a built-in keyword
  × means *ignore* (counts as Other); on a changed one it reverts your change,
- **＋ New pack** creates an empty pack, e.g. for another language – then fill it with ✏️,
- **⬇** downloads a pack (built-in ones including your additions) – a good starting point to share,
- **Upload pack …** adds your own pack (JSON). It is activated at the top. The same name replaces an
  existing custom pack; up to 20 custom packs.

Remembered and learned categories always take precedence over every pack.

### Pack format

```json
{
  "name": "My pack",
  "language": "en",
  "version": 1,
  "terms": { "oat milk": "kuehlung", "sourdough": "backwaren", "dish soap": "haushalt" },
  "products": [["Oat milk", "l", "kuehlung"], ["Sourdough bread", "", "backwaren"]]
}
```

- `terms` (required): keyword → category id. Matching is case-insensitive and finds the keyword
  anywhere in the item name ("milk" also matches "oat milk 2 l").
- `products` (optional): `[display name, usual unit, category id]` – used for suggestions and the
  usual unit.
- Category ids: `obst_gemuese`, `fleisch`, `kuehlung`, `grundnahrung`, `backwaren`, `getraenke`,
  `suessigkeiten`, `haushalt`, `drogerie`, `tiefkuehl`, `tierbedarf`, `sonstiges`.
- The app's format (`category_pack_v2.json` with `items` / `keyword` / `aliases` / `category`) is
  accepted as well. Entries with an unknown category are skipped and counted.
- Up to 50,000 keywords per pack. Custom packs are stored in `.storage/smartlists.packs`.

Want to improve a starter pack? The sources are simple word lists in `scripts/packsrc/<language>.py`
(`python scripts/build_starter_packs.py` rebuilds `packs/*.json`) – pull requests welcome.
