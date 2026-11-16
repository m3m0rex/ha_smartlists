  // Teilen – ein Fenster wie im Mockup: links QR-Code, rechts die Rechte des Links, darunter der Link und die Personen
  // in Home Assistant (eigene Listen). Optional: Notizen mitzeigen, Passwort.
  _shareLinkSection(withPeople = false) {
    const t = this._t;
    const d = this._data;
    const status = h("span", { class: "ok2" });
    const body = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let approve = false;
    let check = "off", add = false, notes = false, password = "", password2 = "", usePw = false, hours = 168, links = [], pub = { public_mode: "ha", public_base: null };
    let url = null, lastId = null;
    // 4.0: bestehenden Link bearbeiten – das Formular oben zeigt dann dessen Werte, der Link bleibt gleich
    let edit = null, keepHours = false;
    const lang = this._hass.language;
    // Grenzen des Admins für Nicht-Admins (Global → Teilen und Rechte)
    const rights = this._isAdmin ? {} : (this._cfg && this._cfg.rights) || {};
    const maxLvl = ["off", "soft", "soft_add", "on"].indexOf(rights.share_max || "on");
    const maxHours = rights.share_max_hours || null;
    if (maxHours && hours > maxHours) hours = maxHours;
    const base = () => {
      const c = this._hass.config || {};
      return String(c.external_url || (this._hass.auth && this._hass.auth.data && this._hass.auth.data.hassUrl) || location.origin).replace(/\/$/, "");
    };
    const fmtDate = (ts) => new Date(ts * 1000).toLocaleString(lang || "de", { dateStyle: "short", timeStyle: "short" });
    const seg = (value, opts, onpick) => h("div", { class: "seg", role: "radiogroup" }, opts.map(([v, l]) =>
      h("button", { type: "button", role: "radio", "aria-checked": String(v === value), class: v === value ? "on" : "", onclick: () => onpick(v) }, l)));
    const modeText = (l) => [l.check === "on" ? t.share_seg_yes : l.check === "soft" ? t.share_seg_soft : t.share_view,
      l.add ? t.share_add : null, l.notes ? t.share_notes : null, l.password ? "🔒" : null].filter(Boolean).join(" · ");
    const people = h("div");
    if (withPeople) this._peopleRows(people, status);
    const pwHint = h("span");
    const pwOk = () => !password || password === password2;
    const pwState = () => {
      fill(pwHint, !password && !password2 ? "" : pwOk() ? h("span", { style: "color:var(--success-color,#43a047)" }, "✓ " + t.share_pw_match)
        : h("span", { style: "color:var(--error-color,#db4437)" }, "✗ " + t.share_pw_mismatch));
      const btn = body.querySelector && body.querySelector("button.mkLink");
      if (btn) btn.disabled = !pwOk();
    };
    const draw = () => {
      const qr = h("div", { class: "qrbox" });
      if (url) { try { qr.innerHTML = qrSvg(url, 4); } catch (e) { qr.textContent = "🔗"; } }
      else qr.append(h("span", { class: "qrph" }, "🔗"), h("small", {}, t.share_qr_hint));
      const checkOpts = [["off", t.share_seg_no], ["on", t.share_seg_yes], ["soft", t.share_seg_soft]]
        .filter(([v]) => v === "off" || (v === "soft" && maxLvl >= 1) || (v === "on" && maxLvl >= 3));
      const mayAdd = maxLvl >= 3 || (maxLvl >= 2 && check === "soft");
      if (!mayAdd) add = false;
      const isLocal = !!url && /\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^/]*\.local)/i.test(url);
      fill(body,
        edit ? h("div", { class: "shelp", style: "padding:0 0 8px;color:var(--sl-accent)" }, `✎ ${t.share_edit} – ${t.share_edit_help}`) : null,
        h("div", { class: "sharegrid" }, qr, h("div", {},
          this._setRow(t.share_mode, seg(check, checkOpts, (v) => { check = v; url = null; draw(); }), check === "soft" ? t.share_mode_help : null),
          this._setRow(t.share_add, this._switch(add, (v) => { add = v; url = null; draw(); }, t.share_add), mayAdd ? null : t.share_add_locked),
          add ? this._setRow(t.share_approve, this._switch(approve, (v) => { approve = v; url = null; }, t.share_approve), t.share_approve_help) : null,
          this._setRow(t.share_notes, this._switch(notes, (v) => { notes = v; url = null; }, t.share_notes), t.share_notes_help),
          this._setRow(t.share_password_on, this._switch(usePw, (v) => { usePw = v; if (!v) { password = ""; password2 = ""; } url = null; draw(); }, t.share_password_on), t.share_password_help),
          ...(usePw ? [
          this._setRow(t.share_password, h("input", { class: "search2", style: "min-width:150px;margin:0", type: "password", autocomplete: "new-password",
            placeholder: edit && edit.password ? t.share_pw_keep : t.share_password_ph, value: password, "aria-label": t.share_password, oninput: (e) => { password = e.target.value; pwState(); } })),
          // Passwort zur Sicherheit ein zweites Mal – erst wenn beide gleich sind, lässt sich der Link erstellen
          this._setRow(t.share_password2, h("input", { class: "search2 pw2", style: "min-width:150px;margin:0", type: "password", autocomplete: "new-password",
            value: password2, "aria-label": t.share_password2, oninput: (e) => { password2 = e.target.value; pwState(); } }), pwHint),
          ] : []),
          this._setRow(t.share_valid, h("select", { "aria-label": t.share_valid, onchange: (e) => { keepHours = e.target.value === "keep"; if (!keepHours) hours = e.target.value ? Number(e.target.value) : null; } },
            edit ? h("option", { value: "keep", selected: keepHours }, `${t.share_keep} (${edit.expires ? `${t.share_until} ${fmtDate(edit.expires)}` : t.share_forever})`) : null,
            [[2, t.share_2h], [24, t.share_1d], [168, t.share_7d], [720, t.share_30d], ["", t.share_forever]]
              .filter(([v]) => !maxHours || (v !== "" && v <= maxHours)).map(([v, l]) =>
              h("option", { value: String(v), selected: !keepHours && String(hours ?? "") === String(v) }, l)))),
          url ? h("div", { class: "sharelink" }, url) : null,
          url ? h("div", { class: "shelp" }, t.share_once) : null,
          isLocal ? h("div", { class: "shelp", style: "color:var(--warning-color,#ff9800)" }, "⚠️ " + t.share_local) : null,
          h("div", { class: "acts", style: "justify-content:flex-start;flex-wrap:wrap" },
            url ? h("button", { class: "btn2", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(url); status.textContent = "✓ " + t.share_copied; } catch (e) { status.textContent = url; } } }, t.share_copy) : null,
            url && navigator.share ? h("button", { class: "btn2", type: "button", onclick: () => navigator.share({ title: d ? d.name : "SmartLists", url }).catch(() => {}) }, t.share_send) : null,
            url && lastId ? h("button", { class: "btn2 danger", type: "button", onclick: async () => { links = (await this._call("share_revoke", { link_id: lastId })).links; url = null; lastId = null; draw(); } }, t.share_revoke) : null,
            edit ? h("button", { class: "btn2", type: "button", onclick: () => stopEdit() }, t.cancel) : null,
            edit ? h("button", { class: "btn2 primary mkLink", type: "button", onclick: saveEdit }, t.save) : null,
            url || edit ? null : h("button", { class: "btn2 primary mkLink", type: "button", onclick: create }, "🔗 " + t.share_create),
            status))),
        d && d.type === "combined" ? h("div", { class: "shelp", style: "padding:6px 0" }, "⚠️ " + t.share_combined) : null,
        h("div", { class: "shelp", style: "padding:4px 0" }, pub.public_mode === "ha" ? "ℹ️ " + t.share_leak
          : `🛡️ ${pub.public_mode === "tunnel" ? t.pub_tunnel : pub.public_mode === "named" ? t.pub_named : t.pub_proxy}${pub.public_base ? ": " + pub.public_base : " – " + t.pub_not_ready}`),
        links.length ? h("div", { class: "grp" }, t.share_active) : null,
        ...links.map((l) => this._setRow([modeText(l), edit && edit.id === l.id ? h("span", { class: "own" }, ` · ${t.share_edit}`) : null],
          h("span", { style: "display:flex;gap:2px" }, iconBtn(ICON.pencil, t.share_edit, () => startEdit(l)), iconBtn(ICON.close, t.share_revoke, async () => { links = (await this._call("share_revoke", { link_id: l.id })).links; if (l.id === lastId) { url = null; lastId = null; } if (edit && edit.id === l.id) edit = null; draw(); }, "danger")),
          `${l.expired ? "⚠️ " + t.share_expired : l.expires ? `${t.share_until} ${fmtDate(l.expires)}` : t.share_forever} · ${l.opens}× ${t.share_opened}`
          + (l.base && l.base !== pub.public_base ? ` · ⚠️ ${t.share_old_address}` : ""))),
        withPeople ? h("div", { class: "grp" }, "👥 " + t.people_title) : null,
        withPeople ? people : null);
      pwState();
    };
    const startEdit = (l) => {
      edit = l; url = null; lastId = null; keepHours = true;
      check = l.check; add = !!l.add; approve = !!l.approve; notes = !!l.notes; usePw = !!l.password; password = ""; password2 = "";
      status.textContent = ""; draw();
      if (body.scrollIntoView) body.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    const stopEdit = () => { edit = null; keepHours = false; usePw = false; password = ""; password2 = ""; status.textContent = ""; draw(); };
    const saveEdit = async () => {
      if (!pwOk()) { status.textContent = "✗ " + t.share_pw_mismatch; return; }
      const msg = { link_id: edit.id, check, add, notes, approve: add && approve };
      if (!keepHours) msg.hours = hours;
      // Schalter aus = Schutz entfernen; an + neues Passwort = ändern; an + leer = bleibt
      if (!usePw && edit.password) msg.password = ""; else if (usePw && password) msg.password = password;
      try { links = (await this._call("share_update", msg)).links; stopEdit(); status.textContent = "✓ " + t.saved; }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const create = async () => {
      if (!pwOk()) { status.textContent = "✗ " + t.share_pw_mismatch; return; }
      try {
        const r = await this._call("share_create", { check, add, hours, notes, approve: add && approve, password: password || null });
        url = (r.base || base()) + r.path;
        lastId = r.id;
        password = ""; password2 = ""; usePw = false;
        ({ links, ...pub } = { ...pub, ...(await this._call("share_links", {})) });
        status.textContent = "";
        draw();
      } catch (err) { status.textContent = err && err.code === "public_unavailable" ? `⚠️ ${t.pub_not_ready} (${err.message})` : (err && err.message) || t.error; }
    };
    this._call("share_links", {}).then((r) => { ({ links, ...pub } = { ...pub, ...r }); draw(); }).catch((err) => fill(body, h("div", { class: "shelp" }, (err && err.message) || t.error)));
    return this._sec("🔗", t.share_title.replace("{name}", d ? d.name : ""), t.share_help, [body]);
  }
  // „Wer darf was?“ (eigene Listen): nur Personen mit Zugriff, je Person Sehen · Abhaken · Bearbeiten, ✕ entfernt den Zugriff.
  // Wer nicht hinzugefügt ist, hat keine Rechte. Besitzer und Admins dürfen immer alles.
  _peopleRows(box, status) {
    const t = this._t;
    const own = this._data.own;
    fill(box, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    let users = [];
    const setRole = async (u, role) => {
      try { await this._call("share", { user_id: u.id, role }); status.textContent = "✓ " + t.saved; await this._load(); own.shares = (this._data.own && this._data.own.shares) || own.shares; draw(); }
      catch (err) { status.textContent = (err && err.message) || t.error; }
    };
    const avatar = (u) => h("span", { class: "pav", style: `background:${hashColor(u.name || u.id)}` }, String(u.name || "?").trim().charAt(0).toUpperCase());
    const draw = () => {
      const shares = own.shares || {};
      const owner = users.find((u) => u.id === own.owner_id);
      const admins = users.filter((u) => u.is_admin && u.id !== own.owner_id);
      const members = users.filter((u) => !u.is_admin && u.id !== own.owner_id && shares[u.id]);
      const rest = users.filter((u) => !u.is_admin && u.id !== own.owner_id && !shares[u.id]);
      const roleSeg = (u) => h("div", { class: "seg", role: "radiogroup", "aria-label": u.name }, [["viewer", t.role_viewer], ["checker", t.role_checker], ["editor", t.role_editor]]
        .map(([v, l]) => h("button", { type: "button", role: "radio", "aria-checked": String(shares[u.id] === v), class: shares[u.id] === v ? "on" : "", onclick: () => setRole(u, v) }, l)));
      let pick = "";
      const sel = h("select", { "aria-label": t.people_add, onchange: (e) => { pick = e.target.value; } },
        h("option", { value: "" }, "＋ " + t.people_add + " …"), rest.map((u) => h("option", { value: u.id }, u.name)));
      fill(box,
        owner ? h("div", { class: "prow" }, avatar(owner), h("span", { class: "pn" }, owner.name, h("small", {}, t.role_owner)), h("span", { class: "shelp" }, t.role_all)) : null,
        ...admins.map((u) => h("div", { class: "prow" }, avatar(u), h("span", { class: "pn" }, u.name, h("small", {}, t.admin)), h("span", { class: "shelp" }, t.role_all))),
        ...members.map((u) => h("div", { class: "prow" }, avatar(u), h("span", { class: "pn" }, u.name),
          h("span", { class: "pctl" }, roleSeg(u), iconBtn(ICON.close, `${t.people_remove}: ${u.name}`, () => setRole(u, null), "danger")))),
        members.length ? null : h("div", { class: "shelp", style: "padding:6px 0" }, t.people_none),
        rest.length ? h("div", { class: "acts", style: "justify-content:flex-start" }, sel,
          h("button", { class: "btn2 primary", type: "button", onclick: () => { const u = rest.find((x) => x.id === pick); if (u) setRole(u, "checker"); } }, t.people_add_btn)) : null,
        h("div", { class: "shelp", style: "padding:6px 0 0" }, t.people_legend));
    };
    (async () => {
      try { users = (await this._call("users", {}, false)).users || []; } catch (e) { fill(box, t.error); return; }
      draw();
    })();
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
        this._barcodeProviders(cur, status),
        h("div", { class: "acts" }, status, h("button", { class: "btn2", type: "button", onclick: async () => {
          try { const res = await this._call("install_sentences", {}, false); status.textContent = `✓ ${t.sentences_installed}: ${res.languages.join(", ")}`; }
          catch (err) { status.textContent = (err && err.message) || t.error; }
        } }, t.install_sentences)));
    }).catch(() => fill(body, t.error));
    return this._sec("🎙️", t.automation, t.automation_help, [body]);
  }

  // Dienste fürs Nachschlagen: antippen = an/aus, Zahl = Reihenfolge (der erste Treffer zählt); eigener Dienst per URL
  _barcodeProviders(cur, status) {
    const t = this._t;
    const box = h("div");
    const save = async (patch) => {
      Object.assign(cur, patch);
      try { await this._call("set_automation", { settings: { ...cur } }, false); status.textContent = "✓ " + t.saved; } catch (err) { status.textContent = (err && err.message) || t.error; }
      draw();
    };
    const draw = () => {
      const order = cur.barcode_providers && cur.barcode_providers.length ? cur.barcode_providers : ["off"];
      fill(box, h("div", { class: "grp" }, t.barcode_providers),
        h("div", { class: "chips" }, BARCODE_PROVIDERS.map(([id, name]) => {
          const pos = order.indexOf(id);
          return h("button", { type: "button", class: `chip2 ${pos >= 0 ? "on" : ""}`, "aria-pressed": String(pos >= 0),
            onclick: () => save({ barcode_providers: pos >= 0 ? order.filter((x) => x !== id) : [...order, id] }) },
            pos >= 0 ? `${pos + 1}. ` : "", name || t.barcode_custom);
        })),
        h("div", { class: "shelp", style: "padding:2px 0 6px" }, t.barcode_providers_help),
        order.includes("custom") ? h("div", { class: "rule2", style: "grid-template-columns:minmax(0,1fr) 140px;margin-top:4px" },
          h("input", { value: cur.barcode_custom_url || "", placeholder: "https://example.org/api/{code}", "aria-label": t.barcode_custom_url,
            onchange: (e) => save({ barcode_custom_url: e.target.value.trim() }) }),
          h("input", { value: cur.barcode_custom_field || "", placeholder: "product.name", "aria-label": t.barcode_custom_field,
            onchange: (e) => save({ barcode_custom_field: e.target.value.trim() }) })) : null);
    };
    draw();
    return box;
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
  // Herkunfts-Badge einer kombinierten Liste: „Liste“, „Besitzer“ oder „Besitzer Liste“; nur bestimmte Quell-Listen
  _labelSection(d) {
    const t = this._t;
    const status = h("span", { class: "ok2" });
    let show = (d.label && d.label.show) || "list";
    let only = new Set((d.label && d.label.sources) || []);
    let colors = { ...((d.label && d.label.colors) || {}) };
    const auto = (d.label && d.label.auto_colors) || {};
    let dirty = false;
    const saveBtn = h("button", { class: "btn2 primary", type: "button", disabled: true, onclick: async () => {
      status.textContent = t.loading; saveBtn.disabled = true;
      try {
        await this._call("set_labels", { show, sources: [...only], colors });
        dirty = false; status.textContent = "✓ " + t.saved;
        this._listSettingsApplied = null;
        await this._load();
      } catch (err) { status.textContent = (err && err.message) || t.error; saveBtn.disabled = false; }
    } }, t.save);
    const touch = () => { dirty = true; saveBtn.disabled = false; status.textContent = ""; };
    const box = h("div", {});
    const draw = () => fill(box,
      this._setRow(t.lb_show, h("select", { "aria-label": t.lb_show, onchange: (e) => { show = e.target.value; touch(); } },
        [["list", t.lb_list], ["owner", t.lb_owner], ["owner_list", t.lb_both]].map(([v, l]) => h("option", { value: v, selected: show === v }, l))), t.lb_show_help),
      h("div", { class: "grp" }, t.lb_only),
      h("div", { class: "chips" }, h("button", { type: "button", class: `chip2 ${only.size ? "" : "on"}`, "aria-pressed": String(!only.size),
        onclick: () => { only = new Set(); touch(); draw(); } }, t.lb_all),
        d.sources.map((src) => h("button", { type: "button", class: `chip2 ${only.has(src.entity_id) ? "on" : ""}`, "aria-pressed": String(only.has(src.entity_id)),
          onclick: () => { if (only.has(src.entity_id)) only.delete(src.entity_id); else only.add(src.entity_id); touch(); draw(); } }, src.name))),
      h("div", { class: "grp" }, t.lb_colors),
      d.sources.map((src) => this._setRow(src.name, h("span", { class: "look-row" },
        h("input", { type: "color", value: colors[src.entity_id] || auto[src.entity_id] || "#888888", "aria-label": `${src.name}: ${t.look_color}`, title: t.look_color,
          onchange: (e) => { colors[src.entity_id] = e.target.value; touch(); draw(); } }),
        colors[src.entity_id] ? h("button", { class: "btn2", type: "button", style: "height:30px;padding:0 10px", title: t.reset_default, "aria-label": t.reset_default,
          onclick: () => { delete colors[src.entity_id]; touch(); draw(); } }, "↺") : null))),
      h("div", { class: "acts" }, status, saveBtn));
    draw();
    return this._sec("🏷️", t.lb_title, t.lb_help, [box]);
  }

  // Besitzer wählen: eigene Listen (Pflicht) und kombinierte Listen („— alle“ = keine Einschränkung)
  _ownerSelect(d, status) {
    const t = this._t;
    const sel = h("select", { "aria-label": t.owner, disabled: true }, h("option", {}, t.loading));
    this._call("users", {}, false).then((r) => {
      const current = (d.own && d.own.owner_id) || "";
      fill(sel, d.type === "combined" ? h("option", { value: "", selected: !current }, t.owner_everyone) : null,
        r.users.map((u) => h("option", { value: u.id, selected: u.id === current }, u.name)));
      sel.disabled = false;
    }).catch(() => fill(sel, h("option", {}, t.error)));
    sel.addEventListener("change", async () => {
      try {
        await this._call("set_owner", { owner: sel.value || null });
        status.textContent = "✓ " + t.saved;
        await this._load();
        // Fenster neu aufbauen (Freigaben erscheinen bzw. verschwinden je nach Besitzer)
        const open = this.shadowRoot.querySelector(".dlg-back.lsd");
        if (open) { open.remove(); this._listDialog(); }
      } catch (err) { status.textContent = (err && err.message) || t.error; }
    });
    return sel;
  }

  _sharing(peopleElsewhere = false) {
    const t = this._t;
    const own = this._data.own;
    const box = h("div", {}, h("div", { class: "shelp", style: "padding:6px 0" }, t.loading));
    const status = h("span", { class: "ok2" });
    if (peopleElsewhere) fill(box, h("div", { class: "shelp" }, t.share_people_moved));
    else (async () => {
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

  // Einträge des ⋯-Menüs (abhängig von Karte, Liste und Rechten)
  _moreItems(d) {
    const t = this._t;
    const c = this._config;
    const out = [];
    const closeAll = () => { this._moreOpen = false; this._showSettings = false; this._showImport = false; this._showTpl = false; };
    if (d.type !== "notes" && d.items.length) out.push([ICON.check, t.sel_mode, () => this._startSelect(null)]);
    if (d.permissions.add && c.show_import !== false && d.type !== "notes")
      out.push([ICON.importIcon, t.imp, () => { closeAll(); this._showImport = true; this._renderSettings(); this._renderImport(); this._render(); }]);
    if (d.type !== "notes" && d.permissions.add && c.show_templates !== false) {
      out.push([ICON.template, t.tpl, () => { closeAll(); this._showTpl = true; this._renderTemplates(); this._render(); }]);
      if (this._feat("mealplan")) out.push([ICON.calendar, t.mp_title, () => { this._moreOpen = false; this._renderMore(); this._mealPlanDialog(); }]);
    }
    if (c.show_settings !== false) {
      if (c.settings_scope !== "list") out.push([ICON.tune, t.settings_global, () => { closeAll(); this._showSettings = true; this._setChosen = false; this._renderImport(); this._renderSettings(); this._render(); }]);
      out.push([ICON.gear, t.settings_list, () => { this._moreOpen = false; this._renderMore(); this._listDialog(); }]);
    }
    return out;
  }
  _renderMore() {
    if (!this._moreEl) return;
    const d = this._data;
    if (!this._moreOpen || !d) return fill(this._moreEl);
    const t = this._t;
    const items = this._moreItems(d);
    // Sortierung: nur das Auswahlfeld (ohne zweites Symbol), das Menü direkt unter dem ⋯-Knopf
    const sortRow = this._config.show_sort && d.type !== "notes" ? h("div", { class: "mi sortrow" }, svg(ICON.sort, 20), this._sortSelect(d).querySelector("select")) : null;
    const btn = this.shadowRoot && this.shadowRoot.querySelector(".morebtn");
    const card = this.shadowRoot && this.shadowRoot.querySelector("ha-card");
    let top = 52;
    if (btn && card && btn.getBoundingClientRect) {
      const b = btn.getBoundingClientRect(), c = card.getBoundingClientRect();
      if (b.height) top = Math.round(b.bottom - c.top + 4);
    }
    fill(this._moreEl, h("div", { class: "moreback", onclick: () => { this._moreOpen = false; this._renderMore(); } }),
      h("div", { class: "menu morepop", role: "menu", "aria-label": t.more, style: `top:${top}px` },
        sortRow,
        items.map(([icon, label, fn]) => h("button", { class: "mi", type: "button", role: "menuitem", onclick: fn }, svg(icon, 20), label))));
  }

  _settingsBtn(scope, icon, label) {
    if (scope === "list") return iconBtn(icon, label, () => this._listDialog());
    const open = this._showSettings;
    return iconBtn(open ? ICON.close : icon, label, () => {
      this._showSettings = !open;
      this._setChosen = false;
      this._showImport = false;
      this._renderImport(); this._renderSettings(); this._render();
    });
  }

  async _renderSettings() {
    const el = this._settingsEl;
    if (!this._showSettings || !this._cfg) return fill(el);
    const t = this._t;
    const areas = this._areas();
    // 📊 auf der Seite öffnet direkt die Auswertung
    if (this._config.settings_scope === "stats" && !this._setArea) { this._setArea = "stats"; this._setChosen = true; }
    const cur = areas.find((a) => a.id === this._setArea) || areas[0];
    const open = (id) => { this._setArea = id; this._setChosen = true; this._renderSettings(); };
    const btns = [];
    const group = (g, title, extra) => {
      const list = areas.filter((a) => a.g === g);
      if (!list.length) return null;
      return [h("h4", {}, title, extra ? h("span", {}, ` (${extra})`) : null), list.map((a) => {
        const b = h("button", { type: "button", class: a.id === cur.id ? "on" : "", "aria-current": a.id === cur.id ? "page" : "false", onclick: () => open(a.id) }, a.label);
        btns.push([b, searchKey([a.label, a.sub, ...(a.kw || [])].join(" "))]);
        return b;
      })];
    };
    const search = h("input", { type: "search", class: "search2", placeholder: t.a_search, "aria-label": t.a_search,
      oninput: (e) => { const q = searchKey(e.target.value); btns.forEach(([b, key]) => { b.hidden = !!q && !key.includes(q); }); } });
    const nav = h("nav", { class: "snav", "aria-label": t.settings }, search,
      group("me", t.tab_me), group("global", t.tab_house, t.admin_only_short), group("stats", t.g_stats), group("info", t.a_info),
      h("div", { class: "ver" }, h("span", {}, `SmartLists ${this._version || CARD_VERSION}`),
        h("a", { href: "https://ha-smartlists.com/", target: "_blank", rel: "noopener" }, "Website"), " · ",
        h("a", { href: "https://github.com/m3m0rex/ha_smartlists/wiki", target: "_blank", rel: "noopener" }, "Wiki")));
    const main = h("div", { class: "smain" },
      h("button", { class: "sback", type: "button", onclick: () => { this._setChosen = false; this._renderSettings(); } }, "← " + t.settings),
      h("header", {}, h("h2", {}, cur.label), cur.sub ? h("p", {}, cur.sub) : null),
      h("div", { class: "acols" }, cur.build()));
    fill(el, h("div", { class: "sl-settings" }, h("div", { class: `sgrid ${this._setChosen ? "detail" : ""}` }, nav, main)));
  }
}

