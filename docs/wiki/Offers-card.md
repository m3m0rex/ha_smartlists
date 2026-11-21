# Offers card

🇩🇪 [Deutsche Fassung](DE-Angebots-Karte)

`custom:smartdiscounts-card` shows the offers of your supermarkets and matches them with a shopping list. It is
a project of its own with its own version number and runs with and **without SmartLists**. Since SmartLists 4.0.0-beta.7
it is no longer shipped with SmartLists: add its [own repository](https://github.com/m3m0rex/ha_smartdiscounts-card) to HACS as a custom
repository (type *Dashboard*), install "SmartDiscounts" and reload the browser. When it is missing although a
dashboard uses it or a watch list is kept, SmartLists says so under *Settings → Repairs*. The README there lists every
option with examples.

## What you need

At least one sensor with a list of offers in an attribute, e.g. from the integrations by
[FaserF](https://github.com/FaserF) for REWE, EDEKA, Lidl, ALDI and Norma ([all projects](https://hassio-addons.fabiseitz.de/)). Any other sensor with such a list works
too. Your own REST, template or scrape sensors work as well.

## Set up

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
```

- **🛒 My shopping list:** the items of the connected list – on top what came from offers (store, price, "until"),
  below "Not valid yet" (from next week's preview) and the other items. Change the count and tick off right here;
  with a combined list every item names its source list. `shop_view: smartlists` shows the list in the SmartLists
  card instead.
- **All offers:** one shelf per store with search and categories – as tiles or as a list with small images. "On your
  list" at the top shows what is already on the list. When a sensor delivers next week's offers, a switch
  "Now / from …" appears.
- **⭐ Watch list:** products you are waiting to see on offer. Offers from the preview are listed with "from …"; they
  are only reported once they are valid.
- **Bonus offers** (e.g. REWE Bonus) carry "🎁 0,20 € bonus"; `use_bonus: true` compares them with the bonus taken
  off. **▲ / ▼** show whether a product was cheaper or dearer before.

The card speaks German, English, French, Spanish, Italian and Polish and follows the language of Home Assistant.

## Options

Every option with its default and examples is listed in the [README of the card](https://github.com/m3m0rex/ha_smartdiscounts-card#readme)
– the one place that is kept up to date with each release. Most used: `list`, `add_to`, `tabs`, `shop_view`,
`all_view`, `category_source`, `preview_entities`, `use_bonus`, `watch`, `notify`.

## Your own sensors: all fields of `map:`

The card recognises common field names by itself. For everything else you map the fields: on the left the field of
the card, on the right the field of your sensor. Only `name` and `price` are required; a dot reaches into nested
data (`images.0.url`).

| Field | Meaning | Recognised automatically as |
|---|---|---|
| `name` | Product name (**required**) | `product`, `title`, `name`, `product_name`, `description` |
| `price` | Offer price (**required**) | `price`, `new_price`, `discount_price`, `offer_price`, `sale_price`, `price_euro`, `current_price` |
| `old_price` | Old price, struck through | `old_price`, `regular_price`, `original_price`, `was_price` |
| `discount` | Discount, e.g. "-44%" | `discount`, `discount_percent`, `savings` |
| `unit` | Unit price as text, e.g. "1 kg = 5,16 €" | `price_per_unit`, `base_price`, `unit_price` |
| `image` | Image address | `picture_link`, `image_url`, `image`, `picture`, `img`, `thumbnail` |
| `until` | Valid until (`YYYY-MM-DD`) | `valid_until`, `end_date`, `valid_to`, `until` |
| `category` | Category for the filter | `category`, `categories`, `group` |
| `brand` | Brand (searchable) | `brand`, `manufacturer` |
| `store` | Store of this one offer | `store`, `market`, `retailer`, `advertiser` |

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
sources:
  - auto
  - entity: sensor.my_store
    attribute: results
    store: Kaufland
    color: "#e10915"
    map:
      name: product.name
      price: prices.current
      old_price: prices.regular
      image: images.0.url
      until: validity.to
```

## Watch list and notifications

**With SmartLists** every Home Assistant user has their own watch lists, stored in Home Assistant (see [[Offers and
prices]]): the same in every browser and on every device, more lists with "New watch list", and Home Assistant reports
new offers even with no dashboard open. `watch_list:` is not used then – if one is still set, the card offers to copy
its open entries once.

**Without SmartLists** the watch list comes from `watch:` in the configuration, from a to-do list (`watch_list:`,
editable in the card and the same on all devices) or – without one – from what you enter in the tab, stored in that
browser only. With `notify: true` the card creates a Home Assistant notification when a watched product is newly on
offer. **The check runs in the card**, so it reports while a dashboard with the card is open (e.g. a wall tablet).

## Together with SmartLists

- A chosen offer appears as a **badge on the item** with store, price and "valid until".
- The shopping list shows a 🏷️ hint on items that are on offer (see [[Offers and prices]]).
- Expired offers are pointed out in both cards and removed with one tap.

## Questions

**No discount shown?** Not every sensor delivers an old price – then the card shows price and unit price.

**"Butter" finds "butter biscuit"?** `match: word` prevents that; `exact` is stricter still.

**A store is missing?** Check that the sensor has a list in one of the attributes `discounts`, `offers`, `deals`,
`items`, `results` or `products` – otherwise name it with `attribute:`.
