# Error codes

SmartLists gives every hard error a short code (`SL-…`). The code is shown in the message and filled in when you
use **Report a problem**, so a report says exactly what happened.

Expected situations have no code and are not listed here – no permission for an action, a list that was deleted in
the meantime, a service that cannot be reached right now. Those show a normal message that says what to do.

## Where to find them

- **Settings of the card → Info → Problems** (admins): everything recorded since the last start of Home Assistant,
  with code, time and how often it happened. Each entry has **Report a problem** and **Done**.
- **Notifications of Home Assistant**: some errors also raise a notification with the code in its title.
- **Log of Home Assistant**: search for `SmartLists SL-`.

The list under *Problems* is kept in memory only. After a restart it is empty; an error that still exists is
recorded again.

## The codes

| Code | What happened | What to do |
| --- | --- | --- |
| `SL-STORE-01` | Files could not be moved to `.storage/smartlists/` when updating to 4.0.0-beta.12 or newer. The files named in the message are still in the old place, and their data is missing in SmartLists until they are moved. | Restart Home Assistant – the move is tried again on every start. If it keeps failing, check that the folder `.storage` is writable and that the named file is valid JSON. A copy of the old files is in `.storage/smartlists/backups/integration/before-move/`. |
| `SL-STORE-02` | A storage file could not be read. | Restore the file from a backup of Home Assistant, or restore a SmartLists backup when setting the integration up again. |
| `SL-BACKUP-01` | A backup could not be written (by hand, or when the integration was removed). | Check free space and that `.storage/smartlists/backups/` is writable, then create the backup again under *Info → Backup*. |
| `SL-BACKUP-02` | A backup could not be restored. | Check that the file under `.storage/smartlists/backups/integration/` is complete; try the next older one. |
| `SL-CAL-01` | The calendar event of an item could not be removed after the item was ticked – the calendar did not answer for ten minutes or does not allow deleting. | Delete the event in the calendar by hand. If it happens with every item, the calendar is read-only for Home Assistant. |
| `SL-NOTIFY-01` | A notification could not be delivered to one of the chosen targets. | Check the target under *Notifications* – the device or service may no longer exist. |
| `SL-TIMER-01` | A check that runs in the background (reminders, calendar) failed. | Usually harmless once; if it repeats, report it. |
| `SL-WS-01` | A command of the card or the app failed unexpectedly – a bug in SmartLists. The detail names the command and the kind of error, never the content of your lists. | Report it. |
| `SL-CARD-01` | The card could not draw a list – a bug in the card, or data it did not expect. The card shows a notice with **Reload** and **Report a problem** instead of staying empty. | Reload. If it comes back, report it; the browser console (F12) has the full error. |

## What a report contains

**Report a problem** first asks where the problem occurred and then shows what is sent, in plain words and – on
request – as the exact text. It contains the versions of SmartLists and Home Assistant, the place, the browser or
app, the language and the error code.

The technical detail of an error (for example the id of a calendar) may contain names of lists or entities. It is
only included when you tick the box for it in that report; the box is off every time. Names of lists, items, notes,
users, addresses and passwords are never part of a report.

Nothing is sent from Home Assistant: the report opens as a new issue on GitHub, and it only becomes public when you
submit it there.
