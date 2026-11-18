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
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z",
  clock: "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  list: "M3,4H7V8H3V4M9,5V7H21V5H9M3,10H7V14H3V10M9,11V13H21V11H9M3,16H7V20H3V16M9,17V19H21V17H9",
  template: "M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z",
  barcode: "M2,6H4V18H2V6M5,6H6V18H5V6M7,6H10V18H7V6M11,6H12V18H11V6M14,6H16V18H14V6M17,6H20V18H17V6M21,6H22V18H21V6Z",
  chart: "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",
  share: "M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z",
  dots: "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",
  calendar: "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z",
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
const CARD_VERSION = "4.0.0-beta.17";
// Fehlgeschlagene Server-Aufrufe, die die Oberfläche nicht aufhalten sollen: wenigstens in der Browser-Konsole zeigen
const slWarn = (what, err) => { try { console.warn(`SmartLists: ${what} failed –`, (err && err.message) || err); } catch (e) { /* */ } };
const SORT_MODES = ["category", "alpha", "added", "list"];
// Darstellung pro Karte (Lovelace-Editor). Persönliche Bedienung steht dagegen in UI_DEFAULTS.
const CARD_DEFAULTS = {
  sort: "category",
  show_header: true, show_count: true, show_search: true, show_sort: true, show_shopping: true,
  show_undo: true, show_import: true, show_settings: true,
  show_title: true, show_offer_hints: true, show_add: true, show_frequent: true, show_templates: true, show_scan: true, show_prices: true,
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
  shop_auto_store: true, shop_untagged: true, shop_finish: "shopping",
  scan_target: "", scan_mode: "input",
};
// Dienste zum Nachschlagen von Strichcodes (gleiche IDs wie barcode.py)
const BARCODE_PROVIDERS = [["off", "Open Food Facts"], ["obf", "Open Beauty Facts"], ["opff", "Open Pet Food Facts"],
  ["opf", "Open Products Facts"], ["upcitemdb", "UPCitemdb"], ["custom", null]];
// Notizlisten der App: keine Kategorien/Einkaufsfunktionen (nur wenn in der Karte nicht anders eingestellt)
const NOTES_DEFAULTS = { sort: "added", show_category_titles: false, show_frequent: false, show_shopping: false, show_stepper: false, show_import: false, show_filter_chips: false, show_sort: false };
// Erkennung wie notes.py (für Auswahlfelder, ohne Rückfrage bei der Integration)
// Name für die Chips der Seite: die Gruppe („Listen“, „Notizen“) steht schon darüber – „HA Smartlists“, „Liste“,
// „Notes“ usw. vorne weglassen („Liste Max“ → „Max“). Bleibt nichts übrig, der volle Name.
// „Lista zakupów“ / „Lista de la compra“ bleiben: weggelassen wird „Liste“ nur vor einem Namen (Großbuchstabe/Ziffer).
const chipName = (name) => {
  const s = String(name || "").trim();
  let r = s.replace(/^ha[ _]?smartlists[ _]+/i, "");
  const m = r.match(/^(list[ea]?|listy|notes?|notizen?|notatki)[ _]+(.+)$/i);
  if (m && /^[\p{Lu}\d]/u.test(m[2])) r = m[2];
  return r.trim() || s;
};
const isNotesEntity = (id, name) => /^todo\.(ha_smartlists_note|notiz_)/i.test(id) || /^ha smartlists notes/i.test(String(name || "").trim());
const UI_KEY = "smartlists-ui";
const LONG_PRESS_MS = 500;
