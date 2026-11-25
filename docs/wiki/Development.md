# Development

## Building the card

The list card is split into parts under `src/card/` (plain concatenation, numbered in load order) and built into
`custom_components/smartlists/www/smartlists-card.js`:

```
python scripts/build_card.py          # build
python scripts/build_card.py --check  # fail if the built file is out of date
```

Texts live in one file per language under `src/lang/card/` (`de.json` is the reference, `en.json` the fallback); a new
file there is picked up by the build. The offers card is a project of its own in the repository
`ha_smartdiscounts-card` and is no longer part of this one.

## Tests

```
python -m pytest -q tests
```

The tests run without Home Assistant installed (the needed parts are stubbed). They also check that the built card
is up to date, that `CARD_VERSION` equals the version in `manifest.json` and that the changelog has a section for it.
Tests of the cards' pure functions need Node.js and are skipped without it.

## Releases

A push to `main` with a new version in `manifest.json` creates the tag and the GitHub release. Versions with a
hyphen (`4.0.0-beta.1`) become **pre-releases**: HACS only offers them with "Show beta versions".

## Interface for the app

The HA SmartLists app (not published yet) pairs with the integration via the WebSocket API. All commands, responses
and the text format: [docs/app-api.md](https://github.com/m3m0rex/ha_smartlists/blob/main/docs/app-api.md). The
commands are registered in `websocket.py` and implemented in the `ws_*.py` modules.

The category pack is generated from the app's pack with `python scripts/build_categories.py`.

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
  learning.py        memory: categories, history (per list), suggestions, tag rules, controls
  own.py             own lists: roles and permissions
  own_groups.py      own lists grouped per owner (one entry per owner), move of old entries
  automation.py      shopping event, get_items, Assist intents, due items
  lists.py           read/change lists (combined and regular to-do lists)
  shares.py, public.py   share links; public address for links
  features.py        extras (notes, meal plan)
  pwa.py             web-app manifest for the home-screen icon
  repairs.py         hints and fixes under Settings → Repairs
  websocket.py       commands for card and app (see docs/app-api.md)
  www/smartlists-card.js   Lovelace card and sidebar page
  strings.json, translations/   texts (de, en, fr, es, it, pl)
  packs/                        built-in keyword packs (one JSON per language)
blueprints/automation/smartlists/   ready-made automations
tests/                          tests (pytest, no HA needed)
scripts/build_categories.py     generate categories.json from the app's pack
scripts/make_demo_gif.py        generate the demo GIF at the top of this README
```
