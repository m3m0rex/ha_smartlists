/* SmartDiscounts-Karte – Angebote der Supermärkte, abgeglichen mit deiner Einkaufsliste.
 *   type: custom:smartdiscounts-card
 *   list: todo.einkauf            # optional – jede To-do-Liste von Home Assistant
 *
 * Läuft OHNE SmartLists (eigenes Repository: ha_smartdiscounts-card) und wird zusätzlich mit SmartLists ausgeliefert.
 * Quellen: jeder Sensor mit einer Liste von Angeboten in einem Attribut ("discounts", "offers" …), z. B. die
 * Integrationen von FaserF (ha-rewe, ha-edeka, ha-lidl, ha-aldi, ha-norma) oder ein eigener REST-/Template-Sensor.
 * Feldnamen werden erkannt (product/title/name, price, picture_link/image_url, valid_until/end_date,
 * base_price/price_per_unit, category) und lassen sich je Quelle mit `map:` festlegen.
 * Keine externen Abhängigkeiten; nutzt die Theme-Variablen von Home Assistant. */
(() => {
const VERSION = "4.0.0-beta.3";
const TAG = "smartdiscounts-card";
if (customElements.get(TAG)) return;  // schon geladen (SmartLists UND eigenes Repository installiert)

const TEXTS = {
  de: { e_stores: "Nur diese Märkte (leer = alle)", e_cat_open: "Kategorien anfangs aufgeklappt", more_n: "+{n} mehr", on_n: "{n}× auf der Liste", dup_n: "„{name}“ steht {n}-mal auf der Liste", dup_merge: "Zusammenfassen", e_list_tab: "Reiter „Meine Liste“ anzeigen", e_cat_src: "Kategorien", cs_auto: "von SmartLists, sonst vom Markt", cs_store: "immer die des Markts",
    e_entities: "Nur diese Angebots-Sensoren (leer = alle erkannten)", e_group: "„Alle Angebote“ gruppieren nach", g_store: "Markt", g_cat: "Kategorie", other: "Sonstiges",
    tab_watch: "Merkliste", w_add: "Produkt merken, z. B. Kaffee", w_add_btn: "Merken", w_empty: "Noch nichts gemerkt. Trage Produkte ein, bei denen du auf ein Angebot wartest.", w_local: "Auf diesem Gerät gespeichert. Mit „watch_list“ (eine To-do-Liste) gilt die Merkliste auf allen Geräten.", w_fixed: "aus der Konfiguration", n_title: "Angebot für deine Merkliste", e_watch: "Merkliste: Produkte", e_watch_list: "Merkliste als To-do-Liste (gilt auf allen Geräten)", e_notify: "Benachrichtigen, wenn etwas von der Merkliste im Angebot ist", e_notify_service: "Zusätzlich an diesen Dienst senden (z. B. notify.mobile_app_…)", e_symbol: "Eigenes Währungssymbol (statt „currency“)",
    title: "Angebote", tab_list: "Meine Liste", tab_all: "Alle Angebote", search: "Angebote durchsuchen …", no_sources: "Keine Angebots-Sensoren gefunden. Installiere z. B. die REWE-, EDEKA- oder Lidl-Integration von FaserF oder trage unter „sources“ einen eigenen Sensor ein.",
    no_list: "Keine Liste gewählt – trage in der Karte unter „list“ eine To-do-Liste ein, um Angebote mit ihr abzugleichen.", list_empty: "Die Liste ist leer.", none: "kein Angebot", offers: "Angebote", offer1: "Angebot",
    on_offer: "{n} von {m} Artikeln im Angebot", cheapest: "Günstigste wählen", only: "nur {store}", chosen: "{n} gewählt", sum: "Summe", apply: "In Liste übernehmen", applied: "✓ übernommen", pick_hint: "Preis antippen, um ein Angebot zu wählen",
    until: "bis", today: "nur noch heute", expired: "abgelaufen", add: "Auf die Liste", added: "✓ auf der Liste", all: "alle", less: "weniger", on_list: "steht auf deiner Liste", best: "günstigster", item: "Artikel",
    no_hits: "Nichts gefunden.", exp_n: "Abgelaufene Angebote auf der Liste: {n}", exp_remove: "Entfernen", exp_later: "Später", all_cats: "Alle Kategorien", error: "Das hat nicht geklappt.", attached: "Angebot gewählt", stand: "Stand", in_offer: "im Angebot", without: "ohne Angebot",
    e_title: "Titel", e_list: "Einkaufsliste (To-do)", e_match: "Artikel passt zum Angebot, wenn", m_word: "ganzes Wort im Namen (Butter ≠ Butterkeks)", m_exact: "nur genau dieses Wort", m_part: "Teil des Namens",
    e_tab: "Start-Reiter", e_images: "Bilder", e_compact: "Kompakte Zeilen", e_unit: "Grundpreis (€/kg, €/l)", e_until: "Gültig bis", e_hide_none: "Artikel ohne Angebot ausblenden", e_max: "Angebote je Markt (Reiter „Alle“) – 0 = kein Limit", e_view: "Darstellung „Alle Angebote“", v_tiles: "Kacheln", v_list: "Liste mit kleinen Bildern", e_lview: "Darstellung „Meine Liste“", v_chips: "Preise nebeneinander", v_rows: "ein Angebot je Zeile",
    e_sources: "Quellen werden automatisch erkannt. Eigene Sensoren und Feld-Zuordnung: im Code-Editor unter „sources“ (siehe README)." },
  en: { e_stores: "Only these stores (empty = all)", e_cat_open: "Categories expanded at first", more_n: "+{n} more", on_n: "{n}× on the list", dup_n: "\"{name}\" is on the list {n} times", dup_merge: "Merge", e_list_tab: "Show the \"My list\" tab", e_cat_src: "Categories", cs_auto: "from SmartLists, otherwise from the store", cs_store: "always the store's own",
    e_entities: "Only these offer sensors (empty = all detected)", e_group: "Group \"All offers\" by", g_store: "Store", g_cat: "Category", other: "Other",
    tab_watch: "Watch list", w_add: "Watch a product, e.g. coffee", w_add_btn: "Watch", w_empty: "Nothing here yet. Enter products you are waiting to see on offer.", w_local: "Stored on this device. With \"watch_list\" (a to-do list) the watch list applies on all devices.", w_fixed: "from the configuration", n_title: "Offer for your watch list", e_watch: "Watch list: products", e_watch_list: "Watch list as a to-do list (applies on all devices)", e_notify: "Notify when something on the watch list is on offer", e_notify_service: "Also send to this service (e.g. notify.mobile_app_…)", e_symbol: "Own currency symbol (instead of \"currency\")",
    title: "Offers", tab_list: "My list", tab_all: "All offers", search: "Search offers …", no_sources: "No offer sensors found. Install e.g. FaserF's REWE, EDEKA or Lidl integration or add your own sensor under \"sources\".",
    no_list: "No list selected – set a to-do list under \"list\" to match offers against it.", list_empty: "The list is empty.", none: "no offer", offers: "offers", offer1: "offer",
    on_offer: "{n} of {m} items on offer", cheapest: "Pick cheapest", only: "only {store}", chosen: "{n} selected", sum: "Total", apply: "Apply to list", applied: "✓ applied", pick_hint: "Tap a price to pick an offer",
    until: "until", today: "today only", expired: "expired", add: "Add to list", added: "✓ on the list", all: "all", less: "less", on_list: "is on your list", best: "cheapest", item: "Item",
    no_hits: "Nothing found.", exp_n: "Expired offers on the list: {n}", exp_remove: "Remove", exp_later: "Later", all_cats: "All categories", error: "That did not work.", attached: "offer selected", stand: "as of", in_offer: "on offer", without: "no offer",
    e_title: "Title", e_list: "Shopping list (to-do)", e_match: "Item matches an offer if", m_word: "whole word in the name (butter ≠ butter biscuit)", m_exact: "exactly this word only", m_part: "part of the name",
    e_tab: "Start tab", e_images: "Images", e_compact: "Compact rows", e_unit: "Unit price (€/kg, €/l)", e_until: "Valid until", e_hide_none: "Hide items without an offer", e_max: "Offers per store (\"All\" tab) – 0 = no limit", e_view: "\"All offers\" layout", v_tiles: "Tiles", v_list: "List with small images", e_lview: "\"My list\" layout", v_chips: "Prices side by side", v_rows: "One offer per row",
    e_sources: "Sources are detected automatically. Own sensors and field mapping: in the code editor under \"sources\" (see README)." },
  fr: { e_stores: "Seulement ces magasins (vide = tous)", e_cat_open: "Catégories dépliées au départ", more_n: "+{n} de plus", on_n: "{n}× dans la liste", dup_n: "« {name} » est {n} fois dans la liste", dup_merge: "Regrouper", e_list_tab: "Afficher l'onglet « Ma liste »", e_cat_src: "Catégories", cs_auto: "de SmartLists, sinon du magasin", cs_store: "toujours celles du magasin",
    e_entities: "Seulement ces capteurs de promos (vide = tous)", e_group: "Regrouper « Toutes les promos » par", g_store: "Magasin", g_cat: "Catégorie", other: "Autres",
    tab_watch: "À surveiller", w_add: "Surveiller un produit, p. ex. café", w_add_btn: "Surveiller", w_empty: "Rien pour l'instant. Saisis les produits dont tu attends une promo.", w_local: "Enregistré sur cet appareil. Avec « watch_list » (une liste de tâches), la liste vaut sur tous les appareils.", w_fixed: "depuis la configuration", n_title: "Promo pour ta liste à surveiller", e_watch: "À surveiller : produits", e_watch_list: "Liste à surveiller comme liste de tâches (tous les appareils)", e_notify: "Notifier quand un produit surveillé est en promo", e_notify_service: "Envoyer aussi à ce service (p. ex. notify.mobile_app_…)", e_symbol: "Symbole monétaire personnalisé (au lieu de « currency »)",
    title: "Promos", tab_list: "Ma liste", tab_all: "Toutes les promos", search: "Rechercher des promos …", no_sources: "Aucun capteur de promos trouvé. Installe p. ex. l'intégration REWE, EDEKA ou Lidl de FaserF ou ajoute ton propre capteur sous « sources ».", no_list: "Aucune liste choisie – indique une liste de tâches sous « list » pour la comparer aux promos.", list_empty: "La liste est vide.", none: "pas de promo", offers: "promos", offer1: "promo", on_offer: "{n} articles sur {m} en promo", cheapest: "Choisir les moins chères", only: "seulement {store}", chosen: "{n} choisies", sum: "Total", apply: "Reporter dans la liste", applied: "✓ reporté", pick_hint: "Touche un prix pour choisir une promo", until: "jusqu'au", today: "aujourd'hui seulement", expired: "expirée", add: "Ajouter à la liste", added: "✓ dans la liste", all: "toutes", less: "moins", on_list: "est sur ta liste", best: "la moins chère", item: "Article", no_hits: "Rien trouvé.", exp_n: "Promos expirées dans la liste : {n}", exp_remove: "Retirer", exp_later: "Plus tard", all_cats: "Toutes les catégories", error: "Cela n'a pas fonctionné.", attached: "promo choisie", stand: "état au", in_offer: "en promo", without: "sans promo", e_title: "Titre", e_list: "Liste de courses (tâches)", e_match: "Un article correspond à une promo si", m_word: "mot entier dans le nom (beurre ≠ biscuit au beurre)", m_exact: "exactement ce mot", m_part: "partie du nom", e_tab: "Onglet de départ", e_images: "Images", e_compact: "Lignes compactes", e_unit: "Prix à l'unité (€/kg, €/l)", e_until: "Valable jusqu'au", e_hide_none: "Masquer les articles sans promo", e_max: "Promos par magasin (onglet « Toutes ») – 0 = sans limite", e_view: "Affichage « Toutes les promos »", v_tiles: "Tuiles", v_list: "Liste avec petites images", e_lview: "Affichage « Ma liste »", v_chips: "Prix côte à côte", v_rows: "une promo par ligne", e_sources: "Les sources sont détectées automatiquement. Capteurs personnels et correspondance des champs : dans l'éditeur de code sous « sources » (voir README)." },
  es: { e_stores: "Solo estas tiendas (vacío = todas)", e_cat_open: "Categorías desplegadas al inicio", more_n: "+{n} más", on_n: "{n}× en la lista", dup_n: "«{name}» está {n} veces en la lista", dup_merge: "Unir", e_list_tab: "Mostrar la pestaña «Mi lista»", e_cat_src: "Categorías", cs_auto: "de SmartLists, si no de la tienda", cs_store: "siempre las de la tienda",
    e_entities: "Solo estos sensores de ofertas (vacío = todos)", e_group: "Agrupar «Todas las ofertas» por", g_store: "Tienda", g_cat: "Categoría", other: "Otros",
    tab_watch: "Seguimiento", w_add: "Seguir un producto, p. ej. café", w_add_btn: "Seguir", w_empty: "Aún no hay nada. Escribe los productos de los que esperas una oferta.", w_local: "Guardado en este dispositivo. Con «watch_list» (una lista de tareas) el seguimiento vale en todos los dispositivos.", w_fixed: "de la configuración", n_title: "Oferta para tu seguimiento", e_watch: "Seguimiento: productos", e_watch_list: "Seguimiento como lista de tareas (todos los dispositivos)", e_notify: "Avisar cuando algo en seguimiento esté en oferta", e_notify_service: "Enviar también a este servicio (p. ej. notify.mobile_app_…)", e_symbol: "Símbolo de moneda propio (en lugar de «currency»)",
    title: "Ofertas", tab_list: "Mi lista", tab_all: "Todas las ofertas", search: "Buscar ofertas …", no_sources: "No se encontraron sensores de ofertas. Instala p. ej. la integración de REWE, EDEKA o Lidl de FaserF o añade tu propio sensor en «sources».", no_list: "No hay lista elegida – indica una lista de tareas en «list» para compararla con las ofertas.", list_empty: "La lista está vacía.", none: "sin oferta", offers: "ofertas", offer1: "oferta", on_offer: "{n} de {m} artículos en oferta", cheapest: "Elegir las más baratas", only: "solo {store}", chosen: "{n} elegidas", sum: "Total", apply: "Pasar a la lista", applied: "✓ aplicado", pick_hint: "Toca un precio para elegir una oferta", until: "hasta el", today: "solo hoy", expired: "caducada", add: "A la lista", added: "✓ en la lista", all: "todas", less: "menos", on_list: "está en tu lista", best: "la más barata", item: "Artículo", no_hits: "No se encontró nada.", exp_n: "Ofertas caducadas en la lista: {n}", exp_remove: "Quitar", exp_later: "Más tarde", all_cats: "Todas las categorías", error: "No ha funcionado.", attached: "oferta elegida", stand: "actualizado", in_offer: "en oferta", without: "sin oferta", e_title: "Título", e_list: "Lista de la compra (tareas)", e_match: "Un artículo coincide con una oferta si", m_word: "palabra completa en el nombre (mantequilla ≠ galleta de mantequilla)", m_exact: "solo exactamente esta palabra", m_part: "parte del nombre", e_tab: "Pestaña inicial", e_images: "Imágenes", e_compact: "Filas compactas", e_unit: "Precio por unidad (€/kg, €/l)", e_until: "Válido hasta", e_hide_none: "Ocultar artículos sin oferta", e_max: "Ofertas por tienda (pestaña «Todas») – 0 = sin límite", e_view: "Vista de «Todas las ofertas»", v_tiles: "Mosaico", v_list: "Lista con imágenes pequeñas", e_lview: "Vista de «Mi lista»", v_chips: "Precios lado a lado", v_rows: "una oferta por fila", e_sources: "Las fuentes se detectan automáticamente. Sensores propios y asignación de campos: en el editor de código, en «sources» (ver README)." },
  it: { e_stores: "Solo questi negozi (vuoto = tutti)", e_cat_open: "Categorie aperte all'inizio", more_n: "+{n} altre", on_n: "{n}× in lista", dup_n: "«{name}» è {n} volte in lista", dup_merge: "Unisci", e_list_tab: "Mostra la scheda «La mia lista»", e_cat_src: "Categorie", cs_auto: "da SmartLists, altrimenti dal negozio", cs_store: "sempre quelle del negozio",
    e_entities: "Solo questi sensori di offerte (vuoto = tutti)", e_group: "Raggruppa «Tutte le offerte» per", g_store: "Negozio", g_cat: "Categoria", other: "Altro",
    tab_watch: "Da tenere d'occhio", w_add: "Tieni d'occhio un prodotto, ad es. caffè", w_add_btn: "Aggiungi", w_empty: "Ancora niente. Inserisci i prodotti di cui aspetti un'offerta.", w_local: "Salvato su questo dispositivo. Con «watch_list» (una lista di cose da fare) vale su tutti i dispositivi.", w_fixed: "dalla configurazione", n_title: "Offerta per i prodotti che segui", e_watch: "Da tenere d'occhio: prodotti", e_watch_list: "Elenco come lista di cose da fare (tutti i dispositivi)", e_notify: "Avvisa quando un prodotto seguito è in offerta", e_notify_service: "Invia anche a questo servizio (ad es. notify.mobile_app_…)", e_symbol: "Simbolo di valuta personalizzato (al posto di «currency»)",
    title: "Offerte", tab_list: "La mia lista", tab_all: "Tutte le offerte", search: "Cerca offerte …", no_sources: "Nessun sensore di offerte trovato. Installa ad es. l'integrazione REWE, EDEKA o Lidl di FaserF oppure aggiungi un tuo sensore in «sources».", no_list: "Nessuna lista scelta – indica una lista di cose da fare in «list» per confrontarla con le offerte.", list_empty: "La lista è vuota.", none: "nessuna offerta", offers: "offerte", offer1: "offerta", on_offer: "{n} articoli su {m} in offerta", cheapest: "Scegli le più convenienti", only: "solo {store}", chosen: "{n} scelte", sum: "Totale", apply: "Riporta nella lista", applied: "✓ riportato", pick_hint: "Tocca un prezzo per scegliere un'offerta", until: "fino al", today: "solo oggi", expired: "scaduta", add: "Aggiungi alla lista", added: "✓ in lista", all: "tutte", less: "meno", on_list: "è nella tua lista", best: "la più conveniente", item: "Articolo", no_hits: "Nessun risultato.", exp_n: "Offerte scadute nella lista: {n}", exp_remove: "Rimuovi", exp_later: "Più tardi", all_cats: "Tutte le categorie", error: "Non ha funzionato.", attached: "offerta scelta", stand: "aggiornato al", in_offer: "in offerta", without: "senza offerta", e_title: "Titolo", e_list: "Lista della spesa (cose da fare)", e_match: "Un articolo corrisponde a un'offerta se", m_word: "parola intera nel nome (burro ≠ biscotto al burro)", m_exact: "solo esattamente questa parola", m_part: "parte del nome", e_tab: "Scheda iniziale", e_images: "Immagini", e_compact: "Righe compatte", e_unit: "Prezzo unitario (€/kg, €/l)", e_until: "Valida fino al", e_hide_none: "Nascondi gli articoli senza offerta", e_max: "Offerte per negozio (scheda «Tutte») – 0 = nessun limite", e_view: "Vista «Tutte le offerte»", v_tiles: "Riquadri", v_list: "Elenco con piccole immagini", e_lview: "Vista «La mia lista»", v_chips: "Prezzi affiancati", v_rows: "un'offerta per riga", e_sources: "Le fonti vengono riconosciute automaticamente. Sensori propri e mappatura dei campi: nell'editor di codice in «sources» (vedi README)." },
  pl: { e_stores: "Tylko te sklepy (puste = wszystkie)", e_cat_open: "Kategorie początkowo rozwinięte", more_n: "+{n} więcej", on_n: "{n}× na liście", dup_n: "„{name}” jest na liście {n} razy", dup_merge: "Połącz", e_list_tab: "Pokaż zakładkę „Moja lista”", e_cat_src: "Kategorie", cs_auto: "z SmartLists, w innym razie ze sklepu", cs_store: "zawsze ze sklepu",
    e_entities: "Tylko te sensory promocji (puste = wszystkie)", e_group: "Grupuj „Wszystkie promocje” według", g_store: "Sklep", g_cat: "Kategoria", other: "Inne",
    tab_watch: "Obserwowane", w_add: "Obserwuj produkt, np. kawa", w_add_btn: "Obserwuj", w_empty: "Jeszcze nic. Wpisz produkty, na których promocję czekasz.", w_local: "Zapisane na tym urządzeniu. Z „watch_list” (lista zadań) obserwowane działają na wszystkich urządzeniach.", w_fixed: "z konfiguracji", n_title: "Promocja dla obserwowanych", e_watch: "Obserwowane: produkty", e_watch_list: "Obserwowane jako lista zadań (wszystkie urządzenia)", e_notify: "Powiadom, gdy obserwowany produkt jest w promocji", e_notify_service: "Wyślij też do tej usługi (np. notify.mobile_app_…)", e_symbol: "Własny symbol waluty (zamiast „currency”)",
    title: "Promocje", tab_list: "Moja lista", tab_all: "Wszystkie promocje", search: "Szukaj promocji …", no_sources: "Nie znaleziono sensorów promocji. Zainstaluj np. integrację REWE, EDEKA lub Lidl od FaserF albo dodaj własny sensor w „sources”.", no_list: "Nie wybrano listy – wpisz listę zadań w „list”, aby porównać ją z promocjami.", list_empty: "Lista jest pusta.", none: "brak promocji", offers: "promocji", offer1: "promocja", on_offer: "{n} z {m} produktów w promocji", cheapest: "Wybierz najtańsze", only: "tylko {store}", chosen: "wybrano: {n}", sum: "Suma", apply: "Przenieś na listę", applied: "✓ przeniesiono", pick_hint: "Dotknij ceny, aby wybrać promocję", until: "do", today: "tylko dziś", expired: "wygasła", add: "Na listę", added: "✓ na liście", all: "wszystkie", less: "mniej", on_list: "jest na twojej liście", best: "najtańsza", item: "Produkt", no_hits: "Nic nie znaleziono.", exp_n: "Wygasłe promocje na liście: {n}", exp_remove: "Usuń", exp_later: "Później", all_cats: "Wszystkie kategorie", error: "Nie udało się.", attached: "wybrano promocję", stand: "stan na", in_offer: "w promocji", without: "bez promocji", e_title: "Tytuł", e_list: "Lista zakupów (zadania)", e_match: "Produkt pasuje do promocji, gdy", m_word: "całe słowo w nazwie (masło ≠ ciastko maślane)", m_exact: "tylko dokładnie to słowo", m_part: "część nazwy", e_tab: "Zakładka startowa", e_images: "Zdjęcia", e_compact: "Zwarte wiersze", e_unit: "Cena jednostkowa (€/kg, €/l)", e_until: "Ważne do", e_hide_none: "Ukryj produkty bez promocji", e_max: "Promocji na sklep (zakładka „Wszystkie”) – 0 = bez limitu", e_view: "Widok „Wszystkie promocje”", v_tiles: "Kafelki", v_list: "Lista z małymi zdjęciami", e_lview: "Widok „Moja lista”", v_chips: "Ceny obok siebie", v_rows: "jedna promocja w wierszu", e_sources: "Źródła są wykrywane automatycznie. Własne sensory i mapowanie pól: w edytorze kodu w „sources” (zob. README)." },
};
const DEFAULTS = { list: "", match: "word", default_tab: "list", show_images: true, compact: false, show_unit_price: true, show_valid_until: true, hide_without_offer: false, max_per_store: 12, all_view: "tiles", list_view: "chips", sources: "auto", group_by: "store", show_list_tab: true, category_source: "auto", categories_open: true, watch: [], watch_list: "", notify: false, notify_service: "" };
// bekannte Märkte: Erkennung über entity_id / Namen der Quelle, Farbe des Badges
const STORES = [["rewe", "REWE", "#cc071e"], ["edeka", "EDEKA", "#f5c400"], ["lidl", "Lidl", "#0050aa"], ["aldi_sued", "ALDI Süd", "#00a0e0"], ["aldi_nord", "ALDI Nord", "#1a4d9f"], ["aldi", "ALDI", "#00549f"],
  ["norma", "Norma", "#d40f14"], ["penny", "Penny", "#cd1414"], ["kaufland", "Kaufland", "#e10915"], ["netto", "Netto", "#ffd400"], ["rossmann", "Rossmann", "#c3002d"], ["dm", "dm", "#002878"], ["globus", "Globus", "#f39200"]];
// Feldnamen der Angebote: der erste vorhandene zählt (je Quelle mit `map:` überschreibbar)
const FIELDS = { name: ["product", "title", "name", "product_name", "description"], price: ["price", "new_price", "discount_price", "offer_price", "sale_price", "price_euro", "current_price"],
  old_price: ["old_price", "regular_price", "original_price", "was_price", "oldPrice", "base_price_old"], image: ["picture_link", "image_url", "image", "picture", "img", "thumbnail"],
  until: ["valid_until", "end_date", "valid_to", "until", "valid_through", "validTo"], unit: ["price_per_unit", "base_price", "unit_price", "grundpreis"], category: ["category", "categories", "group"], discount: ["discount", "discount_percent", "savings"], brand: ["brand", "manufacturer"], store: ["store", "market", "retailer", "advertiser"] };
const LIST_ATTRS = ["discounts", "offers", "deals", "items", "results", "products"];

const h = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "style") e.style.cssText = v; else e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids.flat(9).filter((x) => x != null && x !== false));
  return e;
};
const get = (obj, path) => String(path).split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
// „11,49 €“, „€ 10.98“, 5.49 → Zahl
const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const m = String(v ?? "").replace(/ /g, " ").match(/\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : null;
};
// Grundpreis aus „je 250-g-Pckg. (1 kg = 5,16 €)“ bzw. „1 kg = ab € 3.85“ → { value, unit }
const unitPrice = (text) => {
  const m = String(text || "").replace(/ /g, " ").match(/1\s*(kg|l|ltr|liter|stk|st|stück|m)\s*=\s*(?:ab\s*)?(?:€\s*)?(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const u = m[1].toLowerCase();
  return { value: parseFloat(m[2].replace(",", ".")), unit: /^l/.test(u) ? "l" : /^st/.test(u) ? "Stk" : u };
};
const stem = (w) => (w.length >= 5 ? w.replace(/(en|er|n|e|s)$/, "") : w);
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
// Artikeltext der Liste → Suchbegriff: Mengen, Einheiten und Badges (@Markt #Tag *Person) weg
const UNIT_RE = /^(\d+([.,]\d+)?)?(x|kg|g|gr|mg|l|ml|cl|stk|st|pck|pkg|dose|dosen|flasche|flaschen|kasten|kiste|becher|glas|bund|netz|beutel|packung|packungen)$/;
const itemName = (text) => String(text || "").split(/\s+/).filter((w) => w && !/^[@#*!+~]/.test(w) && !/^\d+([.,]\d+)?[x×]?$/i.test(w) && !UNIT_RE.test(norm(w))).join(" ").trim();
const matches = (name, title, mode) => {
  const want = words(name);
  if (!want.length) return false;
  if (mode === "part") return want.every((w) => norm(title).includes(w));
  const have = words(title), hs = have.map(stem);
  return want.every((w) => { const s = stem(w); return hs.includes(s) || (mode !== "exact" && w.length >= 4 && have.some((x) => x.length > w.length && (x.endsWith(w) || stem(x).endsWith(s)))); });
};

function sourcesOf(hass, cfg) {
  const st = hass.states;
  const explicit = Array.isArray(cfg) ? cfg.filter((s) => s && s !== "auto").map((s) => (typeof s === "string" ? { entity: s } : s)) : [];
  const out = [...explicit];
  if (cfg === "auto" || !Array.isArray(cfg) || cfg.includes("auto")) {
    for (const id of Object.keys(st)) {
      if (!id.startsWith("sensor.") || out.some((s) => s.entity === id)) continue;
      const attr = LIST_ATTRS.find((a) => Array.isArray(st[id].attributes[a]) && st[id].attributes[a].length && typeof st[id].attributes[a][0] === "object"
        && FIELDS.name.some((f) => f in st[id].attributes[a][0]) && FIELDS.price.some((f) => f in st[id].attributes[a][0]));
      if (attr) out.push({ entity: id, attribute: attr });
    }
  }
  return out.filter((s) => st[s.entity]);
}
function storeOf(src, state) {
  const hay = norm(`${src.entity} ${state.attributes.friendly_name || ""}`).replace(/[^a-z0-9]+/g, "_");
  const known = STORES.find(([key]) => hay.includes(key));
  const label = src.store || (known && known[1]) || String(state.attributes.friendly_name || src.entity).replace(/\s*(offers?|angebote|discounts?)\s*$/i, "");
  const k2 = STORES.find(([, l]) => norm(l) === norm(label));
  return { label, color: src.color || (k2 && k2[2]) || (known && known[2]) || "#6b7280" };
}
// alle Angebote aller Quellen, vereinheitlicht
function collectOffers(hass, cfg) {
  const out = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const src of sourcesOf(hass, cfg)) {
    const state = hass.states[src.entity];
    const attr = src.attribute || LIST_ATTRS.find((a) => Array.isArray(state.attributes[a]));
    const rows = get(state.attributes, attr);
    if (!Array.isArray(rows)) continue;
    const store = storeOf(src, state);
    const pick = (o, f) => { const key = (src.map && src.map[f]) || FIELDS[f].find((k) => o[k] != null && o[k] !== ""); return key ? get(o, key) : null; };
    rows.forEach((o, i) => {
      if (!o || typeof o !== "object") return;
      const name = pick(o, "name"), price = num(pick(o, "price"));
      if (!name || price == null) return;
      const unitText = pick(o, "unit"), until = pick(o, "until") ? String(pick(o, "until")).slice(0, 10) : null;
      if (until && /^\d{4}-\d\d-\d\d$/.test(until) && until < today) return;  // abgelaufen
      const st = pick(o, "store");
      const cat = pick(o, "category"), old = num(pick(o, "old_price"));
      // Rabatt: Angabe der Quelle („-44%“) oder aus altem und neuem Preis berechnet
      const dm = String(pick(o, "discount") || "").match(/-?\s*(\d{1,2})\s*%/);
      const pct = dm ? +dm[1] : old && old > price ? Math.round((1 - price / old) * 100) : null;
      out.push({ id: `${src.entity}#${i}`, name: String(name), price, old: old && old > price ? old : null, pct, brand: pick(o, "brand") || "", image: pick(o, "image"), until, today: until === today,
        unitText: unitText ? String(unitText).replace(/ /g, " ") : "", unit: unitPrice(unitText), category: Array.isArray(cat) ? cat[0] : cat || "",
        store: st ? String(st) : store.label, color: store.color, entity: src.entity });
    });
  }
  return out;
}
// günstiger: nach Grundpreis, wenn beide denselben haben – sonst nach Preis
const cheaper = (a, b) => (a.unit && b.unit && a.unit.unit === b.unit.unit ? a.unit.value - b.unit.value || a.price - b.price : a.price - b.price);
// passende Angebote für einen Artikelnamen: je Markt das günstigste, günstigstes zuerst
function dealsFor(offers, name, mode = "word") {
  const byStore = new Map();
  for (const o of offers) {
    if (!matches(name, o.name, mode)) continue;
    const cur = byStore.get(o.store);
    if (!cur || cheaper(o, cur) < 0) byStore.set(o.store, o);
  }
  return [...byStore.values()].sort(cheaper);
}

const STYLE = `
  :host { display:block; --sd-accent: var(--smartdiscounts-accent, var(--primary-color)); --sd-q: var(--smartlists-qty-color, #e39a1c); --sd-ok: var(--success-color, #43a047); }
  ha-card { display:block; padding:14px 12px 12px; border-radius: var(--ha-card-border-radius, 12px); }
  .wrap { container-type:inline-size; }
  [hidden] { display:none !important; }
  .head { display:flex; align-items:center; gap:8px; padding:0 4px 6px; }
  .head h1 { margin:0; font-size:1.25rem; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .head small { color:var(--secondary-text-color); font-size:.78rem; white-space:nowrap; }
  .tabs { display:flex; border-bottom:1px solid var(--divider-color,#ddd); margin-bottom:10px; }
  .tabs button { flex:1; background:none; border:0; border-bottom:2px solid transparent; color:var(--secondary-text-color); font:inherit; font-size:.9rem; padding:8px 4px; cursor:pointer; }
  .tabs button.on { color:var(--sd-accent); border-color:var(--sd-accent); font-weight:600; }
  .msg { padding:18px 10px; text-align:center; color:var(--secondary-text-color); font-size:.9rem; }
  .plan { border-radius:12px; padding:10px 12px; background:color-mix(in srgb, var(--sd-ok) 12%, transparent); border:1px solid color-mix(in srgb, var(--sd-ok) 35%, transparent); }
  .plan b { font-size:.95rem; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .chip { border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff); color:var(--primary-text-color); border-radius:14px; padding:3px 10px; font:inherit; font-size:.8rem; cursor:pointer; display:inline-flex; gap:6px; align-items:center; }
  .chip.on { border-color:var(--sd-ok); color:var(--sd-ok); font-weight:600; }
  .dot { width:9px; height:9px; border-radius:50%; flex:none; }
  .store { font-size:.68rem; font-weight:800; padding:0 6px; border-radius:4px; color:#fff; white-space:nowrap; }
  .it { padding:9px 2px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .it:last-child { border-bottom:0; }
  .compact .it { padding:5px 2px; }
  .it .top { display:flex; align-items:center; gap:8px; }
  .thumb { width:40px; height:40px; border-radius:10px; background:var(--secondary-background-color,#f2f2f2) center/contain no-repeat; flex:none; display:grid; place-items:center; font-size:1.1rem; }
  .compact .thumb { width:28px; height:28px; border-radius:7px; }
  .it .n { flex:1; min-width:0; font-weight:500; overflow-wrap:anywhere; }
  .it .n small { display:block; color:var(--secondary-text-color); font-weight:400; font-size:.76rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .it .st { color:var(--secondary-text-color); font-size:.76rem; white-space:nowrap; }
  .it .st.ok { color:var(--sd-ok); font-weight:700; }
  .prices { display:flex; gap:6px; overflow-x:auto; padding:7px 0 1px; scrollbar-width:none; margin-left:48px; }
  .compact .prices { margin-left:36px; padding-top:4px; } .noimg .prices { margin-left:0; }
  .pc { flex:none; border:1px solid var(--divider-color,#ddd); background:var(--secondary-background-color,#f6f6f6); border-radius:10px; padding:4px 9px; cursor:pointer; text-align:left; font:inherit; color:var(--primary-text-color); min-width:84px; max-width:170px; }
  .pc .s { font-size:.66rem; font-weight:800; display:flex; gap:4px; align-items:center; }
  .pc b { font-size:.95rem; font-variant-numeric:tabular-nums; } .pc s { color:var(--secondary-text-color); font-size:.7rem; margin-left:4px; }
  .pc .x { color:var(--secondary-text-color); font-size:.68rem; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pc.best { border-color:var(--sd-ok); background:color-mix(in srgb, var(--sd-ok) 12%, transparent); }
  .pc.sel { border-color:var(--sd-accent); box-shadow:0 0 0 1px var(--sd-accent) inset; }
  .pc .star { color:var(--sd-ok); margin-left:auto; }
  .pc .pct { color:var(--error-color,#db4437); font-weight:800; }
  .tl .pctb { position:absolute; left:6px; top:6px; background:var(--error-color,#db4437); color:#fff; font-size:.66rem; font-weight:800; padding:0 5px; border-radius:7px; z-index:1; }
  .sum { margin-top:10px; padding:10px 12px; background:var(--secondary-background-color,#f6f6f6); border-radius:12px; display:flex; align-items:center; gap:10px; font-size:.86rem; flex-wrap:wrap; }
  .sum small { display:block; color:var(--secondary-text-color); font-size:.76rem; } .sum .sp { flex:1; }
  .btn { border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff); color:var(--sd-accent); border-radius:9px; padding:6px 12px; font:inherit; font-size:.82rem; cursor:pointer; white-space:nowrap; }
  .btn.pri { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--text-primary-color,#fff); font-weight:600; }
  .btn.done { color:var(--sd-ok); border-color:color-mix(in srgb, var(--sd-ok) 50%, transparent); }
  input.search, select.cat { width:100%; box-sizing:border-box; height:40px; border-radius:10px; border:1px solid transparent; background:var(--secondary-background-color,#f2f2f2); color:var(--primary-text-color); padding:0 12px; font:inherit; }
  .filters { display:flex; gap:8px; flex-wrap:wrap; }
  .filters.one { flex-wrap:nowrap; align-items:center; margin-bottom:6px; } .filters.one .search { flex:1 1 0 !important; min-width:0; }
  .filters .search { flex:1 1 180px; width:auto; } .filters .cat { flex:1 1 140px; width:auto; max-width:220px; }
  .vbtn { width:40px; height:40px; padding:0; font-size:1.1rem; flex:none; color:var(--primary-text-color); }
  @container (max-width: 480px) { .filters .search { flex-basis:100%; } .filters .cat { max-width:none; flex:1 1 0; } }
  .lrow { display:flex; align-items:center; gap:10px; padding:7px 2px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow:last-child { border-bottom:0; }
  .lrow .n { flex:1; min-width:0; font-size:.9rem; overflow-wrap:anywhere; }
  .lrow .n small { display:block; color:var(--secondary-text-color); font-size:.74rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lrow .pr { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .lrow .pr b { display:block; } .lrow .pr s { color:var(--secondary-text-color); font-size:.72rem; }
  .lrow .pr .pct { color:var(--error-color,#db4437); font-weight:800; font-size:.72rem; margin-left:4px; }
  .lrow .plus { width:34px; height:34px; padding:0; font-size:1.1rem; flex:none; }
  .compact .lrow { padding:4px 2px; }
  .expbox { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; padding:9px 12px; border-radius:12px; font-size:.86rem;
    background:color-mix(in srgb, var(--warning-color,#ff9800) 14%, transparent); border:1px solid color-mix(in srgb, var(--warning-color,#ff9800) 40%, transparent); }
  .expbox small { color:var(--secondary-text-color); } .expbox .sp { flex:1; }
  .plan .ph { display:flex; align-items:center; gap:8px; } .plan .ph b { flex:1; }
  .vbtn.sm { width:32px; height:32px; font-size:.95rem; }
  .orows { display:flex; flex-direction:column; gap:4px; margin-top:6px; }
  .orow { display:flex; align-items:center; gap:10px; width:100%; text-align:left; font:inherit; color:var(--primary-text-color); cursor:pointer; padding:6px 8px; box-sizing:border-box;
    border:1px solid var(--divider-color,#ddd); border-radius:10px; background:var(--secondary-background-color,#f6f6f6); }
  .orow.best { border-color:color-mix(in srgb, var(--sd-ok) 60%, transparent); }
  .orow.sel { border-color:var(--sd-accent); box-shadow:0 0 0 1px var(--sd-accent) inset; }
  .orow .radio { width:18px; height:18px; border-radius:50%; border:2px solid var(--secondary-text-color); flex:none; display:grid; place-items:center; font-size:.7rem; color:var(--text-primary-color,#fff); box-sizing:border-box; }
  .orow .radio.on { background:var(--sd-accent); border-color:var(--sd-accent); }
  .thumb.sm { width:34px; height:34px; border-radius:8px; font-size:.9rem; }
  .orow .n { flex:1; min-width:0; font-size:.88rem; overflow-wrap:anywhere; }
  .orow .n small { display:block; color:var(--secondary-text-color); font-size:.72rem; margin-top:1px; }
  .orow .pr { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .orow .pr b { display:block; } .orow.best .pr b { color:var(--sd-ok); }
  .orow .pr s { color:var(--secondary-text-color); font-size:.72rem; } .orow .pr .pct { color:var(--error-color,#db4437); font-weight:800; font-size:.72rem; margin-left:4px; }
  .compact .orow { padding:3px 8px; }
  /* schon auf der Liste: Haken über dem (abgedunkelten) Bild */
  .tl .img, .lrow .thumb { position:relative; overflow:hidden; }
  .tl.got .img::before, .lrow.got .thumb::before { content:""; position:absolute; inset:0; background:rgba(20,60,25,.62); }
  .gotck { position:absolute; inset:0; margin:auto; width:34px; height:34px; border-radius:50%; background:#43a047; color:#fff; font-weight:800; font-size:1.2rem; display:grid; place-items:center; box-shadow:0 3px 10px rgba(0,0,0,.4); }
  .lrow .gotck { width:auto; height:auto; background:none; box-shadow:none; font-size:1.15rem; }
  .gotn { position:absolute; right:4px; bottom:4px; background:#0d2a12; color:#bff0c2; font-size:.68rem; font-weight:800; border-radius:999px; padding:0 6px; }
  .gott { color:#4caf50; font-weight:700; }
  .catbar { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 2px; }
  .catbar .chip small { color:var(--secondary-text-color); } .catbar .chip.more { border-style:dashed; color:var(--sd-accent); }
  .stepper { display:inline-flex; align-items:center; height:34px; border-radius:10px; border:1px solid color-mix(in srgb, #4caf50 55%, transparent); background:color-mix(in srgb, #4caf50 12%, transparent); flex:none; }
  .stepper button { background:none; border:0; color:#4caf50; font:inherit; font-size:1.1rem; width:30px; height:32px; cursor:pointer; } .stepper b { min-width:26px; text-align:center; font-size:.82rem; }
  .tl .stepper { align-self:flex-start; margin-top:4px; }
  .shelf.fold { border-top:1px solid var(--divider-color,#e0e0e0); } .shelf.fold:first-of-type { border-top:0; }
  .foldh { display:flex; align-items:center; gap:8px; width:100%; padding:11px 2px; border:0; background:none; color:inherit; font:inherit; font-size:.92rem; text-align:left; cursor:pointer; }
  .foldh small { color:var(--secondary-text-color); } .foldh .sp { flex:1; } .foldh .dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
  .foldh .chev { color:var(--secondary-text-color); transition:transform .15s; } .shelf.fold.open .chev { transform:rotate(90deg); }
  .shelf h4 { margin:12px 0 6px; font-size:.84rem; display:flex; gap:8px; align-items:center; font-weight:500; }
  .shelf h4 small { color:var(--secondary-text-color); } .shelf h4 .sp { flex:1; }
  .shelf h4 button { background:none; border:0; color:var(--sd-accent); font:inherit; font-size:.8rem; cursor:pointer; }
  .rail { display:flex; gap:8px; overflow-x:auto; scrollbar-width:thin; padding-bottom:4px; }
  .rail.open { display:grid; grid-template-columns:repeat(auto-fill, minmax(124px,1fr)); overflow:visible; }
  .tl { flex:none; width:124px; background:var(--secondary-background-color,#f6f6f6); border-radius:12px; padding:8px; position:relative; display:flex; flex-direction:column; gap:3px; box-sizing:border-box; }
  .rail.open .tl { width:auto; }
  .tl .img { height:64px; border-radius:8px; background:#fff center/contain no-repeat; }
  .tl .t { font-size:.76rem; line-height:1.25; height:2.5em; overflow:hidden; }
  .tl b { font-size:.95rem; } .tl .x { color:var(--secondary-text-color); font-size:.66rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tl .on { position:absolute; right:6px; top:6px; font-size:.8rem; background:var(--card-background-color,#fff); border-radius:50%; width:20px; height:20px; display:grid; place-items:center; }
  .tl .btn { padding:3px 6px; font-size:.74rem; margin-top:auto; }
  .mx { display:none; }
  .foot { color:var(--secondary-text-color); font-size:.72rem; text-align:center; margin-top:10px; }
  @container (min-width: 720px) {
    .mx.has { display:grid; font-size:.86rem; margin-top:10px; }
    .mx.has + .rows { display:none; }
    .mx > div { padding:8px; border-bottom:1px solid var(--divider-color,#e0e0e0); display:flex; align-items:center; gap:6px; justify-content:flex-end; font-variant-numeric:tabular-nums; white-space:nowrap; min-width:0; }
    .mx > div.l { justify-content:flex-start; white-space:normal; }
    .mx .hd { color:var(--secondary-text-color); font-size:.76rem; font-weight:700; }
    .mx .cell { cursor:pointer; border-radius:8px; }
    .mx .cell.best { color:var(--sd-ok); font-weight:700; }
    .mx .cell.sel { box-shadow:0 0 0 2px var(--sd-accent) inset; }
    .mx .na { color:var(--secondary-text-color); }
    .mx small { color:var(--secondary-text-color); font-weight:400; font-size:.72rem; }
  }
`;

class SmartDiscountsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(TAG + "-editor"); }
  static getStubConfig(hass) {
    const todo = Object.keys((hass && hass.states) || {}).find((e) => e.startsWith("todo."));
    return { list: todo || "" };
  }
  setConfig(config) {
    this._config = { ...DEFAULTS, ...(config || {}) };
    this._tab = ["all", "watch"].includes(this._config.default_tab) ? this._config.default_tab : "list";
    if (this._config.show_list_tab === false && this._tab === "list") this._tab = "all";
    this._closed = new Set(); this._allCats = false;
    this._sel = {};       // Artikel-UID → gewähltes Angebot
    this._open = new Set();
    this._query = ""; this._cat = "";
    this._view = this._config.all_view === "list" ? "list" : "tiles";
    try { const v = localStorage.getItem("smartdiscounts-view"); if (v === "list" || v === "tiles") this._view = v; } catch (e) { /* */ }
    this._group = this._config.group_by === "category" ? "category" : "store";
    try { const v = localStorage.getItem("smartdiscounts-group"); if (v === "category" || v === "store") this._group = v; } catch (e) { /* */ }
    this._lview = this._config.list_view === "rows" ? "rows" : "chips";
    try { const v = localStorage.getItem("smartdiscounts-list-view"); if (v === "rows" || v === "chips") this._lview = v; } catch (e) { /* */ }
    if (!this.shadowRoot) { this._card = h("div", { class: "wrap" }); this.attachShadow({ mode: "open" }).append(h("style", {}, STYLE), h("ha-card", {}, this._card)); }
    this._sig = null;
    if (this._hass) this._refresh(true);
  }
  set hass(hass) {
    this._hass = hass;
    this._t = TEXTS[String(hass.language || "en").slice(0, 2)] || TEXTS.en;
    this._refresh(false);
  }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  // "entities": nur diese Sensoren (z. B. eine Karte nur für REWE) – einfache Form von "sources", im Editor auswählbar.
  // Eigene Angaben unter "sources" (store, color, map) bleiben für diese Sensoren erhalten.
  _src() {
    const c = this._config, only = (Array.isArray(c.entities) ? c.entities : c.entities ? [c.entities] : []).filter((e) => typeof e === "string" && e);
    if (!only.length) return c.sources;
    const own = Array.isArray(c.sources) ? c.sources.filter((s) => s && typeof s === "object") : [];
    return only.map((e) => own.find((s) => s.entity === e) || e);
  }
  _sources() { return sourcesOf(this._hass, this._src()); }
  // "stores": nur diese Märkte (nach Namen, z. B. [REWE, ALDI]) – wirkt zusätzlich zu "entities"
  _offers() {
    const only = (Array.isArray(this._config.stores) ? this._config.stores : this._config.stores ? [this._config.stores] : []).map((x) => norm(x)).filter(Boolean);
    const all = collectOffers(this._hass, this._src());
    return only.length ? all.filter((o) => only.includes(norm(o.store))) : all;
  }
  _money(v) { if (this._config.currency_symbol) { try { return `${new Intl.NumberFormat(this._hass.language || "de", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}\u00a0${this._config.currency_symbol}`; } catch (e) { return `${v.toFixed(2)} ${this._config.currency_symbol}`; } }
    try { return new Intl.NumberFormat(this._hass.language || "de", { style: "currency", currency: this._config.currency || "EUR" }).format(v); } catch (e) { return `${v.toFixed(2)} €`; } }
  _day(d) { const p = String(d || "").split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : d || ""; }
  _unitLabel(o) { return o.unit ? `${this._money(o.unit.value)}/${o.unit.unit}` : ""; }
  // günstiger: nach Grundpreis, wenn beide denselben haben – sonst nach Preis
  _cmp(a, b) { return cheaper(a, b); }

  async _loadList() {
    const id = this._config.list;
    if (!id || !this._hass.states[id]) { this._items = null; return; }
    try {
      const r = await this._hass.callWS({ type: "todo/item/list", entity_id: id });
      this._items = (r.items || []).filter((i) => i.status !== "completed").map((i) => ({ uid: i.uid, text: i.summary || "", note: i.description || "", name: itemName(i.summary) }));
    } catch (e) { this._items = []; this._error = (e && e.message) || this._t.error; }
  }
  async _refresh(force) {
    if (!this._config || !this._hass) return;
    // nur neu laden/zeichnen, wenn sich eine Quelle oder die Liste geändert hat
    const st = this._hass.states;
    const ids = [...this._sources().map((s) => s.entity), this._config.list, this._config.watch_list].filter(Boolean);
    const sig = ids.map((e) => (st[e] ? st[e].last_updated || st[e].state : "")).join("|") + "|" + (this._hass.language || "");
    if (!force && sig === this._sig) return;
    this._sig = sig;
    this._all = this._offers();
    await this._loadList();
    await this._loadCats();
    await this._loadWatch();
    this._render();
    this._notify();
  }
  // ----- Merkliste: Produkte, bei denen man auf ein Angebot wartet.
  // Quelle: "watch" in der Konfiguration + eine To-do-Liste ("watch_list", gilt auf allen Geräten) oder – ohne sie – dieses Gerät.
  async _loadWatch() {
    const id = this._config.watch_list;
    this._watchShared = !!(id && this._hass.states[id]);
    // Mit SmartLists (und ohne eigene watch_list): die Merkliste des Haushalts – dort meldet Home Assistant auch im Hintergrund
    this._watchSmart = !this._watchShared && (this._hass.config.components || []).includes("smartlists");
    if (this._watchSmart) {
      try { this._watchItems = ((await this._hass.callWS({ type: "smartlists/watch" })).names || []).map((name) => ({ name })); return; }
      catch (e) { this._watchSmart = false; }  // ältere SmartLists-Version: wie ohne
    }
    if (this._watchShared) {
      try {
        const r = await this._hass.callWS({ type: "todo/item/list", entity_id: id });
        this._watchItems = (r.items || []).filter((i) => i.status !== "completed").map((i) => ({ uid: i.uid, name: itemName(i.summary) || String(i.summary || "") }));
      } catch (e) { this._watchItems = []; }
    } else {
      let local = [];
      try { local = JSON.parse(localStorage.getItem("smartdiscounts-watch") || "[]"); } catch (e) { /* */ }
      this._watchItems = (Array.isArray(local) ? local : []).filter((x) => typeof x === "string" && x.trim()).map((name) => ({ name }));
    }
  }
  _watchTerms() {
    const fixed = (Array.isArray(this._config.watch) ? this._config.watch : [this._config.watch]).filter((x) => typeof x === "string" && x.trim()).map((name) => ({ name: name.trim(), fixed: true }));
    const seen = new Set(fixed.map((x) => norm(x.name)));
    return [...fixed, ...(this._watchItems || []).filter((x) => x.name && !seen.has(norm(x.name)) && seen.add(norm(x.name)))];
  }
  async _watchAdd(name) {
    name = String(name || "").trim();
    if (!name || this._watchTerms().some((x) => norm(x.name) === norm(name))) return;
    if (this._watchSmart) await this._hass.callWS({ type: "smartlists/watch_set", add: name });
    else if (this._watchShared) await this._hass.callService("todo", "add_item", { item: name }, { entity_id: this._config.watch_list });
    else { try { localStorage.setItem("smartdiscounts-watch", JSON.stringify([...(this._watchItems || []).map((x) => x.name), name])); } catch (e) { /* */ } }
    this._sig = null; await this._refresh(true);
  }
  async _watchRemove(term) {
    if (this._watchSmart) await this._hass.callWS({ type: "smartlists/watch_set", remove: term.name });
    else if (this._watchShared && term.uid) await this._hass.callService("todo", "remove_item", { item: term.uid }, { entity_id: this._config.watch_list });
    else { try { localStorage.setItem("smartdiscounts-watch", JSON.stringify((this._watchItems || []).map((x) => x.name).filter((n) => n !== term.name))); } catch (e) { /* */ } }
    this._sig = null; await this._refresh(true);
  }
  // Benachrichtigung in Home Assistant, sobald etwas von der Merkliste neu im Angebot ist.
  // Läuft in der Karte: gemeldet wird, wenn ein Dashboard mit der Karte geöffnet ist. Jedes Angebot nur einmal je Gerät.
  async _notify() {
    const c = this._config;
    if (!c.notify || this._notifying || this._watchSmart) return;  // mit SmartLists meldet die Integration selbst
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem("smartdiscounts-notified") || "[]"); } catch (e) { /* */ }
    // zusätzlich im Speicher merken – falls der Browser keinen dauerhaften Speicher erlaubt
    seen = [...new Set([...(Array.isArray(seen) ? seen : []), ...(this._notified || [])])];
    const fresh = [];
    for (const term of this._watchTerms()) for (const o of dealsFor(this._all, term.name, c.match)) {
      const key = `${norm(term.name)}|${o.store}|${o.name}|${o.price}|${o.until || ""}`;
      if (!seen.includes(key)) { seen.push(key); fresh.push({ term, o }); }
    }
    if (!fresh.length) return;
    this._notifying = true; this._notified = seen.slice(-400);
    try { localStorage.setItem("smartdiscounts-notified", JSON.stringify(seen.slice(-400))); } catch (e) { /* */ }
    const t = this._t;
    const message = fresh.slice(0, 12).map(({ term, o }) => `${term.name}: ${o.name} – ${this._money(o.price)} (${o.store}${o.until ? `, ${t.until} ${this._day(o.until)}` : ""})`).join("\n")
      + (fresh.length > 12 ? `\n+${fresh.length - 12}` : "");
    try {
      await this._hass.callService("persistent_notification", "create", { title: `🏷️ ${t.n_title}`, message, notification_id: "smartdiscounts_watch" });
      const m = String(c.notify_service || "").match(/^([a-z0-9_]+)\.([a-z0-9_]+)$/);
      if (m) await this._hass.callService(m[1], m[2], { title: `🏷️ ${t.n_title}`, message, data: { tag: "smartdiscounts_watch" } });
    } catch (e) { console.warn("smartdiscounts-card: notify", e); }
    this._notifying = false;
  }
  _renderWatch() {
    const t = this._t, c = this._config, terms = this._watchTerms();
    const input = h("input", { class: "search", type: "text", placeholder: t.w_add, "aria-label": t.w_add });
    const go = async () => { const v = input.value; input.value = ""; try { await this._watchAdd(v); } catch (e) { input.value = v; } };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    const row = (o) => {
      const sub = [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : ""].filter(Boolean).join(" · ");
      return h("div", { class: "lrow", title: o.name },
        c.show_images ? h("div", { class: "thumb", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image ? null : "🏷️") : null,
        h("div", { class: "n" }, o.name, h("small", {}, this._storeBadge(o), sub ? ` ${sub}` : "")),
        h("div", { class: "pr" }, h("b", {}, this._money(o.price)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null),
        this._addCtl(o, false));
    };
    const blocks = terms.map((term) => {
      const offers = dealsFor(this._all, term.name, c.match);
      return h("div", { class: "shelf" }, h("h4", {}, "⭐ ", term.name, h("small", {}, offers.length ? `${offers.length} ${offers.length > 1 ? t.offers : t.offer1}` : t.none), h("span", { class: "sp" }),
        term.fixed ? h("small", {}, t.w_fixed) : h("button", { type: "button", "aria-label": `${t.exp_remove}: ${term.name}`, onclick: () => this._watchRemove(term) }, t.exp_remove)),
        offers.length ? h("div", { class: "lrows" }, offers.map(row)) : null);
    });
    return h("div", {}, h("div", { class: "filters one" }, input, h("button", { type: "button", class: "btn pri", onclick: go }, t.w_add_btn)),
      terms.length ? blocks : h("div", { class: "msg" }, t.w_empty), this._watchShared || this._watchSmart ? null : h("div", { class: "foot" }, t.w_local), this._foot());
  }
  _matchesFor(item) { return item.name ? dealsFor(this._all, item.name, this._config.match) : []; }
  _attached(item) { return /[⚙⚙]️?\s*OFFER\s*:|🏷️/.test(item.note || ""); }

  _render() {
    const t = this._t, c = this._config;
    const stores = [...new Set(this._all.map((o) => o.store))];
    const head = h("div", { class: "head" }, h("h1", {}, c.title || t.title), h("small", {}, `${this._all.length} ${t.offers} · ${stores.length ? stores.join(", ") : "–"}`));
    const tabs = h("div", { class: "tabs" }, [...(c.show_list_tab === false ? [] : [["list", "📝 " + t.tab_list]]), ["all", t.tab_all], ["watch", "⭐ " + t.tab_watch + (this._watchHits() ? ` · ${this._watchHits()}` : "")]].map(([v, l]) =>
      h("button", { type: "button", class: this._tab === v ? "on" : "", onclick: () => { this._tab = v; this._render(); } }, l)));
    const body = !this._all.length ? h("div", { class: "msg" }, t.no_sources) : this._tab === "list" ? this._renderList(stores) : this._tab === "watch" ? this._renderWatch() : this._renderAll(stores);
    this._card.className = `wrap ${c.compact ? "compact" : ""} ${c.show_images ? "" : "noimg"}`;
    this._card.replaceChildren(head, tabs, body);
  }
  // Kategorie eines Angebots: mit SmartLists dessen Einkaufs-Kategorien (einheitlich über alle Märkte), sonst die des Sensors
  async _loadCats() {
    this._catMap = null;
    if (this._config.category_source === "store" || !(this._hass.config.components || []).includes("smartlists")) return;
    try {
      const r = await this._hass.callWS({ type: "smartlists/categorize", names: [...new Set(this._all.map((o) => o.name))], language: this._hass.language });
      const labels = Object.fromEntries((r.categories || []).map((x) => [x.id, x.label]));
      this._catOrder = (r.categories || []).map((x) => x.label);
      this._catMap = Object.fromEntries(Object.entries(r.map || {}).map(([n, id]) => [n, labels[id] || id]));
    } catch (e) { this._catMap = null; }  // ältere SmartLists-Version: Kategorien der Sensoren
  }
  _catOf(o) { return (this._catMap && this._catMap[o.name]) || o.category || this._t.other; }
  _watchHits() { return this._watchTerms().filter((x) => dealsFor(this._all, x.name, this._config.match).length).length; }
  _storeBadge(o) { return h("span", { class: "store", style: `background:${o.color};${/^#(f|e)[0-9a-f]{5}$/i.test(o.color) ? "color:#1a1a1a" : ""}` }, o.store); }
  _priceChip(item, o, best) {
    const t = this._t, c = this._config, sel = this._sel[item.uid] && this._sel[item.uid].id === o.id;
    const extra = [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : ""].filter(Boolean).join(" · ");
    return h("button", { type: "button", class: `pc ${best ? "best" : ""} ${sel ? "sel" : ""}`, title: o.name, "aria-pressed": String(!!sel),
      onclick: () => { if (sel) delete this._sel[item.uid]; else this._sel[item.uid] = o; this._render(); } },
      h("span", { class: "s" }, h("span", { class: "dot", style: `background:${o.color}` }), o.store, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null, best ? h("span", { class: "star", title: t.best }, "★") : null),
      h("b", {}, this._money(o.price)), o.old ? h("s", {}, this._money(o.old)) : null,
      h("span", { class: "x" }, o.name), extra ? h("span", { class: "x" }, extra) : null);
  }
  // „Meine Liste“ als Zeilen: ein Angebot je Zeile mit kleinem Bild, antippen wählt es
  _offerRow(item, o, best) {
    const t = this._t, c = this._config, sel = this._sel[item.uid] && this._sel[item.uid].id === o.id;
    const sub = [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : ""].filter(Boolean).join(" · ");
    return h("button", { type: "button", class: `orow ${sel ? "sel" : ""} ${best ? "best" : ""}`, "aria-pressed": String(!!sel), title: o.name,
      onclick: () => { if (sel) delete this._sel[item.uid]; else this._sel[item.uid] = o; this._render(); } },
      h("span", { class: `radio ${sel ? "on" : ""}` }, sel ? "✓" : ""),
      c.show_images ? h("span", { class: "thumb sm", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image ? null : "🏷️") : null,
      h("span", { class: "n" }, o.name, h("small", {}, this._storeBadge(o), sub ? ` ${sub}` : "")),
      h("span", { class: "pr" }, h("b", {}, best ? "★ " : "", this._money(o.price)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null));
  }
  _renderList(stores) {
    const t = this._t, c = this._config;
    if (!c.list || !this._hass.states[c.list]) return h("div", { class: "msg" }, t.no_list);
    const items = this._items || [];
    if (!items.length) return h("div", { class: "msg" }, this._error || t.list_empty);
    const rows = items.map((it) => ({ it, offers: this._matchesFor(it) }));
    const hit = rows.filter((r) => r.offers.length);
    // Wie viele Artikel der Liste hat welcher Markt im Angebot?
    const cover = stores.map((s) => [s, hit.filter((r) => r.offers.some((o) => o.store === s)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
    const choose = (fn) => { this._sel = {}; hit.forEach((r) => { const o = fn(r); if (o) this._sel[r.it.uid] = o; }); this._render(); };
    const clear = () => { this._sel = {}; this._render(); };  // noch einmal antippen hebt die Auswahl wieder auf
    const isCheapest = hit.length && hit.every((r) => this._sel[r.it.uid] && this._sel[r.it.uid].id === r.offers[0].id);
    const asRows = this._lview === "rows";
    const toggle = h("button", { type: "button", class: "btn vbtn sm", title: asRows ? t.v_chips : t.v_rows, "aria-label": asRows ? t.v_chips : t.v_rows,
      onclick: () => { this._lview = asRows ? "chips" : "rows"; try { localStorage.setItem("smartdiscounts-list-view", this._lview); } catch (e) { /* */ } this._render(); } }, asRows ? "▤" : "☰");
    const plan = h("div", { class: "plan" }, h("div", { class: "ph" }, h("b", {}, "💡 " + t.on_offer.replace("{n}", hit.length).replace("{m}", items.length)), hit.length ? toggle : null),
      hit.length ? h("div", { class: "chips" },
        h("button", { type: "button", class: `chip ${isCheapest ? "on" : ""}`, "aria-pressed": String(!!isCheapest),
          onclick: () => (isCheapest ? clear() : choose((r) => r.offers[0])) }, "★ " + t.cheapest),
        cover.map(([s, n]) => { const col = (this._all.find((o) => o.store === s) || {}).color;
          const on = hit.some((r) => r.offers.some((o) => o.store === s)) && hit.every((r) => { const o = r.offers.find((x) => x.store === s); return o ? this._sel[r.it.uid] && this._sel[r.it.uid].id === o.id : !this._sel[r.it.uid]; });
          return h("button", { type: "button", class: `chip ${on ? "on" : ""}`, "aria-pressed": String(!!on), onclick: () => (on ? clear() : choose((r) => r.offers.find((o) => o.store === s))) }, h("span", { class: "dot", style: `background:${col}` }), `${t.only.replace("{store}", s)} · ${n}`); })) : null);
    const line = (r) => {
      const { it, offers } = r, sel = this._sel[it.uid];
      if (!offers.length && c.hide_without_offer) return null;
      const img = sel ? sel.image : offers[0] && offers[0].image;
      return h("div", { class: "it" },
        h("div", { class: "top" }, c.show_images && !asRows ? h("div", { class: "thumb", style: img ? `background-image:url("${String(img).replace(/"/g, "%22")}");background-color:#fff` : null }, img ? null : "🛒") : null,
          h("div", { class: "n" }, it.name || it.text, sel ? [" ", this._storeBadge(sel)] : null, sel ? h("small", {}, sel.name) : it.text !== it.name ? h("small", {}, it.text) : null),
          sel ? h("span", { class: "st ok" }, this._money(sel.price)) : this._attached(it) ? h("span", { class: "st ok" }, "🏷️ " + t.attached)
            : h("span", { class: "st" }, offers.length ? `${offers.length} ${offers.length > 1 ? t.offers : t.offer1}` : t.none)),
        !offers.length ? null : asRows ? h("div", { class: "orows" }, offers.map((o, i) => this._offerRow(it, o, i === 0 && offers.length > 1)))
          : h("div", { class: "prices" }, offers.map((o, i) => this._priceChip(it, o, i === 0 && offers.length > 1))));
    };
    // breite Karte: Tabelle Artikel × Märkte
    const mstores = cover.map(([s]) => s);
    const mx = h("div", { class: `mx ${mstores.length > 1 && !asRows ? "has" : ""}`, style: `grid-template-columns:minmax(150px,1.4fr) repeat(${mstores.length}, minmax(110px,1fr))` },
      h("div", { class: "hd l" }, t.item), mstores.map((s) => h("div", { class: "hd" }, this._storeBadge(this._all.find((o) => o.store === s)))),
      rows.filter((r) => r.offers.length || !c.hide_without_offer).map((r) => [h("div", { class: "l" }, r.it.name || r.it.text),
        mstores.map((s) => { const o = r.offers.find((x) => x.store === s);
          if (!o) return h("div", { class: "na" }, "–");
          const sel = this._sel[r.it.uid] && this._sel[r.it.uid].id === o.id;
          return h("div", { class: `cell ${r.offers[0].id === o.id && r.offers.length > 1 ? "best" : ""} ${sel ? "sel" : ""}`, title: o.name, role: "button", tabindex: "0",
            onclick: () => { if (sel) delete this._sel[r.it.uid]; else this._sel[r.it.uid] = o; this._render(); } },
            r.offers[0].id === o.id && r.offers.length > 1 ? "★ " : "", this._money(o.price), c.show_unit_price && o.unit ? h("small", {}, this._unitLabel(o)) : null); })]));
    const chosen = Object.entries(this._sel).filter(([uid]) => items.some((i) => i.uid === uid));
    const total = chosen.reduce((a, [, o]) => a + o.price, 0);
    const sum = h("div", { class: "sum" }, h("div", {}, chosen.length ? t.chosen.replace("{n}", chosen.length) : t.pick_hint,
      chosen.length ? h("small", {}, `${t.sum} ${this._money(total)} · ${[...new Set(chosen.map(([, o]) => o.store))].join(", ")}`) : null),
      h("span", { class: "sp" }), chosen.length ? h("button", { type: "button", class: "btn pri", onclick: (e) => this._apply(chosen, e.currentTarget) }, t.apply) : null);
    const groups = Object.values(items.reduce((a, i) => { const k = norm(i.name); if (k) (a[k] = a[k] || []).push(i); return a; }, {})).filter((g) => g.length > 1);
    const dupBox = groups.length && !this._dupLater ? groups.slice(0, 3).map((g) => h("div", { class: "expbox", role: "status" }, h("b", {}, "🧹 " + t.dup_n.replace("{name}", g[0].name).replace("{n}", g.length)),
      h("span", { class: "sp" }), h("button", { type: "button", class: "btn", onclick: () => { this._dupLater = true; this._render(); } }, t.exp_later),
      h("button", { type: "button", class: "btn pri", onclick: (e) => this._merge(g, e.currentTarget) }, t.dup_merge))) : null;
    const old = items.filter((i) => this._expiredNote(i.note));
    const expBox = old.length && !this._expLater ? h("div", { class: "expbox", role: "status" }, h("b", {}, "🏷️ " + t.exp_n.replace("{n}", old.length)), h("small", {}, old.slice(0, 3).map((i) => i.name || i.text).join(", ")),
      h("span", { class: "sp" }), h("button", { type: "button", class: "btn", onclick: () => { this._expLater = true; this._render(); } }, t.exp_later),
      h("button", { type: "button", class: "btn pri", onclick: (e) => this._clearExpired(e.currentTarget) }, t.exp_remove)) : null;
    return h("div", {}, expBox, dupBox, plan, mx, h("div", { class: "rows" }, rows.map(line)), sum, this._foot());
  }
  _renderAll(stores) {
    const t = this._t, c = this._config;
    const byCat = this._group === "category";
    const names = (this._items || []).map((i) => i.name).filter(Boolean);
    const onList = (o) => names.some((n) => matches(n, o.name, c.match));
    const q = norm(this._query);
    const shown = this._all.filter((o) => (!q || norm(`${o.name} ${o.brand} ${o.category} ${this._catOf(o)} ${o.store}`).includes(q)) && (!this._cat || (byCat || this._catMap ? this._catOf(o) : o.category) === this._cat));
    const search = h("input", { class: "search", type: "search", placeholder: t.search, "aria-label": t.search, value: this._query });
    search.addEventListener("input", () => { this._query = search.value; const pos = search.selectionStart; this._render();
      const f = this._card.querySelector("input.search"); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* */ } } });
    // Kategorien zum Antippen mit Anzahl: die größten zuerst, der Rest hinter „+N mehr“ – umbrechend, kein Scrollbalken
    const catKey = (o) => (byCat || this._catMap ? this._catOf(o) : o.category);
    const counts = this._all.reduce((a, o) => { const k = catKey(o); if (k) a[k] = (a[k] || 0) + 1; return a; }, {});
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const FIRST = 5, visible = this._allCats ? ranked : [...new Set([...ranked.slice(0, FIRST), ...(this._cat ? [this._cat] : [])])];
    const cchip = (key, label, n) => h("button", { type: "button", class: `chip ${this._cat === key ? "on" : ""}`, "aria-pressed": String(this._cat === key),
      onclick: () => { this._cat = this._cat === key ? "" : key; this._render(); } }, label, h("small", {}, ` ${n}`));
    const catSel = ranked.length > 1 ? h("div", { class: "catbar" }, cchip("", t.all, this._all.length), visible.map((k) => cchip(k, k, counts[k])),
      ranked.length > visible.length || this._allCats ? h("button", { type: "button", class: "chip more", onclick: () => { this._allCats = !this._allCats; this._render(); } },
        this._allCats ? t.less : t.more_n.replace("{n}", ranked.length - visible.length)) : null) : null;
    const tile = (o) => {
      const got = this._onListCount(o), mine = !got && onList(o);
      // steht genau dieses Angebot schon auf der Liste: Bild grün abgedunkelt, Haken darüber, Anzahl unten rechts
      return h("div", { class: `tl ${got ? "got" : ""}`, title: got ? `${o.name} – ${t.on_n.replace("{n}", got)}` : o.name }, o.pct ? h("span", { class: "pctb" }, `−${o.pct}%`) : null, mine ? h("span", { class: "on", title: t.on_list }, "📝") : null,
        c.show_images ? h("div", { class: "img", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}")` : "background:none" },
          got ? [h("span", { class: "gotck", "aria-hidden": "true" }, "✓"), h("span", { class: "gotn" }, `${got}×`)] : null) : null,
        h("div", { class: "t" }, !c.show_images && got ? h("span", { class: "gott" }, "✓ ") : null, o.name), byCat ? h("div", { class: "x" }, this._storeBadge(o)) : null, h("div", {}, h("b", {}, this._money(o.price)), o.old ? h("s", { style: "margin-left:4px;font-size:.7rem;opacity:.7" }, this._money(o.old)) : null),
        h("div", { class: "x" }, [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : ""].filter(Boolean).join(" · ") || " "),
        this._addCtl(o, true));
    };
    // Listen-Darstellung: kleine Bilder, eine Zeile je Angebot
    const row = (o) => {
      const got = this._onListCount(o), mine = !got && onList(o);
      const sub = [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : "", byCat ? "" : o.category].filter(Boolean).join(" · ");
      return h("div", { class: `lrow ${got ? "got" : ""}`, title: o.name },
        c.show_images ? h("div", { class: "thumb", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}");background-color:#fff` : null }, o.image || got ? null : "🏷️",
          got ? h("span", { class: "gotck", "aria-hidden": "true" }, "✓") : null) : null,
        h("div", { class: "n" }, mine ? h("span", { title: t.on_list }, "📝 ") : null, o.name,
          sub || byCat || got ? h("small", {}, got ? h("b", { class: "gott" }, `✓ ${t.on_n.replace("{n}", got)}${sub || byCat ? " · " : ""}`) : null, byCat ? [this._storeBadge(o), " "] : null, sub) : null),
        h("div", { class: "pr" }, h("b", {}, this._money(o.price)), o.old ? h("s", {}, this._money(o.old)) : null, o.pct ? h("span", { class: "pct" }, `−${o.pct}%`) : null),
        this._addCtl(o, false));
    };
    const asList = this._view === "list";
    const toggle = h("button", { type: "button", class: "btn vbtn", title: asList ? t.v_tiles : t.v_list, "aria-label": asList ? t.v_tiles : t.v_list,
      onclick: () => { this._view = asList ? "tiles" : "list"; try { localStorage.setItem("smartdiscounts-view", this._view); } catch (e) { /* */ } this._render(); } }, asList ? "▦" : "☰");
    const gbtn = h("button", { type: "button", class: "btn vbtn", title: `${t.e_group}: ${byCat ? t.g_store : t.g_cat}`, "aria-label": `${t.e_group}: ${byCat ? t.g_store : t.g_cat}`,
      onclick: async () => { this._group = byCat ? "store" : "category"; this._cat = ""; this._open.clear(); try { localStorage.setItem("smartdiscounts-group", this._group); } catch (e) { /* */ }
        await this._loadCats(); this._render(); } }, byCat ? "🏬" : "🗂️");
    // Gruppen: je Markt (Standard) oder je Kategorie – dann in der Reihenfolge der Einkaufs-Kategorien, sonst nach Namen
    const order = this._catMap && this._catOrder ? this._catOrder : [];
    const keys = byCat ? [...new Set(shown.map((o) => this._catOf(o)))].sort((a, b) => ((order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999)) || a.localeCompare(b)) : stores;
    const shelves = keys.map((s) => {
      const all = shown.filter((o) => (byCat ? this._catOf(o) === s : o.store === s));
      if (!all.length) return null;
      // Angebote für die eigene Liste zuerst
      const sorted = [...all.filter(onList), ...all.filter((o) => !onList(o))];
      const open = this._open.has(s) || !!q || !!this._cat;
      const lim = Number(c.max_per_store) > 0 ? Number(c.max_per_store) : Infinity;  // 0 = kein Limit
      const list = open ? sorted : sorted.slice(0, lim);
      if (byCat) {
        // nach Kategorie: Überschrift zum Auf- und Zuklappen, mit den Märkten als Punkte
        // Standard: aufgeklappt (categories_open: false = zugeklappt); Antippen kehrt es für diese Kategorie um
        const shut = ((c.categories_open === false) !== this._closed.has(s)) && !q && !this._cat;
        const dots = [...new Map(all.map((o) => [o.store, o.color])).entries()].map(([st, col]) => h("span", { class: "dot", title: st, style: `background:${col}` }));
        return h("div", { class: `shelf fold ${shut ? "" : "open"}` },
          h("button", { type: "button", class: "foldh", "aria-expanded": String(!shut), onclick: () => { if (this._closed.has(s)) this._closed.delete(s); else this._closed.add(s); this._render(); } },
            h("b", {}, s), h("span", { class: "sp" }), dots, h("small", {}, `${all.length} ${all.length > 1 ? t.offers : t.offer1}`), h("span", { class: "chev" }, "›")),
          shut ? null : asList ? h("div", { class: "lrows" }, sorted.map(row)) : h("div", { class: "rail open" }, sorted.map(tile)));
      }
      return h("div", { class: "shelf" }, h("h4", {}, this._storeBadge(all[0]), h("small", {}, `${all.length} ${t.offers}`), h("span", { class: "sp" }),
        all.length > lim && !q && !this._cat ? h("button", { type: "button", onclick: () => { if (open) this._open.delete(s); else this._open.add(s); this._render(); } }, open ? t.less : `${t.all} →`) : null),
        asList ? h("div", { class: "lrows" }, list.map(row)) : h("div", { class: `rail ${open ? "open" : ""}` }, list.map(tile)));
    });
    return h("div", {}, h("div", { class: "filters" }, search, gbtn, toggle), catSel, shown.length ? shelves : h("div", { class: "msg" }, t.no_hits), this._foot());
  }
  _foot() {
    const ts = this._sources().map((s) => this._hass.states[s.entity].last_updated).filter(Boolean).sort().pop();
    let when = "";
    try { when = ts ? new Date(ts).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" }) : ""; } catch (e) { /* */ }
    return h("div", { class: "foot" }, when ? `${this._t.stand} ${when}` : "");
  }
  // Mit SmartLists: Angebot als ⚙OFFER-Zeile an den Artikel (wird dort als Badge mit Markt, Preis, „bis“ gezeigt).
  // Ohne SmartLists: lesbarer Text in der Beschreibung des Eintrags.
  _offerNote(o) {
    const smart = (this._hass.config.components || []).includes("smartlists");
    if (smart) return `⚙OFFER:${JSON.stringify({ s: o.store, p: o.price, ...(o.old ? { o: o.old } : {}), ...(o.until ? { e: o.until } : {}), a: Math.floor(Date.now() / 1000) })}`;
    // Datum mit Jahr, damit sich ein abgelaufenes Angebot später erkennen lässt
    return `🏷️ ${o.store} · ${this._money(o.price)}${o.until ? ` · ${this._t.until} ${this._day(o.until)}${String(o.until).slice(0, 4)}` : ""} · ${o.name}`;
  }
  // Ist das an den Eintrag geschriebene Angebot abgelaufen? (⚙OFFER-Zeile von SmartLists oder die lesbare 🏷️-Zeile)
  _expiredNote(note) {
    const today = new Date().toISOString().slice(0, 10);
    for (const l of String(note || "").split("\n")) {
      const j = l.match(/[⚙\u2699]\ufe0f?\s*OFFER\s*:\s*(\{.*\})/);
      if (j) { try { const e = String(JSON.parse(j[1]).e || "").slice(0, 10); if (e && e < today) return true; } catch (e) { /* */ } }
      const d = /^\s*🏷️/.test(l) && l.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (d && `${d[3]}-${d[2]}-${d[1]}` < today) return true;
    }
    return false;
  }
  async _clearExpired(btn) {
    btn.disabled = true;
    try {
      if ((this._hass.config.components || []).includes("smartlists")) await this._hass.callWS({ type: "smartlists/clear_expired_offers", entity_id: this._config.list });
      else for (const it of this._items.filter((i) => this._expiredNote(i.note)))
        await this._hass.callService("todo", "update_item", { item: it.uid, description: this._cleanNote(it.note) }, { entity_id: this._config.list });
      this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  _cleanNote(note) { return String(note || "").split("\n").filter((l) => !/^\s*([⚙⚙]️?\s*OFFER\s*:|🏷️)/.test(l)).join("\n").trim(); }
  async _apply(chosen, btn) {
    btn.disabled = true;
    try {
      for (const [uid, o] of chosen) {
        const it = this._items.find((i) => i.uid === uid);
        const note = [this._cleanNote(it && it.note), this._offerNote(o)].filter(Boolean).join("\n");
        await this._hass.callService("todo", "update_item", { item: uid, description: note }, { entity_id: this._config.list });
      }
      this._sel = {}; this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  // Anzahl im Text eines Eintrags: "2x Bio Orangen" oder "Bio Orangen 2" (so schreibt es SmartLists)
  _countOf(text) { const a = String(text).match(/^\s*(\d{1,3})\s?[x×]\s+\S/i), b = String(text).match(/\s(\d{1,3})\s*$/); return a ? +a[1] : b ? +b[1] : 1; }
  _withCount(text, n) {
    const bare = String(text).replace(/^\s*\d{1,3}\s?[x×]\s+(?=\S)/i, "").replace(/\s\d{1,3}\s*$/, "").trim();
    return n > 1 ? `${n}x ${bare}` : bare;
  }
  // Einträge der Liste, die dasselbe meinen wie dieses Angebot (gleicher Name ohne Menge und Zeichen)
  _same(o) { const key = norm(itemName(o.name)); return (this._items || []).filter((i) => norm(i.name) === key); }
  _onListCount(o) { return this._same(o).reduce((a, i) => a + this._countOf(i.text), 0); }
  async _step(o, delta, btn) {
    const it = this._same(o)[0];
    if (!it) return this._add(o, btn);
    if (btn) btn.disabled = true;
    try {
      const n = this._countOf(it.text) + delta;
      if (n <= 0) await this._hass.callService("todo", "remove_item", { item: it.uid }, { entity_id: this._config.list });
      else await this._hass.callService("todo", "update_item", { item: it.uid, rename: this._withCount(it.text, n) }, { entity_id: this._config.list });
      this._sig = null; await this._loadList(); this._render();
    } catch (e) { if (btn) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; } }
  }
  // ＋ oder – steht der Artikel schon auf der Liste – ein Zähler (− 2× +)
  _addCtl(o, wide) {
    const t = this._t, n = this._onListCount(o);
    if (!this._config.list) return null;
    if (!n) return h("button", { type: "button", class: wide ? "btn" : "btn plus", title: t.add, "aria-label": `${t.add}: ${o.name}`, onclick: (e) => this._add(o, e.currentTarget) }, wide ? "＋ " + t.add : "＋");
    return h("span", { class: "stepper", title: t.on_n.replace("{n}", n) },
      h("button", { type: "button", "aria-label": `− ${o.name}`, onclick: (e) => this._step(o, -1, e.currentTarget) }, "−"), h("b", {}, `${n}×`),
      h("button", { type: "button", "aria-label": `+ ${o.name}`, onclick: (e) => this._step(o, 1, e.currentTarget) }, "+"));
  }
  // Doppelte Einträge zu einem zusammenfassen (Summe der Anzahl, Notiz des ersten bleibt)
  async _merge(group, btn) {
    btn.disabled = true;
    try {
      const total = group.reduce((a, i) => a + this._countOf(i.text), 0);
      await this._hass.callService("todo", "update_item", { item: group[0].uid, rename: this._withCount(group[0].text, total) }, { entity_id: this._config.list });
      await this._hass.callService("todo", "remove_item", { item: group.slice(1).map((i) => i.uid) }, { entity_id: this._config.list });
      this._sig = null; await this._refresh(true);
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
  async _add(o, btn) {
    btn.disabled = true;
    try {
      await this._hass.callService("todo", "add_item", { item: o.name, description: this._offerNote(o) }, { entity_id: this._config.list });
      this._sig = null; await this._loadList(); this._render();
    } catch (e) { btn.disabled = false; btn.textContent = (e && e.message) || this._t.error; }
  }
}

class SmartDiscountsCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...(config || {}) }; this._draw(); }
  set hass(hass) { this._hass = hass; this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    const t = TEXTS[String(this._hass.language || "en").slice(0, 2)] || TEXTS.en;
    const b = (name) => ({ name, selector: { boolean: {} } });
    // nur Sensoren anbieten, die wirklich Angebote liefern
    const found = sourcesOf(this._hass, "auto").map((s) => s.entity);
    const storeNames = [...new Set([...collectOffers(this._hass, "auto").map((o) => o.store), ...(Array.isArray(this._config.stores) ? this._config.stores : [])])].sort((a, b) => a.localeCompare(b));
    const schema = [
      { name: "title", selector: { text: {} } },
      { name: "list", selector: { entity: { domain: "todo" } } },
      ...(storeNames.length ? [{ name: "stores", selector: { select: { multiple: true, mode: "dropdown", options: storeNames.map((x) => ({ value: x, label: x })) } } }] : []),
      { name: "entities", selector: { entity: { multiple: true, ...(found.length ? { include_entities: [...new Set([...found, ...(this._config.entities || [])])] } : { domain: "sensor" }) } } },
      { name: "match", selector: { select: { mode: "dropdown", options: [["word", t.m_word], ["exact", t.m_exact], ["part", t.m_part]].map(([value, label]) => ({ value, label })) } } },
      { name: "default_tab", selector: { select: { mode: "dropdown", options: [["list", t.tab_list], ["all", t.tab_all], ["watch", t.tab_watch]].map(([value, label]) => ({ value, label })) } } },
      { name: "list_view", selector: { select: { mode: "dropdown", options: [["chips", t.v_chips], ["rows", t.v_rows]].map(([value, label]) => ({ value, label })) } } },
      b("show_list_tab"),
      b("categories_open"),
      { name: "category_source", selector: { select: { mode: "dropdown", options: [["auto", t.cs_auto], ["store", t.cs_store]].map(([value, label]) => ({ value, label })) } } },
      { name: "group_by", selector: { select: { mode: "dropdown", options: [["store", t.g_store], ["category", t.g_cat]].map(([value, label]) => ({ value, label })) } } },
      { name: "all_view", selector: { select: { mode: "dropdown", options: [["tiles", t.v_tiles], ["list", t.v_list]].map(([value, label]) => ({ value, label })) } } },
      { type: "grid", name: "", schema: [b("show_images"), b("compact"), b("show_unit_price"), b("show_valid_until"), b("hide_without_offer")] },
      { name: "max_per_store", selector: { number: { min: 0, max: 500, mode: "box" } } },
      { name: "watch", selector: { text: { multiple: true } } },
      { name: "watch_list", selector: { entity: { domain: "todo" } } },
      b("notify"),
      { name: "notify_service", selector: { text: {} } },
      { name: "currency_symbol", selector: { text: {} } },
    ];
    const labels = { title: t.e_title, list: t.e_list, match: t.e_match, default_tab: t.e_tab, list_view: t.e_lview, all_view: t.e_view, group_by: t.e_group, entities: t.e_entities, stores: t.e_stores, show_list_tab: t.e_list_tab, category_source: t.e_cat_src, categories_open: t.e_cat_open, show_images: t.e_images, compact: t.e_compact, show_unit_price: t.e_unit,
      show_valid_until: t.e_until, hide_without_offer: t.e_hide_none, max_per_store: t.e_max,
      watch: t.e_watch, watch_list: t.e_watch_list, notify: t.e_notify, notify_service: t.e_notify_service, currency_symbol: t.e_symbol };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) => { this._config = e.detail.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); });
      this._hint = h("p", { style: "color:var(--secondary-text-color);font-size:.85rem;margin:12px 0 0" });
      this.append(this._form, this._hint);
    }
    this._form.hass = this._hass; this._form.schema = schema; this._form.data = { ...DEFAULTS, ...this._config };
    this._form.computeLabel = (s) => labels[s.name] || s.name;
    this._hint.textContent = t.e_sources;
  }
}

customElements.define(TAG, SmartDiscountsCard);
customElements.define(TAG + "-editor", SmartDiscountsCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: TAG, name: "SmartDiscounts", description: "Supermarket offers, matched with your shopping list", preview: true, documentationURL: "https://github.com/m3m0rex/ha_smartdiscounts-card" });
console.info(`%c SMARTDISCOUNTS-CARD %c ${VERSION} `, "background:#e39a1c;color:#111;font-weight:700", "background:#222;color:#fff");
// Test-Hilfen (reine Funktionen)
// … und für andere Karten (SmartLists zeigt damit den 🏷️-Hinweis in der Einkaufsliste)
window.SmartDiscounts = { itemName, matches, num, unitPrice, offers: (hass, sources = "auto") => collectOffers(hass, sources), dealsFor };
})();
