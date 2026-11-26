# Installation

Requires **Home Assistant 2025.3** or newer (2026.3+ for the integration icon).

## HACS

SmartLists is in the HACS default store.

1. Open HACS and search for **SmartLists**
   ([open it directly](https://my.home-assistant.io/redirect/hacs_repository/?owner=m3m0rex&repository=ha_smartlists&category=integration)).
2. Download it and restart Home Assistant.
3. *Settings → Devices & services → Add integration → SmartLists*

Not listed yet in your HACS? Add `https://github.com/m3m0rex/ha_smartlists` under ⋮ → *Custom repositories*, type
**Integration**.

Install it **only as "Integration"**, not as "Dashboard". The card is shipped with the
integration and loaded automatically – a second copy as a dashboard resource causes old versions to
show up (see [[Troubleshooting]]).

## Manual

Copy `custom_components/smartlists` to `/config/custom_components/smartlists`, restart Home Assistant
and add the integration as above.

## Updating

Update in HACS, restart Home Assistant and reload the browser page (Ctrl+F5). In the Companion app:
*Settings → Companion app → Troubleshooting → Reset frontend cache*. The card's gear menu shows the
installed versions.
