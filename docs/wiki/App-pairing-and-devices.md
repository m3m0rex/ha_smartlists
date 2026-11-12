# App pairing and devices

The **HA SmartLists** Android app pairs with the integration automatically when it can reach it:
*App → Settings → Connection → SmartLists integration* shows "Paired · version …". Tap *Sync* to sync
now; otherwise the app checks at most every 15 minutes while refreshing.

When paired, the app:

- shows the same badges, naming convention, categories and offers,
- shows combined lists from the integration as combined lists (managed in HA),
- syncs remembered categories in both directions, including deletions,
- registers itself as a **device**.

## Connected devices

*Configure → Connected devices* lists every phone with user, model, app and Android version and last
seen (⚠️ after 7 days). Each phone is also an HA device under SmartLists with the sensors
**Last seen** (usable in automations) and **App version**.

Removing a device only removes it from the list; it reappears on the next sync. To revoke access delete
the phone's token under *Profile → Security → Long-lived access tokens*. Use one token per person so
everyone gets their own settings.

Interface details for developers: [`docs/app-api.md`](https://github.com/m3m0rex/ha_smartlists_hacs/blob/main/docs/app-api.md).
