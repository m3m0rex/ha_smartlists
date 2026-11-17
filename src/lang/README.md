# Translations

Every language is one JSON file:

| Folder | Used by |
| --- | --- |
| `src/lang/card/` | SmartLists card, settings and sidebar page |
| `src/lang/discounts/` | SmartDiscounts card (offers) |

`de.json` is the reference – it defines which entries exist. `en.json` is the fallback: an entry missing in another
language is shown in English.

## Fix or improve a text

Edit the entry in `<language>.json`, then run

```
python scripts/build_card.py
python -m pytest -q tests
```

and open a pull request with the changed JSON file **and** the rebuilt files in `custom_components/smartlists/www/`.

## Add a language

1. Copy `en.json` to `<code>.json` in both folders (`code` = two letters as Home Assistant uses them, e.g. `nl`).
2. Translate the values. Keep the keys and placeholders such as `{n}` or `{name}` unchanged. You do not have to
   translate everything at once – missing entries fall back to English.
3. Build and test as above.

A new file is picked up automatically: the card uses it when Home Assistant runs in that language. Not covered by
these files are the built-in product categories and word lists (`custom_components/smartlists/packs/`) and the
texts Home Assistant shows itself (`custom_components/smartlists/translations/`).
