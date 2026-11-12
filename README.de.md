<p align="center"><img src="https://raw.githubusercontent.com/m3m0rex/ha_smartlists_hacs/main/custom_components/smartlists/brand/logo@2x.png" alt="SmartLists" height="96"></p>

# SmartLists – kombinierte To-do-Listen für Home Assistant

🇬🇧 [English version](README.md)

Eigenständige Home-Assistant-Integration (HACS), unabhängig von der HA-SmartLists-App.
Sie bringt die wichtigste Funktion der App direkt in Home Assistant: **mehrere To-do-Listen zu einer
gemeinsamen Liste zusammenführen** – z.B. die Einkaufslisten von Anna und Max zu einer Liste „Großeinkauf".

Die kombinierte Liste ist eine ganz normale To-do-Entität (`todo.grosseinkauf`). Sie funktioniert in der
To-do-Ansicht, auf Dashboards, mit Sprachassistenten, in Automationen und auch in der HA-SmartLists-App.

## Funktionen

- Beliebige To-do-Listen kombinieren: Shopping List, Local To-do, Google Tasks, Bring!, CalDAV und andere.
- **Abhaken, Umbenennen, Beschreibung ändern und Löschen** wirken direkt in der jeweiligen Ursprungsliste.
- **Neue Artikel** landen in einer wählbaren Standard-Liste.
- **Modus „Nur diese kombinierte Liste"**: Häkchen bleiben lokal in der kombinierten Liste, die
  Ursprungslisten werden nicht verändert. Das entspricht „Nur lokal" in der App.
- **Fremde Listen**: Artikel aus Listen anderer Personen kannst du nur abhaken, aber nicht
  umbenennen oder löschen.
- **Herkunft als Person**: Artikel aus `todo.peter` bekommen in Karte und Seite das Badge 👤 Peter
  (wie `*Peter`); Füllwörter wie „Einkaufsliste“ werden weggelassen. Pro Liste abschaltbar.
- **Herkunft anzeigen**: `Milch · Anna` oder `[Anna] Milch`; die Anzeige ist auch abschaltbar.
- **Sortierung**: nach Liste, nach Einkaufs-Kategorie, offene zuerst oder alphabetisch.
  Die Kategorie-Erkennung nutzt dasselbe Stichwort-Paket wie die App mit über 6000 Begriffen.
- Attribute für Dashboards und Automationen: `open_items`, `completed_items`, `open_by_category`,
  `source_lists`, `unavailable_sources`.
- „Erledigte entfernen" (`todo.remove_completed_items`) funktioniert über alle Quell-Listen hinweg.
- Aktualisiert sich automatisch, sobald sich eine Quell-Liste ändert.

## Gedächtnis für den ganzen Haushalt (neu in 1.1)

Gilt für alle Listen und alle HA-Benutzer, gespeichert in `.storage/smartlists.learning`:

- **Kategorien merken:** Wird ein Artikel einmal von Hand einer Kategorie zugeordnet, gilt das künftig
  auch für ähnliche Artikel („Hafermilch“ → Kühlung trifft später „Hafermilch Barista“). Reihenfolge wie
  in der App: gemerkt > gelernt > eingebautes Paket > Sonstiges. Die Sortierung „nach Kategorie“ und
  das Attribut `open_by_category` der kombinierten Listen nutzen das bereits.
- **Verlauf & Vorschläge:** Häufig und zuletzt gekaufte Artikel, Artikel der Liste und 1049 Produkte aus
  dem Paket der App; dazu die zuletzt benutzte bzw. übliche Einheit.
- **Namenskonvention:** `@REWE` wird zum Markt-Badge (bekannte Märkte in Markenfarbe), `*Anna` zur Person,
  `#bio` zum Schlagwort. Welches Zeichen was bedeutet, stellen Admins in der Karte ein (Zahnrad).
  Die Tags bleiben im Artikelnamen stehen – andere Oberflächen sehen sie also weiter als Text.
- **Verbundene Geräte:** jedes Handy mit der App erscheint unter *Konfigurieren → Verbundene Geräte* und als HA-Gerät mit den Sensoren *Zuletzt gesehen* und *App-Version*.
- **Bedienung:** Standard für alle (Admin) → je Benutzer abweichend → optional je Gerät abweichend.

Mengen stehen wie in der App im Namen („Milch 2 l @REWE“). Beim Tippen wird auch „2 kg Äpfel“ erkannt.

## Seite „SmartLists“ in der Seitenleiste

Nach dem Einrichten gibt es links in HA den Eintrag **SmartLists**: alle To-do-Listen (kombinierte
zuerst) als Umschalter oben, darunter die Liste mit Badges, Kategorien, Stepper, Suche und
Einkaufsmodus – ohne dass man ein Dashboard bauen muss. Die eingebaute To-do-Seite von HA zeigt
Artikel nur als Text („Milch 2 l @REWE“); Badges gibt es nur auf dieser Seite und in der Karte.
Ausblenden lässt sich der Eintrag wie jeder andere über *Seitenleiste bearbeiten*.

## Lovelace-Karte `custom:smartlists-card`

Wird von der Integration automatisch geladen (keine Dashboard-Ressource nötig).

```yaml
type: custom:smartlists-card
entity: todo.grosseinkauf
sort: category        # category | alpha | added | list
```

Suche (Lupe; findet auch über Markt, Person, Notiz, Kategorie, „apfel“ findet „Äpfel“), Mengen-Stepper
− +, ein Eingabefeld mit Live-Vorschau (Menge, Kategorie, Badges) und Vorschlägen (↑/↓, Tab, Enter),
„Häufig gekauft“, Kategorie per Klick ändern (wird gemerkt), feste Spalten Name | Menge | Einheit,
Sortierung (Kategorie, A–Z, Hinzugefügt, nach Liste), langes Drücken → Menü (Bearbeiten, Verschieben,
Kopieren, Kategorie, Löschen), Einkaufsmodus (Bildschirm an, Erledigte ausblenden, große Zeilen, Zeile
antippen), ↶ für die letzte Änderung, Import aus einer HA-To-do-Liste oder als Text.

Alle Darstellungs-Optionen gibt es im visuellen Karten-Editor, aufgeteilt in *Kopfzeile*, *Eingabe*,
*Liste*, *Erledigte* und *Einkaufsmodus* (z.B. Suche oder Stepper ausblenden, kompakte Zeilen, ohne
Kategorie-Überschriften, maximale Höhe, im Einkaufsmodus starten). Die persönliche Bedienung (Geste,
Menü, Verhalten im Einkaufsmodus) bleibt pro Benutzer im Zahnrad der Karte.

Ein klickbares Mockup mit simulierten Daten liegt unter `mockup/card-mockup.html`
(neu bauen: `python mockup/build_mockup.py`).

### Stand

Die Karte funktioniert in HA mit kombinierten SmartLists-Listen **und jeder normalen To-do-Liste**
(Einkaufsliste, Local To-do, Google Tasks, Bring!, …). Erlaubt ist, was die Liste selbst kann; bei
kombinierten Listen sind Artikel aus fremden Quellen nur abhakbar. Änderungen von anderen Geräten
erscheinen live.

Noch offen: eigene Listen direkt in SmartLists und Freigaben pro Benutzer (A gibt B eine Liste mit
bestimmten Rechten frei).

### Schnittstelle für die App

Die HA-SmartLists-App kann sich mit der Integration koppeln (`smartlists/info`) und zeigt dann
dieselben Badges, Kategorien und Vorschläge an. Alle Befehle, Antworten und das Textformat:
[docs/app-api.md](docs/app-api.md).

Das Kategorie-Paket wird aus dem der App erzeugt: `python scripts/build_categories.py` (sucht die App im Nachbarordner `shopping_manager_app`).

## Installation

### Über HACS (benutzerdefiniertes Repository)

1. HACS → ⋮ → *Benutzerdefinierte Repositories*
2. URL `https://github.com/m3m0rex/ha_smartlists_hacs`, Typ **Integration** → Hinzufügen
3. „SmartLists" herunterladen und Home Assistant neu starten.

### Manuell

Ordner `custom_components/smartlists` nach `/config/custom_components/smartlists` kopieren und Home Assistant neu starten.

## Einrichtung

*Einstellungen → Geräte & Dienste → Integrationen → Integration hinzufügen → **SmartLists***

SmartLists wird einmal eingerichtet. Danach ist die Lovelace-Karte sofort verfügbar, und bei der
Integration gibt es:

- **„Kombinierte Liste hinzufügen“** – Name, Listen, Standard-Liste, Modus, Herkunftsanzeige, Sortierung,
  fremde Listen. Jede Liste lässt sich später über ⋮ → *Neu konfigurieren* ändern oder löschen.
- **„Konfigurieren“** – Einstellungen für den ganzen Haushalt:
  - *Namenskonvention:* welches Zeichen Markt, Person bzw. Schlagwort einleitet (oder aus)
  - *Bedienung – Standard für alle:* Geste fürs Artikel-Menü, Menü-Einträge, Einkaufsmodus
  - *Gemerkte Kategorien & Verlauf:* einzelne Zuordnungen vergessen, Verlauf löschen

Persönliche Abweichungen (pro Benutzer oder nur auf einem Gerät) stellt jeder selbst im Zahnrad der
Karte ein; dort können Admins auch die Haushalts-Einstellungen ändern – beides zeigt dieselben Werte.

**Update von 1.1:** Bisherige SmartLists-Helfer werden beim ersten Start automatisch zu Listen unter
dem einen Eintrag „SmartLists“ umgezogen. entity_id, Dashboards, Automationen und lokale Häkchen
bleiben erhalten.

## Hinweise

- Kombinierte Listen lassen sich nicht ineinander verschachteln (Schutz vor Endlosschleifen).
- Im Modus „Nur diese kombinierte Liste" werden die lokalen Häkchen in Home Assistant gespeichert
  (`.storage/smartlists.<id>`) und beim Löschen der Integration mit entfernt.
- Artikel ohne eindeutige ID (sehr alte Integrationen) werden übersprungen.
- Voraussetzung: Home Assistant 2025.3 oder neuer (Unter-Einträge für die Listen).

## Lizenz

MIT – siehe [LICENSE](LICENSE). Die Android-App HA SmartLists ist ein eigenes Projekt mit eigener Lizenz.

## Aufbau

```
hacs.json
custom_components/smartlists/
  manifest.json      Metadaten (Typ: Dienst, einmal einrichtbar)
  __init__.py        Einrichten/Entladen, Karte laden, Umzug von 1.1
  config_flow.py     Einrichtung, kombinierte Listen (Unter-Einträge), Konfigurieren-Menü
  todo.py            die kombinierte To-do-Entität
  categories.py/json Kategorie-Paket (aus der App erzeugt, mit Produkten + Einheiten)
  itemtext.py        Artikeltext zerlegen: Menge, Einheit, Tags (@REWE …)
  learning.py        Gedächtnis: Kategorien, Verlauf, Vorschläge, Tag-Regeln, Bedienung
  lists.py           Listen lesen/ändern (kombinierte und normale To-do-Listen)
  websocket.py       Befehle für Karte und App (siehe docs/app-api.md)
  www/smartlists-card.js   Lovelace-Karte
  strings.json, translations/   Texte (Deutsch/Englisch)
scripts/build_categories.py     categories.json aus dem App-Paket erzeugen
mockup/                         klickbares Mockup der Karte
```
