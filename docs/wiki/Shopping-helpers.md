# Shopping helpers

All of these are optional – without settings SmartLists behaves as before.

## Aisle order per store

*General settings (slider icon) → Household → Stores & zones → 🛤️ Order* next to a store. Move the
categories with ▲▼ into the order of the aisles. If the store has several zones (branches), choose a
branch to give it its own order. In **shopping mode**, when that store is selected (by hand or
automatically through its zone), the list is grouped in this order.

## Prices & expenses

- **Price of an item:** type it at the end – `Milk 2 l 1,19€` (the price is not part of the name), or
  ✏️ → *Price*. A typed price is for the whole line (`Milk 2 l 1,19€` = 2 l for 1,19 €) and is stored
  **per unit** (0,60 €/l), so other quantities are calculated correctly; in ✏️ you enter the price per
  unit. Offers from the app bring their own price.
- The row shows the total and the unit price; a **total** bar below the list shows open and in-cart sums.
- **Expenses** are booked when an item with a price is **checked off** in the card or the sidebar page
  (re-opening within 6 hours takes it back). *General settings → Statistics → Expenses* shows weeks,
  months or years per store; `sensor.smartlists_expenses_this_month` has the current month.
- Items checked off directly in the app or HA's own to-do view are not booked yet.

## Templates & recipes

📋 in the card header opens the templates: tap one to add it – choose servings (quantities are scaled),
untick items you don't need. Items already open on the list get their quantity increased instead of
being added twice. *＋ New template* (one item per line, with quantities and tags), *List as template*
takes the open items. Assist: "Put pancakes on the shopping list" uses the template of that name;
action `smartlists.add_template` does the same in automations.

## Share via link / QR code

*Gear of the list (settings of this list) → Share via link* – admins, and owners of own lists.

- Options when creating: **checking off** – *view only* (default), *“soft”* (the person can mark
  items; you see "✓ marked from outside" but the item stays open until you check it off) or *really
  check off*; **may add**; **valid** for 2 hours, 1 day, 7 days, 30 days or until revoked.
- You get the link and a **QR code** once; copy or share it. The list shows active links with expiry
  and how often they were opened; **revoke** any time.
- **Security:** the link contains a random 256-bit key; only its SHA-256 hash is stored, so even
  someone reading `.storage` cannot rebuild a link. Without login only two addresses are reachable
  (`/smartlists-share/<key>` and `/api/smartlists/share/<key>`); they return the list name and the
  item texts with checkmarks – no notes, no entities, no users, nothing else from Home Assistant.
  Writing is limited (30 actions per minute, 120 characters), wrong keys are answered slowly, the page
  is not indexed and cannot be framed. Note lists of the app cannot be shared.
- The link only works from outside if Home Assistant is reachable from outside (Nabu Casa or your own
  domain, *Settings → System → Network → external URL*).

## Notifications

*General settings → For me → Notifications* – everyone for themselves: which phone (companion app),
on new items and/or when something is checked off, which lists, from whom (per person), quiet hours.
Your own changes never notify you; several changes within a minute arrive as one message ("Anna added
milk 2 l, bread to Shopping"). Changes from the card, the app, HA itself and shared links count.

## Barcode scan

The barcode button next to the input opens the camera (Chrome/Android; on iPhone Safari and Firefox
type the number). The product name comes from SmartLists' own memory or **Open Food Facts** (only the
number is sent) and lands in the input field to adjust. Turn online lookup off under *Household →
Voice & automations → Look up barcodes online*.

## Statistics

📊 on the sidebar page (or *General settings → Statistics*): bought most often with rhythm ("every
4 days"), *not bought for a while* (with ＋ to put it back on the list), shares per category and store.
It uses the existing history – nothing new is collected.
