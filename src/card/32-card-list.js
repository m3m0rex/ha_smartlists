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
    if (this._config.drag_drop === false || this._shopping) return;
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
      // gewählte Sprache auch für dieses Gerät merken (gilt dann sofort überall, auch auf der Seite)
      const ul = this._userUi.ui_language;
      try { if (ul && ul !== "auto") localStorage.setItem("smartlists-ui-lang", ul); else if (ul === "auto") localStorage.removeItem("smartlists-ui-lang"); } catch (e) { /* */ }
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
    if (this._shopping) { this._editing = null; this._closeMenu && this._closeMenu(); }  // offene Bearbeitung beenden
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
        if (!this._reloadSoon) this._reloadSoon = debounce(() => this._load(true), 250);
        this._reloadSoon();
      }, { type: "todo/item/subscribe", entity_id: entity });
      // Haushaltsdaten (Kategorien, Preise, Vorlagen, Badges, Links …) live: neu laden, wenn sie sich ändern
      try {
        this._unsubData = await conn.subscribeMessage(() => {
          if (!this._dataSoon) this._dataSoon = debounce(async () => { await this._loadConfig(true); this._load(true); }, 800);
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
      if (this._hiddenAt && Date.now() - this._hiddenAt > 15000) { this._loadConfig(true); this._load(true); }
      this._hiddenAt = 0;
    };
    document.addEventListener("visibilitychange", this._onVisible);
    this._liveTimer = setInterval(() => { if (document.visibilityState !== "hidden" && this.isConnected !== false) this._load(true); }, 60000);
  }
  _stopLive() {
    clearInterval(this._liveTimer); this._liveTimer = null;
    if (this._onVisible) { document.removeEventListener("visibilitychange", this._onVisible); this._onVisible = null; }
  }

  async _toggleItem(it) {
    const checked = !it.checked;
    // Einkaufsmodus: jedes Abhaken mit Rückgängig-Leiste unten (3 s) – fängt Fehltipper auf der ganzen Zeile auf.
    // Sonst reicht ↶ im Kopf.
    await this._change(`${it.name} ${checked ? this._t.checked_off : this._t.unchecked}`, "update_item", { uid: it.uid, checked },
      () => () => this._call("update_item", { uid: it.uid, checked: !checked }), { snack: this._shopping, snackMs: 3000 });
  }
  _showSnack(text, undo, ms = 5000) {
    clearTimeout(this._snackTimer);
    this._snack = { text, undo };
    this._renderSnack();
    this._snackTimer = setTimeout(() => { this._snack = null; this._renderSnack(); }, ms);
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
    // Einkaufsmodus: kein Menü/Bearbeiten per Geste – optional „lange drücken = löschen“ (mit Rückgängig, ohne Nachfrage)
    if (this._shopping) {
      if (!ui.shop_longpress_delete || !(it.permissions && it.permissions.delete)) return;
      this._longPress(el, row, () => this._deleteItems([it]));  // mit Nachfrage
      return;
    }
    if (ui.press_gesture === "off") return;
    const fire = () => this._pressAction(it, row);
    if (ui.press_gesture === "double") { el.addEventListener("dblclick", (e) => { e.preventDefault(); fire(); }); return; }
    el.addEventListener("contextmenu", (e) => { e.preventDefault(); fire(); });
    if (ui.press_gesture !== "long") return;
    this._longPress(el, row, fire);
  }
  // langes Drücken (auch Maus) erkennen; der Klick danach wird kurz geschluckt
  _longPress(el, row, fire) {
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
        rename: p.rename, move: p.delete, copy: true, category: !this._noCats, delete: p.delete,
      };
      const icons = { rename: ICON.pencil, move: ICON.move, copy: ICON.copy, category: ICON.tagIcon, delete: ICON.trash };
      const actions = (this._ui.menu_actions || MENU_ACTIONS).filter((a) => allowed[a]);
      body = [head(it.name), ...actions.map((a) => item(icons[a], t["m_" + a], () => {
        if (a === "rename") { this._closeMenu(); this._editing = it.uid; this._renderList(); }
        else if (a === "delete") { this._closeMenu(); this._deleteItems([it]); }
        else this._openMenu(it, m.row, a);
      }, a === "delete" ? "danger" : ""))];
      if (!actions.length) body.push(h("div", { class: "empty" }, t.readonly));
      if (d.type !== "notes") body.push(item(ICON.check, t.m_select, () => this._startSelect(it)));
      if (d.type !== "notes") body.push(item(ICON.history, t.ih_title, () => this._openMenu(it, m.row, "history")));
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
    } else if (m.view === "history") {
      // Wer hat den Artikel wann hinzugefügt, abgehakt, umbenannt, gelöscht
      const listEl = h("div", { class: "empty" }, t.loading);
      body = [head(t.ih_title, true), listEl];
      this._call("item_history", { name: it.name }).then((r) => {
        const fmtT = (ts) => new Date(ts * 1000).toLocaleString(this._hass.language || "de", { dateStyle: "short", timeStyle: "short" });
        if (!r.entries.length) return fill(listEl, t.ih_none);
        listEl.className = "ihist";
        fill(listEl, r.entries.map((e) => h("div", { class: "ih" },
          h("span", { class: "a" }, t["ih_" + e.a] || e.a),
          h("span", { class: "w" }, e.a === "rename" ? `${e.old} → ${e.text}` : e.text,
            h("small", {}, `${e.link ? (e.by ? `${e.by} · ${t.ih_link}` : t.ih_link) : e.user_name || t.ih_auto} · ${fmtT(e.t)}`)))));
      }).catch(() => fill(listEl, t.error));
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
    const modes = SORT_MODES.filter((m) => (m !== "list" || d.type === "combined") && !(m === "category" && this._noCats));
    return h("label", { class: "sort", title: t.sort },
      svg(ICON.sort, 16),
      h("select", { "aria-label": t.sort, onchange: (e) => {
        this._sortMode = e.target.value;
        try { localStorage.setItem(`smartlists-sort:${this._config.entity}`, this._sortMode); } catch (err) { /* */ }
        this._renderList();
      } }, modes.map((m) => h("option", { value: m, selected: m === this._sortMode }, t["sort_" + m]))));
  }

