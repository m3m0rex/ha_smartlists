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
const CARD_VERSION = "2.5.0";
const SORT_MODES = ["category", "alpha", "added", "list"];
// Darstellung pro Karte (Lovelace-Editor). Persönliche Bedienung steht dagegen in UI_DEFAULTS.
const CARD_DEFAULTS = {
  sort: "category",
  show_header: true, show_count: true, show_search: true, show_sort: true, show_shopping: true,
  show_undo: true, show_import: true, show_settings: true,
  show_add: true, show_frequent: true,
  drag_drop: true, show_stepper: true, show_offer: true, show_tags: true, show_source: true, show_note: true, show_category_titles: true, compact: false,
  show_completed: true, collapse_completed: true,
  start_shopping: false,
  // Ansicht & Aussehen
  view: "list",            // list | tiles | mini
  layout: "tabs",          // bei mehreren Listen: tabs | columns | stack
  density: "normal",       // compact | normal | comfortable
  font_scale: 1, radius: null, accent_color: null,
  // feste Filter (leer = alles) und Filter-Leiste
  filter_store: "", filter_person: "", filter_tag: "", filter_category: [], filter_offers: false,
  filter_tags_new_items: true, show_filter_chips: false,
};
// Gleiche Kategorien wie categories.py (Reihenfolge = Sortierung)
const CATEGORY_DEFS = [
  ["obst_gemuese", "🥬", {"de": "Obst & Gemüse", "en": "Fruit & veg", "fr": "Fruits & légumes", "es": "Frutas y verduras", "it": "Frutta e verdura", "pl": "Owoce i warzywa"}],
  ["fleisch", "🥩", {"de": "Fleisch- & Fischtheke", "en": "Meat & fish", "fr": "Viande & poisson", "es": "Carne y pescado", "it": "Carne e pesce", "pl": "Mięso i ryby"}],
  ["kuehlung", "🥛", {"de": "Kühlung", "en": "Chilled & dairy", "fr": "Frais & produits laitiers", "es": "Refrigerados y lácteos", "it": "Freschi e latticini", "pl": "Nabiał i chłodzone"}],
  ["grundnahrung", "🥫", {"de": "Konserven & Trockensortiment", "en": "Pantry & tins", "fr": "Épicerie & conserves", "es": "Despensa y conservas", "it": "Dispensa e scatolame", "pl": "Spiżarnia i konserwy"}],
  ["backwaren", "🍞", {"de": "Brot & Backwaren", "en": "Bread & bakery", "fr": "Pain & boulangerie", "es": "Pan y bollería", "it": "Pane e prodotti da forno", "pl": "Pieczywo"}],
  ["getraenke", "🥤", {"de": "Getränke", "en": "Drinks", "fr": "Boissons", "es": "Bebidas", "it": "Bevande", "pl": "Napoje"}],
  ["suessigkeiten", "🍫", {"de": "Süßwaren & Snacks", "en": "Sweets & snacks", "fr": "Confiserie & snacks", "es": "Dulces y snacks", "it": "Dolci e snack", "pl": "Słodycze i przekąski"}],
  ["haushalt", "🧹", {"de": "Haushalt", "en": "Household", "fr": "Entretien", "es": "Hogar y limpieza", "it": "Casa e pulizia", "pl": "Chemia domowa"}],
  ["drogerie", "🧴", {"de": "Drogerie", "en": "Personal care", "fr": "Hygiène & beauté", "es": "Higiene y belleza", "it": "Igiene e bellezza", "pl": "Drogeria"}],
  ["tiefkuehl", "❄️", {"de": "Tiefkühl", "en": "Frozen", "fr": "Surgelés", "es": "Congelados", "it": "Surgelati", "pl": "Mrożonki"}],
  ["tierbedarf", "🐕", {"de": "Tierbedarf", "en": "Pets", "fr": "Animaux", "es": "Mascotas", "it": "Animali", "pl": "Zwierzęta"}],
  ["sonstiges", "📦", {"de": "Sonstiges", "en": "Other", "fr": "Autres", "es": "Otros", "it": "Altro", "pl": "Inne"}],
];
const categoryOptions = (lang) => CATEGORY_DEFS.map(([id, emoji, names]) => [id, `${emoji} ${names[lang] || names.en}`]);
// Vorlagen für den Editor: setzen viele Optionen auf einmal, danach ist alles einzeln änderbar
const PRESETS = {
  family:    { values: { view: "list", density: "normal", show_filter_chips: true, show_add: true, show_frequent: true, show_stepper: true, show_import: true } },
  kitchen:   { values: { view: "tiles", density: "comfortable", font_scale: 1.2, show_import: false, show_undo: true, show_settings: false } },
  store:     { values: { view: "list", start_shopping: true, show_add: false, show_frequent: false, show_import: false, density: "comfortable" } },
  readonly:  { values: { show_add: false, show_frequent: false, show_stepper: false, show_import: false, show_settings: false, show_undo: false, show_shopping: false } },
  tile:      { values: { view: "mini", density: "compact", show_frequent: false, show_import: false } },
};
const MENU_ACTIONS = ["rename", "move", "copy", "category", "delete"];
// Vorlage für eigene Keyword-Packs (Kategorie-IDs siehe CATEGORY_DEFS; "products" ist optional)
const PACK_TEMPLATE = {
  name: "My pack", language: "en", version: 1,
  terms: { "oat milk": "kuehlung", "sourdough": "backwaren", "dish soap": "haushalt", "kombucha": "getraenke" },
  products: [["Oat milk", "l", "kuehlung"], ["Sourdough bread", "", "backwaren"]],
  _help: "terms: keyword → category id. Longest matching keyword wins; packs higher in the list win on equal keywords. Category ids: obst_gemuese, fleisch, kuehlung, grundnahrung, backwaren, getraenke, suessigkeiten, haushalt, drogerie, tiefkuehl, tierbedarf, sonstiges. The app format (category_pack_v2.json) is accepted too.",
};
// Bedienung: Standard < Einstellung des HA-Benutzers (in der Integration gespeichert, gilt auf allen
// seinen Geräten) < optional abweichend nur für dieses Gerät (Browser-Speicher). Bewusst NICHT in der
// Dashboard-/Lovelace-Konfiguration, weil jeder Benutzer das für sich einstellen soll.
const UI_DEFAULTS = {
  press_gesture: "long", press_target: "row", press_result: "menu", menu_actions: MENU_ACTIONS, row_buttons: true,
  shop_hide_checked: true, shop_keep_awake: true, shop_large: true, shop_tap_row: true,
  shop_auto_store: true, shop_untagged: false,
};
// Notizlisten der App: keine Kategorien/Einkaufsfunktionen (nur wenn in der Karte nicht anders eingestellt)
const NOTES_DEFAULTS = { sort: "added", show_category_titles: false, show_frequent: false, show_shopping: false, show_stepper: false, show_import: false, show_filter_chips: false };
// Erkennung wie notes.py (für Auswahlfelder, ohne Rückfrage bei der Integration)
const isNotesEntity = (id, name) => /^todo\.(ha_smartlists_note|notiz_)/i.test(id) || /^ha smartlists notes/i.test(String(name || "").trim());
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
    tab_me: "Für mich", tab_house: "Haushalt", tab_list: "Diese Liste", ui_me_help: "Gilt für dich. Abweichungen vom Haushalts-Standard sind mit • markiert.",
    ui_house: "Bedienung – Standard für alle", reset_default: "Auf Standard zurücksetzen", about_list: "Über diese Liste", type: "Typ", entity: "Entität", sources: "Quellen",
    type_combined: "Kombinierte Liste", type_own: "Eigene SmartLists-Liste", type_list: "To-do-Liste aus Home Assistant", char: "Zeichen", kind: "Art",
    no_hits_short: "Nichts gefunden.", by_hand: "von Hand", search_learned: "Suchen … (z. B. milch)",
    automation: "Sprache & Automationen", automation_help: "Assist und fällige Artikel. Blueprints für „Bin im Laden“ und Markt-Erinnerung: siehe Wiki.",
    auto_voice_default_list: "Standard-Liste für Assist", auto_voice_help: "Wenn man im Satz keine Liste nennt.",
    auto_auto_due_list: "Fällige Artikel automatisch auf", auto_due_help: "Stündlich, nach eurem Kaufrhythmus. „—“ = aus.",
    install_sentences: "Assist-Sätze installieren", sentences_installed: "installiert",
    devices: "Verbundene Geräte", devices_help: "Handys mit der HA-SmartLists-App. ⚠️ = über 7 Tage nicht abgeglichen. Zugang sperren: Token im Profil löschen.",
    no_devices: "Noch kein Handy verbunden.", remove_device: "Aus der Liste nehmen", last_seen: "zuletzt",
    role_all: "alle Rechte", admin_always: "Admin – darf immer alles", shop_large_help: "Leichter mit dem Daumen zu treffen",
    new_list_help: "Du bist Besitzer und kannst sie danach für andere freigeben.", new_list_placeholder: "z. B. Drogerie", create: "Anlegen",
    p_columns: "Mehrere Listen nebeneinander", p_wide: "Breite Ansicht", p_settings: "Einstellungen", p_back: "Zurück zu den Listen",
    p_hint: "Listen antippen, um sie nebeneinander zu zeigen (mehr als 3 werden umgebrochen). Artikel mit der Maus in eine andere Liste ziehen = verschieben (Strg = kopieren).",
    p_empty: "Keine To-do-Listen gefunden. Lege unter Einstellungen → Geräte & Dienste → SmartLists eine Liste an – oder oben mit +.",
    owner: "Besitzer", shared: "geteilt", private: "privat", admin: "Admin", sharing: "Freigaben",
    sharing_help: "Wer diese Liste sehen und ändern darf. Admins dürfen immer alles. Die To-do-Ansicht von HA zeigt jede Liste allen – ausgeblendet wird sie nur in SmartLists (Karte, Seite, App).",
    role_none: "kein Zugriff", role_viewer: "sehen", role_checker: "abhaken", role_editor: "bearbeiten", role_owner: "Besitzer",
    no_users: "Keine weiteren Benutzer in Home Assistant.", delete_list: "Liste löschen", confirm_delete_list: "Diese Liste mit allen Artikeln löschen?",
    new_list: "Neue Liste", new_list_prompt: "Name der neuen Liste:",
    due_every: "fällig – kauft ihr etwa alle", days: "Tage", backup: "Sichern & übertragen",
    backup_help: "Gemerkte Kategorien, Verlauf, Namenskonvention und Bedienung als Datei – z. B. für eine zweite HA-Instanz. Import ergänzt, ohne Vorhandenes zu löschen.",
    export: "Exportieren", import: "Importieren …",
    mini_open: "Liste öffnen", mini_close: "Zuklappen", card_version: "Karte", stale_card: "Die Karte ist veraltet – Seite neu laden (Strg+F5) bzw. in der App den Frontend-Cache leeren.", offer: "Angebot", offer_until: "bis", offer_expired: "abgelaufen seit",
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
    press_gesture: "Geste für das Artikel-Menü", g_long: "Lange drücken", g_double: "Doppelklick", g_right: "Rechtsklick", g_off: "Aus",
    press_target: "Wo die Geste greift", t_row: "Ganze Zeile", t_name: "Nur auf den Namen",
    press_result: "Was die Geste macht", r_menu: "Menü öffnen", r_edit: "Direkt bearbeiten", r_delete: "Löschen (mit Nachfrage)",
    menu_actions: "Einträge im Menü", row_buttons: "Stift und Papierkorb in der Zeile zeigen",
    shop: "Einkaufsmodus", shop_hide_checked: "Abgehakte ausblenden", shop_keep_awake: "Bildschirm anlassen",
    shop_large: "Große Zeilen", shop_tap_row: "Ganze Zeile antippen zum Abhaken", reset: "Zurücksetzen",
    sort: "Sortierung", sort_category: "Kategorie", sort_alpha: "A–Z", sort_added: "Hinzugefügt", sort_list: "Nach Liste",
    packs: "Kategorie-Erkennung (Keyword-Packs)", packs_help: "Stichwörter → Kategorie. Mehrere Packs gleichzeitig möglich (z. B. Deutsch + eigenes). Bei gleichem Stichwort gewinnt das Pack weiter oben. Gemerkte Kategorien haben immer Vorrang.",
    pack_terms: "Stichwörter", pack_products: "Produkte", pack_builtin: "eingebaut", pack_custom: "eigenes", pack_priority: "Rang",
    pack_up: "Nach oben (Vorrang)", pack_download: "Herunterladen", pack_delete: "Eigenes Pack löschen?", pack_bad_json: "Datei ist kein gültiges JSON.",
    pack_upload: "Pack hochladen …", pack_name_help: "Name für das Pack. Gleicher Name ersetzt ein vorhandenes eigenes Pack.", pack_add: "Hinzufügen",
    pack_skipped: "übersprungen (unbekannte Kategorie)", pack_template: "Vorlage",
    card_desc: "Einkaufsliste mit Kategorien, Vorschlägen, Mengen, Markt-Badges (@REWE) und Berechtigungen.",
    imp_placeholder: "- Milch 2 l @REWE\n- [ ] Brot\n- [x] Butter\n3 Äpfel",
    e_preset_pick: "— Vorlage wählen (setzt mehrere Optionen) —", e_view_list: "Liste", e_view_tiles: "Kacheln (z. B. Küchen-Tablet)", e_view_mini: "Mini-Kachel (Zusammenfassung, aufklappbar)",
    e_sort_category: "Nach Kategorie", e_sort_added: "Reihenfolge des Hinzufügens", e_sort_list: "Nach Quell-Liste (kombiniert)",
    e_layout_tabs: "Reiter", e_layout_columns: "Nebeneinander", e_layout_stack: "Untereinander",
    e_density_compact: "Kompakt", e_density_normal: "Normal", e_density_comfortable: "Groß (Touch)",
    e_sec_multi: "Mehrere Listen in einer Karte", e_sec_filter: "Filter", e_sec_look: "Aussehen", e_sec_header: "Kopfzeile", e_sec_input: "Eingabe",
    e_sec_list: "Liste", e_sec_done: "Erledigte", e_sec_shop: "Einkaufsmodus",
    e_pre_family: "Familien-Einkauf (alles an)", e_pre_kitchen: "Küchen-Tablet (große Kacheln)", e_pre_store: "Im Laden (Einkaufsmodus, ohne Eingabe)",
    e_pre_readonly: "Nur ansehen", e_pre_tile: "Kompakte Dashboard-Kachel",
    l_preset: "Vorlage", l_entity: "Liste", l_entities: "Listen (statt „Liste“ oben)", l_layout: "Anordnung", l_title: "Titel (leer = Name der Liste)",
    l_view: "Ansicht", l_sort: "Standard-Sortierung", l_advanced: "Erweiterte Optionen anzeigen",
    l_filter_store: "Nur Markt (z. B. REWE; mehrere mit Komma)", l_filter_person: "Nur Person (z. B. Anna)", l_filter_tag: "Nur Schlagwort (z. B. bio)",
    l_filter_category: "Nur Kategorien", l_filter_offers: "Nur Angebote", l_filter_tags_new_items: "Neue Artikel bekommen den Filter-Tag (@REWE …)",
    l_show_filter_chips: "Filter-Leiste (Märkte, Personen, Angebote antippen)",
    l_density: "Zeilenhöhe", l_font_scale: "Schriftgröße", l_radius: "Eckenradius", l_accent_color: "Akzentfarbe (leer = Theme)",
    l_show_header: "Kopfzeile anzeigen", l_show_count: "Anzahl offen / Treffer", l_show_search: "Suche (Lupe)",
    l_show_sort: "Sortier-Auswahl", l_show_shopping: "Einkaufsmodus-Knopf", l_show_undo: "Rückgängig (↶)",
    l_show_import: "Import-Knopf", l_show_settings: "Zahnrad (persönliche Einstellungen)",
    l_show_add: "Eingabefeld zum Hinzufügen", l_show_frequent: "„Häufig gekauft“",
    l_drag_drop: "Ziehen & Ablegen (Maus): in andere Liste verschieben, Reihenfolge ändern", l_show_stepper: "Mengen-Stepper (− +)", l_show_offer: "Angebote aus der App (Markt, Preis, gültig bis)",
    l_show_tags: "Badges (@Markt, *Person, #Schlagwort)", l_show_source: "Herkunft (Quell-Liste / Person)", l_show_note: "Notizen",
    l_show_category_titles: "Kategorie-Überschriften", l_max_height: "Maximale Höhe der Liste (leer = unbegrenzt)",
    l_show_completed: "Erledigte anzeigen", l_collapse_completed: "Erledigte anfangs zugeklappt", l_start_shopping: "Im Einkaufsmodus starten",
    hh_preset: "Setzt passende Optionen auf einmal – danach ist alles einzeln änderbar.",
    hh_entities: "Mehrere Listen: als Reiter, nebeneinander oder untereinander. Alle Optionen gelten für jede Liste.",
    hh_filter_tags_new_items: "Sonst wären neue Artikel in einer gefilterten Karte gleich wieder unsichtbar.",
    hh_show_settings: "Geste, Menü und Einkaufsmodus stellt jeder Benutzer für sich im Zahnrad ein.",
    hh_show_category_titles: "Aus: nach Kategorie sortiert, aber als eine Liste mit Kategorie-Symbol vorne.",
    hh_start_shopping: "Praktisch für ein Tablet im Flur oder ein Dashboard nur fürs Einkaufen.",
    shop_auto_store: "Markt automatisch nach Zone wählen", shop_auto_store_help: "Bist du in der Zone eines Marktes (z. B. REWE), zeigt der Einkaufsmodus nur dessen Artikel.",
    shop_untagged: "Artikel ohne Markt auch zeigen", shop_untagged_help: "Im Einkaufsmodus für einen Markt zusätzlich alles ohne @Markt.",
    shop_store: "Markt", shop_all_stores: "Alle",
    pack_edit: "Stichwörter bearbeiten", pack_new: "Neues Pack", pack_new_help: "Leeres Pack, z. B. für eine weitere Sprache oder eigene Begriffe. Es wird ganz oben aktiviert.", pack_new_placeholder: "z. B. Nederlands",
    pack_empty: "Noch keine Stichwörter – oben hinzufügen.", pack_changed: "geändert", pack_revert: "Änderung zurücknehmen", pack_ignore: "Ignorieren (als Sonstiges)",
    pack_more: "Mehr laden", pack_term_placeholder: "Stichwort (mehrere mit Komma)",
    pack_builtin_edit_help: "Eingebautes Pack: Änderungen landen im Ergänzungs-Pack „+“ und bleiben bei Updates erhalten.", pack_edit_help: "Eigenes Pack: Änderungen gelten sofort.",
    zone: "Zone", zone_new: "Neue Zone", zone_new_help: "Name der Zone. Position: aktueller Standort dieses Geräts (sonst Zuhause), Radius 100 m – feinjustieren unter Einstellungen → Bereiche & Zonen.",
    zone_wait: "Zone angelegt – erscheint gleich, dann hier verknüpfen.", zone_here: "Standort dieses Geräts", zone_home: "Position von Zuhause – bitte anpassen",
    zone_none: "keine Zone", zone_manage: "Zonen verwalten ↗", store_add: "Markt mit Zone", store_add_help: "Name des Marktes, wie in @REWE. Danach wird eine Zone dafür angelegt.",
    stores: "Märkte & Zonen", stores_help: "Verknüpfe Märkte mit Zonen von Home Assistant. Im Einkaufsmodus siehst du dann automatisch nur die Artikel des Marktes, in dem du gerade bist.",
    notes: "Notizen der App", notes_help: "Die HA-SmartLists-App speichert Notizen als eigene To-do-Liste. Sie sind keine Einkaufslisten und deshalb standardmäßig ausgeblendet.",
    notes_show: "In SmartLists zeigen", notes_show_help: "Als eigener Bereich 📝 auf der Seite – nicht bei Assist, Diensten und kombinierten Listen.",
    notes_scope: "Wer sieht Notizen", notes_scope_owner: "nur das eigene Konto", notes_scope_household: "der ganze Haushalt",
    notes_lists: "Notizlisten und Besitzer", notes_none: "Keine Notizliste der App gefunden.", notes_no_owner: "unbekannt (nur Admins)",
    p_order: "Reihenfolge ändern", p_order_hint: "◀ ▶ verschiebt eine Liste. Mit der Maus: Chip auf einen anderen ziehen. Die Reihenfolge gilt auch für die Spalten.",
    p_left: "Nach links", p_right: "Nach rechts",
    look: "Badges & Farben", look_help: "Aussehen der Badges für den ganzen Haushalt. Farben und Namen der Märkte gelten auch in der App. Leer bzw. ↺ = Standard.",
    look_style: "Stil", look_filled: "gefüllt", look_soft: "dezent", look_outline: "Rahmen", look_text: "nur Text",
    look_color: "Farbe", look_icon: "Symbol davor", look_label: "Anzeigename", look_kinds: "Je Art", look_values: "Einzelne Badges",
    look_search: "Badge suchen … (z. B. rewe)", look_more: "Weitere über die Suche finden.", look_add: "Badge einfärben",
    look_add_help: "Mit Zeichen davor, z. B. @Kaufland, *Max oder #vegan – auch wenn es noch nicht benutzt wurde.",
    zone_count: "Zonen", zone_unlink: "Zone lösen", zone_add: "Zone",
    app_list: "kombinierte Liste der App", app_list_connected: "verbunden", app_list_connect: "Verbinden",
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
    tab_me: "For me", tab_house: "Household", tab_list: "This list", ui_me_help: "Applies to you. Differences from the household default are marked •.",
    ui_house: "Controls – default for everyone", reset_default: "Reset to default", about_list: "About this list", type: "Type", entity: "Entity", sources: "Sources",
    type_combined: "Combined list", type_own: "Own SmartLists list", type_list: "Home Assistant to-do list", char: "Character", kind: "Kind",
    no_hits_short: "Nothing found.", by_hand: "by hand", search_learned: "Search … (e.g. milk)",
    automation: "Voice & automations", automation_help: "Assist and due items. Blueprints for “I'm at the store” and store reminders: see the wiki.",
    auto_voice_default_list: "Default list for Assist", auto_voice_help: "Used when a sentence names no list.",
    auto_auto_due_list: "Automatically add due items to", auto_due_help: "Hourly, by your buying rhythm. “—” = off.",
    install_sentences: "Install Assist sentences", sentences_installed: "installed",
    devices: "Connected devices", devices_help: "Phones with the HA SmartLists app. ⚠️ = not synced for 7+ days. To revoke access, delete the token in the profile.",
    no_devices: "No phone connected yet.", remove_device: "Remove from list", last_seen: "last seen",
    role_all: "all rights", admin_always: "Admin – can always do everything", shop_large_help: "Easier to hit with your thumb",
    new_list_help: "You are the owner and can share it with others afterwards.", new_list_placeholder: "e.g. Drugstore", create: "Create",
    p_columns: "Several lists side by side", p_wide: "Wide layout", p_settings: "Settings", p_back: "Back to the lists",
    p_hint: "Tap lists to show them side by side (more than 3 wrap into rows). Drag items with the mouse into another list to move them (Ctrl = copy).",
    p_empty: "No to-do lists found. Add one under Settings → Devices & services → SmartLists – or with + above.",
    owner: "owner", shared: "shared", private: "private", admin: "admin", sharing: "Sharing",
    sharing_help: "Who may see and change this list. Admins can always do everything. HA's to-do view shows every list to everyone – it is hidden only in SmartLists (card, page, app).",
    role_none: "no access", role_viewer: "view", role_checker: "check off", role_editor: "edit", role_owner: "owner",
    no_users: "No other users in Home Assistant.", delete_list: "Delete list", confirm_delete_list: "Delete this list with all items?",
    new_list: "New list", new_list_prompt: "Name of the new list:",
    due_every: "due – you buy it about every", days: "days", backup: "Backup & transfer",
    backup_help: "Remembered categories, history, naming convention and controls as a file – e.g. for a second HA instance. Import adds without deleting anything.",
    export: "Export", import: "Import …",
    mini_open: "Open list", mini_close: "Collapse", card_version: "card", stale_card: "This card is outdated – reload the page (Ctrl+F5) or clear the frontend cache in the app.", offer: "Offer", offer_until: "until", offer_expired: "expired",
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
    press_gesture: "Gesture for the item menu", g_long: "Long press", g_double: "Double click", g_right: "Right click", g_off: "Off",
    press_target: "Where the gesture works", t_row: "Whole row", t_name: "Name only",
    press_result: "What the gesture does", r_menu: "Open menu", r_edit: "Edit directly", r_delete: "Delete (with confirmation)",
    menu_actions: "Menu entries", row_buttons: "Show pencil and bin in the row",
    shop: "Shopping mode", shop_hide_checked: "Hide checked items", shop_keep_awake: "Keep screen on",
    shop_large: "Large rows", shop_tap_row: "Tap whole row to check", reset: "Reset",
    sort: "Sort", sort_category: "Category", sort_alpha: "A–Z", sort_added: "Added", sort_list: "By list",
    packs: "Category detection (keyword packs)", packs_help: "Keywords → category. Several packs can be active at once (e.g. English + your own). On equal keywords the pack higher up wins. Remembered categories always take precedence.",
    pack_terms: "keywords", pack_products: "products", pack_builtin: "built-in", pack_custom: "custom", pack_priority: "rank",
    pack_up: "Move up (precedence)", pack_download: "Download", pack_delete: "Delete custom pack?", pack_bad_json: "File is not valid JSON.",
    pack_upload: "Upload pack …", pack_name_help: "Name for the pack. The same name replaces an existing custom pack.", pack_add: "Add",
    pack_skipped: "skipped (unknown category)", pack_template: "Template",
    card_desc: "Shopping list with categories, suggestions, quantities, store badges (@REWE) and permissions.",
    imp_placeholder: "- Milk 2 l @REWE\n- [ ] Bread\n- [x] Butter\n3 apples",
    e_preset_pick: "— Choose a preset (sets several options) —", e_view_list: "List", e_view_tiles: "Tiles (e.g. kitchen tablet)", e_view_mini: "Mini tile (summary, expandable)",
    e_sort_category: "By category", e_sort_added: "Order added", e_sort_list: "By source list (combined)",
    e_layout_tabs: "Tabs", e_layout_columns: "Side by side", e_layout_stack: "Stacked",
    e_density_compact: "Compact", e_density_normal: "Normal", e_density_comfortable: "Large (touch)",
    e_sec_multi: "Several lists in one card", e_sec_filter: "Filters", e_sec_look: "Appearance", e_sec_header: "Header", e_sec_input: "Input",
    e_sec_list: "List", e_sec_done: "Completed", e_sec_shop: "Shopping mode",
    e_pre_family: "Family shopping (everything on)", e_pre_kitchen: "Kitchen tablet (large tiles)", e_pre_store: "In the store (shopping mode, no input)",
    e_pre_readonly: "View only", e_pre_tile: "Compact dashboard tile",
    l_preset: "Preset", l_entity: "List", l_entities: "Lists (instead of “List” above)", l_layout: "Layout", l_title: "Title (empty = list name)",
    l_view: "View", l_sort: "Default sort", l_advanced: "Show advanced options",
    l_filter_store: "Only store (e.g. REWE; several separated by commas)", l_filter_person: "Only person (e.g. Anna)", l_filter_tag: "Only tag (e.g. organic)",
    l_filter_category: "Only categories", l_filter_offers: "Only offers", l_filter_tags_new_items: "New items get the filter tag (@REWE …)",
    l_show_filter_chips: "Filter bar (tap stores, people, offers)",
    l_density: "Row height", l_font_scale: "Font size", l_radius: "Corner radius", l_accent_color: "Accent colour (empty = theme)",
    l_show_header: "Show header", l_show_count: "Open count / matches", l_show_search: "Search (magnifier)",
    l_show_sort: "Sort picker", l_show_shopping: "Shopping mode button", l_show_undo: "Undo (↶)",
    l_show_import: "Import button", l_show_settings: "Gear (personal settings)",
    l_show_add: "Input field for adding", l_show_frequent: "“Frequently bought”",
    l_drag_drop: "Drag & drop (mouse): move to another list, reorder", l_show_stepper: "Quantity stepper (− +)", l_show_offer: "Offers from the app (store, price, valid until)",
    l_show_tags: "Badges (@store, *person, #tag)", l_show_source: "Origin (source list / person)", l_show_note: "Notes",
    l_show_category_titles: "Category headings", l_max_height: "Maximum list height (empty = unlimited)",
    l_show_completed: "Show completed", l_collapse_completed: "Completed collapsed at first", l_start_shopping: "Start in shopping mode",
    hh_preset: "Sets matching options at once – afterwards everything can be changed individually.",
    hh_entities: "Several lists: as tabs, side by side or stacked. All options apply to every list.",
    hh_filter_tags_new_items: "Otherwise new items would disappear right away in a filtered card.",
    hh_show_settings: "Gesture, menu and shopping mode are set by each user in the gear menu.",
    hh_show_category_titles: "Off: sorted by category, but as one list with the category icon in front.",
    hh_start_shopping: "Handy for a tablet in the hallway or a dashboard just for shopping.",
    shop_auto_store: "Pick store by zone automatically", shop_auto_store_help: "When you are in a store's zone (e.g. REWE), shopping mode shows only its items.",
    shop_untagged: "Also show items without a store", shop_untagged_help: "In shopping mode for one store, additionally everything without @store.",
    shop_store: "Store", shop_all_stores: "All",
    pack_edit: "Edit keywords", pack_new: "New pack", pack_new_help: "Empty pack, e.g. for another language or your own terms. It is activated at the top.", pack_new_placeholder: "e.g. Nederlands",
    pack_empty: "No keywords yet – add some above.", pack_changed: "changed", pack_revert: "Revert change", pack_ignore: "Ignore (as Other)",
    pack_more: "Load more", pack_term_placeholder: "Keyword (several with commas)",
    pack_builtin_edit_help: "Built-in pack: changes go into the add-on pack “+” and survive updates.", pack_edit_help: "Custom pack: changes apply immediately.",
    zone: "Zone", zone_new: "New zone", zone_new_help: "Name of the zone. Position: this device's current location (otherwise home), radius 100 m – fine-tune under Settings → Areas & zones.",
    zone_wait: "Zone created – it appears in a moment, then link it here.", zone_here: "this device's location", zone_home: "home position – please adjust",
    zone_none: "no zone", zone_manage: "Manage zones ↗", store_add: "Store with zone", store_add_help: "Name of the store, as in @REWE. A zone is created for it next.",
    stores: "Stores & zones", stores_help: "Link stores to Home Assistant zones. In shopping mode you then automatically see only the items of the store you are in.",
    notes: "App notes", notes_help: "The HA SmartLists app stores notes as a to-do list of its own. They are not shopping lists and are therefore hidden by default.",
    notes_show: "Show in SmartLists", notes_show_help: "As a separate 📝 section on the page – not in Assist, actions or combined lists.",
    notes_scope: "Who sees notes", notes_scope_owner: "own account only", notes_scope_household: "the whole household",
    notes_lists: "Note lists and owners", notes_none: "No note list of the app found.", notes_no_owner: "unknown (admins only)",
    p_order: "Change order", p_order_hint: "◀ ▶ moves a list. With the mouse: drag a chip onto another. The order also applies to the columns.",
    p_left: "Move left", p_right: "Move right",
    look: "Badges & colours", look_help: "How badges look for the whole household. Store colours and names also apply in the app. Empty or ↺ = default.",
    look_style: "Style", look_filled: "filled", look_soft: "subtle", look_outline: "outline", look_text: "text only",
    look_color: "Colour", look_icon: "Symbol in front", look_label: "Display name", look_kinds: "Per kind", look_values: "Individual badges",
    look_search: "Search badge … (e.g. rewe)", look_more: "Find more via search.", look_add: "Colour a badge",
    look_add_help: "With its character, e.g. @Kaufland, *Max or #vegan – even if not used yet.",
    zone_count: "zones", zone_unlink: "Unlink zone", zone_add: "Zone",
    app_list: "combined list of the app", app_list_connected: "connected", app_list_connect: "Connect",
  },
  fr: {
    add_placeholder: "p. ex. 2 kg pommes @Carrefour", note: "Note", save: "Enregistrer", cancel: "Annuler",
    done: "Terminé", clear: "Supprimer les terminés", own: "Liste propre", combined: "Combinée", foreign: "Externe",
    empty: "Rien à acheter 🎉", no_add: "L'ajout est désactivé pour cette liste.", open: "à faire",
    confirm_delete: "Supprimer vraiment cet article ?", confirm_clear: "Supprimer tous les articles terminés ?",
    error: "Erreur", loading: "Chargement …", readonly: "Lecture seule", delete: "Supprimer", edit: "Modifier",
    frequent: "Achetés souvent", src_manual: "mémorisé", src_learned: "appris", src_pack: "automatique", src_fallback: "inconnu",
    unit_hint: "unité habituelle", category: "Catégorie", settings: "Paramètres", naming: "Convention de nommage",
    naming_help: "Un caractère devant un mot en fait un badge. S'applique à toutes les listes et à tous les appareils.",
    kind_store: "Magasin", kind_person: "Personne", kind_tag: "Mot-clé", add_rule: "Ajouter une règle", example: "Exemple",
    learned: "Catégories mémorisées", learned_help: "Créées quand tu choisis une catégorie à la main.", forget: "Oublier",
    none_learned: "Rien de mémorisé pour l'instant.", saved: "Enregistré", admin_only: "Seuls les administrateurs peuvent modifier ceci.",
    in_list: "déjà sur la liste",
    tab_me: "Pour moi", tab_house: "Foyer", tab_list: "Cette liste", ui_me_help: "S'applique à toi. Les écarts par rapport au réglage du foyer sont marqués •.",
    ui_house: "Commandes – réglage par défaut pour tous", reset_default: "Rétablir les valeurs par défaut", about_list: "À propos de cette liste", type: "Type", entity: "Entité", sources: "Sources",
    type_combined: "Liste combinée", type_own: "Liste SmartLists propre", type_list: "Liste de tâches Home Assistant", char: "Caractère", kind: "Type",
    no_hits_short: "Aucun résultat.", by_hand: "à la main", search_learned: "Rechercher … (p. ex. lait)",
    automation: "Voix & automatisations", automation_help: "Assist et articles à racheter. Blueprints « Je suis au magasin » et rappel de magasin : voir le wiki.",
    auto_voice_default_list: "Liste par défaut pour Assist", auto_voice_help: "Utilisée quand la phrase ne cite aucune liste.",
    auto_auto_due_list: "Ajouter automatiquement les articles à racheter à", auto_due_help: "Toutes les heures, selon votre rythme d'achat. « — » = désactivé.",
    install_sentences: "Installer les phrases Assist", sentences_installed: "installées",
    devices: "Appareils connectés", devices_help: "Téléphones avec l'app HA SmartLists. ⚠️ = pas synchronisé depuis plus de 7 jours. Pour retirer l'accès, supprime le jeton dans le profil.",
    no_devices: "Aucun téléphone connecté.", remove_device: "Retirer de la liste", last_seen: "vu",
    role_all: "tous les droits", admin_always: "Admin – peut toujours tout faire", shop_large_help: "Plus facile à toucher avec le pouce",
    new_list_help: "Tu en es le propriétaire et peux la partager ensuite.", new_list_placeholder: "p. ex. Droguerie", create: "Créer",
    p_columns: "Plusieurs listes côte à côte", p_wide: "Affichage large", p_settings: "Paramètres", p_back: "Retour aux listes",
    p_hint: "Touche des listes pour les afficher côte à côte (au-delà de 3, elles passent à la ligne). Glisse un article à la souris vers une autre liste pour le déplacer (Ctrl = copier).",
    p_empty: "Aucune liste trouvée. Crée-en une sous Paramètres → Appareils et services → SmartLists – ou avec + en haut.",
    owner: "propriétaire", shared: "partagée", private: "privée", admin: "admin", sharing: "Partage",
    sharing_help: "Qui peut voir et modifier cette liste. Les admins peuvent toujours tout faire. La vue To-do de HA montre chaque liste à tout le monde – elle n'est masquée que dans SmartLists (carte, page, app).",
    role_none: "aucun accès", role_viewer: "voir", role_checker: "cocher", role_editor: "modifier", role_owner: "propriétaire",
    no_users: "Aucun autre utilisateur dans Home Assistant.", delete_list: "Supprimer la liste", confirm_delete_list: "Supprimer cette liste avec tous ses articles ?",
    new_list: "Nouvelle liste", new_list_prompt: "Nom de la nouvelle liste :",
    due_every: "à racheter – vous l'achetez environ tous les", days: "jours", backup: "Sauvegarder & transférer",
    backup_help: "Catégories mémorisées, historique, convention de nommage et commandes dans un fichier – p. ex. pour une deuxième instance HA. L'import ajoute sans rien supprimer.",
    export: "Exporter", import: "Importer …",
    mini_open: "Ouvrir la liste", mini_close: "Réduire", card_version: "carte", stale_card: "Cette carte est obsolète – recharge la page (Ctrl+F5) ou vide le cache du frontend dans l'app.", offer: "Promo", offer_until: "jusqu'au", offer_expired: "expirée depuis",
    qty_less: "Diminuer la quantité", qty_more: "Augmenter la quantité", qty_changed: "quantité modifiée",
    search: "Rechercher", search_placeholder: "Rechercher dans la liste …", hits: "résultats", no_hits: "Aucun résultat pour", add_this: "ajouter",
    imp: "Importer", imp_ha: "Depuis Home Assistant", imp_text: "En texte", imp_source: "Liste",
    imp_done: "Inclure les terminés", imp_skip_dupes: "Ignorer ceux déjà présents", imp_go: "Importer",
    imp_text_help: "Un article par ligne. Puces, [ ] / [x] et numéros sont reconnus, ainsi que quantités et tags.",
    imp_preview: "Aperçu", imp_none: "Rien à importer.", imp_count: "articles", imported: "importés", imp_dupe: "existe",
    imp_no_lists: "Aucune autre liste trouvée dans Home Assistant.",
    shop_on: "Démarrer le mode courses", shop_off: "Terminer le mode courses", in_cart: "dans le chariot", undo: "Annuler", checked_off: "coché", unchecked: "rouvert",
    deleted: "supprimé", removed: "terminés supprimés", added: "ajouté", changed: "modifié",
    m_rename: "Renommer / modifier", m_move: "Déplacer vers …", m_copy: "Copier vers …", m_category: "Changer de catégorie", m_delete: "Supprimer",
    moved: "déplacé vers", copied: "copié vers", no_targets: "Aucune autre liste dans laquelle tu peux écrire.",
    ui: "Commandes", ui_help: "Chaque utilisateur règle ceci pour lui-même. Éventuellement différent par appareil.",
    scope_household: "Par défaut pour tous", scope_user: "Pour moi sur tous les appareils", scope_device: "Seulement sur cet appareil",
    scope_help_household: "S'applique à tous ceux qui n'ont rien réglé eux-mêmes.",
    scope_help_user: "Seuls tes écarts par rapport au défaut sont enregistrés (marqués •). « Réinitialiser » = retour au défaut.",
    scope_help_device: "S'applique seulement à ce navigateur ou ce téléphone. « Réinitialiser » = retour à ton réglage.",
    press_gesture: "Geste pour le menu d'article", g_long: "Appui long", g_double: "Double-clic", g_right: "Clic droit", g_off: "Désactivé",
    press_target: "Où le geste agit", t_row: "Toute la ligne", t_name: "Seulement sur le nom",
    press_result: "Ce que fait le geste", r_menu: "Ouvrir le menu", r_edit: "Modifier directement", r_delete: "Supprimer (avec confirmation)",
    menu_actions: "Entrées du menu", row_buttons: "Afficher crayon et corbeille dans la ligne",
    shop: "Mode courses", shop_hide_checked: "Masquer les articles cochés", shop_keep_awake: "Garder l'écran allumé",
    shop_large: "Grandes lignes", shop_tap_row: "Toucher toute la ligne pour cocher", reset: "Réinitialiser",
    sort: "Tri", sort_category: "Catégorie", sort_alpha: "A–Z", sort_added: "Ajout", sort_list: "Par liste",
    packs: "Détection des catégories (packs de mots-clés)", packs_help: "Mots-clés → catégorie. Plusieurs packs peuvent être actifs (p. ex. français + le tien). Pour un même mot-clé, le pack le plus haut l'emporte. Les catégories mémorisées sont toujours prioritaires.",
    pack_terms: "mots-clés", pack_products: "produits", pack_builtin: "intégré", pack_custom: "personnel", pack_priority: "rang",
    pack_up: "Monter (priorité)", pack_download: "Télécharger", pack_delete: "Supprimer ce pack personnel ?", pack_bad_json: "Le fichier n'est pas un JSON valide.",
    pack_upload: "Importer un pack …", pack_name_help: "Nom du pack. Le même nom remplace un pack personnel existant.", pack_add: "Ajouter",
    pack_skipped: "ignorés (catégorie inconnue)", pack_template: "Modèle",
    card_desc: "Liste de courses avec catégories, suggestions, quantités, badges de magasin (@Carrefour) et droits d'accès.",
    imp_placeholder: "- Lait 2 l @Carrefour\n- [ ] Pain\n- [x] Beurre\n3 pommes",
    e_preset_pick: "— Choisir un modèle (règle plusieurs options) —", e_view_list: "Liste", e_view_tiles: "Tuiles (p. ex. tablette de cuisine)", e_view_mini: "Mini-tuile (résumé, dépliable)",
    e_sort_category: "Par catégorie", e_sort_added: "Ordre d'ajout", e_sort_list: "Par liste source (combinée)",
    e_layout_tabs: "Onglets", e_layout_columns: "Côte à côte", e_layout_stack: "Empilées",
    e_density_compact: "Compact", e_density_normal: "Normal", e_density_comfortable: "Grand (tactile)",
    e_sec_multi: "Plusieurs listes dans une carte", e_sec_filter: "Filtres", e_sec_look: "Apparence", e_sec_header: "En-tête", e_sec_input: "Saisie",
    e_sec_list: "Liste", e_sec_done: "Terminés", e_sec_shop: "Mode courses",
    e_pre_family: "Courses en famille (tout activé)", e_pre_kitchen: "Tablette de cuisine (grandes tuiles)", e_pre_store: "Au magasin (mode courses, sans saisie)",
    e_pre_readonly: "Lecture seule", e_pre_tile: "Tuile compacte pour tableau de bord",
    l_preset: "Modèle", l_entity: "Liste", l_entities: "Listes (au lieu de « Liste » ci-dessus)", l_layout: "Disposition", l_title: "Titre (vide = nom de la liste)",
    l_view: "Vue", l_sort: "Tri par défaut", l_advanced: "Afficher les options avancées",
    l_filter_store: "Seulement le magasin (p. ex. Carrefour ; plusieurs séparés par des virgules)", l_filter_person: "Seulement la personne (p. ex. Anna)", l_filter_tag: "Seulement le mot-clé (p. ex. bio)",
    l_filter_category: "Seulement les catégories", l_filter_offers: "Seulement les promos", l_filter_tags_new_items: "Les nouveaux articles reçoivent le tag du filtre (@Carrefour …)",
    l_show_filter_chips: "Barre de filtres (magasins, personnes, promos)",
    l_density: "Hauteur des lignes", l_font_scale: "Taille du texte", l_radius: "Rayon des coins", l_accent_color: "Couleur d'accent (vide = thème)",
    l_show_header: "Afficher l'en-tête", l_show_count: "Nombre à faire / résultats", l_show_search: "Recherche (loupe)",
    l_show_sort: "Choix du tri", l_show_shopping: "Bouton mode courses", l_show_undo: "Annuler (↶)",
    l_show_import: "Bouton d'import", l_show_settings: "Engrenage (paramètres personnels)",
    l_show_add: "Champ de saisie pour ajouter", l_show_frequent: "« Achetés souvent »",
    l_drag_drop: "Glisser-déposer (souris) : déplacer vers une autre liste, réordonner", l_show_stepper: "Sélecteur de quantité (− +)", l_show_offer: "Promos de l'app (magasin, prix, valable jusqu'au)",
    l_show_tags: "Badges (@magasin, *personne, #mot-clé)", l_show_source: "Origine (liste source / personne)", l_show_note: "Notes",
    l_show_category_titles: "Titres de catégorie", l_max_height: "Hauteur maximale de la liste (vide = illimitée)",
    l_show_completed: "Afficher les terminés", l_collapse_completed: "Terminés repliés au départ", l_start_shopping: "Démarrer en mode courses",
    hh_preset: "Règle les options adaptées d'un coup – ensuite tout reste modifiable individuellement.",
    hh_entities: "Plusieurs listes : en onglets, côte à côte ou empilées. Toutes les options s'appliquent à chaque liste.",
    hh_filter_tags_new_items: "Sinon, les nouveaux articles disparaîtraient aussitôt d'une carte filtrée.",
    hh_show_settings: "Geste, menu et mode courses sont réglés par chaque utilisateur dans l'engrenage.",
    hh_show_category_titles: "Désactivé : trié par catégorie, mais en une seule liste avec l'icône de catégorie devant.",
    hh_start_shopping: "Pratique pour une tablette dans l'entrée ou un tableau de bord dédié aux courses.",
    shop_auto_store: "Choisir le magasin selon la zone", shop_auto_store_help: "Quand tu es dans la zone d'un magasin (p. ex. Carrefour), le mode courses n'affiche que ses articles.",
    shop_untagged: "Afficher aussi les articles sans magasin", shop_untagged_help: "En mode courses pour un magasin, aussi tout ce qui n'a pas de @magasin.",
    shop_store: "Magasin", shop_all_stores: "Tous",
    pack_edit: "Modifier les mots-clés", pack_new: "Nouveau pack", pack_new_help: "Pack vide, p. ex. pour une autre langue ou tes propres termes. Il est activé tout en haut.", pack_new_placeholder: "p. ex. Nederlands",
    pack_empty: "Pas encore de mots-clés – ajoute-en ci-dessus.", pack_changed: "modifié", pack_revert: "Annuler la modification", pack_ignore: "Ignorer (comme Autres)",
    pack_more: "Charger plus", pack_term_placeholder: "Mot-clé (plusieurs séparés par des virgules)",
    pack_builtin_edit_help: "Pack intégré : les modifications vont dans le pack complémentaire « + » et sont conservées lors des mises à jour.", pack_edit_help: "Pack personnel : les modifications s'appliquent immédiatement.",
    zone: "Zone", zone_new: "Nouvelle zone", zone_new_help: "Nom de la zone. Position : emplacement actuel de cet appareil (sinon domicile), rayon 100 m – à ajuster dans Paramètres → Pièces et zones.",
    zone_wait: "Zone créée – elle apparaît dans un instant, associe-la ensuite ici.", zone_here: "emplacement de cet appareil", zone_home: "position du domicile – à ajuster",
    zone_none: "aucune zone", zone_manage: "Gérer les zones ↗", store_add: "Magasin avec zone", store_add_help: "Nom du magasin, comme dans @Carrefour. Une zone est ensuite créée pour lui.",
    stores: "Magasins & zones", stores_help: "Associe les magasins à des zones de Home Assistant. En mode courses, tu ne vois alors automatiquement que les articles du magasin où tu te trouves.",
    notes: "Notes de l'app", notes_help: "L'app HA SmartLists enregistre les notes dans sa propre liste de tâches. Ce ne sont pas des listes de courses, elles sont donc masquées par défaut.",
    notes_show: "Afficher dans SmartLists", notes_show_help: "Comme section 📝 séparée sur la page – pas dans Assist, les actions ni les listes combinées.",
    notes_scope: "Qui voit les notes", notes_scope_owner: "seulement son propre compte", notes_scope_household: "tout le foyer",
    notes_lists: "Listes de notes et propriétaires", notes_none: "Aucune liste de notes de l'app trouvée.", notes_no_owner: "inconnu (admins seulement)",
    p_order: "Changer l'ordre", p_order_hint: "◀ ▶ déplace une liste. À la souris : glisse une puce sur une autre. L'ordre vaut aussi pour les colonnes.",
    p_left: "Vers la gauche", p_right: "Vers la droite",
    look: "Badges & couleurs", look_help: "Apparence des badges pour tout le foyer. Les couleurs et noms des magasins s'appliquent aussi dans l'app. Vide ou ↺ = par défaut.",
    look_style: "Style", look_filled: "plein", look_soft: "discret", look_outline: "contour", look_text: "texte seul",
    look_color: "Couleur", look_icon: "Symbole devant", look_label: "Nom affiché", look_kinds: "Par type", look_values: "Badges individuels",
    look_search: "Chercher un badge … (p. ex. carrefour)", look_more: "Trouve les autres via la recherche.", look_add: "Colorer un badge",
    look_add_help: "Avec son caractère, p. ex. @Kaufland, *Max ou #vegan – même s'il n'est pas encore utilisé.",
    zone_count: "zones", zone_unlink: "Dissocier la zone", zone_add: "Zone",
    app_list: "liste combinée de l'app", app_list_connected: "associée", app_list_connect: "Associer",
  },
  es: {
    add_placeholder: "p. ej. 2 kg manzanas @Mercadona", note: "Nota", save: "Guardar", cancel: "Cancelar",
    done: "Hecho", clear: "Quitar completados", own: "Lista propia", combined: "Combinada", foreign: "Ajena",
    empty: "Nada que comprar 🎉", no_add: "Añadir está desactivado para esta lista.", open: "pendientes",
    confirm_delete: "¿Seguro que quieres borrar el artículo?", confirm_clear: "¿Quitar todos los artículos completados?",
    error: "Error", loading: "Cargando …", readonly: "Solo ver", delete: "Borrar", edit: "Editar",
    frequent: "Comprados a menudo", src_manual: "recordada", src_learned: "aprendida", src_pack: "automática", src_fallback: "desconocida",
    unit_hint: "unidad habitual", category: "Categoría", settings: "Ajustes", naming: "Convención de nombres",
    naming_help: "Un carácter delante de una palabra la convierte en una etiqueta. Vale para todas las listas y dispositivos.",
    kind_store: "Tienda", kind_person: "Persona", kind_tag: "Etiqueta", add_rule: "Añadir regla", example: "Ejemplo",
    learned: "Categorías recordadas", learned_help: "Se crean cuando eliges una categoría a mano.", forget: "Olvidar",
    none_learned: "Todavía no hay nada recordado.", saved: "Guardado", admin_only: "Solo los administradores pueden cambiar esto.",
    in_list: "ya está en la lista",
    tab_me: "Para mí", tab_house: "Hogar", tab_list: "Esta lista", ui_me_help: "Se aplica a ti. Las diferencias con el ajuste del hogar se marcan con •.",
    ui_house: "Controles – predeterminado para todos", reset_default: "Restablecer predeterminado", about_list: "Sobre esta lista", type: "Tipo", entity: "Entidad", sources: "Fuentes",
    type_combined: "Lista combinada", type_own: "Lista propia de SmartLists", type_list: "Lista de tareas de Home Assistant", char: "Carácter", kind: "Tipo",
    no_hits_short: "Sin resultados.", by_hand: "a mano", search_learned: "Buscar … (p. ej. leche)",
    automation: "Voz y automatizaciones", automation_help: "Assist y artículos pendientes de recompra. Blueprints «Estoy en la tienda» y recordatorio de tienda: ver la wiki.",
    auto_voice_default_list: "Lista predeterminada para Assist", auto_voice_help: "Se usa cuando la frase no nombra ninguna lista.",
    auto_auto_due_list: "Añadir automáticamente los artículos pendientes a", auto_due_help: "Cada hora, según vuestro ritmo de compra. «—» = desactivado.",
    install_sentences: "Instalar frases de Assist", sentences_installed: "instaladas",
    devices: "Dispositivos conectados", devices_help: "Móviles con la app HA SmartLists. ⚠️ = sin sincronizar desde hace más de 7 días. Para quitar el acceso, borra el token en el perfil.",
    no_devices: "Ningún móvil conectado todavía.", remove_device: "Quitar de la lista", last_seen: "visto",
    role_all: "todos los permisos", admin_always: "Admin – siempre puede hacerlo todo", shop_large_help: "Más fácil de tocar con el pulgar",
    new_list_help: "Eres el propietario y luego puedes compartirla con otros.", new_list_placeholder: "p. ej. Droguería", create: "Crear",
    p_columns: "Varias listas una al lado de otra", p_wide: "Vista ancha", p_settings: "Ajustes", p_back: "Volver a las listas",
    p_hint: "Toca listas para verlas una al lado de otra (con más de 3 pasan a otra fila). Arrastra artículos con el ratón a otra lista para moverlos (Ctrl = copiar).",
    p_empty: "No se encontraron listas. Crea una en Ajustes → Dispositivos y servicios → SmartLists – o con + arriba.",
    owner: "propietario", shared: "compartida", private: "privada", admin: "admin", sharing: "Compartir",
    sharing_help: "Quién puede ver y cambiar esta lista. Los admins siempre pueden hacerlo todo. La vista de tareas de HA muestra cada lista a todos – solo se oculta en SmartLists (tarjeta, página, app).",
    role_none: "sin acceso", role_viewer: "ver", role_checker: "marcar", role_editor: "editar", role_owner: "propietario",
    no_users: "No hay más usuarios en Home Assistant.", delete_list: "Borrar lista", confirm_delete_list: "¿Borrar esta lista con todos sus artículos?",
    new_list: "Nueva lista", new_list_prompt: "Nombre de la nueva lista:",
    due_every: "toca comprar – lo compráis aprox. cada", days: "días", backup: "Copia y traspaso",
    backup_help: "Categorías recordadas, historial, convención de nombres y controles en un archivo – p. ej. para una segunda instancia de HA. Importar añade sin borrar nada.",
    export: "Exportar", import: "Importar …",
    mini_open: "Abrir lista", mini_close: "Contraer", card_version: "tarjeta", stale_card: "Esta tarjeta está desactualizada – recarga la página (Ctrl+F5) o borra la caché del frontend en la app.", offer: "Oferta", offer_until: "hasta", offer_expired: "caducada desde",
    qty_less: "Reducir cantidad", qty_more: "Aumentar cantidad", qty_changed: "cantidad cambiada",
    search: "Buscar", search_placeholder: "Buscar en la lista …", hits: "resultados", no_hits: "Nada encontrado para", add_this: "añadir",
    imp: "Importar", imp_ha: "Desde Home Assistant", imp_text: "Como texto", imp_source: "Lista",
    imp_done: "Incluir completados", imp_skip_dupes: "Omitir los que ya están", imp_go: "Importar",
    imp_text_help: "Un artículo por línea. Se reconocen viñetas, [ ] / [x] y números, así como cantidades y etiquetas.",
    imp_preview: "Vista previa", imp_none: "Nada que importar.", imp_count: "artículos", imported: "importados", imp_dupe: "existe",
    imp_no_lists: "No se encontraron otras listas en Home Assistant.",
    shop_on: "Iniciar modo compra", shop_off: "Terminar modo compra", in_cart: "en el carro", undo: "Deshacer", checked_off: "marcado", unchecked: "reabierto",
    deleted: "borrado", removed: "completados quitados", added: "añadido", changed: "cambiado",
    m_rename: "Renombrar / editar", m_move: "Mover a …", m_copy: "Copiar a …", m_category: "Cambiar categoría", m_delete: "Borrar",
    moved: "movido a", copied: "copiado a", no_targets: "No hay otra lista en la que puedas escribir.",
    ui: "Controles", ui_help: "Cada usuario lo ajusta para sí mismo. Opcionalmente distinto por dispositivo.",
    scope_household: "Predeterminado para todos", scope_user: "Para mí en todos los dispositivos", scope_device: "Solo en este dispositivo",
    scope_help_household: "Se aplica a todos los que no han ajustado nada propio.",
    scope_help_user: "Solo se guardan tus diferencias con el predeterminado (marcadas con •). «Restablecer» = volver al predeterminado.",
    scope_help_device: "Se aplica solo a este navegador o móvil. «Restablecer» = volver a tu ajuste.",
    press_gesture: "Gesto para el menú del artículo", g_long: "Pulsación larga", g_double: "Doble clic", g_right: "Clic derecho", g_off: "Desactivado",
    press_target: "Dónde funciona el gesto", t_row: "Toda la fila", t_name: "Solo en el nombre",
    press_result: "Qué hace el gesto", r_menu: "Abrir menú", r_edit: "Editar directamente", r_delete: "Borrar (con confirmación)",
    menu_actions: "Entradas del menú", row_buttons: "Mostrar lápiz y papelera en la fila",
    shop: "Modo compra", shop_hide_checked: "Ocultar marcados", shop_keep_awake: "Mantener la pantalla encendida",
    shop_large: "Filas grandes", shop_tap_row: "Tocar toda la fila para marcar", reset: "Restablecer",
    sort: "Orden", sort_category: "Categoría", sort_alpha: "A–Z", sort_added: "Añadido", sort_list: "Por lista",
    packs: "Detección de categorías (paquetes de palabras clave)", packs_help: "Palabras clave → categoría. Puede haber varios paquetes activos (p. ej. español + el tuyo). Con la misma palabra clave gana el paquete más arriba. Las categorías recordadas siempre tienen prioridad.",
    pack_terms: "palabras clave", pack_products: "productos", pack_builtin: "integrado", pack_custom: "propio", pack_priority: "puesto",
    pack_up: "Subir (prioridad)", pack_download: "Descargar", pack_delete: "¿Borrar el paquete propio?", pack_bad_json: "El archivo no es un JSON válido.",
    pack_upload: "Subir paquete …", pack_name_help: "Nombre del paquete. El mismo nombre reemplaza un paquete propio existente.", pack_add: "Añadir",
    pack_skipped: "omitidas (categoría desconocida)", pack_template: "Plantilla",
    card_desc: "Lista de la compra con categorías, sugerencias, cantidades, etiquetas de tienda (@Mercadona) y permisos.",
    imp_placeholder: "- Leche 2 l @Mercadona\n- [ ] Pan\n- [x] Mantequilla\n3 manzanas",
    e_preset_pick: "— Elegir plantilla (ajusta varias opciones) —", e_view_list: "Lista", e_view_tiles: "Mosaicos (p. ej. tablet de cocina)", e_view_mini: "Mini mosaico (resumen, desplegable)",
    e_sort_category: "Por categoría", e_sort_added: "Orden de añadido", e_sort_list: "Por lista de origen (combinada)",
    e_layout_tabs: "Pestañas", e_layout_columns: "Lado a lado", e_layout_stack: "Una debajo de otra",
    e_density_compact: "Compacto", e_density_normal: "Normal", e_density_comfortable: "Grande (táctil)",
    e_sec_multi: "Varias listas en una tarjeta", e_sec_filter: "Filtros", e_sec_look: "Apariencia", e_sec_header: "Cabecera", e_sec_input: "Entrada",
    e_sec_list: "Lista", e_sec_done: "Completados", e_sec_shop: "Modo compra",
    e_pre_family: "Compra familiar (todo activado)", e_pre_kitchen: "Tablet de cocina (mosaicos grandes)", e_pre_store: "En la tienda (modo compra, sin entrada)",
    e_pre_readonly: "Solo ver", e_pre_tile: "Mosaico compacto para el panel",
    l_preset: "Plantilla", l_entity: "Lista", l_entities: "Listas (en lugar de «Lista» arriba)", l_layout: "Disposición", l_title: "Título (vacío = nombre de la lista)",
    l_view: "Vista", l_sort: "Orden predeterminado", l_advanced: "Mostrar opciones avanzadas",
    l_filter_store: "Solo tienda (p. ej. Mercadona; varias separadas por comas)", l_filter_person: "Solo persona (p. ej. Anna)", l_filter_tag: "Solo etiqueta (p. ej. bio)",
    l_filter_category: "Solo categorías", l_filter_offers: "Solo ofertas", l_filter_tags_new_items: "Los artículos nuevos reciben la etiqueta del filtro (@Mercadona …)",
    l_show_filter_chips: "Barra de filtros (tiendas, personas, ofertas)",
    l_density: "Altura de fila", l_font_scale: "Tamaño de letra", l_radius: "Radio de las esquinas", l_accent_color: "Color de acento (vacío = tema)",
    l_show_header: "Mostrar cabecera", l_show_count: "Número pendiente / resultados", l_show_search: "Búsqueda (lupa)",
    l_show_sort: "Selector de orden", l_show_shopping: "Botón de modo compra", l_show_undo: "Deshacer (↶)",
    l_show_import: "Botón de importar", l_show_settings: "Engranaje (ajustes personales)",
    l_show_add: "Campo para añadir", l_show_frequent: "«Comprados a menudo»",
    l_drag_drop: "Arrastrar y soltar (ratón): mover a otra lista, reordenar", l_show_stepper: "Selector de cantidad (− +)", l_show_offer: "Ofertas de la app (tienda, precio, válida hasta)",
    l_show_tags: "Etiquetas (@tienda, *persona, #etiqueta)", l_show_source: "Origen (lista de origen / persona)", l_show_note: "Notas",
    l_show_category_titles: "Títulos de categoría", l_max_height: "Altura máxima de la lista (vacío = sin límite)",
    l_show_completed: "Mostrar completados", l_collapse_completed: "Completados contraídos al inicio", l_start_shopping: "Empezar en modo compra",
    hh_preset: "Ajusta las opciones adecuadas de una vez – después todo se puede cambiar por separado.",
    hh_entities: "Varias listas: en pestañas, lado a lado o una debajo de otra. Todas las opciones valen para cada lista.",
    hh_filter_tags_new_items: "Si no, los artículos nuevos desaparecerían enseguida en una tarjeta filtrada.",
    hh_show_settings: "Cada usuario ajusta gesto, menú y modo compra en el engranaje.",
    hh_show_category_titles: "Desactivado: ordenado por categoría, pero como una sola lista con el icono de categoría delante.",
    hh_start_shopping: "Práctico para una tablet en el pasillo o un panel solo para la compra.",
    shop_auto_store: "Elegir la tienda según la zona", shop_auto_store_help: "Si estás en la zona de una tienda (p. ej. Mercadona), el modo compra muestra solo sus artículos.",
    shop_untagged: "Mostrar también artículos sin tienda", shop_untagged_help: "En el modo compra de una tienda, además todo lo que no tiene @tienda.",
    shop_store: "Tienda", shop_all_stores: "Todas",
    pack_edit: "Editar palabras clave", pack_new: "Nuevo paquete", pack_new_help: "Paquete vacío, p. ej. para otro idioma o términos propios. Se activa arriba del todo.", pack_new_placeholder: "p. ej. Nederlands",
    pack_empty: "Aún no hay palabras clave – añade alguna arriba.", pack_changed: "cambiada", pack_revert: "Deshacer el cambio", pack_ignore: "Ignorar (como Otros)",
    pack_more: "Cargar más", pack_term_placeholder: "Palabra clave (varias separadas por comas)",
    pack_builtin_edit_help: "Paquete integrado: los cambios van al paquete complementario «+» y se conservan en las actualizaciones.", pack_edit_help: "Paquete propio: los cambios se aplican al momento.",
    zone: "Zona", zone_new: "Nueva zona", zone_new_help: "Nombre de la zona. Posición: ubicación actual de este dispositivo (si no, casa), radio 100 m – ajústala en Ajustes → Áreas y zonas.",
    zone_wait: "Zona creada – aparecerá enseguida; luego vincúlala aquí.", zone_here: "ubicación de este dispositivo", zone_home: "posición de casa – ajústala",
    zone_none: "sin zona", zone_manage: "Gestionar zonas ↗", store_add: "Tienda con zona", store_add_help: "Nombre de la tienda, como en @Mercadona. Después se crea una zona para ella.",
    stores: "Tiendas y zonas", stores_help: "Vincula tiendas con zonas de Home Assistant. En el modo compra verás automáticamente solo los artículos de la tienda en la que estás.",
    notes: "Notas de la app", notes_help: "La app HA SmartLists guarda las notas en su propia lista de tareas. No son listas de la compra, por eso están ocultas por defecto.",
    notes_show: "Mostrar en SmartLists", notes_show_help: "Como sección 📝 aparte en la página – no en Assist, acciones ni listas combinadas.",
    notes_scope: "Quién ve las notas", notes_scope_owner: "solo la propia cuenta", notes_scope_household: "todo el hogar",
    notes_lists: "Listas de notas y propietarios", notes_none: "No se encontró ninguna lista de notas de la app.", notes_no_owner: "desconocido (solo admins)",
    p_order: "Cambiar el orden", p_order_hint: "◀ ▶ mueve una lista. Con el ratón: arrastra una etiqueta sobre otra. El orden vale también para las columnas.",
    p_left: "A la izquierda", p_right: "A la derecha",
    look: "Etiquetas y colores", look_help: "Aspecto de las etiquetas para todo el hogar. Los colores y nombres de las tiendas también valen en la app. Vacío o ↺ = predeterminado.",
    look_style: "Estilo", look_filled: "relleno", look_soft: "suave", look_outline: "borde", look_text: "solo texto",
    look_color: "Color", look_icon: "Símbolo delante", look_label: "Nombre mostrado", look_kinds: "Por tipo", look_values: "Etiquetas individuales",
    look_search: "Buscar etiqueta … (p. ej. mercadona)", look_more: "Encuentra más con la búsqueda.", look_add: "Colorear una etiqueta",
    look_add_help: "Con su carácter, p. ej. @Kaufland, *Max o #vegano – aunque aún no se haya usado.",
    zone_count: "zonas", zone_unlink: "Desvincular zona", zone_add: "Zona",
    app_list: "lista combinada de la app", app_list_connected: "vinculada", app_list_connect: "Vincular",
  },
  it: {
    add_placeholder: "es. 2 kg mele @Esselunga", note: "Nota", save: "Salva", cancel: "Annulla",
    done: "Fatto", clear: "Rimuovi completati", own: "Lista propria", combined: "Combinata", foreign: "Esterna",
    empty: "Niente da comprare 🎉", no_add: "L'aggiunta è disattivata per questa lista.", open: "da fare",
    confirm_delete: "Eliminare davvero l'articolo?", confirm_clear: "Rimuovere tutti gli articoli completati?",
    error: "Errore", loading: "Caricamento …", readonly: "Solo lettura", delete: "Elimina", edit: "Modifica",
    frequent: "Acquistati spesso", src_manual: "memorizzata", src_learned: "appresa", src_pack: "automatica", src_fallback: "sconosciuta",
    unit_hint: "unità abituale", category: "Categoria", settings: "Impostazioni", naming: "Convenzione dei nomi",
    naming_help: "Un carattere davanti a una parola la trasforma in un badge. Vale per tutte le liste e tutti i dispositivi.",
    kind_store: "Negozio", kind_person: "Persona", kind_tag: "Tag", add_rule: "Aggiungi regola", example: "Esempio",
    learned: "Categorie memorizzate", learned_help: "Si creano quando scegli una categoria a mano.", forget: "Dimentica",
    none_learned: "Ancora niente di memorizzato.", saved: "Salvato", admin_only: "Solo gli amministratori possono modificarlo.",
    in_list: "è già nella lista",
    tab_me: "Per me", tab_house: "Casa", tab_list: "Questa lista", ui_me_help: "Vale per te. Le differenze rispetto all'impostazione di casa sono segnate con •.",
    ui_house: "Comandi – predefinito per tutti", reset_default: "Ripristina predefinito", about_list: "Informazioni sulla lista", type: "Tipo", entity: "Entità", sources: "Origini",
    type_combined: "Lista combinata", type_own: "Lista SmartLists propria", type_list: "Lista to-do di Home Assistant", char: "Carattere", kind: "Tipo",
    no_hits_short: "Nessun risultato.", by_hand: "a mano", search_learned: "Cerca … (es. latte)",
    automation: "Voce e automazioni", automation_help: "Assist e articoli da ricomprare. Blueprint «Sono al negozio» e promemoria negozio: vedi wiki.",
    auto_voice_default_list: "Lista predefinita per Assist", auto_voice_help: "Usata quando la frase non nomina nessuna lista.",
    auto_auto_due_list: "Aggiungi automaticamente gli articoli da ricomprare a", auto_due_help: "Ogni ora, secondo il vostro ritmo di acquisto. «—» = disattivato.",
    install_sentences: "Installa frasi Assist", sentences_installed: "installate",
    devices: "Dispositivi collegati", devices_help: "Telefoni con l'app HA SmartLists. ⚠️ = non sincronizzato da oltre 7 giorni. Per revocare l'accesso, elimina il token nel profilo.",
    no_devices: "Nessun telefono collegato.", remove_device: "Rimuovi dalla lista", last_seen: "visto",
    role_all: "tutti i permessi", admin_always: "Admin – può sempre fare tutto", shop_large_help: "Più facile da toccare con il pollice",
    new_list_help: "Sei il proprietario e poi puoi condividerla con altri.", new_list_placeholder: "es. Drogheria", create: "Crea",
    p_columns: "Più liste affiancate", p_wide: "Vista larga", p_settings: "Impostazioni", p_back: "Torna alle liste",
    p_hint: "Tocca le liste per affiancarle (oltre 3 vanno a capo). Trascina gli articoli col mouse in un'altra lista per spostarli (Ctrl = copia).",
    p_empty: "Nessuna lista trovata. Creane una in Impostazioni → Dispositivi e servizi → SmartLists – oppure con + in alto.",
    owner: "proprietario", shared: "condivisa", private: "privata", admin: "admin", sharing: "Condivisione",
    sharing_help: "Chi può vedere e modificare questa lista. Gli admin possono sempre fare tutto. La vista to-do di HA mostra ogni lista a tutti – è nascosta solo in SmartLists (scheda, pagina, app).",
    role_none: "nessun accesso", role_viewer: "vedere", role_checker: "spuntare", role_editor: "modificare", role_owner: "proprietario",
    no_users: "Nessun altro utente in Home Assistant.", delete_list: "Elimina lista", confirm_delete_list: "Eliminare questa lista con tutti gli articoli?",
    new_list: "Nuova lista", new_list_prompt: "Nome della nuova lista:",
    due_every: "da ricomprare – lo comprate circa ogni", days: "giorni", backup: "Backup e trasferimento",
    backup_help: "Categorie memorizzate, cronologia, convenzione dei nomi e comandi in un file – es. per una seconda istanza HA. L'importazione aggiunge senza cancellare nulla.",
    export: "Esporta", import: "Importa …",
    mini_open: "Apri lista", mini_close: "Comprimi", card_version: "scheda", stale_card: "Questa scheda è obsoleta – ricarica la pagina (Ctrl+F5) o svuota la cache del frontend nell'app.", offer: "Offerta", offer_until: "fino al", offer_expired: "scaduta dal",
    qty_less: "Diminuisci quantità", qty_more: "Aumenta quantità", qty_changed: "quantità modificata",
    search: "Cerca", search_placeholder: "Cerca nella lista …", hits: "risultati", no_hits: "Nessun risultato per", add_this: "aggiungi",
    imp: "Importa", imp_ha: "Da Home Assistant", imp_text: "Come testo", imp_source: "Lista",
    imp_done: "Includi completati", imp_skip_dupes: "Salta quelli già presenti", imp_go: "Importa",
    imp_text_help: "Un articolo per riga. Elenchi puntati, [ ] / [x] e numeri vengono riconosciuti, così come quantità e tag.",
    imp_preview: "Anteprima", imp_none: "Niente da importare.", imp_count: "articoli", imported: "importati", imp_dupe: "presente",
    imp_no_lists: "Nessun'altra lista trovata in Home Assistant.",
    shop_on: "Avvia modalità spesa", shop_off: "Termina modalità spesa", in_cart: "nel carrello", undo: "Annulla", checked_off: "spuntato", unchecked: "riaperto",
    deleted: "eliminato", removed: "completati rimossi", added: "aggiunto", changed: "modificato",
    m_rename: "Rinomina / modifica", m_move: "Sposta in …", m_copy: "Copia in …", m_category: "Cambia categoria", m_delete: "Elimina",
    moved: "spostato in", copied: "copiato in", no_targets: "Nessun'altra lista in cui puoi scrivere.",
    ui: "Comandi", ui_help: "Ogni utente lo imposta per sé. Facoltativamente diverso per dispositivo.",
    scope_household: "Predefinito per tutti", scope_user: "Per me su tutti i dispositivi", scope_device: "Solo su questo dispositivo",
    scope_help_household: "Vale per chi non ha impostato nulla di proprio.",
    scope_help_user: "Si salvano solo le tue differenze dal predefinito (segnate con •). «Ripristina» = torna al predefinito.",
    scope_help_device: "Vale solo per questo browser o telefono. «Ripristina» = torna alla tua impostazione.",
    press_gesture: "Gesto per il menu dell'articolo", g_long: "Pressione lunga", g_double: "Doppio clic", g_right: "Clic destro", g_off: "Disattivato",
    press_target: "Dove funziona il gesto", t_row: "Tutta la riga", t_name: "Solo sul nome",
    press_result: "Cosa fa il gesto", r_menu: "Apri menu", r_edit: "Modifica direttamente", r_delete: "Elimina (con conferma)",
    menu_actions: "Voci del menu", row_buttons: "Mostra matita e cestino nella riga",
    shop: "Modalità spesa", shop_hide_checked: "Nascondi spuntati", shop_keep_awake: "Mantieni lo schermo acceso",
    shop_large: "Righe grandi", shop_tap_row: "Tocca tutta la riga per spuntare", reset: "Ripristina",
    sort: "Ordine", sort_category: "Categoria", sort_alpha: "A–Z", sort_added: "Aggiunta", sort_list: "Per lista",
    packs: "Riconoscimento categorie (pacchetti di parole chiave)", packs_help: "Parole chiave → categoria. Possono essere attivi più pacchetti (es. italiano + il tuo). A parità di parola chiave vince il pacchetto più in alto. Le categorie memorizzate hanno sempre la precedenza.",
    pack_terms: "parole chiave", pack_products: "prodotti", pack_builtin: "integrato", pack_custom: "personale", pack_priority: "posizione",
    pack_up: "Sposta su (precedenza)", pack_download: "Scarica", pack_delete: "Eliminare il pacchetto personale?", pack_bad_json: "Il file non è un JSON valido.",
    pack_upload: "Carica pacchetto …", pack_name_help: "Nome del pacchetto. Lo stesso nome sostituisce un pacchetto personale esistente.", pack_add: "Aggiungi",
    pack_skipped: "saltate (categoria sconosciuta)", pack_template: "Modello",
    card_desc: "Lista della spesa con categorie, suggerimenti, quantità, badge dei negozi (@Esselunga) e permessi.",
    imp_placeholder: "- Latte 2 l @Esselunga\n- [ ] Pane\n- [x] Burro\n3 mele",
    e_preset_pick: "— Scegli un modello (imposta più opzioni) —", e_view_list: "Lista", e_view_tiles: "Riquadri (es. tablet in cucina)", e_view_mini: "Mini riquadro (riepilogo, espandibile)",
    e_sort_category: "Per categoria", e_sort_added: "Ordine di aggiunta", e_sort_list: "Per lista di origine (combinata)",
    e_layout_tabs: "Schede", e_layout_columns: "Affiancate", e_layout_stack: "Una sotto l'altra",
    e_density_compact: "Compatta", e_density_normal: "Normale", e_density_comfortable: "Grande (touch)",
    e_sec_multi: "Più liste in una scheda", e_sec_filter: "Filtri", e_sec_look: "Aspetto", e_sec_header: "Intestazione", e_sec_input: "Inserimento",
    e_sec_list: "Lista", e_sec_done: "Completati", e_sec_shop: "Modalità spesa",
    e_pre_family: "Spesa di famiglia (tutto attivo)", e_pre_kitchen: "Tablet in cucina (riquadri grandi)", e_pre_store: "Al negozio (modalità spesa, senza inserimento)",
    e_pre_readonly: "Solo lettura", e_pre_tile: "Riquadro compatto per la dashboard",
    l_preset: "Modello", l_entity: "Lista", l_entities: "Liste (al posto di «Lista» sopra)", l_layout: "Disposizione", l_title: "Titolo (vuoto = nome della lista)",
    l_view: "Vista", l_sort: "Ordine predefinito", l_advanced: "Mostra opzioni avanzate",
    l_filter_store: "Solo negozio (es. Esselunga; più negozi separati da virgole)", l_filter_person: "Solo persona (es. Anna)", l_filter_tag: "Solo tag (es. bio)",
    l_filter_category: "Solo categorie", l_filter_offers: "Solo offerte", l_filter_tags_new_items: "I nuovi articoli ricevono il tag del filtro (@Esselunga …)",
    l_show_filter_chips: "Barra dei filtri (negozi, persone, offerte)",
    l_density: "Altezza righe", l_font_scale: "Dimensione testo", l_radius: "Raggio degli angoli", l_accent_color: "Colore d'accento (vuoto = tema)",
    l_show_header: "Mostra intestazione", l_show_count: "Numero da fare / risultati", l_show_search: "Ricerca (lente)",
    l_show_sort: "Scelta dell'ordine", l_show_shopping: "Pulsante modalità spesa", l_show_undo: "Annulla (↶)",
    l_show_import: "Pulsante importa", l_show_settings: "Ingranaggio (impostazioni personali)",
    l_show_add: "Campo per aggiungere", l_show_frequent: "«Acquistati spesso»",
    l_drag_drop: "Trascina e rilascia (mouse): sposta in un'altra lista, riordina", l_show_stepper: "Selettore quantità (− +)", l_show_offer: "Offerte dall'app (negozio, prezzo, valida fino al)",
    l_show_tags: "Badge (@negozio, *persona, #tag)", l_show_source: "Origine (lista di origine / persona)", l_show_note: "Note",
    l_show_category_titles: "Titoli delle categorie", l_max_height: "Altezza massima della lista (vuoto = illimitata)",
    l_show_completed: "Mostra completati", l_collapse_completed: "Completati compressi all'inizio", l_start_shopping: "Avvia in modalità spesa",
    hh_preset: "Imposta le opzioni adatte in un colpo – dopo tutto resta modificabile singolarmente.",
    hh_entities: "Più liste: in schede, affiancate o una sotto l'altra. Tutte le opzioni valgono per ogni lista.",
    hh_filter_tags_new_items: "Altrimenti i nuovi articoli sparirebbero subito in una scheda filtrata.",
    hh_show_settings: "Gesto, menu e modalità spesa li imposta ogni utente nell'ingranaggio.",
    hh_show_category_titles: "Disattivato: ordinato per categoria, ma come un'unica lista con l'icona della categoria davanti.",
    hh_start_shopping: "Comodo per un tablet all'ingresso o una dashboard solo per la spesa.",
    shop_auto_store: "Scegli il negozio in base alla zona", shop_auto_store_help: "Quando sei nella zona di un negozio (es. Esselunga), la modalità spesa mostra solo i suoi articoli.",
    shop_untagged: "Mostra anche articoli senza negozio", shop_untagged_help: "Nella modalità spesa per un negozio, anche tutto ciò che non ha @negozio.",
    shop_store: "Negozio", shop_all_stores: "Tutti",
    pack_edit: "Modifica parole chiave", pack_new: "Nuovo pacchetto", pack_new_help: "Pacchetto vuoto, es. per un'altra lingua o termini propri. Viene attivato in cima.", pack_new_placeholder: "es. Nederlands",
    pack_empty: "Ancora nessuna parola chiave – aggiungine sopra.", pack_changed: "modificata", pack_revert: "Annulla modifica", pack_ignore: "Ignora (come Altro)",
    pack_more: "Carica altro", pack_term_placeholder: "Parola chiave (più parole separate da virgole)",
    pack_builtin_edit_help: "Pacchetto integrato: le modifiche finiscono nel pacchetto aggiuntivo «+» e restano dopo gli aggiornamenti.", pack_edit_help: "Pacchetto personale: le modifiche valgono subito.",
    zone: "Zona", zone_new: "Nuova zona", zone_new_help: "Nome della zona. Posizione: posizione attuale di questo dispositivo (altrimenti casa), raggio 100 m – da regolare in Impostazioni → Aree e zone.",
    zone_wait: "Zona creata – compare tra un attimo, poi collegala qui.", zone_here: "posizione di questo dispositivo", zone_home: "posizione di casa – da regolare",
    zone_none: "nessuna zona", zone_manage: "Gestisci zone ↗", store_add: "Negozio con zona", store_add_help: "Nome del negozio, come in @Esselunga. Poi viene creata una zona per esso.",
    stores: "Negozi e zone", stores_help: "Collega i negozi alle zone di Home Assistant. In modalità spesa vedrai automaticamente solo gli articoli del negozio in cui ti trovi.",
    notes: "Note dell'app", notes_help: "L'app HA SmartLists salva le note in una propria lista to-do. Non sono liste della spesa e perciò sono nascoste per impostazione predefinita.",
    notes_show: "Mostra in SmartLists", notes_show_help: "Come sezione 📝 separata nella pagina – non in Assist, azioni o liste combinate.",
    notes_scope: "Chi vede le note", notes_scope_owner: "solo il proprio account", notes_scope_household: "tutta la casa",
    notes_lists: "Liste di note e proprietari", notes_none: "Nessuna lista di note dell'app trovata.", notes_no_owner: "sconosciuto (solo admin)",
    p_order: "Cambia ordine", p_order_hint: "◀ ▶ sposta una lista. Col mouse: trascina un chip su un altro. L'ordine vale anche per le colonne.",
    p_left: "A sinistra", p_right: "A destra",
    look: "Badge e colori", look_help: "Aspetto dei badge per tutta la casa. Colori e nomi dei negozi valgono anche nell'app. Vuoto o ↺ = predefinito.",
    look_style: "Stile", look_filled: "pieno", look_soft: "tenue", look_outline: "contorno", look_text: "solo testo",
    look_color: "Colore", look_icon: "Simbolo davanti", look_label: "Nome visualizzato", look_kinds: "Per tipo", look_values: "Singoli badge",
    look_search: "Cerca badge … (es. esselunga)", look_more: "Trova gli altri con la ricerca.", look_add: "Colora un badge",
    look_add_help: "Con il suo carattere, es. @Kaufland, *Max o #vegano – anche se non è ancora stato usato.",
    zone_count: "zone", zone_unlink: "Scollega zona", zone_add: "Zona",
    app_list: "lista combinata dell'app", app_list_connected: "collegata", app_list_connect: "Collega",
  },
  pl: {
    add_placeholder: "np. 2 kg jabłek @Biedronka", note: "Notatka", save: "Zapisz", cancel: "Anuluj",
    done: "Zrobione", clear: "Usuń zrobione", own: "Własna lista", combined: "Połączona", foreign: "Obca",
    empty: "Nic do kupienia 🎉", no_add: "Dodawanie jest wyłączone dla tej listy.", open: "do kupienia",
    confirm_delete: "Na pewno usunąć produkt?", confirm_clear: "Usunąć wszystkie zrobione produkty?",
    error: "Błąd", loading: "Ładowanie …", readonly: "Tylko podgląd", delete: "Usuń", edit: "Edytuj",
    frequent: "Często kupowane", src_manual: "zapamiętana", src_learned: "nauczona", src_pack: "automatyczna", src_fallback: "nieznana",
    unit_hint: "zwykła jednostka", category: "Kategoria", settings: "Ustawienia", naming: "Konwencja nazw",
    naming_help: "Znak przed słowem zamienia je w plakietkę. Dotyczy wszystkich list i urządzeń.",
    kind_store: "Sklep", kind_person: "Osoba", kind_tag: "Tag", add_rule: "Dodaj regułę", example: "Przykład",
    learned: "Zapamiętane kategorie", learned_help: "Powstają, gdy wybierasz kategorię ręcznie.", forget: "Zapomnij",
    none_learned: "Nic jeszcze nie zapamiętano.", saved: "Zapisano", admin_only: "Tylko administratorzy mogą to zmienić.",
    in_list: "jest już na liście",
    tab_me: "Dla mnie", tab_house: "Dom", tab_list: "Ta lista", ui_me_help: "Dotyczy ciebie. Różnice względem ustawień domu są oznaczone •.",
    ui_house: "Sterowanie – domyślne dla wszystkich", reset_default: "Przywróć domyślne", about_list: "O tej liście", type: "Typ", entity: "Encja", sources: "Źródła",
    type_combined: "Lista połączona", type_own: "Własna lista SmartLists", type_list: "Lista zadań Home Assistant", char: "Znak", kind: "Rodzaj",
    no_hits_short: "Nic nie znaleziono.", by_hand: "ręcznie", search_learned: "Szukaj … (np. mleko)",
    automation: "Głos i automatyzacje", automation_help: "Assist i produkty do ponownego zakupu. Blueprinty „Jestem w sklepie” i przypomnienie o sklepie: zobacz wiki.",
    auto_voice_default_list: "Domyślna lista dla Assist", auto_voice_help: "Używana, gdy zdanie nie wymienia listy.",
    auto_auto_due_list: "Automatycznie dodawaj produkty do ponownego zakupu do", auto_due_help: "Co godzinę, według waszego rytmu zakupów. „—” = wyłączone.",
    install_sentences: "Zainstaluj zdania Assist", sentences_installed: "zainstalowane",
    devices: "Połączone urządzenia", devices_help: "Telefony z aplikacją HA SmartLists. ⚠️ = brak synchronizacji od ponad 7 dni. Aby odebrać dostęp, usuń token w profilu.",
    no_devices: "Nie połączono jeszcze żadnego telefonu.", remove_device: "Usuń z listy", last_seen: "ostatnio",
    role_all: "wszystkie prawa", admin_always: "Admin – zawsze może wszystko", shop_large_help: "Łatwiej trafić kciukiem",
    new_list_help: "Jesteś właścicielem i możesz potem udostępnić ją innym.", new_list_placeholder: "np. Drogeria", create: "Utwórz",
    p_columns: "Kilka list obok siebie", p_wide: "Szeroki widok", p_settings: "Ustawienia", p_back: "Wróć do list",
    p_hint: "Dotknij list, aby pokazać je obok siebie (więcej niż 3 przechodzą do kolejnego rzędu). Przeciągnij produkt myszą na inną listę, aby go przenieść (Ctrl = kopiuj).",
    p_empty: "Nie znaleziono list. Utwórz ją w Ustawienia → Urządzenia i usługi → SmartLists – albo przyciskiem + u góry.",
    owner: "właściciel", shared: "udostępniona", private: "prywatna", admin: "admin", sharing: "Udostępnianie",
    sharing_help: "Kto może widzieć i zmieniać tę listę. Admini zawsze mogą wszystko. Widok zadań HA pokazuje każdą listę wszystkim – jest ukryta tylko w SmartLists (karta, strona, aplikacja).",
    role_none: "brak dostępu", role_viewer: "podgląd", role_checker: "odhaczanie", role_editor: "edycja", role_owner: "właściciel",
    no_users: "Brak innych użytkowników w Home Assistant.", delete_list: "Usuń listę", confirm_delete_list: "Usunąć tę listę ze wszystkimi produktami?",
    new_list: "Nowa lista", new_list_prompt: "Nazwa nowej listy:",
    due_every: "do kupienia – kupujecie mniej więcej co", days: "dni", backup: "Kopia i przeniesienie",
    backup_help: "Zapamiętane kategorie, historia, konwencja nazw i sterowanie w pliku – np. dla drugiej instancji HA. Import dodaje, niczego nie usuwając.",
    export: "Eksportuj", import: "Importuj …",
    mini_open: "Otwórz listę", mini_close: "Zwiń", card_version: "karta", stale_card: "Ta karta jest nieaktualna – odśwież stronę (Ctrl+F5) lub wyczyść pamięć podręczną frontendu w aplikacji.", offer: "Promocja", offer_until: "do", offer_expired: "wygasła",
    qty_less: "Zmniejsz ilość", qty_more: "Zwiększ ilość", qty_changed: "zmieniono ilość",
    search: "Szukaj", search_placeholder: "Szukaj na liście …", hits: "wyników", no_hits: "Nic nie znaleziono dla", add_this: "dodaj",
    imp: "Importuj", imp_ha: "Z Home Assistant", imp_text: "Jako tekst", imp_source: "Lista",
    imp_done: "Uwzględnij zrobione", imp_skip_dupes: "Pomiń już istniejące", imp_go: "Importuj",
    imp_text_help: "Jeden produkt w wierszu. Rozpoznawane są wypunktowania, [ ] / [x] i numery, a także ilości i tagi.",
    imp_preview: "Podgląd", imp_none: "Nic do zaimportowania.", imp_count: "produktów", imported: "zaimportowano", imp_dupe: "istnieje",
    imp_no_lists: "Nie znaleziono innych list w Home Assistant.",
    shop_on: "Włącz tryb zakupów", shop_off: "Zakończ tryb zakupów", in_cart: "w koszyku", undo: "Cofnij", checked_off: "odhaczono", unchecked: "przywrócono",
    deleted: "usunięto", removed: "usunięto zrobione", added: "dodano", changed: "zmieniono",
    m_rename: "Zmień nazwę / edytuj", m_move: "Przenieś do …", m_copy: "Kopiuj do …", m_category: "Zmień kategorię", m_delete: "Usuń",
    moved: "przeniesiono do", copied: "skopiowano do", no_targets: "Brak innej listy, do której możesz pisać.",
    ui: "Sterowanie", ui_help: "Każdy użytkownik ustawia to dla siebie. Opcjonalnie inaczej na każdym urządzeniu.",
    scope_household: "Domyślne dla wszystkich", scope_user: "Dla mnie na wszystkich urządzeniach", scope_device: "Tylko na tym urządzeniu",
    scope_help_household: "Dotyczy każdego, kto nie ustawił nic własnego.",
    scope_help_user: "Zapisywane są tylko twoje różnice względem domyślnych (oznaczone •). „Resetuj” = powrót do domyślnych.",
    scope_help_device: "Dotyczy tylko tej przeglądarki lub telefonu. „Resetuj” = powrót do twojego ustawienia.",
    press_gesture: "Gest menu produktu", g_long: "Długie naciśnięcie", g_double: "Dwuklik", g_right: "Prawy przycisk", g_off: "Wyłączony",
    press_target: "Gdzie działa gest", t_row: "Cały wiersz", t_name: "Tylko na nazwie",
    press_result: "Co robi gest", r_menu: "Otwórz menu", r_edit: "Edytuj od razu", r_delete: "Usuń (z potwierdzeniem)",
    menu_actions: "Pozycje menu", row_buttons: "Pokaż ołówek i kosz w wierszu",
    shop: "Tryb zakupów", shop_hide_checked: "Ukryj odhaczone", shop_keep_awake: "Nie wygaszaj ekranu",
    shop_large: "Duże wiersze", shop_tap_row: "Dotknij całego wiersza, aby odhaczyć", reset: "Resetuj",
    sort: "Sortowanie", sort_category: "Kategoria", sort_alpha: "A–Z", sort_added: "Dodanie", sort_list: "Wg listy",
    packs: "Rozpoznawanie kategorii (pakiety słów kluczowych)", packs_help: "Słowa kluczowe → kategoria. Może być aktywnych kilka pakietów (np. polski + własny). Przy tym samym słowie wygrywa pakiet wyżej. Zapamiętane kategorie mają zawsze pierwszeństwo.",
    pack_terms: "słów kluczowych", pack_products: "produktów", pack_builtin: "wbudowany", pack_custom: "własny", pack_priority: "pozycja",
    pack_up: "W górę (pierwszeństwo)", pack_download: "Pobierz", pack_delete: "Usunąć własny pakiet?", pack_bad_json: "Plik nie jest poprawnym JSON-em.",
    pack_upload: "Wgraj pakiet …", pack_name_help: "Nazwa pakietu. Ta sama nazwa zastępuje istniejący własny pakiet.", pack_add: "Dodaj",
    pack_skipped: "pominięto (nieznana kategoria)", pack_template: "Szablon",
    card_desc: "Lista zakupów z kategoriami, podpowiedziami, ilościami, plakietkami sklepów (@Biedronka) i uprawnieniami.",
    imp_placeholder: "- Mleko 2 l @Biedronka\n- [ ] Chleb\n- [x] Masło\n3 jabłka",
    e_preset_pick: "— Wybierz szablon (ustawia kilka opcji) —", e_view_list: "Lista", e_view_tiles: "Kafelki (np. tablet w kuchni)", e_view_mini: "Mini kafelek (podsumowanie, rozwijany)",
    e_sort_category: "Wg kategorii", e_sort_added: "Kolejność dodania", e_sort_list: "Wg listy źródłowej (połączona)",
    e_layout_tabs: "Karty", e_layout_columns: "Obok siebie", e_layout_stack: "Jedna pod drugą",
    e_density_compact: "Kompaktowo", e_density_normal: "Normalnie", e_density_comfortable: "Duże (dotyk)",
    e_sec_multi: "Kilka list w jednej karcie", e_sec_filter: "Filtry", e_sec_look: "Wygląd", e_sec_header: "Nagłówek", e_sec_input: "Wprowadzanie",
    e_sec_list: "Lista", e_sec_done: "Zrobione", e_sec_shop: "Tryb zakupów",
    e_pre_family: "Zakupy rodzinne (wszystko włączone)", e_pre_kitchen: "Tablet w kuchni (duże kafelki)", e_pre_store: "W sklepie (tryb zakupów, bez wprowadzania)",
    e_pre_readonly: "Tylko podgląd", e_pre_tile: "Kompaktowy kafelek na pulpit",
    l_preset: "Szablon", l_entity: "Lista", l_entities: "Listy (zamiast „Lista” powyżej)", l_layout: "Układ", l_title: "Tytuł (pusty = nazwa listy)",
    l_view: "Widok", l_sort: "Domyślne sortowanie", l_advanced: "Pokaż opcje zaawansowane",
    l_filter_store: "Tylko sklep (np. Biedronka; kilka oddziel przecinkami)", l_filter_person: "Tylko osoba (np. Anna)", l_filter_tag: "Tylko tag (np. bio)",
    l_filter_category: "Tylko kategorie", l_filter_offers: "Tylko promocje", l_filter_tags_new_items: "Nowe produkty dostają tag filtra (@Biedronka …)",
    l_show_filter_chips: "Pasek filtrów (sklepy, osoby, promocje)",
    l_density: "Wysokość wierszy", l_font_scale: "Rozmiar czcionki", l_radius: "Promień narożników", l_accent_color: "Kolor akcentu (pusty = motyw)",
    l_show_header: "Pokaż nagłówek", l_show_count: "Liczba do kupienia / wyników", l_show_search: "Wyszukiwanie (lupa)",
    l_show_sort: "Wybór sortowania", l_show_shopping: "Przycisk trybu zakupów", l_show_undo: "Cofnij (↶)",
    l_show_import: "Przycisk importu", l_show_settings: "Zębatka (ustawienia osobiste)",
    l_show_add: "Pole do dodawania", l_show_frequent: "„Często kupowane”",
    l_drag_drop: "Przeciągnij i upuść (mysz): przenieś na inną listę, zmień kolejność", l_show_stepper: "Regulacja ilości (− +)", l_show_offer: "Promocje z aplikacji (sklep, cena, ważna do)",
    l_show_tags: "Plakietki (@sklep, *osoba, #tag)", l_show_source: "Pochodzenie (lista źródłowa / osoba)", l_show_note: "Notatki",
    l_show_category_titles: "Nagłówki kategorii", l_max_height: "Maksymalna wysokość listy (pusta = bez limitu)",
    l_show_completed: "Pokaż zrobione", l_collapse_completed: "Zrobione na początku zwinięte", l_start_shopping: "Uruchom w trybie zakupów",
    hh_preset: "Ustawia pasujące opcje za jednym razem – potem wszystko można zmieniać osobno.",
    hh_entities: "Kilka list: jako karty, obok siebie lub jedna pod drugą. Wszystkie opcje dotyczą każdej listy.",
    hh_filter_tags_new_items: "W przeciwnym razie nowe produkty od razu znikałyby z przefiltrowanej karty.",
    hh_show_settings: "Gest, menu i tryb zakupów każdy użytkownik ustawia sam w zębatce.",
    hh_show_category_titles: "Wyłączone: sortowane wg kategorii, ale jako jedna lista z ikoną kategorii z przodu.",
    hh_start_shopping: "Przydatne dla tabletu w przedpokoju lub pulpitu tylko do zakupów.",
    shop_auto_store: "Wybieraj sklep automatycznie wg strefy", shop_auto_store_help: "Gdy jesteś w strefie sklepu (np. Biedronka), tryb zakupów pokazuje tylko jego produkty.",
    shop_untagged: "Pokazuj też produkty bez sklepu", shop_untagged_help: "W trybie zakupów dla jednego sklepu dodatkowo wszystko bez @sklep.",
    shop_store: "Sklep", shop_all_stores: "Wszystkie",
    pack_edit: "Edytuj słowa kluczowe", pack_new: "Nowy pakiet", pack_new_help: "Pusty pakiet, np. dla innego języka lub własnych słów. Zostanie aktywowany na samej górze.", pack_new_placeholder: "np. Nederlands",
    pack_empty: "Brak słów kluczowych – dodaj je powyżej.", pack_changed: "zmienione", pack_revert: "Cofnij zmianę", pack_ignore: "Ignoruj (jako Inne)",
    pack_more: "Wczytaj więcej", pack_term_placeholder: "Słowo kluczowe (kilka oddziel przecinkami)",
    pack_builtin_edit_help: "Pakiet wbudowany: zmiany trafiają do pakietu uzupełniającego „+” i zostają po aktualizacjach.", pack_edit_help: "Własny pakiet: zmiany działają od razu.",
    zone: "Strefa", zone_new: "Nowa strefa", zone_new_help: "Nazwa strefy. Pozycja: obecna lokalizacja tego urządzenia (inaczej dom), promień 100 m – dostosuj w Ustawienia → Obszary i strefy.",
    zone_wait: "Strefa utworzona – pojawi się za chwilę, wtedy połącz ją tutaj.", zone_here: "lokalizacja tego urządzenia", zone_home: "pozycja domu – dostosuj",
    zone_none: "brak strefy", zone_manage: "Zarządzaj strefami ↗", store_add: "Sklep ze strefą", store_add_help: "Nazwa sklepu, jak w @Biedronka. Następnie zostanie dla niego utworzona strefa.",
    stores: "Sklepy i strefy", stores_help: "Połącz sklepy ze strefami Home Assistant. W trybie zakupów zobaczysz wtedy automatycznie tylko produkty ze sklepu, w którym jesteś.",
    notes: "Notatki aplikacji", notes_help: "Aplikacja HA SmartLists zapisuje notatki we własnej liście zadań. To nie są listy zakupów, dlatego domyślnie są ukryte.",
    notes_show: "Pokazuj w SmartLists", notes_show_help: "Jako osobna sekcja 📝 na stronie – nie w Assist, akcjach ani listach połączonych.",
    notes_scope: "Kto widzi notatki", notes_scope_owner: "tylko własne konto", notes_scope_household: "cały dom",
    notes_lists: "Listy notatek i właściciele", notes_none: "Nie znaleziono listy notatek aplikacji.", notes_no_owner: "nieznany (tylko admini)",
    p_order: "Zmień kolejność", p_order_hint: "◀ ▶ przesuwa listę. Myszą: przeciągnij jeden chip na inny. Kolejność dotyczy też kolumn.",
    p_left: "W lewo", p_right: "W prawo",
    look: "Plakietki i kolory", look_help: "Wygląd plakietek dla całego domu. Kolory i nazwy sklepów obowiązują też w aplikacji. Puste lub ↺ = domyślne.",
    look_style: "Styl", look_filled: "wypełniony", look_soft: "delikatny", look_outline: "obramowanie", look_text: "tylko tekst",
    look_color: "Kolor", look_icon: "Symbol z przodu", look_label: "Nazwa wyświetlana", look_kinds: "Wg rodzaju", look_values: "Pojedyncze plakietki",
    look_search: "Szukaj plakietki … (np. biedronka)", look_more: "Pozostałe znajdziesz przez wyszukiwanie.", look_add: "Pokoloruj plakietkę",
    look_add_help: "Ze znakiem, np. @Kaufland, *Max lub #wege – nawet jeśli jeszcze nie była używana.",
    zone_count: "stref", zone_unlink: "Odłącz strefę", zone_add: "Strefa",
    app_list: "lista połączona aplikacji", app_list_connected: "połączona", app_list_connect: "Połącz",
  },
};

/* ------------------------------------------------------------------ */
/* Artikeltext – gleiche Regeln wie itemtext.py in der Integration     */
/* ------------------------------------------------------------------ */
const NUM = "[0-9]+(?:[.,][0-9]+)?";
const UNIT = "[a-zA-Z\\u00C0-\\u024F%°]+\\.?";
const RE_SUFFIX_UNIT = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})\\s+(${UNIT})$`);
const RE_SUFFIX_ONLY = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})$`);
const RE_PREFIX_QTY = new RegExp(`^(${NUM})\\s*(?:(${UNIT})\\s+)?(.+)$`);
const UNIT_WORDS = new Set(("stk stück st kg g gr l ml cl pck pk packung packungen fl flasche flaschen dose dosen becher " +
  "glas gläser tube bund netz beutel tüte kiste kasten rolle rollen scheiben pkg x " +
  // weitere Sprachen (gleiche Liste in itemtext.py)
  "pcs pc piece pieces pack packs bottle bottles can cans jar jars box boxes bag bags roll rolls tin tins bunch slices dozen pièce pièces paquet paquets bouteille bouteilles boîte boîtes sachet sachets rouleau rouleaux tranches ud uds unidad unidades paquete paquetes botella botellas lata latas bolsa bolsas caja cajas bote botes rollo rollos pz pezzo pezzi confezione confezioni bottiglia bottiglie lattina lattine scatola scatole busta buste vasetto rotolo rotoli szt sztuka sztuki opak opakowanie butelka butelki puszka puszki paczka paczki słoik słoiki rolka rolki").split(" "));
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
/* Eigener Dialog statt Browser-confirm/prompt – im Stil von HA, Hell/Dunkel über Theme-Variablen.
 * slDialog(root, {title, text, input, value, placeholder, ok, cancel, danger}) → Promise<string|true|null> */
const DIALOG_STYLE = `
  .dlg-back { position:fixed; inset:0; z-index:999; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:16px;
    animation:dlgfade .12s ease-out; }
  .dlg { width:100%; max-width:380px; background:var(--card-background-color,#fff); color:var(--primary-text-color,#212121);
    border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.4); padding:20px 20px 14px; font-family:inherit; }
  .dlg h2 { margin:0 0 6px; font-size:1.1rem; font-weight:600; }
  .dlg p { margin:0 0 14px; color:var(--secondary-text-color,#727272); font-size:.9rem; line-height:1.4; }
  .dlg input { width:100%; box-sizing:border-box; height:42px; border-radius:10px; border:1px solid var(--divider-color,#ccc);
    background:var(--secondary-background-color,#f2f2f2); color:inherit; font:inherit; padding:0 12px; margin:0 0 14px; }
  .dlg input:focus { outline:2px solid var(--primary-color,#03a9f4); outline-offset:-1px; border-color:transparent; }
  .dlg .row { display:flex; justify-content:flex-end; gap:8px; }
  .dlg button { height:38px; padding:0 16px; border-radius:19px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ccc);
    background:none; color:var(--primary-color,#03a9f4); }
  .dlg button.ok { background:var(--primary-color,#03a9f4); border-color:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
  .dlg button.ok.danger { background:var(--error-color,#db4437); border-color:var(--error-color,#db4437); }
  .dlg button:disabled { opacity:.5; cursor:default; }
  @keyframes dlgfade { from { opacity:0; } to { opacity:1; } }
`;
function slDialog(root, opts) {
  return new Promise((resolve) => {
    const input = opts.input ? h("input", { value: opts.value || "", placeholder: opts.placeholder || "", "aria-label": opts.title, maxlength: "60" }) : null;
    const ok = h("button", { type: "button", class: `ok ${opts.danger ? "danger" : ""}` }, opts.ok);
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const submit = () => { if (input) { const v = input.value.trim(); if (v) close(v); } else close(true); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } else if (e.key === "Enter") { e.preventDefault(); submit(); } };
    ok.addEventListener("click", submit);
    if (input) { const upd = () => { ok.disabled = !input.value.trim(); }; input.addEventListener("input", upd); upd(); }
    const back = h("div", { class: "dlg-back", onclick: (e) => { if (e.target === back) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": opts.title },
        h("h2", {}, opts.title), opts.text ? h("p", {}, opts.text) : null, input,
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => close(null) }, opts.cancel), ok)));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
    setTimeout(() => (input || ok).focus(), 30);
  });
}

// Gerade gezogener Artikel (Ziehen & Ablegen zwischen Karten im selben Fenster)
let SL_DRAG = null;

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
/* Badges & Farben des Haushalts (smartlists/config → appearance). Wird beim Laden gesetzt; ohne
 * Einstellung sehen Badges aus wie bisher (Markt gefüllt in Markenfarbe, Person/Schlagwort dezent). */
let SL_LOOK = { kinds: {}, values: {} };
const BADGE_STYLES = ["filled", "soft", "outline", "text"];
const BADGE_DEFAULTS = { store: { style: "filled", icon: "" }, person: { style: "soft", icon: "👤" }, tag: { style: "soft", icon: "#" } };
function textOn(color) {
  // helle Farben → dunkle Schrift (Lesbarkeit bei „gefüllt“)
  const m = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#1a1a1a" : "#fff";
}
function badge(tag, look = SL_LOOK) {
  const kind = tag.kind === "store" || tag.kind === "person" ? tag.kind : "tag";
  const k = { ...BADGE_DEFAULTS[kind], ...((look.kinds || {})[kind] || {}) };
  const v = (look.values || {})[`${kind}:${String(tag.value).toLowerCase()}`] || {};
  const label = (kind === "store" && v.label) || tag.label || tag.value;
  const color = v.color || (kind === "store" ? tag.color || k.color || hashColor(String(tag.value)) : k.color);
  const css = !color ? "" : k.style === "filled" ? `background:${color};color:${textOn(color)}`
    : k.style === "soft" ? `background:color-mix(in srgb, ${color} 18%, transparent);color:${color}`
    : `color:${color}`;
  const cls = { store: "store", person: "person", tag: "hash" }[kind];
  const icon = k.icon ? (kind === "person" ? `${k.icon} ` : k.icon) : "";
  return h("span", { class: `tag ${cls} s-${k.style}`, style: css, title: label }, icon, label);
}

const STYLE = `
  /* Anpassbar per Theme oder card-mod: --smartlists-accent, --smartlists-radius, --smartlists-row-height */
  :host { display:block; --sl-accent: var(--smartlists-accent, var(--primary-color)); }
  ha-card { border-radius: var(--smartlists-radius, var(--ha-card-border-radius, 12px)); }
  [hidden] { display:none !important; }
  ha-card { overflow:visible; position:relative; }
  .head { display:flex; align-items:center; gap:8px; padding:16px 12px 8px 16px; }
  .title { font-size:1.25rem; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge { font-size:.7rem; padding:2px 8px; border-radius:10px; background:var(--sl-accent); color:var(--text-primary-color,#fff); white-space:nowrap; }
  .badge.foreign { background:var(--warning-color,#f5a623); }
  .badge.own { background:var(--secondary-background-color,#eee); color:var(--primary-text-color); }
  .badge.combined { background:var(--info-color,#2196f3); }
  .count { color:var(--secondary-text-color); font-size:.85rem; white-space:nowrap; }
  .sort { display:flex; align-items:center; gap:2px; color:var(--secondary-text-color); }
  .sort select { background:none; border:none; padding:4px 2px; font-size:.85rem; color:var(--secondary-text-color); cursor:pointer; }

  .add { position:relative; padding:4px 16px 10px; }
  .add-row { display:flex; gap:6px; }
  input, select { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color,#f2f2f2);
    border:1px solid transparent; border-radius:8px; padding:9px 11px; min-width:0; box-sizing:border-box; }
  input:focus, select:focus { outline:none; border-color:var(--sl-accent); }
  .add .smart { flex:1; }
  .go { border:none; border-radius:8px; background:var(--sl-accent); color:var(--text-primary-color,#fff);
    padding:0 14px; cursor:pointer; display:flex; align-items:center; }
  .go:disabled { opacity:.45; cursor:default; }
  .preview { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-height:24px; margin-top:6px; font-size:.82rem; color:var(--secondary-text-color); }
  .preview:empty { display:none; }
  .catchip { display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--divider-color,#ccc); background:none; border-radius:12px;
    padding:2px 9px; font:inherit; font-size:.8rem; color:var(--primary-text-color); cursor:pointer; }
  .catchip:hover { border-color:var(--sl-accent); }
  .catchip .src { color:var(--secondary-text-color); font-size:.72rem; }
  .catchip.manual { border-style:solid; border-color:var(--sl-accent); }
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
  .fchip:hover { border-color:var(--sl-accent); color:var(--sl-accent); }

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
  .qtycol { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; color:var(--sl-accent); white-space:nowrap; font-size:.9rem; }
  .unitcol { text-align:left; color:var(--secondary-text-color); white-space:nowrap; font-size:.85rem; }
  .row.checked .qtycol { color:var(--secondary-text-color); font-weight:400; }
  /* Mengen-Stepper − 2 + (wie in der App) */
  .stepper { display:inline-flex; align-items:center; gap:2px; justify-content:flex-end; }
  .stepper .sbtn { width:24px; height:24px; border-radius:50%; border:1px solid var(--divider-color,#ddd); background:none; padding:0;
    display:inline-flex; align-items:center; justify-content:center; color:var(--secondary-text-color); cursor:pointer; flex:none; }
  .stepper .sbtn:hover { border-color:var(--sl-accent); color:var(--sl-accent); }
  .stepper .sval { min-width:1.6em; text-align:center; }
  .shopping .row.large .stepper .sbtn { width:30px; height:30px; }
  .row:hover { background:var(--secondary-background-color,#f6f6f6); }
  .box { flex:none; width:22px; height:22px; border-radius:6px; border:2px solid var(--secondary-text-color); background:none;
    padding:0; cursor:pointer; display:flex; align-items:center; justify-content:center; color:transparent; }
  .box.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .box:disabled { opacity:.45; cursor:not-allowed; }
  .main { flex:1; min-width:0; }
  .name-line { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; }
  /* Lange Namen hart umbrechen statt die Spalten zu verschieben */
  .iname { overflow-wrap:anywhere; word-break:break-word; hyphens:auto; min-width:0; }
  .row.checked .iname { text-decoration:line-through; color:var(--secondary-text-color); }
  .row.checked .tag { opacity:.55; }
  .chip { font-size:.72rem; padding:1px 7px; border-radius:9px; background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); white-space:nowrap; }
  .chip.qty { background:color-mix(in srgb, var(--sl-accent) 14%, transparent); color:var(--sl-accent); font-weight:600; }
  .tag { font-size:.7rem; font-weight:700; padding:1px 7px; border-radius:4px; white-space:nowrap; letter-spacing:.02em; }
  .tag.store { color:#fff; }
  .tag.person { background:color-mix(in srgb, var(--info-color,#7b61ff) 15%, transparent); color:var(--info-color,#7b61ff); font-weight:600; border-radius:9px; }
  .tag.hash { background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); font-weight:600; border-radius:9px; }
  .tag.s-filled.person, .tag.s-filled.hash { border-radius:4px; }
  .tag.s-outline { background:none !important; border:1px solid currentColor; padding:0 6px; }
  .tag.s-text { background:none !important; padding:0 2px; }
  .look-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .look-row input[type=color] { width:36px; height:30px; padding:0 2px; border:1px solid var(--divider-color,#ddd); border-radius:8px; background:none; cursor:pointer; flex:none; }
  .look-row input.icon { width:46px; text-align:center; height:30px; }
  .look-row select { width:auto !important; }
  .zchips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; align-items:center; }
  .zchip { display:inline-flex; align-items:center; gap:2px; border:1px solid var(--divider-color,#ddd); border-radius:14px; padding:2px 4px 2px 10px; font-size:.8rem; }
  .zchip button { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; line-height:1; padding:0 4px; }
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
  .btn { font:inherit; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; background:none; color:var(--sl-accent); }
  .btn.primary { background:var(--sl-accent); color:var(--text-primary-color,#fff); }
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
  .shopbtn.on { color:var(--text-primary-color,#fff); background:var(--sl-accent); }
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
  .own { color:var(--sl-accent); font-weight:700; margin-left:2px; }
  .inline-checks { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:.85rem; }

  .tabs { display:flex; gap:4px; margin:10px 0 8px; }
  .tabs button { flex:1; border:1px solid var(--divider-color,#ddd); background:none; border-radius:8px; padding:7px; font:inherit; font-size:.88rem;
    cursor:pointer; color:var(--primary-text-color); }
  .tabs button.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  textarea { font:inherit; width:100%; box-sizing:border-box; min-height:120px; resize:vertical; color:var(--primary-text-color);
    background:var(--secondary-background-color,#f2f2f2); border:1px solid transparent; border-radius:8px; padding:9px 11px; }
  textarea:focus { outline:none; border-color:var(--sl-accent); }
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

  .row[draggable="true"] { cursor:grab; }
  .row.dragging { opacity:.4; }
  .row.dropbefore { box-shadow: inset 0 3px 0 var(--sl-accent); }
  ha-card.droptarget { outline:2px dashed var(--sl-accent); outline-offset:-4px; }
  .density-compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .density-comfortable .row { min-height:var(--smartlists-row-height, 54px); }
  .density-comfortable .box { width:26px; height:26px; }
  .filterbar { display:flex; gap:6px; overflow-x:auto; padding:0 16px 8px; scrollbar-width:none; }
  .fchip.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .fixedfilter { padding:0 16px 6px; font-size:.78rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--smartlists-tile-size,110px),1fr)); gap:8px; padding:4px 16px 12px; }
  .tile { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-height:96px; padding:10px 6px;
    border-radius:12px; border:1px solid var(--divider-color,#e0e0e0); background:var(--card-background-color,#fff); cursor:pointer; text-align:center;
    font:inherit; color:var(--primary-text-color); }
  .tile:hover { border-color:var(--sl-accent); }
  .tile .te { font-size:1.8rem; line-height:1; }
  .tile .tn { font-size:.9rem; overflow-wrap:anywhere; }
  .tile .tq { font-size:.78rem; font-weight:700; color:var(--sl-accent); }
  .tile .tb { display:flex; gap:3px; flex-wrap:wrap; justify-content:center; }
  .tile.checked { opacity:.45; } .tile.checked .tn { text-decoration:line-through; }
  .tile:disabled { cursor:default; }
  .mini { display:flex; align-items:center; gap:10px; padding:14px 16px; cursor:pointer; }
  .mini .mt { font-weight:600; flex:1; min-width:0; }
  .mini .ms { font-size:.82rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .mini .mcount { font-size:1.6rem; font-weight:700; color:var(--sl-accent); }

  /* Zahnrad-Menü */
  .sl-settings { padding:12px 14px 14px; display:flex; flex-direction:column; gap:12px; border-top:1px solid var(--divider-color,#e0e0e0);
    background:color-mix(in srgb, var(--secondary-background-color,#f2f2f2) 40%, var(--card-background-color,#fff)); }
  .tabs2 { display:flex; background:var(--secondary-background-color,#eee); border-radius:10px; padding:3px; gap:3px; }
  .tabs2 button { flex:1; border:none; background:none; color:var(--secondary-text-color); font:inherit; font-weight:500; padding:7px 6px; border-radius:8px; cursor:pointer; }
  .tabs2 button.on { background:var(--card-background-color,#fff); color:var(--primary-text-color); box-shadow:0 1px 2px rgba(0,0,0,.25); }
  .tabs2 .tag { font-size:.66rem; margin-left:4px; padding:1px 5px; border-radius:6px; background:var(--divider-color,#ddd); color:var(--secondary-text-color); }
  .sec { background:var(--card-background-color,#fff); border:1px solid var(--divider-color,#e0e0e0); border-radius:12px; overflow:hidden; }
  .sh { display:flex; align-items:center; gap:10px; padding:12px 14px 4px; }
  .sh .ic { width:28px; height:28px; border-radius:8px; display:grid; place-items:center; flex:none; font-size:.95rem;
    background:color-mix(in srgb, var(--sl-accent) 16%, transparent); color:var(--sl-accent); font-weight:700; }
  .sh h3 { margin:0; font-size:.95rem; font-weight:600; flex:1; min-width:0; }
  .sh .cnt { font-size:.75rem; color:var(--secondary-text-color); white-space:nowrap; }
  .shelp { margin:0; padding:0 14px 10px 52px; color:var(--secondary-text-color); font-size:.8rem; }
  .sbody { padding:0 14px 14px; }
  .srow2 { display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--divider-color,#e0e0e0); }
  .sbody > .srow2:first-child, .chips + .srow2, .grp + .srow2 { border-top:none; }
  .srow2 .sl { flex:1; min-width:0; }
  .srow2 .sl small { display:block; color:var(--secondary-text-color); font-size:.76rem; overflow-wrap:anywhere; }
  .srow2 select { width:180px; flex:none; height:36px; padding:0 10px; }
  .srow2 .val { color:var(--secondary-text-color); font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
  .grp { font-size:.72rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--secondary-text-color); margin:12px 0 4px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip2 { border:1px solid var(--divider-color,#ddd); background:none; color:var(--primary-text-color); border-radius:16px; padding:6px 12px; font:inherit; font-size:.85rem; cursor:pointer; }
  .chip2.on { background:color-mix(in srgb, var(--sl-accent) 18%, transparent); border-color:var(--sl-accent); color:var(--sl-accent); font-weight:600; }
  .switch { position:relative; width:38px; height:22px; flex:none; display:inline-block; }
  .switch input { opacity:0; width:0; height:0; position:absolute; }
  .switch span { position:absolute; inset:0; border-radius:11px; background:var(--divider-color,#ccc); transition:.15s; cursor:pointer; }
  .switch span::after { content:""; position:absolute; width:16px; height:16px; left:3px; top:3px; border-radius:50%; background:#bdbdbd; transition:.15s; }
  .switch input:checked + span { background:color-mix(in srgb, var(--sl-accent) 55%, transparent); }
  .switch input:checked + span::after { left:19px; background:var(--sl-accent); }
  .switch input:focus-visible + span { outline:2px solid var(--sl-accent); outline-offset:2px; }
  .rule2 { display:grid; grid-template-columns:44px 1fr 32px; gap:8px; align-items:center; margin-bottom:8px; }
  .rule2 .char { height:40px; text-align:center; font:700 1.1rem/1 ui-monospace, monospace; padding:0; }
  .rule2 select { height:40px; width:100%; }
  .preview2 { padding:10px 12px; border-radius:10px; background:var(--secondary-background-color,#f2f2f2); display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:.85rem; }
  .preview2 code { color:var(--secondary-text-color); font-size:.8rem; }
  .preview2 .arrow { color:var(--secondary-text-color); }
  .acts { display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .ok2 { margin-right:auto; color:var(--success-color,#43a047); font-size:.8rem; }
  .btn2 { height:36px; padding:0 14px; border-radius:18px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ddd); background:none; color:var(--sl-accent); }
  .btn2.primary { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .srow2 .icon-btn.up svg { transform:rotate(180deg); }
  .btn2.danger { color:var(--error-color,#db4437); }
  .search2 { width:100%; height:40px; }
  .learned2 { max-height:236px; overflow:auto; margin-top:8px; border:1px solid var(--divider-color,#e0e0e0); border-radius:10px; }
  .lrow2 { display:grid; grid-template-columns:minmax(0,1fr) auto 30px; align-items:center; gap:8px; padding:4px 4px 4px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow2:last-child { border-bottom:none; }
  .lrow2:nth-child(odd) { background:color-mix(in srgb, var(--secondary-background-color,#f2f2f2) 45%, transparent); }
  .lrow2 .w { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lrow2 .cat { font-size:.78rem; padding:3px 9px; border-radius:12px; background:var(--secondary-background-color,#eee); border:1px solid var(--divider-color,#ddd); white-space:nowrap; }
  .manual { font-size:.68rem; color:var(--sl-accent); margin-left:6px; }
  .foot2 { display:flex; justify-content:space-between; padding:0 4px; font-size:.75rem; color:var(--secondary-text-color); }
  .foot2 a { color:var(--sl-accent); text-decoration:none; }
`;

class SmartListsCard extends HTMLElement {
  setConfig(config) {
    const many = Array.isArray(config && config.entities) ? config.entities.filter(Boolean) : [];
    if (!config || (!config.entity && !many.length)) throw new Error("Please set 'entity' (one list) or 'entities' (several).");
    if (many.length && !config.entity) return this._setupMulti(config, many);
    this._multi = null;
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
    if (this._multi) { this._hass = hass; this._multi.children.forEach((c) => { c.hass = hass; }); this._renderMultiTabs(); return; }
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
    const st = (hass && hass.states) || {};
    const e = Object.keys(st).find((k) => k.startsWith("todo.") && !isNotesEntity(k, st[k].attributes && st[k].attributes.friendly_name));
    return { entity: e || "todo.einkaufsliste" };
  }

  get _lang() { return ((this._hass && this._hass.language) || "de").slice(0, 2); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }
  get _isAdmin() { return !this._hass.user || this._hass.user.is_admin; }
  _call(type, extra = {}, withEntity = true) {
    return this._hass.callWS({ type: `smartlists/${type}`, ...(withEntity ? { entity_id: this._config.entity } : {}), ...extra });
  }
  _resetDraft() {
    this._draft = { text: "", parsed: null, info: null, pickedCat: null, sugg: [], suggMode: "name", active: -1 };
  }

  async _loadConfig() {
    try {
      this._cfg = await this._call("config", { language: this._lang }, false);
      if (this._cfg && this._cfg.appearance) SL_LOOK = this._cfg.appearance;
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
      const data = await this._call("get_list", { language: this._lang });
      if (!data || !Array.isArray(data.items)) throw new Error("Unexpected response from the SmartLists integration – please update the integration.");
      // Rückfall: steht die ⚙OFFER-Zeile der App noch in der Notiz, hier selbst zerlegen
      for (const it of data.items) {
        if (!it.offer && it.note) { const r = parseOfferNote(it.note, this._cfg && this._cfg.known_stores); if (r.offer) { it.offer = r.offer; it.note = r.note; } }
      }
      if (data.type === "notes" && !this._notesApplied) {
        this._notesApplied = true;
        for (const [k, v] of Object.entries(NOTES_DEFAULTS)) if (!(k in (this._rawConfig || {}))) this._config[k] = v;
        this._sortMode = this._config.sort;
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
  async _deleteItems(items, label) {
    if (!items.length) return;
    const t = this._t;
    const many = items.length > 1;
    const yes = await slDialog(this.shadowRoot, { title: many ? t.clear : t.delete, danger: true, ok: t.delete, cancel: t.cancel,
      text: many ? `${t.confirm_clear} (${items.length})` : `„${items[0].name}“ – ${t.confirm_delete}` });
    if (!yes) return;
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
    this._filterEl = h("div");
    this._settingsEl = h("div");
    this._importEl = h("div");
    this._addEl = h("div");
    this._freqEl = h("div");
    this._msgEl = h("div");
    this._listEl = h("div");
    this._progressEl = h("div");
    this._menuEl = h("div");
    this._snackEl = h("div");
    this._card = h("ha-card", {}, this._headEl, this._searchEl, this._filterEl, this._progressEl, this._settingsEl, this._importEl, this._addEl, this._freqEl, this._msgEl,
      this._listEl, this._snackEl, this._menuEl);
    fill(root, h("style", {}, STYLE), this._card);
    this._bindDropZone();
    const density = this._config.compact ? "compact" : this._config.density;
    this._card.classList.toggle("compact", density === "compact");
    ["compact", "normal", "comfortable"].forEach((x) => this._card.classList.toggle(`density-${x}`, density === x));
    // Aussehen pro Karte: Akzentfarbe (Hex oder [r,g,b] vom Farbwähler), Eckenradius, Schriftgröße
    const acc = this._config.accent_color;
    const accent = Array.isArray(acc) ? `rgb(${acc.join(",")})` : acc;
    if (accent) this.style.setProperty("--smartlists-accent", accent); else this.style.removeProperty("--smartlists-accent");
    if (this._config.radius != null && this._config.radius !== "") this.style.setProperty("--smartlists-radius", `${Number(this._config.radius)}px`);
    else this.style.removeProperty("--smartlists-radius");
    const scale = Number(this._config.font_scale) || 1;
    this._card.style.zoom = scale !== 1 ? String(scale) : "";
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
    this._hitCount = this._searchQuery ? d.items.filter((i) => this._passesFilters(i) && this._matches(i, d)).length : 0;
    fill(this._headEl, 
      h("div", { class: "title" }, this._config.title || d.name),
      d.type === "combined" ? h("span", { class: "badge combined" }, t.combined) : null,
      d.own ? h("span", { class: "badge own", title: `${t.owner}: ${d.own.owner || "?"}` },
        d.own.role === "owner" ? (Object.keys(d.own.shares || {}).length ? `👥 ${t.shared}` : `🔒 ${t.private}`) : `👤 ${d.own.owner || "?"} · ${t["role_" + d.own.role]}`) : null,
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
    if (this._config.settings_only) {
      // Seitenleiste → Einstellungen: nur das Menü, ohne Liste und Kopfzeile
      this._showSettings = true;
      [this._headEl, this._searchEl, this._filterEl, this._progressEl, this._addEl, this._freqEl, this._listEl].forEach((e) => { e.hidden = true; });
      if (!this._settingsRendered && this._cfg) { this._settingsRendered = true; this._renderSettings(); }
      fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : "");
      return;
    }
    // Mini-Ansicht: nur eine Zusammenfassung, Antippen klappt die Liste auf
    const mini = this._config.view === "mini" && !this._miniOpen;
    [this._searchEl, this._filterEl, this._progressEl, this._addEl, this._freqEl].forEach((e) => { e.hidden = mini; });
    if (mini) { this._headEl.hidden = true; fill(this._listEl, this._renderMini(d)); fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : ""); return; }
    if (this._config.view === "mini" && this._config.show_header) {
      this._headEl.prepend(iconBtn(ICON.chevron, this._t.mini_close, () => { this._miniOpen = false; this._render(); }, "collapse"));
    }
    this._renderFilterBar(d);
    this._renderAdd();
    fill(this._msgEl, this._error ? h("div", { class: "msg err" }, this._error) : "");
    this._renderList();
  }

  /* ---------------- Mehrere Listen in einer Karte ----------------
   * entities: [todo.a, {entity: todo.b, title: "…", filter_store: "REWE"}] – jede Liste ist eine eigene
   * Karte mit denselben Optionen; layout: tabs (Reiter), columns (nebeneinander), stack (untereinander). */
  _setupMulti(config, many) {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._config = { ...CARD_DEFAULTS, ...config };
    const base = { ...config }; delete base.entities; delete base.type;
    const layout = ["tabs", "columns", "stack"].includes(config.layout) ? config.layout : "tabs";
    const children = many.map((e) => {
      const own = typeof e === "string" ? { entity: e } : { ...e };
      const card = document.createElement("smartlists-card");
      card.setConfig({ ...base, ...own, title: own.title || (layout === "tabs" ? "" : undefined) });
      if (this._hass) card.hass = this._hass;
      return card;
    });
    let active = 0;
    try { active = Math.min(children.length - 1, Number(localStorage.getItem(`smartlists-multi:${many.map((e) => e.entity || e).join(",")}`)) || 0); } catch (e) { /* */ }
    this._multi = { layout, children, active, key: `smartlists-multi:${many.map((e) => e.entity || e).join(",")}`, titles: many.map((e) => (typeof e === "object" && e.title) || null) };
    const style = h("style", {}, ":host{display:block} "
      + ".multi-tabs{display:flex;gap:6px;overflow-x:auto;padding:0 0 8px;scrollbar-width:none} .multi-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px} .multi-stack{display:flex;flex-direction:column;gap:12px}"
      + ".tab{flex:none;border:1px solid var(--divider-color,#ddd);background:var(--card-background-color,#fff);border-radius:18px;padding:6px 12px;font:inherit;font-size:.9rem;cursor:pointer;color:var(--primary-text-color);white-space:nowrap}"
      + ".tab.on{background:var(--smartlists-accent,var(--primary-color));border-color:var(--smartlists-accent,var(--primary-color));color:var(--text-primary-color,#fff)} .tab .n{font-size:.75rem;opacity:.75;margin-left:4px}");
    this._multiTabsEl = h("div", { class: "multi-tabs", role: "tablist" });
    const body = h("div", { class: layout === "tabs" ? "multi-tabs-body" : layout === "columns" ? "multi-cols" : "multi-stack" }, children);
    this.shadowRoot.replaceChildren(style, layout === "tabs" ? this._multiTabsEl : "", body);
    this._renderMultiTabs();
  }
  _renderMultiTabs() {
    const m = this._multi;
    if (!m || m.layout !== "tabs") return;
    m.children.forEach((c, i) => { c.hidden = i !== m.active; });
    const st = (this._hass && this._hass.states) || {};
    fill(this._multiTabsEl, m.children.map((c, i) => {
      const e = c._config.entity; const s = st[e];
      const name = m.titles[i] || (s && s.attributes.friendly_name) || e;
      return h("button", { type: "button", role: "tab", class: `tab ${i === m.active ? "on" : ""}`, "aria-selected": String(i === m.active),
        onclick: () => { m.active = i; try { localStorage.setItem(m.key, String(i)); } catch (err) { /* */ } this._renderMultiTabs(); } },
        name, s ? h("span", { class: "n" }, String(Number(s.state) || 0)) : null);
    }));
  }

  /* ---------------- Filter ----------------
   * Feste Filter aus der Karten-Konfiguration + Auswahl in der Filter-Leiste (nur für diese Sitzung). */
  _fixedFilters() {
    const c = this._config;
    const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
    return { store: list(c.filter_store), person: list(c.filter_person), tag: list(c.filter_tag), category: list(c.filter_category), offers: !!c.filter_offers };
  }
  _passesFilters(it) {
    const f = this._fixedFilters();
    const has = (kind, values) => !values.length || (it.tags || []).some((t) => t.kind === kind && values.some((v) => v.toLowerCase() === String(t.value).toLowerCase()))
      || (kind === "store" && it.offer && values.some((v) => v.toLowerCase() === String(it.offer.store).toLowerCase()));
    if (!has("store", f.store) || !has("person", f.person) || !has("tag", f.tag)) return false;
    if (f.category.length && !f.category.includes(it.category)) return false;
    if (f.offers && !it.offer) return false;
    // Einkaufsmodus für einen Markt: nur dessen Artikel (optional auch solche ohne Markt)
    if (this._shopping && this._shopStore) {
      const stores = (it.tags || []).filter((t) => t.kind === "store").map((t) => String(t.value).toLowerCase());
      if (it.offer && it.offer.store) stores.push(String(it.offer.store).toLowerCase());
      if (stores.length ? !stores.includes(this._shopStore) : !(this._ui && this._ui.shop_untagged)) return false;
    }
    const chip = this._chip;
    if (chip) {
      if (chip.kind === "category") return it.category === chip.value;
      if (chip.kind === "offer") return !!it.offer;
      return has(chip.kind, [chip.value]);
    }
    return true;
  }
  /* Märkte & Zonen: In welcher Markt-Zone ist meine Person gerade? (zone.* → Markt aus smartlists/config) */
  _storeHere() {
    const zones = (this._cfg && this._cfg.store_zones) || {};
    const st = this._hass.states;
    const me = Object.values(st).find((s) => s.entity_id.startsWith("person.") && s.attributes.user_id === (this._hass.user && this._hass.user.id));
    if (!me) return null;
    for (const [store, list] of Object.entries(zones)) {
      // mehrere Zonen je Markt (Filialen); ältere Integration: eine Zone als Text
      for (const zone of Array.isArray(list) ? list : [list]) {
        const z = st[zone];
        if (!z) continue;
        // Person-Zustand = Name der Zone; zusätzlich: Zone zählt Personen (attributes.persons)
        if (me.state === z.attributes.friendly_name || (z.attributes.persons || []).includes(me.entity_id)) return store;
      }
    }
    return null;
  }
  // Leiste im Einkaufsmodus: Alle | REWE · 4 | Lidl · 2 … (Markt der aktuellen Zone vorausgewählt)
  _shopStoreBar(d) {
    const t = this._t;
    const open = d.items.filter((i) => !i.checked);
    const counts = new Map();
    for (const it of open) {
      const seen = new Set();
      (it.tags || []).filter((x) => x.kind === "store").forEach((x) => seen.add(JSON.stringify([String(x.value).toLowerCase(), x.label, x.color])));
      if (it.offer && it.offer.store) seen.add(JSON.stringify([String(it.offer.store).toLowerCase(), it.offer.store_label || it.offer.store, it.offer.color]));
      for (const k of seen) { const [key, label, color] = JSON.parse(k); const e = counts.get(key) || { key, label, color, n: 0 }; e.n++; counts.set(key, e); }
    }
    if (this._shopStore && !counts.has(this._shopStore)) counts.set(this._shopStore, { key: this._shopStore, label: this._shopStore.toUpperCase(), n: 0 });
    if (!counts.size) return null;
    const zones = (this._cfg && this._cfg.store_zones) || {};
    const chip = (key, label, n, color) => {
      const on = (this._shopStore || null) === key;
      return h("button", { type: "button", class: `fchip ${on ? "on" : ""}`, "aria-pressed": String(on),
        style: on && color ? `background:${color};border-color:${color};color:#fff` : "",
        onclick: () => { this._shopStore = key; this._render(); } }, key && zones[key] ? "📍 " : "", label, n != null ? ` · ${n}` : "");
    };
    return h("div", { class: "filterbar shopstores", role: "toolbar", "aria-label": t.shop_store },
      chip(null, t.shop_all_stores, open.length),
      [...counts.values()].sort((a, b) => b.n - a.n).map((c) => chip(c.key, c.label, c.n, c.color)));
  }
  _renderFilterBar(d) {
    const el = this._filterEl;
    if (!el) return;
    const f = this._fixedFilters();
    const fixed = [...f.store.map((v) => ({ kind: "store", value: v, label: v })), ...f.person.map((v) => ({ kind: "person", value: v, label: v })),
      ...f.tag.map((v) => ({ kind: "tag", value: v, label: v }))];
    const parts = [];
    if (this._shopping && !f.store.length) parts.push(this._shopStoreBar(d));
    if (fixed.length || f.category.length || f.offers) {
      parts.push(h("div", { class: "fixedfilter" }, "Filter:", fixed.map((x) => badge(x)),
        f.category.map((cid) => h("span", { class: "chip" }, (d.categories.find((c) => c.id === cid) || {}).label || cid)),
        f.offers ? h("span", { class: "chip" }, "🏷️ " + this._t.offer) : null));
    }
    if (this._config.show_filter_chips) {
      const open = d.items.filter((i) => !i.checked);
      const counts = new Map();
      const add = (key, chip) => { const e = counts.get(key) || { ...chip, n: 0 }; e.n++; counts.set(key, e); };
      for (const it of open) {
        (it.tags || []).forEach((t) => add(`${t.kind}:${String(t.value).toLowerCase()}`, { kind: t.kind, value: t.value, label: t.label }));
        if (it.offer) add("offer:", { kind: "offer", value: "", label: "🏷️ " + this._t.offer });
      }
      const chips = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 12);
      if (chips.length) {
        parts.push(h("div", { class: "filterbar", role: "toolbar" }, chips.map((c) => {
          const on = this._chip && this._chip.kind === c.kind && String(this._chip.value).toLowerCase() === String(c.value).toLowerCase();
          return h("button", { type: "button", class: `fchip ${on ? "on" : ""}`, "aria-pressed": String(on),
            onclick: () => { this._chip = on ? null : { kind: c.kind, value: c.value }; this._render(); } },
            c.kind === "person" ? "👤 " : c.kind === "tag" ? "#" : "", c.label, ` · ${c.n}`);
        })));
      }
    }
    fill(el, ...parts);
  }

  /* ---------------- Ziehen & Ablegen (Maus/Stift) ----------------
   * Auf eine andere SmartLists-Karte/Liste ziehen = verschieben (Strg/Alt = kopieren). Innerhalb der
   * Liste auf einen Artikel ziehen = davor einsortieren (nur bei Sortierung „Hinzugefügt“ und Listen,
   * die das können). Auf Touch-Geräten geht Verschieben über langes Drücken → Menü. */
  _bindDrag(row, it, d) {
    if (this._config.drag_drop === false) return;
    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      SL_DRAG = { entity: this._config.entity, uid: it.uid, name: it.name, canRemove: !!it.permissions.delete };
      try { e.dataTransfer.effectAllowed = "copyMove"; e.dataTransfer.setData("text/plain", it.text || it.name); } catch (err) { /* */ }
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => { SL_DRAG = null; row.classList.remove("dragging"); this._clearDropMarks(); });
    row.addEventListener("dragover", (e) => {
      if (!SL_DRAG || SL_DRAG.entity !== this._config.entity || SL_DRAG.uid === it.uid || !this._canReorder(d)) return;
      e.preventDefault(); e.stopPropagation();
      this._clearDropMarks(); row.classList.add("dropbefore");
    });
    row.addEventListener("drop", async (e) => {
      if (!SL_DRAG || SL_DRAG.entity !== this._config.entity || SL_DRAG.uid === it.uid || !this._canReorder(d)) return;
      e.preventDefault(); e.stopPropagation();
      const moving = SL_DRAG.uid; SL_DRAG = null; this._clearDropMarks();
      // HA erwartet den Vorgänger: den Artikel direkt vor dem Ziel (keiner = an den Anfang)
      const idx = d.items.findIndex((x) => x.uid === it.uid);
      const prev = d.items.slice(0, idx).reverse().find((x) => x.uid !== moving);
      const msg = { type: "todo/item/move", entity_id: this._config.entity, uid: moving };
      if (prev) msg.previous_uid = prev.uid;
      try { await this._hass.callWS(msg); this._error = null; } catch (err) { this._error = (err && err.message) || this._t.error; }
      this._load();
    });
  }
  _canReorder(d) { return this._sortMode === "added" && d.type !== "combined" && !!(d.permissions && d.permissions.reorder); }
  _clearDropMarks() {
    if (!this._card) return;
    this._card.classList.remove("droptarget");
    const walk = (n) => { if (n.classList) n.classList.remove("dropbefore"); (n.childNodes || []).forEach(walk); };
    walk(this._listEl);
  }
  _bindDropZone() {
    const card = this._card;
    card.addEventListener("dragover", (e) => {
      if (!SL_DRAG || SL_DRAG.entity === this._config.entity || !this._data || !this._data.permissions.add) return;
      e.preventDefault(); card.classList.add("droptarget");
    });
    card.addEventListener("dragleave", (e) => { if (e.target === card) card.classList.remove("droptarget"); });
    card.addEventListener("drop", async (e) => {
      if (!SL_DRAG || SL_DRAG.entity === this._config.entity) return;
      e.preventDefault(); card.classList.remove("droptarget");
      const src = SL_DRAG; SL_DRAG = null;
      const copy = !src.canRemove || e.ctrlKey || e.altKey;
      try {
        await this._hass.callWS({ type: "smartlists/move_item", entity_id: src.entity, uid: src.uid, target: this._config.entity, copy });
        this._showSnack(`${src.name} ${copy ? this._t.copied : this._t.moved} ${this._data.name}`);
        this._error = null;
      } catch (err) { this._error = (err && err.message) || this._t.error; }
      this._load();
    });
  }

  /* ---------------- Mini-Ansicht ---------------- */
  _renderMini(d) {
    const t = this._t;
    const open = d.items.filter((i) => !i.checked && this._passesFilters(i));
    const stores = new Map();
    open.forEach((i) => (i.tags || []).filter((x) => x.kind === "store").forEach((x) => stores.set(x.label, (stores.get(x.label) || { ...x, n: 0 })) && stores.get(x.label).n++));
    const today = new Date().toISOString().slice(0, 10);
    const ending = open.filter((i) => i.offer && i.offer.valid_until && i.offer.valid_until >= today).sort((a, b) => a.offer.valid_until.localeCompare(b.offer.valid_until))[0];
    const day = (iso) => { const p = String(iso).slice(0, 10).split("-"); return `${p[2]}.${p[1]}.`; };
    return h("div", { class: "mini", role: "button", tabindex: "0", title: t.mini_open,
      onclick: () => { this._miniOpen = true; this._render(); }, onkeydown: (e) => { if (e.key === "Enter") { this._miniOpen = true; this._render(); } } },
      h("span", { class: "mcount" }, String(open.length)),
      h("div", { class: "mt" }, this._config.title || d.name,
        h("div", { class: "ms" }, `${t.open}`, [...stores.values()].slice(0, 4).map((x) => [badge(x), ` ${x.n}`]),
          ending ? h("span", {}, `· 🏷️ ${ending.name} ${t.offer_until} ${day(ending.offer.valid_until)}`) : null)),
      svg(ICON.chevron, 20));
  }

  /* ---------------- Kachel-Ansicht ---------------- */
  _tile(it, d) {
    const cat = d.categories.find((c) => c.id === it.category);
    const p = it.permissions;
    const qty = it.quantity != null ? `${it.pack_count > 1 ? it.pack_count + "× " : ""}${fmtQty(it.quantity)}${it.unit ? " " + it.unit : ""}` : "";
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    const el = h("button", { type: "button", class: `tile ${it.checked ? "checked" : ""}`, disabled: !p.toggle, "aria-pressed": String(it.checked),
      title: it.name, onclick: () => { if (this._suppressClick) { this._suppressClick = false; return; } this._toggleItem(it); } },
      h("span", { class: "te" }, cat ? emojiOf(cat.label) : "📦"),
      h("span", { class: "tn" }, it.name),
      qty ? h("span", { class: "tq" }, qty) : null,
      tags.length || it.offer ? h("span", { class: "tb" }, tags.map(badge), it.offer && it.offer.price != null ? h("span", { class: "chip" }, `${it.offer.price.toFixed(2).replace(".", ",")} €`) : null) : null);
    this._bindPress(el, it, el);
    return el;
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
  async _saveUi(patch, scopeOverride) {
    const scope = scopeOverride || this._uiScope;
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
  async _resetUi(scopeOverride) {
    const scope = scopeOverride || this._uiScope;
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
    this._shopStore = this._shopping && this._ui && this._ui.shop_auto_store !== false ? this._storeHere() : null;
    this._card.classList.toggle("shopping", this._shopping);
    if (this._shopping && this._ui.shop_keep_awake) await this._wake(true);
    if (!this._shopping) await this._wake(false);
    this._render();
    // „Bin im Laden“: Ereignis smartlists_shopping für Automationen/Blueprint (Markt = fester Filter, falls einer)
    const f = this._fixedFilters();
    const open = this._data ? this._data.items.filter((i) => !i.checked).length : null;
    this._call("shopping", { active: this._shopping, store: f.store.length === 1 ? f.store[0] : this._shopStore || null, open_items: open }).catch(() => {});
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
  connectedCallback() {
    if (this._hass) this._subscribe();
    // Badges & Farben geändert (in irgendeiner Karte) → neu zeichnen
    if (!this._onLook) { this._onLook = () => this._render(); window.addEventListener("smartlists-look-changed", this._onLook); }
  }
  disconnectedCallback() {
    this._wake(false); this._unsubscribe();
    if (this._onLook) { window.removeEventListener("smartlists-look-changed", this._onLook); this._onLook = null; }
  }

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
      const targets = (this._targets || []).filter((l) => l.entity_id !== this._config.entity && l.can_add
        && (l.type === "notes") === (d.type === "notes"));
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
    // Karte mit festem Filter „@REWE“ / „*Anna“: neue Artikel bekommen den Tag automatisch, sonst wären sie unsichtbar
    if (this._config.filter_tags_new_items !== false) {
      const f = this._fixedFilters();
      for (const [kind, values] of [["store", f.store], ["person", f.person], ["tag", f.tag]]) {
        if (values.length === 1 && !p.tags.some((x) => x.kind === kind)) {
          const rule = cfg.tag_rules.find((r) => r.kind === kind);
          if (rule) p.tags.push({ kind, value: values[0], prefix: rule.prefix, label: values[0] });
        }
      }
    }
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
        onmousedown: (e) => e.preventDefault(), onclick: () => this._submit(s.name) },
        // fällig nach eurem Rhythmus → ⏰ vorne, Tooltip mit Abstand
        s.source === "due" ? h("span", { title: `${this._t.due_every} ${s.every_days} ${this._t.days}` }, "⏰ ") : null,
        `${emojiOf(s.category_label)} ${s.name}`))));
  }

  /* ---------------- Liste ---------------- */
  _renderList() {
    const t = this._t;
    const d = this._data;
    const searching = !!this._searchQuery;
    const filtered = d.items.filter((i) => this._passesFilters(i));
    const visible = searching ? filtered.filter((i) => this._matches(i, d)) : filtered;
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
    if (this._config.view === "tiles" && open.length) {
      // Kacheln: gleiche Reihenfolge wie die Liste, ohne Gruppen-Überschriften
      const order = d.categories.map((c) => c.id);
      const tiles = mode === "category" ? [...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b))
        : mode === "alpha" ? [...open].sort(byName) : open;
      out.splice(0, out.length, ...out.filter((x) => x.className === "nohits" || x.className === "empty"));
      out.push(h("div", { class: "tiles" }, tiles.map((i) => this._tile(i, d))));
    } else if (rows.length) out.push(h("div", { class: `items ${emoji ? "emoji" : ""}` }, rows));

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
    this._bindDrag(row, it, d);
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
        h("textarea", { "aria-label": t.imp_text, placeholder: t.imp_placeholder, value: st.text,
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

  /* ---------------- Einstellungen (Zahnrad) ----------------
   * Reiter: „Für mich“ (persönliche Bedienung), „Haushalt“ (Admins: Namenskonvention, Kategorien,
   * Sprache & Automationen, Geräte, Sichern, Bedienung für alle), „Diese Liste“ (Freigaben, Infos).
   * Alle Texte in TEXTS (de/en). */
  _sec(icon, title, help, body, count) {
    return h("div", { class: "sec" },
      h("div", { class: "sh" }, h("span", { class: "ic" }, icon), h("h3", {}, title), count != null ? h("span", { class: "cnt" }, String(count)) : null),
      help ? h("p", { class: "shelp" }, help) : null,
      h("div", { class: "sbody" }, body));
  }
  _switch(checked, onchange, label) {
    return h("label", { class: "switch", title: label }, h("input", { type: "checkbox", checked: !!checked, "aria-label": label, onchange: (e) => onchange(e.target.checked) }), h("span"));
  }
  _setRow(label, control, sub, mark) {
    return h("div", { class: "srow2" }, h("div", { class: "sl" }, label, mark ? h("span", { class: "own" }, " •") : null, sub ? h("small", {}, sub) : null), control);
  }

  // Bedienung für eine Ebene: user/device (Für mich) oder household (Standard für alle)
  _controls(scope) {
    const t = this._t;
    const ui = this._scopeValues(scope);
    const house = this._scopeValues("household");
    const differs = (key) => scope !== "household" && JSON.stringify(ui[key]) !== JSON.stringify(house[key]);
    const save = (patch) => this._saveUi(patch, scope);
    const sel = (key, opts) => h("select", { "aria-label": t[key], onchange: (e) => save({ [key]: e.target.value }) },
      opts.map(([v, l]) => h("option", { value: v, selected: ui[key] === v }, t[l])));
    const sw = (key, sub) => this._setRow(t[key], this._switch(ui[key], (v) => save({ [key]: v }), t[key]), sub, differs(key));
    const actions = ui.menu_actions || MENU_ACTIONS;
    return [
      this._setRow(t.press_gesture, sel("press_gesture", [["long", "g_long"], ["double", "g_double"], ["right", "g_right"], ["off", "g_off"]]), null, differs("press_gesture")),
      this._setRow(t.press_result, sel("press_result", [["menu", "r_menu"], ["edit", "r_edit"], ["delete", "r_delete"]]), null, differs("press_result")),
      this._setRow(t.press_target, sel("press_target", [["row", "t_row"], ["name", "t_name"]]), null, differs("press_target")),
      h("div", { class: "grp" }, t.menu_actions),
      h("div", { class: "chips" }, MENU_ACTIONS.map((a) => h("button", { type: "button", class: `chip2 ${actions.includes(a) ? "on" : ""}`, "aria-pressed": String(actions.includes(a)),
        onclick: () => save({ menu_actions: MENU_ACTIONS.filter((x) => (x === a ? !actions.includes(a) : actions.includes(x))) }) }, t["m_" + a]))),
      sw("row_buttons"),
      h("div", { class: "grp" }, t.shop),
      sw("shop_hide_checked"), sw("shop_keep_awake"), sw("shop_large", t.shop_large_help), sw("shop_tap_row"),
      sw("shop_auto_store", t.shop_auto_store_help), sw("shop_untagged", t.shop_untagged_help),
    ];
  }

  _paneMe() {
    const t = this._t;
    const device = this._uiScope === "device";
    const chip = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    return this._sec("✋", t.ui, t.ui_me_help, [
      h("div", { class: "chips", style: "margin-bottom:6px" },
        chip(!device, t.scope_user, () => this._setScope("user")), chip(device, t.scope_device, () => this._setScope("device"))),
      ...this._controls(device ? "device" : "user"),
      h("div", { class: "acts" }, h("button", { class: "btn2", type: "button", onclick: () => this._resetUi(device ? "device" : "user") }, t.reset_default)),
    ]);
  }

  _paneHouse() {
    const t = this._t;
    if (!this._isAdmin) return h("p", { class: "shelp", style: "padding:8px 4px" }, t.admin_only);
    return [this._namingSection(), this._appearanceSection(), this._storesSection(), this._notesSection(), this._packsSection(), this._learnedSection(), this._automationSection(), this._devicesSection(), this._exportImport(),
      this._sec("✋", t.ui_house, t.scope_help_household, [...this._controls("household"),
        h("div", { class: "acts" }, h("button", { class: "btn2", type: "button", onclick: () => this._resetUi("household") }, t.reset))])];
  }

  _paneList() {
    const t = this._t;
    const d = this._data;
    const out = [];
    if (d && d.own && d.own.can_share) out.push(this._sharing());
    const type = !d ? "?" : d.type === "combined" ? t.type_combined : d.type === "own" ? t.type_own : t.type_list;
    out.push(this._sec("ℹ️", t.about_list, null, [
      this._setRow(t.type, h("span", { class: "val" }, type)),
      this._setRow(t.entity, h("code", { class: "val" }, this._config.entity)),
      d && d.own ? this._setRow(t.owner, h("span", { class: "val" }, d.own.owner || "?")) : null,
      d && d.source_lists && d.source_lists.length ? this._setRow(t.sources, h("span", { class: "val" }, d.source_lists.join(", "))) : null,
    ]));
    return out;
  }

  _namingSection() {
    const t = this._t;
    const cfg = this._cfg;
    let rules = cfg.tag_rules.map((r) => ({ ...r }));
    const rulesEl = h("div");
    const exampleEl = h("div", { class: "preview2" });
    const status = h("span", { class: "ok2" });
    const drawExample = () => {
      const p = Object.fromEntries(rules.map((r) => [r.kind, r.prefix]));
      const txt = ["Milch 2 l", p.store && `${p.store}REWE`, p.person && `${p.person}Anna`, p.tag && `${p.tag}bio`].filter(Boolean).join(" ");
      const parsed = parseText(txt, rules.filter((r) => r.prefix), cfg.known_stores);
      fill(exampleEl, h("code", {}, txt), h("span", { class: "arrow" }, "→"), h("b", {}, parsed.name),
        h("span", { class: "qtycol" }, `${fmtQty(parsed.quantity)} ${parsed.unit}`), parsed.tags.map(badge));
    };
    const drawRules = () => fill(rulesEl, ...rules.map((r, i) => h("div", { class: "rule2" },
      h("input", { class: "char", value: r.prefix, maxlength: "1", "aria-label": t.char, oninput: (e) => { r.prefix = e.target.value.trim(); drawExample(); } }),
      h("select", { "aria-label": t.kind, onchange: (e) => { r.kind = e.target.value; drawExample(); } },
        cfg.tag_kinds.map((k) => h("option", { value: k, selected: k === r.kind }, t["kind_" + k]))),
      iconBtn(ICON.close, t.delete, () => { rules.splice(i, 1); drawRules(); drawExample(); }, "danger"))));
    drawRules(); drawExample();
    const save = async () => {
      status.textContent = "";
      try {
        this._cfg = await this._call("set_tag_rules", { rules: rules.filter((r) => r.prefix) }, false);
        status.textContent = "✓ " + t.saved;
        await this._load();
      } catch (e) { status.textContent = (e && e.message) || t.error; }
    };
    return this._sec("#", t.naming, t.naming_help, [rulesEl, exampleEl,
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => {
          const free = [...cfg.allowed_prefixes].find((c) => !rules.some((r) => r.prefix === c));
          rules.push({ prefix: free || "", kind: "tag" }); drawRules(); drawExample(); } }, "+ " + t.add_rule),
        h("button", { class: "btn2 primary", type: "button", onclick: save }, t.save))]);
  }

  // Kategorie-Erkennung: eingebaute + eigene Keyword-Packs, an/aus und Reihenfolge (vorne gewinnt)
  _packsSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    const count = h("span", { class: "cnt" });
    let packs = [];
    const fail = (err) => { status.textContent = (err && err.message) || t.error; };
    const changed = async (r) => { packs = r.packs; draw(); status.textContent = "✓ " + t.saved; this._cfg = await this._call("config", { language: this._lang }, false); };
    const activeIds = () => packs.filter((p) => p.active).sort((a, b) => a.priority - b.priority).map((p) => p.id);
    const setActive = async (ids) => { try { await changed(await this._call("pack_set_active", { active: ids }, false)); } catch (err) { fail(err); } };
    const download = (data, name) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const draw = () => {
      const ids = activeIds();
      count.textContent = `${ids.length}/${packs.length}`;
      fill(body, ...packs.map((p) => {
        const pos = ids.indexOf(p.id);
        const lang = p.language ? p.language.toUpperCase() + " · " : "";
        const sub = `${lang}${p.terms.toLocaleString(this._hass.language || "de")} ${t.pack_terms}${p.products ? ` · ${p.products} ${t.pack_products}` : ""} · ${p.builtin ? t.pack_builtin : t.pack_custom}${pos >= 0 ? ` · ${t.pack_priority} ${pos + 1}` : ""}`;
        return h("div", { class: "srow2" },
          h("div", { class: "sl" }, p.name, h("small", {}, sub)),
          iconBtn(ICON.pencil, t.pack_edit, () => this._packEditor(sec, p, () => this._call("packs", {}, false).then((r) => { packs = r.packs; draw(); }))),
          pos > 0 ? iconBtn(ICON.chevron, t.pack_up, () => { const n = [...ids]; n.splice(pos, 1); n.splice(pos - 1, 0, p.id); setActive(n); }, "up") : null,
          iconBtn(ICON.import, t.pack_download, async () => {
            try { download(await this._call("pack_export", { pack_id: p.id }, false), `smartlists-pack-${p.id}.json`); } catch (err) { fail(err); }
          }, "dl"),
          p.builtin ? null : iconBtn(ICON.trash, t.delete, async () => {
            if (!(await slDialog(this.shadowRoot, { title: t.pack_delete, text: p.name, ok: t.delete, cancel: t.cancel, danger: true }))) return;
            try { await changed(await this._call("pack_delete", { pack_id: p.id }, false)); } catch (err) { fail(err); }
          }, "danger"),
          this._switch(pos >= 0, (on) => setActive(on ? [...ids, p.id] : ids.filter((x) => x !== p.id)), p.name));
      }));
    };
    const file = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      let pack;
      try { pack = JSON.parse(await f.text()); } catch (err) { status.textContent = t.pack_bad_json; return; }
      const name = await slDialog(this.shadowRoot, { title: t.pack_upload, text: t.pack_name_help, input: true,
        value: (pack && pack.name) || f.name.replace(/\.json$/i, ""), ok: t.pack_add, cancel: t.cancel });
      if (!name) return;
      try {
        const r = await this._call("pack_upload", { pack, name: String(name) }, false);
        await changed(r);
        status.textContent = `✓ ${r.terms} ${t.pack_terms}${r.skipped ? ` · ${r.skipped} ${t.pack_skipped}` : ""}`;
      } catch (err) { fail(err); }
    } });
    this._call("packs", {}, false).then((r) => { packs = r.packs; draw(); }).catch(() => fill(body, t.error));
    const sec = this._sec("🧠", t.packs, t.packs_help, [body,
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => download(PACK_TEMPLATE, "smartlists-pack-template.json") }, "⬇ " + t.pack_template),
        h("button", { class: "btn2", type: "button", onclick: async () => {
          const name = await slDialog(this.shadowRoot, { title: t.pack_new, text: t.pack_new_help, input: true, placeholder: t.pack_new_placeholder, ok: t.create, cancel: t.cancel });
          if (!name) return;
          try {
            const r = await this._call("pack_create", { name, language: "" }, false);
            packs = r.packs; draw();
            const p = packs.find((x) => x.id === r.pack_id);
            if (p) this._packEditor(sec, p, () => this._call("packs", {}, false).then((x) => { packs = x.packs; draw(); }));
          } catch (err) { fail(err); }
        } }, "＋ " + t.pack_new),
        h("button", { class: "btn2 primary", type: "button", onclick: () => file.click() }, "⬆ " + t.pack_upload), file)]);
    sec.firstChild.append(count);
    return sec;
  }

  // Stichwörter eines Packs bearbeiten (im Abschnitt, statt der Pack-Liste). Eingebaute Packs bleiben
  // unverändert – Änderungen landen im Ergänzungs-Pack „<Name> +“ (siehe packs.py).
  _packEditor(sec, pack, onClose) {
    const t = this._t;
    const body = sec.querySelector ? sec.querySelector(".sbody") : sec.childNodes[sec.childNodes.length - 1];
    const saved = [...body.childNodes];
    const cats = (this._cfg && this._cfg.categories) || categoryOptions(this._lang).map(([id, label]) => ({ id, label }));
    const status = h("span", { class: "ok2" });
    const listEl = h("div", { class: "learned2" });
    const more = h("div", { class: "acts", style: "margin-top:6px" });
    let query = "", offset = 0, rows = [], total = 0;
    const catSelect = (value, onchange, label) => h("select", { "aria-label": label || t.category, onchange: (e) => onchange(e.target.value) },
      cats.map((c) => h("option", { value: c.id, selected: c.id === value }, c.label)));
    const save = async (changes) => {
      try {
        await this._call("pack_update", { pack_id: pack.id, terms: changes }, false);
        status.textContent = "✓ " + t.saved;
        this._cfg = await this._call("config", { language: this._lang }, false);
        return true;
      } catch (err) { status.textContent = (err && err.message) || t.error; return false; }
    };
    const load = async (append) => {
      try {
        const r = await this._call("pack_terms", { pack_id: pack.id, query, offset: append ? offset : 0, limit: 100 }, false);
        rows = append ? [...rows, ...r.terms] : r.terms;
        total = r.total; offset = rows.length;
        draw();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const draw = () => {
      if (!rows.length) fill(listEl, h("div", { class: "shelp", style: "padding:10px" }, query ? t.no_hits_short : t.pack_empty));
      else fill(listEl, ...rows.map((r) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, r.term, r.changed ? h("span", { class: "manual" }, t.pack_changed) : null),
        catSelect(r.category, async (v) => { if (await save({ [r.term]: v })) { r.category = v; r.changed = pack.builtin || r.changed; draw(); } }, r.term),
        iconBtn(ICON.close, pack.builtin ? (r.changed ? t.pack_revert : t.pack_ignore) : t.delete, async () => {
          // eingebaut: Ergänzung zurücknehmen bzw. Stichwort ignorieren (= Sonstiges); eigenes Pack: löschen
          const v = pack.builtin ? (r.changed ? null : "sonstiges") : null;
          if (await save({ [r.term]: v })) load(false);
        }, "danger"))));
      fill(more, rows.length < total ? h("button", { class: "btn2", type: "button", onclick: () => load(true) }, `${t.pack_more} (${rows.length}/${total})`)
        : h("span", { class: "shelp" }, `${total} ${t.pack_terms}`));
    };
    const term = h("input", { class: "search2", placeholder: t.pack_term_placeholder, "aria-label": t.pack_term_placeholder, style: "flex:1;min-width:120px" });
    let newCat = cats[0] ? cats[0].id : "sonstiges";
    const add = async () => {
      const v = term.value.trim();
      if (!v) return;
      // mehrere auf einmal: "dinkelmehl, roggenmehl"
      const changes = Object.fromEntries(v.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).map((x) => [x, newCat]));
      if (await save(changes)) { term.value = ""; query = ""; search.value = ""; load(false); }
    };
    term.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    const search = h("input", { type: "search", class: "search2", placeholder: t.search_learned, "aria-label": t.search,
      oninput: debounce((e) => { query = e.target.value; load(false); }, 250) });
    fill(body,
      h("div", { class: "srow2", style: "border-top:none" },
        iconBtn(ICON.back, t.p_back, () => { fill(body, ...saved); onClose && onClose(); }),
        h("div", { class: "sl" }, h("b", {}, pack.name), h("small", {}, pack.builtin ? t.pack_builtin_edit_help : t.pack_edit_help))),
      h("div", { class: "rule2", style: "flex-wrap:wrap" }, term, catSelect(newCat, (v) => { newCat = v; }),
        h("button", { class: "btn2 primary", type: "button", onclick: add }, "＋ " + t.pack_add)),
      search, listEl, more, h("div", { class: "acts" }, status));
    load(false);
  }

  // Badges & Farben: Aussehen je Art (Markt/Person/Schlagwort) und einzelner Badges, Farben/Namen der Märkte.
  // Alles optional – leere Angaben = eingebautes Aussehen. Gilt für den Haushalt (auch für die App: Märkte).
  _appearanceSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let look = { kinds: {}, values: {} }, tags = [], query = "";
    const save = debounce(async () => {
      try {
        const r = await this._call("set_appearance", { appearance: look }, false);
        look = r.appearance; tags = r.tags; SL_LOOK = look;
        if (this._cfg) this._cfg = { ...this._cfg, appearance: look };
        status.textContent = "✓ " + t.saved;
        window.dispatchEvent(new CustomEvent("smartlists-look-changed"));
        draw();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    }, 400);
    const sample = { store: { kind: "store", value: "REWE", label: "REWE", color: "#cc071e" }, person: { kind: "person", value: "Anna", label: "Anna" }, tag: { kind: "tag", value: "bio", label: "bio" } };
    const colorInput = (value, onchange, label) => h("input", { type: "color", value: value || "#888888", "aria-label": label, title: label,
      oninput: (e) => onchange(e.target.value) });
    const reset = (onclick, label) => h("button", { class: "btn2", type: "button", style: "height:30px;padding:0 10px", title: label, "aria-label": label, onclick }, "↺");
    const kindRow = (kind) => {
      const k = look.kinds[kind] || {};
      const setK = (patch) => {
        const next = { ...k, ...patch };
        Object.keys(next).forEach((x) => (next[x] == null || next[x] === "") && delete next[x]);
        look = { ...look, kinds: { ...look.kinds, [kind]: next } };
        if (!Object.keys(next).length) delete look.kinds[kind];
        draw(); save();
      };
      return h("div", { class: "srow2" },
        h("div", { class: "sl" }, t["kind_" + kind], h("small", {}, badge(sample[kind], look))),
        h("div", { class: "look-row" },
          h("select", { "aria-label": `${t["kind_" + kind]}: ${t.look_style}`, onchange: (e) => setK({ style: e.target.value === BADGE_DEFAULTS[kind].style ? null : e.target.value }) },
            BADGE_STYLES.map((st) => h("option", { value: st, selected: (k.style || BADGE_DEFAULTS[kind].style) === st }, t["look_" + st]))),
          kind === "store" ? null : colorInput(k.color, (c) => setK({ color: c }), `${t["kind_" + kind]}: ${t.look_color}`),
          kind === "store" ? null : h("input", { class: "icon", value: k.icon != null ? k.icon : BADGE_DEFAULTS[kind].icon, maxlength: "4", "aria-label": t.look_icon, title: t.look_icon,
            onchange: (e) => setK({ icon: e.target.value === BADGE_DEFAULTS[kind].icon ? null : e.target.value }) }),
          reset(() => { const n = { ...look.kinds }; delete n[kind]; look = { ...look, kinds: n }; draw(); save(); }, t.reset_default)));
    };
    const listEl = h("div");
    const drawValues = () => {
      const q = searchKey(query);
      const rows = tags.filter((x) => !q || searchKey(x.label + " " + x.value).includes(q)).slice(0, 60);
      fill(listEl, ...rows.map((x) => {
        const cur = look.values[x.key] || {};
        const setV = (patch) => {
          const next = { ...cur, ...patch };
          Object.keys(next).forEach((y) => (next[y] == null || next[y] === "") && delete next[y]);
          const values = { ...look.values };
          if (Object.keys(next).length) values[x.key] = next; else delete values[x.key];
          look = { ...look, values };
          drawValues(); save();
        };
        const preview = { kind: x.kind, value: x.value, label: x.kind === "store" ? (cur.label || x.label) : x.label, color: x.kind === "store" ? x.color : null };
        return h("div", { class: "srow2" },
          h("div", { class: "sl" }, badge(preview, look), x.count ? h("small", {}, `${x.count}×`) : null),
          h("div", { class: "look-row" },
            x.kind === "store" ? h("input", { class: "search2", style: "width:110px;margin:0", value: cur.label || "", placeholder: x.label, "aria-label": `${x.label}: ${t.look_label}`, title: t.look_label,
              onchange: (e) => setV({ label: e.target.value.trim() || null }) }) : null,
            colorInput(cur.color || (x.kind === "store" ? x.color : null), (c) => setV({ color: c }), `${x.label}: ${t.look_color}`),
            Object.keys(cur).length ? reset(() => setV({ color: null, label: null }), t.reset_default) : null));
      }), tags.length > 60 && !query ? h("div", { class: "shelp" }, t.look_more) : null);
    };
    const draw = () => {
      fill(body,
        h("div", { class: "grp" }, t.look_kinds), kindRow("store"), kindRow("person"), kindRow("tag"),
        h("div", { class: "grp" }, t.look_values),
        h("input", { type: "search", class: "search2", placeholder: t.look_search, "aria-label": t.look_search, value: query, oninput: (e) => { query = e.target.value; drawValues(); } }),
        listEl,
        h("div", { class: "acts" }, status, h("button", { class: "btn2", type: "button", onclick: async () => {
          // neues Badge vorab einfärben: "@Kaufland", "*Max", "#vegan"
          const v = await slDialog(this.shadowRoot, { title: t.look_add, text: t.look_add_help, input: true, placeholder: "@Kaufland", ok: t.pack_add, cancel: t.cancel });
          if (!v) return;
          const rules = (this._cfg && this._cfg.tag_rules) || [];
          const rule = rules.find((r) => v.startsWith(r.prefix));
          const kind = rule ? rule.kind : "store";
          const value = (rule ? v.slice(rule.prefix.length) : v).trim();
          if (!value) return;
          const key = `${kind}:${value.toLowerCase()}`;
          if (!tags.some((x) => x.key === key)) tags = [{ key, kind, value, label: value, color: null, count: 0, custom: {} }, ...tags];
          look = { ...look, values: { ...look.values, [key]: { color: kind === "store" ? "#1747b5" : "#7b61ff" } } };
          query = ""; draw(); save();
        } }, "＋ " + t.look_add)));
      drawValues();
    };
    this._call("appearance", {}, false).then((r) => { look = r.appearance; tags = r.tags; draw(); }).catch(() => fill(body, t.error));
    return this._sec("🎨", t.look, t.look_help, [body]);
  }

  // Märkte & Zonen: Markt (@REWE) mit einer HA-Zone verknüpfen oder dafür direkt eine Zone anlegen.
  // Im Einkaufsmodus zeigt die Karte dann automatisch nur den Markt, in dessen Zone man gerade ist.
  _storesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    const zones = () => Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("zone."))
      .map((s) => [s.entity_id, s.attributes.friendly_name || s.entity_id]).sort((a, b) => a[1].localeCompare(b[1]));
    const link = async (store, zones) => {
      try {
        const r = await this._call("set_store_zone", { store, zones }, false);
        status.textContent = "✓ " + t.saved;
        this._cfg = { ...this._cfg, store_zones: r.store_zones };
        draw(r.stores);
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const createZone = async (store) => {
      const name = await slDialog(this.shadowRoot, { title: t.zone_new, text: t.zone_new_help, input: true, value: store || "", ok: t.create, cancel: t.cancel });
      if (!name) return;
      const pos = await new Promise((resolve) => {
        const home = { latitude: this._hass.config && this._hass.config.latitude, longitude: this._hass.config && this._hass.config.longitude, here: false };
        if (!navigator.geolocation) return resolve(home);
        navigator.geolocation.getCurrentPosition((p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, here: true }),
          () => resolve(home), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      });
      try {
        await this._hass.callWS({ type: "zone/create", name, icon: "mdi:cart", latitude: pos.latitude, longitude: pos.longitude, radius: 100, passive: false });
        // auf die neue Zone warten (Entität erscheint kurz danach)
        let zone = null;
        for (let i = 0; i < 20 && !zone; i++) {
          await new Promise((r) => setTimeout(r, 250));
          const hit = Object.values(this._hass.states).find((s) => s.entity_id.startsWith("zone.") && s.attributes.friendly_name === name);
          zone = hit && hit.entity_id;
        }
        if (!zone) { status.textContent = t.zone_wait; return; }
        const key = String(store || name).trim().replace(/^@/, "").toLowerCase();
        await link(key, [...(((this._cfg && this._cfg.store_zones) || {})[key] || []), zone]);
        status.textContent = `✓ ${zone} · ${pos.here ? t.zone_here : t.zone_home}`;
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const draw = (stores) => {
      const zs = zones();
      const nameOf = (id) => (this._hass.states[id] ? this._hass.states[id].attributes.friendly_name || id : `⚠️ ${id}`);
      // je Markt beliebig viele Zonen (Filialen): Chips mit ×, dazu Auswahl „＋ Zone“
      fill(body, ...stores.map((st) => {
        const linked = st.zones || (st.zone ? [st.zone] : []);
        return h("div", { class: "srow2" },
          h("div", { class: "sl" }, badge({ kind: "store", value: st.value, label: st.label, color: st.color }),
            h("small", {}, linked.length ? `${linked.length} ${t.zone_count}` : t.zone_none)),
          h("div", { class: "zchips" },
            linked.map((z) => h("span", { class: "zchip" }, "📍 ", nameOf(z),
              h("button", { type: "button", title: t.zone_unlink, "aria-label": `${t.zone_unlink}: ${nameOf(z)}`, onclick: () => link(st.key, linked.filter((x) => x !== z)) }, "×"))),
            h("select", { "aria-label": `${st.label}: ${t.zone_add}`, onchange: (e) => {
              const v = e.target.value; e.target.value = "";
              if (v === "__new") createZone(st.label); else if (v) link(st.key, [...linked, v]);
            } }, h("option", { value: "" }, "＋ " + t.zone_add),
              zs.filter(([id]) => !linked.includes(id)).map(([id, n]) => h("option", { value: id }, n)),
              h("option", { value: "__new" }, "＋ " + t.zone_new + " …"))));
      }),
        h("div", { class: "acts" }, status,
          h("a", { class: "btn2", href: "/config/zone", target: "_top", style: "display:inline-flex;align-items:center;text-decoration:none" }, t.zone_manage),
          h("button", { class: "btn2", type: "button", onclick: async () => {
            const store = await slDialog(this.shadowRoot, { title: t.store_add, text: t.store_add_help, input: true, placeholder: "REWE", ok: t.create, cancel: t.cancel });
            if (store) createZone(store);
          } }, "＋ " + t.store_add)));
    };
    this._call("stores", {}, false).then((r) => draw(r.stores)).catch(() => fill(body, t.error));
    return this._sec("📍", t.stores, t.stores_help, [body]);
  }

  // Notizlisten der App: aus SmartLists ausblenden (Standard) oder als eigener Bereich; an Konto gebunden
  _notesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    const set = async (patch) => {
      try { const r = await this._call("set_notes", patch, false); status.textContent = "✓ " + t.saved; draw(r); this._refreshPanel(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    let users = [];
    const draw = (info) => {
      fill(body,
        this._setRow(t.notes_show, this._switch(info.mode === "section", (on) => set({ mode: on ? "section" : "hidden" }), t.notes_show), t.notes_show_help),
        this._setRow(t.notes_scope, h("select", { "aria-label": t.notes_scope, onchange: (e) => set({ scope: e.target.value }) },
          [["owner", t.notes_scope_owner], ["household", t.notes_scope_household]].map(([v, l]) => h("option", { value: v, selected: info.scope === v }, l)))),
        info.lists.length ? h("div", { class: "grp" }, t.notes_lists) : h("div", { class: "shelp", style: "padding:6px 0" }, t.notes_none),
        ...info.lists.map((n) => this._setRow(n.name,
          h("select", { "aria-label": `${n.name}: ${t.owner}`, onchange: (e) => set({ owners: { [n.entity_id]: e.target.value || null } }) },
            h("option", { value: "" }, "— " + t.notes_no_owner),
            users.map((u) => h("option", { value: u.id, selected: n.owner_id === u.id }, u.name))),
          n.entity_id)),
        h("div", { class: "acts" }, status));
    };
    Promise.all([this._call("notes", {}, false), this._call("users", {}, false).catch(() => ({ users: [] }))])
      .then(([info, u]) => { users = u.users || []; draw(info); }).catch(() => fill(body, t.error));
    return this._sec("📝", t.notes, t.notes_help, [body]);
  }
  // Seitenleisten-Seite neu laden lassen (Notizen ein/aus ändert die Listen-Auswahl)
  _refreshPanel() { window.dispatchEvent(new CustomEvent("smartlists-lists-changed")); }

  _learnedSection() {
    const t = this._t;
    const listEl = h("div", { class: "learned2" }, h("div", { class: "shelp", style: "padding:10px" }, t.loading));
    const count = h("span", { class: "cnt" });
    let all = [];
    let query = "";
    const draw = () => {
      const q = searchKey(query);
      const rows = all.filter((l) => !q || searchKey(l.word + " " + l.label).includes(q));
      count.textContent = String(all.length);
      if (!rows.length) return fill(listEl, h("div", { class: "shelp", style: "padding:10px" }, all.length ? t.no_hits_short : t.none_learned));
      fill(listEl, ...rows.map((l) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, l.word, l.manual ? h("span", { class: "manual" }, t.by_hand) : null),
        h("span", { class: "cat" }, l.label),
        iconBtn(ICON.close, t.forget, async () => { all = (await this._call("forget", { word: l.word }, false)).learned; draw(); }, "danger"))));
    };
    this._call("learned", {}, false).then((r) => { all = r.learned; draw(); }).catch(() => fill(listEl, t.error));
    const sec = this._sec("🏷️", t.learned, t.learned_help, [
      h("input", { type: "search", class: "search2", placeholder: t.search_learned, "aria-label": t.search_learned, oninput: (e) => { query = e.target.value; draw(); } }),
      listEl]);
    sec.querySelector && sec.querySelector(".sh") ? sec.querySelector(".sh").append(count) : sec.firstChild.append(count);
    return sec;
  }

  _automationSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const lists = Object.keys(this._hass.states).filter((e) => e.startsWith("todo.")).sort()
      .map((e) => [e, (this._hass.states[e].attributes || {}).friendly_name || e]);
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    this._call("automation", {}, false).then((r) => {
      const cur = r.settings || {};
      const pick = (key) => h("select", { "aria-label": t["auto_" + key], onchange: async (e) => {
        try { await this._call("set_automation", { settings: { ...cur, [key]: e.target.value || null } }, false); cur[key] = e.target.value; status.textContent = "✓ " + t.saved; }
        catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, h("option", { value: "" }, "—"), lists.map(([e, n]) => h("option", { value: e, selected: cur[key] === e }, n)));
      fill(body,
        this._setRow(t.auto_voice_default_list, pick("voice_default_list"), t.auto_voice_help),
        this._setRow(t.auto_auto_due_list, pick("auto_due_list"), t.auto_due_help),
        h("div", { class: "acts" }, status, h("button", { class: "btn2", type: "button", onclick: async () => {
          try { const res = await this._call("install_sentences", {}, false); status.textContent = `✓ ${t.sentences_installed}: ${res.languages.join(", ")}`; }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, t.install_sentences)));
    }).catch(() => fill(body, t.error));
    return this._sec("🎙️", t.automation, t.automation_help, [body]);
  }

  _devicesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const count = h("span", { class: "cnt" });
    const fmt = (ts) => (ts ? new Date(ts * 1000).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" }) : "?");
    let appLists = [];
    const status = h("span", { class: "ok2" });
    const draw = (devices) => {
      count.textContent = String(devices.length);
      if (!devices.length) return fill(body, h("div", { class: "shelp", style: "padding:6px 0" }, t.no_devices));
      fill(body, ...devices.flatMap((dv) => [this._setRow(`${dv.stale ? "⚠️ " : ""}${dv.name}`,
        iconBtn(ICON.close, t.remove_device, async () => draw((await this._call("remove_device", { device_id: dv.device_id }, false)).devices), "danger"),
        `${dv.user_name || "?"} · ${dv.model || ""} · App ${dv.app_version || "?"} · Android ${dv.os_version || "?"} · ${t.last_seen} ${fmt(dv.last_seen)}`),
        // kombinierte Listen dieser App: verbinden = in HA als kombinierte Liste anlegen (gehört zum Handy)
        ...appLists.filter((l) => l.device_id === dv.device_id).map((l) => h("div", { class: "srow2", style: "padding-left:16px" },
          h("div", { class: "sl" }, "↳ ", l.name, h("small", {}, `${t.app_list} · ${l.sources.join(", ")}${l.missing.length ? ` · ⚠️ ${l.missing.join(", ")}` : ""}`)),
          l.connected ? h("span", { class: "val" }, "✓ " + t.app_list_connected)
            : this._isAdmin ? h("button", { class: "btn2", type: "button", onclick: async () => {
              try { appLists = (await this._call("connect_app_list", { device_id: l.device_id, list_id: l.id }, false)).lists; status.textContent = "✓ " + t.app_list_connected; draw(devices); }
              catch (err) { status.textContent = (err && err.message) || t.error; }
            } }, t.app_list_connect) : null))]),
        h("div", { class: "acts" }, status));
    };
    Promise.all([this._call("devices", {}, false), this._call("app_lists", {}, false).catch(() => ({ lists: [] }))])
      .then(([r, a]) => { appLists = a.lists || []; draw(r.devices); }).catch(() => fill(body, t.error));
    const sec = this._sec("📱", t.devices, t.devices_help, [body]);
    sec.firstChild.append(count);
    return sec;
  }

  // Freigaben einer eigenen Liste (nur Besitzer/Admins): pro Person keine / sehen / abhaken / bearbeiten
  _sharing() {
    const t = this._t;
    const own = this._data.own;
    const box = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    (async () => {
      let users = [];
      try { users = (await this._call("users", {}, false)).users; } catch (e) { fill(box, t.error); return; }
      const others = users.filter((u) => u.id !== own.owner_id);
      if (!others.length) { fill(box, h("div", { class: "shelp" }, t.no_users)); return; }
      fill(box, ...others.map((u) => this._setRow(u.name, u.is_admin
        ? h("span", { class: "val" }, t.role_all)
        : h("select", { "aria-label": u.name, onchange: async (e) => {
          try { await this._call("share", { user_id: u.id, role: e.target.value || null }); status.textContent = "✓ " + t.saved; await this._load(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, [["", t.role_none], ["viewer", t.role_viewer], ["checker", t.role_checker], ["editor", t.role_editor]].map(([v, l]) =>
          h("option", { value: v, selected: (own.shares[u.id] || "") === v }, l))), u.is_admin ? t.admin_always : null)));
    })();
    const del = h("button", { class: "btn2 danger", type: "button", onclick: async () => {
      if (!(await slDialog(this.shadowRoot, { title: t.delete_list, text: t.confirm_delete_list, ok: t.delete, cancel: t.cancel, danger: true }))) return;
      try { await this._call("delete_list", {}); status.textContent = "✓"; } catch (err) { status.textContent = (err && err.message) || t.error; }
    } }, t.delete_list);
    const sec = this._sec("👥", t.sharing, t.sharing_help, [box, h("div", { class: "acts" }, status, del)]);
    sec.firstChild.append(h("span", { class: "cnt" }, `${t.owner}: ${own.owner || "?"}`));
    return sec;
  }

  // Haushalts-Einstellungen sichern/übertragen: gemerkte Kategorien, Verlauf, Namenskonvention, Bedienung
  _exportImport() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const file = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const r = await this._call("import", { data, replace: false }, false);
        status.textContent = `✓ ${t.imported}: ${Object.entries(r.imported).map(([k, v]) => `${v} ${k}`).join(", ")}`;
        await this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
      e.target.value = "";
    } });
    const exp = async () => {
      try {
        const data = await this._call("export", { include_history: true }, false);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        a.download = `smartlists-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        status.textContent = "✓";
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    return this._sec("💾", t.backup, t.backup_help, [h("div", { class: "acts", style: "margin-top:0" }, status,
      h("button", { class: "btn2", type: "button", onclick: exp }, "⬇ " + t.export),
      h("button", { class: "btn2", type: "button", onclick: () => file.click() }, "⬆ " + t.import), file)]);
  }

  async _renderSettings() {
    const el = this._settingsEl;
    if (!this._showSettings || !this._cfg) return fill(el);
    const t = this._t;
    const tab = this._setTab || "me";
    const tabBtn = (id, label, extra) => h("button", { type: "button", role: "tab", class: tab === id ? "on" : "", "aria-selected": String(tab === id),
      onclick: () => { this._setTab = id; this._renderSettings(); } }, label, extra);
    const pane = tab === "house" ? this._paneHouse() : tab === "list" ? this._paneList() : this._paneMe();
    fill(el, h("div", { class: "sl-settings" },
      h("div", { class: "tabs2", role: "tablist" }, tabBtn("me", t.tab_me),
        tabBtn("house", t.tab_house, h("span", { class: "tag" }, t.admin)), tabBtn("list", t.tab_list)),
      pane,
      h("div", { class: "foot2" }, h("span", {}, `SmartLists ${this._version || "?"} · ${t.card_version} ${CARD_VERSION}`),
        h("a", { href: "https://github.com/m3m0rex/ha_smartlists/wiki", target: "_blank", rel: "noopener" }, "Wiki ↗"))));
  }
}

/* Visueller Editor für den Dashboard-Karten-Dialog */
class SmartListsCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._build(); }
  set hass(hass) {
    const relabel = this._form && this._hass && hass && this._hass.language !== hass.language;
    this._hass = hass;
    if (this._form) { this._form.hass = hass; if (relabel) this._form.schema = this._schema(); }
  }
  get _lang() { return ((this._hass && this._hass.language) || "de").slice(0, 2); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }

  // Einfach: nur das Wichtigste. Erweitert: alle Abschnitte. Merkt sich die Wahl im Browser.
  get _advanced() { try { return localStorage.getItem("smartlists-editor-advanced") === "1"; } catch (e) { return false; } }
  set _advanced(v) { try { localStorage.setItem("smartlists-editor-advanced", v ? "1" : "0"); } catch (e) { /* */ } }

  // Notizlisten der App sind keine Einkaufslisten – nur anbieten, wenn sie schon gewählt sind
  _noNotes() {
    const st = (this._hass && this._hass.states) || {};
    const cur = [this._config && this._config.entity, ...((this._config && this._config.entities) || [])].map((e) => (typeof e === "string" ? e : e && e.entity));
    const ex = Object.keys(st).filter((e) => e.startsWith("todo.") && isNotesEntity(e, st[e].attributes.friendly_name) && !cur.includes(e));
    return ex.length ? { exclude_entities: ex } : {};
  }
  _schema() {
    const t = this._t;
    const b = (name) => ({ name, selector: { boolean: {} } });
    const section = (key, icon, schema) => ({ type: "expandable", name: "", flatten: true, title: t["e_sec_" + key], icon, schema });
    const sel = (name, options) => ({ name, selector: { select: { mode: "dropdown", options: options.map(([value, label]) => ({ value, label })) } } });
    const basic = [
      sel("preset", [["", t.e_preset_pick], ...Object.keys(PRESETS).map((k) => [k, t["e_pre_" + k]])]),
      { name: "entity", selector: { entity: { domain: "todo", ...this._noNotes() } } },
      { name: "title", selector: { text: {} } },
      sel("view", [["list", t.e_view_list], ["tiles", t.e_view_tiles], ["mini", t.e_view_mini]]),
      sel("sort", [["category", t.e_sort_category], ["alpha", t.sort_alpha], ["added", t.e_sort_added], ["list", t.e_sort_list]]),
      b("advanced"),
    ];
    if (!this._advanced) return basic;
    return [
      ...basic,
      section("multi", "mdi:view-column-outline", [
        { name: "entities", selector: { entity: { domain: "todo", multiple: true, ...this._noNotes() } } },
        sel("layout", [["tabs", t.e_layout_tabs], ["columns", t.e_layout_columns], ["stack", t.e_layout_stack]]),
      ]),
      section("filter", "mdi:filter-outline", [
        { name: "filter_store", selector: { text: {} } },
        { name: "filter_person", selector: { text: {} } },
        { name: "filter_tag", selector: { text: {} } },
        { name: "filter_category", selector: { select: { multiple: true, mode: "dropdown", options: categoryOptions(this._lang).map(([value, label]) => ({ value, label })) } } },
        b("filter_offers"), b("filter_tags_new_items"), b("show_filter_chips"),
      ]),
      section("look", "mdi:palette-outline", [
        sel("density", [["compact", t.e_density_compact], ["normal", t.e_density_normal], ["comfortable", t.e_density_comfortable]]),
        { name: "font_scale", selector: { number: { min: 0.8, max: 1.6, step: 0.05, mode: "slider" } } },
        { name: "radius", selector: { number: { min: 0, max: 32, step: 1, mode: "box", unit_of_measurement: "px" } } },
        { name: "accent_color", selector: { color_rgb: {} } },
        { name: "max_height", selector: { number: { min: 150, max: 2000, step: 50, mode: "box", unit_of_measurement: "px" } } },
      ]),
      section("header", "mdi:page-layout-header",
        [b("show_header"), b("show_count"), b("show_search"), b("show_sort"), b("show_shopping"), b("show_undo"), b("show_import"), b("show_settings")]),
      section("input", "mdi:plus-box-outline", [b("show_add"), b("show_frequent")]),
      section("list", "mdi:format-list-bulleted",
        [b("drag_drop"), b("show_stepper"), b("show_offer"), b("show_tags"), b("show_source"), b("show_note"), b("show_category_titles")]),
      section("done", "mdi:check-all", [b("show_completed"), b("collapse_completed")]),
      section("shop", "mdi:cart-outline", [b("start_shopping")]),
    ];
  }

  _build() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // Texte in TEXTS (l_… = Beschriftung, hh_… = Hilfe), Sprache von HA
      this._form.computeLabel = (sch) => this._t["l_" + sch.name] || sch.name;
      this._form.computeHelper = (sch) => this._t["hh_" + sch.name];
      this._form.addEventListener("value-changed", (e) => {
        const cfg = { ...e.detail.value };
        if ("advanced" in cfg) {
          const adv = !!cfg.advanced; delete cfg.advanced;
          if (adv !== this._advanced) { this._advanced = adv; this._form.schema = this._schema(); }
        }
        if (cfg.preset) { Object.assign(cfg, PRESETS[cfg.preset] ? PRESETS[cfg.preset].values : {}); }
        delete cfg.preset;
        // nur Abweichungen vom Standard speichern → schlankes YAML
        for (const [k, v] of Object.entries(CARD_DEFAULTS)) if (JSON.stringify(cfg[k]) === JSON.stringify(v)) delete cfg[k];
        for (const k of ["max_height", "radius", "title", "accent_color", "filter_store", "filter_person", "filter_tag"]) if (cfg[k] === "" || cfg[k] == null) delete cfg[k];
        if (Array.isArray(cfg.entities) && !cfg.entities.length) delete cfg.entities;
        if (Array.isArray(cfg.entities) && cfg.entities.length) delete cfg.entity;
        this._config = cfg;
        this._form.data = this._data();
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = this._data();
  }
  _data() { return { ...CARD_DEFAULTS, ...this._config, preset: "", advanced: this._advanced }; }
}

/* ------------------------------------------------------------------ */
/* Seitenleisten-Seite „SmartLists“ (von der Integration registriert)  */
/* ------------------------------------------------------------------ */
const PANEL_KEY = "smartlists-panel-list";
const PANEL_PREFS = "smartlists-panel-prefs";
const PANEL_STYLE = `
  :host { display:block; min-height:100vh; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color); }
  .toolbar { display:flex; align-items:center; gap:4px; height:56px; padding:0 12px; box-sizing:border-box;
    background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, var(--text-primary-color,#fff));
    font-size:20px; position:sticky; top:0; z-index:3; }
  .toolbar .title { flex:1; margin-left:8px; }
  .toolbar button { background:none; border:none; color:inherit; width:40px; height:40px; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center; }
  .toolbar button:hover, .toolbar button.on { background:rgba(255,255,255,.18); }
  .chips { display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px; scrollbar-width:none; margin:0 auto; box-sizing:border-box; }
  .chip { flex:none; display:flex; align-items:center; gap:6px; border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff);
    border-radius:18px; padding:6px 12px; font:inherit; font-size:.9rem; cursor:pointer; color:var(--primary-text-color); white-space:nowrap; }
  .chip.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  .chip .n { font-size:.75rem; opacity:.75; }
  .hint { font-size:.8rem; color:var(--secondary-text-color); padding:2px 16px 0; margin:0 auto; box-sizing:border-box; }
  .content { margin:0 auto; padding:8px 16px 32px; box-sizing:border-box; display:grid; gap:16px; align-items:start; }
  .w-normal { max-width:760px; } .w-wide { max-width:none; }
  .cols-1 { grid-template-columns:minmax(0,1fr); }
  .cols-2 { grid-template-columns:repeat(2,minmax(0,1fr)); } .cols-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .cols-4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
  @media (max-width: 1300px) { .cols-4 { grid-template-columns:repeat(3,minmax(0,1fr)); } }
  @media (max-width: 900px) { .cols-2, .cols-3, .cols-4 { grid-template-columns:minmax(0,1fr); } }
  .chip.ordering { cursor:grab; } .chip.drop { outline:2px dashed var(--primary-color); outline-offset:2px; }
  .chip .mv { padding:0 4px; opacity:.8; cursor:pointer; } .chip .mv:hover { opacity:1; }
  .chips .sep { flex:none; width:1px; align-self:stretch; background:var(--divider-color,#ddd); margin:0 4px; }
  .empty { text-align:center; padding:48px 16px; color:var(--secondary-text-color); }
`;
const ICON_COLUMNS = "M3,3H11V21H3V3M13,3H21V21H13V3M5,5V19H9V5H5M15,5V19H19V5H15Z";
const ICON_WIDE = "M3,5H21V7H3V5M3,11H21V13H3V11M3,17H21V19H3V17M1,9L4,12L1,15V9M23,9V15L20,12L23,9Z";

/* Seite „SmartLists“: eine Liste oder bis zu drei nebeneinander (zwischen ihnen Ziehen & Ablegen),
 * normale oder breite Darstellung. Einstellungen werden im Browser gemerkt. */
class SmartListsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cards = new Map();
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(PANEL_PREFS) || "{}"); } catch (e) { prefs = {}; }
    let legacy = null;
    try { legacy = localStorage.getItem(PANEL_KEY); } catch (e) { /* */ }
    this._prefs = { columns: false, wide: false, selected: legacy ? [legacy] : [], order: [], ...prefs };
    // Einstellungen (z.B. Notizen ein/aus) ändern, welche Listen erscheinen
    window.addEventListener("smartlists-lists-changed", () => { this._visibleKey = null; this._render(); });
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
    this._cards.forEach((c) => { c.hass = hass; });
  }
  set narrow(v) { this._narrow = v; this._render(); }
  set panel(p) { this._panelInfo = p; }
  _save() { try { localStorage.setItem(PANEL_PREFS, JSON.stringify(this._prefs)); } catch (e) { /* */ } }

  // Sichtbare Listen kommen von der Integration (eigene Listen nur mit Freigabe); neu laden, wenn sich die
  // Menge der To-do-Entitäten ändert
  _refreshVisible() {
    const st = (this._hass && this._hass.states) || {};
    const key = Object.keys(st).filter((e) => e.startsWith("todo.")).sort().join(",");
    if (key === this._visibleKey) return;
    this._visibleKey = key;
    this._hass.callWS({ type: "smartlists/lists" }).then((r) => { this._visible = new Map(r.lists.map((l) => [l.entity_id, l.type])); this._render(); })
      .catch(() => { this._visible = null; });
  }
  get _t() { return TEXTS[((this._hass && this._hass.language) || "de").slice(0, 2)] || TEXTS.en; }
  async _newList() {
    const t = this._t;
    const name = await slDialog(this.shadowRoot, { title: t.new_list, text: t.new_list_help, input: true, placeholder: t.new_list_placeholder, ok: t.create, cancel: t.cancel });
    if (!name) return;
    try {
      await this._hass.callWS({ type: "smartlists/create_list", name });
      this._visibleKey = null;
      this._pendingSelect = name; // neue Liste gleich auswählen, sobald sie da ist
    } catch (e) {
      await slDialog(this.shadowRoot, { title: t.error, text: (e && e.message) || t.error, ok: "OK", cancel: t.cancel });
    }
  }
  _lists() {
    const st = (this._hass && this._hass.states) || {};
    this._refreshVisible();
    // ohne Antwort der Integration: Notizlisten der App trotzdem ausblenden
    const ok = (e) => (this._visible ? this._visible.has(e) : !isNotesEntity(e, st[e].attributes.friendly_name));
    const order = this._prefs.order || [];
    const rank = (e) => { const i = order.indexOf(e); return i < 0 ? 1e6 : i; };
    return Object.keys(st).filter((e) => e.startsWith("todo.") && st[e].state !== "unavailable" && ok(e))
      .map((e) => ({ e, name: st[e].attributes.friendly_name || e, open: Number(st[e].state) || 0,
        notes: this._visible ? this._visible.get(e) === "notes" : false,
        combined: !!st[e].attributes.smartlists_combined || Array.isArray(st[e].attributes.source_lists) }))
      // eigene Reihenfolge (Ziehen bzw. ◀ ▶), sonst kombinierte zuerst und dann alphabetisch
      .sort((a, b) => (rank(a.e) - rank(b.e)) || (b.combined - a.combined) || a.name.localeCompare(b.name));
  }

  _render() {
    if (!this._hass) return;
    const lists = this._lists();
    if (this._pendingSelect) {
      const hit = lists.find((l) => l.name === this._pendingSelect);
      if (hit) { this._pendingSelect = null; this._prefs.selected = this._prefs.columns ? [...this._prefs.selected, hit.e] : [hit.e]; this._save(); }
    }
    // beliebig viele Listen; Reihenfolge der Spalten = Reihenfolge der Chips
    const pos = new Map(lists.map((l, i) => [l.e, i]));
    let sel = this._prefs.selected.filter((e) => pos.has(e)).sort((a, b) => pos.get(a) - pos.get(b));
    if (!this._prefs.columns) sel = sel.slice(0, 1);
    if (!sel.length && lists.length) sel = [lists[0].e];
    this._prefs.selected = sel;
    if (!this._root) {
      this._chipsEl = h("div", { class: "chips", role: "tablist" });
      this._hintEl = h("div", { class: "hint" });
      this._contentEl = h("div", { class: "content" });
      const t = this._t;
      this._menuBtn = h("button", { type: "button", "aria-label": "Menu", title: "Menu",
        onclick: () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })) }, svg(ICON_MENU, 24));
      this._colBtn = h("button", { type: "button", title: t.p_columns, "aria-label": t.p_columns,
        onclick: () => { this._prefs.columns = !this._prefs.columns; this._save(); this._render(); } }, svg(ICON_COLUMNS, 22));
      this._wideBtn = h("button", { type: "button", title: t.p_wide, "aria-label": t.p_wide,
        onclick: () => { this._prefs.wide = !this._prefs.wide; this._save(); this._render(); } }, svg(ICON_WIDE, 22));
      this._orderBtn = h("button", { type: "button", title: t.p_order, "aria-label": t.p_order,
        onclick: () => { this._ordering = !this._ordering; this._render(); } }, svg(ICON.sort, 22));
      this._newBtn = h("button", { type: "button", title: this._t.new_list, "aria-label": this._t.new_list, onclick: () => this._newList() }, svg(ICON.plus, 22));
      // Einstellungen: dieselbe Ansicht wie im Zahnrad der Karte, aber auf der ganzen Seite
      this._gearBtn = h("button", { type: "button", title: t.p_settings, "aria-label": t.p_settings,
        onclick: () => { this._settingsOpen = !this._settingsOpen; this._render(); } }, svg(ICON.gear, 22));
      this._root = h("div", {}, h("div", { class: "toolbar" }, this._menuBtn, h("span", { class: "title" }, "SmartLists"), this._newBtn, this._orderBtn, this._colBtn, this._wideBtn, this._gearBtn),
        this._chipsEl, this._hintEl, this._contentEl);
      this.shadowRoot.replaceChildren(h("style", {}, PANEL_STYLE), this._root);
    }
    this._menuBtn.hidden = !this._narrow;
    this._gearBtn.classList.toggle("on", !!this._settingsOpen);
    this._gearBtn.setAttribute("aria-pressed", String(!!this._settingsOpen));
    [this._newBtn, this._orderBtn, this._colBtn, this._wideBtn].forEach((b) => { b.hidden = !!this._settingsOpen; });
    this._orderBtn.classList.toggle("on", !!this._ordering);
    this._orderBtn.setAttribute("aria-pressed", String(!!this._ordering));
    if (this._settingsOpen) {
      // Karte im Nur-Einstellungen-Modus (Reiter Für mich / Haushalt / Diese Liste)
      if (!this._settingsCard || this._settingsCard._config.entity !== (sel[0] || lists[0]?.e)) {
        const entity = sel[0] || (lists[0] && lists[0].e);
        if (!entity) { fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty)); return; }
        this._settingsCard = document.createElement("smartlists-card");
        this._settingsCard.setConfig({ entity, settings_only: true });
      }
      this._settingsCard.hass = this._hass;
      fill(this._chipsEl); fill(this._hintEl);
      this._contentEl.className = "content w-normal cols-1";
      if (this._contentEl.firstChild !== this._settingsCard) fill(this._contentEl, this._settingsCard);
      return;
    }
    this._colBtn.classList.toggle("on", this._prefs.columns);
    this._wideBtn.classList.toggle("on", this._prefs.wide);
    this._colBtn.setAttribute("aria-pressed", String(this._prefs.columns));
    this._wideBtn.setAttribute("aria-pressed", String(this._prefs.wide));
    const width = this._prefs.wide || this._prefs.columns ? "w-wide" : "w-normal";
    [this._chipsEl, this._hintEl].forEach((e) => { e.className = e.className.split(" ")[0] + " " + width; });
    const chip = (l, i, group) => {
      const el = h("button", { type: "button", role: "tab", class: `chip ${sel.includes(l.e) ? "on" : ""} ${this._ordering ? "ordering" : ""}`,
        "aria-selected": String(sel.includes(l.e)), draggable: "true", onclick: () => { if (!this._ordering) this._select(l.e); } },
        this._ordering && i > 0 ? h("span", { class: "mv", role: "button", "aria-label": this._t.p_left, title: this._t.p_left,
          onclick: (e) => { e.stopPropagation(); this._move(lists, l.e, group[i - 1].e, false); } }, "◀") : null,
        l.notes ? "📝 " : "", l.name, h("span", { class: "n" }, String(l.open)),
        this._ordering && i < group.length - 1 ? h("span", { class: "mv", role: "button", "aria-label": this._t.p_right, title: this._t.p_right,
          onclick: (e) => { e.stopPropagation(); this._move(lists, l.e, group[i + 1].e, true); } }, "▶") : null);
      // Ziehen & Ablegen mit der Maus: Chip auf einen anderen ziehen = davor einsortieren
      el.addEventListener("dragstart", (e) => { this._dragChip = l.e; try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.name); } catch (err) { /* */ } });
      el.addEventListener("dragover", (e) => { if (this._dragChip && this._dragChip !== l.e) { e.preventDefault(); el.classList.add("drop"); } });
      el.addEventListener("dragleave", () => el.classList.remove("drop"));
      el.addEventListener("drop", (e) => { e.preventDefault(); el.classList.remove("drop"); if (this._dragChip) this._move(lists, this._dragChip, l.e, false); this._dragChip = null; });
      el.addEventListener("dragend", () => { this._dragChip = null; });
      return el;
    };
    const shop = lists.filter((l) => !l.notes);
    const notes = lists.filter((l) => l.notes);
    fill(this._chipsEl, shop.map((l, i) => chip(l, i, shop)),
      notes.length ? h("span", { class: "sep", "aria-hidden": "true" }) : null,
      notes.map((l, i) => chip(l, i, notes)));
    fill(this._hintEl, this._ordering ? this._t.p_order_hint : this._prefs.columns ? this._t.p_hint : "");
    if (!sel.length) {
      this._cards.clear();
      this._contentEl.className = `content ${width}`;
      fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty));
      return;
    }
    // Karten wiederverwenden (Eingaben/Zustand bleiben), nur neue anlegen bzw. abgewählte entfernen
    for (const e of [...this._cards.keys()]) if (!sel.includes(e)) this._cards.delete(e);
    const cards = sel.map((e) => {
      if (!this._cards.has(e)) {
        const c = document.createElement("smartlists-card");
        c.setConfig({ entity: e });
        c.hass = this._hass;
        this._cards.set(e, c);
      }
      return this._cards.get(e);
    });
    this._contentEl.className = `content ${width} cols-${Math.min(cards.length, this._prefs.wide ? 4 : 3)}`;
    const current = [...this._contentEl.childNodes];
    if (current.length !== cards.length || current.some((n, i) => n !== cards[i])) fill(this._contentEl, ...cards);
  }
  _select(entity) {
    const sel = this._prefs.selected;
    if (!this._prefs.columns) this._prefs.selected = [entity];
    else if (sel.includes(entity)) { if (sel.length > 1) this._prefs.selected = sel.filter((e) => e !== entity); }
    else this._prefs.selected = [...sel, entity];
    this._save();
    this._render();
  }
  // Liste `entity` vor (bzw. nach) `target` einsortieren; gemerkt pro Browser
  _move(lists, entity, target, after) {
    const ids = lists.map((l) => l.e).filter((e) => e !== entity);
    const i = ids.indexOf(target);
    ids.splice(i < 0 ? ids.length : i + (after ? 1 : 0), 0, entity);
    this._prefs.order = ids;
    this._save();
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
      description: (TEXTS[String((document.documentElement && document.documentElement.lang) || navigator.language || "en").slice(0, 2)] || TEXTS.en).card_desc,
      preview: false,
    });
  }
}
if (_slResult.startsWith("ersetzt")) {
  console.warn(`SmartLists: eine ältere Karten-Datei war schon geladen und wurde durch ${CARD_VERSION} ersetzt. `
    + "Bitte die alte Dashboard-Ressource bzw. den HACS-Eintrag vom Typ „Dashboard“ entfernen.");
}
console.info(`%c SmartLists %c ${CARD_VERSION} `, "background:#1747B5;color:#fff;border-radius:3px 0 0 3px", "background:#3E7BFA;color:#fff;border-radius:0 3px 3px 0");

