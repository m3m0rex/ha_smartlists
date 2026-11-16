# Neu in 4.0

🇬🇧 [English version](New-in-4.0)

Für alle, die von 3.9 kommen. 4.0 erscheint zuerst als **Beta**: in HACS SmartLists öffnen → ⋮ → *Erneut
herunterladen* und **„Beta-Versionen anzeigen“** einschalten. Die vollständige Liste steht im
[Changelog](https://github.com/m3m0rex/ha_smartlists/blob/main/CHANGELOG.md).

## Was anders aussieht

- **Anzahl vor, Größe hinter dem Namen.** „2ד steht vor dem Namen, „1 l“ dahinter – nicht mehr in Spalten rechts.
  Schreibweisen ohne Leerzeichen wie `Milch 1l`, `2,5kg` oder `4x 150g` werden erkannt, und „2x“ zählt an jeder Stelle
  als Anzahl (`Milch 2l 2x`). Soll es Text bleiben, setze es in Anführungszeichen: `Waschmittel "2x"`.
- **Getönte Kategorien.** Jede Kategorie hat ihre Farbe und lässt sich einklappen, ebenso „Häufig gekauft“.
- **Badges unter dem Namen.** Markt, Schlagwort, Person, Preis und Notiz stehen in einer Zeile; die Reihenfolge ist in
  den Einstellungen änderbar.
- **Symbole statt Wörter** in der Kopfzeile: 🔗 kombinierte Liste, 🔒 privat, 👥 geteilt. Auf schmalen Karten steht
  der Titel in einer eigenen Zeile, die Symbole in einer Reihe darunter. Der Titel lässt sich ausblenden
  (`show_title: false`).
- **„Einkauf beendet“** erscheint standardmäßig nur im Einkaufsmodus; sonst steht es im ⋯-Menü.
- **Die geteilte Seite** (Link / QR-Code) hat dasselbe Design.

## Was neu ist

| | |
|---|---|
| 🏷️ **Angebots-Karte** | `custom:smartdiscounts-card` zeigt Supermarkt-Angebote, abgeglichen mit deiner Liste – siehe [Angebots-Karte](DE-Angebots-Karte). |
| 🏷️ **Angebote in der Liste** | Hinweis an Artikeln, die im Angebot sind, und eine Meldung bei abgelaufenen Angeboten – siehe [Angebote und Preise](DE-Angebote-und-Preise). |
| ⭐ **Merkliste** | Produkte, bei denen du auf ein Angebot wartest; Home Assistant meldet neue Angebote auch ohne geöffnetes Dashboard. |
| 💱 **Währung** | Währung des Haushalts wählbar, auch ein eigenes Symbol. |
| 📈 **Preis-Verlauf** | Was ein Artikel wann und wo gekostet hat, mit kleiner Kurve; automatisches Eintragen des letzten Preises abschaltbar. |
| ✏️ **Teilen-Links bearbeiten** | Rechte, Laufzeit und Passwort nachträglich ändern – der Link bleibt. |
| 🧾 **Vorlagen** | Schneller anlegen: Vorschläge aus „Häufig gekauft“, aus Erledigtem, eingefügter Text wird aufgeräumt. |
| ⚙️ **Einstellungen** | Neu gegliedert, mit „Info“ (Einrichtung erneut starten) und besserer Ansicht am Smartphone. |

## Muss ich etwas ändern?

Nein. Listen, Einstellungen, gelernte Kategorien und Teilen-Links bleiben erhalten. Neue Optionen der Karte
(`show_title`, `show_offer_hints`, `shop_finish`) haben Standardwerte, die zum neuen Design passen.

Wenn du bisher eine andere Angebots-Karte genutzt hast: Die mitgelieferte kann sie ersetzen, du kannst aber auch beide
behalten.
