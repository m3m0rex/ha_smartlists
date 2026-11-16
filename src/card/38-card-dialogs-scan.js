  _dialog(title, body, actions, width = 460) {
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) back.remove(); } },
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
    // 4.0: beim Einfügen (Rezept, Notiz, Chat) Aufzählungszeichen, Kästchen und Nummern entfernen
    const hint = h("small", { class: "shelp" });
    items.addEventListener("paste", () => setTimeout(() => {
      const clean = items.value.split("\n").map((l) => l.replace(/^\s*(?:[-–—*•·▪◦‣]+|\[[ xX✓]?\]|[☐☑✅✔]|\d{1,2}[.)])\s+/, "").replace(/^\s*\[[ xX✓]?\]\s+/, "").trim()).filter(Boolean).join("\n");
      if (clean !== items.value.trim()) { items.value = clean; hint.textContent = "✓ " + t.tpl_clean; }
    }, 0));
    // Vorschläge: häufig Gekauftes, das noch nicht in der Vorlage steht – antippen fügt eine Zeile an
    const sugg = h("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px" });
    const drawSugg = () => {
      const have = new Set(items.value.split("\n").map((l) => parseText(l.trim(), this._cfg ? this._cfg.tag_rules : [], [], true).name.toLowerCase()));
      const rest = (this._frequent || []).map((s) => s.name || s.text || "").filter((n) => n && !have.has(n.toLowerCase())).slice(0, 10);
      fill(sugg, rest.length ? h("small", { class: "shelp", style: "flex-basis:100%" }, t.tpl_suggest) : null, rest.map((n) =>
        h("button", { type: "button", class: "chip", onclick: () => { items.value = (items.value.trim() ? items.value.trim() + "\n" : "") + n; drawSugg(); } }, "＋ " + n)));
    };
    items.addEventListener("input", debounce(drawSugg, 300));
    if (!this._frequent && this._loadFrequent) Promise.resolve(this._loadFrequent()).then(drawSugg).catch(() => {}); else drawSugg();
    const body = h("div", {}, h("div", { style: "display:flex;gap:8px" }, emoji, name), servings,
      h("p", {}, t.tpl_items_help), items, hint, sugg);
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
  // Wochenplan: Gerichte (Vorlagen) je Tag, Zutaten auf die Liste, optional aus Mealie holen
  // Wochenplan als Fenster (⋯ → Wochenplan) …
  async _mealPlanDialog() {
    const t = this._t;
    let dlg = null;
    const mp = await this._mealPlanBuild(() => dlg && dlg.remove(), () => dlg);
    dlg = this._dialog(t.mp_title, mp.body, mp.actions, 640);
    dlg.prepend(mp.style);
    mp.load();
  }
  // … oder direkt in der Karte bzw. auf der Seite /smartlists (Tab „Wochenplan“, Karte mit view: mealplan)
  async _renderMealPlanView() {
    const t = this._t;
    if (this._mpView && this._mpView.lang === this._lang) return;
    this._mpView = { lang: this._lang };
    const card = h("ha-card", {}, h("div", { class: "mpwrap" }, h("div", { class: "mph" }, "🗓️ " + t.mp_title), h("div", { class: "shelp" }, t.loading)));
    fill(this.shadowRoot, h("style", {}, STYLE), card);
    const mp = await this._mealPlanBuild(null, () => this._mpView);
    fill(card, mp.style, h("div", { class: "mpwrap" }, h("div", { class: "mph" }, "🗓️ " + t.mp_title), mp.body, h("div", { class: "acts mpacts" }, mp.actions)));
    mp.load();
  }
  // Gemeinsamer Aufbau. close: Fenster schließen (null = eingebettet), holder(): Objekt für _dirty
  async _mealPlanBuild(close, holder) {
    const t = this._t;
    const lang = this._hass.language || "de";
    const inline = !close;
    const startOf = (off) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d; };
    let week = 0, tpls = [], days = [], mealie = false, lists = [];
    try { tpls = (await this._call("templates", {}, false)).templates; } catch (e) { slWarn("templates", e); }
    try { mealie = (await this._call("mealie_status", {}, false)).available; } catch (e) { slWarn("mealie_status", e); }
    try { lists = (await this._call("lists", {}, false)).lists.filter((l) => l.can_add && l.type !== "notes"); } catch (e) { slWarn("lists", e); }
    // Ziel-Liste für „Zutaten auf die Liste“: die Liste der Karte, sonst die erste passende
    let target = (lists.find((l) => l.entity_id === this._config.entity) || lists[0] || { entity_id: this._config.entity }).entity_id;
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const status = h("span", { class: "ok2" });
    const grid = h("div", { class: "mpgrid" });
    const title = h("b", {});
    const setDirty = (v) => { const o = holder && holder(); if (o) o._dirty = v; };
    const load = async () => {
      const s0 = startOf(week);
      title.textContent = `${s0.toLocaleDateString(lang, { day: "numeric", month: "short" })} – ${new Date(s0.getTime() + 6 * 864e5).toLocaleDateString(lang, { day: "numeric", month: "short" })}`;
      try { days = (await this._call("mealplan", { start: iso(s0), days: 7 }, false)).days; } catch (e) { days = []; }
      draw();
    };
    // Änderungen erst sammeln (auch über mehrere Wochen), gespeichert wird mit „Speichern“ bzw. „Zutaten auf die Liste“
    const pending = {};
    const change = (date, ids) => { pending[date] = ids; setDirty(true); draw(); };
    const saveAll = async () => {
      for (const [date, ids] of Object.entries(pending)) { await this._call("set_meals", { date, template_ids: ids }, false); delete pending[date]; }
      setDirty(false);
    };
    const tplById = (id) => tpls.find((x) => x.id === id) || { id, name: id };
    const today = iso(new Date());
    const draw = () => fill(grid, days.map((day) => {
      const ids = pending[day.date] || day.templates.map((x) => x.id);
      const shown = pending[day.date] ? ids.map(tplById) : day.templates;
      const sel = h("select", { "aria-label": day.date, onchange: (e) => {
        if (!e.target.value) return;
        change(day.date, [...ids, e.target.value]);
      } }, h("option", { value: "" }, "＋ " + t.mp_add), tpls.filter((x) => !ids.includes(x.id)).map((x) => h("option", { value: x.id }, `${x.emoji || ""} ${x.name}`.trim())));
      return h("div", { class: `mpday ${day.date === today ? "today" : ""} ${pending[day.date] ? "changed" : ""}` },
        h("div", { class: "mpd" }, new Date(day.date + "T12:00").toLocaleDateString(lang, { weekday: "short", day: "numeric", month: "numeric" })),
        h("div", { class: "mpm" }, shown.map((x) => h("span", { class: "chip2 on" }, `${x.emoji || ""} ${x.name}`.trim(),
          h("button", { type: "button", class: "xdel", "aria-label": t.delete, onclick: () => change(day.date, ids.filter((y) => y !== x.id)) }, "×"))),
          tpls.length ? sel : h("span", { class: "shelp" }, t.mp_no_tpl)));
    }));
    const finish = (msg) => { if (close) { close(); this._toast(msg); } else { load(); status.textContent = msg; } };
    const addMeals = async () => {
      const r = await this._call("add_meals", { entity_id: target, start: iso(startOf(week)), days: 7 }, false);
      finish(`✓ ${r.added} ${t.added}${r.increased ? `, ${r.increased} ${t.tpl_increased}` : ""}`);
      if (target === this._config.entity && this._data) this._load();
    };
    const body = h("div", {},
      h("div", { class: "mpnav" }, iconBtn(ICON.back, t.mp_prev, () => { week--; load(); }), title, h("button", { type: "button", class: "icon-btn mpnext", title: t.mp_next, "aria-label": t.mp_next, onclick: () => { week++; load(); } }, svg(ICON.back, 18))),
      h("p", { class: "shelp" }, t.mp_help), grid,
      h("div", { class: "acts", style: "justify-content:flex-start;align-items:center;flex-wrap:wrap" },
        lists.length > 1 ? h("label", { class: "mptarget" }, t.mp_target + " ", h("select", { "aria-label": t.mp_target, onchange: (e) => { target = e.target.value; } },
          lists.map((l) => h("option", { value: l.entity_id, selected: l.entity_id === target }, l.name)))) : null,
        mealie ? h("button", { class: "btn2", type: "button", onclick: async () => {
          status.textContent = t.loading;
          try { const r = await this._call("mealie_import", { start: iso(startOf(week)), days: 7, plan: true }, false);
            status.textContent = `✓ ${r.recipes} ${t.mp_recipes}`; tpls = (await this._call("templates", {}, false)).templates; this._tpls = null; load(); }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, "🍽️ " + t.mp_mealie) : null),
      h("div", {}, status));
    const actions = [
      close ? h("button", { type: "button", onclick: () => close() }, t.cancel) : null,
      h("button", { type: "button", class: inline ? "btn2" : "", onclick: async () => {
        try {
          await saveAll();
          const yes = await slDialog(this.shadowRoot, { title: t.mp_saved, text: t.mp_ask_add, ok: t.mp_to_list, cancel: t.mp_not_now });
          if (!yes) { finish("✓ " + t.mp_saved); return; }
          await addMeals();
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.save),
      h("button", { type: "button", class: inline ? "btn2 primary" : "ok", onclick: async () => {
        try { await saveAll(); await addMeals(); }
        catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.mp_to_list)].filter(Boolean);
    const style = h("style", {}, `.mpgrid{display:grid;gap:0}.mpday{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}
      .mpday.today .mpd{color:var(--primary-color)}.mpday.changed .mpd::after{content:" •";color:var(--primary-color)}
      .mpd{font-weight:600}.mpm{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.mpm select,.mptarget select{width:auto;height:auto;min-height:34px;line-height:1.4;padding:5px 30px 5px 10px;margin:0;box-sizing:border-box}
      .mptarget{display:inline-flex;align-items:center;gap:6px;font-size:.88rem;color:var(--secondary-text-color)}
      .chip2{border:1px solid var(--divider-color,#ddd);border-radius:16px;padding:3px 4px 3px 10px;font-size:.85rem;display:inline-flex;align-items:center;gap:2px}
      .chip2.on{border-color:var(--primary-color);color:var(--primary-color)}.xdel{background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;padding:0 4px;height:auto}
      .mpnav{display:flex;align-items:center;gap:8px;justify-content:space-between;margin-bottom:6px}.mpnav .icon-btn{background:none;border:none;color:inherit;cursor:pointer;height:32px;width:32px;padding:0}
      .mpnext svg{transform:rotate(180deg)}.btn2{height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--divider-color,#ddd);background:none;color:var(--primary-color);cursor:pointer}
      .btn2.primary{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
      .shelp{color:var(--secondary-text-color);font-size:.82rem}.acts{display:flex;gap:8px;margin-top:10px}.ok2{font-size:.85rem;color:var(--secondary-text-color)}
      .mpwrap{padding:16px}.mph{font-size:1.25rem;font-weight:500;margin-bottom:8px}.mpacts{justify-content:flex-end}
      @media(max-width:520px){.mpday{grid-template-columns:minmax(0,1fr)}}`);
    return { body, actions, style, load };
  }

  // Global → Sprache, Sichern, Standard: fertige Einkaufs-Ansicht (Dashboard) mit einem Klick
  async _createDashboard(status) {
    const t = this._t;
    const st = this._hass.states;
    const lists = Object.keys(st).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, st[e].attributes.friendly_name))
      .sort((a, b) => (Number(!!st[b].attributes.smartlists_combined) - Number(!!st[a].attributes.smartlists_combined)) || a.localeCompare(b));
    // Entitäts-IDs hängen von der Sprache beim Anlegen ab → über Merkmale suchen statt fest eintragen
    const cal = Object.keys(st).find((e) => e.startsWith("calendar.smartlists")) || "calendar.smartlists_meal_plan";
    const exp = Object.keys(st).find((e) => e.startsWith("sensor.smartlists") && st[e].attributes.unit_of_measurement === "€") || "sensor.smartlists_expenses_this_month";
    // je Liste eine eigene Unterseite (Ansicht) mit eigener Adresse – kombinierte zuerst; sehr viele Listen: der Rest
    // zusammen auf einer Seite „Weitere“
    const slug = (x) => String(x).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "liste";
    const used = new Set(["plan", "stats", "more"]);
    const MAXV = 12;
    const listView = (e) => {
      const a = st[e].attributes || {};
      let path = slug(chipName(a.friendly_name || e.split(".")[1]));
      while (used.has(path)) path += "-2";
      used.add(path);
      return { title: chipName(a.friendly_name || e), path, icon: a.smartlists_combined ? "mdi:cart" : a.smartlists_own ? "mdi:clipboard-account-outline" : "mdi:format-list-checks",
        type: "panel", cards: [{ type: "custom:smartlists-card", entity: e }] };
    };
    const config = { views: [
      ...lists.slice(0, MAXV).map(listView),
      lists.length > MAXV ? { title: t.db_more, path: "more", icon: "mdi:dots-horizontal", type: "panel", cards: [{ type: "custom:smartlists-card", entities: lists.slice(MAXV), layout: "tabs" }] } : null,
      this._feat("mealplan") ? { title: t.db_plan, path: "plan", icon: "mdi:silverware-fork-knife", cards: [{ type: "calendar", entities: [cal], initial_view: "listWeek" }] } : null,
      this._feat("stats") ? { title: t.db_stats, path: "stats", icon: "mdi:chart-bar", cards: [
        { type: "entities", entities: [exp] },
        { type: "custom:smartlists-card", entity: lists[0], settings_only: true, settings_scope: "stats" }] } : null,
    ].filter(Boolean) };
    status.textContent = t.loading;
    try {
      try { await this._hass.callWS({ type: "lovelace/dashboards/create", url_path: "smartlists-shopping", title: t.db_title, icon: "mdi:cart-outline", show_in_sidebar: true, require_admin: false, mode: "storage" }); }
      catch (e) { if (!/exist|unique/i.test((e && e.message) || "")) throw e; }
      await this._hass.callWS({ type: "lovelace/config/save", url_path: "smartlists-shopping", config });
      status.textContent = "";
      fill(status, "✓ ", h("a", { href: `/smartlists-shopping/${config.views[0] ? config.views[0].path : ""}`, target: "_top" }, t.db_open));
    } catch (err) { status.textContent = (err && err.message) || t.error; }
  }

  // Von vorn anfangen: Teile zurücksetzen, dann den Assistenten starten. To-do-Listen bleiben immer erhalten.
  _resetDialog() {
    const t = this._t;
    const opts = { settings: true, data: false, links: false, combined: false };
    const box = (key) => h("label", { class: "rsrow" },
      h("input", { type: "checkbox", checked: opts[key], onchange: (e) => { opts[key] = e.target.checked; } }),
      h("span", {}, h("b", {}, t["rs_" + key]), h("small", {}, t["rs_" + key + "_sub"])));
    const status = h("span", { class: "ok2" });
    const dlg = this._dialog(t.rs_title, h("div", {},
      h("style", {}, `.rsrow{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);cursor:pointer}
        .rsrow input{width:18px!important;height:18px!important;margin:3px 0 0!important;flex:none}.rsrow small{display:block;color:var(--secondary-text-color);font-size:.8rem}`),
      h("p", {}, t.rs_help), box("settings"), box("data"), box("links"), box("combined"), status), [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok danger", onclick: async () => {
        status.textContent = t.loading;
        try {
          await this._call("reset", opts, false);
          dlg.remove();
          this._showSettings = false; this._render();
          window.__smartlistsSetupOpen = true; // nicht zusätzlich automatisch öffnen
          await this._loadConfig();
          window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
          this._setupWizard();
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.rs_go)]);
  }

  // Vorhandene To-do-Listen in eigene SmartLists-Listen übernehmen (Admins)
  async _migrateDialog() {
    const t = this._t;
    let cands = [];
    try { cands = (await this._call("migrate_candidates", {}, false)).lists; } catch (err) { this._toast((err && err.message) || t.error); return; }
    const S = { sel: new Set(), mode: "each", name: "", tag: "", target: null };
    // Herkunft vor dem Namen: Lokale To-do, Einkaufsliste oder die Integration (Google Tasks, Todoist, CalDAV …)
    const platformChip = (pf) => {
      const known = { local_todo: t.mg_pf_local, shopping_list: t.mg_pf_shopping };
      const label = known[pf] || (pf ? pf.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()) : t.mg_pf_other);
      return h("span", { class: `pfchip ${pf === "local_todo" ? "local" : ""}` }, label);
    };
    const box = h("div", { class: "mgbox" });
    const status = h("span", { class: "ok2" });
    const draw = () => {
      const chosen = cands.filter((c) => S.sel.has(c.entity_id));
      if (!S.targetTouched) S.target = chosen.length && chosen.every((c) => c.notes) ? "notes" : "list";
      const used = chosen.filter((c) => c.used_in.length);
      const radio = (group, value, label, sub, disabled) => h("label", { class: `mgopt ${disabled ? "dis" : ""}` },
        h("input", { type: "radio", name: group, checked: S[group] === value, disabled: !!disabled, onchange: () => { S[group] = value; if (group === "target") S.targetTouched = true; draw(); } }),
        h("span", {}, h("b", {}, label), sub ? h("small", {}, sub) : null));
      fill(box,
        h("style", {}, `.mgbox .mgl,.mgbox .mgopt{display:flex;gap:10px;align-items:flex-start;padding:7px 0;cursor:pointer}
          .mgbox input[type=checkbox],.mgbox input[type=radio]{width:18px!important;height:18px!important;margin:2px 0 0!important;flex:none}
          .mgbox small{display:block;color:var(--secondary-text-color);font-size:.8rem}.mgbox .mgopt.dis{opacity:.45;cursor:default}
          .mgbox h3{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color);margin:14px 0 2px}
          .mgbox .warn{color:var(--warning-color,#f57c00);font-size:.85rem}
          .mgbox .pfchip{display:inline-block;font-size:.7rem;font-weight:600;padding:1px 7px;border-radius:9px;margin-right:6px;vertical-align:1px;
            background:var(--secondary-background-color,#eee);color:var(--secondary-text-color)}
          .mgbox .pfchip.local{background:color-mix(in srgb, var(--primary-color) 18%, transparent);color:var(--primary-color)}`),
        h("p", { class: "shelp" }, t.mg_help),
        h("h3", {}, t.mg_lists),
        cands.length ? cands.map((c) => h("label", { class: "mgl" },
          h("input", { type: "checkbox", checked: S.sel.has(c.entity_id), onchange: (e) => { if (e.target.checked) S.sel.add(c.entity_id); else S.sel.delete(c.entity_id); draw(); } }),
          h("span", {}, platformChip(c.platform), c.notes ? h("span", { class: "pfchip local" }, "📝 " + t.mg_pf_notes) : null, h("b", {}, c.name), h("small", {}, `${c.entity_id} · ${c.open} ${t.open}`)))) : h("p", {}, t.mg_none),
        // Ziel: als Liste oder als Notizen (Standard: Notizen, wenn nur Notizlisten gewählt sind)
        chosen.length ? [h("h3", {}, t.mg_as),
          radio("target", "list", t.mg_as_list, t.mg_as_list_sub),
          radio("target", "notes", t.mg_as_notes, t.mg_as_notes_sub)] : null,
        chosen.length > 1 ? [h("h3", {}, t.mg_how),
          radio("mode", "each", t.mg_each, t.mg_each_sub),
          radio("mode", "one", t.mg_one, t.mg_one_sub),
          S.mode === "one" ? h("div", { style: "padding-left:28px" },
            h("input", { placeholder: t.mg_name, "aria-label": t.mg_name, value: S.name, oninput: (e) => { S.name = e.target.value; }, style: "width:100%;box-sizing:border-box" }),
            h("label", { class: "mgopt" }, h("span", {}, t.mg_tag + " "),
              h("select", { "aria-label": t.mg_tag, onchange: (e) => { S.tag = e.target.value; } },
                [["", t.mg_tag_none], ["person", t.kind_person], ["tag", t.kind_tag]].map(([v, l]) => h("option", { value: v, selected: S.tag === v }, l))))) : null] : null,
        chosen.length ? [h("h3", {}, t.mg_old),
          h("p", { class: "shelp" }, t.mg_keep_info),
          used.length ? h("p", { class: "warn" }, "⚠️ " + t.mg_used.replace("{lists}", used.map((c) => `${c.name} → ${c.used_in.join(", ")}`).join("; "))) : null] : null,
        status);
    };
    draw();
    const dlg = this._dialog("📥 " + t.mg_title, box, [
      h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
      h("button", { type: "button", class: "ok", onclick: async () => {
        if (!S.sel.size) { status.textContent = t.mg_pick; return; }
        status.textContent = t.loading;
        try {
          const r = await this._call("migrate", { sources: [...S.sel], mode: S.sel.size > 1 ? S.mode : "each", name: S.name || null, tag_kind: S.tag || null, target: S.target || "list" }, false);
          dlg.remove();
          window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
          // Hinweis: die alten Listen gibt es noch – bitte selbst löschen, wenn alles passt
          const olds = cands.filter((c) => S.sel.has(c.entity_id));
          await slDialog(this.shadowRoot, { title: "✓ " + t.mg_title, ok: "OK", cancel: null,
            text: r.lists.map((l) => `${l.name}: ${l.items} ${t.mg_items}`).join("\n")
              + `\n\n${t.mg_done_hint}\n` + olds.map((c) => `• ${c.name} (${c.entity_id})`).join("\n")
              + (olds.some((c) => c.used_in.length) ? `\n\n⚠️ ${t.mg_done_combined}` : "") });
        } catch (err) { status.textContent = (err && err.message) || t.error; }
      } }, t.mg_go)], 520);
  }

  _toast(text) {
    clearTimeout(this._toastT);
    const el = h("div", { class: "msg" }, text);
    fill(this._msgEl, el);
    this._toastT = setTimeout(() => { if (this._msgEl.firstChild === el) fill(this._msgEl); }, 4000);
  }

  // In der Companion-App (Android/iOS): deren eigenen Scanner nutzen (External Bus „bar_code/scan“) –
  // zuverlässiger als die Kamera im WebView. Ergebnis kommt als Befehl „bar_code/scan_result“ zurück.
  _nativeScanner() {
    const ext = this._hass && this._hass.auth && this._hass.auth.external;
    return ext && ext.config && Number(ext.config.hasBarCodeScanner) > 0 && typeof window.externalBus === "function" ? ext : null;
  }
  _scanNative(ext) {
    const t = this._t;
    const orig = window.externalBus;
    let finished = false;
    const restore = () => { if (window.externalBus === hook) window.externalBus = orig; };
    const finish = () => { finished = true; restore(); try { ext.fireMessage({ type: "bar_code/close" }); } catch (e) { /* */ } };
    const hook = (raw) => {
      let msg = raw;
      try { if (typeof raw === "string") msg = JSON.parse(raw); } catch (e) { /* */ }
      if (!finished && msg && msg.type === "command" && msg.command === "bar_code/scan_result") {
        const code = String((msg.payload && (msg.payload.rawValue || msg.payload.code)) || "").trim();
        if (/^\d{6,14}$/.test(code)) { finish(); this._barcodeLookup(code); }
        else { try { ext.fireMessage({ type: "bar_code/notify", payload: { message: t.scan_not_product } }); } catch (e) { /* */ } }
      } else if (!finished && msg && msg.type === "command" && msg.command === "bar_code/aborted") {
        finished = true; restore();
        if (msg.payload && msg.payload.reason === "alternative_options") this._scanDialog(true);
      }
      return orig(raw); // HA beantwortet den Befehl wie gewohnt
    };
    window.externalBus = hook;
    try {
      ext.fireMessage({ type: "bar_code/scan", payload: { title: t.scan, description: t.scan_native_help, alternative_option_label: t.scan_type } });
    } catch (e) { restore(); this._scanDialog(true); }
  }
  // Strichcode → Produkt (Speicher der Integration, sonst Open Food Facts) → Name ins Eingabefeld
  async _barcodeLookup(code) {
    const t = this._t;
    try {
      const r = await this._call("barcode", { code }, false);
      // Online-Suche aus (Standard): sagen, wo man sie einschaltet – sonst wirkt der Scanner kaputt
      if (!r.found) { this._toast(`${code}: ${r.source === "off" ? t.scan_off : t.scan_unknown}`); return; }
      const text = [r.name, r.brand && !r.name.toLowerCase().includes(r.brand.toLowerCase()) ? `(${r.brand})` : ""].filter(Boolean).join(" ");
      // Einstellung „Für mich → Scanner“: Ziel-Liste und ob direkt hinzufügen oder erst ins Eingabefeld
      const target = (this._ui && this._ui.scan_target) || this._config.entity;
      const direct = (this._ui && this._ui.scan_mode === "add") || target !== this._config.entity;
      if (direct) {
        await this._hass.callWS({ type: "smartlists/add_item", entity_id: target, text });
        const name = (this._hass.states[target] && this._hass.states[target].attributes.friendly_name) || target;
        this._toast(`✓ ${text} → ${name}`);
        if (target === this._config.entity) this._load();
        return;
      }
      if (this._input) { this._input.value = text; this._input.dispatchEvent(new Event("input")); this._input.focus(); }
    } catch (err) { this._toast((err && err.message) || t.error); }
  }
  // Strichcode scannen (Kamera, BarcodeDetector) oder eintippen → Name über SmartLists/Open Food Facts ins Eingabefeld
  async _scanDialog(manualOnly = false) {
    const ext = !manualOnly && this._nativeScanner();
    if (ext) { this._scanNative(ext); return; }
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
    // Zeilen am Griff ⠿ ziehen (Maus, Finger, Stift) oder mit ▲▼ verschieben
    const sorting = true;
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
      iconBtn(ICON.chevron, t.pack_up, () => move(i, -1), "up"), iconBtn(ICON.chevron, t.aisle_down, () => move(i, 1)))));
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
      h("div", { class: "acts" }, status,
        h("button", { class: "btn2", type: "button", onclick: () => { save(null); order = cats.map(([id]) => id); draw(); } }, t.aisle_reset),
        h("button", { class: "btn2 primary", type: "button", onclick: () => save(order) }, t.save)));
    draw();
  }

  // Für mich → Benachrichtigungen (jeder für sich)
  _notifySection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let cur = null, services = [], entities = [], customAllowed = false, users = [];
    const save = async (patch) => {
      cur = { ...cur, ...patch };
      try { cur = (await this._call("set_notify", { settings: cur }, false)).settings; status.textContent = "✓ " + t.saved; draw(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const lists = () => Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, this._hass.states[e].attributes.friendly_name))
      .map((e) => [e, this._hass.states[e].attributes.friendly_name || e]);
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, "aria-pressed": String(on), onclick: fn }, label);
    const pretty = (name) => name.replace(/_/g, " ");
    const targetLabel = (x) => {
      if (x.label) return x.label;
      const name = x.id.split(".")[1] || x.id;
      if (x.kind === "entity") { const e = entities.find((y) => y.id === x.id); return "🔔 " + (e ? e.name : x.id); }
      if (x.kind === "custom") return "⚙️ " + x.id;
      return name.startsWith("mobile_app_") ? "📱 " + pretty(name.slice(11)) : /telegram/.test(name) ? "✈️ " + pretty(name) : "✉️ " + pretty(name);
    };
    // Ziel hinzufügen: Dienst | Entität | eigener Dienst (Admins, z. B. telegram_bot.send_message mit {"target": 123})
    const addTarget = () => {
      let kind = services.length ? "service" : entities.length ? "entity" : "custom";
      const box = h("div", {});
      const err = h("div", { class: "shelp" });
      const fields = {};
      const picked = new Set();
      const has = (id) => cur.targets.some((x) => x.id === id);
      const tiles = (items) => h("div", { class: "ntiles" }, items.map((it) => {
        const key = it.kind + "|" + it.id, on = picked.has(key);
        const lab = targetLabel(it), icon = lab.split(" ")[0];
        return h("button", { type: "button", class: `ntile ${on ? "on" : ""}`, "aria-pressed": String(on),
          onclick: () => { if (on) picked.delete(key); else picked.add(key); drawBox(); } },
          h("span", { class: "ni" }, icon), h("span", { class: "nn" }, lab.slice(icon.length).trim(), it.sub ? h("small", {}, it.sub) : null), h("span", { class: "nc" }, on ? "✓" : ""));
      }));
      const drawBox = () => {
        const tabs = [["service", t.nt_service], ["entity", t.nt_entity], ...(customAllowed ? [["custom", t.nt_custom]] : [])];
        fields.select = null; fields.id = null; fields.data = null;
        fill(box,
          h("div", { class: "chips", style: "margin-bottom:10px" }, tabs.map(([k, l]) => h("button", { type: "button", class: `chip2 ${kind === k ? "on" : ""}`, onclick: () => { kind = k; drawBox(); } }, l))),
          // Geräte/Dienste als Kacheln – mehrere antippen, dann einmal hinzufügen; schon gewählte sind ausgeblendet
          kind === "service" ? (services.filter((sv) => !has("notify." + sv)).length ? tiles(services.filter((sv) => !has("notify." + sv)).map((sv) => ({ id: "notify." + sv, kind: "service" })))
            : h("p", { class: "shelp" }, t.nt_no_services)) : null,
          kind === "entity" ? (entities.filter((e) => !has(e.id)).length ? tiles(entities.filter((e) => !has(e.id)).map((e) => ({ id: e.id, kind: "entity", sub: e.id })))
            : h("p", { class: "shelp" }, t.nt_no_entities)) : null,
          kind === "custom" ? [
            (fields.id = h("input", { placeholder: "telegram_bot.send_message", "aria-label": t.nt_custom, style: "width:100%;box-sizing:border-box" })),
            (fields.data = h("textarea", { rows: "4", placeholder: '{"target": 123456789}', "aria-label": "JSON", style: "width:100%;box-sizing:border-box;margin-top:8px;font-family:monospace" })),
            h("p", { class: "shelp" }, t.nt_custom_help)] : null,
          h("p", { class: "shelp" }, t.nt_help), err);
      };
      drawBox();
      const dlg = this._dialog(t.nt_add, box, [
        h("button", { type: "button", onclick: () => dlg.remove() }, t.cancel),
        h("button", { type: "button", class: "ok", onclick: async () => {
          let target;
          if (kind === "custom") {
            let data = {};
            try { data = fields.data.value.trim() ? JSON.parse(fields.data.value) : {}; } catch (e) { err.textContent = t.pack_bad_json; return; }
            if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(fields.id.value.trim())) { err.textContent = t.nt_bad_service; return; }
            target = { kind, id: fields.id.value.trim(), data };
          } else {
            const many = [...picked].map((k) => { const i = k.indexOf("|"); return { kind: k.slice(0, i), id: k.slice(i + 1) }; });
            if (!many.length) { err.textContent = t.nt_pick; return; }
            dlg.remove();
            await save({ targets: [...cur.targets, ...many] });
            return;
          }
          dlg.remove();
          await save({ targets: [...cur.targets, target] });
        } }, t.nt_add)]);
    };
    const draw = () => {
      const q = cur.quiet;
      fill(body,
        // Ziele: beliebig viele – Companion-App, andere notify-Dienste (Telegram, E-Mail …), notify-Entitäten, eigene Dienste
        h("div", { class: "grp" }, t.notify_to),
        h("div", { class: "ntiles" }, cur.targets.map((x, i) => {
          const lab = targetLabel(x), icon = lab.split(" ")[0];
          return h("div", { class: "ntile on" }, h("span", { class: "ni" }, icon), h("span", { class: "nn" }, lab.slice(icon.length).trim()),
            iconBtn(ICON.close, t.delete, () => save({ targets: cur.targets.filter((_, j) => j !== i) }), "danger"));
        }), h("button", { type: "button", class: "ntile add", onclick: () => addTarget() }, h("span", { class: "ni" }, "＋"), h("span", { class: "nn" }, t.nt_add))),
        cur.targets.length ? null : h("div", { class: "shelp" }, t.nt_none),
        this._setRow(t.notify_added, this._switch(cur.added, (v) => save({ added: v }), t.notify_added)),
        this._setRow(t.notify_checked, this._switch(cur.checked, (v) => save({ checked: v }), t.notify_checked)),
        this._setRow(t.notify_own, this._switch(!!cur.own, (v) => save({ own: v }), t.notify_own), t.notify_own_sub),
        h("div", { class: "grp" }, t.notify_lists),
        h("div", { class: "chips" }, chipOf(!cur.lists.length, t.notify_all_lists, () => save({ lists: [] })),
          lists().map(([e, n]) => chipOf(cur.lists.includes(e), n, () => save({ lists: cur.lists.includes(e) ? cur.lists.filter((x) => x !== e) : [...cur.lists, e] })))),
        users.length ? h("div", { class: "grp" }, t.notify_from) : null,
        users.length ? h("div", { class: "chips" }, users.filter((u) => u.id !== (this._hass.user && this._hass.user.id)).map((u) =>
          chipOf(!cur.muted.includes(u.id), u.name, () => save({ muted: cur.muted.includes(u.id) ? cur.muted.filter((x) => x !== u.id) : [...cur.muted, u.id] })))) : null,
        this._setRow(t.notify_quiet, h("select", { "aria-label": t.notify_quiet, onchange: (e) => save({ quiet: e.target.value ? e.target.value.split("-").map(Number) : null }) },
          [["", t.notify_quiet_none], ["22-7", "22–7"], ["21-7", "21–7"], ["23-8", "23–8"]].map(([v, l]) =>
            h("option", { value: v, selected: (q ? q.join("-") : "") === v }, l)))),
        h("div", { class: "acts" }, status, cur.targets.length ? h("button", { class: "btn2", type: "button", onclick: async () => {
          status.textContent = t.loading;
          try {
            const r = await this._call("notify_test", {}, false);
            status.textContent = "✓ " + t.notify_test_sent + (r.errors && r.errors.length ? ` – ${t.error}: ${r.errors.join("; ")}` : "");
          }
          catch (err) { status.textContent = `${t.error}: ${(err && err.message) || ""}`; }
        } }, "🔔 " + t.notify_test) : null));
    };
    Promise.all([this._call("notify", {}, false), this._call("users", {}, false).catch(() => ({ users: [] }))])
      .then(([r, u]) => { cur = r.settings; services = r.services || []; entities = r.entities || []; customAllowed = !!r.custom_allowed; users = u.users || []; draw(); }).catch(() => fill(body, t.error));
    return this._sec("🔔", t.notify, t.notify_help, [body]);
  }

  // Statistik + Ausgaben (Reiter „Statistik“ der allgemeinen Einstellungen bzw. 📊 auf der Seite)
  _paneStats() { return [this._statsSection(), this._expensesSection()]; }
  _statsSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let days = 90;
    const picked = new Set();  // ausgewählte Artikel (Admins: aus der Statistik nehmen)
    const load = () => this._call("stats", { days }, false).then((r) => { picked.clear(); draw(r); }).catch(() => fill(body, t.error));
    const resetStats = async (names) => {
      const text = names ? t.stats_reset_sel_q.replace("{n}", names.length) : t.stats_reset_all_q;
      if (!(await slDialog(this.shadowRoot, { title: t.stats_reset, text, ok: t.delete, cancel: t.cancel, danger: true }))) return;
      await this._call("reset_stats", names ? { names } : {}, false);
      load();
    };
    const chipOf = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const draw = (r) => {
      const max = Math.max(1, ...r.top.map((x) => x.count));
      fill(body,
        h("div", { class: "chips" }, [[90, t.stats_90], [365, t.stats_year], [0, t.stats_all]].map(([d, l]) => chipOf(days === d, l, () => { days = d; load(); }))),
        h("div", { class: "grp" }, t.stats_top),
        r.top.length ? r.top.slice(0, 15).map((x) => h("div", { class: "statrow" }, h("span", {},
            this._isAdmin ? h("input", { type: "checkbox", class: "pick", "aria-label": x.name, checked: picked.has(x.name),
              onchange: (e) => { if (e.target.checked) picked.add(x.name); else picked.delete(x.name); draw(r); } }) : null, x.name,
            this._isAdmin ? h("button", { class: "xdel", type: "button", title: t.stats_forget, "aria-label": `${t.stats_forget}: ${x.name}`,
              onclick: async () => { if (await slDialog(this.shadowRoot, { title: t.stats_forget, text: `${x.name}: ${t.stats_forget_help}`, ok: t.delete, cancel: t.cancel, danger: true })) { await this._call("forget_history", { name: x.name }, false); load(); } } }, "×") : null),
          h("span", { class: "shelp", style: "padding:0" }, `${x.count}×${x.every_days ? ` · ${t.stats_every} ${x.every_days} ${t.days}` : ""}`),
          h("div", { class: "bar2" }, h("i", { style: `width:${Math.round(100 * x.count / max)}%` }))))
          : h("div", { class: "shelp" }, t.stats_none),
        // Admins: Auswahl aus der Statistik nehmen bzw. alles zurücksetzen
        this._isAdmin ? h("div", { class: "acts", style: "justify-content:flex-start;flex-wrap:wrap" },
          picked.size ? h("button", { class: "btn2 danger", type: "button", onclick: () => resetStats([...picked]) }, `${t.stats_reset_sel} (${picked.size})`) : null,
          r.top.length ? h("button", { class: "linkbtn", type: "button", onclick: () => { const all = r.top.slice(0, 15).every((x) => picked.has(x.name));
            r.top.slice(0, 15).forEach((x) => (all ? picked.delete(x.name) : picked.add(x.name))); draw(r); } }, t.sel_all) : null,
          h("button", { class: "linkbtn danger", type: "button", onclick: () => resetStats(null) }, t.stats_reset + " …")) : null,
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
      try { entries = (await this._call("expense_entries", { limit: 100 }, false)).entries; } catch (e) { slWarn("expense_entries", e); }
      if (!entries.length) return fill(entriesEl, h("div", { class: "shelp" }, t.exp_none));
      const sel = new Set();
      const bar = h("div", { class: "acts", style: "justify-content:flex-start;flex-wrap:wrap" });
      const del = async (ids) => {
        const text = ids ? t.exp_delete_sel_q.replace("{n}", ids.length) : t.exp_delete_all_q;
        if (!(await slDialog(this.shadowRoot, { title: t.delete, text, ok: t.delete, cancel: t.cancel, danger: true }))) return;
        await this._call("delete_expenses", ids ? { expense_ids: ids } : { all: true }, false);
        load();
      };
      const drawBar = () => fill(bar,
        sel.size ? h("button", { class: "btn2 danger", type: "button", onclick: () => del([...sel]) }, `${t.exp_delete_sel} (${sel.size})`) : null,
        h("button", { class: "linkbtn", type: "button", onclick: () => { const all = sel.size === entries.length;
          entries.forEach((e) => (all ? sel.delete(e.id) : sel.add(e.id))); entriesEl.querySelectorAll("input.pick").forEach((c) => { c.checked = !all; }); drawBar(); } }, t.sel_all),
        h("button", { class: "linkbtn danger", type: "button", onclick: () => del(null) }, (this._isAdmin ? t.exp_delete_all : t.exp_delete_mine) + " …"));
      drawBar();
      fill(entriesEl, bar, h("div", { class: "learned2" }, entries.map((e) => h("div", { class: "lrow2" },
        h("span", { class: "w" }, h("input", { type: "checkbox", class: "pick", "aria-label": e.name,
          onchange: (ev) => { if (ev.target.checked) sel.add(e.id); else sel.delete(e.id); drawBar(); } }), e.name, h("span", { class: "manual" }, `${new Date(e.t * 1000).toLocaleDateString(lang || "de")}${e.store ? " · " + itemStoreLabel(e.store, this._cfg) : ""}`)),
        h("span", { class: "cat" }, fmtMoney(e.amount, lang)),
        iconBtn(ICON.close, t.delete, async () => { await this._call("delete_expense", { expense_id: e.id }, false); load(); }, "danger")))));
    };
    load();
    return this._sec("💶", t.exp, t.exp_help, [body]);
  }

