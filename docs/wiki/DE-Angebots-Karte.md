# Angebots-Karte

🇬🇧 [English version](Offers-card)

`custom:smartdiscounts-card` zeigt die Angebote deiner Supermärkte und gleicht sie mit einer Einkaufsliste ab. Sie ist
ein eigenes Projekt mit eigener Versionsnummer und läuft mit und **ohne SmartLists**. Seit SmartLists 4.0.0-beta.7 wird
sie nicht mehr mitgeliefert: in HACS das [eigene Repository](https://github.com/m3m0rex/ha_smartdiscounts-card) als benutzerdefiniertes
Repository (Typ *Dashboard*) hinzufügen, „SmartDiscounts“ installieren, Browser neu laden. Fehlt sie, obwohl sie auf
einem Dashboard steht oder eine Merkliste geführt wird, weist SmartLists unter *Einstellungen → Reparaturen* darauf hin. Das
[deutsches README](https://github.com/m3m0rex/ha_smartdiscounts-card/blob/main/README.de.md) führt jede Option mit
Beispielen auf.

## Voraussetzung

Mindestens ein Sensor mit einer Angebotsliste in einem Attribut, z. B. aus den Integrationen von
[FaserF](https://github.com/FaserF) für REWE, EDEKA, Lidl, ALDI und Norma ([alle Projekte](https://hassio-addons.fabiseitz.de/)). Jeder andere Sensor mit einer solchen
Liste geht ebenso. Eigene REST-, Template- oder Scrape-Sensoren gehen ebenso.

## Einrichten

```yaml
type: custom:smartdiscounts-card
list: todo.einkauf
```

- **Meine Liste:** zu jedem offenen Artikel die passenden Angebote je Markt, das günstigste mit ★. „Günstigste wählen“
  oder „nur REWE“ wählt für die ganze Liste; „In Liste übernehmen“ schreibt Markt, Preis und Gültigkeit an die Einträge.
  Drei Ansichten: je Angebot eine Zeile, je Artikel eine Zeile oder eine Tabelle mit den Märkten als Spalten.
- **Alle Angebote:** ein Regal je Markt mit Suche und Kategorien – als Kacheln oder als Liste mit kleinen Bildern.
- **⭐ Merkliste:** Produkte, bei denen du auf ein Angebot wartest.
- **Bonus-Angebote** (z. B. REWE Bonus) sind als „nur mit der Bonus-App“ gekennzeichnet; `use_bonus: true` vergleicht sie
  mit abgezogenem Bonus. **▲ / ▼** zeigen, ob ein Produkt vorher billiger oder teurer war.

Die Karte spricht Deutsch, Englisch, Französisch, Spanisch, Italienisch und Polnisch und richtet sich nach der Sprache
von Home Assistant.

## Optionen

Jede Option mit Standardwert und Beispielen steht im [README der Karte](https://github.com/m3m0rex/ha_smartdiscounts-card/blob/main/README.de.md)
– dort wird sie mit jedem Release aktuell gehalten. Am häufigsten gebraucht: `list`, `sources`, `match`, `list_view`,
`all_view`, `use_bonus`, `watch`, `notify`.

## Eigene Sensoren: alle Felder von `map:`

Gängige Feldnamen erkennt die Karte selbst. Für alles andere ordnest du die Felder zu: links das Feld der Karte, rechts
das Feld deines Sensors. Nur `name` und `price` sind Pflicht; ein Punkt greift in verschachtelte Daten
(`images.0.url`).

| Feld | Bedeutung | Automatisch erkannt als |
|---|---|---|
| `name` | Produktname (**Pflicht**) | `product`, `title`, `name`, `product_name`, `description` |
| `price` | Angebotspreis (**Pflicht**) | `price`, `new_price`, `discount_price`, `offer_price`, `sale_price`, `price_euro`, `current_price` |
| `old_price` | alter Preis, durchgestrichen | `old_price`, `regular_price`, `original_price`, `was_price` |
| `discount` | Rabatt, z. B. „-44%“ | `discount`, `discount_percent`, `savings` |
| `unit` | Grundpreis als Text, z. B. „1 kg = 5,16 €“ | `price_per_unit`, `base_price`, `unit_price` |
| `image` | Adresse des Bildes | `picture_link`, `image_url`, `image`, `picture`, `img`, `thumbnail` |
| `until` | gültig bis (`JJJJ-MM-TT`) | `valid_until`, `end_date`, `valid_to`, `until` |
| `category` | Kategorie für den Filter | `category`, `categories`, `group` |
| `brand` | Marke (durchsuchbar) | `brand`, `manufacturer` |
| `store` | Markt dieses einen Angebots | `store`, `market`, `retailer`, `advertiser` |

```yaml
type: custom:smartdiscounts-card
list: todo.einkauf
sources:
  - auto
  - entity: sensor.mein_markt
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

## Merkliste und Benachrichtigungen

**Mit SmartLists** hat jeder Benutzer von Home Assistant eigene Merklisten, gespeichert in Home Assistant (siehe
[Angebote und Preise](DE-Angebote-und-Preise)): in jedem Browser und auf jedem Gerät gleich, weitere Listen mit „Neue
Merkliste“, und Home Assistant meldet neue Angebote auch ohne geöffnetes Dashboard. `watch_list:` wird dann nicht
benutzt – ist noch eine eingetragen, bietet die Karte an, ihre offenen Einträge einmal zu übernehmen.

**Ohne SmartLists** kommt die Merkliste aus `watch:` in der Konfiguration, aus einer To-do-Liste (`watch_list:`, in der
Karte bearbeitbar und auf allen Geräten gleich) oder – ohne beides – aus dem, was du im Reiter einträgst, nur in diesem
Browser gespeichert. Mit `notify: true` legt die Karte eine Benachrichtigung in Home Assistant an, wenn ein gemerktes
Produkt neu im Angebot ist. **Die Prüfung läuft in der Karte**, gemeldet wird also, solange ein Dashboard mit der Karte
offen ist (z. B. ein Wand-Tablet).

## Zusammen mit SmartLists

- Ein gewähltes Angebot erscheint als **Badge am Artikel** mit Markt, Preis und „gültig bis“.
- Die Einkaufsliste zeigt einen 🏷️-Hinweis an Artikeln, die im Angebot sind.
- Abgelaufene Angebote werden in beiden Karten angezeigt und mit einem Tipp entfernt.

## Fragen

**Kein Rabatt zu sehen?** Nicht jeder Sensor liefert einen alten Preis – dann zeigt die Karte Preis und Grundpreis.

**„Butter“ findet „Butterkeks“?** `match: word` verhindert das; `exact` ist noch strenger.

**Ein Markt fehlt?** Prüfe, ob der Sensor eine Liste in einem der Attribute `discounts`, `offers`, `deals`, `items`,
`results` oder `products` hat – sonst nenne es mit `attribute:`.
