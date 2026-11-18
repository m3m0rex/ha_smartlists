# Fehler-Kennungen

SmartLists gibt jedem harten Fehler eine kurze Kennung (`SL-…`). Sie steht in der Meldung und wird bei
**Fehler melden** vorausgefüllt – so sagt ein Bericht genau, was passiert ist.

Erwartbare Fälle haben keine Kennung und stehen hier nicht: keine Berechtigung für eine Aktion, eine Liste, die
inzwischen gelöscht wurde, ein Dienst, der gerade nicht erreichbar ist. Dafür gibt es eine normale Meldung, die
sagt, was zu tun ist.

## Wo man sie findet

- **Einstellungen der Karte → Info → Probleme** (Admins): alles, was seit dem letzten Start von Home Assistant
  festgehalten wurde, mit Kennung, Zeitpunkt und Anzahl. Je Eintrag gibt es **Fehler melden** und **Erledigt**.
- **Benachrichtigungen von Home Assistant**: manche Fehler melden sich zusätzlich dort, mit der Kennung im Titel.
- **Protokoll von Home Assistant**: nach `SmartLists SL-` suchen.

Die Liste unter *Probleme* liegt nur im Arbeitsspeicher. Nach einem Neustart ist sie leer; ein Fehler, der weiter
besteht, wird erneut festgehalten.

## Die Kennungen

| Kennung | Was passiert ist | Was zu tun ist |
| --- | --- | --- |
| `SL-STORE-01` | Dateien ließen sich beim Update auf 4.0.0-beta.12 oder neuer nicht nach `.storage/smartlists/` umziehen. Die in der Meldung genannten Dateien liegen weiter am alten Ort, ihre Daten fehlen bis dahin in SmartLists. | Home Assistant neu starten – der Umzug wird bei jedem Start erneut versucht. Bleibt es dabei: prüfen, ob der Ordner `.storage` beschreibbar und die genannte Datei gültiges JSON ist. Eine Kopie der alten Dateien liegt unter `.storage/smartlists/backups/integration/before-move/`. |
| `SL-STORE-02` | Eine Speicherdatei ließ sich nicht lesen. | Die Datei aus einer Home-Assistant-Sicherung zurückholen oder beim erneuten Einrichten eine SmartLists-Sicherung wiederherstellen. |
| `SL-BACKUP-01` | Eine Sicherung ließ sich nicht schreiben (von Hand oder beim Entfernen der Integration). | Freien Speicher prüfen und ob `.storage/smartlists/backups/` beschreibbar ist, dann die Sicherung unter *Info → Sicherung* erneut anlegen. |
| `SL-BACKUP-02` | Eine Sicherung ließ sich nicht wiederherstellen. | Prüfen, ob die Datei unter `.storage/smartlists/backups/integration/` vollständig ist; die nächstältere versuchen. |
| `SL-CAL-01` | Der Kalender-Termin eines Eintrags ließ sich nach dem Abhaken nicht entfernen – der Kalender hat zehn Minuten lang nicht geantwortet oder erlaubt kein Löschen. | Den Termin im Kalender von Hand löschen. Passiert es bei jedem Eintrag, ist der Kalender für Home Assistant nur lesbar. |
| `SL-NOTIFY-01` | Eine Benachrichtigung ließ sich an eines der gewählten Ziele nicht zustellen. | Das Ziel unter *Benachrichtigungen* prüfen – das Gerät oder der Dienst existiert vielleicht nicht mehr. |
| `SL-TIMER-01` | Eine Prüfung im Hintergrund (Erinnerungen, Kalender) ist fehlgeschlagen. | Einmalig meist harmlos; wiederholt es sich, bitte melden. |
| `SL-WS-01` | Ein Befehl der Karte oder der App ist unerwartet gescheitert – ein Fehler in SmartLists. Die Einzelheiten nennen den Befehl und die Art des Fehlers, nie den Inhalt deiner Listen. | Bitte melden. |
| `SL-CARD-01` | Die Karte konnte eine Liste nicht zeichnen – ein Fehler in der Karte oder Daten, mit denen sie nicht gerechnet hat. Statt leer zu bleiben, zeigt sie einen Hinweis mit **Neu laden** und **Fehler melden**. | Neu laden. Kommt es wieder, bitte melden; in der Konsole des Browsers (F12) steht der ganze Fehler. |

## Was ein Bericht enthält

**Fehler melden** fragt, wo der Fehler aufgetreten ist, und öffnet dann einen neuen Eintrag auf GitHub (oder kopiert
den Text). Darin stehen die Versionen von SmartLists und Home Assistant, der Ort, der Browser oder die App, die
Sprache und die Fehler-Kennung.

Die technischen Einzelheiten eines Fehlers (zum Beispiel die Kennung eines Kalenders) können Namen von Listen oder
Entitäten enthalten. Sie kommen nur in den Text, wenn du in diesem Bericht den Haken dafür setzt; der Haken ist jedes
Mal aus. Namen von Listen, Einträgen, Notizen, Benutzern, Adressen und Passwörter gehören nie zu einem Bericht.

Von Home Assistant aus wird nichts verschickt: Der Bericht öffnet sich auf GitHub, und öffentlich wird er erst,
wenn du ihn dort abschickst.

## Kennungen der App HA SmartLists Go

Die App nutzt dasselbe Muster. Wo die Bedeutung dieselbe ist wie in der Integration, ist es auch die Kennung.

| Kennung | Bedeutung |
| --- | --- |
| SL-WS-01 | Home Assistant hat eine Änderung aus der App abgelehnt (z. B. fehlendes Recht) |
| SL-CONN-01 | Home Assistant war nicht erreichbar |
| SL-CONN-02 | Das Zertifikat von Home Assistant wurde nicht angenommen |
| SL-CONN-03 | Es ist keine Adresse von Home Assistant eingetragen |
| SL-AUTH-01 | Die Anmeldung ist abgelaufen – neu anmelden (es geht nichts verloren) |
| SL-AUTH-02 | Die Anmeldung wurde abgelehnt |
| SL-AUTH-03 | Die Anmeldung wurde abgebrochen |
| SL-SYNC-01 | Ein Eintrag wurde auf dem Smartphone und in Home Assistant verschieden geändert – die App fragt, welcher Stand gilt |
| SL-APP-01 | Die App ist auf einen unerwarteten Fehler gestoßen |
| SL-APP-02 | Ein anderer, unbekannter Fehler |
