# Angebote und Preise

🇬🇧 [English version](Offers-and-prices)

## So entsteht der Preis eines Artikels

Die erste Quelle mit Preis gewinnt:

1. **Angebot** – von der App oder der [Angebots-Karte](DE-Angebots-Karte) angehängt. Es gilt für den ganzen Artikel,
   bis es abläuft.
2. **Preis im Text einer anderen Quelle** („… - 0,99 €“) – je Stück.
3. **Eigener Preis** – im Artikel eingetragen oder beim Hinzufügen getippt (`Milch 2 l 2,38 €` merkt 1,19 je Liter).
4. **Zuletzt bezahlt** (mit ~ gekennzeichnet) – beim letzten Abhaken gebucht.

In der Liste steht Preis × Menge; beim Abhaken wird der Betrag als Ausgabe gebucht (pro Monat und Markt).

## Gemerkte Preise und Preis-Verlauf

Unter *Einstellungen → Preise & Währung*:

- **Gemerkten Preis automatisch eintragen** (Standard: an): Kommt ein Artikel wieder auf die Liste, steht sein letzter
  Preis dabei. Ausgeschaltet werden Preise nur im Verlauf geführt – ein Artikel zeigt dann ein Angebot oder den Preis,
  den du für genau diesen Eintrag getippt hast.
- Ein getippter Preis bleibt immer an dem Eintrag, für den er getippt wurde.

Der **Preis-Verlauf** steht im Menü des Artikels unter *Verlauf*: eigene Preise und beim Abhaken Bezahltes mit Markt
und Datum (die letzten zwölf Änderungen), dazu eine kleine Kurve und der günstigste Preis bisher.

## Währung

*Einstellungen → Preise & Währung → Währung* gilt für Preise, Summe und Ausgaben aller Benutzer. Die Schreibweisen der
gewählten Währung werden beim Eintippen erkannt, z. B. `CHF 2.50`, `2,50 Fr.` oder `£1.20`.

Für eine Währung, die nicht in der Liste steht, wähle **Eigenes Symbol …** und gib bis zu sechs Zeichen ein (z. B. `₺`,
`Rp`). Es steht hinter dem Betrag und wird beim Eintippen als Preis erkannt.

## Merkliste

Auf der Merkliste stehen Produkte, bei denen du auf ein Angebot wartest. **Jeder Benutzer von Home Assistant hat eigene
Merklisten** – eine Datei je Benutzer (`.storage/smartlists/watch/<Benutzer>`), in jedem Browser und auf jedem Gerät
gleich; andere Benutzer sehen sie nie. Hinzufügen: im Menü eines Artikels (**Auf die Merkliste**), im Reiter ⭐ der
[Angebots-Karte](DE-Angebots-Karte) oder in der App; entfernen dort oder unter *Einstellungen → Preise & Währung →
Merkliste*. Weitere Merklisten legt jeder in der Karte an („Neue Merkliste“), ohne Admin-Rechte; „Alle Merklisten“ zeigt
alles des Benutzers zusammen.

Ist **Benachrichtigen, wenn etwas davon im Angebot ist** eingeschaltet, prüft Home Assistant die Angebots-Sensoren alle
30 Minuten – auch ohne geöffnetes Dashboard – und meldet jedes neue Angebot einmal. Unter **Senden an** wählt jeder
Benutzer seine eigenen Ziele: die App auf Smartphones und Tablets oder jeden anderen notify-Dienst. Das Ziel „In Home
Assistant“ sieht der ganze Haushalt, deshalb können es nur Admins wählen.

## Angebote in der Einkaufsliste

Mit Angebots-Sensoren in Home Assistant zeigt die Listen-Karte einen **🏷️-Hinweis** an Artikeln, die im Angebot sind.
Ein Tipp öffnet die Angebote; die Auswahl hängt Markt, Preis und Gültigkeit an den Artikel. Artikel mit `@Markt`
zeigen nur Angebote dieses Markts. Je Karte abschaltbar mit `show_offer_hints: false`.

Kommt ein Angebot aus der **Vorschau der nächsten Woche**, steht am Artikel „⏳ gilt erst ab 23.11.“ statt „bis …“;
am Starttag verschwindet der Hinweis von selbst. Sensoren mit „preview“, „vorschau“ oder „next_week“ im Namen
zählen als Vorschau. Die Merkliste meldet solche Angebote erst, wenn sie gelten.

## Abgelaufene Angebote

Ist ein an einen Artikel gehängtes Angebot abgelaufen, zeigen beide Karten einen Hinweis mit **Entfernen** und
**Später**. „Entfernen“ nimmt Markt, Preis und Gültigkeit von den Einträgen – die Einträge und ihre Notizen bleiben.
