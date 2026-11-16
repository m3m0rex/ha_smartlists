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
    this._input = h("input", { class: "smart", placeholder: this._addPlaceholder(), value: this._draft.text, autocomplete: "off",
      enterkeyhint: "done", "aria-label": this._addPlaceholder(),
      oninput: () => this._onInput(), onkeydown: (e) => this._onKey(e),
      onfocus: () => { this._focused = true; this._renderFrequent(); },
      onblur: () => setTimeout(() => { this._focused = false; this._closeSugg(); this._renderFrequent(); }, 150) });
    this._goBtn = h("button", { class: "go", type: "button", title: this._addPlaceholder(), onclick: () => this._submit() }, svg(ICON.plus));
    this._previewEl = h("div", { class: "preview" });
    this._suggEl = h("ul", { class: "sugg", role: "listbox", hidden: true });
    this._pickEl = h("div", { class: "catpick", hidden: true });
    const scanBtn = this._config.show_scan !== false ? iconBtn(ICON.barcode, t.scan, () => this._scanDialog(), "scanbtn") : null;
    fill(this._addEl, h("div", { class: "add" }, h("div", { class: "add-row" }, this._input, scanBtn, this._goBtn), this._previewEl, this._suggEl, this._pickEl));
    this._renderPreview();
  }

  // Beispiel im Eingabefeld: allgemein und mit dem Markt-Zeichen der eigenen Namenskonvention ("@Markt", "!Markt" …)
  _addPlaceholder() {
    const t = this._t;
    const rule = ((this._cfg && this._cfg.tag_rules) || [{ kind: "store", prefix: "@" }]).find((r) => r.kind === "store");
    return t.add_placeholder.replace("{store}", rule ? rule.prefix + t.add_ph_store : "").trim();
  }

  _onInput() {
    const text = this._input.value;
    if (!text.trim()) { this._resetDraft(); this._renderPreview(); this._closeSugg(); this._renderFrequent(); return; }
    this._draft.text = text;
    const [noPrice, price] = splitPrice(text);
    this._draft.price = price;
    this._draft.parsed = this._cfg ? parseText(noPrice, this._cfg.tag_rules, this._cfg.known_stores, true) : null;
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
    const unit = p.unit || (p.quantity != null && info && info.unit_hint && !this._plain) || null;
    fill(el, 
      h("span", {}, p.name),
      p.quantity != null ? h("span", { class: "chip qty" }, `${p.pack_count > 1 ? p.pack_count + "× " : ""}${fmtQty(p.quantity)}${unit ? " " + unit : ""}`) : null,
      this._noCats ? null : h("button", { class: `catchip ${source === "manual" ? "manual" : ""}`, type: "button", title: t.category,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._togglePicker() },
        cat ? cat.label : "…", source ? h("span", { class: "src" }, "· " + t["src_" + source]) : null),
      p.quantity == null && info && info.unit_hint && !this._plain ? h("span", { class: "hint" }, `${t.unit_hint}: ${info.unit_hint}`) : null,
      this._draft.price != null && this._config.show_prices !== false ? h("span", { class: "chip qty" }, fmtMoney(this._draft.price, this._hass.language)) : null,
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
        isTag ? badge(s) : h("span", { class: "e" }, this._noCats ? "" : emojiOf(s.category_label)),
        h("span", { class: "n" }, isTag ? "" : bold(s.name)),
        !isTag && present.has(s.name.toLowerCase()) ? h("span", { class: "in" }, t.in_list) : null,
        !isTag && s.unit ? h("span", { class: "u" }, s.unit) : null,
        h("span", { class: "s" }, s.source === "history" ? svg(ICON.history, 15) : s.source === "list" ? svg(ICON.list, 15) : ""));
    }));
    el.hidden = false;
    const act = el.querySelector("li.active");
    if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest" });
  }
  _closeSugg() {
    if (this._suggEl) this._suggEl.hidden = true;
    this._draft.active = -1;
  }

  // Markt/Person/Schlagwort beim Bearbeiten: „@R“ → Auswahl wie im Eingabefeld (@REWE …). Gibt die Liste zurück,
  // die unter das Feld gehört; Pfeiltasten, Tab/Enter übernehmen, Esc schließt nur die Auswahl.
  _tagAutocomplete(input) {
    const list = h("ul", { class: "sugg editsugg", role: "listbox", hidden: true });
    let items = [], active = 0, seq = 0;
    const close = () => { items = []; list.hidden = true; fill(list); };
    const before = () => input.value.slice(0, input.selectionStart ?? input.value.length);
    const draw = () => {
      if (!items.length) return close();
      fill(list, ...items.map((s, i) => h("li", { role: "option", class: i === active ? "active" : "",
        onmousedown: (e) => { e.preventDefault(); apply(i); } }, badge(s))));
      list.hidden = false;
    };
    const apply = (i) => {
      const s = items[i];
      if (!s) return;
      const rule = ((this._cfg && this._cfg.tag_rules) || []).find((r) => r.kind === s.kind);
      if (!rule) return close();
      const pos = input.selectionStart ?? input.value.length;
      const head = input.value.slice(0, pos).replace(/\S+$/, rule.prefix + s.value) + " ";
      const tail = input.value.slice(pos).replace(/^\S*/, "").replace(/^ /, "");
      input.value = head + tail;
      input.setSelectionRange(head.length, head.length);
      close();
      input.focus();
    };
    const ask = debounce(async () => {
      const q = before();
      const word = (q.match(/\S+$/) || [""])[0];
      const prefixes = ((this._cfg && this._cfg.tag_rules) || []).map((r) => r.prefix);
      if (!word || !prefixes.includes(word[0])) return close();
      const mine = ++seq;
      try {
        const r = await this._call("suggest", { query: q, limit: 6 });
        if (mine !== seq) return;
        items = r.mode === "tag" ? r.suggestions || [] : [];
        active = 0;
        draw();
      } catch (e) { close(); }
    }, 120);
    input.addEventListener("input", ask);
    input.addEventListener("blur", () => setTimeout(close, 150));
    input.addEventListener("keydown", (e) => {
      if (list.hidden || !items.length || e.isComposing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length; draw();
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault(); e.stopImmediatePropagation(); apply(active);  // nicht gleich speichern
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopImmediatePropagation(); close();       // Bearbeiten nicht abbrechen
      }
    });
    return list;
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
    if (e.isComposing) return;
    // Pfeil runter bei geschlossener Liste: Vorschläge wieder öffnen
    if (e.key === "ArrowDown" && !open && this._draft.sugg && this._draft.sugg.length && this._draft.text.trim()) { e.preventDefault(); this._draft.active = 0; this._renderSugg(); return; }
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
    if (p.quantity != null && !p.unit && info && info.unit_hint && !this._plain) p.unit = info.unit_hint;
    const picked = textOverride || this._noCats ? null : this._draft.pickedCat;
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
    // Preis aus dem Text mitschicken – die Integration merkt ihn sich (je Einheit) und nimmt ihn aus dem Namen
    const price = textOverride ? null : this._draft.price;
    const text = encodeText(p, cfg.tag_rules) + (price != null ? ` ${String(price).replace(".", ",")} ${slCurrencySymbol()}` : "");
    this._resetDraft();
    if (this._input) { this._input.value = ""; this._renderPreview(); this._closeSugg(); if (this._pickEl) this._pickEl.hidden = true; }
    if (picked) {
      try { await this._call("set_category", { name: p.name, category: picked }, false); } catch (e) { /* weiter hinzufügen */ }
    }
    await this._change(`${p.name} ${this._t.added}`, "add_item", { text },
      (res) => () => this._call("remove_items", { uids: [res.uid] }), { snack: false });
  }

  // eingeklappte Abschnitte dieser Liste (auf dem Gerät gemerkt)
  _collapsed() {
    if (!this._collapsedSet) {
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem(`smartlists-collapsed:${this._config.entity}`) || "[]"); } catch (e) { /* */ }
      this._collapsedSet = new Set(Array.isArray(saved) ? saved : []);
    }
    return this._collapsedSet;
  }
  _toggleCollapsed(key) {
    const set = this._collapsed();
    if (set.has(key)) set.delete(key); else set.add(key);
    try { localStorage.setItem(`smartlists-collapsed:${this._config.entity}`, JSON.stringify([...set])); } catch (e) { /* */ }
    this._renderList();
  }
  // 🏷️ passende Angebote zu einem Artikel (aus der Angebots-Karte, falls Angebots-Sensoren vorhanden sind)
  _dealsFor(it) {
    if (!this._deals || !this._deals.length || it.offer || it.checked || !it.name) return [];
    const deals = window.SmartDiscounts.dealsFor(this._deals, it.name, "word");
    // Steht am Artikel schon ein @Markt, zählen nur dessen Angebote
    const stores = (it.tags || []).filter((x) => x.kind === "store").map((x) => searchKey(x.label || x.value));
    return stores.length ? deals.filter((o) => stores.some((s) => searchKey(o.store).startsWith(s) || s.startsWith(searchKey(o.store)))) : deals;
  }
  _dealDialog(it, deals) {
    const t = this._t, lang = this._hass.language;
    const day = (iso) => { const p = String(iso).slice(0, 10).split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : iso; };
    const take = async (o) => {
      dlg.remove();
      const line = `⚙OFFER:${JSON.stringify({ s: o.store, p: o.price, ...(o.old ? { o: o.old } : {}), ...(o.until ? { e: o.until } : {}), a: Math.floor(Date.now() / 1000) })}`;
      try { await this._call("update_item", { uid: it.uid, text: it.text, note: [it.note, line].filter(Boolean).join("\n") }); } catch (err) { this._toast((err && err.message) || t.error); }
      this._load();
    };
    const dlg = this._dialog(t.deal_title.replace("{name}", it.name), h("div", {}, h("p", { class: "shelp" }, t.deal_help),
      deals.map((o, i) => h("div", { class: "srow2" },
        h("div", { class: "sl" }, h("span", { class: "tag store", style: `background:${o.color};color:${textOn(o.color)}` }, o.store), " ", o.name,
          h("small", {}, [o.unit ? `${fmtMoney(o.unit.value, lang)}/${o.unit.unit}` : "", o.until ? `${t.offer_until} ${day(o.until)}` : ""].filter(Boolean).join(" · "))),
        h("b", { style: i === 0 && deals.length > 1 ? "color:var(--success-color,#43a047)" : null }, fmtMoney(o.price, lang)),
        h("button", { class: "btn2 primary", type: "button", onclick: () => take(o) }, t.deal_take)))),
      [h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel)]);
  }
  _renderFrequent() {
    const el = this._freqEl;
    if (!el) return;
    const items = (this._frequent || []).slice(0, 8);
    const show = this._config.show_frequent && !this._plain && this._config.show_add && items.length && this._data && this._data.permissions.add && !this._draft.text.trim();
    if (!show) return fill(el, );
    const t = this._t, d = this._data;
    const canReset = this._isAdmin || !d.own || d.own.role === "owner";
    // ✎: einzelne Artikel mit ✕ aus „häufig gekauft“ dieser Liste nehmen oder alles zurücksetzen
    const reset = async (names) => {
      if (!names && !(await slDialog(this.shadowRoot, { title: t.freq_reset, text: t.freq_reset_q, ok: t.freq_reset, cancel: t.cancel, danger: true }))) return;
      try {
        await this._call("reset_frequent", names ? { names } : {});
        if (!names) this._freqEdit = false;
        this._showSnack(names ? `${names[0]} – ${t.freq_removed}` : t.freq_done, null, 3000);
      } catch (e) { this._showSnack((e && e.message) || t.error, null, 4000); }
      this._loadFrequent();
    };
    if (this._freqEdit) {
      return fill(el, h("div", { class: "frequent editing" },
        h("span", { class: "lbl" }, t.frequent),
        items.map((s) => h("button", { class: "fchip del", type: "button", title: `${t.freq_remove}: ${s.name}`, "aria-label": `${t.freq_remove}: ${s.name}`,
          onmousedown: (e) => e.preventDefault(), onclick: () => reset([s.name]) }, "✕ ", s.name)),
        canReset ? h("button", { class: "fchip warn", type: "button", onclick: () => reset(null) }, "↺ " + t.freq_reset) : null,
        h("button", { class: "fchip", type: "button", onclick: () => { this._freqEdit = false; this._renderFrequent(); } }, "✓ " + t.done)));
    }
    let freqClosed = false;
    try { freqClosed = localStorage.getItem("smartlists-freq-closed") === "1"; } catch (e) { /* */ }
    const freqToggle = h("button", { class: `fchip flbl ${freqClosed ? "closed" : ""}`, type: "button", "aria-expanded": String(!freqClosed), title: freqClosed ? t.expand : t.collapse,
      onmousedown: (e) => e.preventDefault(),
      onclick: () => { try { localStorage.setItem("smartlists-freq-closed", freqClosed ? "0" : "1"); } catch (e) { /* */ } this._renderFrequent(); } },
      svg(ICON.chevron, 16, "chev"), this._t.frequent, freqClosed ? ` · ${items.length}` : "");
    if (freqClosed) return fill(el, h("div", { class: "frequent" }, freqToggle));
    fill(el, h("div", { class: "frequent" },
      freqToggle,
      h("button", { class: "fchip fedit", type: "button", title: t.freq_edit, "aria-label": t.freq_edit,
        onmousedown: (e) => e.preventDefault(), onclick: () => { this._freqEdit = true; this._renderFrequent(); } }, "✎"),
      items.map((s) => h("button", { class: "fchip", type: "button", title: s.category_label,
        onmousedown: (e) => e.preventDefault(), onclick: () => this._submit(s.name) },
        // fällig nach eurem Rhythmus → ⏰ vorne, Tooltip mit Abstand
        s.source === "due" ? h("span", { title: `${this._t.due_every} ${s.every_days} ${this._t.days}` }, "⏰ ") : null,
        this._noCats ? s.name : `${emojiOf(s.category_label)} ${s.name}`))));
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
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(); } },
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
    if (this._sel) out.push(this._selBar(d, visible));
    // Angebote aus den Angebots-Sensoren (für den 🏷️-Hinweis an passenden Artikeln) – einmal je Zeichnen
    this._deals = this._config.show_offer_hints !== false && window.SmartDiscounts && d.type !== "notes" ? window.SmartDiscounts.offers(this._hass) : [];
    // 4.0: abgelaufene Angebote an Artikeln – Hinweis mit „Entfernen“ (oder „Später“: bis zum nächsten Laden der Seite)
    const expired = d.items.filter((i) => !i.checked && i.offer && i.offer.expired);
    if (expired.length && d.permissions.rename && !this._expiredLater) {
      out.push(h("div", { class: "expbox", role: "status" },
        h("div", { class: "et" }, h("b", {}, "🏷️ " + t.offers_expired.replace("{n}", expired.length)), h("small", {}, `${expired.slice(0, 3).map((i) => i.name).join(", ")}${expired.length > 3 ? " …" : ""} – ${t.offers_expired_help}`)),
        h("div", { class: "eb" },
          h("button", { class: "btn2", type: "button", onclick: () => { this._expiredLater = true; this._renderList(); } }, t.offers_expired_later),
          h("button", { class: "btn2 primary", type: "button", onclick: async (e) => { e.currentTarget.disabled = true;
            try { const r = await this._call("clear_expired_offers", {}); this._toast(`✓ ${t.offers_expired_remove}: ${r.removed}`); } catch (err) { this._toast((err && err.message) || t.error); }
            this._load(); } }, t.offers_expired_remove))));
    }
    // über einen Link hinzugefügt, wartet auf Freigabe: ✓ übernehmen / ✕ verwerfen
    if (d.pending && d.pending.length) {
      const decide = async (pid, approve) => {
        try { await this._call("share_pending", { pending_id: pid, approve }); } catch (err) { this._error = (err && err.message) || t.error; }
        this._load();
      };
      out.push(h("div", { class: "pendbox" }, h("div", { class: "group-title" }, `⏳ ${t.pending_title} · ${d.pending.length}`),
        d.pending.map((pi) => h("div", { class: "pendrow" },
          h("span", { class: "pt" }, pi.text, h("small", {}, `🔗 ${pi.by || "?"}`)),
          h("button", { class: "btn2 primary", type: "button", title: t.pending_ok, "aria-label": `${t.pending_ok}: ${pi.text}`, onclick: () => decide(pi.id, true) }, "✓"),
          h("button", { class: "btn2", type: "button", title: t.pending_no, "aria-label": `${t.pending_no}: ${pi.text}`, onclick: () => decide(pi.id, false) }, "✕")))));
    }
    const mode = this._noCats && this._sortMode === "category" ? "added" : this._sortMode;
    const byName = (a, b) => a.name.localeCompare(b.name, this._hass.language || "de", { sensitivity: "base", numeric: true });
    const rows = [];
    let emoji = false;
    const grouped = (keyOf, groupsInOrder, labelOf, colorOf = () => null) => {
      const groups = new Map();
      for (const it of open) {
        const k = keyOf(it);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
      }
      groupsInOrder([...groups.keys()]).forEach((k) => {
        const items = groups.get(k).sort(byName);
        const color = colorOf(k);
        // 4.0: Abschnitt einklappbar (je Liste auf diesem Gerät gemerkt); bei der Suche immer offen
        const key = `${mode}:${k}`, closed = !searching && this._collapsed().has(key);
        rows.push(h("button", { type: "button", class: `group-title full bar ${closed ? "closed" : ""}`, style: color ? `--cc:${color}` : null, "aria-expanded": String(!closed),
          title: closed ? t.expand : t.collapse, onclick: () => this._toggleCollapsed(key) },
          h("span", { class: "gt" }, labelOf(k)), h("small", {}, String(items.length)), h("span", { class: "grow" }), svg(ICON.chevron, 18, "chev")),
          closed ? null : items.map((i) => this._row(i, d, false)));
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
        (k) => { const c = d.categories.find((x) => x.id === k); return c ? c.label : k; }, catColor);
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
        done.length && d.permissions.toggle && this._showFinish() ? h("button", { class: "btn2", type: "button", style: "height:30px", onclick: () => this._finishShopping(done.length) }, "✓ " + t.trip_done) : null));
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
    if (this._noCats) showEmoji = false;
    if (this._sel) return this._selRow(it, d, showEmoji);
    // Einkaufsmodus: Bearbeiten gesperrt (kein Umbenennen per Fehltipp) – die Zeile hakt nur ab
    if (this._editing === it.uid && !this._shopping) return this._editRow(it, d);
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
    // Einkaufsmodus: Tipp irgendwo auf die Zeile hakt ab (nicht nur das kleine Kästchen); Fehltipper fängt
    // die Rückgängig-Leiste unten auf (3 s)
    const tapRow = shop && ui.shop_tap_row !== false && p.toggle;
    const nameEl = h("span", { class: "iname" }, this._highlight(it.name));
    const deals = this._config.show_offer_hints !== false && !shop ? this._dealsFor(it) : [];
    // Reihenfolge der Angaben unter dem Namen: Haushalt (Einstellungen → Badges & Farben)
    const part = {
      store: tags.filter((x) => x.kind === "store").map(badge),
      tag: tags.filter((x) => x.kind !== "store" && x.kind !== "person").map(badge),
      person: [...tags.filter((x) => x.kind === "person").map(badge),
        // Quelle nur als Text, wenn sie nicht schon als Person-Badge erscheint (todo.peter → 👤 Peter)
        this._config.show_source && it.source && !tags.some((x) => x.implicit) ? h("span", { class: "chip" }, it.source) : null],
      price: [!it.offer && it.price && this._config.show_prices !== false ? this._priceLine(it) : null,
        deals.length ? h("button", { type: "button", class: "dealhint", title: t.deal_title.replace("{name}", it.name), onclick: (e) => { e.stopPropagation(); this._dealDialog(it, deals); } },
          `🏷️ ${t.deal_from.replace("{price}", fmtMoney(deals[0].price, this._hass.language))}${deals.length > 1 ? ` · ${deals.length}` : ""}`) : null],
      note: [this._config.show_note && it.note ? h("span", { class: "note" }, it.note) : null],
    };
    const sub = slRowOrder().flatMap((k) => part[k] || []);
    const row = h("div", { class: `row ${showEmoji ? "emoji" : ""} ${it.checked ? "checked" : ""} ${shop && ui.shop_large ? "large" : ""} ${tapRow ? "tap" : ""} ${shop && buttons ? "btns" : ""}`,
      onclick: (e) => {
        if (this._suppressClick) { this._suppressClick = false; return; }
        if (tapRow && !e.target.closest("button")) this._toggleItem(it);
      } },
      h("button", { class: `box ${it.checked ? "on" : ""}`, type: "button", disabled: !p.toggle, "aria-label": it.name,
        onclick: () => this._toggleItem(it) }, svg(ICON.check, shop && ui.shop_large ? 20 : 16)),
      showEmoji ? h("span", { class: "catemoji", title: cat ? cat.label : "" }, cat ? emojiOf(cat.label) : "") : null,
      h("div", { class: "main" },
        // Zeile 1: Anzahl (gefüllt) · Name · Größe (umrandet) – fest markiert, damit man sie beim Einkaufen sofort sieht
        h("div", { class: "name-line" }, countOf(it) ? h("span", { class: "qpill" }, countOf(it)) : null, nameEl, sizeOf(it) ? h("span", { class: "sizechip" }, sizeOf(it)) : null),
        // Zeile 2: Badges, Herkunft, Preis und Notiz
        sub.some(Boolean) ? h("div", { class: "subline" }, sub) : null,
        it.offer && this._config.show_offer !== false ? this._offerLine(it, tags) : null,
        // über einen geteilten Link: mit dem Namen, den die Person dort angegeben hat („von Max markiert (Link)“)
        it.soft_checked && !it.checked ? h("div", { class: "softchk", title: t.soft_checked_help }, "✓ ",
          it.soft_by ? t.soft_checked_by.replace("{name}", it.soft_by) : t.soft_checked) : null,
        it.link_added && !it.checked ? h("div", { class: "softchk", title: t.link_added_help }, "🔗 ",
          it.link_by ? t.link_added_by.replace("{name}", it.link_by) : t.link_added) : null),
      h("span", { class: "stepcol" }, p.rename && !shop && it.quantity != null && this._config.show_stepper !== false
        ? h("span", { class: "stepper" },
          h("button", { class: "sbtn", type: "button", title: t.qty_less, "aria-label": t.qty_less, onclick: () => this._stepQty(it, -1) }, svg(ICON.minus, 14)),
          h("button", { class: "sbtn", type: "button", title: t.qty_more, "aria-label": t.qty_more, onclick: () => this._stepQty(it, 1) }, svg(ICON.plus, 14)))
        : null),
      h("div", { class: "actions" },
        readonly && !shop ? h("span", { class: "lock-ic", title: t.readonly }, svg(ICON.lock, 16)) : null,
        buttons && p.rename ? iconBtn(ICON.pencil, t.edit, () => { this._editing = it.uid; this._renderList(); }) : null,
        buttons && p.delete ? iconBtn(ICON.trash, t.delete, () => this._deleteItems([it]), "danger") : null));
    this._bindPress(ui.press_target === "name" ? nameEl : row, it, row);
    this._bindDrag(row, it, d);
    return row;
  }

  // Mehrfachauswahl: Zeile antippen = markieren; Leiste oben mit Verschieben, Kopieren, Abhaken, Löschen
  _selRow(it, d, showEmoji) {
    const on = this._sel.has(it.uid);
    const cat = d.categories.find((c) => c.id === it.category);
    const tags = !this._config.show_tags ? [] : (it.tags || []).filter((x) => this._config.show_source || !x.implicit);
    const toggle = () => { if (on) this._sel.delete(it.uid); else this._sel.add(it.uid); this._renderList(); };
    return h("div", { class: `row selmode ${showEmoji ? "emoji" : ""} ${it.checked ? "checked" : ""} ${on ? "sel" : ""}`, role: "checkbox", "aria-checked": String(on), tabindex: "0",
      onclick: toggle, onkeydown: (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } } },
      h("span", { class: `box selbox ${on ? "on" : ""}` }, on ? svg(ICON.check, 16) : null),
      showEmoji ? h("span", { class: "catemoji" }, cat ? emojiOf(cat.label) : "") : null,
      h("div", { class: "main" },
        h("div", { class: "name-line" }, countOf(it) ? h("span", { class: "qpill" }, countOf(it)) : null, h("span", { class: "iname" }, it.name), sizeOf(it) ? h("span", { class: "sizechip" }, sizeOf(it)) : null),
        tags.length ? h("div", { class: "subline" }, tags.map(badge)) : null),
      h("span", { class: "stepcol" }), h("div", { class: "actions" }));
  }
  _startSelect(it) {
    this._sel = new Set(it ? [it.uid] : []);
    this._closeMenu(); this._moreOpen = false; this._renderMore && this._renderMore();
    this._editing = null; this._renderList();
  }
  _endSelect() { this._sel = null; this._renderList(); }
  _selBar(d, visible) {
    const t = this._t;
    const items = d.items.filter((i) => this._sel.has(i.uid));
    // nicht mehr vorhandene (von anderen gelöscht) aus der Auswahl nehmen
    if (items.length !== this._sel.size) this._sel = new Set(items.map((i) => i.uid));
    const n = items.length;
    const all = visible.length && visible.every((i) => this._sel.has(i.uid));
    const canDel = d.permissions.delete, canAdd = (this._targets || []).some((l) => l.entity_id !== this._config.entity && l.can_add);
    const btn = (label, fn, cls = "", dis = !n) => h("button", { class: `btn2 ${cls}`, type: "button", disabled: dis, onclick: fn }, label);
    return h("div", { class: "selbar" },
      iconBtn(ICON.close, t.cancel, () => this._endSelect()),
      h("b", { class: "grow" }, t.sel_count.replace("{n}", n)),
      btn(all ? t.sel_none : t.sel_all, () => { this._sel = all ? new Set() : new Set(visible.map((i) => i.uid)); this._renderList(); }, "", !visible.length),
      d.permissions.toggle ? btn("✓ " + t.sel_check, () => this._selCheck(items)) : null,
      canDel && canAdd ? btn(t.m_move, () => this._selMove(items, false)) : null,
      canAdd ? btn(t.m_copy, () => this._selMove(items, true)) : null,
      canDel ? btn(t.delete, () => this._selDelete(items), "danger") : null);
  }
  async _selDelete(items) {
    const t = this._t;
    if (!items.length) return;
    const yes = await slDialog(this.shadowRoot, { title: t.delete, danger: true, ok: t.delete, cancel: t.cancel, text: t.sel_delete_q.replace("{n}", items.length) });
    if (!yes) return;
    this._sel = null;
    await this._change(`${items.length} ${t.removed}`, "remove_items", { uids: items.map((i) => i.uid) },
      () => async () => { for (const i of items) await this._call("add_item", { text: i.text, note: i.note || "", checked: i.checked }); });
  }
  async _selCheck(items) {
    const open = items.filter((i) => !i.checked);
    const target = open.length ? open : items; // alles schon abgehakt → wieder öffnen
    const checked = !!open.length;
    this._sel = null;
    const label = `${target.length} ${checked ? this._t.sel_checked : this._t.sel_reopened}`;
    try { for (const i of target) await this._call("update_item", { uid: i.uid, checked }); this._error = null; } catch (e) { this._error = (e && e.message) || this._t.error; }
    this._undo = { label, run: async () => { for (const i of target) await this._call("update_item", { uid: i.uid, checked: !checked }); } };
    await this._load();
    this._render();
    this._showSnack(label, () => this._runUndo());
  }
  _selMove(items, copy) {
    const t = this._t;
    const d = this._data;
    const targets = (this._targets || []).filter((l) => l.entity_id !== this._config.entity && l.can_add && (l.type === "notes") === (d.type === "notes"));
    const dlg = this._dialog(`${copy ? t.m_copy : t.m_move} (${items.length})`, h("div", { class: "seltargets" },
      h("style", {}, ".seltargets{display:flex;flex-direction:column;gap:6px}.seltargets button{justify-content:flex-start;text-align:left;width:100%}"),
      targets.length ? targets.map((l) => h("button", { type: "button", onclick: async () => {
        dlg.remove();
        this._sel = null;
        const source = this._config.entity;
        const moved = [];
        try {
          for (const i of items) {
            const r = await this._call("move_item", { uid: i.uid, target: l.entity_id, copy });
            if (r && r.uid) moved.push(r.uid);
          }
          this._error = null;
        } catch (e) { this._error = (e && e.message) || t.error; }
        const label = `${moved.length} ${copy ? t.copied : t.moved} ${l.name}`;
        this._undo = { label, run: async () => { for (const uid of moved) {
          if (copy) await this._call("remove_items", { entity_id: l.entity_id, uids: [uid] }, false);
          else await this._call("move_item", { entity_id: l.entity_id, uid, target: source, copy: false }, false);
        } } };
        await this._load();
        this._render();
        this._showSnack(label, () => this._runUndo());
      } }, "📋 " + l.name)) : h("p", {}, t.no_targets)), [h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel)]);
  }

  _editRow(it, d) {
    const t = this._t;
    const text = h("input", { class: "text", value: it.clean_text || it.text || it.name, "aria-label": it.name, autocomplete: "off" });
    const tagSugg = this._tagAutocomplete(text);
    const cat = h("select", { class: "cat", "aria-label": t.category },
      d.categories.map((c) => h("option", { value: c.id, selected: c.id === it.category }, c.label)));
    // Notizen nur, wenn die Liste sie speichern kann (z.B. nicht bei der einfachen HA-Einkaufsliste)
    const canNote = d.permissions.note !== false;
    const note = canNote ? h("input", { class: "note-in", placeholder: t.note, value: it.note || "" }) : null;
    // Preis je Einheit (bzw. Stück) – gilt für diesen Artikel, auch wenn er später wieder auf die Liste kommt
    const priceIn = h("input", { class: "price-in", type: "number", min: "0", step: "0.01", inputmode: "decimal", placeholder: `${t.price} ${slCurrencySymbol()}${it.unit ? " / " + it.unit : ""}`,
      "aria-label": t.price, value: it.price && it.price.source !== "offer" && it.price.unit_price != null ? String(it.price.unit_price) : "" });
    const save = async () => {
      this._editing = null;
      // Preis im Text ("… 1,19€") gilt wie das Preisfeld (je Einheit umgerechnet wie beim Hinzufügen)
      const [noPrice, typedPrice] = splitPrice(text.value);
      const parsed = parseText(noPrice, this._cfg.tag_rules, this._cfg.known_stores, true);
      const before = it.price && it.price.source !== "offer" ? it.price.unit_price : null;
      const nowP = typedPrice != null ? Math.round(typedPrice / ((parsed.quantity || 1) * (parsed.pack_count || 1)) * 1000) / 1000
        : priceIn.value === "" ? null : Number(priceIn.value.replace(",", "."));
      if (nowP !== before && !(nowP != null && Number.isNaN(nowP))) {
        try { await this._call("set_price", { name: parsed.name || it.name, price: nowP, store: (parsed.tags.find((x) => x.kind === "store") || {}).value || null }, false); } catch (e) { slWarn("set_price", e); this._toast((e && e.message) || this._t.error); }
      }
      if (!this._noCats && cat.value !== it.category) {
        try { await this._call("set_category", { name: parsed.name || it.name, category: cat.value }, false); } catch (e) { slWarn("set_category", e); this._toast((e && e.message) || this._t.error); }
      }
      this._change(`${it.name} ${t.changed}`, "update_item", { uid: it.uid, text: encodeText(parsed, this._cfg.tag_rules) || it.text, note: note ? note.value : it.note || "" },
        () => () => this._call("update_item", { uid: it.uid, text: it.text, note: it.note || "" }));
    };
    [text, note, priceIn].filter(Boolean).forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { this._editing = null; this._renderList(); } }));
    setTimeout(() => text.focus(), 0);
    return h("div", { class: "edit" }, h("div", { class: "editwrap" }, text, tagSugg), this._noCats ? null : cat, note, this._config.show_prices !== false ? priceIn : null,
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

