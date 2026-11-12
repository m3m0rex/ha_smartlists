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
