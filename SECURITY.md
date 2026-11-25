# Security policy

## Supported versions

Only the **latest release** of SmartLists receives fixes. Please update before reporting.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report them privately via GitHub: *Security* tab of this repository → **Report a vulnerability**
(private vulnerability reporting). Please include:

- the SmartLists and Home Assistant versions,
- what an attacker can do and under which conditions (e.g. which HA user role is needed),
- steps to reproduce.

You will get a first answer within **7 days**. Confirmed issues are fixed in a new release and
credited in the changelog unless you prefer otherwise.

## Scope

In scope: the integration in `custom_components/smartlists` – especially the WebSocket commands
(`smartlists/*`), permission checks (admin-only commands, foreign lists, per-user settings), the
sidebar page and the Lovelace card (e.g. script injection through item names or notes).

Out of scope: Home Assistant itself, other integrations whose to-do lists SmartLists combines, and the
HA SmartLists Android app (separate project).

## How SmartLists handles data

- All data stays in your Home Assistant instance (`.storage/smartlists/`). There is no telemetry. The
  integration connects to the outside only in one case:
  - **Barcode lookup** (off by default): if you switch it on, the scanned code is sent to the lookup services
    you have selected, one after the other until one knows the product. No service is preselected – a service
    is contacted only after you have picked it:

    | Service | Host |
    | --- | --- |
    | Open Food Facts | `world.openfoodfacts.org` |
    | Open Beauty Facts | `world.openbeautyfacts.org` |
    | Open Pet Food Facts | `world.openpetfoodfacts.org` |
    | Open Products Facts | `world.openproductsfacts.org` |
    | UPCitemdb | `api.upcitemdb.com` |
    | Your own service | the `https://` address you enter |

    What a request contains: the barcode, the language of your Home Assistant (to get the product name in it)
    and a `User-Agent` header of the form `SmartLists-HomeAssistant/<version> (https://github.com/m3m0rex/ha_smartlists)`.
    The Open … Facts databases require such a header – app name, version and a contact – and may block requests
    without it. The contact is the project page: **no e-mail address, no account, no API key and nothing about
    your household is sent**, and none of the services needs you to register. As with any connection, the
    service sees the IP address of your Home Assistant.

    Limits of the free services: 100 product lookups per minute for the Open … Facts databases; 100 per day
    and 6 per minute for UPCitemdb. If a service answers "too many requests", SmartLists skips it for a while
    (UPCitemdb one hour, the others five minutes) instead of asking again. A product that was found is
    remembered, so the same code is not asked twice. Without the lookup the scanner only knows codes it has
    already learned.

  It is off until you turn it on; a fresh installation makes no outbound connections.
- SmartLists starts no programs and opens no network port of its own. Shared links are served by Home
  Assistant's HTTP server: `/smartlists-share/{key}` and `/api/smartlists/share/{key}` need no login and are
  protected by the 256-bit key in the link (only its hash is stored), an optional expiry, an optional password
  and rate limits. To keep your Home Assistant address private, put your own reverse proxy or tunnel in front
  and forward only these two paths.
- Every command runs with the permissions of the logged-in HA user; changes to lists go through the
  regular `todo.*` services. Household settings, forgetting categories and removing devices require an
  admin.
- Item text is rendered as text, never as HTML.
