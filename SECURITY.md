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

- All data stays in your Home Assistant instance (`.storage/smartlists.*`); the integration makes no
  outbound network requests.
- Every command runs with the permissions of the logged-in HA user; changes to lists go through the
  regular `todo.*` services. Household settings, forgetting categories and removing devices require an
  admin.
- Item text is rendered as text, never as HTML.
