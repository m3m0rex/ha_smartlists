# What's new in 4.0

🇩🇪 [Deutsche Fassung](DE-Neu-in-4.0)

For everyone coming from 3.9: update in HACS as usual and restart Home Assistant. The full list is in the
[changelog](https://github.com/m3m0rex/ha_smartlists/blob/main/CHANGELOG.md).

## What looks different

- **Count before, size after the name.** "2×" stands in front of the name and "1 l" behind it – no longer in columns
  on the right. Glued notations such as `Milk 1l`, `2,5kg` or `4x 150g` are recognised, and "2x" counts wherever it stands (`Milk 2l 2x`). To keep it as text, put it in quotes: `Detergent "2x"`.
- **Tinted categories.** Every category has its own colour and can be collapsed, and so can "Bought often".
- **Badges below the name.** Store, tag, person, price and note share one line; the order can be changed in the
  settings.
- **Icons instead of words** in the header: 🔗 combined list, 🔒 private, 👥 shared. On narrow cards the title gets
  its own line and the icons sit in one row below it. The title can be hidden (`show_title: false`).
- **"Finish shopping"** only shows in shopping mode by default; otherwise it is in the ⋯ menu.
- **The shared page** (link / QR code) uses the same design.

## What is new

| | |
|---|---|
| 🏷️ **Offers card** | `custom:smartdiscounts-card` shows supermarket offers matched with your list; installed separately through HACS – see [[Offers card]]. |
| 🏷️ **Offers in the list** | A hint on items that are on offer, and a note when offers on the list have expired – see [[Offers and prices]]. |
| ⭐ **Watch list** | Products you are waiting to see on offer; Home Assistant reports new offers even with no dashboard open. |
| 🧾 **Templates** | Quicker to create: suggestions from "bought often", from checked items, pasted text is tidied up. |
| 💱 **Currency** | Choose the household currency or your own symbol. |
| 📈 **Price history** | What an item cost, when and where; automatic fill-in of the last price can be switched off. |
| ✏️ **Edit share links** | Change rights, duration and password afterwards – the link stays the same. |
| 📱 **App SmartLists Go** | Lists, offers and watch list on the phone, also offline – see [[App pairing and devices]]. |
| 🧩 **Integration page** | One group each for own lists, combined lists, notes and SmartLists Go; sensors per list and for the household. |
| ⚙️ **Settings** | Restructured into areas, with "Info" (run setup again) and a better view on the smartphone. |

## Do I have to change anything?

No. Lists, settings, learned categories and share links are kept. New card options (`show_title`,
`show_offer_hints`, `shop_finish`) have defaults that match the new design.

If you used a third-party offers card: the SmartDiscounts card can replace it, but you can also keep both. It is installed separately through HACS – see [[Offers card]].
