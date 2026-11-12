# Item text and naming convention

Home Assistant stores a single name per to-do item. SmartLists keeps quantity and markers in that
name, so every other interface (HA's to-do view, voice assistants, other apps) still sees them:

```
Name [N× ]quantity [unit] [tags …]
Milch 2 l @REWE
Joghurt 4× 150 g *Anna #bio
```

| Marker | Default | Shown as |
|---|---|---|
| Store | `@REWE` | store badge in its brand colour (REWE, LIDL, ALDI, EDEKA, NORMA, Kaufland, Penny, Netto, dm, Rossmann; others in a fixed colour) |
| Person | `*Anna` | 👤 Anna |
| Tag | `#bio` | #bio |

- A marker needs a space in front (`Milch@REWE` is not a tag). Use a hyphen for spaces (`@Bio-Markt`).
- The characters can be changed under *Configure → Naming convention* (allowed: `@ * # ! + ~ $ & % ^ =`).
- "2 kg Äpfel" (quantity first) is recognised while typing and stored as "Äpfel 2 kg".
- In combined lists the source list counts as a person (`todo.peter` → 👤 Peter) unless the item names
  a person.

## Offers from the app

Items added from the app's offer overview carry a line like
`⚙OFFER:{"s":"REWE","e":"2026-11-14","p":0.39}` in their description. The card and sidebar page show it
as store badge, price, old price, discount and "until 14.11." (red when expired). Editing the note keeps
the line. HA's own to-do view of a regular list still shows the raw line.
