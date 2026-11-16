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
const VERSION = "4.0.0-beta.1";
const TAG = "smartdiscounts-card";
if (customElements.get(TAG)) return;  // schon geladen (SmartLists UND eigenes Repository installiert)

const TEXTS = {
  de: { title: "Angebote", tab_list: "Meine Liste", tab_all: "Alle Angebote", search: "Angebote durchsuchen …", no_sources: "Keine Angebots-Sensoren gefunden. Installiere z. B. die REWE-, EDEKA- oder Lidl-Integration von FaserF oder trage unter „sources“ einen eigenen Sensor ein.",
    no_list: "Keine Liste gewählt – trage in der Karte unter „list“ eine To-do-Liste ein, um Angebote mit ihr abzugleichen.", list_empty: "Die Liste ist leer.", none: "kein Angebot", offers: "Angebote", offer1: "Angebot",
    on_offer: "{n} von {m} Artikeln im Angebot", cheapest: "Günstigste wählen", only: "nur {store}", chosen: "{n} gewählt", sum: "Summe", apply: "In Liste übernehmen", applied: "✓ übernommen", pick_hint: "Preis antippen, um ein Angebot zu wählen",
    until: "bis", today: "nur noch heute", expired: "abgelaufen", add: "Auf die Liste", added: "✓ auf der Liste", all: "alle", less: "weniger", on_list: "steht auf deiner Liste", best: "günstigster", item: "Artikel",
    no_hits: "Nichts gefunden.", all_cats: "Alle Kategorien", error: "Das hat nicht geklappt.", attached: "Angebot gewählt", stand: "Stand", in_offer: "im Angebot", without: "ohne Angebot",
    e_title: "Titel", e_list: "Einkaufsliste (To-do)", e_match: "Artikel passt zum Angebot, wenn", m_word: "ganzes Wort im Namen (Butter ≠ Butterkeks)", m_exact: "nur genau dieses Wort", m_part: "Teil des Namens",
    e_tab: "Start-Reiter", e_images: "Bilder", e_compact: "Kompakte Zeilen", e_unit: "Grundpreis (€/kg, €/l)", e_until: "Gültig bis", e_hide_none: "Artikel ohne Angebot ausblenden", e_max: "Angebote je Markt (Reiter „Alle“)",
    e_sources: "Quellen werden automatisch erkannt. Eigene Sensoren und Feld-Zuordnung: im Code-Editor unter „sources“ (siehe README)." },
  en: { title: "Offers", tab_list: "My list", tab_all: "All offers", search: "Search offers …", no_sources: "No offer sensors found. Install e.g. FaserF's REWE, EDEKA or Lidl integration or add your own sensor under \"sources\".",
    no_list: "No list selected – set a to-do list under \"list\" to match offers against it.", list_empty: "The list is empty.", none: "no offer", offers: "offers", offer1: "offer",
    on_offer: "{n} of {m} items on offer", cheapest: "Pick cheapest", only: "only {store}", chosen: "{n} selected", sum: "Total", apply: "Apply to list", applied: "✓ applied", pick_hint: "Tap a price to pick an offer",
    until: "until", today: "today only", expired: "expired", add: "Add to list", added: "✓ on the list", all: "all", less: "less", on_list: "is on your list", best: "cheapest", item: "Item",
    no_hits: "Nothing found.", all_cats: "All categories", error: "That did not work.", attached: "offer selected", stand: "as of", in_offer: "on offer", without: "no offer",
    e_title: "Title", e_list: "Shopping list (to-do)", e_match: "Item matches an offer if", m_word: "whole word in the name (butter ≠ butter biscuit)", m_exact: "exactly this word only", m_part: "part of the name",
    e_tab: "Start tab", e_images: "Images", e_compact: "Compact rows", e_unit: "Unit price (€/kg, €/l)", e_until: "Valid until", e_hide_none: "Hide items without an offer", e_max: "Offers per store (\"All\" tab)",
    e_sources: "Sources are detected automatically. Own sensors and field mapping: in the code editor under \"sources\" (see README)." },
};
const DEFAULTS = { list: "", match: "word", default_tab: "list", show_images: true, compact: false, show_unit_price: true, show_valid_until: true, hide_without_offer: false, max_per_store: 12, sources: "auto" };
// bekannte Märkte: Erkennung über entity_id / Namen der Quelle, Farbe des Badges
const STORES = [["rewe", "REWE", "#cc071e"], ["edeka", "EDEKA", "#f5c400"], ["lidl", "Lidl", "#0050aa"], ["aldi_sued", "ALDI Süd", "#00a0e0"], ["aldi_nord", "ALDI Nord", "#1a4d9f"], ["aldi", "ALDI", "#00549f"],
  ["norma", "Norma", "#d40f14"], ["penny", "Penny", "#cd1414"], ["kaufland", "Kaufland", "#e10915"], ["netto", "Netto", "#ffd400"], ["rossmann", "Rossmann", "#c3002d"], ["dm", "dm", "#002878"], ["globus", "Globus", "#f39200"]];
// Feldnamen der Angebote: der erste vorhandene zählt (je Quelle mit `map:` überschreibbar)
const FIELDS = { name: ["product", "title", "name", "product_name", "description"], price: ["price", "discount_price", "offer_price", "price_euro", "current_price"],
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
  .filters { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,180px); gap:8px; }
  @container (max-width: 480px) { .filters { grid-template-columns:1fr !important; } }
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
    this._tab = this._config.default_tab === "all" ? "all" : "list";
    this._sel = {};       // Artikel-UID → gewähltes Angebot
    this._open = new Set();
    this._query = ""; this._cat = "";
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

  _sources() {
    const st = this._hass.states, cfg = this._config.sources;
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
  _storeOf(src, state) {
    const hay = norm(`${src.entity} ${state.attributes.friendly_name || ""}`).replace(/[^a-z0-9]+/g, "_");
    const known = STORES.find(([key]) => hay.includes(key));
    const label = src.store || (known && known[1]) || String(state.attributes.friendly_name || src.entity).replace(/\s*(offers?|angebote|discounts?)\s*$/i, "");
    const k2 = STORES.find(([, l]) => norm(l) === norm(label));
    return { label, color: src.color || (k2 && k2[2]) || (known && known[2]) || "#6b7280" };
  }
  // alle Angebote aller Quellen, vereinheitlicht
  _offers() {
    const out = [];
    const today = new Date().toISOString().slice(0, 10);
    for (const src of this._sources()) {
      const state = this._hass.states[src.entity];
      const attr = src.attribute || LIST_ATTRS.find((a) => Array.isArray(state.attributes[a]));
      const rows = get(state.attributes, attr);
      if (!Array.isArray(rows)) continue;
      const store = this._storeOf(src, state);
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
  _money(v) { try { return new Intl.NumberFormat(this._hass.language || "de", { style: "currency", currency: this._config.currency || "EUR" }).format(v); } catch (e) { return `${v.toFixed(2)} €`; } }
  _day(d) { const p = String(d || "").split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : d || ""; }
  _unitLabel(o) { return o.unit ? `${this._money(o.unit.value)}/${o.unit.unit}` : ""; }
  // günstiger: nach Grundpreis, wenn beide denselben haben – sonst nach Preis
  _cmp(a, b) { return a.unit && b.unit && a.unit.unit === b.unit.unit ? a.unit.value - b.unit.value || a.price - b.price : a.price - b.price; }

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
    const ids = [...this._sources().map((s) => s.entity), this._config.list].filter(Boolean);
    const sig = ids.map((e) => (st[e] ? st[e].last_updated || st[e].state : "")).join("|") + "|" + (this._hass.language || "");
    if (!force && sig === this._sig) return;
    this._sig = sig;
    this._all = this._offers();
    await this._loadList();
    this._render();
  }
  _matchesFor(item) {
    if (!item.name) return [];
    const byStore = new Map();
    for (const o of this._all) {
      if (!matches(item.name, o.name, this._config.match)) continue;
      const cur = byStore.get(o.store);
      if (!cur || this._cmp(o, cur) < 0) byStore.set(o.store, o);  // je Markt das günstigste passende Angebot
    }
    return [...byStore.values()].sort((a, b) => this._cmp(a, b));
  }
  _attached(item) { return /[⚙⚙]️?\s*OFFER\s*:|🏷️/.test(item.note || ""); }

  _render() {
    const t = this._t, c = this._config;
    const stores = [...new Set(this._all.map((o) => o.store))];
    const head = h("div", { class: "head" }, h("h1", {}, c.title || t.title), h("small", {}, `${this._all.length} ${t.offers} · ${stores.length ? stores.join(", ") : "–"}`));
    const tabs = h("div", { class: "tabs" }, [["list", "📝 " + t.tab_list], ["all", t.tab_all]].map(([v, l]) =>
      h("button", { type: "button", class: this._tab === v ? "on" : "", onclick: () => { this._tab = v; this._render(); } }, l)));
    const body = !this._all.length ? h("div", { class: "msg" }, t.no_sources) : this._tab === "list" ? this._renderList(stores) : this._renderAll(stores);
    this._card.className = `wrap ${c.compact ? "compact" : ""} ${c.show_images ? "" : "noimg"}`;
    this._card.replaceChildren(head, tabs, body);
  }
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
    const isCheapest = hit.length && hit.every((r) => this._sel[r.it.uid] && this._sel[r.it.uid].id === r.offers[0].id);
    const plan = h("div", { class: "plan" }, h("b", {}, "💡 " + t.on_offer.replace("{n}", hit.length).replace("{m}", items.length)),
      hit.length ? h("div", { class: "chips" },
        h("button", { type: "button", class: `chip ${isCheapest ? "on" : ""}`, onclick: () => choose((r) => r.offers[0]) }, "★ " + t.cheapest),
        cover.map(([s, n]) => { const col = (this._all.find((o) => o.store === s) || {}).color;
          const on = hit.some((r) => r.offers.some((o) => o.store === s)) && hit.every((r) => { const o = r.offers.find((x) => x.store === s); return o ? this._sel[r.it.uid] && this._sel[r.it.uid].id === o.id : !this._sel[r.it.uid]; });
          return h("button", { type: "button", class: `chip ${on ? "on" : ""}`, onclick: () => choose((r) => r.offers.find((o) => o.store === s)) }, h("span", { class: "dot", style: `background:${col}` }), `${t.only.replace("{store}", s)} · ${n}`); })) : null);
    const line = (r) => {
      const { it, offers } = r, sel = this._sel[it.uid];
      if (!offers.length && c.hide_without_offer) return null;
      const img = sel ? sel.image : offers[0] && offers[0].image;
      return h("div", { class: "it" },
        h("div", { class: "top" }, c.show_images ? h("div", { class: "thumb", style: img ? `background-image:url("${String(img).replace(/"/g, "%22")}");background-color:#fff` : null }, img ? null : "🛒") : null,
          h("div", { class: "n" }, it.name || it.text, sel ? [" ", this._storeBadge(sel)] : null, sel ? h("small", {}, sel.name) : it.text !== it.name ? h("small", {}, it.text) : null),
          sel ? h("span", { class: "st ok" }, this._money(sel.price)) : this._attached(it) ? h("span", { class: "st ok" }, "🏷️ " + t.attached)
            : h("span", { class: "st" }, offers.length ? `${offers.length} ${offers.length > 1 ? t.offers : t.offer1}` : t.none)),
        offers.length ? h("div", { class: "prices" }, offers.map((o, i) => this._priceChip(it, o, i === 0 && offers.length > 1))) : null);
    };
    // breite Karte: Tabelle Artikel × Märkte
    const mstores = cover.map(([s]) => s);
    const mx = h("div", { class: `mx ${mstores.length > 1 ? "has" : ""}`, style: `grid-template-columns:minmax(150px,1.4fr) repeat(${mstores.length}, minmax(110px,1fr))` },
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
    return h("div", {}, plan, mx, h("div", { class: "rows" }, rows.map(line)), sum, this._foot());
  }
  _renderAll(stores) {
    const t = this._t, c = this._config;
    const cats = [...new Set(this._all.map((o) => o.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const names = (this._items || []).map((i) => i.name).filter(Boolean);
    const onList = (o) => names.some((n) => matches(n, o.name, c.match));
    const q = norm(this._query);
    const shown = this._all.filter((o) => (!q || norm(`${o.name} ${o.brand} ${o.category} ${o.store}`).includes(q)) && (!this._cat || o.category === this._cat));
    const search = h("input", { class: "search", type: "search", placeholder: t.search, "aria-label": t.search, value: this._query });
    search.addEventListener("input", () => { this._query = search.value; const pos = search.selectionStart; this._render();
      const f = this._card.querySelector("input.search"); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* */ } } });
    const catSel = cats.length ? h("select", { class: "cat", "aria-label": t.all_cats, onchange: (e) => { this._cat = e.target.value; this._render(); } },
      h("option", { value: "" }, t.all_cats), cats.map((x) => h("option", { value: x, selected: x === this._cat }, x))) : null;
    const tile = (o) => {
      const mine = onList(o);
      return h("div", { class: "tl", title: o.name }, o.pct ? h("span", { class: "pctb" }, `−${o.pct}%`) : null, mine ? h("span", { class: "on", title: t.on_list }, "📝") : null,
        c.show_images ? h("div", { class: "img", style: o.image ? `background-image:url("${String(o.image).replace(/"/g, "%22")}")` : "background:none" }) : null,
        h("div", { class: "t" }, o.name), h("div", {}, h("b", {}, this._money(o.price)), o.old ? h("s", { style: "margin-left:4px;font-size:.7rem;opacity:.7" }, this._money(o.old)) : null),
        h("div", { class: "x" }, [c.show_unit_price ? this._unitLabel(o) : "", c.show_valid_until && o.until ? (o.today ? t.today : `${t.until} ${this._day(o.until)}`) : ""].filter(Boolean).join(" · ") || " "),
        c.list ? h("button", { type: "button", class: "btn", onclick: (e) => this._add(o, e.currentTarget) }, "＋ " + t.add) : null);
    };
    const shelves = stores.map((s) => {
      const all = shown.filter((o) => o.store === s);
      if (!all.length) return null;
      // Angebote für die eigene Liste zuerst
      const sorted = [...all.filter(onList), ...all.filter((o) => !onList(o))];
      const open = this._open.has(s) || !!q || !!this._cat;
      const list = open ? sorted : sorted.slice(0, c.max_per_store);
      return h("div", { class: "shelf" }, h("h4", {}, this._storeBadge(all[0]), h("small", {}, `${all.length} ${t.offers}`), h("span", { class: "sp" }),
        all.length > c.max_per_store && !q && !this._cat ? h("button", { type: "button", onclick: () => { if (open) this._open.delete(s); else this._open.add(s); this._render(); } }, open ? t.less : `${t.all} →`) : null),
        h("div", { class: `rail ${open ? "open" : ""}` }, list.map(tile)));
    });
    return h("div", {}, h("div", { class: "filters", style: catSel ? null : "grid-template-columns:1fr" }, search, catSel), shown.length ? shelves : h("div", { class: "msg" }, t.no_hits), this._foot());
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
    return `🏷️ ${o.store} · ${this._money(o.price)}${o.until ? ` · ${this._t.until} ${this._day(o.until)}` : ""} · ${o.name}`;
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
  async _add(o, btn) {
    btn.disabled = true;
    try {
      await this._hass.callService("todo", "add_item", { item: o.name, description: this._offerNote(o) }, { entity_id: this._config.list });
      btn.textContent = this._t.added; btn.classList.add("done");
      this._sig = null; await this._loadList();
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
    const schema = [
      { name: "title", selector: { text: {} } },
      { name: "list", selector: { entity: { domain: "todo" } } },
      { name: "match", selector: { select: { mode: "dropdown", options: [["word", t.m_word], ["exact", t.m_exact], ["part", t.m_part]].map(([value, label]) => ({ value, label })) } } },
      { name: "default_tab", selector: { select: { mode: "dropdown", options: [["list", t.tab_list], ["all", t.tab_all]].map(([value, label]) => ({ value, label })) } } },
      { type: "grid", name: "", schema: [b("show_images"), b("compact"), b("show_unit_price"), b("show_valid_until"), b("hide_without_offer")] },
      { name: "max_per_store", selector: { number: { min: 3, max: 100, mode: "box" } } },
    ];
    const labels = { title: t.e_title, list: t.e_list, match: t.e_match, default_tab: t.e_tab, show_images: t.e_images, compact: t.e_compact, show_unit_price: t.e_unit,
      show_valid_until: t.e_until, hide_without_offer: t.e_hide_none, max_per_store: t.e_max };
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
window.SmartDiscounts = { itemName, matches, num, unitPrice };
})();
