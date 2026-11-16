  /* ---------------- Einstellungen (Zahnrad) ----------------
   * Reiter: „Für mich“ (persönliche Bedienung), „Haushalt“ (Admins: Namenskonvention, Kategorien,
   * Sprache & Automationen, Geräte, Sichern, Bedienung für alle), „Diese Liste“ (Freigaben, Infos).
   * Alle Texte in TEXTS (de/en). */
  _sec(icon, title, help, body, count) {
    return h("div", { class: "sec" },
      h("div", { class: "sh" }, h("h3", {}, title), count != null ? h("span", { class: "cnt" }, String(count)) : null),
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
  _controls(scope, part) {
    const t = this._t;
    const ui = this._scopeValues(scope);
    const house = this._scopeValues("household");
    const differs = (key) => scope !== "household" && JSON.stringify(ui[key]) !== JSON.stringify(house[key]);
    const save = (patch) => this._saveUi(patch, scope);
    const sel = (key, opts) => h("select", { "aria-label": t[key], onchange: (e) => save({ [key]: e.target.value }) },
      opts.map(([v, l]) => h("option", { value: v, selected: ui[key] === v }, t[l])));
    const sw = (key, sub) => this._setRow(t[key], this._switch(ui[key], (v) => save({ [key]: v }), t[key]), sub, differs(key));
    const actions = ui.menu_actions || MENU_ACTIONS;
    const parts = {};
    parts.menu = [
      this._setRow(t.press_gesture, sel("press_gesture", [["long", "g_long"], ["double", "g_double"], ["right", "g_right"], ["off", "g_off"]]), null, differs("press_gesture")),
      this._setRow(t.press_result, sel("press_result", [["menu", "r_menu"], ["edit", "r_edit"], ["delete", "r_delete"]]), null, differs("press_result")),
      this._setRow(t.press_target, sel("press_target", [["row", "t_row"], ["name", "t_name"]]), null, differs("press_target")),
      sw("row_buttons"),
    ];
    parts.actions = [
      h("div", { class: "chips", style: "padding-top:8px" }, MENU_ACTIONS.map((a) => h("button", { type: "button", class: `chip2 ${actions.includes(a) ? "on" : ""}`, "aria-pressed": String(actions.includes(a)),
        onclick: () => save({ menu_actions: MENU_ACTIONS.filter((x) => (x === a ? !actions.includes(a) : actions.includes(x))) }) }, t["m_" + a]))),
    ];
    parts.shop = [
      sw("shop_hide_checked"), sw("shop_keep_awake"), sw("shop_large", t.shop_large_help), sw("shop_tap_row"),
      sw("shop_longpress_delete", t.shop_longpress_delete_help),
      sw("shop_auto_store", t.shop_auto_store_help), sw("shop_untagged", t.shop_untagged_help),
      this._setRow(t.shop_finish, sel("shop_finish", [["shopping", "shop_finish_shopping"], ["always", "shop_finish_always"], ["never", "shop_finish_never"]]), null, differs("shop_finish")),
    ];
    parts.scan = [
      this._setRow(t.scan_target, h("select", { "aria-label": t.scan_target, onchange: (e) => save({ scan_target: e.target.value }) },
        h("option", { value: "", selected: !ui.scan_target }, t.scan_target_this),
        Object.keys(this._hass.states).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, this._hass.states[e].attributes.friendly_name))
          .map((e) => h("option", { value: e, selected: ui.scan_target === e }, this._hass.states[e].attributes.friendly_name || e))), null, differs("scan_target")),
      this._setRow(t.scan_mode, sel("scan_mode", [["input", "scan_mode_input"], ["add", "scan_mode_add"]]), null, differs("scan_mode")),
    ];
    return part ? parts[part] : [...parts.menu, h("div", { class: "grp" }, t.menu_actions), ...parts.actions,
      h("div", { class: "grp" }, t.shop), ...parts.shop, h("div", { class: "grp" }, t.scan), ...parts.scan];
  }

  /* Allgemeine Einstellungen: Bereiche (links Navigation, rechts der Bereich in Spalten; schmal: erst die
   * Bereiche, dann der gewählte). Gruppen: Für mich · Global (nur Admins) · Auswertung. */
  _areas() {
    const t = this._t;
    const device = this._uiScope === "device";
    const scope = device ? "device" : "user";
    const chip = (on, label, fn) => h("button", { type: "button", class: `chip2 ${on ? "on" : ""}`, onclick: fn }, label);
    const scopeRow = () => this._setRow(t.a_applies, h("div", { class: "chips" },
      chip(!device, t.scope_user, () => this._setScope("user")), chip(device, t.scope_device, () => this._setScope("device"))));
    const reset = (sc) => h("button", { class: "linkbtn", type: "button", onclick: () => this._resetUi(sc) }, sc === "household" ? t.reset : t.reset_default);
    const me = [
      { g: "me", id: "controls", label: t.ui, sub: t.ui_me_help, kw: [t.press_gesture, t.menu_actions, t.row_buttons], build: () => [
        this._sec("", t.a_menu, null, [scopeRow(), ...this._controls(scope, "menu")]),
        this._sec("", t.menu_actions, null, [...this._controls(scope, "actions"), reset(scope)])] },
      { g: "me", id: "shop", label: t.a_shop, sub: t.a_me_sub, kw: [t.shop, t.scan, t.scan_target], build: () => [
        this._sec("", t.shop, null, this._controls(scope, "shop")),
        this._sec("", t.scan, null, this._controls(scope, "scan"))] },
      { g: "me", id: "lang", label: t.ui_lang, sub: t.ui_lang_help, kw: [t.ui_lang, "language", "Sprache"], build: () => [this._langSection()] },
      { g: "me", id: "notify", label: t.notify, sub: t.a_me_sub, kw: [t.notify_to, t.notify_quiet], build: () => [this._notifySection()] },
    ];
    const global = !this._isAdmin ? [] : [
      { g: "global", id: "look", label: t.a_look, sub: t.a_global_sub, kw: [t.naming, t.look, t.look_color], build: () => [this._namingSection(), this._appearanceSection(), this._orderSection()] },
      { g: "global", id: "price", label: t.a_price, sub: t.a_global_sub, kw: [t.cur_label, t.price, t.price_how, "currency", "CHF", "€"], build: () => this._priceSection() },
      { g: "global", id: "stores", label: t.stores, sub: t.a_global_sub, kw: [t.zone, t.aisle], build: () => [this._storesSection()] },
      { g: "global", id: "cats", label: t.a_cats, sub: t.learned_help, kw: [t.packs, t.learned, t.category], build: () => [this._packsSection(), this._learnedSection()] },
      { g: "global", id: "extras", label: t.x_title, sub: t.x_help, kw: [t.notes, t.mp_title, t.x_notes, t.x_mealplan, t.x_stats, t.stats, t.exp], build: () => [this._extrasSection()] },
      { g: "global", id: "devices", label: t.a_devices, sub: t.devices_help, kw: [t.devices, t.notes, t.app_list], build: () => [this._devicesSection(), this._notesSection()] },
      { g: "global", id: "rights", label: t.a_rights, sub: t.a_rights_sub, kw: [t.share, t.rights_who, t.pub_title, t.pub_tunnel, t.pub_proxy, "cloudflared", "tunnel", "proxy"], build: () => [this._rightsShareSection(), this._publicSection(), this._rightsOtherSection()] },
      // 4.0: „Sprache, Sichern, Standard“ ist aufgeteilt – Einrichtung, Zurücksetzen und Dashboard stehen unter „Info“ (ganz unten)
      { g: "global", id: "auto", label: t.a_auto, sub: t.a_global_sub, kw: [t.automation, t.barcode_providers, t.barcode_lookup, "assist"], build: () => [this._automationSection()] },
      { g: "global", id: "backup", label: t.backup, sub: t.a_global_sub, kw: [t.backup, t.mg_title, "export", "import"], build: () => [
        this._exportImport(),
        this._sec("", t.mg_title, t.mg_sub, [h("button", { class: "btn2", type: "button", onclick: () => this._migrateDialog() }, "📥 " + t.mg_title + " …")])] },
      { g: "global", id: "house", label: t.ui_house, sub: t.scope_help_household, kw: [t.ui_house, t.reset], build: () => [
        this._sec("", t.ui_house, null, [...this._controls("household"), reset("household")])] },
    ];
    const link = (label, href) => h("a", { class: "btn2", href, target: "_blank", rel: "noopener", style: "text-decoration:none;display:inline-flex;align-items:center" }, label);
    const REPO = "https://github.com/m3m0rex/ha_smartlists";
    const info = [{ g: "info", id: "info", label: t.a_info, sub: t.a_info_sub, kw: [t.info_version, t.w_restart, t.rs_title, t.db_title, t.info_help, "version", "setup"], build: () => [
      this._sec("", t.info_version, null, [h("div", { class: "kv" },
        h("span", {}, "SmartLists"), h("b", {}, this._version || CARD_VERSION),
        this._version && this._version !== CARD_VERSION ? [h("span", {}, t.card || "Card"), h("b", {}, CARD_VERSION)] : null,
        h("span", {}, "Home Assistant"), h("b", {}, (this._hass.config && this._hass.config.version) || "–"))]),
      this._sec("", t.info_help, null, [h("div", { class: "acts", style: "justify-content:flex-start;flex-wrap:wrap" },
        link("📖 " + t.info_docs, REPO + "/wiki"), link("🐞 " + t.info_issue, this._issueUrl()), link("📝 " + t.info_changelog, REPO + "/blob/main/CHANGELOG.md"))]),
      ...(!this._isAdmin ? [] : [
        (() => { const st = h("span", { class: "ok2" }); return this._sec("", t.db_title, t.db_help, [h("div", { class: "acts", style: "justify-content:flex-start" },
          h("button", { class: "btn2", type: "button", onclick: () => this._createDashboard(st) }, t.db_create), st)]); })(),
        this._sec("", t.w_restart, t.w_restart_sub, [h("div", { class: "acts", style: "justify-content:flex-start;flex-wrap:wrap" },
          h("button", { class: "btn2", type: "button", onclick: () => this._setupWizard() }, t.w_restart),
          h("button", { class: "btn2 danger", type: "button", onclick: () => this._resetDialog() }, t.rs_title + " …"))])])] }];
    // Statistik und Ausgaben: optionales Extra (Einstellungen → Extras)
    const stats = !this._feat("stats") ? [] : [{ g: "stats", id: "stats", label: t.a_stats, sub: null, kw: [t.stats, t.exp], build: () => [this._statsSection(), this._expensesSection()] }];
    return [...me, ...global, ...stats, ...info];
  }

  // Global → Teilen und Rechte: was Benutzer ohne Admin-Rechte dürfen
  _rightsShareSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const body = h("div");
    const linksEl = h("div");
    let rights = { ...((this._cfg && this._cfg.rights) || {}) };
    const save = async (patch) => {
      rights = { ...rights, ...patch };
      try { rights = (await this._call("set_rights", { rights }, false)).rights; this._cfg = { ...this._cfg, rights }; status.textContent = "✓ " + t.saved; }
      catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const pick = (key, opts, map = (v) => v) => h("select", { "aria-label": t["rights_" + key], onchange: (e) => save({ [key]: map(e.target.value) }) },
      opts.map(([v, l]) => h("option", { value: String(v), selected: String(rights[key] ?? "") === String(v) }, l)));
    const fmt = (ts) => new Date(ts * 1000).toLocaleDateString(this._hass.language || "de");
    const showLinks = async () => {
      fill(linksEl, h("div", { class: "shelp" }, t.loading));
      let links = [];
      try { links = (await this._call("share_links_all", {}, false)).links; } catch (e) { slWarn("share_links_all", e); }
      if (!links.length) return fill(linksEl, h("div", { class: "shelp" }, t.rights_no_links));
      fill(linksEl, ...links.map((l) => this._setRow(l.list_name,
        h("button", { class: "linkbtn", type: "button", onclick: async () => { await this._hass.callWS({ type: "smartlists/share_revoke", entity_id: l.entity_id, link_id: l.id }); showLinks(); } }, t.share_revoke),
        `${({ off: t.share_view, soft: t.share_soft, on: t.share_check })[l.check]}${l.add ? ", " + t.share_add : ""}, ${l.expired ? t.share_expired : l.expires ? `${t.share_until} ${fmt(l.expires)}` : t.share_forever}, ${l.opens}× ${t.share_opened}`)));
    };
    const draw = () => fill(body,
      this._setRow(t.rights_who, pick("share_who", [["admins", t.rights_who_admins], ["owners", t.rights_who_owners], ["editors", t.rights_who_editors], ["nobody", t.rights_who_nobody]])),
      this._setRow(t.rights_max, pick("share_max", [["off", t.share_view], ["soft", t.share_soft], ["soft_add", t.share_soft_add], ["on", t.rights_max_on]]), t.rights_limits_help),
      this._setRow(t.rights_max_hours, pick("share_max_hours", [["", t.share_forever], [24, t.share_1d], [168, t.share_7d], [720, t.share_30d]], (v) => (v ? Number(v) : null))),
      h("div", { class: "acts", style: "justify-content:flex-start" }, h("button", { class: "linkbtn", type: "button", onclick: showLinks }, t.rights_all_links), status),
      linksEl);
    draw();
    return this._sec("", t.share, t.rights_share_help, [body]);
  }
  // Global → Teilen und Rechte → Öffentliche Adresse: Links über Quick Tunnel oder eigenen Proxy statt über die
  // Adresse von Home Assistant (public.py). SmartLists lädt cloudflared nie selbst herunter – nur Hinweis.
  _publicSection() {
    const t = this._t;
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
    const status = h("span", { class: "ok2" });
    const body = h("div", {}, h("div", { class: "shelp" }, t.loading));
    let st = null, mode = "ha", port = 8126, url = "", polls = 0, portOpen = false, token = "";
    const viaCf = (m) => m === "tunnel" || m === "named";  // beide Arten starten cloudflared
    // „<art>|<pfad>“ (siehe public.py binary_kind) → verständlicher Satz mit der passenden Datei
    const wrongText = (code) => {
      const i = code.indexOf("|");
      const kind = i < 0 ? "unknown" : code.slice(0, i), path = i < 0 ? code : code.slice(i + 1);
      const file = (st && st.cloudflared_file) || "cloudflared-linux-arm64";
      const key = ["amd64", "arm64", "arm", "386"].includes(kind) ? "pub_cf_arch" : "pub_cf_kind_" + kind;
      return fmt(t[key] || t.pub_cf_kind_unknown, { path, found: `cloudflared-linux-${kind}`, file });
    };
    const errText = (e) => {
      if (!e) return "";
      if (e.startsWith("cloudflared_wrong:")) return wrongText(e.slice("cloudflared_wrong:".length));
      const i = e.indexOf(":");
      const code = i < 0 ? e : e.slice(0, i), arg = i < 0 ? "" : e.slice(i + 1);
      return t["pub_err_" + code] ? fmt(t["pub_err_" + code], { port: arg, code: arg }) : e;
    };
    const load = async () => {
      try { st = await this._call("share_public", {}, false); } catch (err) { fill(body, h("div", { class: "shelp" }, (err && err.message) || t.error)); return; }
      if (polls === 0) { mode = st.mode; port = st.port; url = st.url; }
      draw();
      // Tunnel startet: ein paar Mal nachfragen, bis die Adresse da ist
      if (viaCf(st.mode) && !st.tunnel_url && !st.error && polls < 15) { polls++; setTimeout(load, 2000); } else polls = 0;
    };
    const save = async () => {
      status.textContent = t.loading;
      // Token nur mitschicken, wenn neu eingegeben (der gespeicherte bleibt in Home Assistant)
      try { st = await this._call("set_share_public", { mode, port: Number(port) || 8126, url, ...(token ? { token } : {}) }, false); status.textContent = "✓ " + t.saved; polls = 0; token = ""; }
      catch (err) { status.textContent = (err && err.message) || t.error; return; }
      if (viaCf(st.mode) && !st.tunnel_url && !st.error) { polls = 1; setTimeout(load, 2000); }
      draw();
    };
    const a = (href, label) => h("a", { href, target: "_blank", rel: "noreferrer noopener" }, label);
    const cfHint = () => h("div", { class: "shelp", style: "padding:6px 0;color:var(--warning-color,#ff9800)" },
      st.cloudflared_problem ? "⚠️ " + wrongText(st.cloudflared_problem) + " " : "⚠️ " + t.pub_cf_missing + " ",
      a(st.download, fmt(t.pub_cf_download, { file: st.cloudflared_file || "cloudflared-linux-arm64" })), " · ",
      fmt(t.pub_cf_where, { paths: (st.cloudflared_dirs || []).join(", "), file: st.cloudflared_file || "cloudflared-linux-arm64" }), " ", t.pub_cf_or_proxy);
    const draw = () => {
      if (!st) return;
      const live = st.mode === mode;  // gespeicherter Zustand gehört zur gewählten Art
      const state = !live ? null
        : viaCf(mode) ? (st.tunnel_url ? h("div", { class: "sharelink" }, "✓ " + st.tunnel_url) : st.error ? h("div", { class: "shelp", style: "color:var(--error-color,#db4437)" }, "⚠️ " + errText(st.error))
          : h("div", { class: "shelp" }, "⏳ " + t.pub_starting))
        : mode === "proxy" ? (st.server ? h("div", { class: "shelp" }, "✓ " + fmt(t.pub_server_ok, { port: st.port })) : h("div", { class: "shelp", style: "color:var(--error-color,#db4437)" }, "⚠️ " + errText(st.error)))
        : null;
      fill(body,
        this._setRow(t.pub_mode, h("select", { "aria-label": t.pub_mode, onchange: (e) => { mode = e.target.value; draw(); } },
          [["ha", t.pub_ha], ["tunnel", t.pub_tunnel], ["named", t.pub_named], ["proxy", t.pub_proxy]].map(([v, l]) => h("option", { value: v, selected: mode === v }, l)))),
        h("div", { class: "shelp", style: "padding:4px 0" }, mode === "ha" ? "ℹ️ " + t.pub_ha_help : mode === "tunnel" ? t.pub_tunnel_help : mode === "named" ? t.pub_named_help : fmt(t.pub_proxy_help, { port })),
        // feste Adresse: Anleitung Schritt für Schritt (Cloudflare-Menüs heißen je nach Konto leicht anders)
        mode === "named" ? h("details", { class: "pubhelp" }, h("summary", {}, "❓ " + t.pub_help_show),
          h("ol", { class: "shelp pubsteps" }, t.pub_named_steps.split("\n").map((x) => h("li", {}, fmt(x, { port }))))) : null,
        viaCf(mode) && !st.cloudflared ? cfHint() : null,
        viaCf(mode) && st.cloudflared ? h("div", { class: "shelp" }, "✓ cloudflared: " + st.cloudflared) : null,
        mode === "named" ? this._setRow(t.pub_token, h("input", { class: "search2", style: "width:240px;margin:0", type: "password", autocomplete: "off",
          placeholder: st.token_set ? t.pub_token_saved : "eyJ…", "aria-label": t.pub_token, oninput: (e) => { token = e.target.value.trim(); } }), t.pub_token_help) : null,
        mode === "proxy" || mode === "named" ? this._setRow(t.pub_url, h("input", { class: "search2", style: "width:240px;margin:0", type: "url", value: url, placeholder: "https://liste.example.org",
          "aria-label": t.pub_url, oninput: (e) => { url = e.target.value.trim(); } })) : null,
        // Port optional: Standard 8126, nur auf Wunsch ändern
        mode !== "ha" && !portOpen && Number(port) === 8126 ? h("div", { class: "acts", style: "justify-content:flex-start" },
          h("button", { class: "linkbtn", type: "button", onclick: () => { portOpen = true; draw(); } }, `${t.pub_port}: 8126 · ${t.pub_port_change}`)) : null,
        mode !== "ha" && (portOpen || Number(port) !== 8126) ? this._setRow(t.pub_port, h("input", { class: "search2", style: "width:100px;margin:0", type: "number", min: "1024", max: "65535", value: String(port),
          "aria-label": t.pub_port, oninput: (e) => { port = e.target.value; } }), t.pub_port_help) : null,
        state,
        mode === "tunnel" ? h("div", { class: "shelp", style: "padding:4px 0" }, "ℹ️ " + t.pub_tunnel_note, " ", a(st.docs, "trycloudflare")) : null,
        h("div", { class: "acts" }, status, h("button", { class: "btn2 primary", type: "button", onclick: save }, t.save)));
    };
    load();
    return this._sec("🛡️", t.pub_title, t.pub_help, [body]);
  }
  _rightsOtherSection() {
    const t = this._t;
    const body = h("div");
    let rights = { ...((this._cfg && this._cfg.rights) || {}) };
    const draw = () => fill(body, ...["create_lists", "templates", "categories", "prices"].map((key) =>
      this._setRow(t["rights_" + key], this._switch(rights[key] !== false, async (on) => {
        rights = { ...rights, [key]: on };
        try { rights = (await this._call("set_rights", { rights }, false)).rights; this._cfg = { ...this._cfg, rights }; } catch (e) { slWarn("set_rights", e); this._toast((e && e.message) || this._t.error); }
        draw();
      }, t["rights_" + key]))));
    draw();
    return this._sec("", t.rights_other, null, [body]);
  }

  // „geteilt“ antippen: Besitzer und Freigaben anzeigen (nur lesen). Ändern: Zahnrad → Freigaben (Besitzer/Admins).
  async _sharedWithDialog(d) {
    const t = this._t;
    let users = [];
    try { users = (await this._call("users", {}, false)).users || []; } catch (e) { /* Namen fehlen dann */ }
    const nameOf = (id) => (users.find((u) => u.id === id) || {}).name || "?";
    const shares = Object.entries((d.own && d.own.shares) || {});
    const rows = [`👑 ${d.own.owner || nameOf(d.own.owner_id)} · ${t.role_owner}`,
      ...shares.map(([id, role]) => `👤 ${nameOf(id)} · ${t["role_" + role] || role}`)];
    const canChange = this._isAdmin || d.own.role === "owner";
    await slDialog(this.shadowRoot, { title: `${t.sharing}: ${d.name}`,
      text: [...rows, ...(shares.length ? [] : ["", "🔒 " + t.private]), ...(canChange ? ["", t.shared_change_hint] : [])].join("\n"),
      ok: "OK" });
  }

  // Einstellungen dieser Liste – als Fenster über der Liste (breit: zwei Spalten, Handy: Blatt von unten)
  _listSections() {
    const t = this._t;
    const d = this._data;
    const canEdit = !!d && (this._isAdmin || (d.own && d.own.role === "owner"));
    const type = !d ? "?" : d.type === "combined" ? t.type_combined : d.type === "own" ? t.type_own : d.type === "notes" ? t.p_group_notes : t.type_list;
    const status = h("span", { class: "ok2" });
    const set = async (patch) => {
      try { await this._call("set_list_settings", patch); status.textContent = "✓ " + t.saved; this._listSettingsApplied = null; await this._load(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const cur = (d && d.settings) || {};
    const modes = SORT_MODES.filter((m) => (m !== "list" || (d && d.type === "combined")) && !(m === "category" && this._noCats));
    const listSec = this._sec("", t.ls_list, canEdit ? t.ls_list_help : null, [
      canEdit ? this._setRow(t.ls_name, h("input", { class: "search2", style: "width:180px;margin:0", value: d.name, maxlength: "60", "aria-label": t.ls_name,
        onchange: (e) => { const v = e.target.value.trim(); if (v && v !== d.name) set({ name: v }); } })) : null,
      canEdit && d.type !== "notes" ? this._setRow(t.ls_sort, h("select", { "aria-label": t.ls_sort, onchange: (e) => set({ sort: e.target.value || null }) },
        h("option", { value: "", selected: !cur.sort }, t.ls_default), modes.map((m) => h("option", { value: m, selected: cur.sort === m }, t["sort_" + m])))) : null,
      canEdit && d.type !== "notes" ? this._setRow(t.l_show_prices, this._switch(cur.show_prices !== false, (v) => set({ show_prices: v }), t.l_show_prices)) : null,
      // je Liste: einfache Liste (nichts merken), Kategorien aus, woher „häufig gekauft“/Vorschläge kommen
      canEdit && d.type !== "notes" ? this._setRow(t.l_plain, this._switch(cur.plain === true, (v) => set({ plain: v }), t.l_plain), t.l_plain_help) : null,
      canEdit && d.type !== "notes" && !cur.plain ? this._setRow(t.l_categories, this._switch(cur.categories !== false, (v) => set({ categories: v }), t.l_categories), t.l_categories_help) : null,
      canEdit && d.type !== "notes" && !cur.plain ? this._setRow(t.l_suggest, h("select", { "aria-label": t.l_suggest, onchange: (e) => set({ suggest_scope: e.target.value }) },
        [["list", d.type === "combined" ? t.l_suggest_sources : t.l_suggest_list], ["all", t.l_suggest_all]]
          .map(([v, l]) => h("option", { value: v, selected: (cur.suggest_scope || "list") === v }, l))), t.l_suggest_help) : null,
      this._setRow(t.type, h("span", { class: "val" }, type)),
      this._setRow(t.entity, h("code", { class: "val" }, this._config.entity)),
      d && (d.type === "combined" || d.type === "own") && (this._isAdmin || (d.own && d.own.role === "owner"))
        ? this._setRow(t.owner, this._ownerSelect(d, status), d.type === "combined" ? t.owner_combined_help : null)
        : d && d.own ? this._setRow(t.owner, h("span", { class: "val" }, d.own.owner || "?")) : null,
      d && d.source_lists && d.source_lists.length ? this._setRow(t.sources, h("span", { class: "val" }, d.source_lists.join(", "))) : null,
      h("div", { class: "acts" }, status),
    ]);
    const left = [listSec];
    // Herkunfts-Badges (kombinierte Listen): was sie zeigen und von welchen Quell-Listen – Admins und Besitzer
    if (d && d.type === "combined" && d.sources && d.sources.length > 1 && (this._isAdmin || (d.own && d.own.role === "owner")))
      left.push(this._labelSection(d));
    const canPeople = !!(d && d.own && d.own.can_share);
    const right = [];
    const rights = (this._cfg && this._cfg.rights) || {};
    const mayLink = d && d.type !== "notes" && rights.share_who !== "nobody" && (this._isAdmin
      || (rights.share_who === "owners" && d.own && d.own.role === "owner")
      || (rights.share_who === "editors" && (!d.own || ["owner", "editor"].includes(d.own.role))));
    // ein Teilen-Fenster: Link + Personen in Home Assistant; ohne Link-Recht nur die Personen (wie bisher)
    // 📲 als App auf dem Startbildschirm – nur auf der Seite /smartlists (dort wird das Manifest gesetzt)
    if (d && d.type !== "notes" && window.__smartlistsPanel && !slStandalone() && !slCompanion())
      right.push(this._sec("📲", t.app_title, t.app_lead, [h("div", { class: "acts", style: "justify-content:flex-start" },
        h("button", { class: "btn2 primary", type: "button", onclick: () => window.dispatchEvent(new CustomEvent("smartlists-app-dialog", { detail: { list: this._config.entity } })) },
          "📲 " + t.app_install_guide))]));
    if (mayLink) right.push(this._shareLinkSection(canPeople));
    if (canPeople) left.push(this._sharing(mayLink));
    return { left, right };
  }
  /* ---------------- Einrichtungs-Assistent (erster Start) ----------------
   * Sieben Schritte, jeder überspringbar. Am Ende ein Aufruf smartlists/setup mit allem. Texte in TEXTS (w_…). */
  async _setupWizard() {
    const t = this._t;
    const fmt = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
    const st = this._hass.states;
    const todo = Object.keys(st).filter((e) => e.startsWith("todo.") && !isNotesEntity(e, st[e].attributes.friendly_name)
      && !st[e].attributes.smartlists_combined).sort();
    const nameOf = (e) => (st[e] && st[e].attributes.friendly_name) || e;
    let users = [], packs = [], services = [];
    try { users = (await this._call("users", {}, false)).users || []; } catch (e) { slWarn("users", e); }
    try { packs = (await this._call("packs", {}, false)).packs || []; } catch (e) { slWarn("packs", e); }
    try { services = (await this._call("notify", {}, false)).services || []; } catch (e) { slWarn("notify", e); }
    const me = this._hass.user || {};
    const rules0 = Object.fromEntries(((this._cfg && this._cfg.tag_rules) || []).map((r) => [r.kind, r.prefix]));
    const S = {
      mode: todo.length ? "use" : "new", lists: [...todo], combine: todo.length >= 2, combineName: t.w_combine_default,
      newName: t.w_combine_default, stores: ["REWE", "LIDL"].filter(() => this._lang === "de"),
      rules: { store: rules0.store ?? "@", person: rules0.person ?? "*", tag: rules0.tag ?? "#" },
      packs: packs.filter((p) => p.active).map((p) => p.id), shares: {},
      notify: services.find((x) => x.startsWith("mobile_app_")) || "", voice: true, prices: true, barcode: true, share: false,
      // Extras: beim ersten Einrichten aus (aufgeräumt für Einsteiger), beim erneuten Starten wie eingestellt
      notes: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.notes),
      mealplan: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.mealplan),
      stats: !(this._cfg && this._cfg.setup_needed) && !!(this._cfg && this._cfg.features && this._cfg.features.stats),
    };
    const steps = ["lists", "stores", "naming", "lang", "people", "extras", "done"];
    let i = 0;
    const chk = (on, fn, label) => h("button", { type: "button", class: `wchk ${on ? "on" : ""}`, role: "checkbox", "aria-checked": String(on), "aria-label": label, onclick: fn });
    const row = (label, sub, ctrl) => h("div", { class: "wset" }, h("div", {}, label, sub ? h("small", {}, sub) : null), ctrl);
    const pick = (on, title, sub, fn, extra) => [h("button", { type: "button", class: `wpick ${on ? "on" : ""}`, "aria-pressed": String(on), onclick: fn },
      h("span", { class: "r" }), h("span", {}, title, h("small", {}, sub))), on && extra ? h("div", { class: "winset" }, extra) : null];
    const known = ((this._cfg && this._cfg.known_stores) || []).map((k) => k.value);
    const allowed = (this._cfg && this._cfg.allowed_prefixes) || "@*#!+~$&%^=";
    const ruleError = () => {
      const used = Object.values(S.rules).filter(Boolean);
      const bad = used.find((c) => !allowed.includes(c));
      return bad ? fmt(t.w_naming_bad, { c: bad }) : used.length !== new Set(used).size ? t.w_naming_dup : "";
    };
    const example = () => {
      const r = S.rules;
      const text = [t.w_eg_item + " " + t.w_eg_qty, r.store && r.store + "REWE", r.person && r.person + "Anna", r.tag && r.tag + t.w_eg_tag.split("#").pop()].filter(Boolean).join(" ");
      return h("div", { class: "weg" }, h("code", {}, text), h("span", { class: "m" }, t.w_becomes), h("span", {}, t.w_eg_item),
        r.store ? badge({ kind: "store", value: "REWE", label: "REWE", color: "var(--secondary-text-color)" }, { kinds: {}, values: {} }) : null,
        r.person ? badge({ kind: "person", value: "Anna", label: "Anna" }) : null,
        r.tag ? badge({ kind: "tag", value: "bio", label: t.w_eg_tag.split("#").pop() }) : null,
        h("b", { class: "q" }, t.w_eg_qty));
    };
    const body = h("div", { class: "wbody" });
    const stepsEl = h("ol", { class: "wsteps" });
    const barEl = h("div", { class: "wbar" });
    const prev = h("button", { type: "button", class: "btn2", onclick: () => { i = Math.max(0, i - 1); draw(); } }, t.w_back);
    const skip = h("button", { type: "button", class: "linkbtn", onclick: () => { i = Math.min(steps.length - 1, i + 1); draw(); } }, t.w_skip);
    const next = h("button", { type: "button", class: "btn2 primary", onclick: () => go() });
    const status = h("span", { class: "ok2" });
    const views = {
      lists: () => [h("h2", {}, t.w_lists_h), h("p", { class: "lead" }, todo.length ? fmt(t.w_lists_found, { n: todo.length }) : t.w_lists_none),
        todo.length ? pick(S.mode === "use", t.w_use, t.w_use_sub, () => { S.mode = "use"; draw(); }, [
          ...todo.map((e) => row(nameOf(e), `${e} · ${st[e].state} ${t.w_open}`, chk(S.lists.includes(e), () => { S.lists = S.lists.includes(e) ? S.lists.filter((x) => x !== e) : [...S.lists, e]; draw(); }, nameOf(e)))),
          S.lists.length >= 2 ? row(t.w_combine, t.w_combine_sub, this._switch(S.combine, (v) => { S.combine = v; draw(); }, t.w_combine)) : null,
          S.lists.length >= 2 && S.combine ? row(t.w_combine_name, null, h("input", { class: "search2", value: S.combineName, maxlength: "60", "aria-label": t.w_combine_name, oninput: (e) => { S.combineName = e.target.value; } })) : null,
        ]) : null,
        pick(S.mode === "new", t.w_new, t.w_new_sub, () => { S.mode = "new"; draw(); },
          row(t.w_new_name, null, h("input", { class: "search2", value: S.newName, maxlength: "60", "aria-label": t.w_new_name, oninput: (e) => { S.newName = e.target.value; } })))],
      stores: () => {
        const all = [...new Set([...known, ...S.stores])];
        const other = h("input", { class: "search2", placeholder: t.w_store_other, "aria-label": t.w_store_other, style: "width:180px" });
        const addOther = () => { const v = other.value.trim().replace(/^@/, ""); if (v && !S.stores.includes(v)) { S.stores.push(v); draw(); } };
        other.addEventListener("keydown", (e) => { if (e.key === "Enter") addOther(); });
        return [h("h2", {}, t.w_stores_h), h("p", { class: "lead" }, t.w_stores_lead),
          h("div", { class: "wstores" }, all.map((v) => {
            const on = S.stores.some((x) => x.toLowerCase() === v.toLowerCase());
            return h("button", { type: "button", class: `wstore ${on ? "on" : ""}`, "aria-pressed": String(on),
              onclick: () => { S.stores = on ? S.stores.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...S.stores, v]; draw(); } }, v);
          })),
          h("p", { class: "m small" }, S.stores.length ? fmt(t.w_chosen, { list: S.stores.join(", ") }) : t.w_chosen_none),
          row(t.w_store_other, null, h("span", { class: "wrow" }, other, h("button", { type: "button", class: "btn2", onclick: addOther }, t.w_store_add))),
          h("p", { class: "m small" }, t.w_stores_later)];
      },
      naming: () => {
        const err = h("p", { class: "werr" }, ruleError());
        const ex = h("div", {}, example());
        const field = (kind, label, sub) => row(label, sub, h("input", { class: "search2 wchar", value: S.rules[kind], maxlength: "1", "aria-label": label,
          oninput: (e) => { S.rules[kind] = e.target.value.trim(); err.textContent = ruleError(); next.disabled = !!ruleError(); fill(ex, example()); } }));
        return [h("h2", {}, t.w_naming_h), h("p", { class: "lead" }, t.w_naming_lead),
          field("store", t.kind_store, t.w_eg_store), field("person", t.kind_person, t.w_eg_person), field("tag", t.kind_tag, t.w_eg_tag),
          err, ex, h("p", { class: "m small" }, fmt(t.w_naming_hint, { chars: allowed.split("").join(" ") }))];
      },
      lang: () => [h("h2", {}, t.w_lang_h), h("p", { class: "lead" }, t.w_lang_lead),
        packs.filter((p) => p.builtin).map((p) => row(p.name, `${p.terms.toLocaleString(this._hass.language || "de")} ${t.w_words}`,
          chk(S.packs.includes(p.id), () => { S.packs = S.packs.includes(p.id) ? S.packs.filter((x) => x !== p.id) : [...S.packs, p.id]; draw(); }, p.name)))],
      people: () => [h("h2", {}, t.w_people_h),
        S.mode === "new" ? [h("p", { class: "lead" }, t.w_people_lead),
          row(me.name || "", t.w_you, h("span", { class: "m" }, t.w_all)),
          users.filter((u) => u.id !== me.id).map((u) => row(u.name, u.is_admin ? t.admin_always : null, u.is_admin ? h("span", { class: "m" }, t.w_all)
            : h("select", { "aria-label": u.name, onchange: (e) => { if (e.target.value) S.shares[u.id] = e.target.value; else delete S.shares[u.id]; } },
              [["", t.role_none], ["viewer", t.role_viewer], ["checker", t.role_checker], ["editor", t.role_editor]].map(([v, l]) => h("option", { value: v, selected: (S.shares[u.id] || "") === v }, l)))))]
          : h("p", { class: "lead" }, t.w_people_combined),
        row(t.w_app, t.w_app_sub, null)],
      extras: () => [h("h2", {}, t.w_extras_h), h("p", { class: "lead" }, t.w_extras_lead),
        row(t.w_x_notify, services.length ? t.w_x_notify_sub : t.w_x_notify_none, services.length
          ? h("select", { "aria-label": t.w_x_notify, onchange: (e) => { S.notify = e.target.value; } }, h("option", { value: "", selected: !S.notify }, t.w_off),
            services.map((sv) => h("option", { value: sv, selected: S.notify === sv }, sv.replace(/^mobile_app_/, "").replace(/_/g, " ")))) : null),
        row(t.w_x_voice, t.w_x_voice_sub, this._switch(S.voice, (v) => { S.voice = v; }, t.w_x_voice)),
        row(t.w_x_prices, t.w_x_prices_sub, this._switch(S.prices, (v) => { S.prices = v; }, t.w_x_prices)),
        row(t.w_x_barcode, t.w_x_barcode_sub, this._switch(S.barcode, (v) => { S.barcode = v; }, t.w_x_barcode)),
        row(t.w_x_share, t.w_x_share_sub, this._switch(S.share, (v) => { S.share = v; }, t.w_x_share)),
        h("div", { class: "grp" }, t.w_x_optional),
        row(t.x_notes, t.w_x_notes_sub, this._switch(S.notes, (v) => { S.notes = v; }, t.x_notes)),
        row(t.x_mealplan, t.w_x_mealplan_sub, this._switch(S.mealplan, (v) => { S.mealplan = v; }, t.x_mealplan)),
        row(t.x_stats, t.w_x_stats_sub, this._switch(S.stats, (v) => { S.stats = v; }, t.x_stats))],
      done: () => {
        const listsTxt = S.lists.map(nameOf).join(", ");
        const sum = [
          S.mode === "new" ? fmt(t.w_sum_new, { name: S.newName }) : S.lists.length >= 2 && S.combine ? fmt(t.w_sum_combined, { name: S.combineName, lists: listsTxt })
            : S.lists.length ? fmt(t.w_sum_lists, { lists: listsTxt }) : null,
          fmt(t.w_sum_stores, { list: S.stores.join(", ") || t.w_off }),
          fmt(t.w_sum_naming, { list: [S.rules.store && S.rules.store + t.kind_store, S.rules.person && S.rules.person + t.kind_person, S.rules.tag && S.rules.tag + t.kind_tag].filter(Boolean).join(", ") || t.w_off }),
          fmt(t.w_sum_lang, { list: packs.filter((p) => S.packs.includes(p.id)).map((p) => p.name).join(", ") || t.w_off }),
          S.mode === "new" && Object.keys(S.shares).length ? fmt(t.w_sum_people, { list: Object.entries(S.shares).map(([id, r]) => `${(users.find((u) => u.id === id) || {}).name}: ${t["role_" + r]}`).join(", ") }) : null,
          fmt(t.w_sum_extras, { list: [S.notify && t.w_x_notify, S.voice && t.w_x_voice, S.prices && t.w_x_prices, S.barcode && t.w_x_barcode, S.share && t.w_x_share, S.notes && t.x_notes, S.mealplan && t.x_mealplan, S.stats && t.x_stats].filter(Boolean).join(", ") || t.w_off }),
        ].filter(Boolean);
        return [h("h2", {}, t.w_done_h), h("p", { class: "lead" }, t.w_done_lead), h("ul", { class: "wsum" }, sum.map((x) => h("li", {}, x))), h("p", { class: "m small" }, t.w_tip)];
      },
    };
    const labels = [t.w_s_lists, t.w_s_stores, t.w_s_naming, t.w_s_lang, t.w_s_people, t.w_s_extras, t.w_s_done];
    const finished = { v: false };
    const draw = () => {
      fill(stepsEl, labels.map((l, k) => h("li", { class: k < i ? "done" : k === i ? "now" : "", onclick: () => { i = k; draw(); } }, h("span", { class: "n" }, k < i ? "✓" : String(k + 1)), l)));
      fill(barEl, h("small", {}, `${fmt(t.w_step, { n: i + 1, m: steps.length })}: ${labels[i]}`), h("div", {}, h("i", { style: `width:${((i + 1) / steps.length) * 100}%` })));
      fill(body, views[steps[i]]());
      prev.style.visibility = i ? "visible" : "hidden";
      skip.hidden = i >= steps.length - 2;
      next.textContent = finished.v ? t.w_start : i === steps.length - 2 ? t.w_next : i === steps.length - 1 ? t.w_finish : t.w_next;
      next.disabled = steps[i] === "naming" && !!ruleError();
    };
    const close = () => { back.remove(); window.__smartlistsSetupOpen = false; };
    const go = async () => {
      if (finished.v) { close(); return; }
      if (i < steps.length - 1) { i++; draw(); return; }
      next.disabled = true; status.textContent = t.loading;
      const r = S.rules;
      try {
        await this._call("setup", {
          lists: S.mode === "use" ? S.lists : [], combine_name: S.mode === "use" && S.lists.length >= 2 && S.combine ? (S.combineName.trim() || t.w_combine_default) : null,
          new_list: S.mode === "new" ? (S.newName.trim() || t.w_combine_default) : null, shares: S.mode === "new" ? S.shares : {},
          stores: S.stores, tag_rules: [["store", r.store], ["person", r.person], ["tag", r.tag]].filter(([, p]) => p).map(([kind, prefix]) => ({ kind, prefix })),
          packs: S.packs.length ? S.packs : undefined, notify_service: S.notify || null, voice: S.voice, prices: S.prices, barcode: S.barcode, share_links: S.share,
          notes: S.notes, mealplan: S.mealplan, stats: S.stats,
        }, false);
        finished.v = true; status.textContent = "✓"; next.disabled = false; draw();
        window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
        await this._loadConfig(); this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; next.disabled = false; }
    };
    const back = h("div", { class: "dlg-back wiz-back" },
      h("style", {}, DIALOG_STYLE + STYLE + WIZARD_STYLE),
      h("div", { class: "dlg wiz", role: "dialog", "aria-modal": "true", "aria-label": t.wl_title },
        h("aside", { class: "wside" }, h("h1", {}, t.wl_title), h("p", { class: "m small" }, t.w_time), stepsEl),
        h("div", { class: "wpane" }, barEl, body,
          h("div", { class: "wfoot" }, prev, h("span", { class: "m small wl" }, t.w_later), h("span", { class: "grow" }), status, skip, next)),
        h("button", { type: "button", class: "wx", "aria-label": t.w_close, title: t.w_close, onclick: async () => {
          try { await this._call("setup", { skip: true }, false); } catch (e) { slWarn("setup", e); }
          close();
        } }, "✕")));
    this.shadowRoot.append(back);
    draw();
  }

  _listDialog() {
    const t = this._t;
    const d = this._data;
    if (!d) return;
    const { left, right } = this._listSections();
    const close = () => back.remove();
    const meta = [d.type === "combined" ? t.type_combined : d.type === "own" ? t.type_own : d.type === "notes" ? t.p_group_notes : t.type_list,
      d.own && d.own.owner ? `${t.owner}: ${d.own.owner}` : null].filter(Boolean).join(", ");
    const back = h("div", { class: "dlg-back lsd", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(); } },
      h("style", {}, DIALOG_STYLE + STYLE + LIST_DIALOG_STYLE),
      h("div", { class: "dlg lsheet", role: "dialog", "aria-modal": "true", "aria-label": t.settings_list },
        h("div", { class: "ltop" }, h("div", { class: "lwho" }, h("h2", {}, d.name), h("small", {}, meta)),
          iconBtn(ICON.close, t.cancel, close)),
        h("div", { class: `ltwo ${right.length ? "" : "one"}` }, h("div", {}, left), right.length ? h("div", {}, right) : null),
        h("div", { class: "lfoot" }, h("span", { class: "shelp" }, this._config.settings_scope === "list" ? t.list_settings_hint : t.list_settings_hint_card),
          h("button", { type: "button", class: "ok", onclick: close }, t.ls_done))));
    this.shadowRoot.append(back);
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
        h("span", { class: "sizechip" }, `${fmtQty(parsed.quantity)} ${parsed.unit}`), parsed.tags.map(badge));
    };
    const drawRules = () => fill(rulesEl, ...rules.map((r, i) => h("div", { class: "rule2" },
      h("input", { class: "char", value: r.prefix, maxlength: "1", "aria-label": t.char, oninput: (e) => { r.prefix = e.target.value.trim(); drawExample(); } }),
      // jede Art (Markt/Person/Schlagwort) nur einmal – schon vergebene Arten sind hier nicht wählbar
      h("select", { "aria-label": t.kind, onchange: (e) => { r.kind = e.target.value; drawRules(); drawExample(); } },
        cfg.tag_kinds.map((k) => h("option", { value: k, selected: k === r.kind, disabled: k !== r.kind && rules.some((o) => o !== r && o.kind === k) }, t["kind_" + k]))),
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
          const kind = cfg.tag_kinds.find((k) => !rules.some((r) => r.kind === k));
          if (!kind) { status.textContent = t.naming_all_used; return; }
          const free = [...cfg.allowed_prefixes].find((c) => !rules.some((r) => r.prefix === c));
          rules.push({ prefix: free || "", kind }); drawRules(); drawExample(); } }, "+ " + t.add_rule),
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
    let query = "", offset = 0, rows = [], total = 0, seq = 0;
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
      const mine = ++seq;  // nur die Antwort zur letzten Suche zählt (ältere, langsamere Antworten verwerfen)
      try {
        const r = await this._call("pack_terms", { pack_id: pack.id, query, offset: append ? offset : 0, limit: 100 }, false);
        if (mine !== seq) return;
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
    // Suche: sofort im Geladenen filtern, dann beim Server nachfragen. Wert direkt aus dem Feld lesen (nicht aus dem
    // Ereignis) und auch auf „search“ (✕) und keyup reagieren – auf manchen Handys kommt „input“ nicht zuverlässig.
    const search = h("input", { type: "search", class: "search2", placeholder: t.search_learned, "aria-label": t.search, autocomplete: "off" });
    const ask = debounce(() => load(false), 250);
    const onSearch = () => {
      const v = search.value.trim();
      if (v === query) return;
      query = v;
      const q = v.toLowerCase();
      rows = rows.filter((r) => r.term.toLowerCase().includes(q));
      total = rows.length;
      draw();
      ask();
    };
    ["input", "search", "keyup", "change"].forEach((ev) => search.addEventListener(ev, onSearch));
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
  // Haushalt: einen Teil von „appearance“ (Währung, Reihenfolge) speichern, ohne den Rest anzufassen
  async _saveLook(patch, status) {
    try {
      const cur = (await this._call("appearance", {}, false)).appearance || {};
      const r = await this._call("set_appearance", { appearance: { ...cur, ...patch } }, false);
      SL_LOOK = r.appearance;
      if (this._cfg) this._cfg = { ...this._cfg, appearance: r.appearance };
      if (status) status.textContent = "✓ " + this._t.saved;
      window.dispatchEvent(new CustomEvent("smartlists-look-changed"));
    } catch (err) { if (status) status.textContent = (err && err.message) || this._t.error; }
  }
  // Global → Badges & Farben: Reihenfolge der Angaben unter dem Artikelnamen
  _orderSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const body = h("div");
    let order = slRowOrder();
    const label = { store: t.kind_store, tag: t.kind_tag, person: t.kind_person, price: t.price, note: t.note };
    const sample = { name: "Milch", tags: [{ kind: "store", value: "\u0000rewe", label: "REWE", color: "#cc071e" }, { kind: "tag", value: "bio", label: "bio" }, { kind: "person", value: "\u0000anna", label: "Anna" }] };
    const draw = () => {
      const part = { store: [badge(sample.tags[0])], tag: [badge(sample.tags[1])], person: [badge(sample.tags[2])],
        price: [h("span", { class: "priceline" }, h("b", {}, fmtMoney(2.38, this._hass.language)))], note: [h("span", { class: "note" }, t.note)] };
      fill(body,
        h("div", { class: "nprev", style: "margin-bottom:8px" }, h("div", { class: "name-line" }, h("span", { class: "qpill" }, "2×"), h("span", { class: "iname" }, sample.name), h("span", { class: "sizechip" }, "1\u00a0l")),
          h("div", { class: "subline" }, order.flatMap((k) => part[k]))),
        ...order.map((k, i) => this._setRow(`${i + 1}. ${label[k] || k}`, h("span", { style: "display:flex;gap:2px" },
          h("button", { class: "icon-btn up", type: "button", disabled: i === 0, title: t.p_order, "aria-label": `${label[k]} ↑`, onclick: () => move(i, -1) }, svg(ICON.chevron, 18)),
          h("button", { class: "icon-btn", type: "button", disabled: i === order.length - 1, title: t.p_order, "aria-label": `${label[k]} ↓`, onclick: () => move(i, 1) }, svg(ICON.chevron, 18))))),
        h("div", { class: "srow" }, status, h("button", { class: "linkbtn", type: "button", onclick: () => { order = [...ROW_ORDER]; draw(); this._saveLook({ order }, status); } }, t.reset_default)));
    };
    const move = (i, d) => { const o = [...order]; [o[i], o[i + d]] = [o[i + d], o[i]]; order = o; draw(); this._saveLook({ order }, status); };
    draw();
    return this._sec("", t.order_title, t.order_help, [body]);
  }
  // Global → Preise & Währung: Währung des Haushalts und woher ein Preis kommt
  _priceSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const help = h("small", {});
    const setHelp = () => { help.textContent = t.cur_help.replace("{symbols}", slSymbols().join(", ")); };
    setHelp();
    const names = (() => { try { return new Intl.DisplayNames([this._lang || "en"], { type: "currency" }); } catch (e) { return null; } })();
    // eigenes Symbol: für Währungen, die nicht in der Liste stehen
    const own = h("input", { type: "text", maxlength: "6", size: "6", placeholder: "₺", "aria-label": t.cur_symbol, value: (SL_LOOK && SL_LOOK.currency_symbol) || "" });
    const ownRow = h("div", { class: "srow2" }, h("div", { class: "sl" }, t.cur_symbol, h("small", {}, t.cur_symbol_help)), own);
    const saveOwn = async () => {
      const symbol = own.value.trim();
      if (!symbol) return;
      await this._saveLook({ currency: "custom", currency_symbol: symbol }, status);
      if (slCurrency() !== "custom") status.textContent = t.cur_symbol_bad;
      setHelp(); this._renderList();
    };
    own.addEventListener("change", saveOwn);
    const sel = h("select", { "aria-label": t.cur_label, onchange: async (e) => {
      ownRow.hidden = e.target.value !== "custom";
      if (e.target.value === "custom") { own.focus(); return saveOwn(); }
      await this._saveLook({ currency: e.target.value, currency_symbol: undefined }, status); setHelp(); this._renderList();
    } },
      Object.keys(CURRENCIES).map((c) => h("option", { value: c, selected: c === slCurrency() }, `${c} – ${names ? names.of(c) : c}`)),
      h("option", { value: "custom", selected: slCurrency() === "custom" }, t.cur_custom));
    ownRow.hidden = slCurrency() !== "custom";
    return [
      this._sec("", t.cur_label, null, [h("div", { class: "srow2" }, h("div", { class: "sl" }, t.cur_label, help), sel), ownRow, h("div", { class: "srow" }, status)]),
      this._sec("", t.price_paid ? t.price : t.price, null, [this._setRow(t.price_auto, this._switch(!SL_LOOK || SL_LOOK.auto_price !== false,
        async (v) => { await this._saveLook({ auto_price: v }, status); this._load(); }, t.price_auto), t.price_auto_help)]),
      this._watchSection(),
      this._sec("", t.price_how, t.price_how_note, [h("ol", { class: "pubsteps" }, [t.price_how_1, t.price_how_2, t.price_how_3, t.price_how_4].map((x) => h("li", {}, x)))]),
    ];
  }
  // „Fehler melden“: neues Issue mit Versionen und Umgebung vorausgefüllt (nichts Persönliches – keine Listen, Artikel oder Adressen)
  _issueUrl() {
    const ua = navigator.userAgent || "";
    const app = /Home ?Assistant/i.test(ua) ? "Home Assistant app" : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
    const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
    const where = location.pathname.startsWith("/smartlists") ? "Sidebar page" : "Dashboard card";
    const body = ["### What happened?", "", "", "### What did you expect?", "", "", "### Steps to reproduce", "1. ", "", "### Environment",
      `- SmartLists: ${this._version || CARD_VERSION}${this._version && this._version !== CARD_VERSION ? ` (card: ${CARD_VERSION})` : ""}`,
      `- Home Assistant: ${(this._hass.config && this._hass.config.version) || "?"}`, `- Where: ${where}`, `- Browser / app: ${app}${os ? `, ${os}` : ""}`,
      `- Language: ${this._lang || (this._hass && this._hass.language) || "?"}`].join("\n");
    return `${"https://github.com/m3m0rex/ha_smartlists"}/issues/new?body=${encodeURIComponent(body)}`;
  }
  // Global → Preise & Währung → Merkliste: Produkte, bei denen man auf ein Angebot wartet, und die Benachrichtigung
  _watchSection() {
    const t = this._t, box = h("div", {}, h("div", { class: "shelp" }, t.loading)), status = h("span", { class: "ok2" });
    const draw = (w) => {
      const set = async (patch) => { try { draw(await this._call("watch_set", patch, false)); status.textContent = "✓ " + t.saved; } catch (e) { status.textContent = (e && e.message) || t.error; } };
      // Ziele: gewählte als Kacheln, „Ziel hinzufügen“ öffnet eine Liste mit Suche und Häkchen (mehrere möglich)
      const all = [{ id: "persistent_notification", kind: "hass", icon: "🔔", name: t.wl_hass, sub: t.wl_hass_sub, grp: "Home Assistant" },
        ...(w.services || []).map((sv) => { const dev = sv.startsWith("mobile_app_"); return { id: "notify." + sv, kind: "service", icon: dev ? "📱" : /telegram/.test(sv) ? "✈️" : /alexa|tts|speak/.test(sv) ? "🔊" : "✉️",
          name: (dev ? sv.slice(11) : sv).replace(/_/g, " "), sub: "notify." + sv, grp: dev ? t.wl_grp_dev : t.wl_grp_other }; }),
        ...(w.entities || []).map((e) => ({ id: e.id, kind: "entity", icon: "🔔", name: e.name, sub: e.id, grp: t.wl_grp_other }))];
      const has = (x) => (w.targets || []).some((y) => y.id === x.id);
      const toggle = (x) => set({ targets: has(x) ? w.targets.filter((y) => y.id !== x.id) : [...(w.targets || []), { id: x.id, kind: x.kind }] });
      const picked = all.filter(has);
      const q = (this._watchQuery || "").toLowerCase();
      const search = h("input", { type: "search", class: "tsearch", placeholder: t.wl_search, "aria-label": t.wl_search, value: this._watchQuery || "" });
      search.addEventListener("input", () => { this._watchQuery = search.value; const pos = search.selectionStart; draw(w); const f = box.querySelector(".tsearch"); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (e) { /* */ } } });
      let last = "";
      const options = all.filter((x) => !q || `${x.name} ${x.sub}`.toLowerCase().includes(q)).map((x) => [x.grp !== last ? h("div", { class: "tgrp" }, (last = x.grp)) : null,
        h("button", { type: "button", class: `topt ${has(x) ? "on" : ""}`, role: "option", "aria-selected": String(has(x)), onclick: () => toggle(x) },
          h("span", { class: "ti" }, x.icon), h("span", { class: "tn" }, x.name, h("small", {}, x.sub)), h("span", { class: "tcb" }, has(x) ? "✓" : ""))]);
      const pop = this._watchOpen ? h("div", { class: "tpop", role: "listbox", "aria-multiselectable": "true" }, search, h("div", { class: "tlist" }, options),
        h("div", { class: "tfoot" }, h("span", {}, t.wl_n.replace("{n}", picked.length)),
          h("button", { type: "button", class: "linkbtn", onclick: () => set({ targets: [] }) }, t.wl_none),
          h("button", { type: "button", class: "btn2", onclick: () => { this._watchOpen = false; this._watchQuery = ""; draw(w); } }, t.wl_done))) : null;
      const targets = h("div", {}, h("div", { class: "grp", style: "padding:10px 0 6px" }, t.wl_send_to),
        h("div", { class: "ntiles", style: "grid-template-columns:repeat(auto-fill,minmax(150px,1fr))" }, picked.map((x) => h("div", { class: "ntile on" }, h("span", { class: "ni" }, x.icon),
          h("span", { class: "nn" }, x.name), h("button", { type: "button", class: "tx", "aria-label": `${t.delete}: ${x.name}`, onclick: () => toggle(x) }, "✕"))),
          h("button", { type: "button", class: "ntile add", "aria-expanded": String(!!this._watchOpen), onclick: () => { this._watchOpen = !this._watchOpen; draw(w); } }, "＋ " + t.wl_add_target)),
        pop, picked.length ? null : h("div", { class: "shelp" }, t.wl_no_target));
      fill(box, w.names.length ? h("div", { class: "chips", style: "display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px" }, w.names.map((n) =>
          h("button", { type: "button", class: "chip", title: t.delete, "aria-label": `${t.delete}: ${n}`, onclick: () => set({ remove: n }) }, `⭐ ${n} ✕`)))
        : h("div", { class: "shelp" }, t.wl_empty),
        this._isAdmin ? this._setRow(t.wl_notify, this._switch(!!w.notify, (v) => set({ notify: v }), t.wl_notify), t.wl_notify_help) : null,
        this._isAdmin && w.notify ? targets : null, h("div", { class: "srow" }, status));
    };
    this._call("watch", {}, false).then(draw).catch((e) => { slWarn("watch", e); fill(box, h("div", { class: "shelp" }, t.error)); });
    return this._sec("", "⭐ " + t.wl_title, t.wl_help, [box]);
  }
  _appearanceSection() {
    const t = this._t;
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    let look = { kinds: {}, values: {} }, tags = [], query = "";
    const save = debounce(async () => {
      try {
        // Währung/Reihenfolge werden in eigenen Abschnitten gespeichert – hier nicht mit altem Stand überschreiben
        look = { ...look, currency: SL_LOOK.currency, currency_symbol: SL_LOOK.currency_symbol, order: SL_LOOK.order, auto_price: SL_LOOK.auto_price };
        const r = await this._call("set_appearance", { appearance: look }, false);
        look = r.appearance; tags = r.tags; SL_LOOK = look;
        if (this._cfg) this._cfg = { ...this._cfg, appearance: look };
        status.textContent = "✓ " + t.saved;
        window.dispatchEvent(new CustomEvent("smartlists-look-changed"));
        draw();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    }, 400);
    const sample = { store: { kind: "store", value: "\u0000rewe", label: "REWE", color: "#cc071e" }, person: { kind: "person", value: "\u0000anna", label: "Anna" }, tag: { kind: "tag", value: "bio", label: "bio" } };
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
          colorInput(k.text || (k.color ? textOn(k.color) : "#ffffff"),
            (c) => fill(prevK.lastChild, badge(sample[kind], { ...look, kinds: { ...look.kinds, [kind]: { ...k, text: c } } })),
            (c) => setK({ text: c }), `${t["kind_" + kind]}: ${t.look_text}`),
          kind === "store" ? null : emojiField(this.shadowRoot, h("input", { class: "icon", value: k.icon != null ? k.icon : BADGE_DEFAULTS[kind].icon, maxlength: "8", "aria-label": t.look_icon, title: t.emoji_pick,
            onchange: (e) => setK({ icon: e.target.value === BADGE_DEFAULTS[kind].icon ? null : e.target.value }) }), t),
          reset(() => { const n = { ...look.kinds }; delete n[kind]; look = { ...look, kinds: n }; draw(); save(); }, t.reset_default)));
    };
    // Anzahl, Größe und Angebots-Hinweis: Stil + Farbe (kein Symbol)
    const markRow = (kind, sampleText) => {
      const k = look.kinds[kind] || {}, cur = { ...MARK_DEFAULTS[kind], ...k };
      const prev = h("small", {}, h("span", { class: kind === "count" ? "qpill" : kind === "size" ? "sizechip" : "dealhint", style: markStyle(kind, look) + (kind === "offer" ? ";padding:1px 8px" : "") }, sampleText));
      const setK = (patch) => {
        const next = { ...k, ...patch };
        Object.keys(next).forEach((x) => (next[x] == null || next[x] === "" || next[x] === MARK_DEFAULTS[kind][x]) && delete next[x]);
        const kinds = { ...look.kinds, [kind]: next };
        if (!Object.keys(next).length) delete kinds[kind];
        look = { ...look, kinds }; draw(); save();
      };
      return h("div", { class: "srow2" }, h("div", { class: "sl" }, t["kind_" + kind], prev),
        h("div", { class: "look-row" },
          h("select", { "aria-label": `${t["kind_" + kind]}: ${t.look_style}`, onchange: (e) => setK({ style: e.target.value }) },
            BADGE_STYLES.map((st) => h("option", { value: st, selected: cur.style === st }, t["look_" + st]))),
          colorInput(cur.color, (c) => { prev.firstChild.style.cssText = markStyle(kind, { ...look, kinds: { ...look.kinds, [kind]: { ...k, color: c } } }); }, (c) => setK({ color: c }), `${t["kind_" + kind]}: ${t.look_color}`),
          reset(() => { const n = { ...look.kinds }; delete n[kind]; look = { ...look, kinds: n }; draw(); save(); }, t.reset_default)));
    };
    const listEl = h("div");
    const drawValues = () => {
      const q = searchKey(query);
      // nur Märkte/Personen, die benutzt werden oder angepasst sind (Schlagwörter: oben „Je Art“ – gilt für alle)
      const rows = tags.filter((x) => x.kind !== "tag" && (x.count > 0 || x.favorite || Object.keys(look.values[x.key] || {}).length))
        .filter((x) => !q || searchKey(x.label + " " + x.value).includes(q)).slice(0, 60);
      if (!rows.length) return fill(listEl, h("div", { class: "shelp" }, q ? t.look_none_q : t.look_none));
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
        // kompakt: Badge und Anzahl; ✎ klappt die Einstellungen dieses Badges auf; ● = angepasst
        const open = this._lookOpen === x.key;
        const head = h("button", { type: "button", class: `vhead ${open ? "on" : ""}`, "aria-expanded": String(open),
          onclick: () => { this._lookOpen = open ? null : x.key; drawValues(); } },
          (prevV = h("span", { class: "sl" }, badge(preview, look), x.count ? h("small", {}, `${x.count}×`) : null)),
          Object.keys(cur).length ? h("span", { class: "vmark", title: t.look_changed }, "●") : null, h("span", { class: "vchev" }, open ? "▴" : "✎"));
        if (!open) return h("div", { class: "vrow" }, head);
        return h("div", { class: "vrow open" }, head,
          h("div", { class: "look-row vbody" },
            x.kind === "store" ? h("input", { class: "search2", style: "width:110px;margin:0", value: cur.label || "", placeholder: x.label, "aria-label": `${x.label}: ${t.look_label}`, title: t.look_label,
              onchange: (e) => setV({ label: e.target.value.trim() || null }) }) : null,
            colorInput(cur.color || (x.kind === "store" ? x.color : null),
              (c) => fill(prevV, badge({ ...preview, color: x.kind === "store" ? c : preview.color }, { ...look, values: { ...look.values, [x.key]: { ...cur, color: c } } }),
                x.count ? h("small", {}, `${x.count}×`) : null),
              (c) => setV({ color: c }), `${x.label}: ${t.look_color}`),
            colorInput(cur.text || textOn(cur.color || (x.kind === "store" ? x.color : null) || "#888888"),
              (c) => fill(prevV, badge(preview, { ...look, values: { ...look.values, [x.key]: { ...cur, text: c } } }),
                x.count ? h("small", {}, `${x.count}×`) : null),
              (c) => setV({ text: c }), `${x.label}: ${t.look_text}`),
            Object.keys(cur).length ? reset(() => setV({ color: null, text: null, label: null }), t.reset_default) : null));
      }), tags.length > 60 && !query ? h("div", { class: "shelp" }, t.look_more) : null);
    };
    const draw = () => {
      fill(body,
        h("div", { class: "grp" }, t.look_kinds), kindRow("store"), kindRow("person"), kindRow("tag"),
        markRow("count", "2×"), markRow("size", "1 l"), markRow("offer", `🏷️ ${fmtMoney(1.99, this._hass.language)}`),
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
          if (kind === "tag") { status.textContent = t.look_tag_kind; return; }  // Schlagwörter: oben „Je Art“
          const value = (rule ? v.slice(rule.prefix.length) : v).trim();
          if (!value) return;
          const key = `${kind}:${value.toLowerCase()}`;
          if (!tags.some((x) => x.key === key)) tags = [{ key, kind, value, label: value, color: null, count: 0, custom: {} }, ...tags];
          if (kind === "store") this._call("favorite_store", { store: value }, false).catch(() => {});  // auch unter Märkte & Zonen
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
    // gleichnamige Zonen (zwei Filialen „REWE“) unterscheidbar machen: dann mit Entitäts-ID dahinter
    const zones = () => {
      const all = Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("zone."))
        .map((s) => [s.entity_id, s.attributes.friendly_name || s.entity_id]);
      const count = {};
      all.forEach(([, n]) => { const k = n.trim().toLowerCase(); count[k] = (count[k] || 0) + 1; });
      return all.map(([id, n]) => [id, count[n.trim().toLowerCase()] > 1 ? `${n} (${id})` : n]).sort((a, b) => a[1].localeCompare(b[1]));
    };
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
      let name = z.name;
      // Gibt es schon eine Zone mit diesem Namen (z. B. zweite REWE-Filiale)? Warnen – behalten oder umbenennen
      const zoneNames = () => Object.values(this._hass.states).filter((s) => s.entity_id.startsWith("zone."))
        .map((s) => String(s.attributes.friendly_name || "").trim().toLowerCase());
      const taken = (n) => zoneNames().includes(String(n).trim().toLowerCase());
      while (taken(name)) {
        const keep = await slDialog(this.shadowRoot, { title: t.zone_dup_title, text: t.zone_dup_text.split("{name}").join(name), ok: t.zone_dup_keep, cancel: t.zone_dup_rename });
        if (keep) break;
        let k = 2;
        while (taken(`${name} ${k}`)) k++;
        const renamed = await slDialog(this.shadowRoot, { title: t.zone_dup_rename, text: t.zone_dup_rename_help, input: true, value: `${name} ${k}`, ok: t.create, cancel: t.cancel });
        if (!renamed) return;
        name = renamed;
      }
      try {
        const before = new Set(Object.keys(this._hass.states).filter((e) => e.startsWith("zone.")));
        await this._hass.callWS({ type: "zone/create", name, icon: "mdi:cart", latitude: z.latitude, longitude: z.longitude, radius: z.radius, passive: false });
        // auf die neue Zone warten (Entität erscheint kurz danach) – die NEUE, nicht eine gleichnamige vorhandene
        let zone = null;
        for (let i = 0; i < 20 && !zone; i++) {
          await new Promise((r) => setTimeout(r, 250));
          const hit = Object.values(this._hass.states).find((s) => s.entity_id.startsWith("zone.") && !before.has(s.entity_id) && s.attributes.friendly_name === name);
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
      const nameOf = (id) => { const hit = zs.find(([z]) => z === id); return hit ? hit[1] : this._hass.states[id] ? id : `⚠️ ${id}`; };
      // je Markt beliebig viele Zonen (Filialen): Chips mit ×, dazu Auswahl „＋ Zone“
      // nur die Märkte des Haushalts (Einrichtung, benutzt, mit Zone); weitere über „＋ Markt“
      fill(body, stores.length ? null : h("div", { class: "shelp" }, t.stores_none), ...stores.map((st) => {
        const linked = st.zones || (st.zone ? [st.zone] : []);
        const hasOrder = !!(((this._cfg && this._cfg.store_order) || {})[st.key]);
        return h("div", { class: "storecard" },
          h("div", { class: "sthead" }, badge({ kind: "store", value: st.value, label: st.label, color: st.color }),
            h("span", { class: "stinfo" }, linked.length ? `📍 ${linked.length} ${t.zone_count}` : t.zone_none, hasOrder ? ` · 🛤️ ${t.aisle} ✓` : ""),
            h("button", { class: "linkbtn", type: "button",
              onclick: () => this._aisleEditor(body, st, linked, () => this._call("stores", {}, false).then((r) => draw(r.stores))) }, "🛤️ " + t.aisle),
            // aus der Auswahl nehmen – nur, solange der Markt nicht benutzt wird und keine Zone hat (sonst taucht er ohnehin wieder auf)
            st.favorite && !st.count && !linked.length ? iconBtn(ICON.close, `${t.store_remove}: ${st.label}`, async () => {
              try { draw((await this._call("favorite_store", { store: st.value, remove: true }, false)).stores); }
              catch (err) { status.textContent = (err && err.message) || t.error; }
            }, "danger") : null),
          h("div", { class: "stzones" },
            linked.map((z) => h("div", { class: "stzone" }, h("span", {}, "📍 ", nameOf(z)),
              iconBtn(ICON.close, `${t.zone_unlink}: ${nameOf(z)}`, () => link(st.key, linked.filter((x) => x !== z)), "danger"))),
            h("select", { class: "stadd", "aria-label": `${st.label}: ${t.zone_add}`, onchange: (e) => {
              const v = e.target.value; e.target.value = "";
              if (v === "__new") createZone(st.label); else if (v) link(st.key, [...linked, v]);
            } }, h("option", { value: "" }, "＋ " + t.zone_add),
              zs.filter(([id]) => !linked.includes(id)).map(([id, n]) => h("option", { value: id }, n)),
              h("option", { value: "__new" }, "＋ " + t.zone_new + " …"))));
      }),
        h("div", { class: "acts" }, status,
          h("a", { class: "btn2", href: "/config/zone", target: "_top", style: "display:inline-flex;align-items:center;text-decoration:none" }, t.zone_manage),
          h("button", { class: "btn2", type: "button", onclick: async () => {
            const store = await slDialog(this.shadowRoot, { title: t.store_new, text: t.store_add_help2, input: true, placeholder: "EDEKA", ok: t.pack_add, cancel: t.cancel });
            if (!store) return;
            try { draw((await this._call("favorite_store", { store }, false)).stores); status.textContent = "✓ " + store.replace(/^@/, ""); }
            catch (err) { status.textContent = (err && err.message) || t.error; }
          } }, "＋ " + t.store_new)));
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
      try { const r = await this._call("set_notes", patch, false); status.textContent = "✓ " + t.saved; draw(r); this._refreshPanel();
        if (this._cfg && patch.mode) this._cfg = { ...this._cfg, features: { ...(this._cfg.features || {}), notes: patch.mode === "section" } }; }
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
  // Extras (Notizen, Wochenplan): an, solange die Integration nichts anderes meldet
  _feat(name) { const f = this._cfg && this._cfg.features; return !f || f[name] !== false; }

  // Für mich → Sprache: SmartLists in einer anderen Sprache als Home Assistant (für diesen Benutzer)
  _langSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const names = { auto: t.ui_lang_auto, de: "Deutsch", en: "English", fr: "Français", es: "Español", it: "Italiano", pl: "Polski" };
    const cur = (this._userUi && this._userUi.ui_language) || "auto";
    const pick = async (v) => {
      try {
        await this._call("set_user_settings", { settings: { ...(this._userUi || {}), ui_language: v } }, false);
        this._userUi = { ...(this._userUi || {}), ui_language: v };
        try { if (v === "auto") localStorage.removeItem("smartlists-ui-lang"); else localStorage.setItem("smartlists-ui-lang", v); } catch (e) { /* */ }
        status.textContent = "✓";
        // alles mit der neuen Sprache neu zeichnen (Texte kommen über this._t)
        this._render(); if (this._renderSettings) this._renderSettings();
        window.dispatchEvent(new CustomEvent("smartlists-lists-changed"));
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    return this._sec("🌐", t.ui_lang, t.ui_lang_help, [h("div", { class: "chips" },
      Object.entries(names).map(([v, l]) => h("button", { type: "button", class: `chip2 ${cur === v ? "on" : ""}`, "aria-pressed": String(cur === v), onclick: () => pick(v) }, l))), status]);
  }

  // Global → Extras: optionale Bereiche, die Einsteiger nicht brauchen (im Assistenten standardmäßig aus)
  _extrasSection() {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    const body = h("div");
    const set = async (patch) => {
      try {
        const r = await this._call("set_features", patch, false);
        this._cfg = { ...this._cfg, features: r.features };
        status.textContent = "✓ " + t.saved;
        this._refreshPanel();
      } catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const draw = () => {
      const f = (this._cfg && this._cfg.features) || {};
      fill(body,
        this._setRow(t.x_notes, this._switch(!!f.notes, (on) => set({ notes: on }), t.x_notes), t.x_notes_help),
        this._setRow(t.x_mealplan, this._switch(f.mealplan !== false, (on) => set({ mealplan: on }), t.x_mealplan), t.x_mealplan_help),
        this._setRow(t.x_stats, this._switch(f.stats !== false, (on) => set({ stats: on }), t.x_stats), t.x_stats_help),
        h("div", { class: "acts" }, status));
    };
    draw();
    return this._sec("🧩", t.x_title, t.x_help, [body]);
  }

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
  // Knopf in der Summenleiste: Standard nur im Einkaufsmodus (Einstellungen → Einkaufen und Scannen)
  _showFinish() {
    const mode = this._ui.shop_finish || "shopping";
    return mode === "always" || (mode === "shopping" && !!this._shopping);
  }
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
          name: "", emoji: "", servings: null, items: this._data.items.filter((i) => !i.checked).map((i) => i.text) }, true) }, "📥 " + t.tpl_from_list) : null,
        this._data.items.some((i) => i.checked) ? h("button", { type: "button", class: "tcard new", onclick: () => this._templateEditor({
          name: "", emoji: "", servings: null, items: this._data.items.filter((i) => i.checked).map((i) => i.text) }, true) }, "✅ " + t.tpl_from_done) : null));
  }
