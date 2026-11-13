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
  template: "M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z",
  barcode: "M2,6H4V18H2V6M5,6H6V18H5V6M7,6H10V18H7V6M11,6H12V18H11V6M14,6H16V18H14V6M17,6H20V18H17V6M21,6H22V18H21V6Z",
  chart: "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",
  share: "M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z",
  tune: "M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z",
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
const CARD_VERSION = "2.9.1";
const SORT_MODES = ["category", "alpha", "added", "list"];
// Darstellung pro Karte (Lovelace-Editor). Persönliche Bedienung steht dagegen in UI_DEFAULTS.
const CARD_DEFAULTS = {
  sort: "category",
  show_header: true, show_count: true, show_search: true, show_sort: true, show_shopping: true,
  show_undo: true, show_import: true, show_settings: true,
  show_add: true, show_frequent: true, show_templates: true, show_scan: true, show_prices: true,
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
const NOTES_DEFAULTS = { sort: "added", show_category_titles: false, show_frequent: false, show_shopping: false, show_stepper: false, show_import: false, show_filter_chips: false, show_sort: false };
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
    zone_name: "Name der Zone, z. B. REWE Standort Test", zone_radius: "Radius", zone_coords: "Koordinaten oder Karten-Link", zone_coords_placeholder: "52.5200, 13.4050 oder Link aus Google/Apple/OSM-Karten", zone_coords_bad: "Keine Koordinaten erkannt.", zone_locating: "Standort wird ermittelt …", zone_no_location: "Standort nicht verfügbar – andere Option wählen.", zone_where: "Wo?", zone_here_opt: "Aktueller Standort (dieses Gerät)", zone_home_opt: "Zuhause", zone_map_opt: "Auf der Karte wählen", zone_after: "Feinjustieren jederzeit unter Einstellungen → Bereiche & Zonen.",
    note_new: "Neue Notiz", note_edit: "Notiz bearbeiten", note_view: "Liste / Raster", note_empty: "Noch keine Notizen.", note_locked: "Verschlüsselte Notiz", note_locked_help: "Mit dem Notiz-Passwort der App verschlüsselt – nur in der App lesbar.", note_title: "Titel", note_body: "Text",
    p_settings_hint: "Liste antippen, für die „Diese Liste“ gilt. Für mich und Haushalt gelten für alle Listen.",
    list_settings_hint: "Bedienung, Haushalt und Kategorien: ⚙ oben rechts auf der Seite.",
    settings_list: "Einstellungen dieser Liste", settings_global: "Allgemeine Einstellungen", list_settings_hint_card: "Bedienung, Haushalt und Kategorien: Regler-Symbol daneben.",
    tpl: "Vorlagen",
    scan: "Strichcode scannen",
    price_sum: "Summe",
    soft_checked: "von außen markiert (Link)",
    soft_checked_help: "Jemand hat das über einen geteilten Link als erledigt markiert – der Artikel bleibt offen, bis du ihn abhakst.",
    price: "Preis",
    aisle: "Reihenfolge",
    price_paid: "zuletzt bezahlt",
    price_manual: "eigener Preis",
    price_last: "zuletzt",
    tpl_servings: "Portionen",
    tpl_new: "Neue Vorlage",
    tpl_from_list: "Liste als Vorlage",
    tpl_increase: "steht schon auf der Liste → Menge wird erhöht",
    tpl_servings_help: "Mengen werden umgerechnet",
    tpl_increased: "Menge erhöht",
    tpl_name: "Name, z. B. Pfannkuchen",
    tpl_items_placeholder: "Mehl 250 g\nMilch 0,5 l\nEier 3",
    tpl_items: "Artikel",
    tpl_items_help: "Ein Artikel pro Zeile, mit Menge und Tags wie in der Liste. Portionen (optional) = für wie viele die Mengen gelten.",
    tpl_edit: "Vorlage bearbeiten",
    scan_help: "Strichcode in den roten Strich halten – oder die Zahl darunter eintippen.",
    scan_code: "Strichcode-Nummer",
    scan_unknown: "Produkt nicht gefunden – Name bitte selbst eintippen.",
    scan_find: "Suchen",
    scan_no_camera: "Kamera-Scan wird hier nicht unterstützt (z. B. iPhone-Safari, Firefox) – Nummer eintippen.",
    aisle_down: "Nach unten",
    aisle_help: "So sortiert der Einkaufsmodus, wenn dieser Markt gewählt ist.",
    aisle_all_branches: "alle Filialen",
    aisle_reset: "Standard",
    notify_to: "An mein Handy",
    notify_no_phone: "Kein Handy mit Companion-App gefunden.",
    notify_added: "Bei neuen Artikeln",
    notify_checked: "Wenn etwas abgehakt wird",
    notify_lists: "Listen",
    notify_all_lists: "alle, die ich sehen darf",
    notify_from: "Von wem",
    notify_quiet: "Ruhezeit",
    notify_quiet_none: "keine",
    notify: "Benachrichtigungen",
    notify_help: "Wenn jemand anderes etwas ändert – nie bei eigenen Änderungen. Mehrere Änderungen innerhalb einer Minute kommen als eine Nachricht.",
    stats_90: "90 Tage",
    stats_year: "Jahr",
    stats_all: "alles",
    stats_top: "Am häufigsten gekauft",
    stats_every: "alle",
    stats_none: "Noch zu wenig Verlauf.",
    stats_overdue: "Lange nicht gekauft",
    stats_add: "Auf die Liste",
    stats_usually: "sonst alle",
    stats_since: "seit",
    stats_shares: "Nach Kategorie · Markt",
    stats: "Statistik",
    stats_help: "Aus dem vorhandenen Verlauf – es werden keine zusätzlichen Daten gesammelt.",
    exp_week: "Woche",
    exp_month: "Monat",
    exp_year: "Jahr",
    exp_none: "Noch keine Ausgaben – sie werden beim Abhaken von Artikeln mit Preis gebucht.",
    exp_no_store: "ohne Markt",
    exp: "Ausgaben",
    exp_help: "Gebucht beim Abhaken (Preis × Menge). Preise kommen aus Angeboten, von Hand (z. B. „Milch 2 l 1,19€“ oder ✏️) oder vom letzten Einkauf.",
    share_view: "nur ansehen",
    share_soft: "„soft“ abhaken (bleibt offen)",
    share_check: "richtig abhaken",
    share_mode: "Abhaken",
    share_mode_help: "„soft“: Du siehst, was markiert wurde – der Artikel bleibt in deiner Liste offen.",
    share_add: "Darf hinzufügen",
    share_valid: "Gültig",
    share_2h: "2 Stunden",
    share_1d: "1 Tag",
    share_7d: "7 Tage",
    share_30d: "30 Tage",
    share_forever: "bis zum Widerruf",
    share_create: "Link erstellen",
    share_active: "Aktive Links",
    share_revoke: "Widerrufen",
    share_expired: "abgelaufen",
    share_until: "bis",
    share_opened: "geöffnet",
    share_once: "Den Link gibt es nur jetzt – er wird nicht gespeichert. Später: widerrufen und neu erstellen.",
    share_local: "Das ist eine Adresse aus deinem Heimnetz – von außen funktioniert der Link nur mit externer URL (Einstellungen → System → Netzwerk).",
    share_copied: "kopiert",
    share_copy: "Link kopieren",
    share_send: "Teilen …",
    share: "Teilen per Link",
    share_help: "Für Leute ohne Home-Assistant-Konto. Sie sehen nur diese Liste (ohne Notizen) – sonst nichts aus Home Assistant. Standard: nur ansehen.",
    barcode_lookup: "Strichcodes online nachschlagen",
    barcode_lookup_help: "Open Food Facts, es wird nur die Nummer gesendet. Aus: nur schon bekannte Codes.",
    tab_stats: "Statistik",
    l_show_templates: "Vorlagen-Knopf (📋)",
    l_show_scan: "Strichcode-Knopf",
    l_show_prices: "Preise und Summe",
    p_group_combined: "Kombinierte Listen", p_group_lists: "Listen", p_group_notes: "Notizen", app_list_pending: "Kombinierte Liste aus der App – noch nicht in Home Assistant verbunden", app_list_admin: "Verbinden kann ein Home-Assistant-Admin (hier antippen oder unter Verbundene Geräte).", share_combined: "Achtung: Eine kombinierte Liste teilt die Artikel aller ihrer Quell-Listen.",
    aisle_sort: "Sortieren", aisle_drag: "Ziehen zum Verschieben", emoji_pick: "Symbol wählen", emoji_free: "eigenes", emoji_food: "Essen", emoji_occasion: "Anlässe & Haushalt", emoji_people: "Personen", emoji_symbols: "Zeichen", emoji_none: "ohne",
    trip_done: "Einkauf beendet", trip_help: "Die Summe „im Wagen“ beginnt wieder bei 0. Ausgaben bleiben gebucht. Für Listen, die du immer wieder nutzt, kannst du alles Abgehakte gleich wieder öffnen.", trip_reopen: "Alles wieder offen", trip_finish: "Beenden", stats_forget: "Aus dem Verlauf löschen", stats_forget_help: "wird aus Statistik, Vorschlägen und Kaufrhythmus entfernt (z. B. versehentlich hinzugefügt).", exp_entries: "Buchungen", notes_create: "Notizliste anlegen", notes_create_help: "Name der Notizliste. Sie gehört dir; angelegt als todo.ha_smartlists_notes_<name>.",
    p_lists_all: "Alle Listen", p_lists_less: "Weniger",
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
    zone_name: "Zone name, e.g. REWE Standort Test", zone_radius: "Radius", zone_coords: "Coordinates or map link", zone_coords_placeholder: "52.5200, 13.4050 or a Google/Apple/OSM maps link", zone_coords_bad: "No coordinates recognised.", zone_locating: "Getting location …", zone_no_location: "Location not available – choose another option.", zone_where: "Where?", zone_here_opt: "Current location (this device)", zone_home_opt: "Home", zone_map_opt: "Pick on the map", zone_after: "Fine-tune any time under Settings → Areas & zones.",
    note_new: "New note", note_edit: "Edit note", note_view: "List / grid", note_empty: "No notes yet.", note_locked: "Encrypted note", note_locked_help: "Encrypted with the app's notes password – readable only in the app.", note_title: "Title", note_body: "Text",
    p_settings_hint: "Tap the list that “This list” refers to. For me and Household apply to all lists.",
    list_settings_hint: "Controls, household and categories: ⚙ at the top right of the page.",
    settings_list: "Settings of this list", settings_global: "General settings", list_settings_hint_card: "Controls, household and categories: the slider icon next to it.",
    tpl: "Templates",
    scan: "Scan barcode",
    price_sum: "Total",
    soft_checked: "marked from outside (link)",
    soft_checked_help: "Someone marked this as done via a shared link – the item stays open until you check it off.",
    price: "Price",
    aisle: "Order",
    price_paid: "last paid",
    price_manual: "own price",
    price_last: "last time",
    tpl_servings: "Servings",
    tpl_new: "New template",
    tpl_from_list: "List as template",
    tpl_increase: "already on the list → quantity is increased",
    tpl_servings_help: "Quantities are scaled",
    tpl_increased: "quantity increased",
    tpl_name: "Name, e.g. Pancakes",
    tpl_items_placeholder: "Flour 250 g\nMilk 0.5 l\nEggs 3",
    tpl_items: "Items",
    tpl_items_help: "One item per line, with quantity and tags as in the list. Servings (optional) = how many the quantities are for.",
    tpl_edit: "Edit template",
    scan_help: "Hold the barcode across the red line – or type the number below it.",
    scan_code: "Barcode number",
    scan_unknown: "Product not found – please type the name yourself.",
    scan_find: "Look up",
    scan_no_camera: "Camera scanning is not supported here (e.g. iPhone Safari, Firefox) – type the number.",
    aisle_down: "Move down",
    aisle_help: "This is how shopping mode sorts when this store is selected.",
    aisle_all_branches: "all branches",
    aisle_reset: "Default",
    notify_to: "To my phone",
    notify_no_phone: "No phone with the companion app found.",
    notify_added: "On new items",
    notify_checked: "When something is checked off",
    notify_lists: "Lists",
    notify_all_lists: "all I can see",
    notify_from: "From whom",
    notify_quiet: "Quiet hours",
    notify_quiet_none: "none",
    notify: "Notifications",
    notify_help: "When someone else changes something – never for your own changes. Several changes within a minute arrive as one message.",
    stats_90: "90 days",
    stats_year: "Year",
    stats_all: "all",
    stats_top: "Bought most often",
    stats_every: "every",
    stats_none: "Not enough history yet.",
    stats_overdue: "Not bought for a while",
    stats_add: "Add to list",
    stats_usually: "usually every",
    stats_since: "since",
    stats_shares: "By category · store",
    stats: "Statistics",
    stats_help: "From the existing history – no additional data is collected.",
    exp_week: "Week",
    exp_month: "Month",
    exp_year: "Year",
    exp_none: "No expenses yet – they are booked when items with a price are checked off.",
    exp_no_store: "no store",
    exp: "Expenses",
    exp_help: "Booked when checking off (price × quantity). Prices come from offers, by hand (e.g. “Milk 2 l 1.19€” or ✏️) or from the last purchase.",
    share_view: "view only",
    share_soft: "“soft” check (stays open)",
    share_check: "really check off",
    share_mode: "Checking off",
    share_mode_help: "“soft”: you see what was marked – the item stays open in your list.",
    share_add: "May add",
    share_valid: "Valid",
    share_2h: "2 hours",
    share_1d: "1 day",
    share_7d: "7 days",
    share_30d: "30 days",
    share_forever: "until revoked",
    share_create: "Create link",
    share_active: "Active links",
    share_revoke: "Revoke",
    share_expired: "expired",
    share_until: "until",
    share_opened: "opened",
    share_once: "The link is shown only now – it is not stored. Later: revoke and create a new one.",
    share_local: "This is an address from your home network – from outside the link only works with an external URL (Settings → System → Network).",
    share_copied: "copied",
    share_copy: "Copy link",
    share_send: "Share …",
    share: "Share via link",
    share_help: "For people without a Home Assistant account. They only see this list (without notes) – nothing else from Home Assistant. Default: view only.",
    barcode_lookup: "Look up barcodes online",
    barcode_lookup_help: "Open Food Facts, only the number is sent. Off: only codes already known.",
    tab_stats: "Statistics",
    l_show_templates: "Templates button (📋)",
    l_show_scan: "Barcode button",
    l_show_prices: "Prices and total",
    p_group_combined: "Combined lists", p_group_lists: "Lists", p_group_notes: "Notes", app_list_pending: "Combined list from the app – not connected in Home Assistant yet", app_list_admin: "A Home Assistant admin can connect it (tap here or under Connected devices).", share_combined: "Note: a combined list shares the items of all its source lists.",
    aisle_sort: "Sort", aisle_drag: "Drag to move", emoji_pick: "Choose symbol", emoji_free: "custom", emoji_food: "Food", emoji_occasion: "Occasions & home", emoji_people: "People", emoji_symbols: "Symbols", emoji_none: "none",
    trip_done: "Shopping done", trip_help: "The “in cart” total starts at 0 again. Expenses stay booked. For lists you reuse, you can reopen everything checked right away.", trip_reopen: "Reopen all", trip_finish: "Finish", stats_forget: "Delete from history", stats_forget_help: "is removed from statistics, suggestions and buying rhythm (e.g. added by mistake).", exp_entries: "Bookings", notes_create: "Create note list", notes_create_help: "Name of the note list. It belongs to you; created as todo.ha_smartlists_notes_<name>.",
    p_lists_all: "All lists", p_lists_less: "Less",
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
    zone_name: "Nom de la zone, p. ex. Carrefour Centre", zone_radius: "Rayon", zone_coords: "Coordonnées ou lien de carte", zone_coords_placeholder: "48.8566, 2.3522 ou un lien Google/Apple/OSM", zone_coords_bad: "Aucune coordonnée reconnue.", zone_locating: "Localisation en cours …", zone_no_location: "Position indisponible – choisis une autre option.", zone_where: "Où ?", zone_here_opt: "Position actuelle (cet appareil)", zone_home_opt: "Domicile", zone_map_opt: "Choisir sur la carte", zone_after: "À ajuster à tout moment dans Paramètres → Pièces et zones.",
    note_new: "Nouvelle note", note_edit: "Modifier la note", note_view: "Liste / grille", note_empty: "Pas encore de notes.", note_locked: "Note chiffrée", note_locked_help: "Chiffrée avec le mot de passe des notes de l'app – lisible uniquement dans l'app.", note_title: "Titre", note_body: "Texte",
    p_settings_hint: "Touche la liste à laquelle « Cette liste » se rapporte. Pour moi et Foyer valent pour toutes les listes.",
    list_settings_hint: "Commandes, foyer et catégories : ⚙ en haut à droite de la page.",
    settings_list: "Paramètres de cette liste", settings_global: "Paramètres généraux", list_settings_hint_card: "Commandes, foyer et catégories : l'icône de réglage à côté.",
    tpl: "Modèles",
    scan: "Scanner le code-barres",
    price_sum: "Total",
    soft_checked: "marqué de l'extérieur (lien)",
    soft_checked_help: "Quelqu'un l'a marqué comme fait via un lien partagé – l'article reste ouvert jusqu'à ce que tu le coches.",
    price: "Prix",
    aisle: "Ordre",
    price_paid: "dernier prix payé",
    price_manual: "prix perso",
    price_last: "la dernière fois",
    tpl_servings: "Portions",
    tpl_new: "Nouveau modèle",
    tpl_from_list: "Liste comme modèle",
    tpl_increase: "déjà sur la liste → la quantité est augmentée",
    tpl_servings_help: "Les quantités sont recalculées",
    tpl_increased: "quantité augmentée",
    tpl_name: "Nom, ex. Crêpes",
    tpl_items_placeholder: "Farine 250 g\nLait 0,5 l\nŒufs 3",
    tpl_items: "Articles",
    tpl_items_help: "Un article par ligne, avec quantité et tags comme dans la liste. Portions (facultatif) = pour combien de personnes valent les quantités.",
    tpl_edit: "Modifier le modèle",
    scan_help: "Place le code-barres sur la ligne rouge – ou tape le numéro en dessous.",
    scan_code: "Numéro du code-barres",
    scan_unknown: "Produit introuvable – tape le nom toi-même.",
    scan_find: "Rechercher",
    scan_no_camera: "Le scan par caméra n'est pas pris en charge ici (ex. Safari sur iPhone, Firefox) – tape le numéro.",
    aisle_down: "Descendre",
    aisle_help: "C'est l'ordre du mode courses quand ce magasin est sélectionné.",
    aisle_all_branches: "toutes les succursales",
    aisle_reset: "Par défaut",
    notify_to: "Sur mon téléphone",
    notify_no_phone: "Aucun téléphone avec l'application Companion trouvé.",
    notify_added: "Nouveaux articles",
    notify_checked: "Quand quelque chose est coché",
    notify_lists: "Listes",
    notify_all_lists: "toutes celles que je vois",
    notify_from: "De qui",
    notify_quiet: "Heures calmes",
    notify_quiet_none: "aucune",
    notify: "Notifications",
    notify_help: "Quand quelqu'un d'autre modifie quelque chose – jamais pour tes propres modifications. Plusieurs modifications en une minute arrivent en un seul message.",
    stats_90: "90 jours",
    stats_year: "Année",
    stats_all: "tout",
    stats_top: "Achetés le plus souvent",
    stats_every: "tous les",
    stats_none: "Pas encore assez d'historique.",
    stats_overdue: "Pas acheté depuis longtemps",
    stats_add: "Ajouter à la liste",
    stats_usually: "d'habitude tous les",
    stats_since: "depuis",
    stats_shares: "Par catégorie · magasin",
    stats: "Statistiques",
    stats_help: "À partir de l'historique existant – aucune donnée supplémentaire n'est collectée.",
    exp_week: "Semaine",
    exp_month: "Mois",
    exp_year: "Année",
    exp_none: "Pas encore de dépenses – elles sont comptabilisées quand des articles avec un prix sont cochés.",
    exp_no_store: "sans magasin",
    exp: "Dépenses",
    exp_help: "Comptabilisées en cochant (prix × quantité). Les prix viennent des offres, de toi (ex. « Lait 2 l 1,19€ » ou ✏️) ou du dernier achat.",
    share_view: "lecture seule",
    share_soft: "cocher « soft » (reste ouvert)",
    share_check: "vraiment cocher",
    share_mode: "Cocher",
    share_mode_help: "« soft » : tu vois ce qui a été marqué – l'article reste ouvert dans ta liste.",
    share_add: "Peut ajouter",
    share_valid: "Validité",
    share_2h: "2 heures",
    share_1d: "1 jour",
    share_7d: "7 jours",
    share_30d: "30 jours",
    share_forever: "jusqu'à révocation",
    share_create: "Créer un lien",
    share_active: "Liens actifs",
    share_revoke: "Révoquer",
    share_expired: "expiré",
    share_until: "jusqu'au",
    share_opened: "ouvert",
    share_once: "Le lien n'est affiché que maintenant – il n'est pas enregistré. Plus tard : révoque-le et crées-en un nouveau.",
    share_local: "C'est une adresse de ton réseau local – depuis l'extérieur, le lien ne fonctionne qu'avec une URL externe (Paramètres → Système → Réseau).",
    share_copied: "copié",
    share_copy: "Copier le lien",
    share_send: "Partager …",
    share: "Partager par lien",
    share_help: "Pour les personnes sans compte Home Assistant. Elles ne voient que cette liste (sans notes) – rien d'autre de Home Assistant. Par défaut : lecture seule.",
    barcode_lookup: "Rechercher les codes-barres en ligne",
    barcode_lookup_help: "Open Food Facts, seul le numéro est envoyé. Désactivé : uniquement les codes déjà connus.",
    tab_stats: "Statistiques",
    l_show_templates: "Bouton modèles (📋)",
    l_show_scan: "Bouton code-barres",
    l_show_prices: "Prix et total",
    p_group_combined: "Listes combinées", p_group_lists: "Listes", p_group_notes: "Notes", app_list_pending: "Liste combinée de l'app – pas encore associée dans Home Assistant", app_list_admin: "Un admin Home Assistant peut l'associer (touche ici ou sous Appareils connectés).", share_combined: "Attention : une liste combinée partage les articles de toutes ses listes sources.",
    aisle_sort: "Trier", aisle_drag: "Glisser pour déplacer", emoji_pick: "Choisir un symbole", emoji_free: "personnalisé", emoji_food: "Nourriture", emoji_occasion: "Occasions & maison", emoji_people: "Personnes", emoji_symbols: "Symboles", emoji_none: "aucun",
    trip_done: "Courses terminées", trip_help: "Le total « dans le chariot » repart de 0. Les dépenses restent enregistrées. Pour les listes réutilisées, tu peux rouvrir tout ce qui est coché.", trip_reopen: "Tout rouvrir", trip_finish: "Terminer", stats_forget: "Supprimer de l'historique", stats_forget_help: "sera retiré des statistiques, suggestions et du rythme d'achat (p. ex. ajouté par erreur).", exp_entries: "Opérations", notes_create: "Créer une liste de notes", notes_create_help: "Nom de la liste de notes. Elle t'appartient ; créée en tant que todo.ha_smartlists_notes_<nom>.",
    p_lists_all: "Toutes les listes", p_lists_less: "Moins",
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
    zone_name: "Nombre de la zona, p. ej. Mercadona Centro", zone_radius: "Radio", zone_coords: "Coordenadas o enlace de mapa", zone_coords_placeholder: "40.4168, -3.7038 o un enlace de Google/Apple/OSM", zone_coords_bad: "No se reconocen coordenadas.", zone_locating: "Obteniendo ubicación …", zone_no_location: "Ubicación no disponible – elige otra opción.", zone_where: "¿Dónde?", zone_here_opt: "Ubicación actual (este dispositivo)", zone_home_opt: "Casa", zone_map_opt: "Elegir en el mapa", zone_after: "Ajústala cuando quieras en Ajustes → Áreas y zonas.",
    note_new: "Nueva nota", note_edit: "Editar nota", note_view: "Lista / cuadrícula", note_empty: "Aún no hay notas.", note_locked: "Nota cifrada", note_locked_help: "Cifrada con la contraseña de notas de la app – solo legible en la app.", note_title: "Título", note_body: "Texto",
    p_settings_hint: "Toca la lista a la que se refiere «Esta lista». Para mí y Hogar valen para todas las listas.",
    list_settings_hint: "Controles, hogar y categorías: ⚙ arriba a la derecha de la página.",
    settings_list: "Ajustes de esta lista", settings_global: "Ajustes generales", list_settings_hint_card: "Controles, hogar y categorías: el icono de controles al lado.",
    tpl: "Plantillas",
    scan: "Escanear código de barras",
    price_sum: "Total",
    soft_checked: "marcado desde fuera (enlace)",
    soft_checked_help: "Alguien lo marcó como hecho mediante un enlace compartido – el artículo sigue abierto hasta que lo marques tú.",
    price: "Precio",
    aisle: "Orden",
    price_paid: "último pagado",
    price_manual: "precio propio",
    price_last: "la última vez",
    tpl_servings: "Raciones",
    tpl_new: "Nueva plantilla",
    tpl_from_list: "Lista como plantilla",
    tpl_increase: "ya está en la lista → se aumenta la cantidad",
    tpl_servings_help: "Las cantidades se recalculan",
    tpl_increased: "cantidad aumentada",
    tpl_name: "Nombre, p. ej. Tortitas",
    tpl_items_placeholder: "Harina 250 g\nLeche 0,5 l\nHuevos 3",
    tpl_items: "Artículos",
    tpl_items_help: "Un artículo por línea, con cantidad y etiquetas como en la lista. Raciones (opcional) = para cuántos son las cantidades.",
    tpl_edit: "Editar plantilla",
    scan_help: "Coloca el código de barras sobre la línea roja – o escribe el número de debajo.",
    scan_code: "Número del código de barras",
    scan_unknown: "Producto no encontrado – escribe el nombre tú mismo.",
    scan_find: "Buscar",
    scan_no_camera: "El escaneo con cámara no es compatible aquí (p. ej. Safari en iPhone, Firefox) – escribe el número.",
    aisle_down: "Bajar",
    aisle_help: "Así ordena el modo compra cuando esta tienda está seleccionada.",
    aisle_all_branches: "todas las sucursales",
    aisle_reset: "Predeterminado",
    notify_to: "A mi móvil",
    notify_no_phone: "No se encontró ningún móvil con la app Companion.",
    notify_added: "Con artículos nuevos",
    notify_checked: "Cuando se marca algo",
    notify_lists: "Listas",
    notify_all_lists: "todas las que puedo ver",
    notify_from: "De quién",
    notify_quiet: "Horas de silencio",
    notify_quiet_none: "ninguna",
    notify: "Notificaciones",
    notify_help: "Cuando otra persona cambia algo – nunca por tus propios cambios. Varios cambios en un minuto llegan como un solo mensaje.",
    stats_90: "90 días",
    stats_year: "Año",
    stats_all: "todo",
    stats_top: "Comprado con más frecuencia",
    stats_every: "cada",
    stats_none: "Todavía no hay suficiente historial.",
    stats_overdue: "Hace tiempo que no se compra",
    stats_add: "Añadir a la lista",
    stats_usually: "normalmente cada",
    stats_since: "desde",
    stats_shares: "Por categoría · tienda",
    stats: "Estadísticas",
    stats_help: "A partir del historial existente – no se recopilan datos adicionales.",
    exp_week: "Semana",
    exp_month: "Mes",
    exp_year: "Año",
    exp_none: "Aún no hay gastos – se registran al marcar artículos con precio.",
    exp_no_store: "sin tienda",
    exp: "Gastos",
    exp_help: "Se registran al marcar (precio × cantidad). Los precios vienen de ofertas, a mano (p. ej. «Leche 2 l 1,19€» o ✏️) o de la última compra.",
    share_view: "solo ver",
    share_soft: "marcar «soft» (sigue abierto)",
    share_check: "marcar de verdad",
    share_mode: "Marcar",
    share_mode_help: "«soft»: ves lo que se ha marcado – el artículo sigue abierto en tu lista.",
    share_add: "Puede añadir",
    share_valid: "Validez",
    share_2h: "2 horas",
    share_1d: "1 día",
    share_7d: "7 días",
    share_30d: "30 días",
    share_forever: "hasta revocarlo",
    share_create: "Crear enlace",
    share_active: "Enlaces activos",
    share_revoke: "Revocar",
    share_expired: "caducado",
    share_until: "hasta",
    share_opened: "abierto",
    share_once: "El enlace solo se muestra ahora – no se guarda. Más tarde: revócalo y crea uno nuevo.",
    share_local: "Esta es una dirección de tu red doméstica – desde fuera el enlace solo funciona con una URL externa (Ajustes → Sistema → Red).",
    share_copied: "copiado",
    share_copy: "Copiar enlace",
    share_send: "Compartir …",
    share: "Compartir por enlace",
    share_help: "Para personas sin cuenta de Home Assistant. Solo ven esta lista (sin notas) – nada más de Home Assistant. Predeterminado: solo ver.",
    barcode_lookup: "Buscar códigos de barras en línea",
    barcode_lookup_help: "Open Food Facts, solo se envía el número. Desactivado: solo códigos ya conocidos.",
    tab_stats: "Estadísticas",
    l_show_templates: "Botón de plantillas (📋)",
    l_show_scan: "Botón de código de barras",
    l_show_prices: "Precios y total",
    p_group_combined: "Listas combinadas", p_group_lists: "Listas", p_group_notes: "Notas", app_list_pending: "Lista combinada de la app – aún no vinculada en Home Assistant", app_list_admin: "Un admin de Home Assistant puede vincularla (toca aquí o en Dispositivos conectados).", share_combined: "Atención: una lista combinada comparte los artículos de todas sus listas de origen.",
    aisle_sort: "Ordenar", aisle_drag: "Arrastrar para mover", emoji_pick: "Elegir símbolo", emoji_free: "propio", emoji_food: "Comida", emoji_occasion: "Ocasiones y hogar", emoji_people: "Personas", emoji_symbols: "Símbolos", emoji_none: "ninguno",
    trip_done: "Compra terminada", trip_help: "El total «en el carro» vuelve a 0. Los gastos siguen registrados. Para listas que reutilizas, puedes reabrir todo lo marcado.", trip_reopen: "Reabrir todo", trip_finish: "Terminar", stats_forget: "Borrar del historial", stats_forget_help: "se quita de estadísticas, sugerencias y ritmo de compra (p. ej. añadido por error).", exp_entries: "Movimientos", notes_create: "Crear lista de notas", notes_create_help: "Nombre de la lista de notas. Es tuya; se crea como todo.ha_smartlists_notes_<nombre>.",
    p_lists_all: "Todas las listas", p_lists_less: "Menos",
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
    zone_name: "Nome della zona, es. Esselunga Centro", zone_radius: "Raggio", zone_coords: "Coordinate o link della mappa", zone_coords_placeholder: "45.4642, 9.1900 o un link Google/Apple/OSM", zone_coords_bad: "Nessuna coordinata riconosciuta.", zone_locating: "Rilevamento posizione …", zone_no_location: "Posizione non disponibile – scegli un'altra opzione.", zone_where: "Dove?", zone_here_opt: "Posizione attuale (questo dispositivo)", zone_home_opt: "Casa", zone_map_opt: "Scegli sulla mappa", zone_after: "Regolala quando vuoi in Impostazioni → Aree e zone.",
    note_new: "Nuova nota", note_edit: "Modifica nota", note_view: "Lista / griglia", note_empty: "Ancora nessuna nota.", note_locked: "Nota cifrata", note_locked_help: "Cifrata con la password delle note dell'app – leggibile solo nell'app.", note_title: "Titolo", note_body: "Testo",
    p_settings_hint: "Tocca la lista a cui si riferisce «Questa lista». Per me e Casa valgono per tutte le liste.",
    list_settings_hint: "Comandi, casa e categorie: ⚙ in alto a destra nella pagina.",
    settings_list: "Impostazioni di questa lista", settings_global: "Impostazioni generali", list_settings_hint_card: "Comandi, casa e categorie: l'icona dei cursori accanto.",
    tpl: "Modelli",
    scan: "Scansiona codice a barre",
    price_sum: "Totale",
    soft_checked: "segnato dall'esterno (link)",
    soft_checked_help: "Qualcuno l'ha segnato come fatto tramite un link condiviso – l'articolo resta aperto finché non lo spunti tu.",
    price: "Prezzo",
    aisle: "Ordine",
    price_paid: "ultimo pagato",
    price_manual: "prezzo personale",
    price_last: "l'ultima volta",
    tpl_servings: "Porzioni",
    tpl_new: "Nuovo modello",
    tpl_from_list: "Lista come modello",
    tpl_increase: "già nella lista → la quantità viene aumentata",
    tpl_servings_help: "Le quantità vengono ricalcolate",
    tpl_increased: "quantità aumentata",
    tpl_name: "Nome, es. Pancake",
    tpl_items_placeholder: "Farina 250 g\nLatte 0,5 l\nUova 3",
    tpl_items: "Articoli",
    tpl_items_help: "Un articolo per riga, con quantità e tag come nella lista. Porzioni (facoltativo) = per quante persone valgono le quantità.",
    tpl_edit: "Modifica modello",
    scan_help: "Tieni il codice a barre sulla linea rossa – oppure digita il numero sotto.",
    scan_code: "Numero del codice a barre",
    scan_unknown: "Prodotto non trovato – digita tu il nome.",
    scan_find: "Cerca",
    scan_no_camera: "La scansione con fotocamera qui non è supportata (es. Safari su iPhone, Firefox) – digita il numero.",
    aisle_down: "Sposta giù",
    aisle_help: "Così ordina la modalità spesa quando è selezionato questo negozio.",
    aisle_all_branches: "tutte le filiali",
    aisle_reset: "Predefinito",
    notify_to: "Al mio telefono",
    notify_no_phone: "Nessun telefono con l'app Companion trovato.",
    notify_added: "Per nuovi articoli",
    notify_checked: "Quando qualcosa viene spuntato",
    notify_lists: "Liste",
    notify_all_lists: "tutte quelle che vedo",
    notify_from: "Da chi",
    notify_quiet: "Ore di silenzio",
    notify_quiet_none: "nessuna",
    notify: "Notifiche",
    notify_help: "Quando qualcun altro modifica qualcosa – mai per le tue modifiche. Più modifiche entro un minuto arrivano come un unico messaggio.",
    stats_90: "90 giorni",
    stats_year: "Anno",
    stats_all: "tutto",
    stats_top: "Acquistati più spesso",
    stats_every: "ogni",
    stats_none: "Cronologia ancora insufficiente.",
    stats_overdue: "Non acquistato da tempo",
    stats_add: "Aggiungi alla lista",
    stats_usually: "di solito ogni",
    stats_since: "da",
    stats_shares: "Per categoria · negozio",
    stats: "Statistiche",
    stats_help: "Dalla cronologia esistente – non vengono raccolti dati aggiuntivi.",
    exp_week: "Settimana",
    exp_month: "Mese",
    exp_year: "Anno",
    exp_none: "Ancora nessuna spesa – viene registrata quando spunti articoli con un prezzo.",
    exp_no_store: "senza negozio",
    exp: "Spese",
    exp_help: "Registrate alla spunta (prezzo × quantità). I prezzi vengono dalle offerte, a mano (es. «Latte 2 l 1,19€» o ✏️) o dall'ultimo acquisto.",
    share_view: "solo visualizzazione",
    share_soft: "spunta «soft» (resta aperto)",
    share_check: "spunta davvero",
    share_mode: "Spuntare",
    share_mode_help: "«soft»: vedi cosa è stato segnato – l'articolo resta aperto nella tua lista.",
    share_add: "Può aggiungere",
    share_valid: "Validità",
    share_2h: "2 ore",
    share_1d: "1 giorno",
    share_7d: "7 giorni",
    share_30d: "30 giorni",
    share_forever: "fino alla revoca",
    share_create: "Crea link",
    share_active: "Link attivi",
    share_revoke: "Revoca",
    share_expired: "scaduto",
    share_until: "fino al",
    share_opened: "aperto",
    share_once: "Il link viene mostrato solo ora – non viene salvato. In seguito: revocalo e creane uno nuovo.",
    share_local: "Questo è un indirizzo della tua rete domestica – dall'esterno il link funziona solo con un URL esterno (Impostazioni → Sistema → Rete).",
    share_copied: "copiato",
    share_copy: "Copia link",
    share_send: "Condividi …",
    share: "Condividi tramite link",
    share_help: "Per persone senza account Home Assistant. Vedono solo questa lista (senza note) – nient'altro di Home Assistant. Predefinito: solo visualizzazione.",
    barcode_lookup: "Cerca codici a barre online",
    barcode_lookup_help: "Open Food Facts, viene inviato solo il numero. Disattivato: solo codici già noti.",
    tab_stats: "Statistiche",
    l_show_templates: "Pulsante modelli (📋)",
    l_show_scan: "Pulsante codice a barre",
    l_show_prices: "Prezzi e totale",
    p_group_combined: "Liste combinate", p_group_lists: "Liste", p_group_notes: "Note", app_list_pending: "Lista combinata dall'app – non ancora collegata in Home Assistant", app_list_admin: "Un admin di Home Assistant può collegarla (tocca qui o in Dispositivi collegati).", share_combined: "Attenzione: una lista combinata condivide gli articoli di tutte le sue liste di origine.",
    aisle_sort: "Ordina", aisle_drag: "Trascina per spostare", emoji_pick: "Scegli simbolo", emoji_free: "personale", emoji_food: "Cibo", emoji_occasion: "Occasioni e casa", emoji_people: "Persone", emoji_symbols: "Simboli", emoji_none: "nessuno",
    trip_done: "Spesa finita", trip_help: "Il totale «nel carrello» riparte da 0. Le spese restano registrate. Per le liste che riusi puoi riaprire subito tutto ciò che è spuntato.", trip_reopen: "Riapri tutto", trip_finish: "Termina", stats_forget: "Elimina dalla cronologia", stats_forget_help: "viene rimosso da statistiche, suggerimenti e ritmo d'acquisto (es. aggiunto per errore).", exp_entries: "Movimenti", notes_create: "Crea lista di note", notes_create_help: "Nome della lista di note. È tua; creata come todo.ha_smartlists_notes_<nome>.",
    p_lists_all: "Tutte le liste", p_lists_less: "Meno",
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
    zone_name: "Nazwa strefy, np. Biedronka Centrum", zone_radius: "Promień", zone_coords: "Współrzędne lub link do mapy", zone_coords_placeholder: "52.2297, 21.0122 lub link z Google/Apple/OSM", zone_coords_bad: "Nie rozpoznano współrzędnych.", zone_locating: "Ustalanie lokalizacji …", zone_no_location: "Lokalizacja niedostępna – wybierz inną opcję.", zone_where: "Gdzie?", zone_here_opt: "Obecna lokalizacja (to urządzenie)", zone_home_opt: "Dom", zone_map_opt: "Wybierz na mapie", zone_after: "Dostosuj w dowolnej chwili w Ustawienia → Obszary i strefy.",
    note_new: "Nowa notatka", note_edit: "Edytuj notatkę", note_view: "Lista / siatka", note_empty: "Brak notatek.", note_locked: "Zaszyfrowana notatka", note_locked_help: "Zaszyfrowana hasłem notatek aplikacji – do odczytu tylko w aplikacji.", note_title: "Tytuł", note_body: "Treść",
    p_settings_hint: "Dotknij listy, której dotyczy „Ta lista”. Dla mnie i Dom dotyczą wszystkich list.",
    list_settings_hint: "Sterowanie, dom i kategorie: ⚙ w prawym górnym rogu strony.",
    settings_list: "Ustawienia tej listy", settings_global: "Ustawienia ogólne", list_settings_hint_card: "Sterowanie, dom i kategorie: ikona suwaków obok.",
    tpl: "Szablony",
    scan: "Skanuj kod kreskowy",
    price_sum: "Suma",
    soft_checked: "oznaczone z zewnątrz (link)",
    soft_checked_help: "Ktoś oznaczył to jako zrobione przez udostępniony link – produkt pozostaje otwarty, dopóki go nie odhaczysz.",
    price: "Cena",
    aisle: "Kolejność",
    price_paid: "ostatnio zapłacono",
    price_manual: "własna cena",
    price_last: "ostatnio",
    tpl_servings: "Porcje",
    tpl_new: "Nowy szablon",
    tpl_from_list: "Lista jako szablon",
    tpl_increase: "już jest na liście → ilość zostanie zwiększona",
    tpl_servings_help: "Ilości są przeliczane",
    tpl_increased: "ilość zwiększona",
    tpl_name: "Nazwa, np. Naleśniki",
    tpl_items_placeholder: "Mąka 250 g\nMleko 0,5 l\nJajka 3",
    tpl_items: "Produkty",
    tpl_items_help: "Jeden produkt w wierszu, z ilością i tagami jak na liście. Porcje (opcjonalnie) = dla ilu osób są podane ilości.",
    tpl_edit: "Edytuj szablon",
    scan_help: "Przytrzymaj kod kreskowy na czerwonej linii – albo wpisz numer pod nim.",
    scan_code: "Numer kodu kreskowego",
    scan_unknown: "Nie znaleziono produktu – wpisz nazwę samodzielnie.",
    scan_find: "Szukaj",
    scan_no_camera: "Skanowanie aparatem nie jest tu obsługiwane (np. Safari na iPhonie, Firefox) – wpisz numer.",
    aisle_down: "W dół",
    aisle_help: "Tak sortuje tryb zakupów, gdy wybrany jest ten sklep.",
    aisle_all_branches: "wszystkie oddziały",
    aisle_reset: "Domyślnie",
    notify_to: "Na mój telefon",
    notify_no_phone: "Nie znaleziono telefonu z aplikacją Companion.",
    notify_added: "Przy nowych produktach",
    notify_checked: "Gdy coś zostanie odhaczone",
    notify_lists: "Listy",
    notify_all_lists: "wszystkie, które widzę",
    notify_from: "Od kogo",
    notify_quiet: "Godziny ciszy",
    notify_quiet_none: "brak",
    notify: "Powiadomienia",
    notify_help: "Gdy ktoś inny coś zmieni – nigdy przy twoich własnych zmianach. Kilka zmian w ciągu minuty przychodzi jako jedna wiadomość.",
    stats_90: "90 dni",
    stats_year: "Rok",
    stats_all: "wszystko",
    stats_top: "Najczęściej kupowane",
    stats_every: "co",
    stats_none: "Za mało historii.",
    stats_overdue: "Dawno niekupowane",
    stats_add: "Dodaj do listy",
    stats_usually: "zwykle co",
    stats_since: "od",
    stats_shares: "Wg kategorii · sklepu",
    stats: "Statystyki",
    stats_help: "Na podstawie istniejącej historii – nie są zbierane żadne dodatkowe dane.",
    exp_week: "Tydzień",
    exp_month: "Miesiąc",
    exp_year: "Rok",
    exp_none: "Brak wydatków – są księgowane przy odhaczaniu produktów z ceną.",
    exp_no_store: "bez sklepu",
    exp: "Wydatki",
    exp_help: "Księgowane przy odhaczaniu (cena × ilość). Ceny pochodzą z ofert, wpisane ręcznie (np. „Mleko 2 l 4,99€” lub ✏️) lub z ostatniego zakupu.",
    share_view: "tylko podgląd",
    share_soft: "odhaczanie „soft” (pozostaje otwarte)",
    share_check: "naprawdę odhaczaj",
    share_mode: "Odhaczanie",
    share_mode_help: "„soft”: widzisz, co zostało oznaczone – produkt pozostaje otwarty na twojej liście.",
    share_add: "Może dodawać",
    share_valid: "Ważność",
    share_2h: "2 godziny",
    share_1d: "1 dzień",
    share_7d: "7 dni",
    share_30d: "30 dni",
    share_forever: "do odwołania",
    share_create: "Utwórz link",
    share_active: "Aktywne linki",
    share_revoke: "Odwołaj",
    share_expired: "wygasł",
    share_until: "do",
    share_opened: "otwarty",
    share_once: "Link jest widoczny tylko teraz – nie jest zapisywany. Później: odwołaj go i utwórz nowy.",
    share_local: "To adres z twojej sieci domowej – z zewnątrz link działa tylko z zewnętrznym adresem URL (Ustawienia → System → Sieć).",
    share_copied: "skopiowano",
    share_copy: "Kopiuj link",
    share_send: "Udostępnij …",
    share: "Udostępnij przez link",
    share_help: "Dla osób bez konta Home Assistant. Widzą tylko tę listę (bez notatek) – nic więcej z Home Assistant. Domyślnie: tylko podgląd.",
    barcode_lookup: "Wyszukuj kody kreskowe online",
    barcode_lookup_help: "Open Food Facts, wysyłany jest tylko numer. Wyłączone: tylko już znane kody.",
    tab_stats: "Statystyki",
    l_show_templates: "Przycisk szablonów (📋)",
    l_show_scan: "Przycisk kodu kreskowego",
    l_show_prices: "Ceny i suma",
    p_group_combined: "Listy połączone", p_group_lists: "Listy", p_group_notes: "Notatki", app_list_pending: "Lista połączona z aplikacji – jeszcze niepołączona w Home Assistant", app_list_admin: "Admin Home Assistant może ją połączyć (dotknij tutaj lub w Połączonych urządzeniach).", share_combined: "Uwaga: lista połączona udostępnia produkty wszystkich swoich list źródłowych.",
    aisle_sort: "Sortuj", aisle_drag: "Przeciągnij, aby przenieść", emoji_pick: "Wybierz symbol", emoji_free: "własny", emoji_food: "Jedzenie", emoji_occasion: "Okazje i dom", emoji_people: "Osoby", emoji_symbols: "Symbole", emoji_none: "brak",
    trip_done: "Zakupy zakończone", trip_help: "Suma „w koszyku” znów zaczyna od 0. Wydatki zostają zapisane. Dla list używanych ponownie możesz od razu przywrócić wszystko, co odhaczone.", trip_reopen: "Przywróć wszystko", trip_finish: "Zakończ", stats_forget: "Usuń z historii", stats_forget_help: "zostanie usunięte ze statystyk, podpowiedzi i rytmu zakupów (np. dodane przez pomyłkę).", exp_entries: "Wpisy", notes_create: "Utwórz listę notatek", notes_create_help: "Nazwa listy notatek. Należy do ciebie; tworzona jako todo.ha_smartlists_notes_<nazwa>.",
    p_lists_all: "Wszystkie listy", p_lists_less: "Mniej",
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

/* Zone anlegen: Name, Ort (aktueller Standort / Zuhause / Karte / Koordinaten bzw. Karten-Link), Radius.
 * Die Karte nutzt HAs eigenen Orts-Editor (ha-locations-editor), sofern das Frontend ihn geladen hat –
 * sonst bleiben Standort, Zuhause und Koordinaten. → Promise<{name, latitude, longitude, radius} | null> */
function parseCoords(text) {
  const s = String(text || "").trim();
  const pats = [/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /[?&](?:q|ll|query|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /mlat=(-?\d+(?:\.\d+)?).*mlon=(-?\d+(?:\.\d+)?)/i, /#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/, /^(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)$/];
  for (const re of pats) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1].replace(",", ".")), lon = Number(m[2].replace(",", "."));
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { latitude: lat, longitude: lon };
    }
  }
  return null;
}
function slZoneDialog(root, hass, t, name) {
  return new Promise((resolve) => {
    const home = { latitude: hass.config && hass.config.latitude, longitude: hass.config && hass.config.longitude };
    let pos = null, mode = "here";
    const nameIn = h("input", { value: name || "", "aria-label": t.zone_name, placeholder: t.zone_name, maxlength: "60" });
    const radiusIn = h("input", { type: "number", min: "20", max: "5000", step: "10", value: "100", "aria-label": t.zone_radius, style: "width:100px;margin:0" });
    const coordIn = h("input", { placeholder: t.zone_coords_placeholder, "aria-label": t.zone_coords });
    const info = h("p", { style: "margin:8px 0" });
    const mapBox = h("div", { style: "height:240px;border-radius:10px;overflow:hidden;margin:0 0 10px" });
    const hasMap = !!customElements.get("ha-locations-editor");
    const ok = h("button", { type: "button", class: "ok" }, t.create);
    const update = () => {
      coordIn.hidden = mode !== "coords";
      mapBox.hidden = mode !== "map";
      if (mode === "home") pos = home;
      if (mode === "coords") pos = parseCoords(coordIn.value);
      info.textContent = pos && pos.latitude != null ? `📍 ${Number(pos.latitude).toFixed(5)}, ${Number(pos.longitude).toFixed(5)}`
        : mode === "here" ? t.zone_locating : mode === "coords" && coordIn.value ? t.zone_coords_bad : "";
      ok.disabled = !(pos && pos.latitude != null && nameIn.value.trim());
    };
    const locate = () => {
      pos = null; update();
      if (!navigator.geolocation) { info.textContent = t.zone_no_location; return; }
      navigator.geolocation.getCurrentPosition((p) => { if (mode === "here") { pos = { latitude: p.coords.latitude, longitude: p.coords.longitude }; update(); } },
        () => { if (mode === "here") info.textContent = t.zone_no_location; }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    };
    const showMap = () => {
      if (!hasMap) return;
      const start = pos && pos.latitude != null ? pos : home;
      pos = { ...start };
      const ed = document.createElement("ha-locations-editor");
      ed.hass = hass;
      ed.style.height = "100%";
      ed.locations = [{ id: "new", latitude: start.latitude, longitude: start.longitude, radius: Number(radiusIn.value) || 100,
        radius_color: "var(--accent-color)", icon: "mdi:cart", location_editable: true, radius_editable: true }];
      ed.addEventListener("location-updated", (e) => { pos = { latitude: e.detail.location[0], longitude: e.detail.location[1] }; update(); });
      ed.addEventListener("radius-updated", (e) => { radiusIn.value = String(Math.round(e.detail.radius)); });
      fill(mapBox, ed);
      update();
    };
    const opt = (value, label) => h("label", { style: "display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer" },
      h("input", { type: "radio", name: "zpos", value, checked: value === mode, style: "width:auto;height:auto;margin:0",
        onchange: () => { mode = value; if (value === "here") locate(); else if (value === "map") showMap(); else update(); } }), label);
    const close = (v) => { back.remove(); resolve(v); };
    ok.addEventListener("click", () => {
      if (ok.disabled) return;
      close({ name: nameIn.value.trim(), latitude: Number(pos.latitude), longitude: Number(pos.longitude), radius: Math.max(20, Number(radiusIn.value) || 100) });
    });
    nameIn.addEventListener("input", update);
    coordIn.addEventListener("input", update);
    const back = h("div", { class: "dlg-back", onclick: (e) => { if (e.target === back) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.zone_new, style: "max-width:460px" },
        h("h2", {}, t.zone_new),
        nameIn,
        h("div", { style: "margin:0 0 6px;font-weight:600" }, t.zone_where),
        opt("here", "📍 " + t.zone_here_opt), opt("home", "🏠 " + t.zone_home_opt),
        hasMap ? opt("map", "🗺️ " + t.zone_map_opt) : null, opt("coords", "⌨️ " + t.zone_coords),
        coordIn, mapBox, info,
        h("label", { style: "display:flex;align-items:center;gap:8px;margin:0 0 14px" }, t.zone_radius, radiusIn, "m"),
        h("p", {}, t.zone_after),
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => close(null) }, t.cancel), ok)));
    root.append(back);
    coordIn.hidden = true; mapBox.hidden = true;
    locate();
    setTimeout(() => nameIn.focus(), 30);
  });
}

/* Kleiner QR-Code-Erzeuger (Byte-Modus, Fehlerkorrektur M, Version 1–15) – ohne externe Bibliothek.
 * Nach dem Verfahren von Project Nayuki (MIT). qrMatrix(text) → Array von Zeilen (true = dunkel). */
const QR_ECC_M = { // je Version: [EC-Codewörter je Block, Blöcke]
  1: [10, 1], 2: [16, 1], 3: [26, 1], 4: [18, 2], 5: [24, 2], 6: [16, 4], 7: [18, 4], 8: [22, 4], 9: [22, 5], 10: [26, 5],
  11: [30, 5], 12: [22, 8], 13: [22, 9], 14: [24, 9], 15: [24, 10],
};
function qrRawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}
function qrAlignPos(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const out = [6];
  for (let p = ver * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p);
  return out;
}
function rsDivisor(degree) {
  const res = new Array(degree).fill(0); res[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < res.length; j++) { res[j] = rsMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
    root = rsMul(root, 0x02);
  }
  return res;
}
function rsRemainder(data, div) {
  const res = div.map(() => 0);
  for (const b of data) {
    const f = b ^ res.shift(); res.push(0);
    div.forEach((c, i) => { res[i] ^= rsMul(c, f); });
  }
  return res;
}
function rsMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z & 0xff;
}
function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 15; ver++) {
    const [ecLen, blocks] = QR_ECC_M[ver];
    const dataCap = Math.floor(qrRawModules(ver) / 8) - ecLen * blocks;
    const need = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8;
    if (need <= dataCap * 8) break;
  }
  if (ver > 15) throw new Error("text too long for QR");
  const [ecLen, numBlocks] = QR_ECC_M[ver];
  const rawCw = Math.floor(qrRawModules(ver) / 8);
  const dataCw = rawCw - ecLen * numBlocks;
  // Bitstrom
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCw * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < dataCw * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // Blöcke + Fehlerkorrektur, verschränkt
  const shortBlocks = numBlocks - (rawCw % numBlocks);
  const shortLen = Math.floor(rawCw / numBlocks);
  const div = rsDivisor(ecLen);
  const blocks = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - ecLen + (i < shortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < shortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const cw = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= shortBlocks) cw.push(b[i]); });
  // Matrix
  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = qrAlignPos(ver);
  al.forEach((a, i) => al.forEach((b, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const dataBits = (0 << 3) | mask; // ECC M = 00
    let rem = dataBits;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((dataBits << 10) | rem) ^ 0x5412;
    const bit = (i) => ((b >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const b = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const v = ((b >>> i) & 1) !== 0, a = size - 11 + (i % 3), c = Math.floor(i / 3);
      set(a, c, v); set(c, a, v);
    }
  }
  // Daten im Zickzack
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
      if (!fn[y][x] && i < cw.length * 8) { m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
    }
  }
  // Maske mit geringster Strafe wählen
  const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const apply = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0;
    const line = (get) => {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b <= size; b++) {
          if (b < size && get(a, b) === get(a, b - 1)) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        for (let b = 0; b + 10 < size + 1; b++) {
          const s = Array.from({ length: 11 }, (_, k) => (b + k < size ? get(a, b + k) : false));
          const pat = [true, false, true, true, true, false, true];
          const w = [false, false, false, false];
          if ((pat.every((v, k) => s[k] === v) && w.every((v, k) => s[7 + k] === v)) ||
              (w.every((v, k) => s[k] === v) && pat.every((v, k) => s[4 + k] === v))) p += 40;
        }
      }
    };
    line((a, b) => m[a][b]); line((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    const dark = m.flat().filter(Boolean).length, total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) {
    apply(k); drawFormat(k);
    const p = penalty();
    if (p < bestP) { bestP = p; best = k; }
    apply(k);
  }
  apply(best); drawFormat(best);
  return m;
}
// als SVG (mit Ruhezone), für <img src> bzw. direkt einfügen
function qrSvg(text, px = 4) {
  const m = qrMatrix(text);
  const n = m.length + 8;
  let d = "";
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + 4},${y + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n * px}" height="${n * px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// Anzeigename eines Marktes ("rewe" → "REWE") aus den bekannten Märkten
const itemStoreLabel = (key, cfg) => { const k = ((cfg && cfg.known_stores) || []).find((x) => String(x.value).toLowerCase() === key); return k ? k.value : key; };
// Geldbetrag in der Sprache von HA ("2,38 €")
const fmtMoney = (v, lang) => (v == null ? "" : new Intl.NumberFormat(lang || "de", { style: "currency", currency: "EUR" }).format(v));

/* Symbol-Auswahl (Emoji) für Vorlagen und Badges: Raster nach Gruppen + freie Eingabe.
 * slEmojiPicker(root, current, t) → Promise<string | null> ("" = ohne Symbol) */
const EMOJI_GROUPS = [
  ["food", "🥞🍝🍕🍔🌭🥗🍲🍛🍜🍣🥘🌮🥪🍳🥐🍞🥖🧀🥩🍗🥓🐟🍤🥦🥕🍅🍎🍌🍓🍇🍉🥑🌽🥔🧅🧄🍰🎂🍪🍫🍦☕🍵🍺🍷🥂🧃🥤"],
  ["occasion", "🔥🎉🎄🎃🥳🏕️🧺🛒🛍️🎁🍼🧹🧴🧻🧼🧽🐶🐱🌿🏠🚗🏖️"],
  ["people", "👤👥👨👩👧👦🧑👵👴🧔👶🙂😀😎🤓🦸🧙🤖"],
  ["symbols", "#️⃣🏷️✅⭐❤️💚💙💛🧡💜🖤🌱♻️🔖📌🔔❗💶🎯⚡"],
];
function slEmojiPicker(root, current, t) {
  return new Promise((resolve) => {
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } };
    const free = h("input", { value: current || "", placeholder: t.emoji_free, "aria-label": t.emoji_free, maxlength: "8", style: "width:90px;text-align:center;margin:0" });
    // Antippen wählt nur aus (Vorschau im Feld) – übernommen wird mit OK
    const btn = (e) => h("button", { type: "button", class: "emo", title: e, "aria-label": e, onclick: () => { free.value = e; free.focus(); } }, e);
    const back = h("div", { class: "dlg-back", style: "z-index:1001", onclick: (ev) => { if (ev.target === back) close(null); } },
      h("style", {}, DIALOG_STYLE + `.emo{width:40px;height:40px;border-radius:10px;border:none;background:none;font-size:22px;cursor:pointer;padding:0}
        .emo:hover,.emo:focus-visible{background:var(--secondary-background-color,#eee)}.egrid{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 10px}
        .eh{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color,#777);margin:6px 0 2px}`),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.emoji_pick, style: "max-width:420px;max-height:85vh;overflow:auto" },
        h("h2", {}, t.emoji_pick),
        EMOJI_GROUPS.map(([key, list]) => [h("div", { class: "eh" }, t["emoji_" + key]),
          h("div", { class: "egrid" }, Array.from(new Intl.Segmenter ? [...new Intl.Segmenter().segment(list)].map((x) => x.segment) : [...list]).map(btn))]),
        h("div", { class: "row", style: "align-items:center" }, free,
          h("button", { type: "button", onclick: () => close(free.value.trim()) }, "OK"),
          h("button", { type: "button", style: "margin-right:auto", onclick: () => close("") }, t.emoji_none),
          h("button", { type: "button", onclick: () => close(null) }, t.cancel))));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
  });
}
// Eingabefeld mit Symbol-Auswahl: Antippen öffnet das Raster, Tippen ins Feld geht weiterhin
function emojiField(root, input, t, onpick) {
  input.readOnly = false;
  input.style.cursor = "pointer";
  input.addEventListener("click", async () => {
    const v = await slEmojiPicker(root, input.value, t);
    if (v == null) return;
    input.value = v;
    if (onpick) onpick(v);
    input.dispatchEvent(new Event("change"));
  });
  return input;
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
  .head { display:flex; align-items:center; gap:4px 8px; padding:16px 12px 8px 16px; flex-wrap:wrap; }
  .title { font-size:1.25rem; font-weight:500; flex:1 1 120px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* schmale Karten (Handy, mehrere Spalten): Knöpfe brechen in eine zweite Zeile um statt die Karte zu verbreitern */
  .head .sort select { max-width:110px; }
  ha-card { max-width:100%; }
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
  .add .smart { flex:1; min-width:0; }
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
  .notes { padding:4px 12px 12px; display:grid; gap:10px; }
  .priceline { font-size:.78rem; color:var(--secondary-text-color); font-variant-numeric:tabular-nums; }
  .priceline b { color:var(--primary-text-color); font-weight:600; }
  .softchk { font-size:.74rem; color:var(--sl-accent); }
  .sumbar { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 16px; background:var(--secondary-background-color,#f2f2f2); font-variant-numeric:tabular-nums; }
  .sumbar small { color:var(--secondary-text-color); font-weight:400; }
  .edit .price-in { width:120px; }
  .tplbar { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; padding:8px 12px 10px; }
  .tcard { position:relative; text-align:left; border:1px solid var(--divider-color,#ddd); border-radius:12px; padding:10px; background:var(--secondary-background-color,#f6f6f6); font:inherit; color:inherit; cursor:pointer; }
  .tcard b { display:block; overflow-wrap:anywhere; } .tcard small { color:var(--secondary-text-color); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tcard.new { border-style:dashed; display:grid; place-items:center; color:var(--sl-accent); }
  .tcard .ed { position:absolute; top:4px; right:4px; }
  .bars { display:flex; align-items:flex-end; gap:6px; height:120px; margin:8px 0 22px; }
  .bars .b { flex:1; display:flex; flex-direction:column-reverse; border-radius:6px 6px 0 0; overflow:hidden; position:relative; min-height:2px; }
  .bars .b span { position:absolute; bottom:-18px; left:-4px; right:-4px; text-align:center; font-size:.68rem; color:var(--secondary-text-color); }
  .legend { display:flex; gap:10px; flex-wrap:wrap; font-size:.78rem; color:var(--secondary-text-color); }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
  .statrow { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 10px; padding:4px 0; }
  .statrow .bar2 { grid-column:1/-1; height:5px; border-radius:3px; background:var(--divider-color,#ddd); overflow:hidden; }
  .statrow .bar2 i { display:block; height:100%; background:var(--sl-accent); }
  .qr { display:grid; place-items:center; margin:8px 0; } .qr svg { width:180px; height:180px; border-radius:8px; }
  .sharelink { font:600 .78rem ui-monospace,monospace; overflow-wrap:anywhere; padding:8px; border-radius:8px; background:var(--secondary-background-color,#f2f2f2); }
  .aisle { display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--divider-color,#ddd); border-radius:10px; margin:5px 0; background:var(--secondary-background-color,#f6f6f6); }
  .aisle .n { width:22px; height:22px; border-radius:50%; background:var(--sl-accent); color:var(--text-primary-color,#fff); display:grid; place-items:center; font-size:.72rem; font-weight:700; flex:none; }
  .aisle .grow { flex:1; }
  .xdel { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; padding:0 6px; }
  .xdel:hover { color:var(--error-color,#db4437); }
  .sumbar .btn2 { margin-left:8px; }
  .aisle .handle { cursor:grab; touch-action:none; user-select:none; font-size:1.1rem; padding:0 4px; color:var(--secondary-text-color); }
  .aisle.dragging { opacity:.5; } .aisle.drop { outline:2px dashed var(--sl-accent); outline-offset:1px; }
  .scanbox { position:relative; border-radius:12px; overflow:hidden; background:#000; aspect-ratio:4/3; margin:0 0 10px; }
  .scanbox video { width:100%; height:100%; object-fit:cover; display:block; }
  .scanbox::after { content:""; position:absolute; left:12%; right:12%; top:50%; height:2px; background:var(--error-color,#db4437); box-shadow:0 0 8px var(--error-color,#db4437); }
  .notes.grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
  .notes.list { grid-template-columns:minmax(0,1fr); }
  .notecard { text-align:left; font:inherit; color:inherit; cursor:pointer; border:1px solid var(--divider-color,#e0e0e0); border-radius:12px;
    background:var(--secondary-background-color,#f6f6f6); padding:10px 12px; min-height:64px; display:flex; flex-direction:column; gap:4px; }
  .notecard:hover { border-color:var(--sl-accent); }
  .notecard .nt { font-weight:600; overflow-wrap:anywhere; }
  .notecard .nb { font-size:.86rem; color:var(--secondary-text-color); white-space:pre-wrap; overflow-wrap:anywhere;
    display:-webkit-box; -webkit-line-clamp:6; -webkit-box-orient:vertical; overflow:hidden; }
  .notes.list .notecard .nb { -webkit-line-clamp:2; }
  .notecard.done { opacity:.6; }
  .tag.s-outline { background:none !important; border:1px solid currentColor; padding:0 6px; }
  .tag.s-text { background:none !important; padding:0 2px; }
  .look-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .look-row input[type=color] { width:36px; height:30px; padding:0 2px; border:1px solid var(--divider-color,#ddd); border-radius:8px; background:none; cursor:pointer; flex:none; }
  .look-row input.icon { width:46px; text-align:center; height:30px; }
  .look-row select { width:auto !important; }
  .zchips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; align-items:center; }
  .srow2.storerow { flex-wrap:wrap; align-items:flex-start; }
  .storerow .sl { flex:0 0 auto; min-width:90px; }
  .storerow .sl small { white-space:nowrap; margin-top:4px; }
  .storerow .zchips { flex:1 1 240px; }
  .storerow .zchips select { width:auto !important; min-width:110px; }
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
  .search2 { width:100%; height:40px; box-sizing:border-box; }
  .packadd { display:flex; flex-direction:column; gap:8px; margin:4px 0 10px; }
  .packadd2 { display:flex; gap:8px; align-items:center; }
  .packadd2 select { flex:1 1 auto; min-width:0; height:40px; }
  .packadd2 .btn2, .btn2 { white-space:nowrap; flex:none; }
  .learned2 { max-height:236px; overflow:auto; margin-top:8px; border:1px solid var(--divider-color,#e0e0e0); border-radius:10px; }
  .lrow2 { display:grid; grid-template-columns:minmax(0,1fr) auto 30px; align-items:center; gap:8px; padding:4px 4px 4px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow2:last-child { border-bottom:none; }
  .lrow2:nth-child(odd) { background:color-mix(in srgb, var(--secondary-background-color,#f2f2f2) 45%, transparent); }
  .lrow2 .w { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lrow2 select.cat { height:30px; max-width:170px; }
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
    this._tplEl = h("div");
    this._msgEl = h("div");
    this._listEl = h("div");
    this._progressEl = h("div");
    this._menuEl = h("div");
    this._snackEl = h("div");
    this._card = h("ha-card", {}, this._headEl, this._searchEl, this._filterEl, this._progressEl, this._settingsEl, this._importEl, this._tplEl, this._addEl, this._freqEl, this._msgEl,
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
      d.type !== "notes" && d.permissions.add && this._config.show_templates !== false
        ? iconBtn(this._showTpl ? ICON.close : ICON.template, t.tpl, () => { this._showTpl = !this._showTpl; this._renderTemplates(); this._render(); }) : null,
      !this._config.show_shopping ? null : h("button", { class: `icon-btn shopbtn ${this._shopping ? "on" : ""}`, type: "button", "aria-pressed": String(this._shopping),
        title: this._shopping ? t.shop_off : t.shop_on, "aria-label": this._shopping ? t.shop_off : t.shop_on,
        onclick: () => this._toggleShopping() }, svg(ICON.cart, 18)),
      // zwei Menüs: ⚙ = Einstellungen dieser Liste, ☰-Regler = allgemein (Für mich + Haushalt). Auf der
      // Seitenleisten-Seite liegt das allgemeine Menü oben rechts → dort nur ⚙ (settings_scope: "list").
      ...(this._config.show_settings === false ? [] : [
        this._config.settings_scope === "list" ? null
          : this._settingsBtn("global", ICON.tune, t.settings_global),
        this._settingsBtn("list", ICON.gear, t.settings_list)])
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
    this._renderTemplates();
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
        if (me.state === z.attributes.friendly_name || (z.attributes.persons || []).includes(me.entity_id)) { this._shopZone = zone; return store; }
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
      // Haushaltsdaten (Kategorien, Preise, Vorlagen, Badges, Links …) live: neu laden, wenn sie sich ändern
      try {
        this._unsubData = await conn.subscribeMessage(() => {
          if (!this._dataSoon) this._dataSoon = debounce(async () => { await this._loadConfig(); this._load(); }, 800);
          this._dataSoon();
        }, { type: "smartlists/subscribe" });
      } catch (e) { this._unsubData = null; } // ältere Integration ohne smartlists/subscribe
      this._startLive();
    } catch (e) { this._unsub = null; } finally { this._subscribing = false; }
  }
  _unsubscribe() {
    if (this._unsub) { try { this._unsub(); } catch (e) { /* */ } this._unsub = null; }
    if (this._unsubData) { try { this._unsubData(); } catch (e) { /* */ } this._unsubData = null; }
    this._stopLive();
  }
  // Sicherheitsnetz für Tablets/Handys: nach dem Aufwachen bzw. Zurückkehren zum Tab und einmal pro Minute
  // still neu laden – falls unterwegs eine Meldung verloren ging (Funkloch, Energiesparen).
  _startLive() {
    if (this._liveTimer) return;
    this._hiddenAt = 0;
    this._onVisible = () => {
      if (document.visibilityState === "hidden") { this._hiddenAt = Date.now(); return; }
      if (this._hiddenAt && Date.now() - this._hiddenAt > 15000) { this._loadConfig(); this._load(); }
      this._hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", this._onVisible);
    this._liveTimer = setInterval(() => { if (document.visibilityState !== "hidden" && !this._editing && this.isConnected !== false) this._load(); }, 60000);
  }
  _stopLive() {
    clearInterval(this._liveTimer); this._liveTimer = null;
    if (this._onVisible) { document.removeEventListener("visibilitychange", this._onVisible); this._onVisible = null; }
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
    if (d.type === "notes") {
      // Notizliste: kein Schnell-Eingabefeld (Mengen/Tags/Kategorie), sondern „Neue Notiz“ mit Titel + Text
      this._addAllowed = null;
      return fill(this._addEl, d.permissions.add
        ? h("div", { class: "acts", style: "margin:4px 12px 8px;justify-content:flex-start" },
          h("button", { class: "btn2 primary", type: "button", onclick: () => this._noteDialog(null) }, "＋ " + this._t.note_new),
          h("button", { class: "btn2", type: "button", title: this._t.note_view, "aria-label": this._t.note_view, onclick: () => {
            this._notesGrid = !this._notesView();
            try { localStorage.setItem("smartlists-notes-grid", this._notesGrid ? "1" : "0"); } catch (e) { /* */ }
            this._renderList();
          } }, this._notesView() ? "☰" : "▦"))
        : h("div", { class: "locked" }, svg(ICON.lock, 16), this._t.no_add));
    }
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
    const scanBtn = this._config.show_scan !== false ? iconBtn(ICON.barcode, t.scan, () => this._scanDialog(), "scanbtn") : null;
    fill(this._addEl, h("div", { class: "add" }, h("div", { class: "add-row" }, this._input, scanBtn, this._goBtn), this._previewEl, this._suggEl, this._pickEl));
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
  _notesView() {
    if (this._notesGrid == null) { try { this._notesGrid = localStorage.getItem("smartlists-notes-grid") !== "0"; } catch (e) { this._notesGrid = true; } }
    return this._notesGrid;
  }
  // Notizliste wie in der App: Karten mit Titel und Textvorschau, antippen = bearbeiten
  _renderNotes(d) {
    const t = this._t;
    const q = searchKey(this._searchQuery || "");
    const notes = d.items.filter((n) => !q || searchKey(`${n.text} ${n.note}`).includes(q));
    this._hitCount = notes.length;
    if (!notes.length) return fill(this._listEl, h("div", { class: "msg" }, q ? t.no_hits_short : t.note_empty));
    fill(this._listEl, h("div", { class: `notes ${this._notesView() ? "grid" : "list"}` }, notes.map((n) => {
      const locked = n.encrypted;
      return h("button", { type: "button", class: `notecard ${n.checked ? "done" : ""}`, disabled: locked && !n.permissions.delete,
        onclick: () => (locked ? this._noteLocked(n) : this._noteDialog(n)) },
        h("div", { class: "nt" }, locked ? "🔒 " + t.note_locked : n.text || "—"),
        locked ? h("div", { class: "nb" }, t.note_locked_help) : n.note ? h("div", { class: "nb" }, n.note) : null);
    })));
  }
  async _noteLocked(n) {
    const t = this._t;
    if (!n.permissions.delete) return;
    if (await slDialog(this.shadowRoot, { title: "🔒 " + t.note_locked, text: t.note_locked_help, ok: t.delete, cancel: t.cancel, danger: true })) this._deleteItems([n]);
  }
  // Notiz anlegen (n = null) oder bearbeiten: Titel + mehrzeiliger Text, Löschen
  _noteDialog(n) {
    const t = this._t;
    const title = h("input", { value: n ? n.text : "", placeholder: t.note_title, "aria-label": t.note_title, maxlength: "255" });
    const body = h("textarea", { placeholder: t.note_body, "aria-label": t.note_body, rows: "8",
      style: "width:100%;box-sizing:border-box;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:10px 12px;margin:0 0 14px;resize:vertical" });
    body.value = n ? n.note || "" : "";
    const close = () => back.remove();
    const save = async () => {
      const text = title.value.trim() || body.value.trim().split("\n")[0].slice(0, 60);
      if (!text) return;
      close();
      try {
        if (n) await this._call("update_item", { uid: n.uid, text, note: body.value });
        else await this._call("add_item", { text, note: body.value });
        await this._load();
      } catch (err) { this._error = (err && err.message) || t.error; this._render(); }
    };
    const back = h("div", { class: "dlg-back", onclick: (e) => { if (e.target === back) close(); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": n ? t.note_edit : t.note_new, style: "max-width:560px" },
        h("h2", {}, n ? t.note_edit : t.note_new), title, body,
        h("div", { class: "row" },
          n && n.permissions.delete ? h("button", { type: "button", style: "margin-right:auto;color:var(--error-color,#db4437)", onclick: async () => {
            close(); this._deleteItems([n]);
          } }, t.delete) : null,
          h("button", { type: "button", onclick: close }, t.cancel),
          h("button", { type: "button", class: "ok", onclick: save }, t.save))));
    title.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); body.focus(); } else if (e.key === "Escape") close(); });
    this.shadowRoot.append(back);
    setTimeout(() => (n ? body : title).focus(), 30);
  }

  _renderList() {
    const t = this._t;
    const d = this._data;
    if (d.type === "notes") return this._renderNotes(d);
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
      const order = this._catOrder(d);
      emoji = true;
      rows.push([...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b)).map((i) => this._row(i, d, true)));
    } else if (mode === "category") {
      // wie in der App: Gruppen in fester Markt-Reihenfolge, innerhalb A–Z (im Einkaufsmodus: Gänge des Marktes)
      const order = this._catOrder(d);
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
      const order = this._catOrder(d);
      const tiles = mode === "category" ? [...open].sort((a, b) => (order.indexOf(a.category) - order.indexOf(b.category)) || byName(a, b))
        : mode === "alpha" ? [...open].sort(byName) : open;
      out.splice(0, out.length, ...out.filter((x) => x.className === "nohits" || x.className === "empty"));
      out.push(h("div", { class: "tiles" }, tiles.map((i) => this._tile(i, d))));
    } else if (rows.length) out.push(h("div", { class: `items ${emoji ? "emoji" : ""}` }, rows));
    // Summe, sobald Preise bekannt sind: offen und (im Einkaufsmodus) im Wagen
    const sumOf = (list) => list.reduce((a, i) => a + (i.price && i.price.total ? i.price.total : 0), 0);
    if (this._config.show_prices !== false && d.items.some((i) => i.price)) {
      // „im Wagen“ = seit dem letzten „Einkauf beendet“ abgehakt
      const inTrip = done.filter((i) => !d.trip_start || (i.checked_at && i.checked_at >= d.trip_start));
      const openSum = sumOf(open), cartSum = sumOf(inTrip);
      out.push(h("div", { class: "sumbar" }, h("span", {}, t.price_sum, " ", h("small", {}, `${t.open} ${fmtMoney(openSum, this._hass.language)}${cartSum ? ` · ${t.in_cart} ${fmtMoney(cartSum, this._hass.language)}` : ""}`)),
        h("b", {}, fmtMoney(openSum + cartSum, this._hass.language)),
        done.length && d.permissions.toggle ? h("button", { class: "btn2", type: "button", style: "height:30px", onclick: () => this._finishShopping(done.length) }, "✓ " + t.trip_done) : null));
    }

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
        !it.offer && it.price && this._config.show_prices !== false ? this._priceLine(it) : null,
        it.soft_checked && !it.checked ? h("div", { class: "softchk", title: t.soft_checked_help }, "✓ ", t.soft_checked) : null,
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
    // Preis je Einheit (bzw. Stück) – gilt für diesen Artikel, auch wenn er später wieder auf die Liste kommt
    const priceIn = h("input", { class: "price-in", type: "number", min: "0", step: "0.01", inputmode: "decimal", placeholder: `${t.price} €${it.unit ? " / " + it.unit : ""}`,
      "aria-label": t.price, value: it.price && it.price.source !== "offer" && it.price.unit_price != null ? String(it.price.unit_price) : "" });
    const save = async () => {
      this._editing = null;
      const parsed = parseText(text.value, this._cfg.tag_rules, this._cfg.known_stores, true);
      const before = it.price && it.price.source !== "offer" ? it.price.unit_price : null;
      const nowP = priceIn.value === "" ? null : Number(priceIn.value);
      if (nowP !== before && !(nowP != null && Number.isNaN(nowP))) {
        try { await this._call("set_price", { name: parsed.name || it.name, price: nowP, store: (parsed.tags.find((x) => x.kind === "store") || {}).value || null }, false); } catch (e) { /* */ }
      }
      if (cat.value !== it.category) {
        try { await this._call("set_category", { name: parsed.name || it.name, category: cat.value }, false); } catch (e) { /* */ }
      }
      this._change(`${it.name} ${t.changed}`, "update_item", { uid: it.uid, text: encodeText(parsed, this._cfg.tag_rules) || it.text, note: note ? note.value : it.note || "" },
        () => () => this._call("update_item", { uid: it.uid, text: it.text, note: it.note || "" }));
    };
    [text, note, priceIn].filter(Boolean).forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { this._editing = null; this._renderList(); } }));
    setTimeout(() => text.focus(), 0);
    return h("div", { class: "edit" }, text, cat, note, this._config.show_prices !== false ? priceIn : null,
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
    return [this._controlsSection(device, chip), this._notifySection()];
  }
  _controlsSection(device, chip) {
    const t = this._t;
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
    if (d && d.type !== "notes" && (this._isAdmin || (d.own && d.own.role === "owner"))) out.push(this._shareLinkSection());
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
    const term = h("input", { class: "search2", placeholder: t.pack_term_placeholder, "aria-label": t.pack_term_placeholder });
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
      // Zeile 1: Stichwort(e) über die ganze Breite; Zeile 2: Kategorie + Hinzufügen
      h("div", { class: "packadd" }, term,
        h("div", { class: "packadd2" }, catSelect(newCat, (v) => { newCat = v; }),
          h("button", { class: "btn2 primary", type: "button", onclick: add }, "＋ " + t.pack_add))),
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
    // Farbwähler: beim Ziehen nur die Vorschau ändern (Wähler bleibt offen), gespeichert wird beim Schließen/Bestätigen
    const colorInput = (value, onlive, oncommit, label) => h("input", { type: "color", value: value || "#888888", "aria-label": label, title: label,
      oninput: (e) => onlive(e.target.value), onchange: (e) => oncommit(e.target.value) });
    const reset = (onclick, label) => h("button", { class: "btn2", type: "button", style: "height:30px;padding:0 10px", title: label, "aria-label": label, onclick }, "↺");
    const kindRow = (kind) => {
      const k = look.kinds[kind] || {};
      let prevK = null;
      const setK = (patch) => {
        const next = { ...k, ...patch };
        Object.keys(next).forEach((x) => (next[x] == null || next[x] === "") && delete next[x]);
        look = { ...look, kinds: { ...look.kinds, [kind]: next } };
        if (!Object.keys(next).length) delete look.kinds[kind];
        draw(); save();
      };
      return h("div", { class: "srow2" },
        (prevK = h("div", { class: "sl" }, t["kind_" + kind], h("small", {}, badge(sample[kind], look)))),
        h("div", { class: "look-row" },
          h("select", { "aria-label": `${t["kind_" + kind]}: ${t.look_style}`, onchange: (e) => setK({ style: e.target.value === BADGE_DEFAULTS[kind].style ? null : e.target.value }) },
            BADGE_STYLES.map((st) => h("option", { value: st, selected: (k.style || BADGE_DEFAULTS[kind].style) === st }, t["look_" + st]))),
          kind === "store" ? null : colorInput(k.color,
            (c) => fill(prevK.lastChild, badge(sample[kind], { ...look, kinds: { ...look.kinds, [kind]: { ...k, color: c } } })),
            (c) => setK({ color: c }), `${t["kind_" + kind]}: ${t.look_color}`),
          kind === "store" ? null : emojiField(this.shadowRoot, h("input", { class: "icon", value: k.icon != null ? k.icon : BADGE_DEFAULTS[kind].icon, maxlength: "8", "aria-label": t.look_icon, title: t.emoji_pick,
            onchange: (e) => setK({ icon: e.target.value === BADGE_DEFAULTS[kind].icon ? null : e.target.value }) }), t),
          reset(() => { const n = { ...look.kinds }; delete n[kind]; look = { ...look, kinds: n }; draw(); save(); }, t.reset_default)));
    };
    const listEl = h("div");
    const drawValues = () => {
      const q = searchKey(query);
      const rows = tags.filter((x) => !q || searchKey(x.label + " " + x.value).includes(q)).slice(0, 60);
      fill(listEl, ...rows.map((x) => {
        const cur = look.values[x.key] || {};
        let prevV = null;
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
          (prevV = h("div", { class: "sl" }, badge(preview, look), x.count ? h("small", {}, `${x.count}×`) : null)),
          h("div", { class: "look-row" },
            x.kind === "store" ? h("input", { class: "search2", style: "width:110px;margin:0", value: cur.label || "", placeholder: x.label, "aria-label": `${x.label}: ${t.look_label}`, title: t.look_label,
              onchange: (e) => setV({ label: e.target.value.trim() || null }) }) : null,
            colorInput(cur.color || (x.kind === "store" ? x.color : null),
              (c) => fill(prevV, badge({ ...preview, color: x.kind === "store" ? c : preview.color }, { ...look, values: { ...look.values, [x.key]: { ...cur, color: c } } }),
                x.count ? h("small", {}, `${x.count}×`) : null),
              (c) => setV({ color: c }), `${x.label}: ${t.look_color}`),
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
      // fragt Name, Ort (Standort / Zuhause / Karte / Koordinaten) und Radius
      const z = await slZoneDialog(this.shadowRoot, this._hass, t, store || "");
      if (!z) return;
      const name = z.name;
      try {
        await this._hass.callWS({ type: "zone/create", name, icon: "mdi:cart", latitude: z.latitude, longitude: z.longitude, radius: z.radius, passive: false });
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
        status.textContent = `✓ ${name}`;
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const draw = (stores) => {
      const zs = zones();
      const nameOf = (id) => (this._hass.states[id] ? this._hass.states[id].attributes.friendly_name || id : `⚠️ ${id}`);
      // je Markt beliebig viele Zonen (Filialen): Chips mit ×, dazu Auswahl „＋ Zone“
      fill(body, ...stores.map((st) => {
        const linked = st.zones || (st.zone ? [st.zone] : []);
        return h("div", { class: "srow2 storerow" },
          h("div", { class: "sl" }, badge({ kind: "store", value: st.value, label: st.label, color: st.color }),
            h("small", {}, linked.length ? `${linked.length} ${t.zone_count}` : t.zone_none),
            h("button", { class: "btn2", type: "button", style: "height:28px;padding:0 10px;margin-top:4px;font-size:.8rem",
              onclick: () => this._aisleEditor(body, st, linked, () => this._call("stores", {}, false).then((r) => draw(r.stores))) },
              "🛤️ " + t.aisle + (((this._cfg && this._cfg.store_order) || {})[st.key] ? " ✓" : ""))),
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
        h("div", { class: "acts", style: "justify-content:flex-start;margin-top:4px" }, h("button", { class: "btn2", type: "button", onclick: async () => {
          const name = await slDialog(this.shadowRoot, { title: t.notes_create, text: t.notes_create_help, input: true, value: (this._hass.user && this._hass.user.name) || "", ok: t.create, cancel: t.cancel });
          if (!name) return;
          status.textContent = t.loading;
          try { const r = await this._call("create_notes", { name }, false); status.textContent = `✓ ${r.entity_id}`; draw(await this._call("notes", {}, false)); this._refreshPanel(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, "＋ " + t.notes_create)),
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

  /* ---------------- 2.8: Markt-Reihenfolge, Preise, Vorlagen, Scannen, Statistik, Teilen, Benachrichtigungen ---------------- */
  // Reihenfolge der Kategorien: im Einkaufsmodus für einen Markt dessen Gänge (Filiale vor Markt), sonst Standard
  _catOrder(d) {
    const base = d.categories.map((c) => c.id);
    const so = (this._cfg && this._cfg.store_order) || {};
    if (!this._shopping || !this._shopStore) return base;
    const order = (this._shopZone && so[`${this._shopStore}@${this._shopZone}`]) || so[this._shopStore];
    return order ? [...order, ...base.filter((c) => !order.includes(c))] : base;
  }
  // „Einkauf beendet“: Summe im Wagen auf 0 – optional alles wieder offen für den nächsten Einkauf
  _finishShopping(doneCount) {
    const t = this._t;
    const run = async (reopen) => {
      dlg.remove();
      try {
        const r = await this._call("finish_shopping", { reopen });
        if (this._shopping) this._toggleShopping();
        this._toast(reopen ? `✓ ${t.trip_done} · ${r.reopened} ${t.unchecked}` : `✓ ${t.trip_done}`);
        await this._load();
      } catch (err) { this._toast((err && err.message) || t.error); }
    };
    const dlg = this._dialog(t.trip_done, h("p", {}, t.trip_help), [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", onclick: () => run(true) }, `${t.trip_reopen} (${doneCount})`),
      h("button", { type: "button", class: "ok", onclick: () => run(false) }, t.trip_finish)]);
  }
  _priceLine(it) {
    const t = this._t, p = it.price, lang = this._hass.language;
    const qty = (it.quantity || 1) * (it.pack_count || 1);
    const per = qty !== 1 && p.unit_price != null ? ` · ${fmtMoney(p.unit_price, lang)}${it.unit ? "/" + it.unit : ""}` : "";
    return h("div", { class: "priceline", title: p.source === "paid" ? t.price_paid : t.price_manual },
      p.source === "paid" ? "~ " : "", h("b", {}, fmtMoney(p.total, lang)), per, p.source === "paid" ? ` ${t.price_last}` : "");
  }

  // Vorlagen-Leiste über dem Eingabefeld (Knopf 📋 in der Kopfzeile)
  async _renderTemplates() {
    const el = this._tplEl;
    if (!el) return;
    if (!this._showTpl || !this._data) return fill(el);
    const t = this._t;
    if (!this._tpls) {
      fill(el, h("div", { class: "shelp", style: "padding:8px 14px" }, t.loading));
      try { this._tpls = (await this._call("templates", {}, false)).templates; } catch (e) { this._tpls = []; }
    }
    const tiles = this._tpls.map((tp) => h("button", { type: "button", class: "tcard", onclick: () => this._templateDialog(tp) },
      h("b", {}, `${tp.emoji ? tp.emoji + " " : ""}${tp.name}`),
      h("small", {}, `${tp.items.length} ${t.imp_count}${tp.servings ? ` · ${tp.servings} ${t.tpl_servings}` : ""} · ${tp.items.slice(0, 3).join(", ")}`),
      h("span", { class: "ed" }, iconBtn(ICON.pencil, t.edit, (e) => { e.stopPropagation(); this._templateEditor(tp); }))));
    fill(el, h("div", { class: "grp", style: "padding:8px 14px 0" }, t.tpl),
      h("div", { class: "tplbar" }, tiles,
        h("button", { type: "button", class: "tcard new", onclick: () => this._templateEditor(null) }, "＋ " + t.tpl_new),
        this._data.items.some((i) => !i.checked) ? h("button", { type: "button", class: "tcard new", onclick: () => this._templateEditor({
          name: "", emoji: "", servings: null, items: this._data.items.filter((i) => !i.checked).map((i) => i.text) }, true) }, "📥 " + t.tpl_from_list) : null));
  }
  _dialog(title, body, actions, width = 460) {
    const back = h("div", { class: "dlg-back", onclick: (e) => { if (e.target === back) back.remove(); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": title, style: `max-width:${width}px;max-height:90vh;overflow:auto` },
        h("h2", {}, title), body, h("div", { class: "row", style: "margin-top:12px" }, actions)));
    this.shadowRoot.append(back);
    return back;
  }
  // Vorlage hinzufügen: Portionen wählen, einzelne Artikel abwählen
  _templateDialog(tp) {
    const t = this._t;
    let servings = tp.servings || null;
    const skip = new Set();
    const listEl = h("div");
    const scale = (text) => {
      if (!servings || !tp.servings || servings === tp.servings) return text;
      const p = parseText(text, this._cfg.tag_rules, this._cfg.known_stores, true);
      if (p.quantity == null) return text;
      p.quantity = Math.round(p.quantity * servings / tp.servings * 100) / 100;
      return encodeText(p, this._cfg.tag_rules);
    };
    const present = new Set(this._data.items.filter((i) => !i.checked).map((i) => i.name.toLowerCase()));
    const draw = () => fill(listEl, tp.items.map((text, i) => {
      const p = parseText(text, this._cfg.tag_rules, this._cfg.known_stores, true);
      return h("label", { class: "srow2", style: "cursor:pointer" },
        h("input", { type: "checkbox", checked: !skip.has(i), style: "width:auto;height:auto;margin:0", onchange: (e) => { if (e.target.checked) skip.delete(i); else skip.add(i); } }),
        h("div", { class: "sl" }, scale(text), present.has(p.name.toLowerCase()) ? h("small", {}, t.tpl_increase) : null));
    }));
    draw();
    const body = h("div", {},
      tp.servings ? this._setRow(t.tpl_servings, h("input", { type: "number", min: "1", max: "100", value: String(servings), style: "width:80px;margin:0",
        oninput: (e) => { servings = Math.max(1, Number(e.target.value) || tp.servings); draw(); } }), t.tpl_servings_help) : null,
      listEl);
    const dlg = this._dialog(`${tp.emoji ? tp.emoji + " " : ""}${tp.name}`, body, [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        dlg.remove();
        try {
          const r = await this._call("add_template", { template_id: tp.id, servings, skip: [...skip] });
          this._toast(`${tp.name}: ${r.added} ${t.added}${r.increased ? `, ${r.increased} ${t.tpl_increased}` : ""}`);
          await this._load();
        } catch (err) { this._error = (err && err.message) || t.error; this._render(); }
      } }, t.pack_add)]);
  }
  // Vorlage anlegen/bearbeiten: Name, Symbol, Portionen, ein Artikel pro Zeile
  _templateEditor(tp, fromList = false) {
    const t = this._t;
    const name = h("input", { value: (tp && tp.name) || "", placeholder: t.tpl_name, "aria-label": t.tpl_name, maxlength: "60" });
    const emoji = emojiField(this.shadowRoot, h("input", { value: (tp && tp.emoji) || "", placeholder: "🥞", "aria-label": t.look_icon, title: t.emoji_pick, maxlength: "8", style: "width:64px;text-align:center;font-size:1.2rem" }), t);
    const servings = h("input", { type: "number", min: "1", max: "100", value: tp && tp.servings ? String(tp.servings) : "", placeholder: t.tpl_servings, "aria-label": t.tpl_servings, style: "width:110px" });
    const items = h("textarea", { rows: "8", placeholder: t.tpl_items_placeholder, "aria-label": t.tpl_items,
      style: "width:100%;box-sizing:border-box;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:10px 12px;margin:0 0 6px" });
    items.value = ((tp && tp.items) || []).join("\n");
    const body = h("div", {}, h("div", { style: "display:flex;gap:8px" }, emoji, name), servings,
      h("p", {}, t.tpl_items_help), items);
    const actions = [];
    if (tp && tp.id) actions.push(h("button", { type: "button", style: "margin-right:auto;color:var(--error-color,#db4437)", onclick: async () => {
      dlg.remove(); await this._call("delete_template", { template_id: tp.id }, false); this._tpls = null; this._renderTemplates();
    } }, t.delete));
    actions.push(h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        const lines = items.value.split("\n").map((x) => x.trim()).filter(Boolean);
        if (!name.value.trim() || !lines.length) return;
        try {
          await this._call("save_template", { ...(tp && tp.id ? { template_id: tp.id } : {}), name: name.value.trim(), items: lines,
            emoji: emoji.value.trim(), servings: servings.value ? Number(servings.value) : null }, false);
          dlg.remove(); this._tpls = null; this._showTpl = true; this._renderTemplates();
        } catch (err) { this._toast((err && err.message) || t.error); }
      } }, t.save));
    const dlg = this._dialog(tp && tp.id ? t.tpl_edit : fromList ? t.tpl_from_list : t.tpl_new, body, actions);
    setTimeout(() => name.focus(), 30);
  }
  _toast(text) {
    clearTimeout(this._toastT);
    const el = h("div", { class: "msg" }, text);
    fill(this._msgEl, el);
    this._toastT = setTimeout(() => { if (this._msgEl.firstChild === el) fill(this._msgEl); }, 4000);
  }

  // Strichcode scannen (Kamera, BarcodeDetector) oder eintippen → Name über SmartLists/Open Food Facts ins Eingabefeld
  async _scanDialog() {
    const t = this._t;
    const video = h("video", { autoplay: "", playsinline: "", muted: "" });
    // Android-WebView (Companion-App) spielt nur stumm + inline und erst nach play() ab
    video.muted = true; video.playsInline = true; video.setAttribute("webkit-playsinline", "");
    const box = h("div", { class: "scanbox" }, video);
    const info = h("p", {}, t.scan_help);
    const code = h("input", { inputmode: "numeric", placeholder: t.scan_code, "aria-label": t.scan_code, maxlength: "14" });
    let stream = null, timer = null, done = false;
    const stop = () => { done = true; clearInterval(timer); if (stream) stream.getTracks().forEach((tr) => tr.stop()); };
    const lookup = async (value) => {
      if (!/^\d{6,14}$/.test(value)) return;
      stop();
      info.textContent = t.loading;
      try {
        const r = await this._call("barcode", { code: value }, false);
        if (!r.found) { info.textContent = t.scan_unknown; return; }
        dlg.remove();
        const text = [r.name, r.brand && !r.name.toLowerCase().includes(r.brand.toLowerCase()) ? `(${r.brand})` : ""].filter(Boolean).join(" ");
        if (this._input) { this._input.value = text; this._input.dispatchEvent(new Event("input")); this._input.focus(); }
      } catch (err) { info.textContent = (err && err.message) || t.error; }
    };
    code.addEventListener("keydown", (e) => { if (e.key === "Enter") lookup(code.value.trim()); });
    const dlg = this._dialog(t.scan, h("div", {}, "BarcodeDetector" in window ? box : null, info, code), [
      h("button", { type: "button", onclick: () => { stop(); dlg.remove(); } }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: () => lookup(code.value.trim()) }, t.scan_find)]);
    const observer = new MutationObserver(() => { if (!dlg.isConnected) { stop(); observer.disconnect(); } });
    if (this.shadowRoot && observer.observe) observer.observe(this.shadowRoot, { childList: true });
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) { info.textContent = t.scan_no_camera; return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (done) { stop(); return; }
      video.srcObject = stream;
      try { await video.play(); } catch (e) { /* Autoplay blockiert → Nutzer kann ins Bild tippen */ }
      video.addEventListener("click", () => video.play().catch(() => {}));
      timer = setInterval(async () => {
        if (done || video.readyState < 2) return;
        try { const hits = await detector.detect(video); if (hits.length) lookup(hits[0].rawValue); } catch (e) { /* */ }
      }, 300);
    } catch (err) { box.remove(); info.textContent = t.scan_no_camera; }
  }

  // Reihenfolge der Gänge für einen Markt (optional je Filiale) – ▲▼
  _aisleEditor(body, st, zones, onClose) {
    const t = this._t;
    const saved = [...body.childNodes];
    const so = (this._cfg && this._cfg.store_order) || {};
    const cats = categoryOptions(this._lang);
    let zone = "";
    let order = [];
    const load = () => { const cur = so[zone ? `${st.key}@${zone}` : st.key] || (zone ? so[st.key] : null); order = cur ? [...cur] : cats.map(([id]) => id); };
    load();
    const status = h("span", { class: "ok2" });
    const listEl = h("div");
    const label = (id) => (cats.find(([c]) => c === id) || [id, id])[1];
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; draw(); };
    // Sortiermodus (Knopf): Zeilen am Griff ⠿ ziehen – mit Maus, Finger oder Stift; sonst ▲▼
    let sorting = false;
    const sortBtn = h("button", { class: "btn2", type: "button", "aria-pressed": "false", onclick: () => { sorting = !sorting; sortBtn.classList.toggle("primary", sorting); sortBtn.setAttribute("aria-pressed", String(sorting)); draw(); } }, "⠿ " + t.aisle_sort);
    const startDrag = (e, from) => {
      e.preventDefault();
      const handle = e.currentTarget;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      const rows = [...listEl.childNodes];
      rows[from].classList.add("dragging");
      let to = from;
      const onMove = (ev) => {
        const hit = (this.shadowRoot.elementFromPoint ? this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY) : null);
        const row = hit && hit.closest ? hit.closest(".aisle") : null;
        const idx = row ? rows.indexOf(row) : -1;
        if (idx >= 0 && idx !== to) { rows.forEach((r) => r.classList.remove("drop")); rows[idx].classList.add("drop"); to = idx; }
      };
      const onUp = () => {
        handle.removeEventListener("pointermove", onMove); handle.removeEventListener("pointerup", onUp); handle.removeEventListener("pointercancel", onUp);
        if (to !== from) { const [x] = order.splice(from, 1); order.splice(to, 0, x); }
        draw();
      };
      handle.addEventListener("pointermove", onMove); handle.addEventListener("pointerup", onUp); handle.addEventListener("pointercancel", onUp);
    };
    const draw = () => fill(listEl, order.map((id, i) => h("div", { class: `aisle ${sorting ? "sorting" : ""}` },
      sorting ? h("span", { class: "handle", title: t.aisle_drag, "aria-label": t.aisle_drag, onpointerdown: (e) => startDrag(e, i) }, "⠿") : null,
      h("span", { class: "n" }, String(i + 1)), h("span", { class: "grow" }, label(id)),
      sorting ? null : iconBtn(ICON.chevron, t.pack_up, () => move(i, -1), "up"), sorting ? null : iconBtn(ICON.chevron, t.aisle_down, () => move(i, 1)))));
    const save = async (o) => {
      try {
        const r = await this._call("store_order", { store: st.key, zone: zone || null, order: o }, false);
        this._cfg = { ...this._cfg, store_order: r.store_order };
        status.textContent = "✓ " + t.saved;
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    fill(body,
      h("div", { class: "srow2", style: "border-top:none" }, iconBtn(ICON.back, t.p_back, () => { fill(body, ...saved); onClose && onClose(); }),
        h("div", { class: "sl" }, h("b", {}, `${st.label} – ${t.aisle}`), h("small", {}, t.aisle_help)),
        zones.length ? h("select", { "aria-label": t.zone, onchange: (e) => { zone = e.target.value; load(); draw(); } },
          h("option", { value: "" }, t.aisle_all_branches),
          zones.map((z) => h("option", { value: z }, (this._hass.states[z] && this._hass.states[z].attributes.friendly_name) || z))) : null),
      listEl,
      h("div", { class: "acts" }, status, sortBtn,
        h("button", { class: "btn2", type: "button", onclick: () => { save(null); order = cats.map(([id]) => id); draw(); } }, t.aisle_reset),
        h("button", { class: "btn2 primary", type: "button", onclick: () => save(order) }, t.save)));
    draw();
  }

  // Für mich → Benachrichtigungen (jeder für sich)
  _notifySection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let cur = null, services = [], users = [];
    const save = async (patch) => {
      cur = { ...cur, ...patch };
      try { cur = (await this._call("set_notify", { settings: cur }, false)).settings; status.textContent = "✓ " + t.saved; draw(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const lists = () => Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, this._hass.states[e].attributes.friendly_name))
      .map((e) => [e, this._hass.states[e].attributes.friendly_name || e]);
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, "aria-pressed": String(on), onclick: fn }, label);
    const draw = () => {
      const q = cur.quiet;
      fill(body,
        this._setRow(t.notify_to, h("select", { "aria-label": t.notify_to, onchange: (e) => save({ service: e.target.value || null }) },
          h("option", { value: "" }, "— " + t.g_off),
          services.map((sv) => h("option", { value: sv, selected: cur.service === sv }, sv.replace(/^mobile_app_/, "").replace(/_/g, " ")))),
          services.length ? null : t.notify_no_phone),
        this._setRow(t.notify_added, this._switch(cur.added, (v) => save({ added: v }), t.notify_added)),
        this._setRow(t.notify_checked, this._switch(cur.checked, (v) => save({ checked: v }), t.notify_checked)),
        h("div", { class: "grp" }, t.notify_lists),
        h("div", { class: "chips" }, chipOf(!cur.lists.length, t.notify_all_lists, () => save({ lists: [] })),
          lists().map(([e, n]) => chipOf(cur.lists.includes(e), n, () => save({ lists: cur.lists.includes(e) ? cur.lists.filter((x) => x !== e) : [...cur.lists, e] })))),
        users.length ? h("div", { class: "grp" }, t.notify_from) : null,
        users.length ? h("div", { class: "chips" }, users.filter((u) => u.id !== (this._hass.user && this._hass.user.id)).map((u) =>
          chipOf(!cur.muted.includes(u.id), u.name, () => save({ muted: cur.muted.includes(u.id) ? cur.muted.filter((x) => x !== u.id) : [...cur.muted, u.id] })))) : null,
        this._setRow(t.notify_quiet, h("select", { "aria-label": t.notify_quiet, onchange: (e) => save({ quiet: e.target.value ? e.target.value.split("-").map(Number) : null }) },
          [["", t.notify_quiet_none], ["22-7", "22–7"], ["21-7", "21–7"], ["23-8", "23–8"]].map(([v, l]) =>
            h("option", { value: v, selected: (q ? q.join("-") : "") === v }, l)))),
        h("div", { class: "acts" }, status));
    };
    Promise.all([this._call("notify", {}, false), this._call("users", {}, false).catch(() => ({ users: [] }))])
      .then(([r, u]) => { cur = r.settings; services = r.services; users = u.users || []; draw(); }).catch(() => fill(body, t.error));
    return this._sec("🔔", t.notify, t.notify_help, [body]);
  }

  // Statistik + Ausgaben (Reiter „Statistik“ der allgemeinen Einstellungen bzw. 📊 auf der Seite)
  _paneStats() { return [this._statsSection(), this._expensesSection()]; }
  _statsSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let days = 90;
    const load = () => this._call("stats", { days }, false).then(draw).catch(() => fill(body, t.error));
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const draw = (r) => {
      const max = Math.max(1, ...r.top.map((x) => x.count));
      fill(body,
        h("div", { class: "chips" }, [[90, t.stats_90], [365, t.stats_year], [0, t.stats_all]].map(([d, l]) => chipOf(days === d, l, () => { days = d; load(); }))),
        h("div", { class: "grp" }, t.stats_top),
        r.top.length ? r.top.slice(0, 10).map((x) => h("div", { class: "statrow" }, h("span", {}, x.name,
            this._isAdmin ? h("button", { class: "xdel", type: "button", title: t.stats_forget, "aria-label": `${t.stats_forget}: ${x.name}`,
              onclick: async () => { if (await slDialog(this.shadowRoot, { title: t.stats_forget, text: `${x.name}: ${t.stats_forget_help}`, ok: t.delete, cancel: t.cancel, danger: true })) { await this._call("forget_history", { name: x.name }, false); load(); } } }, "×") : null),
          h("span", { class: "shelp", style: "padding:0" }, `${x.count}×${x.every_days ? ` · ${t.stats_every} ${x.every_days} ${t.days}` : ""}`),
          h("div", { class: "bar2" }, h("i", { style: `width:${Math.round(100 * x.count / max)}%` }))))
          : h("div", { class: "shelp" }, t.stats_none),
        r.overdue.length ? h("div", { class: "grp" }, t.stats_overdue) : null,
        r.overdue.map((x) => this._setRow(x.name, this._data && this._data.permissions.add
          ? h("button", { class: "btn2", type: "button", onclick: async (e) => { e.target.disabled = true; await this._call("add_item", { text: x.name }); this._load(); } }, "＋ " + t.stats_add)
          : null, `${t.stats_usually} ${x.every_days} ${t.days} · ${t.stats_since} ${x.since_days} ${t.days}`)),
        r.categories.length ? h("div", { class: "grp" }, t.stats_shares) : null,
        h("div", { class: "chips" }, r.categories.slice(0, 6).map((c) => h("span", { class: "chip2" }, `${c.label} ${c.share} %`)),
          r.stores.map((x) => h("span", { class: "chip2" }, `${x.label} ${x.share} %`))));
    };
    load();
    return this._sec("📊", t.stats, t.stats_help, [body]);
  }
  _expensesSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let period = "month";
    const lang = this._hass.language;
    const colorOf = (store) => {
      if (!store) return "#9e9e9e";
      const known = ((this._cfg && this._cfg.known_stores) || []).find((k) => String(k.value).toLowerCase() === store);
      return (known && known.color) || hashColor(store);
    };
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const load = () => this._call("expenses", { period, count: 6 }, false).then(draw).catch(() => fill(body, t.error));
    const draw = (r) => {
      const max = Math.max(1, ...r.rows.map((x) => x.total));
      const totals = {};
      r.rows.forEach((row) => Object.entries(row.stores).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));
      const last = r.rows[r.rows.length - 1];
      fill(body,
        h("div", { class: "chips" }, [["week", t.exp_week], ["month", t.exp_month], ["year", t.exp_year]].map(([p, l]) => chipOf(period === p, l, () => { period = p; load(); }))),
        r.rows.length ? h("div", { class: "bars" }, r.rows.map((row) => h("div", { class: "b", title: `${row.period}: ${fmtMoney(row.total, lang)}`, style: `height:${Math.max(3, Math.round(100 * row.total / max))}%` },
          Object.entries(row.stores).map(([k, v]) => h("div", { style: `flex:${v};background:${colorOf(k)}` })),
          h("span", {}, row.period.slice(period === "year" ? 0 : 5))))) : h("div", { class: "shelp" }, t.exp_none),
        r.rows.length ? h("div", { class: "legend" }, Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
          h("span", {}, h("i", { style: `background:${colorOf(k)}` }), `${k ? itemStoreLabel(k, this._cfg) : t.exp_no_store} ${fmtMoney(v, lang)}`))) : null,
        last ? h("p", { class: "shelp", style: "padding:6px 0 0" }, `${last.period}: ${fmtMoney(last.total, lang)} (Ø ${fmtMoney(r.average, lang)})`) : null,
        h("div", { class: "acts", style: "justify-content:flex-start" }, h("button", { class: "btn2", type: "button", onclick: () => { showEntries = !showEntries; drawEntries(); } }, `🧾 ${t.exp_entries}`)),
        entriesEl);
      drawEntries();
    };
    // einzelne Buchungen prüfen und falsche löschen (Admins: alle, sonst eigene)
    let showEntries = false;
    const entriesEl = h("div");
    const drawEntries = async () => {
      if (!showEntries) return fill(entriesEl);
      fill(entriesEl, h("div", { class: "shelp" }, t.loading));
      let entries = [];
      try { entries = (await this._call("expense_entries", { limit: 100 }, false)).entries; } catch (e) { /* */ }
      if (!entries.length) return fill(entriesEl, h("div", { class: "shelp" }, t.exp_none));
      fill(entriesEl, h("div", { class: "learned2" }, entries.map((e) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, e.name, h("span", { class: "manual" }, `${new Date(e.t * 1000).toLocaleDateString(lang || "de")}${e.store ? " · " + itemStoreLabel(e.store, this._cfg) : ""}`)),
        h("span", { class: "cat" }, fmtMoney(e.amount, lang)),
        iconBtn(ICON.close, t.delete, async () => { await this._call("delete_expense", { expense_id: e.id }, false); load(); }, "danger")))));
    };
    load();
    return this._sec("💶", t.exp, t.exp_help, [body]);
  }

  // Diese Liste → Teilen per Link (Standard: nur ansehen; Optionen beim Erstellen)
  _shareLinkSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let check = "off", add = false, hours = 168, links = [];
    const lang = this._hass.language;
    const base = () => {
      const c = this._hass.config || {};
      return String(c.external_url || (this._hass.auth && this._hass.auth.data && this._hass.auth.data.hassUrl) || location.origin).replace(/\/$/, "");
    };
    const fmtDate = (ts) => new Date(ts * 1000).toLocaleString(lang || "de", { dateStyle: "short", timeStyle: "short" });
    const modeLabel = (m) => ({ off: t.share_view, soft: t.share_soft, on: t.share_check }[m]);
    const created = h("div");
    const draw = () => fill(body,
      this._setRow(t.share_mode, h("select", { "aria-label": t.share_mode, onchange: (e) => { check = e.target.value; } },
        [["off", t.share_view], ["soft", t.share_soft], ["on", t.share_check]].map(([v, l]) => h("option", { value: v, selected: check === v }, l))), t.share_mode_help),
      this._setRow(t.share_add, this._switch(add, (v) => { add = v; }, t.share_add)),
      this._setRow(t.share_valid, h("select", { "aria-label": t.share_valid, onchange: (e) => { hours = e.target.value ? Number(e.target.value) : null; } },
        [[2, t.share_2h], [24, t.share_1d], [168, t.share_7d], [720, t.share_30d], ["", t.share_forever]].map(([v, l]) =>
          h("option", { value: String(v), selected: String(hours ?? "") === String(v) }, l)))),
      this._data && this._data.type === "combined" ? h("div", { class: "shelp", style: "padding:6px 0" }, "⚠️ " + t.share_combined) : null,
      h("div", { class: "acts" }, status, h("button", { class: "btn2 primary", type: "button", onclick: create }, "🔗 " + t.share_create)),
      created,
      links.length ? h("div", { class: "grp" }, t.share_active) : null,
      ...links.map((l) => this._setRow(`${modeLabel(l.check)}${l.add ? " + " + t.share_add : ""}`,
        iconBtn(ICON.close, t.share_revoke, async () => { links = (await this._call("share_revoke", { link_id: l.id })).links; draw(); }, "danger"),
        `${l.expired ? "⚠️ " + t.share_expired : l.expires ? `${t.share_until} ${fmtDate(l.expires)}` : t.share_forever} · ${l.opens}× ${t.share_opened}`)));
    const create = async () => {
      try {
        const r = await this._call("share_create", { check, add, hours });
        const url = base() + r.path;
        links = (await this._call("share_links", {})).links;
        draw();
        const isLocal = /\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^/]*\.local)/i.test(url);
        let svgText = "";
        try { svgText = qrSvg(url, 4); } catch (e) { svgText = ""; }
        const qrBox = h("div", { class: "qr" });
        qrBox.innerHTML = svgText;
        fill(created, h("div", { class: "sec", style: "margin:8px 0" }, h("div", { class: "sbody", style: "padding-top:10px" },
          h("div", { class: "shelp" }, t.share_once),
          isLocal ? h("div", { class: "shelp", style: "color:var(--warning-color,#ff9800)" }, "⚠️ " + t.share_local) : null,
          qrBox, h("div", { class: "sharelink" }, url),
          h("div", { class: "acts" },
            h("button", { class: "btn2", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(url); status.textContent = "✓ " + t.share_copied; } catch (e) { status.textContent = url; } } }, t.share_copy),
            navigator.share ? h("button", { class: "btn2 primary", type: "button", onclick: () => navigator.share({ title: this._data ? this._data.name : "SmartLists", url }).catch(() => {}) }, t.share_send) : null))));
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    this._call("share_links", {}).then((r) => { links = r.links; draw(); }).catch((err) => fill(body, h("div", { class: "shelp" }, (err && err.message) || t.error)));
    return this._sec("🔗", t.share, t.share_help, [body]);
  }

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
        // Kategorie nachträglich ändern: Auswahl statt nur Anzeige (gilt dann als „von Hand“)
        h("select", { class: "cat", "aria-label": `${l.word}: ${t.category}`, onchange: async (e) => {
          try { await this._call("set_category", { name: l.word, category: e.target.value }, false); l.category = e.target.value; l.manual = true;
            l.label = ((this._cfg && this._cfg.categories) || []).find((c) => c.id === e.target.value)?.label || l.label; draw(); this._load(); }
          catch (err) { /* */ }
        } }, ((this._cfg && this._cfg.categories) || []).map((c) => h("option", { value: c.id, selected: c.id === l.category }, c.label))),
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
        this._setRow(t.barcode_lookup, this._switch(cur.barcode_lookup !== false, async (on) => {
          try { await this._call("set_automation", { settings: { ...cur, barcode_lookup: on } }, false); cur.barcode_lookup = on; status.textContent = "✓ " + t.saved; }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        }, t.barcode_lookup), t.barcode_lookup_help),
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

  _settingsBtn(scope, icon, label) {
    const open = this._showSettings && this._settingsScope === scope;
    return iconBtn(open ? ICON.close : icon, label, () => {
      this._showSettings = !open;
      this._settingsScope = scope;
      this._showImport = false;
      this._renderImport(); this._renderSettings(); this._render();
    });
  }

  async _renderSettings() {
    const el = this._settingsEl;
    if (!this._showSettings || !this._cfg) return fill(el);
    const t = this._t;
    // settings_scope: "list" (Karten auf der Seite) = nur „Diese Liste“; "global" (⚙ der Seite) = Für mich + Haushalt
    const scope = ["global", "list", "stats"].includes(this._config.settings_scope)
      ? this._config.settings_scope : this._settingsScope || "global";
    const allowed = scope === "list" ? ["list"] : scope === "stats" ? ["stats"] : ["me", "house", "stats"];
    const tab = allowed.includes(this._setTab) ? this._setTab : allowed[0];
    const tabBtn = (id, label, extra) => h("button", { type: "button", role: "tab", class: tab === id ? "on" : "", "aria-selected": String(tab === id),
      onclick: () => { this._setTab = id; this._renderSettings(); } }, label, extra);
    const pane = tab === "house" ? this._paneHouse() : tab === "list" ? this._paneList() : tab === "stats" ? this._paneStats() : this._paneMe();
    fill(el, h("div", { class: "sl-settings" },
      allowed.length > 1 ? h("div", { class: "tabs2", role: "tablist" },
        allowed.includes("me") ? tabBtn("me", t.tab_me) : null,
        allowed.includes("house") ? tabBtn("house", t.tab_house, h("span", { class: "tag" }, t.admin)) : null,
        allowed.includes("stats") ? tabBtn("stats", t.tab_stats) : null,
        allowed.includes("list") ? tabBtn("list", t.tab_list) : null) : null,
      pane,
      scope === "list" ? h("p", { class: "shelp", style: "padding:0 4px" }, this._config.settings_scope === "list" ? t.list_settings_hint : t.list_settings_hint_card) : null,
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
      section("input", "mdi:plus-box-outline", [b("show_add"), b("show_frequent"), b("show_templates"), b("show_scan")]),
      section("list", "mdi:format-list-bulleted",
        [b("drag_drop"), b("show_stepper"), b("show_offer"), b("show_prices"), b("show_tags"), b("show_source"), b("show_note"), b("show_category_titles")]),
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
  .chips { flex-direction:column; gap:6px; overflow:visible; }
  .cgroup { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .cgroup .glabel { flex:0 0 100%; font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--secondary-text-color); margin-top:4px; }
  .chip.pending { border-style:dashed; color:var(--secondary-text-color); }
  .chip.toggle { background:none; color:var(--primary-color); border-color:transparent; font-weight:500; }
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
    // listsOpen: Listen-Übersicht oben aufgeklappt (Standard: zu – mehr Platz für die Listen, v. a. am Handy)
    this._prefs = { columns: false, wide: false, selected: legacy ? [legacy] : [], order: [], listsOpen: false, ...prefs };
    // Einstellungen (z.B. Notizen ein/aus) ändern, welche Listen erscheinen
    window.addEventListener("smartlists-lists-changed", () => { this._visibleKey = null; this._render(); });
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._liveSub && hass.connection) {
      // neue/verbundene Listen, App-Listen, Notizen ein/aus → Auswahl oben ohne Neuladen aktualisieren
      this._liveSub = hass.connection.subscribeMessage(() => { this._visibleKey = null; this._render(); }, { type: "smartlists/subscribe" })
        .catch(() => null);
    }
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
    // kombinierte Listen aus der App, die noch nicht in HA verbunden sind (Chip „verbinden“)
    this._hass.callWS({ type: "smartlists/app_lists" }).then((r) => { this._appLists = r.lists.filter((l) => !l.connected); this._render(); })
      .catch(() => { this._appLists = []; });
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
        onclick: () => { this._settingsOpen = this._settingsOpen === "global" ? false : "global"; this._render(); } }, svg(ICON.gear, 22));
      this._statsBtn = h("button", { type: "button", title: t.stats, "aria-label": t.stats,
        onclick: () => { this._settingsOpen = this._settingsOpen === "stats" ? false : "stats"; this._render(); } }, svg(ICON.chart, 22));
      this._root = h("div", {}, h("div", { class: "toolbar" }, this._menuBtn, h("span", { class: "title" }, "SmartLists"), this._newBtn, this._orderBtn, this._colBtn, this._wideBtn, this._statsBtn, this._gearBtn),
        this._chipsEl, this._hintEl, this._contentEl);
      this.shadowRoot.replaceChildren(h("style", {}, PANEL_STYLE), this._root);
    }
    this._menuBtn.hidden = !this._narrow;
    this._gearBtn.classList.toggle("on", this._settingsOpen === "global");
    this._gearBtn.setAttribute("aria-pressed", String(this._settingsOpen === "global"));
    this._statsBtn.classList.toggle("on", this._settingsOpen === "stats");
    [this._newBtn, this._orderBtn, this._colBtn, this._wideBtn].forEach((b) => { b.hidden = !!this._settingsOpen; });
    this._orderBtn.classList.toggle("on", !!this._ordering);
    this._orderBtn.setAttribute("aria-pressed", String(!!this._ordering));
    if (this._settingsOpen) {
      // Globale Einstellungen (Für mich / Haushalt). Was nur eine Liste betrifft, steht im Zahnrad der Karte.
      if (!lists.some((l) => l.e === this._settingsEntity)) this._settingsEntity = sel[0] || (lists[0] && lists[0].e);
      const entity = this._settingsEntity;
      if (!entity) { fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty)); return; }
      const scope = this._settingsOpen === "stats" ? "stats" : "global";
      if (!this._settingsCard || this._settingsCard._config.entity !== entity || this._settingsCard._config.settings_scope !== scope) {
        const tab = this._settingsCard && this._settingsCard._setTab;
        this._settingsCard = document.createElement("smartlists-card");
        this._settingsCard.setConfig({ entity, settings_only: true, settings_scope: scope });
        if (tab) this._settingsCard._setTab = tab;
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
    // getrennt nach Art: Kombinierte Listen | Listen | Notizen (je Gruppe eigene Reihenfolge)
    const combined = lists.filter((l) => !l.notes && l.combined);
    const normal = lists.filter((l) => !l.notes && !l.combined);
    const notes = lists.filter((l) => l.notes);
    const pending = (this._appLists || []);
    const group = (label, items, extra) => (items.length || (extra && extra.length) ? h("div", { class: "cgroup" },
      h("span", { class: "glabel" }, label), items.map((l, i) => chip(l, i, items)), extra) : null);
    const pendingChips = pending.map((a) => h("button", { type: "button", class: "chip pending", title: this._t.app_list_pending,
      onclick: async () => {
        if (!(this._hass.user && this._hass.user.is_admin)) { await slDialog(this.shadowRoot, { title: a.name, text: this._t.app_list_admin, ok: "OK", cancel: this._t.cancel }); return; }
        if (!(await slDialog(this.shadowRoot, { title: a.name, text: `${this._t.app_list_pending}: ${a.sources.join(", ")}`, ok: this._t.app_list_connect, cancel: this._t.cancel }))) return;
        try { await this._hass.callWS({ type: "smartlists/connect_app_list", device_id: a.device_id, list_id: a.id }); this._visibleKey = null; this._pendingSelect = a.name; }
        catch (err) { await slDialog(this.shadowRoot, { title: this._t.error, text: (err && err.message) || this._t.error, ok: "OK", cancel: this._t.cancel }); }
      } }, "📱 ", a.name, h("span", { class: "n" }, "＋")));
    const newNotes = notes.length || (this._visible && [...this._visible.values()].includes("notes")) ? h("button", { type: "button", class: "chip pending", title: this._t.notes_create, onclick: async () => {
      const name = await slDialog(this.shadowRoot, { title: this._t.notes_create, text: this._t.notes_create_help, input: true, value: (this._hass.user && this._hass.user.name) || "", ok: this._t.create, cancel: this._t.cancel });
      if (!name) return;
      try { await this._hass.callWS({ type: "smartlists/create_notes", name }); this._visibleKey = null; }
      catch (err) { await slDialog(this.shadowRoot, { title: this._t.error, text: (err && err.message) || this._t.error, ok: "OK", cancel: this._t.cancel }); }
    } }, "＋ 📝") : null;
    // eingeklappt: eine Zeile mit den gewählten Listen und „Alle Listen ▾“; im Sortiermodus immer offen
    const open = this._prefs.listsOpen || this._ordering;
    const toggle = h("button", { type: "button", class: "chip toggle", "aria-expanded": String(open),
      onclick: () => { this._prefs.listsOpen = !this._prefs.listsOpen; this._save(); this._render(); } },
      open ? `▴ ${this._t.p_lists_less}` : `▾ ${this._t.p_lists_all} (${lists.length + pending.length})`);
    if (!open) {
      const chosen = lists.filter((l) => sel.includes(l.e));
      fill(this._chipsEl, h("div", { class: "cgroup collapsed" }, chosen.map((l, i) => chip(l, i, chosen)), toggle));
    } else {
      fill(this._chipsEl, group(this._t.p_group_combined, combined, pendingChips), group(this._t.p_group_lists, normal),
        group(this._t.p_group_notes, notes, newNotes ? [newNotes] : null), h("div", { class: "cgroup" }, toggle));
    }
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
        // Zahnrad je Karte = nur Einstellungen dieser Liste; Globales über ⚙ oben in der Werkzeugleiste
        c.setConfig({ entity: e, settings_scope: "list" });
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

