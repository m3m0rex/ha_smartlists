# Installation

Requires **Home Assistant 2025.3** or newer (2026.3+ for the integration icon).

## HACS

1. HACS → ⋮ → *Custom repositories*
2. URL `https://github.com/m3m0rex/ha_smartlists`, type **Integration** → *Add*
3. Download **SmartLists** and restart Home Assistant.
4. *Settings → Devices & services → Add integration → SmartLists*

Add the repository **only as "Integration"**, not as "Dashboard". The card is shipped with the
integration and loaded automatically – a second copy as a dashboard resource causes old versions to
show up (see [[Troubleshooting]]).

## Manual

Copy `custom_components/smartlists` to `/config/custom_components/smartlists`, restart Home Assistant
and add the integration as above.

## Updating

Update in HACS, restart Home Assistant and reload the browser page (Ctrl+F5). In the Companion app:
*Settings → Companion app → Troubleshooting → Reset frontend cache*. The card's gear menu shows the
installed versions.

## Good to know

- Combined lists cannot be nested (protection against loops).
- In "this combined list only" mode the local checkmarks are stored in Home Assistant
  (`.storage/smartlists.<id>`) and removed together with the integration.
- Items without a unique ID (very old integrations) are skipped.
- Requires Home Assistant 2025.3 or newer (sub-entries for the lists).
- The user interface (card, sidebar page, setup dialogs, Assist sentences) is available in German, English,
  French, Spanish, Italian and Polish. Category names follow the Home Assistant language.
