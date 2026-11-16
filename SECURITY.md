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

- All data stays in your Home Assistant instance (`.storage/smartlists.*`). There is no telemetry. The
  integration connects to the outside only in two cases:
  - **Barcode lookup** (off by default): if you switch it on, the scanned code – nothing else, no account – is
    sent to the lookup services you have selected, one after the other until one knows the product. Only Open
    Food Facts is preselected; the others are contacted only if you add them:

    | Service | Host |
    | --- | --- |
    | Open Food Facts (preselected) | `world.openfoodfacts.org` |
    | Open Beauty Facts | `world.openbeautyfacts.org` |
    | Open Pet Food Facts | `world.openpetfoodfacts.org` |
    | Open Products Facts | `world.openproductsfacts.org` |
    | UPCitemdb | `api.upcitemdb.com` |
    | Your own service | the `https://` address you enter |

    A product that was found is remembered, so the same code is not asked again. Without the lookup the scanner
    only knows codes it has already learned.
  - **Cloudflare tunnel** for shared links (off by default): if you enable it, SmartLists starts `cloudflared`,
    which connects to Cloudflare.

  Both are off until you turn them on; a fresh installation makes no outbound connections.
- Every command runs with the permissions of the logged-in HA user; changes to lists go through the
  regular `todo.*` services. Household settings, forgetting categories and removing devices require an
  admin.
- Item text is rendered as text, never as HTML.
