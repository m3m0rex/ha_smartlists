const PANEL_STYLE = `
  :host { display:block; min-height:100vh; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color); }
  .toolbar { display:flex; align-items:center; gap:4px; height:56px; padding:0 12px; box-sizing:border-box;
    background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, var(--text-primary-color,#fff));
    font-size:20px; position:sticky; top:0; z-index:3; }
  .toolbar .title { flex:1; margin-left:8px; }
  .toolbar button { background:none; border:none; color:inherit; width:40px; height:40px; border-radius:50%; cursor:pointer;
    display:flex; align-items:center; justify-content:center; }
  .toolbar button:hover, .toolbar button.on { background:rgba(255,255,255,.18); }
  .viewpop { position:fixed; top:58px; right:12px; z-index:6; width:270px; max-width:calc(100vw - 24px); box-sizing:border-box;
    background:var(--card-background-color,#fff); color:var(--primary-text-color); border:1px solid var(--divider-color,#ddd);
    border-radius:14px; box-shadow:0 12px 30px rgba(0,0,0,.35); padding:6px 0; }
  .viewpop h5 { margin:6px 14px 4px; font-size:.72rem; color:var(--secondary-text-color); font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
  .vopt { display:flex; align-items:center; gap:12px; padding:9px 14px; font-size:.9rem; cursor:pointer; width:100%; box-sizing:border-box;
    background:none; border:0; color:inherit; font-family:inherit; text-align:left; }
  .vopt > span:first-child { flex:1; } .vopt small { display:block; color:var(--secondary-text-color); font-size:.74rem; }
  .vopt:hover, .vbtn.on { background:var(--secondary-background-color,#f2f2f2); }
  .vsw { position:relative; width:36px; height:20px; flex:none; } .vsw input { position:absolute; inset:0; opacity:0; margin:0; cursor:pointer; }
  .vsw i { position:absolute; inset:0; border-radius:10px; background:var(--disabled-color,#bdbdbd); transition:background .15s; }
  .vsw i::after { content:""; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .15s; }
  .vsw input:checked + i { background:var(--primary-color,#03a9f4); } .vsw input:checked + i::after { left:18px; }
  .ptabs { display:flex; gap:4px; padding:0 12px; overflow-x:auto; scrollbar-width:none; position:sticky; top:56px; z-index:3;
    background:var(--app-header-background-color, var(--primary-color)); }
  .ptab { flex:none; background:none; border:none; border-bottom:2px solid transparent; padding:10px 14px; font:inherit; font-size:.95rem; cursor:pointer;
    color:var(--app-header-text-color, var(--text-primary-color,#fff)); opacity:.75; }
  .ptab.on { opacity:1; border-bottom-color:currentColor; font-weight:500; }
  .ptabs:empty { display:none; }
  .chips { display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px; scrollbar-width:none; margin:0 auto; box-sizing:border-box; }
  .chip { flex:none; display:flex; align-items:center; gap:6px; border:1px solid var(--divider-color,#ddd); background:var(--card-background-color,#fff);
    border-radius:18px; padding:6px 12px; font:inherit; font-size:.9rem; cursor:pointer; color:var(--primary-text-color); white-space:nowrap; }
  .chip.on { background:var(--primary-color); border-color:var(--primary-color); color:var(--text-primary-color,#fff); }
  .chip .n { font-size:.75rem; opacity:.75; }
  .hint { font-size:.8rem; color:var(--secondary-text-color); padding:2px 16px 0; margin:0 auto; box-sizing:border-box; }
  .content { margin:0 auto; padding:8px 16px 32px; box-sizing:border-box; display:grid; gap:16px; align-items:start; }
  .w-normal { max-width:760px; } .w-wide { max-width:none; } .w-settings { max-width:1180px; }
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
const ICON_PHONE = "M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1M12,14L8,10H11V6H13V10H16L12,14Z";

/* ---------------- Als App auf dem Startbildschirm (PWA, siehe pwa.py) ----------------
 * Auf /smartlists zeigt der Manifest-Link auf das SmartLists-Manifest (Start: gewählte Liste, auf Wunsch im
 * Einkaufsmodus); beim Verlassen der Seite wieder auf das von Home Assistant. */
let SL_INSTALL = null;  // Chrome/Edge: „App installieren“ (beforeinstallprompt), sonst Anleitung
window.addEventListener("beforeinstallprompt", (e) => { SL_INSTALL = e; });
const slStandalone = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } };
const slCompanion = () => /Home ?Assistant\//i.test(navigator.userAgent || "");  // App von HA: hat eigene Widgets
const slPlatform = () => { const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/i.test(ua) ? "android" : "other"; };
function slAppUrl(list, shop) {
  const q = new URLSearchParams({ app: "1" });
  if (list) q.set("list", list);
  if (shop) q.set("shopping", "1");
  return q.toString();
}
function slSetHeadLink(rel, href, keep) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.append(el); keep[rel] = null; }
  else if (!(rel in keep)) keep[rel] = el.getAttribute("href");
  if (el.getAttribute("href") !== href) el.setAttribute("href", href);
}
function slRestoreHeadLinks(keep) {
  for (const [rel, href] of Object.entries(keep)) {
    const el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) continue;
    if (href == null) el.remove(); else el.setAttribute("href", href);
  }
}
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
    // Start als App vom Startbildschirm: /smartlists?app=1&list=todo.x&shopping=1
    let q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { q = null; }
    this._appMode = !!q && q.get("app") === "1";
    // Sprung aus der Integration (Konfigurieren → Einstellungen): /smartlists?settings=global
    if (q && ["global", "stats"].includes(q.get("settings"))) {
      this._settingsOpen = q.get("settings");
      try { const u = new URL(window.location.href); u.searchParams.delete("settings"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
    }
    this._startShop = !!q && q.get("shopping") === "1";
    this._headKeep = {};
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
    // auch „nicht verfügbar → verfügbar“ zählt: beim Neuladen der Integration (neue Liste angelegt/übernommen) sind die
    // Listen kurz nicht verfügbar – ohne das blieb eine in diesem Moment geholte Auswahl bis zum Neuladen der Seite veraltet
    const key = Object.keys(st).filter((e) => e.startsWith("todo.")).sort().map((e) => (st[e].state === "unavailable" ? "!" : "") + e).join(",");
    if (key === this._visibleKey) return;
    this._visibleKey = key;
    this._hass.callWS({ type: "smartlists/lists" }).then((r) => { this._visible = new Map(r.lists.map((l) => [l.entity_id, l.type])); this._render(); })
      .catch(() => { this._visible = null; });
    // Extras (Wochenplan ein/aus) – ohne Antwort: wie bisher anzeigen
    this._hass.callWS({ type: "smartlists/config" }).then((r) => { this._features = r.features || null; this._render(); })
      .catch(() => { this._features = null; });
    // kombinierte Listen aus der App, die noch nicht in HA verbunden sind (Chip „verbinden“)
    this._hass.callWS({ type: "smartlists/app_lists" }).then((r) => { this._appLists = r.lists.filter((l) => !l.connected); this._render(); })
      .catch(() => { this._appLists = []; });
  }
  get _t() { return TEXTS[slLang(this._hass)] || TEXTS.en; }
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
    // Sprung aus der Integration („Besuchen“ beim Gerät der Liste): /smartlists?list=todo.…
    if (this._wantList === undefined) {
      try { this._wantList = new URLSearchParams(window.location.search).get("list") || null; } catch (e) { this._wantList = null; }
    }
    if (this._wantList && lists.some((l) => l.e === this._wantList)) {
      this._prefs.selected = this._prefs.columns ? [...this._prefs.selected.filter((e) => e !== this._wantList), this._wantList] : [this._wantList];
      this._prefs.tab = "lists"; this._settingsOpen = false; this._wantList = null; this._save();
      // als App gestartet: Adresse so lassen (sonst landet ein Neuladen bzw. „Zum Home-Bildschirm“ woanders)
      if (!this._appMode) try { const u = new URL(window.location.href); u.searchParams.delete("list"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
    }
    if (this._pendingSelect) {
      const hit = lists.find((l) => l.name === this._pendingSelect);
      if (hit) { this._pendingSelect = null; this._prefs.selected = this._prefs.columns ? [...this._prefs.selected, hit.e] : [hit.e]; this._save(); }
    }
    // beliebig viele Listen; Reihenfolge der Spalten = Reihenfolge der Chips
    const pos = new Map(lists.map((l, i) => [l.e, i]));
    // Gemerkte Auswahl NICHT überschreiben: Beim Laden oder Neuladen der Integration fehlt eine Liste oft kurz
    // (noch nicht da / „nicht verfügbar“). Früher wurde dann die erste Liste gewählt und gespeichert – danach
    // stand eine andere Liste da als eingestellt. Jetzt wird nur angezeigt, gemerkt bleibt die Wahl.
    const stored = Array.isArray(this._prefs.selected) ? this._prefs.selected : [];
    let sel = (this._prefs.columns ? stored : stored.slice(0, 1)).filter((e) => pos.has(e)).sort((a, b) => pos.get(a) - pos.get(b));
    if (!sel.length && lists.length) sel = [lists[0].e];
    this._effSel = sel;
    this._syncApp(sel);
    if (!this._root) {
      this._chipsEl = h("div", { class: "chips", role: "tablist" });
      this._hintEl = h("div", { class: "hint" });
      this._contentEl = h("div", { class: "content" });
      const t = this._t;
      this._menuBtn = h("button", { type: "button", "aria-label": "Menu", title: "Menu",
        onclick: () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })) }, svg(ICON_MENU, 24));
      this._newBtn = h("button", { type: "button", title: this._t.new_list, "aria-label": this._t.new_list, onclick: () => this._newList() }, svg(ICON.plus, 22));
      // Einstellungen: dieselbe Ansicht wie im Zahnrad der Karte, aber auf der ganzen Seite
      this._gearBtn = h("button", { type: "button", title: t.p_settings, "aria-label": t.p_settings,
        onclick: () => { this._settingsOpen = this._settingsOpen === "global" ? false : "global"; this._render(); } }, svg(ICON.gear, 22));
      this._statsBtn = h("button", { type: "button", title: t.stats, "aria-label": t.stats,
        onclick: () => { this._settingsOpen = this._settingsOpen === "stats" ? false : "stats"; this._render(); } }, svg(ICON.chart, 22));
      // Tabs wie in Home Assistant: Listen | Wochenplan
      this._tabsEl = h("div", { class: "ptabs", role: "tablist" });
      // aufgeräumt (Handy): Spalten, Breite und Reihenfolge stecken im Menü „Ansicht“; 📲 im Zahnrad der Liste
      this._viewBtn = h("button", { type: "button", title: t.p_view, "aria-label": t.p_view, "aria-haspopup": "true",
        onclick: (e) => { e.stopPropagation(); this._viewOpen = !this._viewOpen; this._renderView(); } }, svg(ICON_COLUMNS, 22));
      this._viewEl = h("div", { class: "viewpop", role: "menu", hidden: true, onclick: (e) => e.stopPropagation() });
      document.addEventListener("click", () => { if (this._viewOpen) { this._viewOpen = false; this._renderView(); } });
      this._root = h("div", {}, h("div", { class: "toolbar" }, this._menuBtn, h("span", { class: "title" }, "SmartLists"), this._newBtn, this._viewBtn, this._statsBtn, this._gearBtn),
        this._viewEl, this._tabsEl, this._chipsEl, this._hintEl, this._contentEl);
      this.shadowRoot.replaceChildren(h("style", {}, PANEL_STYLE), this._root);
    }
    this._menuBtn.hidden = !this._narrow;
    const planOn = !this._features || this._features.mealplan !== false;
    const tab = this._settingsOpen ? null : (planOn && this._prefs.tab) || "lists";
    // nur ein Tab (Wochenplan unter Extras aus) → keine Tab-Leiste
    fill(this._tabsEl, this._settingsOpen || !planOn ? null : [["lists", "📋 " + this._t.p_tab_lists], ["plan", "🗓️ " + this._t.mp_title]].map(([id, label]) =>
      h("button", { type: "button", role: "tab", class: `ptab ${tab === id ? "on" : ""}`, "aria-selected": String(tab === id),
        onclick: () => { this._prefs.tab = id; this._save(); this._render(); } }, label)));
    this._gearBtn.classList.toggle("on", this._settingsOpen === "global");
    this._gearBtn.setAttribute("aria-pressed", String(this._settingsOpen === "global"));
    // 📊 nur, wenn Statistik und Ausgaben unter Extras an sind
    const statsOn = !this._features || this._features.stats !== false;
    this._statsBtn.hidden = !statsOn;
    if (!statsOn && this._settingsOpen === "stats") this._settingsOpen = false;
    this._statsBtn.classList.toggle("on", this._settingsOpen === "stats");
    [this._newBtn, this._viewBtn].forEach((b) => { b.hidden = !!this._settingsOpen || tab === "plan"; });
    this._viewBtn.classList.toggle("on", !!(this._viewOpen || this._ordering));
    if (this._settingsOpen) {
      // Allgemeine Einstellungen (Für mich / Global / Auswertung). Was nur eine Liste betrifft, steht im Zahnrad der Karte.
      if (!lists.some((l) => l.e === this._settingsEntity)) this._settingsEntity = sel[0] || (lists[0] && lists[0].e);
      const entity = this._settingsEntity;
      if (!entity) { fill(this._contentEl, h("div", { class: "empty" }, this._t.p_empty)); return; }
      const scope = this._settingsOpen === "stats" ? "stats" : "global";
      if (!this._settingsCard || this._settingsCard._config.entity !== entity || this._settingsCard._config.settings_scope !== scope) {
        this._settingsCard = document.createElement("smartlists-card");
        this._settingsCard.setConfig({ entity, settings_only: true, settings_scope: scope });
      }
      this._settingsCard.hass = this._hass;
      fill(this._chipsEl); fill(this._hintEl);
      this._contentEl.className = "content w-settings cols-1";
      if (this._contentEl.firstChild !== this._settingsCard) fill(this._contentEl, this._settingsCard);
      return;
    }
    if (tab === "plan") {
      // Wochenplan direkt auf der Seite; „Zutaten auf die Liste“ geht standardmäßig an die gewählte Liste
      if (!this._planCard) {
        this._planCard = document.createElement("smartlists-card");
        this._planCard.setConfig({ view: "mealplan", entity: sel[0] || (lists[0] && lists[0].e) || "" });
      }
      this._planCard.hass = this._hass;
      fill(this._chipsEl); fill(this._hintEl);
      this._contentEl.className = "content w-normal cols-1";
      if (this._contentEl.firstChild !== this._planCard) fill(this._contentEl, this._planCard);
      return;
    }
    this._renderView();
    const width = this._prefs.wide || this._prefs.columns ? "w-wide" : "w-normal";
    [this._chipsEl, this._hintEl].forEach((e) => { e.className = e.className.split(" ")[0] + " " + width; });
    const chip = (l, i, group) => {
      const el = h("button", { type: "button", role: "tab", class: `chip ${sel.includes(l.e) ? "on" : ""} ${this._ordering ? "ordering" : ""}`,
        "aria-selected": String(sel.includes(l.e)), draggable: "true", onclick: () => { if (!this._ordering) this._select(l.e); } },
        this._ordering && i > 0 ? h("span", { class: "mv", role: "button", "aria-label": this._t.p_left, title: this._t.p_left,
          onclick: (e) => { e.stopPropagation(); this._move(lists, l.e, group[i - 1].e, false); } }, "◀") : null,
        l.notes ? "📝 " : "", chipName(l.name), h("span", { class: "n" }, String(l.open)),
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
        c.setConfig({ entity: e, settings_scope: "list", ...(this._startShop ? { start_shopping: true } : {}) });
        c.hass = this._hass;
        this._cards.set(e, c);
      }
      return this._cards.get(e);
    });
    this._contentEl.className = `content ${width} cols-${Math.min(cards.length, this._prefs.wide ? 4 : 3)}`;
    const current = [...this._contentEl.childNodes];
    if (current.length !== cards.length || current.some((n, i) => n !== cards[i])) fill(this._contentEl, ...cards);
    if (this._startShop && !this._wantList) this._startShop = false;  // nur beim Start als App
  }
  // Menü „Ansicht“: mehrere Listen nebeneinander, breite Ansicht, Reihenfolge der Listen
  _renderView() {
    if (!this._viewEl) return;
    const t = this._t;
    this._viewEl.hidden = !this._viewOpen;
    if (!this._viewOpen) return;
    const sw = (on, label, sub, fn) => h("label", { class: "vopt" }, h("span", {}, label, sub ? h("small", {}, sub) : null),
      h("span", { class: "vsw" }, h("input", { type: "checkbox", checked: !!on, "aria-label": label, onchange: (e) => fn(e.target.checked) }), h("i")));
    fill(this._viewEl, h("h5", {}, t.p_view),
      sw(this._prefs.columns, t.p_columns, t.p_columns_sub, (v) => { this._prefs.columns = v; this._save(); this._render(); }),
      sw(this._prefs.wide, t.p_wide, t.p_wide_sub, (v) => { this._prefs.wide = v; this._save(); this._render(); }),
      h("button", { type: "button", class: `vopt vbtn ${this._ordering ? "on" : ""}`, onclick: () => { this._ordering = !this._ordering; this._viewOpen = false; this._render(); } },
        h("span", {}, this._ordering ? t.p_order_done : t.p_order), svg(ICON.sort, 18)));
  }
  connectedCallback() {
    this._attached = true; if (this._effSel) this._syncApp(this._effSel);
    window.__smartlistsPanel = this;  // die Karte bietet „Als App speichern“ nur auf dieser Seite an
    if (!this._onAppReq) {
      this._onAppReq = (e) => this._appDialog(e.detail && e.detail.list);
      window.addEventListener("smartlists-app-dialog", this._onAppReq);
    }
  }
  disconnectedCallback() {
    this._attached = false; slRestoreHeadLinks(this._headKeep); this._headKeep = {};
    if (window.__smartlistsPanel === this) window.__smartlistsPanel = null;
  }
  // Manifest der Seite: „Installieren“/„Zum Startbildschirm“ öffnet direkt die gewählte Liste
  _syncApp(sel) {
    if (this._attached === false) return;
    const prefs = this._prefs.app || {};
    const list = prefs.list && this._hass && this._hass.states[prefs.list] ? prefs.list : sel[0];
    const shop = prefs.shopping !== false;
    const name = list && this._hass && this._hass.states[list] ? this._hass.states[list].attributes.friendly_name || "" : "";
    slSetHeadLink("manifest", `/smartlists-files/app.webmanifest?${slAppUrl(list, shop)}${name ? "&name=" + encodeURIComponent(name) : ""}`, this._headKeep);
    slSetHeadLink("apple-touch-icon", "/smartlists-files/brand/icon@2x.png", this._headKeep);
  }
  // 📲 Als App auf dem Startbildschirm speichern: Liste und Einkaufsmodus wählen, dann installieren bzw. Anleitung
  _appDialog(preset) {
    const t = this._t;
    const lists = this._lists().filter((l) => !l.notes);
    const prefs = { list: preset || (this._prefs.app && this._prefs.app.list) || (this._effSel || [])[0] || (lists[0] && lists[0].e) || "", shopping: !(this._prefs.app && this._prefs.app.shopping === false) };
    const platform = slPlatform();
    const apply = () => {
      this._prefs.app = { ...prefs }; this._save(); this._syncApp(this._effSel || []);
      // iOS nimmt beim „Zum Home-Bildschirm“ die aktuelle Adresse → passend setzen
      try { window.history.replaceState(window.history.state, "", `${window.location.pathname}?${slAppUrl(prefs.list, prefs.shopping)}`); this._appMode = true; } catch (e) { /* */ }
    };
    const box = h("input", { type: "checkbox", checked: prefs.shopping, onchange: (e) => { prefs.shopping = e.target.checked; apply(); } });
    box.checked = prefs.shopping;
    const steps = { ios: t.app_ios, android: t.app_android, other: t.app_other }[platform];
    const close = () => back.remove();
    const install = SL_INSTALL ? h("button", { type: "button", class: "ok", onclick: async () => {
      apply();
      try { await SL_INSTALL.prompt(); SL_INSTALL = null; close(); } catch (e) { /* Anleitung bleibt sichtbar */ }
    } }, "📲 " + t.app_install) : null;
    const back = h("div", { class: "dlg-back", onclick: (ev) => { if (ev.target === back) close(); } },
      h("style", {}, DIALOG_STYLE + `.dlg label{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:.95rem}
        .dlg select{width:100%;height:42px;border-radius:10px;border:1px solid var(--divider-color,#ccc);background:var(--secondary-background-color,#f2f2f2);color:inherit;font:inherit;padding:0 10px;margin:0 0 12px}
        .dlg ol{margin:0 0 14px;padding-left:20px;font-size:.9rem;line-height:1.5}.dlg input[type=checkbox]{width:20px;height:20px;margin:0}`),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.app_title },
        h("h2", {}, "📲 " + t.app_title),
        h("p", {}, t.app_lead),
        h("select", { "aria-label": t.app_list, onchange: (e) => { prefs.list = e.target.value; apply(); } },
          lists.map((l) => h("option", { value: l.e, selected: l.e === prefs.list }, l.name))),
        h("label", {}, box, t.app_shop),
        h("ol", {}, steps.split("\n").map((x) => h("li", {}, x))),
        h("div", { class: "row" }, h("button", { type: "button", onclick: close }, t.app_close), install)));
    apply();
    this.shadowRoot.append(back);
  }
  _select(entity) {
    // Basis: was gerade zu sehen ist; gemerkte, gerade fehlende Listen bleiben dahinter erhalten
    const sel = this._effSel || this._prefs.selected || [];
    const away = (this._prefs.selected || []).filter((e) => !sel.includes(e) && !(this._hass && this._hass.states[e] && this._hass.states[e].state !== "unavailable"));
    if (!this._prefs.columns) this._prefs.selected = [entity];
    else if (sel.includes(entity)) { if (sel.length > 1) this._prefs.selected = [...sel.filter((e) => e !== entity), ...away]; }
    else this._prefs.selected = [...sel, entity, ...away];
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



