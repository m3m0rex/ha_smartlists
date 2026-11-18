class SmartListsCard extends HTMLElement {
  setConfig(config) {
    const many = Array.isArray(config && config.entities) ? config.entities.filter(Boolean) : [];
    if (!config || (!config.entity && !many.length && config.view !== "mealplan")) throw new Error("Please set 'entity' (one list) or 'entities' (several).");
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
    // Verbindung weg/wieder da: Hinweis zeigen bzw. gesammelte Änderungen senden
    if (hass.connection && this._offConn !== hass.connection) {
      this._offConn = hass.connection;
      hass.connection.addEventListener("ready", () => { this._render(); this._flushOffline(); });
      hass.connection.addEventListener("disconnected", () => this._render());
    }
    if (first && this._offQueue().length) setTimeout(() => this._flushOffline(), 1500);
    if (this._config.view === "mealplan") { this._renderMealPlanView(); return; }
    if (first || !this._cfg) this._loadConfig();
    if (first) this._loadUserUi();
    this._subscribe();
    const st = hass.states && hass.states[this._config.entity];
    const rev = st ? `${st.state}|${st.last_updated}` : "missing";
    if (rev !== this._rev) {
      const firstLoad = this._rev == null;
      this._rev = rev;
      this._load(!firstLoad);  // Zustandswechsel kommen auch von anderen → wie Hintergrund-Aktualisierung
    }
  }

  getCardSize() { return 6; }
  static getConfigElement() { return document.createElement("smartlists-card-editor"); }
  static getStubConfig(hass) {
    const st = (hass && hass.states) || {};
    const e = Object.keys(st).find((k) => k.startsWith("todo.") && !isNotesEntity(k, st[k].attributes && st[k].attributes.friendly_name));
    return { entity: e || "todo.einkaufsliste" };
  }

  get _lang() { return slLang(this._hass); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }
  get _isAdmin() { return !this._hass.user || this._hass.user.is_admin; }
  _call(type, extra = {}, withEntity = true) {
    const queueable = withEntity && OFFLINE_TYPES.has(type);
    // jede sammelbare Änderung bekommt eine Kennung – auch die direkt gesendete: reißt die Verbindung vor der Antwort
    // ab, landet sie in der Warteschlange und wird mit derselben Kennung wiederholt (kein doppelter Artikel)
    const msg = { type: `smartlists/${type}`, ...(withEntity ? { entity_id: this._config.entity } : {}), ...extra, ...(queueable ? { op_id: offOpId() } : {}) };
    if (withEntity && type === "get_list" && this._isOffline()) return this._offlineList();
    // offline – oder es warten noch gesammelte Änderungen (Reihenfolge bleibt erhalten)
    if (queueable && (this._isOffline() || this._offQueue().length)) {
      const r = this._offlineDo(msg);
      if (!this._isOffline()) this._flushOffline();
      return Promise.resolve(r);
    }
    if (withEntity && !queueable && this._isOffline() && type !== "get_list")
      return Promise.reject(new Error(this._t.offline_unavailable));
    return this._hass.callWS(msg).catch((err) => {
      if (queueable && isConnErr(err)) return this._offlineDo(msg);
      throw err;
    });
  }
  _isOffline() {
    const c = this._hass && this._hass.connection;
    return (!!c && c.connected === false) || (typeof navigator !== "undefined" && navigator.onLine === false);
  }
  _offQueue() { return this._config && this._config.entity ? offLoad(offQueueKey(this._config.entity), []) : []; }
  _offlineList() {
    const snap = this._data || offLoad(offSnapKey(this._config.entity), null);
    return snap ? Promise.resolve(JSON.parse(JSON.stringify(snap))) : Promise.reject(new Error(this._t.offline_nodata));
  }
  // Änderung lokal anwenden und für später merken
  _offlineDo(msg) {
    const d = this._data || offLoad(offSnapKey(this._config.entity), null);
    if (d && !this._data) this._data = d;
    let result = {};
    if (d) {
      const rules = (this._cfg && this._cfg.tag_rules) || [];
      const fromText = (text) => {
        const p = parseText(text, rules, this._cfg && this._cfg.known_stores, true);
        return { text, clean_text: text, name: p.name || text, quantity: p.quantity ?? null, unit: p.unit || null, pack_count: p.pack_count || null, tags: p.tags || [] };
      };
      if (msg.type === "smartlists/add_item") {
        const uid = `offline-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        d.items.push({ uid, note: msg.note || "", checked: !!msg.checked, category: "sonstiges", offline: true,
          permissions: { toggle: true, rename: true, delete: true }, ...fromText(msg.text) });
        result = { uid };
        msg = { ...msg, offline_uid: uid };
      } else if (msg.type === "smartlists/update_item") {
        const it = d.items.find((i) => i.uid === msg.uid);
        if (it) {
          if ("checked" in msg) it.checked = msg.checked;
          if (msg.text != null) Object.assign(it, fromText(msg.text));
          if (msg.note != null) it.note = msg.note;
          it.offline = true;
        }
        result = { uid: msg.uid };
      } else if (msg.type === "smartlists/remove_items") {
        d.items = d.items.filter((i) => !(msg.uids || []).includes(i.uid));
      }
      offSave(offSnapKey(this._config.entity), d);
    }
    if (!msg.op_id) msg = { ...msg, op_id: offOpId() };
    offSave(offQueueKey(this._config.entity), [...this._offQueue(), msg]);
    this._render();
    return result;
  }
  // Wieder verbunden: gesammelte Änderungen der Reihe nach senden (offline angelegte Artikel bekommen dabei ihre echte uid)
  async _flushOffline() {
    if (this._flushing || this._isOffline() || !this._hass) return;
    const entity = this._config.entity, key = offQueueKey(entity), lock = offLockKey(entity), idsKey = offIdsKey(entity);
    if (!offLoad(key, []).length) return;
    // Sperre je Liste: sendet schon eine andere Karte (oder ein anderer Tab), bleibt diese hier still. Eine alte Sperre
    // (Tab geschlossen, Karte entfernt) verfällt nach 20 s.
    const me = offOpId();
    const held = offLoad(lock, null);
    if (held && held.id !== me && Date.now() - held.t < OFF_LOCK_MS) return;
    const hold = () => offSave(lock, { id: me, t: Date.now() });
    hold();
    const mine = () => { const cur = offLoad(lock, null); return !cur || cur.id === me; };
    if (!mine()) return;
    this._flushing = true;
    const ids = offLoad(idsKey, {}) || {};
    let sent = 0, skipped = 0;
    try {
      for (;;) {
        // die gespeicherte Warteschlange jedes Mal neu lesen: während des Abgleichs kommen Änderungen dazu
        const queue = offLoad(key, []);
        if (!queue.length || !mine()) break;
        const raw = queue[0];
        const op = { ...raw };
        const offUid = op.offline_uid;
        delete op.offline_uid;
        if (op.uid && ids[op.uid] !== undefined) op.uid = ids[op.uid];
        if (op.uids) op.uids = op.uids.map((u) => (ids[u] !== undefined ? ids[u] : u));
        const orphan = (op.uid && String(op.uid).startsWith("offline-")) || (op.uids || []).some((u) => String(u).startsWith("offline-"));
        if (orphan) { skipped++; } else {
          try {
            const r = await this._hass.callWS(op);
            if (offUid) { ids[offUid] = r && r.uid; offSave(idsKey, ids); }
            sent++;
          } catch (err) {
            if (isConnErr(err)) break;  // Verbindung wieder weg → bleibt mit derselben Kennung für später
            skipped++;                  // z. B. inzwischen von jemand anderem gelöscht
          }
        }
        // genau diesen Eintrag entfernen (nach Kennung) – nicht eine alte Kopie zurückschreiben
        const now = offLoad(key, []);
        const at = raw.op_id ? now.findIndex((o) => o.op_id === raw.op_id) : 0;
        if (at >= 0) now.splice(at, 1);
        offSave(key, now);
        hold();
      }
    } finally {
      this._flushing = false;
      if (!offLoad(key, []).length) offSave(idsKey, null);
      if (mine()) offSave(lock, null);
    }
    if (sent || skipped) this._showSnack(this._t.offline_synced.replace("{n}", sent) + (skipped ? " · " + this._t.offline_skipped.replace("{n}", skipped) : ""), null);
    await this._load();
  }
  _resetDraft() {
    this._draft = { text: "", parsed: null, info: null, pickedCat: null, sugg: [], suggMode: "name", active: -1 };
  }

  // Nutzt jemand die Karte gerade (Bearbeiten, Eingabe, Menü, Dialog, Einstellungen, Ziehen)? Dann keine
  // Hintergrund-Aktualisierung zeichnen – sie wird nachgeholt, sobald man fertig ist.
  _busy() {
    const root = this.shadowRoot;
    const active = root && root.activeElement;
    // Fokus in einem Eingabefeld zählt immer als „tippt gerade“ (auch leer, z. B. direkt nach dem Antippen) –
    // sonst baut eine Hintergrund-Aktualisierung die Karte neu und die Eingabe springt weg
    const typing = (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) && !/^(checkbox|radio|button)$/.test(active.type || ""))
      || !!(this._draft && this._draft.text && this._draft.text.trim());
    return !!(this._editing || this._menu || this._showSettings || this._showImport || this._dragging || SL_DRAG
      || (root && root.querySelector && root.querySelector(".dlg-back")) || typing);
  }
  _defer(fn) {
    this._deferredFns = this._deferredFns || new Set();
    this._deferredFns.add(fn);
    if (this._deferTimer) return;
    this._deferTimer = setInterval(() => {
      if (this._busy()) return;
      clearInterval(this._deferTimer); this._deferTimer = null;
      const fns = [...this._deferredFns]; this._deferredFns.clear();
      fns.forEach((f) => f());
    }, 1000);
  }

  async _loadConfig(live = false) {
    try {
      const cfg = await this._call("config", { language: this._lang }, false);
      const sig = JSON.stringify(cfg);
      if (live && sig === this._cfgSig) return;  // nichts geändert → nicht neu zeichnen
      if (live && this._busy()) { this._defer(() => this._loadConfig(true)); return; }
      this._cfgSig = sig;
      this._cfg = cfg;
      // Erster Start: Einrichtungs-Assistent einmal zeigen (nur Admins, nur eine Karte gleichzeitig)
      // …oder auf Wunsch über den Link der Integration (/smartlists?setup=1)
      let wanted = false;
      try { wanted = new URLSearchParams(window.location.search).get("setup") === "1"; } catch (e) { /* */ }
      if (cfg && (cfg.setup_needed || wanted) && this._isAdmin && !window.__smartlistsSetupOpen && !this._config.settings_only) {
        window.__smartlistsSetupOpen = true;
        if (wanted) {
          try { const u = new URL(window.location.href); u.searchParams.delete("setup"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* */ }
        }
        setTimeout(() => this._setupWizard(), 300);
      }
      if (this._cfg && this._cfg.appearance) SL_LOOK = this._cfg.appearance;
      if (this._input) { const ph = this._addPlaceholder(); this._input.placeholder = ph; this._input.setAttribute("aria-label", ph); }
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
  /* live = Aktualisierung im Hintergrund (andere haben etwas geändert, Abo, Minuten-Abgleich): zeichnet nur,
   * wenn sich wirklich etwas geändert hat, und nie während man gerade etwas bearbeitet (dann danach). */
  async _load(live = false) {
    try {
      const data = await this._call("get_list", { language: this._lang });
      if (!data || !Array.isArray(data.items)) throw new Error("Unexpected response from the SmartLists integration – please update the integration.");
      const sig = JSON.stringify(data);
      if (live && sig === this._dataSig && !this._error) return;
      if (live && this._busy()) { this._defer(() => this._load(true)); return; }
      this._dataSig = sig;
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
      if (!this._isOffline() && !this._offQueue().length) offSave(offSnapKey(this._config.entity), data);  // für den Laden ohne Netz
      // Darstellung dieser Liste (für alle Geräte gemerkt): gilt, solange die Karte bzw. dieses Gerät nichts anderes festlegt
      const ls = data.settings || {};
      if (JSON.stringify(ls) !== this._listSettingsApplied) {
        this._listSettingsApplied = JSON.stringify(ls);
        const raw = this._rawConfig || {};
        if (!("show_prices" in raw)) this._config.show_prices = ls.show_prices !== false;
        // Kategorien je Liste ausgeschaltet: keine Gruppen, kein Symbol, keine Kategorie beim Eintippen
        // „Einfache Liste“ (z. B. Baumarkt): keine Kategorien, keine Vorschläge, nichts gemerkt
        this._plain = ls.plain === true;
        this._noCats = ls.categories === false || this._plain;
        let saved = null;
        try { saved = localStorage.getItem(`smartlists-sort:${this._config.entity}`); } catch (e) { /* */ }
        if (!SORT_MODES.includes(saved) && !("sort" in raw) && ls.sort) this._sortMode = ls.sort;
      }
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
  async _change(label, type, extra, makeUndo, { snack = true, snackMs = 5000 } = {}) {
    const before = this._error;
    const result = await this._act(type, extra);
    if (this._error && this._error !== before) return result;
    this._undo = makeUndo ? { label, run: makeUndo(result || {}) } : null;
    this._render();
    if (snack) this._showSnack(label, this._undo ? () => this._runUndo() : null, snackMs);
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
    this._listEl = h("div", { class: "listwrap" });
    this._progressEl = h("div");
    this._menuEl = h("div");
    this._moreEl = h("div", { class: "morewrap" });
    this._snackEl = h("div");
    this._card = h("ha-card", {}, this._headEl, this._searchEl, this._filterEl, this._progressEl, this._settingsEl, this._importEl, this._tplEl, this._addEl, this._freqEl, this._msgEl,
      this._listEl, this._snackEl, this._menuEl, this._moreEl);
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
      this._config.show_title === false ? h("span", { class: "grow" }) : h("div", { class: "title" }, this._config.title || d.name),
      d.type === "combined" ? h("span", { class: "badge combined", title: t.combined, "aria-label": t.combined }, h("span", { class: "bi" }, "🔗"), h("span", { class: "bt" }, t.combined)) : null,
      // Liste eines anderen Dienstes (Bring!, Todoist, Local To-do …): die Einträge liegen dort, SmartLists zeigt sie nur an
      d.type === "list" ? (() => { const label = t.linked_via.replace("{name}", slPlatformName(d.platform, t));
        return h("span", { class: "badge linked", title: t.linked_help, "aria-label": `${label}. ${t.linked_help}` }, h("span", { class: "bi on" }, "⛓ "), h("span", { class: "bt" }, label)); })() : null,
      // Antippen: mit wem die Liste geteilt ist (nur Anzeige; ändern im Zahnrad der Liste).
      // „privat“ nur, solange auch kein Link aktiv ist – sonst wäre das irreführend
      d.own && !(d.own.role === "owner" && !Object.keys(d.own.shares || {}).length && d.links) ? h("button", { type: "button", class: "badge own", title: `${t.owner}: ${d.own.owner || "?"} – ${t.sharing}`,
        "aria-haspopup": "dialog", onclick: () => this._sharedWithDialog(d) },
        ...(d.own.role === "owner" ? (Object.keys(d.own.shares || {}).length ? [h("span", { class: "bi on" }, "👥"), h("span", { class: "bt" }, ` ${t.shared}`)] : [h("span", { class: "bi on" }, "🔒"), h("span", { class: "bt" }, ` ${t.private}`)]) : [`👤 ${d.own.owner || "?"} · ${t["role_" + d.own.role]}`])) : null,
      // Solange ein Teilen-Link gilt, ist die Liste im Internet erreichbar – deutlich zeigen; antippen = Links verwalten
      d.links ? h("button", { type: "button", class: "badge public", title: t.link_shared_help.replace("{n}", d.links),
        "aria-label": t.link_shared_help.replace("{n}", d.links), onclick: () => this._listDialog() },
        `🌐 ${t.link_shared}${d.links > 1 ? " · " + d.links : ""}`) : null,
      d.foreign ? h("span", { class: "badge foreign" }, t.foreign) : null,
      // offline bzw. noch nicht übertragene Änderungen
      this._isOffline() || this._offQueue().length ? h("span", { class: "badge offline", title: t.offline_help },
        `${this._isOffline() ? "📴 " + t.offline : "⏳"}${this._offQueue().length ? " · " + this._offQueue().length : ""}`) : null,
      !this._config.show_count ? null : h("span", { class: "count" }, this._searchQuery
        ? `${this._hitCount ?? 0} ${t.hits}`
        : this._shopping ? `${d.items.length - open.length}/${d.items.length} ${t.in_cart}` : `${open.length} ${t.open}`),
      // Kopfzeile schlank: Suche, Rückgängig (wenn möglich), Einkaufsmodus und ⋯ – der Rest steckt im ⋯-Menü
      this._config.show_search ? iconBtn(this._search != null ? ICON.close : ICON.search, t.search, () => this._toggleSearch()) : null,
      this._undo && this._config.show_undo ? iconBtn(ICON.undo, `${t.undo}: ${this._undo.label}`, () => this._runUndo()) : null,
      !this._config.show_shopping || d.type === "notes" ? null : h("button", { class: `icon-btn shopbtn ${this._shopping ? "on" : ""}`, type: "button", "aria-pressed": String(this._shopping),
        title: this._shopping ? t.shop_off : t.shop_on, "aria-label": this._shopping ? t.shop_off : t.shop_on,
        onclick: () => this._toggleShopping() }, svg(ICON.cart, 18)),
      this._showSettings || this._showImport || this._showTpl
        ? iconBtn(ICON.close, t.cancel, () => { this._showSettings = false; this._showImport = false; this._showTpl = false; this._renderSettings(); this._renderImport(); this._renderTemplates(); this._render(); })
        : this._moreItems(d).length ? iconBtn(ICON.dots, t.more, () => { this._moreOpen = !this._moreOpen; this._renderMore(); }, "morebtn") : null
    );
    this._renderMore();
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
    // „hidden“ allein reicht nicht: :host { display:block } der Karte überstimmt es – deshalb per style
    m.children.forEach((c, i) => { c.hidden = i !== m.active; c.style.display = i === m.active ? "" : "none"; });
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
