/* SmartLists Karte – gehört zur HACS-Integration "SmartLists" (wird automatisch geladen).
 *   type: custom:smartlists-card
 *   entity: todo.meine_liste
 *
 * Eingabe in EINEM Feld, z.B. "2 kg Äpfel @REWE *Anna #bio":
 *   Menge/Einheit werden erkannt, "@REWE" wird zum Markt-Badge, "*Anna" zur Person, "#bio" zum Schlagwort.
 *   Welches Zeichen was bedeutet, lässt sich in den Karten-Einstellungen (Zahnrad) ändern – gilt für
 *   den ganzen Haushalt, weil die Regeln in der Integration gespeichert werden.
 * Kategorien werden gemerkt: einmal "Hafermilch → Kühlung" gewählt, gilt das künftig auch für
 * "Hafermilch Barista". Vorschläge kommen aus dem Verlauf, der Liste und dem Produkt-Paket der App.
 * Keine externen Abhängigkeiten; nutzt die Theme-Variablen von Home Assistant. */

const ICON = {
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  pencil: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
  trash: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  sweep: "M15,16H19V18H15V16M15,8H22V10H15V8M15,12H21V14H15V12M3,18A2,2 0 0,0 5,20H11A2,2 0 0,0 13,18V8H3V18M14,5H11L10,4H6L5,5H2V7H14V5Z",
  history: "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  list: "M3,4H7V8H3V4M9,5V7H21V5H9M3,10H7V14H3V10M9,11V13H21V11H9M3,16H7V20H3V16M9,17V19H21V17H9",
  gear: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  sort: "M18 21L14 17H17V7H14L18 3L22 7H19V17H22M2 19V17H12V19M2 13V11H9V13M2 7V5H6V7H2Z",
  cart: "M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z",
  move: "M14,18V15H10V11H14V8L19,13M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  tagIcon: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  undo: "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z",
  importIcon: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  minus: "M19,13H5V11H19V13Z",
  back: "M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z",
  close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  brain: "M21.33,12.91C21.42,14.46 20.71,15.95 19.44,16.86L20.21,18.35C20.44,18.8 20.47,19.33 20.27,19.8C20.08,20.27 19.69,20.64 19.21,20.8L18.42,21.05C18.25,21.11 18.06,21.14 17.88,21.14C17.37,21.14 16.89,20.91 16.56,20.5L14.44,18C13.55,17.85 12.71,17.47 12,16.9C11.5,17.05 11,17.13 10.5,17.13C9.62,17.13 8.74,16.86 8,16.34C7.47,16.5 6.93,16.57 6.38,16.56C5.59,16.57 4.81,16.41 4.08,16.11C2.65,15.47 1.7,14.07 1.65,12.5C1.57,11.78 1.69,11.05 2,10.39C1.71,9.64 1.68,8.82 1.93,8.06C2.3,7.11 3,6.32 3.87,5.82C4.45,4.13 6.08,3 7.87,3.12C9.47,1.62 11.92,1.46 13.7,2.75C14.12,2.64 14.56,2.58 15,2.58C16.36,2.55 17.65,3.15 18.5,4.22C20.54,4.75 22,6.57 22.08,8.69C22.13,9.8 21.83,10.89 21.22,11.82C21.29,12.18 21.33,12.54 21.33,12.91",
};

// Wird beim Release mit manifest.json hochgezählt; weicht sie von der Integration ab, ist die Karte im Browser-Cache veraltet
const CARD_VERSION = "1.7.2";
const SORT_MODES = ["category", "alpha", "added", "list"];
// Darstellung pro Karte (Lovelace-Editor). Persönliche Bedienung steht dagegen in UI_DEFAULTS.
const CARD_DEFAULTS = {
  sort: "category",
  show_header: true, show_count: true, show_search: true, show_sort: true, show_shopping: true,
  show_undo: true, show_import: true, show_settings: true,
  show_add: true, show_frequent: true,
  show_stepper: true, show_offer: true, show_tags: true, show_source: true, show_note: true, show_category_titles: true, compact: false,
  show_completed: true, collapse_completed: true,
  start_shopping: false,
};
const MENU_ACTIONS = ["rename", "move", "copy", "category", "delete"];
// Bedienung: Standard < Einstellung des HA-Benutzers (in der Integration gespeichert, gilt auf allen
// seinen Geräten) < optional abweichend nur für dieses Gerät (Browser-Speicher). Bewusst NICHT in der
// Dashboard-/Lovelace-Konfiguration, weil jeder Benutzer das für sich einstellen soll.
const UI_DEFAULTS = {
  press_gesture: "long", press_target: "row", press_result: "menu", menu_actions: MENU_ACTIONS, row_buttons: true,
  shop_hide_checked: true, shop_keep_awake: true, shop_large: true, shop_tap_row: true,
};
const UI_KEY = "smartlists-ui";
const LONG_PRESS_MS = 500;
const TEXTS = {
  de: {
    add_placeholder: "z. B. 2 kg Äpfel @REWE", note: "Notiz", save: "Speichern", cancel: "Abbrechen",
    done: "Erledigt", clear: "Erledigte entfernen", own: "Eigene Liste", combined: "Kombiniert", foreign: "Fremd",
    empty: "Nichts zu besorgen 🎉", no_add: "Hinzufügen ist für diese Liste gesperrt.", open: "offen",
    confirm_delete: "Artikel wirklich löschen?", confirm_clear: "Alle erledigten Artikel entfernen?",
    error: "Fehler", loading: "Lädt …", readonly: "Nur ansehen", delete: "Löschen", edit: "Bearbeiten",
    frequent: "Häufig gekauft", src_manual: "gemerkt", src_learned: "gelernt", src_pack: "automatisch", src_fallback: "unbekannt",
    unit_hint: "übliche Einheit", category: "Kategorie", settings: "Einstellungen", naming: "Namenskonvention",
    naming_help: "Zeichen vor einem Wort machen daraus ein Badge. Gilt für alle Listen und Geräte im Haushalt.",
    kind_store: "Markt", kind_person: "Person", kind_tag: "Schlagwort", add_rule: "Regel hinzufügen", example: "Beispiel",
    learned: "Gemerkte Kategorien", learned_help: "Entstehen, wenn du eine Kategorie von Hand wählst.", forget: "Vergessen",
    none_learned: "Noch nichts gemerkt.", saved: "Gespeichert", admin_only: "Nur Administratoren können das ändern.",
    in_list: "steht schon auf der Liste",
    card_version: "Karte", stale_card: "Die Karte ist veraltet – Seite neu laden (Strg+F5) bzw. in der App den Frontend-Cache leeren.", offer: "Angebot", offer_until: "bis", offer_expired: "abgelaufen seit",
    qty_less: "Menge verringern", qty_more: "Menge erhöhen", qty_changed: "Menge geändert",
    search: "Suchen", search_placeholder: "In der Liste suchen …", hits: "Treffer", no_hits: "Nichts gefunden für", add_this: "hinzufügen",
    imp: "Importieren", imp_ha: "Aus Home Assistant", imp_text: "Als Text", imp_source: "Liste",
    imp_done: "Erledigte mit übernehmen", imp_skip_dupes: "Schon vorhandene überspringen", imp_go: "Übernehmen",
    imp_text_help: "Eine Zeile pro Artikel. Aufzählungen, [ ] / [x] und Nummern werden erkannt, ebenso Mengen und Tags.",
    imp_preview: "Vorschau", imp_none: "Nichts zu übernehmen.", imp_count: "Artikel", imported: "importiert", imp_dupe: "vorhanden",
    imp_no_lists: "Keine anderen To-do-Listen in Home Assistant gefunden.",
    shop_on: "Einkaufsmodus starten", shop_off: "Einkaufsmodus beenden", in_cart: "im Wagen", undo: "Rückgängig", checked_off: "abgehakt", unchecked: "wieder offen",
    deleted: "gelöscht", removed: "erledigte entfernt", added: "hinzugefügt", changed: "geändert",
    m_rename: "Umbenennen / bearbeiten", m_move: "Verschieben nach …", m_copy: "Kopieren nach …", m_category: "Kategorie ändern", m_delete: "Löschen",
    moved: "verschoben nach", copied: "kopiert nach", no_targets: "Keine andere Liste, in die du schreiben darfst.",
    ui: "Bedienung", ui_help: "Jeder Benutzer stellt das für sich ein. Optional für einzelne Geräte abweichend.",
    scope_household: "Standard für alle", scope_user: "Für mich auf allen Geräten", scope_device: "Nur auf diesem Gerät",
    scope_help_household: "Gilt für jeden, der nichts Eigenes eingestellt hat.",
    scope_help_user: "Nur deine Abweichungen vom Standard werden gespeichert (markiert mit •). „Zurücksetzen“ = wieder Standard.",
    scope_help_device: "Gilt nur in diesem Browser bzw. auf diesem Handy. „Zurücksetzen“ = wieder deine Einstellung.",
    press_gesture: "Geste", g_long: "Lange drücken", g_double: "Doppelklick", g_right: "Rechtsklick", g_off: "Aus",
    press_target: "Wo", t_row: "Ganze Zeile", t_name: "Nur auf den Namen",
    press_result: "Was passiert", r_menu: "Menü öffnen", r_edit: "Direkt bearbeiten", r_delete: "Löschen (mit Nachfrage)",
    menu_actions: "Einträge im Menü", row_buttons: "Stift und Papierkorb in der Zeile zeigen",
    shop: "Einkaufsmodus", shop_hide_checked: "Abgehakte ausblenden", shop_keep_awake: "Bildschirm anlassen",
    shop_large: "Große Zeilen", shop_tap_row: "Ganze Zeile antippen zum Abhaken", reset: "Zurücksetzen",
    sort: "Sortierung", sort_category: "Kategorie", sort_alpha: "A–Z", sort_added: "Hinzugefügt", sort_list: "Nach Liste",
  },
  en: {
    add_placeholder: "e.g. 2 kg apples @REWE", note: "Note", save: "Save", cancel: "Cancel",
    done: "Done", clear: "Clear completed", own: "Own list", combined: "Combined", foreign: "Foreign",
    empty: "Nothing to buy 🎉", no_add: "Adding is disabled for this list.", open: "open",
    confirm_delete: "Really delete item?", confirm_clear: "Remove all completed items?",
    error: "Error", loading: "Loading …", readonly: "View only", delete: "Delete", edit: "Edit",
    frequent: "Frequently bought", src_manual: "remembered", src_learned: "learned", src_pack: "automatic", src_fallback: "unknown",
    unit_hint: "usual unit", category: "Category", settings: "Settings", naming: "Naming convention",
    naming_help: "A character in front of a word turns it into a badge. Applies to all lists and devices.",
    kind_store: "Store", kind_person: "Person", kind_tag: "Tag", add_rule: "Add rule", example: "Example",
    learned: "Remembered categories", learned_help: "Created when you pick a category manually.", forget: "Forget",
    none_learned: "Nothing remembered yet.", saved: "Saved", admin_only: "Only administrators can change this.",
    in_list: "already on the list",
    card_version: "card", stale_card: "This card is outdated – reload the page (Ctrl+F5) or clear the frontend cache in the app.", offer: "Offer", offer_until: "until", offer_expired: "expired",
    qty_less: "Decrease quantity", qty_more: "Increase quantity", qty_changed: "quantity changed",
    search: "Search", search_placeholder: "Search this list …", hits: "matches", no_hits: "Nothing found for", add_this: "add",
    imp: "Import", imp_ha: "From Home Assistant", imp_text: "As text", imp_source: "List",
    imp_done: "Include completed", imp_skip_dupes: "Skip items already on the list", imp_go: "Import",
    imp_text_help: "One item per line. Bullets, [ ] / [x] and numbers are recognised, as are quantities and tags.",
    imp_preview: "Preview", imp_none: "Nothing to import.", imp_count: "items", imported: "imported", imp_dupe: "exists",
    imp_no_lists: "No other to-do lists found in Home Assistant.",
    shop_on: "Start shopping mode", shop_off: "End shopping mode", in_cart: "in cart", undo: "Undo", checked_off: "checked", unchecked: "reopened",
    deleted: "deleted", removed: "completed removed", added: "added", changed: "changed",
    m_rename: "Rename / edit", m_move: "Move to …", m_copy: "Copy to …", m_category: "Change category", m_delete: "Delete",
    moved: "moved to", copied: "copied to", no_targets: "No other list you can write to.",
    ui: "Controls", ui_help: "Every user sets this for themselves. Optionally different per device.",
    scope_household: "Default for everyone", scope_user: "For me on all devices", scope_device: "Only on this device",
    scope_help_household: "Applies to everyone who hasn't set their own.",
    scope_help_user: "Only your differences from the default are saved (marked •). “Reset” = back to default.",
    scope_help_device: "Applies to this browser or phone only. “Reset” = back to your setting.",
    press_gesture: "Gesture", g_long: "Long press", g_double: "Double click", g_right: "Right click", g_off: "Off",
    press_target: "Where", t_row: "Whole row", t_name: "Name only",
    press_result: "Action", r_menu: "Open menu", r_edit: "Edit directly", r_delete: "Delete (with confirmation)",
    menu_actions: "Menu entries", row_buttons: "Show pencil and bin in the row",
    shop: "Shopping mode", shop_hide_checked: "Hide checked items", shop_keep_awake: "Keep screen on",
    shop_large: "Large rows", shop_tap_row: "Tap whole row to check", reset: "Reset",
    sort: "Sort", sort_category: "Category", sort_alpha: "A–Z", sort_added: "Added", sort_list: "By list",
  },
};

/* ------------------------------------------------------------------ */
/* Artikeltext – gleiche Regeln wie itemtext.py in der Integration     */
/* ------------------------------------------------------------------ */
const NUM = "[0-9]+(?:[.,][0-9]+)?";
const UNIT = "[a-zA-ZäöüÄÖÜß%°]+\\.?";
const RE_SUFFIX_UNIT = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})\\s+(${UNIT})$`);
const RE_SUFFIX_ONLY = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})$`);
const RE_PREFIX_QTY = new RegExp(`^(${NUM})\\s*(?:(${UNIT})\\s+)?(.+)$`);
const UNIT_WORDS = new Set(("stk stück st kg g gr l ml cl pck pk packung packungen fl flasche flaschen dose dosen becher " +
  "glas gläser tube bund netz beutel tüte kiste kasten rolle rollen scheiben pkg x").split(" "));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const num = (s) => Number(String(s).replace(",", "."));
const fmtQty = (q) => (Number.isInteger(q) ? String(q) : String(q).replace(".", ","));

function tagRegex(rules) {
  if (!rules || !rules.length) return null;
  const chars = rules.map((r) => escRe(r.prefix)).join("");
  return new RegExp(`(^|\\s)([${chars}])([\\p{L}\\p{N}_][\\p{L}\\p{N}_.\\-]*)`, "gu");
}
function storeInfo(value, stores) {
  const s = (stores || []).find((k) => k.value.toLowerCase() === value.toLowerCase());
  return s ? { label: s.value, color: s.color } : { label: value, color: null };
}
function splitTags(text, rules, stores) {
  const re = tagRegex(rules);
  if (!re) return [text.trim(), []];
  const kinds = Object.fromEntries(rules.map((r) => [r.prefix, r.kind]));
  const tags = [];
  const seen = new Set();
  for (const m of text.matchAll(re)) {
    const kind = kinds[m[2]];
    const value = m[3].replace(/[.\-]+$/, "");
    const key = `${kind}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const info = kind === "store" ? storeInfo(value, stores) : { label: value, color: null };
    tags.push({ kind, value, prefix: m[2], ...info });
  }
  return [text.replace(re, " ").split(/\s+/).filter(Boolean).join(" "), tags];
}
function parseText(text, rules, stores, typed = false) {
  const [rest, tags] = splitTags(text || "", rules, stores);
  let m;
  if ((m = rest.match(RE_SUFFIX_UNIT))) return { name: m[1].trim(), quantity: num(m[3]), unit: m[4], pack_count: m[2] ? +m[2] : null, tags };
  if ((m = rest.match(RE_SUFFIX_ONLY))) return { name: m[1].trim(), quantity: num(m[3]), unit: null, pack_count: m[2] ? +m[2] : null, tags };
  if (typed && (m = rest.match(RE_PREFIX_QTY))) {
    let [, q, unit, name] = m;
    name = name.trim();
    if (unit && !UNIT_WORDS.has(unit.replace(/\.$/, "").toLowerCase())) { name = `${unit} ${name}`.trim(); unit = null; }
    if (name) return { name, quantity: num(q), unit: unit ? unit.replace(/\.$/, "") : null, pack_count: null, tags };
  }
  return { name: rest, quantity: null, unit: null, pack_count: null, tags };
}
function encodeText(item, rules) {
  const parts = [item.name.trim()];
  if (item.quantity != null && !Number.isNaN(item.quantity)) {
    if (item.pack_count > 1) parts.push(`${item.pack_count}×`);
    parts.push(fmtQty(item.quantity));
    if (item.unit) parts.push(item.unit.trim());
  }
  const pre = Object.fromEntries((rules || []).map((r) => [r.kind, r.prefix]));
  for (const t of item.tags || []) {
    const p = pre[t.kind] || t.prefix;
    const v = String(t.value || "").trim().replace(/\s+/g, "-");
    if (p && v) parts.push(p + v);
  }
  return parts.filter(Boolean).join(" ");
}
function openTagQuery(text, rules) {
  if (!text || /\s$/.test(text)) return null;
  const last = text.split(/\s+/).pop() || "";
  const r = (rules || []).find((x) => last.startsWith(x.prefix));
  return r ? { kind: r.kind, partial: last.slice(1) } : null;
}
// Eingefügten Text in Zeilen zerlegen: Aufzählungen, Checkboxen und Nummern entfernen.
// "* Milch" ist eine Aufzählung (Leerzeichen danach), "*Anna" dagegen ein Tag.
function parseImportText(text) {
  const out = [];
  for (let line of String(text || "").split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    let checked = false;
    line = line.replace(/^(?:[-*•·–—+]|\d+[.)])\s+/, "");
    const box = line.match(/^(?:\[( |x|X)\]|([☐☑☒✓✔]))\s*/);
    if (box) { checked = box[1] ? box[1].toLowerCase() === "x" : box[2] !== "☐"; line = line.slice(box[0].length); }
    line = line.trim();
    if (line) out.push({ text: line, checked });
  }
  return out;
}
// Für die Suche: klein, ohne Akzente/Umlaut-Punkte ("Äpfel" → "apfel"), ß → ss
function searchKey(s) {
  return String(s || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Gegenstück zu itemtext.split_offer (Angebots-Zeile der App in der Notiz)
function parseOfferNote(note, stores) {
  const m = /[⚙\u2699]\ufe0f?\s*OFFER\s*:/i.exec(note || "");
  if (!m) return { note, offer: null };
  const clean = note.slice(0, m.index).trim();
  try {
    const j = JSON.parse(note.slice(m.index + m[0].length).trim());
    if (!j || !j.s) return { note: clean, offer: null };
    const k = (stores || []).find((x) => x.value.toLowerCase() === String(j.s).toLowerCase());
    const num = (v) => (v == null || v === "" ? null : Number(String(v).replace(",", ".").replace("€", "").trim()));
    return { note: clean, offer: { store: j.s, store_label: k ? k.value : j.s, color: k ? k.color : null, price: num(j.p), old_price: num(j.o),
      discount: j.d || null, valid_from: j.v || null, valid_until: j.e || null, expired: !!j.e && String(j.e).slice(0, 10) < new Date().toISOString().slice(0, 10) } };
  } catch (e) { return { note: clean, offer: null }; }
}
window.SmartListsText = { parseText, encodeText, openTagQuery, splitTags, parseImportText };

/* ------------------------------------------------------------------ */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value") el.value = v;
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function svg(path, size = 20, cls) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", size);
  s.setAttribute("height", size);
  if (cls) s.setAttribute("class", cls);
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "currentColor");
  s.append(p);
  return s;
}
// Wie el.replaceChildren(), aber null/false/"" werden übersprungen statt als Text "null" zu erscheinen
function fill(el, ...children) {
  el.replaceChildren(...children.flat(Infinity).filter((c) => c != null && c !== false && c !== ""));
  return el;
}
const iconBtn = (path, title, onclick, cls = "") =>
  h("button", { class: `icon-btn ${cls}`, title, "aria-label": title, type: "button", onclick }, svg(path, 18));
const emojiOf = (label) => (label || "").split(" ")[0];
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function hashColor(s) {
  let x = 0;
  for (const c of s.toLowerCase()) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${x % 360} 55% 42%)`;
}
function badge(tag) {
  if (tag.kind === "store") {
    return h("span", { class: "tag store", style: `background:${tag.color || hashColor(tag.value)}`, title: tag.label }, tag.label);
  }
  if (tag.kind === "person") return h("span", { class: "tag person", title: tag.label }, "👤 ", tag.label);
  return h("span", { class: "tag hash", title: tag.label }, "#", tag.label);
}

const STYLE = `
  :host { display:block; }
  [hidden] { display:none !important; }
  ha-card { overflow:visible; position:relative; }
  .head { display:flex; align-items:center; gap:8px; padding:16px 12px 8px 16px; }
  .title { font-size:1.25rem; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge { font-size:.7rem; padding:2px 8px; border-radius:10px; background:var(--primary-color); color:var(--text-primary-color,#fff); white-space:nowrap; }
  .badge.foreign { background:var(--warning-color,#f5a623); }
  .badge.combined { background:var(--info-color,#2196f3); }
  .count { color:var(--secondary-text-color); font-size:.85rem; white-space:nowrap; }
  .sort { display:flex; align-items:center; gap:2px; color:var(--secondary-text-color); }
  .sort select { background:none; border:none; padding:4px 2px; font-size:.85rem; color:var(--secondary-text-color); cursor:pointer; }

  .add { position:relative; padding:4px 16px 10px; }
  .add-row { display:flex; gap:6px; }
  input, select { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color,#f2f2f2);
    border:1px solid transparent; border-radius:8px; padding:9px 11px; min-width:0; box-sizing:border-box; }
  input:focus, select:focus { outline:none; border-color:var(--primary-color); }
  .add .smart { flex:1; }
  .go { border:none; border-radius:8px; background:var(--primary-color); color:var(--text-primary-color,#fff);
    padding:0 14px; cursor:pointer; display:flex; align-items:center; }
  .go:disabled { opacity:.45; cursor:default; }
  .preview { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-height:24px; margin-top:6px; font-size:.82rem; color:var(--secondary-text-color); }
  .preview:empty { display:none; }
  .catchip { display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--divider-color,#ccc); background:none; border-radius:12px;
    padding:2px 9px; font:inherit; font-size:.8rem; color:var(--primary-text-color); cursor:pointer; }
  .catchip:hover { border-color:var(--primary-color); }
  .catchip .src { color:var(--secondary-text-color); font-size:.72rem; }
  .catchip.manual { border-style:solid; border-color:var(--primary-color); }
  .hint { font-size:.75rem; color:var(--secondary-text-color); }
  .catpick { position:absolute; z-index:6; left:16px; right:16px; top:calc(100% - 6px); background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:6px; display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:2px; }
  .catpick button { text-align:left; border:none; background:none; border-radius:6px; padding:7px 8px; font:inherit; font-size:.85rem; cursor:pointer; color:var(--primary-text-color); }
  .catpick button:hover, .catpick button.sel { background:var(--secondary-background-color,#eee); }
  .catpick button.auto { grid-column:1/-1; color:var(--secondary-text-color); }

  .sugg { position:absolute; z-index:5; left:16px; right:16px; top:52px; background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:4px 0; margin:0; list-style:none; max-height:320px; overflow:auto; }
  .sugg li { display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; }
  .sugg li.active, .sugg li:hover { background:var(--secondary-background-color,#eee); }
  .sugg .e { width:22px; text-align:center; }
  .sugg .n { flex:1; min-width:0; }
  .sugg .n b { font-weight:600; }
  .sugg .u { font-size:.75rem; color:var(--secondary-text-color); }
  .sugg .s { color:var(--secondary-text-color); opacity:.7; display:flex; }
  .sugg .in { font-size:.72rem; color:var(--secondary-text-color); font-style:italic; }

  .frequent { display:flex; gap:6px; overflow-x:auto; padding:2px 16px 10px; scrollbar-width:none; }
  .frequent .lbl { font-size:.75rem; color:var(--secondary-text-color); align-self:center; white-space:nowrap; }
  .fchip { border:1px solid var(--divider-color,#ddd); background:none; border-radius:16px; padding:4px 10px; font:inherit; font-size:.82rem;
    white-space:nowrap; cursor:pointer; color:var(--primary-text-color); }
  .fchip:hover { border-color:var(--primary-color); color:var(--primary-color); }

  .locked { display:flex; align-items:center; gap:8px; padding:4px 16px 12px; color:var(--secondary-text-color); font-size:.85rem; }
  .group { padding:2px 0; }
  .group-title { padding:8px 16px 2px; font-size:.78rem; font-weight:600; letter-spacing:.03em; color:var(--secondary-text-color); text-transform:uppercase; }
  /* Feste Spalten, damit Menge und Einheit in allen Zeilen untereinander stehen:
     Haken | (Emoji) | Name + Badges | Menge | Einheit | Aktionen */
  /* Alle Zeilen eines Abschnitts teilen sich EIN Raster: jede Spalte ist so breit wie ihr längster
     Eintrag, dazwischen überall derselbe Abstand (--gap) – wie zwischen Menge/Einheit und Stift/Papierkorb. */
  .items { --gap:12px; display:grid; grid-template-columns:auto minmax(0,1fr) auto auto auto; column-gap:var(--gap); }
  .items.emoji { grid-template-columns:auto auto minmax(0,1fr) auto auto auto; }
  .items > .full { grid-column:1 / -1; }
  .row { display:grid; grid-template-columns:subgrid; grid-column:1 / -1; align-items:center;
    padding:6px 8px 6px 16px; min-height:40px; }
  @supports not (grid-template-columns: subgrid) {
    .row { grid-template-columns:22px minmax(0,1fr) 48px 44px 64px; column-gap:var(--gap); }
    .items.emoji .row { grid-template-columns:22px 20px minmax(0,1fr) 48px 44px 64px; }
  }
  .qtycol { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; color:var(--primary-color); white-space:nowrap; font-size:.9rem; }
  .unitcol { text-align:left; color:var(--secondary-text-color); white-space:nowrap; font-size:.85rem; }
  .row.checked .qtycol { color:var(--secondary-text-color); font-weight:400; }
  /* Mengen-Stepper − 2 + (wie in der App) */
  .stepper { display:inline-flex; align-items:center; gap:2px; justify-content:flex-end; }
  .stepper .sbtn { width:24px; height:24px; border-radius:50%; border:1px solid var(--divider-color,#ddd); background:none; padding:0;
    display:inline-flex; align-items:center; justify-content:center; color:var(--secondary-text-color); cursor:pointer; flex:none; }
  .stepper .sbtn:hover { border-color:var(--primary-color); color:var(--primary-color); }
  .stepper .sval { min-width:1.6em; text-align:center; }
  .shopping .row.large .stepper .sbtn { width:30px; height:30px; }
  .row:hover { background:var(--secondary-background-color,#f6f6f6); }
  .box { flex:none; width:22px; height:22px; border-radius:6px; border:2px solid var(--secondary-text-color); background:none;
    padding:0; cursor:pointer; display:flex; align-items:center; justify-content:center; color:transparent; }
  .box.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  .box:disabled { opacity:.45; cursor:not-allowed; }
  .main { flex:1; min-width:0; }
  .name-line { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; }
  /* Lange Namen hart umbrechen statt die Spalten zu verschieben */
  .iname { overflow-wrap:anywhere; word-break:break-word; hyphens:auto; min-width:0; }
  .row.checked .iname { text-decoration:line-through; color:var(--secondary-text-color); }
  .row.checked .tag { opacity:.55; }
  .chip { font-size:.72rem; padding:1px 7px; border-radius:9px; background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); white-space:nowrap; }
  .chip.qty { background:color-mix(in srgb, var(--primary-color) 14%, transparent); color:var(--primary-color); font-weight:600; }
  .tag { font-size:.7rem; font-weight:700; padding:1px 7px; border-radius:4px; white-space:nowrap; letter-spacing:.02em; }
  .tag.store { color:#fff; }
  .tag.person { background:color-mix(in srgb, var(--info-color,#7b61ff) 15%, transparent); color:var(--info-color,#7b61ff); font-weight:600; border-radius:9px; }
  .tag.hash { background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); font-weight:600; border-radius:9px; }
  .tags { display:flex; gap:4px; margin-left:auto; flex-wrap:wrap; justify-content:flex-end; }
  .catemoji { text-align:center; }
  .offer { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:2px; font-size:.78rem; color:var(--secondary-text-color); }
  .offer .olabel { font-weight:600; color:var(--success-color,#43a047); }
  .offer .oprice { font-weight:700; color:var(--primary-text-color); }
  .offer .oold { text-decoration:line-through; }
  .offer .odisc { font-weight:700; color:var(--error-color,#db4437); }
  .offer.expired .olabel, .offer.expired .odate { color:var(--error-color,#db4437); }
  .offer.expired .oprice { color:var(--secondary-text-color); }
  .row.checked .offer { opacity:.55; }
  .note { font-size:.8rem; color:var(--secondary-text-color); margin-top:1px; }
  .actions { display:flex; justify-content:flex-end; gap:2px; }
  .icon-btn { background:none; border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center;
    color:var(--secondary-text-color); cursor:pointer; padding:0; flex:none; }
  .icon-btn:hover { background:var(--divider-color,#ddd); color:var(--primary-text-color); }
  .icon-btn.danger:hover { color:var(--error-color,#db4437); }
  .lock-ic { color:var(--secondary-text-color); opacity:.7; display:flex; padding:0 6px; }
  .edit { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:6px; padding:8px 16px 10px; background:var(--secondary-background-color,#f6f6f6); }
  .edit input, .edit select { background:var(--card-background-color,#fff); }
  .edit .text { flex:1 1 100%; } .edit .cat { flex:1 1 160px; } .edit .note-in { flex:2 1 200px; }
  .edit .btns { display:flex; gap:8px; flex:1 1 100%; justify-content:flex-end; }
  .btn { font:inherit; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; background:none; color:var(--primary-color); }
  .btn.primary { background:var(--primary-color); color:var(--text-primary-color,#fff); }
  .btn.small { padding:4px 10px; font-size:.85rem; }
  .done-head { display:flex; align-items:center; gap:6px; padding:8px 8px 8px 16px; cursor:pointer; color:var(--secondary-text-color);
    font-size:.85rem; border-top:1px solid var(--divider-color,#e0e0e0); user-select:none; }
  .done-head .grow { flex:1; }
  .done-head .chev { transition:transform .15s; } .done-head.collapsed .chev { transform:rotate(-90deg); }
  .empty, .msg { padding:20px 16px; text-align:center; color:var(--secondary-text-color); }
  .msg.err { color:var(--error-color,#db4437); padding:8px 16px; }

  .compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .compact .group-title { padding-top:4px; }
  .compact .head { padding-top:10px; }
  .row.press { cursor:default; -webkit-touch-callout:none; user-select:none; }
  .row.pressing { background:var(--secondary-background-color,#eee); transition:background .4s; }
  .menu { position:absolute; z-index:8; left:16px; right:16px; max-width:340px; margin:0 auto; background:var(--card-background-color,#fff);
    border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.25); padding:6px; }
  .menu .mh { display:flex; align-items:center; gap:6px; padding:6px 8px 8px; font-weight:600; border-bottom:1px solid var(--divider-color,#e0e0e0); margin-bottom:4px; }
  .menu .mh span { flex:1; min-width:0; overflow-wrap:anywhere; }
  .menu .mi { display:flex; align-items:center; gap:12px; width:100%; border:none; background:none; border-radius:8px; padding:10px; font:inherit;
    color:var(--primary-text-color); cursor:pointer; text-align:left; }
  .menu .mi:hover { background:var(--secondary-background-color,#eee); }
  .menu .mi.danger { color:var(--error-color,#db4437); }
  .menu .mi svg { color:var(--secondary-text-color); flex:none; } .menu .mi.danger svg { color:inherit; }
  .menu .mgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:2px; }
  .menu .empty { padding:12px; }
  .backdrop { position:fixed; inset:0; z-index:7; }

  /* Einkaufsmodus */
  .shopbtn.on { color:var(--text-primary-color,#fff); background:var(--primary-color); }
  .progress { height:4px; margin:0 16px 8px; border-radius:2px; background:var(--secondary-background-color,#eee); overflow:hidden; }
  .progress > div { height:100%; background:var(--success-color,#43a047); transition:width .3s; }
  .shopping .row.large { min-height:54px; font-size:1.08rem; }
  .shopping .row.large .box { width:28px; height:28px; }
  .shopping .row.tap { cursor:pointer; }
  .snack { position:sticky; bottom:8px; margin:8px 16px; display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px;
    background:#323232; color:#fff; font-size:.9rem; z-index:4; }
  .snack span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .snack button { border:none; background:none; color:#8ab4f8; font:inherit; font-weight:600; cursor:pointer; padding:2px 4px; }
  .uigrid { display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center; font-size:.88rem; }
  .uigrid select { padding:6px 8px; }
  .checks { display:flex; flex-direction:column; gap:4px; font-size:.88rem; margin:6px 0; }
  .checks label, .inline-checks label { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .own { color:var(--primary-color); font-weight:700; margin-left:2px; }
  .inline-checks { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:.85rem; }

  .tabs { display:flex; gap:4px; margin:10px 0 8px; }
  .tabs button { flex:1; border:1px solid var(--divider-color,#ddd); background:none; border-radius:8px; padding:7px; font:inherit; font-size:.88rem;
    cursor:pointer; color:var(--primary-text-color); }
  .tabs button.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  textarea { font:inherit; width:100%; box-sizing:border-box; min-height:120px; resize:vertical; color:var(--primary-text-color);
    background:var(--secondary-background-color,#f2f2f2); border:1px solid transparent; border-radius:8px; padding:9px 11px; }
  textarea:focus { outline:none; border-color:var(--primary-color); }
  .imp-src { width:100%; }
  .imp-prev { max-height:220px; overflow:auto; border:1px solid var(--divider-color,#e0e0e0); border-radius:8px; margin-top:8px; }
  .imp-prev .ir { display:flex; align-items:center; gap:8px; padding:5px 10px; font-size:.88rem; border-bottom:1px solid var(--divider-color,#eee); }
  .imp-prev .ir:last-child { border-bottom:none; }
  .imp-prev .ir.dupe { opacity:.45; }
  .imp-prev .ir .n { flex:1; min-width:0; overflow-wrap:anywhere; }
  .imp-prev .ir.checked .n { text-decoration:line-through; }

  .searchbar { display:flex; align-items:center; gap:6px; padding:0 16px 10px; }
  .searchbar input { flex:1; }
  .iname mark { background:color-mix(in srgb, var(--warning-color,#f5a623) 35%, transparent); color:inherit; border-radius:2px; padding:0 1px; }
  .nohits { padding:16px; text-align:center; color:var(--secondary-text-color); }
  .nohits .btn { margin-top:6px; }

  .settings { padding:4px 16px 16px; border-top:1px solid var(--divider-color,#e0e0e0); }
  .settings h3 { font-size:.95rem; font-weight:600; margin:14px 0 2px; }
  .settings .help { font-size:.8rem; color:var(--secondary-text-color); margin:0 0 8px; }
  .rule { display:flex; gap:6px; align-items:center; margin-bottom:6px; }
  .rule input { width:48px; text-align:center; font-weight:700; font-size:1.05rem; padding:6px; }
  .rule select { flex:1; padding:7px 9px; }
  .example { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:.85rem; padding:8px 10px; border-radius:8px;
    background:var(--secondary-background-color,#f4f4f4); margin:6px 0; }
  .example code { font-family:ui-monospace,monospace; font-size:.8rem; color:var(--secondary-text-color); }
  .srow { display:flex; align-items:center; gap:8px; justify-content:flex-end; margin-top:6px; }
  .srow .ok { color:var(--success-color,#43a047); font-size:.85rem; }
  .learned { max-height:200px; overflow:auto; }
  .lrow { display:flex; align-items:center; gap:8px; padding:3px 0; font-size:.88rem; }
  .lrow .w { flex:1; }
`;

class SmartListsCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.entity) throw new Error("Bitte 'entity' angeben (eine SmartLists-Liste).");
    this._rawConfig = config;
    this._initVersion = CARD_VERSION;
    if (this._config && this._config.entity !== config.entity) this._unsubscribe();
    this._config = { ...CARD_DEFAULTS, ...config };
    // alte Option group_by_category: false → A–Z
    if (config.group_by_category === false && !config.sort) this._config.sort = "alpha";
    let saved = null;
    try { saved = localStorage.getItem(`smartlists-sort:${config.entity}`); } catch (e) { /* privater Modus */ }
    this._sortMode = SORT_MODES.includes(saved) ? saved : this._config.sort;
    this._loadUi();
    this._shopping = !!this._config.start_shopping;
    this._menu = null;
    this._snack = null;
    this._data = null;
    this._editing = null;
    this._collapsedDone = this._config.collapse_completed !== false;
    this._showSettings = false;
    this._rev = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._resetDraft();
    this._suggest = debounce(() => this._fetchSuggestions(), 120);
    this._describe = debounce(() => this._fetchDescribe(), 200);
    this._render();
  }

  set hass(hass) {
    // Karte stammt noch aus einer älteren, inzwischen ersetzten Datei → einmal sauber neu aufbauen
    if (this._initVersion !== CARD_VERSION && (this._rawConfig || this._config)) {
      this._card = null; this._hass = null;
      this.setConfig(this._rawConfig || this._config);
    }
    const first = !this._hass;
    this._hass = hass;
    if (first || !this._cfg) this._loadConfig();
    if (first) this._loadUserUi();
    this._subscribe();
    const st = hass.states && hass.states[this._config.entity];
    const rev = st ? `${st.state}|${st.last_updated}` : "missing";
    if (rev !== this._rev) {
      this._rev = rev;
      this._load();
    }
  }

  getCardSize() { return 6; }
  static getConfigElement() { return document.createElement("smartlists-card-editor"); }
  static getStubConfig(hass) {
    const e = Object.keys((hass && hass.states) || {}).find((k) => k.startsWith("todo."));
    return { entity: e || "todo.einkaufsliste" };
  }

  get _t() { return TEXTS[((this._hass && this._hass.language) || "de").slice(0, 2)] || TEXTS.en; }
  get _isAdmin() { return !this._hass.user || this._hass.user.is_admin; }
  _call(type, extra = {}, withEntity = true) {
    return this._hass.callWS({ type: `smartlists/${type}`, ...(withEntity ? { entity_id: this._config.entity } : {}), ...extra });
  }
  _resetDraft() {
    this._draft = { text: "", parsed: null, info: null, pickedCat: null, sugg: [], suggMode: "name", active: -1 };
  }

  async _loadConfig() {
    try {
      this._cfg = await this._call("config", {}, false);
      // Version der Integration für die Anzeige im Zahnrad (hilft bei „neue Funktion fehlt“)
      this._call("info", {}, false).then((i) => {
        this._version = i.version;
        // Integration neuer als diese Karte → Browser hat eine alte Karten-Datei zwischengespeichert
        if (i.version && i.version !== CARD_VERSION && !this._error) { this._error = this._t.stale_card; this._render(); }
      }).catch(() => {});
      this._render();
    } catch (e) {
      this._cfg = null;
    }
  }
  async _load() {
    try {
      const data = await this._call("get_list");
      if (!data || !Array.isArray(data.items)) throw new Error("Unerwartete Antwort der SmartLists-Integration – bitte Integration aktualisieren.");
      // Rückfall: steht die ⚙OFFER-Zeile der App noch in der Notiz, hier selbst zerlegen
      for (const it of data.items) {
        if (!it.offer && it.note) { const r = parseOfferNote(it.note, this._cfg && this._cfg.known_stores); if (r.offer) { it.offer = r.offer; it.note = r.note; } }
      }
      this._data = data;
      // noch nicht gespeicherte Stepper-Werte beibehalten (sonst springt die Anzeige zurück)
      for (const it of this._data.items) {
        const pend = this._qtyPending && this._qtyPending[it.uid];
        if (pend) { it.quantity = pend.quantity; it.pack_count = pend.pack_count; }
      }
      this._error = null;
    } catch (e) {
      this._error = (e && e.message) || this._t.error;
    }
    this._render();
    if (this._config.show_frequent) this._loadFrequent();
  }
  async _act(type, extra) {
    let result = null;
    try { result = await this._call(type, extra); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    await this._load();
    return result;
  }

  /* ---------------- Rückgängig ----------------
   * Jede Änderung merkt sich, wie sie sich zurücknehmen lässt. Die letzte bleibt über den
   * ↶-Knopf im Kopf erreichbar (bis zur nächsten Änderung), zusätzlich kurz als Leiste unten. */
  async _change(label, type, extra, makeUndo, { snack = true } = {}) {
    const before = this._error;
    const result = await this._act(type, extra);
    if (this._error && this._error !== before) return result;
    this._undo = makeUndo ? { label, run: makeUndo(result || {}) } : null;
    this._render();
    if (snack) this._showSnack(label, this._undo ? () => this._runUndo() : null);
    return result;
  }
  async _runUndo() {
    const u = this._undo;
    if (!u) return;
    this._undo = null;
    this._snack = null;
    this._renderSnack();
    try { await u.run(); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    await this._load();
  }
  _deleteItems(items, label) {
    if (!items.length || !confirm(items.length > 1 ? this._t.confirm_clear : this._t.confirm_delete)) return;
    return this._change(label || `${items[0].name} ${this._t.deleted}`, "remove_items", { uids: items.map((i) => i.uid) },
      () => async () => { for (const i of items) await this._call("add_item", { text: i.text, note: i.note || "", checked: i.checked }); });
  }
  async _loadFrequent() {
    try {
      const r = await this._call("suggest", { query: "", limit: 10 });
      this._frequent = r.suggestions || [];
    } catch (e) { this._frequent = []; }
    this._renderFrequent();
  }

  /* ---------------- Rendering ---------------- */
  // Grundgerüst einmal bauen; Eingabefeld bleibt beim Neuladen der Liste erhalten (Fokus, Text).
  _ensureSkeleton() {
    if (this._card && this._skeletonVersion === CARD_VERSION) return;
    this._skeletonVersion = CARD_VERSION;
    const root = this.shadowRoot;
    this._headEl = h("div", { class: "head" });
    this._searchEl = h("div");
    this._settingsEl = h("div");
    this._importEl = h("div");
    this._addEl = h("div");
    this._freqEl = h("div");
    this._msgEl = h("div");
    this._listEl = h("div");
    this._progressEl = h("div");
    this._menuEl = h("div");
    this._snackEl = h("div");
    this._card = h("ha-card", {}, this._headEl, this._searchEl, this._progressEl, this._settingsEl, this._importEl, this._addEl, this._freqEl, this._msgEl,
      this._listEl, this._snackEl, this._menuEl);
    fill(root, h("style", {}, STYLE), this._card);
    this._card.classList.toggle("compact", !!this._config.compact);
    this._card.classList.toggle("shopping", this._shopping);
    if (this._config.max_height) this._listEl.style.cssText = `max-height:${Number(this._config.max_height)}px;overflow:auto`;
    if (this._shopping && this._ui && this._ui.shop_keep_awake) this._wake(true);
  }

  _render() {
    if (!this.shadowRoot) return;
    this._ensureSkeleton();
    const t = this._t;
    const d = this._data;
    if (!d) {
      fill(this._headEl, );
      fill(this._listEl, h("div", { class: `msg ${this._error ? "err" : ""}` }, this._error || t.loading));
      return;
    }
    const open = d.items.filter((i) => !i.checked);
    // Trefferzahl schon hier, der Kopf wird vor der Liste gezeichnet
    this._hitCount = this._searchQuery ? d.items.filter((i) => this._matches(i, d)).length : 0;
    fill(this._headEl, 
      h("div", { class: "title" }, this._config.title || d.name),
      d.type === "combined" ? h("span", { class: "badge combined" }, t.combined) : null,
      d.foreign ? h("span", { class: "badge foreign" }, t.foreign) : null,
      !this._config.show_count ? null : h("span", { class: "count" }, this._searchQuery
        ? `${this._hitCount ?? 0} ${t.hits}`
        : this._shopping ? `${d.items.length - open.length}/${d.items.length} ${t.in_cart}` : `${open.length} ${t.open}`),
      this._config.show_search ? iconBtn(this._search != null ? ICON.close : ICON.search, t.search, () => this._toggleSearch()) : null,
      d.permissions.add && this._config.show_import !== false
        ? iconBtn(this._showImport ? ICON.close : ICON.importIcon, t.imp, () => { this._showImport = !this._showImport; this._showSettings = false; this._renderSettings(); this._renderImport(); this._render(); })
        : null,
      this._undo && this._config.show_undo ? iconBtn(ICON.undo, `${t.undo}: ${this._undo.label}`, () => this._runUndo()) : null,
      this._config.show_sort ? this._sortSelect(d) : null,
      !this._config.show_shopping ? null : h("button", { class: `icon-btn shopbtn ${this._shopping ? "on" : ""}`, type: "button", "aria-pressed": String(this._shopping),
        title: this._shopping ? t.shop_off : t.shop_on, "aria-label": this._shopping ? t.shop_off : t.shop_on,
        onclick: () => this._toggleShopping() }, svg(ICON.cart, 18)),
      this._config.show_settings !== false
        ? iconBtn(this._showSettings ? ICON.close : ICON.gear, t.settings, () => { this._showSettings = !this._showSettings; this._showImport = false; this._renderImport(); this._renderSettings(); this._render(); })
        : null
    );
    const pct = d.items.length ? Math.round((100 * (d.items.length - open.length)) / d.items.length) : 0;
    fill(this._progressEl, this._shopping ? h("div", { class: "progress", role: "progressbar", "aria-valuenow": String(pct),
      "aria-valuemin": "0", "aria-valuemax": "100" }, h("div", { style: `width:${pct}%` })) : "");
    this._headEl.hidden = !this._config.show_header;
    this._renderAdd();
    fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : "");
    this._renderList();
  }

  /* ---------------- Bedienung & Einkaufsmodus ---------------- */
  _deviceUi() {
    try { return JSON.parse(localStorage.getItem(UI_KEY) || "null"); } catch (e) { return null; }
  }
  // eingebaut < Haushalts-Standard < Benutzer < Gerät
  _loadUi() {
    this._ui = { ...UI_DEFAULTS, ...(this._houseUi || {}), ...(this._userUi || {}), ...(this._deviceUi() || {}) };
  }
  // Was im Einstellungs-Bereich für die gewählte Ebene angezeigt wird
  _scopeValues(scope) {
    if (scope === "household") return { ...UI_DEFAULTS, ...(this._houseUi || {}) };
    if (scope === "user") return { ...UI_DEFAULTS, ...(this._houseUi || {}), ...(this._userUi || {}) };
    return this._ui;
  }
  get _uiScope() {
    if (this._deviceUi()) return "device";
    return this._editScope === "household" && this._isAdmin ? "household" : "user";
  }
  async _loadUserUi() {
    try {
      const r = await this._call("user_settings", {}, false);
      this._houseUi = r.defaults || {};
      this._userUi = r.settings || {};
    } catch (e) { this._houseUi = {}; this._userUi = {}; }
    this._loadUi();
    if (this._data) this._renderList();
    if (this._showSettings) this._renderSettings();
  }
  async _saveUi(patch) {
    const scope = this._uiScope;
    if (scope === "device") {
      try { localStorage.setItem(UI_KEY, JSON.stringify({ ...this._deviceUi(), ...patch })); } catch (e) { /* */ }
    } else {
      // Benutzer: nur Abweichungen vom Haushalts-Standard speichern → Standard-Änderungen wirken weiter
      const base = scope === "household" ? { ...(this._houseUi || {}) } : { ...(this._userUi || {}) };
      const next = { ...base, ...patch };
      if (scope === "user") {
        const house = { ...UI_DEFAULTS, ...(this._houseUi || {}) };
        for (const k of Object.keys(next)) if (JSON.stringify(next[k]) === JSON.stringify(house[k])) delete next[k];
      }
      try {
        const r = await this._call("set_user_settings", { settings: next, scope }, false);
        this._houseUi = r.defaults || {};
        this._userUi = r.settings || {};
      } catch (e) { this._error = (e && e.message) || this._t.error; this._render(); return; }
    }
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }
  _setScope(scope) {
    try {
      if (scope === "device") { if (!this._deviceUi()) localStorage.setItem(UI_KEY, JSON.stringify({ ...this._ui })); }
      else localStorage.removeItem(UI_KEY);
    } catch (e) { /* */ }
    this._editScope = scope;
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }
  async _resetUi() {
    const scope = this._uiScope;
    if (scope === "device") { this._setScope("user"); return; }
    try {
      const r = await this._call("set_user_settings", { settings: {}, scope }, false);
      this._houseUi = r.defaults || {};
      this._userUi = r.settings || {};
    } catch (e) { /* */ }
    this._loadUi();
    this._renderSettings();
    this._renderList();
  }

  async _toggleShopping() {
    this._shopping = !this._shopping;
    this._card.classList.toggle("shopping", this._shopping);
    if (this._shopping && this._ui.shop_keep_awake) await this._wake(true);
    if (!this._shopping) await this._wake(false);
    this._render();
  }
  async _wake(on) {
    try {
      if (on && "wakeLock" in navigator) {
        this._wakeLock = await navigator.wakeLock.request("screen");
        if (!this._onVis) {
          // Wake Lock fällt beim Wechsel in den Hintergrund weg → beim Zurückkommen neu anfordern
          this._onVis = () => { if (document.visibilityState === "visible" && this._shopping && this._ui.shop_keep_awake) this._wake(true); };
          document.addEventListener("visibilitychange", this._onVis);
        }
      } else if (!on && this._wakeLock) {
        await this._wakeLock.release();
        this._wakeLock = null;
      }
    } catch (e) { /* nicht unterstützt (z.B. ohne HTTPS) */ }
  }
  connectedCallback() { if (this._hass) this._subscribe(); }
  disconnectedCallback() { this._wake(false); this._unsubscribe(); }

  // Live: Änderungen von anderen Geräten/Benutzern sofort zeigen (HA-eigenes todo/item/subscribe).
  // Der Zustand der Liste ändert sich z.B. beim Umbenennen nicht – darum reicht "hass" allein nicht.
  async _subscribe() {
    const conn = this._hass && this._hass.connection;
    if (!conn || this._unsub || this._subscribing) return;
    this._subscribing = true;
    const entity = this._config.entity;
    try {
      let first = true;
      this._unsub = await conn.subscribeMessage(() => {
        if (first) { first = false; return; } // erste Nachricht = aktueller Stand
        if (!this._reloadSoon) this._reloadSoon = debounce(() => this._load(), 250);
        this._reloadSoon();
      }, { type: "todo/item/subscribe", entity_id: entity });
    } catch (e) { this._unsub = null; } finally { this._subscribing = false; }
  }
  _unsubscribe() {
    if (this._unsub) { try { this._unsub(); } catch (e) { /* */ } this._unsub = null; }
  }

  async _toggleItem(it) {
    const checked = !it.checked;
    // Leiste nur, wenn der Artikel dabei aus dem Blick verschwindet (Einkaufsmodus) – sonst reicht ↶ im Kopf
    const vanishes = checked && this._shopping && this._ui.shop_hide_checked;
    await this._change(`${it.name} ${checked ? this._t.checked_off : this._t.unchecked}`, "update_item", { uid: it.uid, checked },
      () => () => this._call("update_item", { uid: it.uid, checked: !checked }), { snack: vanishes });
  }
  _showSnack(text, undo) {
    clearTimeout(this._snackTimer);
    this._snack = { text, undo };
    this._renderSnack();
    this._snackTimer = setTimeout(() => { this._snack = null; this._renderSnack(); }, 5000);
  }
  _renderSnack() {
    if (!this._snackEl) return;
    const s = this._snack;
    fill(this._snackEl, s ? h("div", { class: "snack", role: "status" }, h("span", {}, s.text),
      s.undo ? h("button", { type: "button", onclick: () => { const u = s.undo; this._snack = null; this._renderSnack(); u(); } }, this._t.undo) : null) : "");
  }

  // Geste (lange drücken / Doppelklick / Rechtsklick) an Zeile oder Namen binden
  _bindPress(el, it, row) {
    const ui = this._ui;
    if (ui.press_gesture === "off") return;
    const fire = () => this._pressAction(it, row);
    if (ui.press_gesture === "double") { el.addEventListener("dblclick", (e) => { e.preventDefault(); fire(); }); return; }
    el.addEventListener("contextmenu", (e) => { e.preventDefault(); fire(); });
    if (ui.press_gesture !== "long") return;
    row.classList.add("press");
    let timer = null, start = null;
    const cancel = () => { clearTimeout(timer); timer = null; row.classList.remove("pressing"); };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      start = [e.clientX, e.clientY];
      row.classList.add("pressing");
      timer = setTimeout(() => {
        timer = null;
        row.classList.remove("pressing");
        // Den Klick direkt nach dem Loslassen schlucken – aber nur kurz, sonst ginge der nächste
        // echte Tipper verloren (auf Touch-Geräten folgt einem langen Druck oft gar kein Klick).
        this._suppressClick = true;
        setTimeout(() => { this._suppressClick = false; }, 400);
        fire();
      }, LONG_PRESS_MS);
    });
    el.addEventListener("pointermove", (e) => { if (timer && start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 8) cancel(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, cancel));
  }
  _pressAction(it, row) {
    const r = this._ui.press_result;
    const p = it.permissions;
    if (r === "edit" && p.rename) { this._editing = it.uid; this._renderList(); return; }
    if (r === "delete" && p.delete) { this._deleteItems([it]); return; }
    this._openMenu(it, row, "main");
  }

  async _openMenu(it, row, view) {
    this._menu = { it, row, view };
    if ((view === "move" || view === "copy") && !this._targets) {
      try { this._targets = (await this._call("lists", {}, false)).lists; } catch (e) { this._targets = []; }
    }
    this._renderMenu();
  }
  _closeMenu() { this._menu = null; this._renderMenu(); }
  _renderMenu() {
    const el = this._menuEl;
    if (!el) return;
    const m = this._menu;
    if (!m) return fill(el, );
    const t = this._t;
    const it = m.it;
    const p = it.permissions;
    const d = this._data;
    const top = Math.max(8, m.row.offsetTop + m.row.offsetHeight - 4);
    const head = (title, back) => h("div", { class: "mh" },
      back ? iconBtn(ICON.back, t.cancel, () => this._openMenu(it, m.row, "main")) : null,
      h("span", {}, title), iconBtn(ICON.close, t.cancel, () => this._closeMenu()));
    const item = (icon, label, onclick, cls = "") => h("button", { class: `mi ${cls}`, type: "button", onclick }, svg(icon, 20), label);
    let body;
    if (m.view === "main") {
      const allowed = {
        rename: p.rename, move: p.delete, copy: true, category: true, delete: p.delete,
      };
      const icons = { rename: ICON.pencil, move: ICON.move, copy: ICON.copy, category: ICON.tagIcon, delete: ICON.trash };
      const actions = (this._ui.menu_actions || MENU_ACTIONS).filter((a) => allowed[a]);
      body = [head(it.name), ...actions.map((a) => item(icons[a], t["m_" + a], () => {
        if (a === "rename") { this._closeMenu(); this._editing = it.uid; this._renderList(); }
        else if (a === "delete") { this._closeMenu(); this._deleteItems([it]); }
        else this._openMenu(it, m.row, a);
      }, a === "delete" ? "danger" : ""))];
      if (!actions.length) body.push(h("div", { class: "empty" }, t.readonly));
    } else if (m.view === "move" || m.view === "copy") {
      const targets = (this._targets || []).filter((l) => l.entity_id !== this._config.entity && l.can_add);
      body = [head(t["m_" + m.view], true), targets.length
        ? targets.map((l) => item(ICON.list, l.name, async () => {
          this._closeMenu();
          const copy = m.view === "copy";
          const source = this._config.entity;
          await this._change(`${it.name} ${copy ? t.copied : t.moved} ${l.name}`, "move_item", { uid: it.uid, target: l.entity_id, copy },
            (res) => () => copy
              ? this._call("remove_items", { entity_id: l.entity_id, uids: [res.uid] }, false)
              : this._call("move_item", { entity_id: l.entity_id, uid: res.uid, target: source, copy: false }, false));
        }))
        : h("div", { class: "empty" }, t.no_targets)];
    } else if (m.view === "category") {
      body = [head(t.m_category, true), h("div", { class: "mgrid" }, d.categories.map((c) => item("", c.label, async () => {
        this._closeMenu();
        await this._call("set_category", { name: it.name, category: c.id }, false);
        await this._load();
      }, c.id === it.category ? "sel" : "")))];
    }
    fill(el, h("div", { class: "backdrop", onclick: () => this._closeMenu() }),
      h("div", { class: "menu", role: "menu", style: `top:${top}px` }, body));
  }

  /* ---------------- Angebote aus der App ----------------
   * Die App speichert Angebote als ⚙OFFER-Zeile in der Notiz; die Integration liefert sie zerlegt
   * als it.offer. Markt-Badge nur, wenn nicht schon ein @Markt-Tag dasselbe zeigt. */
  _offerLine(it, tags) {
    const o = it.offer;
    const t = this._t;
    const euro = (v) => `${v.toFixed(2).replace(".", ",")} €`;
    const day = (iso) => { const p = String(iso).slice(0, 10).split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : iso; };
    const hasStoreTag = tags.some((x) => x.kind === "store" && x.label.toLowerCase() === String(o.store_label).toLowerCase());
    return h("div", { class: `offer ${o.expired ? "expired" : ""}` },
      hasStoreTag ? null : badge({ kind: "store", value: o.store, label: o.store_label, color: o.color }),
      h("span", { class: "olabel" }, "🏷️ " + t.offer),
      o.price != null ? h("span", { class: "oprice" }, euro(o.price)) : null,
      o.old_price != null ? h("span", { class: "oold" }, euro(o.old_price)) : null,
      o.discount ? h("span", { class: "odisc" }, o.discount) : null,
      o.valid_until ? h("span", { class: "odate" }, o.expired ? `${t.offer_expired} ${day(o.valid_until)}` : `${t.offer_until} ${day(o.valid_until)}`) : null);
  }

  /* ---------------- Mengen-Stepper ----------------
   * Wie in der App: ±1, nie unter 0; bei Mehrfachpackungen ("4× 150 g") ändert sich die Anzahl
   * der Packungen (nie unter 1). Schnelles Tippen wird gesammelt und nach kurzer Pause einmal
   * gespeichert; die Anzeige ändert sich sofort. */
  _stepQty(it, delta) {
    const multi = it.pack_count > 1;
    if (multi) it.pack_count = Math.max(1, it.pack_count + delta);
    else it.quantity = Math.max(0, Math.round(((it.quantity || 0) + delta) * 1000) / 1000);
    this._qtyPending = this._qtyPending || {};
    const entry = this._qtyPending[it.uid] || { original: it.text, timer: null };
    clearTimeout(entry.timer);
    entry.quantity = it.quantity;
    entry.pack_count = it.pack_count;
    this._qtyPending[it.uid] = entry;
    this._renderList();
    entry.timer = setTimeout(() => {
      delete this._qtyPending[it.uid];
      const parsed = parseText(entry.original, this._cfg.tag_rules, this._cfg.known_stores);
      const text = encodeText({ ...parsed, quantity: it.quantity, pack_count: it.pack_count }, this._cfg.tag_rules);
      if (text === entry.original) return;
      this._change(`${it.name}: ${this._t.qty_changed}`, "update_item", { uid: it.uid, text },
        () => () => this._call("update_item", { uid: it.uid, text: entry.original }), { snack: false });
    }, 600);
  }

  /* ---------------- Suche ---------------- */
  get _searchQuery() { return this._search ? searchKey(this._search.trim()) : ""; }

  _toggleSearch() {
    if (this._search != null) { this._search = null; fill(this._searchEl); this._searchInput = null; }
    else { this._search = ""; this._renderSearch(); setTimeout(() => this._searchInput && this._searchInput.focus(), 0); }
    this._render();
  }
  _renderSearch() {
    if (this._search == null) return fill(this._searchEl);
    if (this._searchInput) return; // Feld bleibt beim Neuzeichnen erhalten (Fokus, Cursor)
    const t = this._t;
    this._searchInput = h("input", { type: "search", placeholder: t.search_placeholder, "aria-label": t.search, value: this._search, autocomplete: "off",
      oninput: (e) => { this._search = e.target.value; this._render(); },
      onkeydown: (e) => { if (e.key === "Escape") this._toggleSearch(); } });
    fill(this._searchEl, h("div", { class: "searchbar" }, this._searchInput));
  }
  // Treffer in Name, Notiz, Tags, Quelle und Kategorie
  _matches(it, d) {
    const q = this._searchQuery;
    if (!q) return true;
    const cat = d.categories.find((c) => c.id === it.category);
    const hay = [it.name, it.note, it.source, cat && cat.label, ...(it.tags || []).map((x) => x.label),
      ...(it.offer ? [it.offer.store_label, this._t.offer] : [])].map(searchKey).join("\n");
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  // Treffer im Namen markieren (Position über die normalisierte Form, Länge bleibt bis auf ß gleich)
  _highlight(name) {
    const q = this._searchQuery;
    if (!q) return name;
    const word = q.split(/\s+/)[0];
    const i = searchKey(name).indexOf(word);
    if (i < 0 || /ß/.test(name)) return name;
    return [name.slice(0, i), h("mark", {}, name.slice(i, i + word.length)), name.slice(i + word.length)];
  }

  _sortSelect(d) {
    const t = this._t;
    const modes = SORT_MODES.filter((m) => m !== "list" || d.type === "combined");
    return h("label", { class: "sort", title: t.sort },
      svg(ICON.sort, 16),
      h("select", { "aria-label": t.sort, onchange: (e) => {
        this._sortMode = e.target.value;
        try { localStorage.setItem(`smartlists-sort:${this._config.entity}`, this._sortMode); } catch (err) { /* */ }
        this._renderList();
      } }, modes.map((m) => h("option", { value: m, selected: m === this._sortMode }, t["sort_" + m]))));
  }

  /* ---------------- Eingabe ---------------- */
  _renderAdd() {
    if (!this._config.show_add) return fill(this._addEl);
    const d = this._data;
    const allowed = d.permissions.add;
    if (this._addAllowed === allowed && this._addEl.firstChild) return;
    this._addAllowed = allowed;
    if (!allowed) {
      fill(this._addEl, h("div", { class: "locked" }, svg(ICON.lock, 16), this._t.no_add));
      return;
    }
    const t = this._t;
    this._input = h("input", { class: "smart", placeholder: t.add_placeholder, value: this._draft.text, autocomplete: "off",
      enterkeyhint: "done", "aria-label": t.add_placeholder,
      oninput: () => this._onInput(), onkeydown: (e) => this._onKey(e),
      onfocus: () => { this._focused = true; this._renderFrequent(); },
      onblur: () => setTimeout(() => { this._focused = false; this._closeSugg(); this._renderFrequent(); }, 150) });
    this._goBtn = h("button", { class: "go", type: "button", title: t.add_placeholder, onclick: () => this._submit() }, svg(ICON.plus));
    this._previewEl = h("div", { class: "preview" });
    this._suggEl = h("ul", { class: "sugg", role: "listbox", hidden: true });
    this._pickEl = h("div", { class: "catpick", hidden: true });
    fill(this._addEl, h("div", { class: "add" }, h("div", { class: "add-row" }, this._input, this._goBtn), this._previewEl, this._suggEl, this._pickEl));
    this._renderPreview();
  }

  _onInput() {
    const text = this._input.value;
    if (!text.trim()) { this._resetDraft(); this._renderPreview(); this._closeSugg(); this._renderFrequent(); return; }
    this._draft.text = text;
    this._draft.parsed = this._cfg ? parseText(text, this._cfg.tag_rules, this._cfg.known_stores, true) : null;
    this._renderPreview();
    this._renderFrequent();
    this._suggest();
    this._describe();
  }

  async _fetchDescribe() {
    const p = this._draft.parsed;
    if (!p || !p.name) return;
    const name = p.name;
    try {
      const r = await this._call("describe", { texts: [name] }, false);
      if (this._draft.parsed && this._draft.parsed.name === name) {
        this._draft.info = r.items[0];
        this._renderPreview();
      }
    } catch (e) { /* Vorschau ist optional */ }
  }

  async _fetchSuggestions() {
    const text = this._draft.text;
    if (!text.trim()) return this._closeSugg();
    try {
      const r = await this._call("suggest", { query: text, limit: 8 });
      if (this._draft.text !== text) return;
      this._draft.sugg = r.suggestions || [];
      this._draft.suggMode = r.mode;
      this._draft.active = -1;
      this._renderSugg();
    } catch (e) { this._closeSugg(); }
  }

  _renderPreview() {
    const el = this._previewEl;
    if (!el) return;
    const t = this._t;
    const p = this._draft.parsed;
    if (this._goBtn) this._goBtn.disabled = !(p && p.name);
    if (!p || !p.name) return fill(el, );
    const info = this._draft.info && this._draft.info.name === p.name ? this._draft.info : null;
    const catId = this._draft.pickedCat || (info && info.category);
    const cat = catId && this._cfg ? this._cfg.categories.find((c) => c.id === catId) : null;
    const source = this._draft.pickedCat ? "manual" : info ? info.category_source : null;
    const unit = p.unit || (p.quantity != null && info && info.unit_hint) || null;
    fill(el, 
      h("span", {}, p.name),
      p.quantity != null ? h("span", { class: "chip qty" }, `${p.pack_count > 1 ? p.pack_count + "× " : ""}${fmtQty(p.quantity)}${unit ? " " + unit : ""}`) : null,
      h("button", { class: `catchip ${source === "manual" ? "manual" : ""}`, type: "button", title: t.category,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._togglePicker() },
        cat ? cat.label : "…", source ? h("span", { class: "src" }, "· " + t["src_" + source]) : null),
      p.quantity == null && info && info.unit_hint ? h("span", { class: "hint" }, `${t.unit_hint}: ${info.unit_hint}`) : null,
      p.tags.map(badge)
    );
  }

  _togglePicker() {
    const el = this._pickEl;
    if (!el.hidden) { el.hidden = true; return; }
    const current = this._draft.pickedCat || (this._draft.info && this._draft.info.category);
    this._closeSugg();
    fill(el, 
      ...this._cfg.categories.map((c) => h("button", { type: "button", class: c.id === current ? "sel" : "",
        onmousedown: (e) => e.preventDefault(), onclick: () => this._pickCategory(c.id) }, c.label)),
      this._draft.pickedCat ? h("button", { type: "button", class: "auto", onmousedown: (e) => e.preventDefault(),
        onclick: () => this._pickCategory(null) }, "↺ " + this._t.src_pack) : null
    );
    el.hidden = false;
  }
  _pickCategory(id) {
    this._draft.pickedCat = id;
    this._pickEl.hidden = true;
    this._renderPreview();
    this._input && this._input.focus();
  }

  _renderSugg() {
    const el = this._suggEl;
    if (!el) return;
    const list = this._draft.sugg;
    if (!list.length || !this._focused) return this._closeSugg();
    const t = this._t;
    const present = new Set((this._data ? this._data.items.filter((i) => !i.checked) : []).map((i) => i.name.toLowerCase()));
    const q = (this._draft.parsed && this._draft.parsed.name.toLowerCase()) || "";
    const bold = (name) => {
      const i = name.toLowerCase().indexOf(q);
      return i < 0 || !q ? name : [name.slice(0, i), h("b", {}, name.slice(i, i + q.length)), name.slice(i + q.length)];
    };
    fill(el, ...list.map((s, i) => {
      const isTag = this._draft.suggMode === "tag";
      return h("li", { role: "option", class: i === this._draft.active ? "active" : "",
        onmousedown: (e) => { e.preventDefault(); this._applySugg(i); } },
        isTag ? badge(s) : h("span", { class: "e" }, emojiOf(s.category_label)),
        h("span", { class: "n" }, isTag ? "" : bold(s.name)),
        !isTag && present.has(s.name.toLowerCase()) ? h("span", { class: "in" }, t.in_list) : null,
        !isTag && s.unit ? h("span", { class: "u" }, s.unit) : null,
        h("span", { class: "s" }, s.source === "history" ? svg(ICON.history, 15) : s.source === "list" ? svg(ICON.list, 15) : ""));
    }));
    el.hidden = false;
  }
  _closeSugg() {
    if (this._suggEl) this._suggEl.hidden = true;
    this._draft.active = -1;
  }

  _applySugg(i) {
    const s = this._draft.sugg[i];
    if (!s) return;
    const rules = this._cfg.tag_rules;
    if (this._draft.suggMode === "tag") {
      const prefix = rules.find((r) => r.kind === s.kind).prefix;
      this._input.value = this._input.value.replace(/\S+$/, prefix + s.value) + " ";
    } else {
      const p = parseText(this._input.value, rules, this._cfg.known_stores, true);
      this._input.value = encodeText({ ...p, name: s.name }, rules) + " ";
    }
    this._closeSugg();
    this._input.focus();
    this._onInput();
    this._closeSugg();
  }

  _onKey(e) {
    const open = this._suggEl && !this._suggEl.hidden && this._draft.sugg.length;
    if (e.key === "ArrowDown" && open) { e.preventDefault(); this._draft.active = (this._draft.active + 1) % this._draft.sugg.length; this._renderSugg(); }
    else if (e.key === "ArrowUp" && open) { e.preventDefault(); this._draft.active = (this._draft.active - 1 + this._draft.sugg.length) % this._draft.sugg.length; this._renderSugg(); }
    else if (e.key === "Tab" && open && !e.shiftKey) { e.preventDefault(); this._applySugg(Math.max(0, this._draft.active)); }
    else if (e.key === "Escape") { this._closeSugg(); if (this._pickEl) this._pickEl.hidden = true; }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (open && this._draft.active >= 0) this._applySugg(this._draft.active);
      else this._submit();
    }
  }

  async _submit(textOverride) {
    const cfg = this._cfg;
    const p = textOverride ? parseText(textOverride, cfg.tag_rules, cfg.known_stores, true) : this._draft.parsed;
    if (!p || !p.name) return;
    const info = this._draft.info && this._draft.info.name === p.name ? this._draft.info : null;
    // Nur Zahl getippt ("Äpfel 2")? → gemerkte bzw. übliche Einheit ergänzen
    if (p.quantity != null && !p.unit && info && info.unit_hint) p.unit = info.unit_hint;
    const picked = textOverride ? null : this._draft.pickedCat;
    const text = encodeText(p, cfg.tag_rules);
    this._resetDraft();
    if (this._input) { this._input.value = ""; this._renderPreview(); this._closeSugg(); if (this._pickEl) this._pickEl.hidden = true; }
    if (picked) {
      try { await this._call("set_category", { name: p.name, category: picked }, false); } catch (e) { /* weiter hinzufügen */ }
    }
    await this._change(`${p.name} ${this._t.added}`, "add_item", { text },
      (res) => () => this._call("remove_items", { uids: [res.uid] }), { snack: false });
  }

  _renderFrequent() {
    const el = this._freqEl;
    if (!el) return;
    const items = (this._frequent || []).slice(0, 8);
    const show = this._config.show_frequent && this._config.show_add && items.length && this._data && this._data.permissions.add && !this._draft.text.trim();
    if (!show) return fill(el, );
    fill(el, h("div", { class: "frequent" },
      h("span", { class: "lbl" }, this._t.frequent),
      items.map((s) => h("button", { class: "fchip", type: "button", title: s.category_label,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._submit(s.name) }, `${emojiOf(s.category_label)} ${s.name}`))));
  }

  /* ---------------- Liste ---------------- */
  _renderList() {
    const t = this._t;
    const d = this._data;
    const searching = !!this._searchQuery;
    const visible = searching ? d.items.filter((i) => this._matches(i, d)) : d.items;
    this._hitCount = visible.length;
    const open = visible.filter((i) => !i.checked);
    const done = visible.filter((i) => i.checked);
    const out = [];
    const mode = this._sortMode;
    const byName = (a, b) => a.name.localeCompare(b.name, this._hass.language || "de", { sensitivity: "base", numeric: true });
    const rows = [];
    let emoji = false;
    const grouped = (keyOf, groupsInOrder, labelOf) => {
      const groups = new Map();
      for (const it of open) {
        const k = keyOf(it);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
      }
      groupsInOrder([...groups.keys()]).forEach((k) => {
        const items = groups.get(k).sort(byName);
        rows.push(h("div", { class: "group-title full" }, `${labelOf(k)} · ${items.length}`), items.map((i) => this._row(i, d, false)));
      });
    };
    if (searching && !visible.length) {
      // nichts gefunden → direkt hinzufügen anbieten
      const term = this._search.trim();
      out.push(h("div", { class: "nohits" }, `${t.no_hits} „${term}“`,
        d.permissions.add ? h("div", {}, h("button", { class: "btn primary", type: "button",
          onclick: () => { this._toggleSearch(); this._submit(term); } }, `„${term}“ ${t.add_this}`)) : null));
    } else if (!open.length && searching) { /* nur erledigte Treffer – unten anzeigen */ }
    else if (!open.length) out.push(h("div", { class: "empty" }, t.empty));
    else if (mode === "category" && this._config.show_category_titles === false) {
      // nach Kategorie, aber ohne Überschriften: eine Liste mit Kategorie-Symbol vorne
      const order = d.categories.map((c) => c.id);
      emoji = true;
      rows.push([...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b)).map((i) => this._row(i, d, true)));
    } else if (mode === "category") {
      // wie in der App: Gruppen in fester Markt-Reihenfolge, innerhalb A–Z
      const order = d.categories.map((c) => c.id);
      grouped((i) => i.category, (keys) => keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)),
        (k) => { const c = d.categories.find((x) => x.id === k); return c ? c.label : k; });
    } else if (mode === "list" && d.type === "combined") {
      const order = d.source_lists || [];
      grouped((i) => i.source || "", (keys) => keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)), (k) => k || "–");
    } else {
      const items = mode === "alpha" ? [...open].sort(byName) : open;
      emoji = true;
      rows.push(items.map((i) => this._row(i, d, true)));
    }
    if (rows.length) out.push(h("div", { class: `items ${emoji ? "emoji" : ""}` }, rows));

    const hideDone = this._shopping && this._ui.shop_hide_checked;
    // bei der Suche erledigte Treffer immer zeigen (aufgeklappt), „Erledigte entfernen“ nur ohne Filter
    const collapsed = this._collapsedDone && !searching;
    if (this._config.show_completed && done.length && !hideDone) {
      out.push(h("div", { class: `done-head ${collapsed ? "collapsed" : ""}`,
        onclick: () => { this._collapsedDone = !this._collapsedDone; this._renderList(); } },
        svg(ICON.chevron, 18, "chev"), `${t.done} (${done.length})`, h("span", { class: "grow" }),
        d.permissions.delete && !searching ? iconBtn(ICON.sweep, t.clear, (e) => { e.stopPropagation(); this._deleteItems(done, `${done.length} ${t.removed}`); }) : null));
      const doneSorted = mode === "added" ? done : [...done].sort(byName);
      if (!collapsed) out.push(h("div", { class: "items emoji" }, doneSorted.map((i) => this._row(i, d, true))));
    }
    fill(this._listEl, ...out);
    if (this._menu) this._renderMenu();
  }

  _row(it, d, showEmoji) {
    if (this._editing === it.uid) return this._editRow(it, d);
    const t = this._t;
    const p = it.permissions;
    const qty = it.quantity != null ? `${it.pack_count > 1 ? it.pack_count + "× " : ""}${fmtQty(it.quantity)}` : "";
    const readonly = !p.toggle && !p.rename && !p.delete;
    const cat = d.categories.find((c) => c.id === it.category);
    // Badges und Herkunft lassen sich pro Karte ausblenden
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    // Reihenfolge: Name (+ Badges dahinter) | Menge | Einheit – jeweils eigene, gleich breite Spalte
    const ui = this._ui;
    const shop = this._shopping;
    const buttons = ui.row_buttons && !shop;
    const tapRow = shop && ui.shop_tap_row && p.toggle;
    const nameEl = h("span", { class: "iname" }, this._highlight(it.name));
    const row = h("div", { class: `row ${showEmoji ? "emoji" : ""} ${it.checked ? "checked" : ""} ${shop && ui.shop_large ? "large" : ""} ${tapRow ? "tap" : ""} ${shop && buttons ? "btns" : ""}`,
      onclick: (e) => {
        if (this._suppressClick) { this._suppressClick = false; return; }
        if (tapRow && !e.target.closest("button")) this._toggleItem(it);
      } },
      h("button", { class: `box ${it.checked ? "on" : ""}`, type: "button", disabled: !p.toggle, "aria-label": it.name,
        onclick: () => this._toggleItem(it) }, svg(ICON.check, shop && ui.shop_large ? 20 : 16)),
      showEmoji ? h("span", { class: "catemoji", title: cat ? cat.label : "" }, cat ? emojiOf(cat.label) : "") : null,
      h("div", { class: "main" },
        h("div", { class: "name-line" },
          nameEl,
          tags.map(badge),
          // Quelle nur als Text, wenn sie nicht schon als Person-Badge erscheint (todo.peter → 👤 Peter)
          this._config.show_source && it.source && !tags.some((x) => x.implicit) ? h("span", { class: "chip" }, it.source) : null),
        it.offer && this._config.show_offer !== false ? this._offerLine(it, tags) : null,
        this._config.show_note && it.note ? h("div", { class: "note" }, it.note) : null),
      h("span", { class: "qtycol" }, p.rename && it.quantity != null && this._config.show_stepper !== false
        ? h("span", { class: "stepper" },
          h("button", { class: "sbtn", type: "button", title: t.qty_less, "aria-label": t.qty_less, onclick: () => this._stepQty(it, -1) }, svg(ICON.minus, 14)),
          h("span", { class: "sval" }, qty),
          h("button", { class: "sbtn", type: "button", title: t.qty_more, "aria-label": t.qty_more, onclick: () => this._stepQty(it, 1) }, svg(ICON.plus, 14)))
        : qty),
      h("span", { class: "unitcol", title: it.unit || "" }, it.unit || ""),
      h("div", { class: "actions" },
        readonly && !shop ? h("span", { class: "lock-ic", title: t.readonly }, svg(ICON.lock, 16)) : null,
        buttons && p.rename ? iconBtn(ICON.pencil, t.edit, () => { this._editing = it.uid; this._renderList(); }) : null,
        buttons && p.delete ? iconBtn(ICON.trash, t.delete, () => this._deleteItems([it]), "danger") : null));
    this._bindPress(ui.press_target === "name" ? nameEl : row, it, row);
    return row;
  }

  _editRow(it, d) {
    const t = this._t;
    const text = h("input", { class: "text", value: it.text || it.name, "aria-label": it.name });
    const cat = h("select", { class: "cat", "aria-label": t.category },
      d.categories.map((c) => h("option", { value: c.id, selected: c.id === it.category }, c.label)));
    // Notizen nur, wenn die Liste sie speichern kann (z.B. nicht bei der einfachen HA-Einkaufsliste)
    const canNote = d.permissions.note !== false;
    const note = canNote ? h("input", { class: "note-in", placeholder: t.note, value: it.note || "" }) : null;
    const save = async () => {
      this._editing = null;
      const parsed = parseText(text.value, this._cfg.tag_rules, this._cfg.known_stores, true);
      if (cat.value !== it.category) {
        try { await this._call("set_category", { name: parsed.name || it.name, category: cat.value }, false); } catch (e) { /* */ }
      }
      this._change(`${it.name} ${t.changed}`, "update_item", { uid: it.uid, text: encodeText(parsed, this._cfg.tag_rules) || it.text, note: note ? note.value : it.note || "" },
        () => () => this._call("update_item", { uid: it.uid, text: it.text, note: it.note || "" }));
    };
    [text, note].filter(Boolean).forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { this._editing = null; this._renderList(); } }));
    setTimeout(() => text.focus(), 0);
    return h("div", { class: "edit" }, text, cat, note,
      h("div", { class: "btns" },
        h("button", { class: "btn", type: "button", onclick: () => { this._editing = null; this._renderList(); } }, t.cancel),
        h("button", { class: "btn primary", type: "button", onclick: save }, t.save)));
  }

  /* ---------------- Import ---------------- */
  _renderImport() {
    const el = this._importEl;
    if (!this._showImport || !this._cfg || !this._data) return fill(el);
    const t = this._t;
    const st = (this._imp = this._imp || { tab: "ha", source: "", text: "", done: false, dupes: true, rows: null });
    const present = new Set(this._data.items.filter((i) => !i.checked).map((i) => i.name.toLowerCase()));
    const prevEl = h("div");
    const goBtn = h("button", { class: "btn small primary", type: "button", disabled: true, onclick: () => this._runImport() }, t.imp_go);
    const drawPreview = () => {
      const rows = (st.rows || []).filter((r) => st.done || !r.checked).map((r) => {
        const p = parseText(r.text, this._cfg.tag_rules, this._cfg.known_stores, true);
        return { ...r, parsed: p, dupe: st.dupes && present.has(p.name.toLowerCase()) };
      });
      st.ready = rows.filter((r) => !r.dupe && r.parsed.name);
      goBtn.disabled = !st.ready.length;
      goBtn.textContent = `${t.imp_go} (${st.ready.length})`;
      if (st.rows == null) return fill(prevEl);
      if (!rows.length) return fill(prevEl, h("p", { class: "help" }, st.tab === "ha" && !st.source ? "" : t.imp_none));
      fill(prevEl, h("p", { class: "help", style: "margin:8px 0 0" }, `${t.imp_preview}: ${st.ready.length} ${t.imp_count}`),
        h("div", { class: "imp-prev" }, rows.map((r) => h("div", { class: `ir ${r.dupe ? "dupe" : ""} ${r.checked ? "checked" : ""}` },
          h("span", { class: "n" }, r.parsed.name), r.parsed.tags.map(badge),
          r.parsed.quantity != null ? h("span", { class: "chip qty" }, `${fmtQty(r.parsed.quantity)}${r.parsed.unit ? " " + r.parsed.unit : ""}`) : null,
          r.dupe ? h("span", { class: "chip" }, t.imp_dupe) : null))));
    };
    const loadHa = async (entity) => {
      st.source = entity;
      st.rows = null;
      if (!entity) return drawPreview();
      try {
        const r = await this._hass.callWS({ type: "todo/item/list", entity_id: entity });
        st.rows = (r.items || []).map((i) => ({ text: i.summary || "", note: i.description || "", checked: i.status === "completed" }));
      } catch (e) { st.rows = []; this._error = (e && e.message) || t.error; }
      drawPreview();
    };
    const tab = (id, label) => h("button", { type: "button", class: st.tab === id ? "on" : "",
      onclick: () => { st.tab = id; st.rows = id === "text" ? parseImportText(st.text) : null; if (id === "ha" && st.source) loadHa(st.source); this._renderImport(); } }, label);
    let body;
    if (st.tab === "ha") {
      const lists = Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && e !== this._config.entity)
        .map((e) => ({ e, name: (this._hass.states[e].attributes || {}).friendly_name || e }))
        .sort((a, b) => a.name.localeCompare(b.name));
      body = lists.length
        ? h("select", { class: "imp-src", "aria-label": t.imp_source, onchange: (e) => loadHa(e.target.value) },
          h("option", { value: "" }, `${t.imp_source} …`), lists.map((l) => h("option", { value: l.e, selected: l.e === st.source }, l.name)))
        : h("p", { class: "help" }, t.imp_no_lists);
    } else {
      body = [h("p", { class: "help" }, t.imp_text_help),
        h("textarea", { "aria-label": t.imp_text, placeholder: "- Milch 2 l @REWE\n- [ ] Brot\n- [x] Butter\n3 Äpfel", value: st.text,
          oninput: (e) => { st.text = e.target.value; st.rows = parseImportText(st.text); drawPreview(); } })];
    }
    const opt = (key, label) => h("label", {}, h("input", { type: "checkbox", checked: st[key],
      onchange: (e) => { st[key] = e.target.checked; drawPreview(); } }), label);
    fill(el, h("div", { class: "settings" },
      h("h3", {}, t.imp),
      h("div", { class: "tabs" }, tab("ha", t.imp_ha), tab("text", t.imp_text)),
      body,
      h("div", { class: "inline-checks", style: "margin-top:8px" }, opt("done", t.imp_done), opt("dupes", t.imp_skip_dupes)),
      prevEl,
      h("div", { class: "srow" }, goBtn)));
    drawPreview();
  }

  async _runImport() {
    const st = this._imp;
    const rows = st.ready || [];
    if (!rows.length) return;
    const added = [];
    try {
      for (const r of rows) {
        const res = await this._call("add_item", { text: encodeText(r.parsed, this._cfg.tag_rules), note: r.note || "", checked: !!r.checked });
        if (res && res.uid) added.push(res.uid);
      }
      this._error = null;
    } catch (e) { this._error = (e && e.message) || this._t.error; }
    this._imp = null;
    this._showImport = false;
    this._renderImport();
    this._undo = { label: `${added.length} ${this._t.imported}`, run: () => this._call("remove_items", { uids: added }) };
    await this._load();
    this._showSnack(this._undo.label, () => this._runUndo());
  }

  /* ---------------- Einstellungen ---------------- */
  _uiSettings() {
    const t = this._t;
    const scopeNow = this._uiScope;
    const ui = this._scopeValues(scopeNow);
    const house = this._scopeValues("household");
    // Markierung, wo der Benutzer bzw. das Gerät vom Haushalts-Standard abweicht
    const differs = (key) => scopeNow !== "household" && JSON.stringify(ui[key]) !== JSON.stringify(house[key]);
    const sel = (key, opts) => h("select", { "aria-label": t[key], onchange: (e) => this._saveUi({ [key]: e.target.value }) },
      opts.map(([v, l]) => h("option", { value: v, selected: ui[key] === v }, t[l])));
    const check = (key) => h("label", {}, h("input", { type: "checkbox", checked: !!ui[key],
      onchange: (e) => this._saveUi({ [key]: e.target.checked }) }), t[key], differs(key) ? h("span", { class: "own" }, "•") : null);
    const actions = ui.menu_actions || MENU_ACTIONS;
    const who = (this._hass.user && this._hass.user.name) || "";
    const scope = (val, label) => h("label", {}, h("input", { type: "radio", name: `scope-${this._config.entity}`, checked: scopeNow === val,
      onchange: () => this._setScope(val) }), label);
    return h("div", {},
      h("h3", {}, t.ui), h("p", { class: "help" }, t.ui_help),
      h("div", { class: "inline-checks", style: "margin-bottom:8px" },
        this._isAdmin ? scope("household", t.scope_household) : null,
        scope("user", `${t.scope_user}${who ? " (" + who + ")" : ""}`), scope("device", t.scope_device)),
      h("p", { class: "help" }, t["scope_help_" + scopeNow]),
      h("div", { class: "uigrid" },
        h("span", {}, t.press_gesture, differs("press_gesture") ? h("span", { class: "own" }, " •") : null), sel("press_gesture", [["long", "g_long"], ["double", "g_double"], ["right", "g_right"], ["off", "g_off"]]),
        h("span", {}, t.press_target, differs("press_target") ? h("span", { class: "own" }, " •") : null), sel("press_target", [["row", "t_row"], ["name", "t_name"]]),
        h("span", {}, t.press_result, differs("press_result") ? h("span", { class: "own" }, " •") : null), sel("press_result", [["menu", "r_menu"], ["edit", "r_edit"], ["delete", "r_delete"]])),
      h("p", { class: "help", style: "margin:10px 0 4px" }, t.menu_actions),
      h("div", { class: "inline-checks" }, MENU_ACTIONS.map((a) => h("label", {}, h("input", { type: "checkbox", checked: actions.includes(a),
        onchange: (e) => this._saveUi({ menu_actions: MENU_ACTIONS.filter((x) => (x === a ? e.target.checked : actions.includes(x))) }) }), t["m_" + a]))),
      h("div", { class: "checks" }, check("row_buttons")),
      h("h3", {}, t.shop),
      h("div", { class: "checks" }, check("shop_hide_checked"), check("shop_keep_awake"), check("shop_large"), check("shop_tap_row")),
      h("div", { class: "srow" }, h("button", { class: "btn small", type: "button", onclick: () => this._resetUi() }, t.reset)));
  }

  async _renderSettings() {
    const el = this._settingsEl;
    if (!this._showSettings || !this._cfg) return fill(el, );
    const t = this._t;
    const cfg = this._cfg;
    const admin = this._isAdmin;
    const kinds = cfg.tag_kinds;
    let rules = cfg.tag_rules.map((r) => ({ ...r }));
    const rulesEl = h("div");
    const exampleEl = h("div", { class: "example" });
    const status = h("span");
    const exampleText = () => {
      const p = Object.fromEntries(rules.map((r) => [r.kind, r.prefix]));
      return ["Milch 2 l", p.store && `${p.store}REWE`, p.person && `${p.person}Anna`, p.tag && `${p.tag}bio`].filter(Boolean).join(" ");
    };
    const drawExample = () => {
      const txt = exampleText();
      const parsed = parseText(txt, rules.filter((r) => r.prefix), cfg.known_stores);
      fill(exampleEl, h("code", {}, txt), " → ", h("span", { class: "chip qty" }, `${fmtQty(parsed.quantity)} ${parsed.unit}`), parsed.name, parsed.tags.map(badge));
    };
    const drawRules = () => {
      fill(rulesEl, ...rules.map((r, i) => h("div", { class: "rule" },
        h("input", { value: r.prefix, maxlength: "1", disabled: !admin, "aria-label": "Zeichen",
          oninput: (e) => { r.prefix = e.target.value.trim(); drawExample(); } }),
        h("select", { disabled: !admin, onchange: (e) => { r.kind = e.target.value; drawExample(); } },
          kinds.map((k) => h("option", { value: k, selected: k === r.kind }, t["kind_" + k]))),
        admin ? iconBtn(ICON.close, t.delete, () => { rules.splice(i, 1); drawRules(); drawExample(); }, "danger") : null)));
    };
    drawRules();
    drawExample();
    const save = async () => {
      fill(status, );
      try {
        this._cfg = await this._call("set_tag_rules", { rules: rules.filter((r) => r.prefix) }, false);
        fill(status, h("span", { class: "ok" }, "✓ " + t.saved));
        await this._load();
      } catch (e) {
        fill(status, h("span", { class: "msg err" }, (e && e.message) || t.error));
      }
    };
    const learnedEl = h("div", { class: "learned" }, t.loading);
    fill(el, h("div", { class: "settings" },
      h("p", { class: "help", style: "margin-top:10px" }, `SmartLists ${this._version || "?"} · ${t.card_version} ${CARD_VERSION}`),
      h("h3", {}, t.naming), h("p", { class: "help" }, t.naming_help, admin ? "" : " " + t.admin_only),
      rulesEl, exampleEl,
      admin ? h("div", { class: "srow" }, status,
        h("button", { class: "btn small", type: "button", onclick: () => {
          const free = [...cfg.allowed_prefixes].find((c) => !rules.some((r) => r.prefix === c));
          rules.push({ prefix: free || "", kind: "tag" }); drawRules(); drawExample(); } }, "+ " + t.add_rule),
        h("button", { class: "btn small primary", type: "button", onclick: save }, t.save)) : null,
      h("h3", {}, t.learned), h("p", { class: "help" }, t.learned_help), learnedEl,
      this._uiSettings()));
    const drawLearned = (list) => {
      if (!list.length) return fill(learnedEl, h("div", { class: "help" }, t.none_learned));
      fill(learnedEl, ...list.map((l) => h("div", { class: "lrow" },
        h("span", { class: "w" }, l.word), h("span", {}, l.label),
        admin ? iconBtn(ICON.close, t.forget, async () => drawLearned((await this._call("forget", { word: l.word }, false)).learned)) : null)));
    };
    try { drawLearned((await this._call("learned", {}, false)).learned); } catch (e) { fill(learnedEl, t.error); }
  }
}

/* Visueller Editor für den Dashboard-Karten-Dialog */
class SmartListsCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._build(); }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _build() {
    if (!this._form) {
      const b = (name) => ({ name, selector: { boolean: {} } });
      const section = (title, icon, schema, expanded = false) => ({ type: "expandable", name: "", flatten: true, title, icon, expanded, schema });
      const LABELS = {
        entity: "Liste", title: "Titel (leer = Name der Liste)", sort: "Standard-Sortierung",
        show_header: "Kopfzeile anzeigen", show_count: "Anzahl offen / Treffer", show_search: "Suche (Lupe)",
        show_sort: "Sortier-Auswahl", show_shopping: "Einkaufsmodus-Knopf", show_undo: "Rückgängig (↶)",
        show_import: "Import-Knopf", show_settings: "Zahnrad (persönliche Einstellungen)",
        show_add: "Eingabefeld zum Hinzufügen", show_frequent: "„Häufig gekauft“",
        show_stepper: "Mengen-Stepper (− +)", show_offer: "Angebote aus der App (Markt, Preis, gültig bis)", show_tags: "Badges (@Markt, *Person, #Schlagwort)",
        show_source: "Herkunft (Quell-Liste / Person)", show_note: "Notizen", show_category_titles: "Kategorie-Überschriften",
        compact: "Kompakte Zeilen", max_height: "Maximale Höhe der Liste (px, leer = unbegrenzt)",
        show_completed: "Erledigte anzeigen", collapse_completed: "Erledigte anfangs zugeklappt",
        start_shopping: "Im Einkaufsmodus starten",
      };
      const HELP = {
        show_settings: "Geste, Menü und Einkaufsmodus-Verhalten stellt jeder Benutzer für sich im Zahnrad ein.",
        show_category_titles: "Aus: nach Kategorie sortiert, aber als eine Liste mit Kategorie-Symbol vorne.",
        start_shopping: "Praktisch für ein Tablet in der Küche oder ein Dashboard nur fürs Einkaufen.",
      };
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => LABELS[s.name] || s.name;
      this._form.computeHelper = (s) => HELP[s.name];
      this._form.schema = [
        { name: "entity", required: true, selector: { entity: { domain: "todo" } } },
        { name: "title", selector: { text: {} } },
        { name: "sort", selector: { select: { mode: "dropdown", options: [
          { value: "category", label: "Nach Kategorie" }, { value: "alpha", label: "A–Z" },
          { value: "added", label: "Reihenfolge des Hinzufügens" }, { value: "list", label: "Nach Quell-Liste (kombiniert)" }] } } },
        section("Kopfzeile", "mdi:page-layout-header",
          [b("show_header"), b("show_count"), b("show_search"), b("show_sort"), b("show_shopping"), b("show_undo"), b("show_import"), b("show_settings")]),
        section("Eingabe", "mdi:plus-box-outline", [b("show_add"), b("show_frequent")]),
        section("Liste", "mdi:format-list-bulleted",
          [b("show_stepper"), b("show_offer"), b("show_tags"), b("show_source"), b("show_note"), b("show_category_titles"), b("compact"),
            { name: "max_height", selector: { number: { min: 150, max: 2000, step: 50, mode: "box", unit_of_measurement: "px" } } }]),
        section("Erledigte", "mdi:check-all", [b("show_completed"), b("collapse_completed")]),
        section("Einkaufsmodus", "mdi:cart-outline", [b("start_shopping")]),
      ];
      this._form.addEventListener("value-changed", (e) => {
        // nur Abweichungen vom Standard speichern → schlankes YAML
        const cfg = { ...e.detail.value };
        for (const [k, v] of Object.entries(CARD_DEFAULTS)) if (cfg[k] === v) delete cfg[k];
        if (cfg.max_height === "" || cfg.max_height == null) delete cfg.max_height;
        if (!cfg.title) delete cfg.title;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { ...CARD_DEFAULTS, ...this._config };
  }
}

/* ------------------------------------------------------------------ */
/* Seitenleisten-Seite „SmartLists“ (von der Integration registriert)  */
/* ------------------------------------------------------------------ */
const PANEL_KEY = "smartlists-panel-list";
const PANEL_STYLE = `
  :host { display:block; min-height:100vh; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color); }
  .toolbar { display:flex; align-items:center; gap:4px; height:56px; padding:0 12px; box-sizing:border-box;
    background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, var(--text-primary-color,#fff));
    font-size:20px; position:sticky; top:0; z-index:3; }
  .toolbar .title { flex:1; margin-left:8px; }
  .toolbar button { background:none; border:none; color:inherit; width:40px; height:40px; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center; }
  .toolbar button:hover { background:rgba(255,255,255,.15); }
  .chips { display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px; scrollbar-width:none; max-width:760px; margin:0 auto; }
  .chip { flex:none; display:flex; align-items:center; gap:6px; border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff);
    border-radius:18px; padding:6px 12px; font:inherit; font-size:.9rem; cursor:pointer; color:var(--primary-text-color); white-space:nowrap; }
  .chip.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  .chip .n { font-size:.75rem; opacity:.75; }
  .content { max-width:760px; margin:0 auto; padding:8px 16px 32px; box-sizing:border-box; }
  .empty { text-align:center; padding:48px 16px; color:var(--secondary-text-color); }
`;

class SmartListsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = null;
    try { this._selected = localStorage.getItem(PANEL_KEY); } catch (e) { /* */ }
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
    if (this._card) this._card.hass = hass;
  }
  set narrow(v) { this._narrow = v; this._render(); }
  set panel(p) { this._panelInfo = p; }

  _lists() {
    const st = (this._hass && this._hass.states) || {};
    return Object.keys(st).filter((e) => e.startsWith("todo.") && st[e].state !== "unavailable")
      .map((e) => ({ e, name: st[e].attributes.friendly_name || e, open: Number(st[e].state) || 0,
        combined: Array.isArray(st[e].attributes.source_lists) }))
      // kombinierte zuerst, dann alphabetisch
      .sort((a, b) => (b.combined - a.combined) || a.name.localeCompare(b.name));
  }

  _render() {
    if (!this._hass) return;
    const lists = this._lists();
    if (!this._selected || !lists.some((l) => l.e === this._selected)) this._selected = lists.length ? lists[0].e : null;
    if (!this._root) {
      this._chipsEl = h("div", { class: "chips", role: "tablist" });
      this._contentEl = h("div", { class: "content" });
      this._menuBtn = h("button", { type: "button", "aria-label": "Menü", title: "Menü",
        onclick: () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })) }, svg(ICON_MENU, 24));
      this._root = h("div", {}, h("div", { class: "toolbar" }, this._menuBtn, h("span", { class: "title" }, "SmartLists")), this._chipsEl, this._contentEl);
      this.shadowRoot.replaceChildren(h("style", {}, PANEL_STYLE), this._root);
    }
    this._menuBtn.hidden = !this._narrow;
    fill(this._chipsEl, lists.map((l) => h("button", { type: "button", role: "tab", class: `chip ${l.e === this._selected ? "on" : ""}`,
      "aria-selected": String(l.e === this._selected), onclick: () => this._select(l.e) },
      l.name, h("span", { class: "n" }, String(l.open)))));
    if (!this._selected) {
      this._card = null;
      fill(this._contentEl, h("div", { class: "empty" }, "Keine To-do-Listen gefunden. Lege unter Einstellungen → Geräte & Dienste → SmartLists eine kombinierte Liste an."));
      return;
    }
    if (!this._card || this._cardEntity !== this._selected) {
      // je Liste eine frische Karte (eigene Live-Verbindung, eigener Eingabezustand)
      this._card = document.createElement("smartlists-card");
      this._card.setConfig({ entity: this._selected });
      this._cardEntity = this._selected;
      fill(this._contentEl, this._card);
      this._card.hass = this._hass;
    }
  }
  _select(entity) {
    this._selected = entity;
    try { localStorage.setItem(PANEL_KEY, entity); } catch (e) { /* */ }
    this._render();
  }
}
const ICON_MENU = "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";



/* Registrieren. Ist schon eine ÄLTERE Fassung geladen (z.B. eine alte Kopie als Dashboard-Ressource
 * oder über HACS als „Dashboard“), lässt sich das Element nicht neu definieren – dann werden die
 * Methoden der vorhandenen Klasse durch die neuen ersetzt, damit überall die aktuelle Karte läuft. */
function semverNewer(a, b) {
  const pa = String(a || "0").split("."), pb = String(b || "0").split(".");
  for (let i = 0; i < 3; i++) { const d = (Number(pa[i]) || 0) - (Number(pb[i]) || 0); if (d) return d > 0; }
  return false;
}
function defineOrUpgrade(tag, cls) {
  const existing = customElements.get(tag);
  if (!existing) { customElements.define(tag, cls); return "neu"; }
  if (existing === cls || !semverNewer(CARD_VERSION, existing.__smartlistsVersion)) return "vorhanden";
  for (const target of [existing.prototype, existing]) {
    const source = target === existing ? cls : cls.prototype;
    for (const name of Object.getOwnPropertyNames(source)) {
      if (["prototype", "length", "name", "constructor"].includes(name)) continue;
      Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    }
  }
  existing.__smartlistsVersion = CARD_VERSION;
  return "ersetzt";
}
for (const c of [SmartListsCard, SmartListsCardEditor, SmartListsPanel]) c.__smartlistsVersion = CARD_VERSION;
const _slResult = defineOrUpgrade("smartlists-card", SmartListsCard);
defineOrUpgrade("smartlists-card-editor", SmartListsCardEditor);
defineOrUpgrade("smartlists-panel", SmartListsPanel);
if (_slResult !== "vorhanden" || !(window.customCards || []).some((c) => c.type === "smartlists-card")) {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "smartlists-card")) {
    window.customCards.push({
      type: "smartlists-card",
      name: "SmartLists",
      description: "Einkaufsliste mit Kategorien, Vorschlägen, Mengen, Markt-Badges (@REWE) und Berechtigungen.",
      preview: false,
    });
  }
}
if (_slResult.startsWith("ersetzt")) {
  console.warn(`SmartLists: eine ältere Karten-Datei war schon geladen und wurde durch ${CARD_VERSION} ersetzt. `
    + "Bitte die alte Dashboard-Ressource bzw. den HACS-Eintrag vom Typ „Dashboard“ entfernen.");
}
console.info(`%c SmartLists %c ${CARD_VERSION} `, "background:#1747B5;color:#fff;border-radius:3px 0 0 3px", "background:#3E7BFA;color:#fff;border-radius:0 3px 3px 0");

