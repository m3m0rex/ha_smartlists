# App pairing and devices

> ℹ️ **The app SmartLists Go is not published yet.** This page describes how the integration works with it. Until then
> you need none of this – SmartLists works fully in Home Assistant, the card, the sidebar page and the official Home
> Assistant app (including its home-screen widgets).

**SmartLists Go** ("HA SmartLists Go: Grocery List") works on its own on the phone, or signed in to your Home
Assistant. Signed in, SmartLists in Home Assistant does the thinking – categories, rights, offers – and the app keeps a
copy on the phone, so it also works without a connection and sends changes later.

## Signing in

*App → Settings → Home Assistant → Sign in*: enter the address at home (e.g. `http://homeassistant.local:8123`) and,
if you like, the one from outside. The app opens the sign-in page of **your own** Home Assistant in the browser; after
signing in you come back to the app. No long-lived token is needed, and the app never sees your password.

- At home the app uses the home address first. With **Recognise home network** (the name of your Wi-Fi) it goes
  straight to the outside address on other networks.
- A self-signed certificate can be accepted on purpose (*Accept a self-signed certificate*).
- To revoke access later: *Profile → Security → Refresh tokens* in Home Assistant, entry "SmartLists Go".

## What the app uses from SmartLists

- **Lists:** every list you may see, with your rights (add, tick, rename, delete). New lists created in the app as
  "in Home Assistant" become own SmartLists lists of the signed-in user.
- **Moving lists:** lists that so far live only on the phone can be moved to Home Assistant (*list menu → Move to Home
  Assistant*). The list is created there and filled; only then does it disappear from the phone.
- **Notes:** notes lists (`todo.ha_smartlists_notes…`) appear in the app under *Notes*, one entry = one note.
- **Naming and badges:** `@` store, `*` person, `#` tag (or your own characters) and the look of the badges.
- **Offers:** the offers tab comes from SmartLists (`smartlists/offers`) – My list (offers for your open items),
  your watch lists and all offers. SmartDiscounts itself is not needed for the app.
- **Store zones:** in shopping mode the app picks the store you are standing in from the store zones.
- Combined lists made **in the app** stay in the app: they may mix lists from the phone and from Home Assistant.

## Devices

Every signed-in app shows up under SmartLists as a device "SmartLists Go (Android – user / device)" with the
sensors **Last sync**, **Pending changes** and **App version**. Removing a device only removes it from the list; it
comes back with the next sync. To lock an app out, revoke its refresh token (see above).

Interface details for developers: [`docs/app-api.md`](https://github.com/m3m0rex/ha_smartlists/blob/main/docs/app-api.md).

## Backups

*App → Settings → Backup → Back up to Home Assistant* stores the lists and settings of the phone in Home Assistant –
**one file per Home Assistant user** under `.storage/smartlists/backups/apps/<user>`, one entry per phone. Everyone
only sees their own backups; admins see all. Backups stay when SmartLists is removed.

**Backup password** (*App → Settings → Backup*): encrypts the backup on the phone with AES-256-GCM before it is sent.
Home Assistant only stores unreadable data – nobody can read it without the password, not even an admin.
**If you forget it, the backup cannot be restored.**

## Lists of the older app

Lists of the earlier app that are still plain Local To-do lists (`todo.ha_smartlists_*`) are reported under
*Settings → Repairs*; *Fix* takes them over as own SmartLists lists.
