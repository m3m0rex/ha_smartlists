# Offers and prices

🇩🇪 [Deutsche Fassung](DE-Angebote-und-Preise)

## How an item gets its price

The first source with a price wins:

1. **Offer** – attached by the app or by the [[Offers card]]. It applies to the whole item until it expires.
2. **Price in the text of another source** ("… - 0,99 €") – per piece.
3. **Own price** – entered in the item or typed when adding (`Milk 2 l 2,38 €` remembers 1,19 per litre).
4. **Last paid** (marked with ~) – booked when the item was last checked off.

The list shows price × quantity; checking off books the amount as an expense (per month and store, see
[[Shopping helpers]]).

## Remembered prices and the price history

Under *Settings → Prices & currency*:

- **Fill in the remembered price automatically** (default on): when an item returns to the list, its last price is
  shown. Switched off, prices are only kept in the history – an item then shows an offer or the price you typed for
  exactly this entry.
- A price you type always stays on the entry it was typed for.

The **price history** is in the item menu under *History*: your own prices and what was paid when checking off, with
store and date (the last twelve changes per item), plus a small chart and the lowest price so far.

## Currency

*Settings → Prices & currency → Currency* applies to prices, totals and expenses for all users. The notations of the
chosen currency are recognised while typing, e.g. `CHF 2.50`, `2,50 Fr.` or `£1.20`.

For a currency that is not in the list choose **Own symbol …** and enter up to six characters (e.g. `₺`, `Rp`). It is
shown after the amount and recognised as a price while typing.

## Watch list

The watch list holds products you are waiting to see on offer. **Every Home Assistant user has their own watch lists** –
one file per user (`.storage/smartlists/watch/<user>`), the same in every browser and on every device; other users never
see them. Add a product from an item's menu (**Add to watch list**), in the ⭐ tab of the [[Offers card]] or in the app;
remove it there or under *Settings → Prices & currency → Watch list*. Further watch lists are created in the card ("New
watch list"), no admin rights needed; "All watch lists" shows everything of the user together.

With **Notify when one of them is on offer** switched on, Home Assistant checks the offer sensors every 30 minutes – even
with no dashboard open – and reports every new offer once. Under **Send to** every user picks their own targets: the
companion app on their phones and tablets or any other notify service. The target "In Home Assistant" is seen by the
whole household, so only admins can choose it.

## Offers in the shopping list

With offer sensors in Home Assistant (the same ones the [[Offers card]] uses) the list card shows a **🏷️ hint** on
items that are on offer. A tap opens the offers; choosing one attaches store, price and validity to the item. Items
with an `@store` only show offers of that store. Switch it off per card with `show_offer_hints: false`.

When an offer comes from **next week's preview**, the item shows "⏳ valid from 23.11." instead of "until …"; the
mark goes away on the day the offer starts. Sensors with "preview", "vorschau" or "next_week" in their name count as
a preview. The watch list only reports such offers once they are valid.

## Expired offers

When an offer attached to an item has run out, both cards show a note with **Remove** and **Later**. "Remove" takes
store, price and validity off the items – the items themselves and their notes stay.
