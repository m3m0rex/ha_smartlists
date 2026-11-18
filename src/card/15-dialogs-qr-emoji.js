/* Eigener Dialog statt Browser-confirm/prompt – im Stil von HA, Hell/Dunkel über Theme-Variablen.
 * slDialog(root, {title, text, input, value, placeholder, ok, cancel, danger}) → Promise<string|true|null> */
const DIALOG_STYLE = `
  .dlg-back { position:fixed; inset:0; z-index:999; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:16px;
    animation:dlgfade .12s ease-out; }
  .dlg { width:100%; max-width:380px; background:var(--card-background-color,#fff); color:var(--primary-text-color,#212121);
    border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.4); padding:20px 20px 14px; font-family:inherit; }
  .dlg h2 { margin:0 0 6px; font-size:1.1rem; font-weight:600; }
  .dlg p { margin:0 0 14px; color:var(--secondary-text-color,#727272); font-size:.9rem; line-height:1.4; }
  .dlg input { width:100%; box-sizing:border-box; height:42px; border-radius:10px; border:1px solid var(--divider-color,#ccc);
    background:var(--secondary-background-color,#f2f2f2); color:inherit; font:inherit; padding:0 12px; margin:0 0 14px; }
  .dlg input:focus { outline:2px solid var(--primary-color,#03a9f4); outline-offset:-1px; border-color:transparent; }
  .dlg .row { display:flex; justify-content:flex-end; gap:8px; }
  .dlg button { height:38px; padding:0 16px; border-radius:19px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ccc);
    background:none; color:var(--primary-color,#03a9f4); }
  .dlg button.ok { background:var(--primary-color,#03a9f4); border-color:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
  .dlg button.ok.danger { background:var(--error-color,#db4437); border-color:var(--error-color,#db4437); }
  .dlg button:disabled { opacity:.5; cursor:default; }
  @keyframes dlgfade { from { opacity:0; } to { opacity:1; } }
`;
function slDialog(root, opts) {
  return new Promise((resolve) => {
    const input = opts.input ? h("input", { value: opts.value || "", placeholder: opts.placeholder || "", "aria-label": opts.title, maxlength: "60" }) : null;
    const ok = h("button", { type: "button", class: `ok ${opts.danger ? "danger" : ""}` }, opts.ok);
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const submit = () => { if (input) { const v = input.value.trim(); if (v) close(v); } else close(true); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } else if (e.key === "Enter") { e.preventDefault(); submit(); } };
    ok.addEventListener("click", submit);
    if (input) { const upd = () => { ok.disabled = !input.value.trim(); }; input.addEventListener("input", upd); upd(); }
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": opts.title },
        h("h2", {}, opts.title), opts.text ? h("p", { style: "white-space:pre-line" }, opts.text) : null, input,
        h("div", { class: "row" }, opts.cancel ? h("button", { type: "button", onclick: () => close(null) }, opts.cancel) : null, ok)));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
    setTimeout(() => (input || ok).focus(), 30);
  });
}

// Lesbarer Name der Integration, der eine fremde To-do-Liste gehört („bring“ → „Bring!“, „google_tasks“ → „Google Tasks“)
function slPlatformName(platform, t) {
  const known = { local_todo: t.mg_pf_local, shopping_list: t.mg_pf_shopping, bring: "Bring!", todoist: "Todoist", google_tasks: "Google Tasks", mealie: "Mealie", caldav: "CalDAV", ourgroceries: "OurGroceries" };
  return known[platform] || (platform ? String(platform).replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()) : t.mg_pf_other);
}

/* „Fehler melden“: fragt nur, wo der Fehler aufgetreten ist (nichts vorbelegt – wer über die Seitenleiste in die
 * Einstellungen kommt, hat den Fehler nicht unbedingt dort gesehen). Danach „Auf GitHub öffnen“ (dort sieht und
 * bearbeitet man den Text ohnehin, bevor man ihn abschickt) oder „Text kopieren“. Verschickt wird von hier nichts.
 * env: {lines: [„- SmartLists: …“, …], repo, where?, code?, detail?} – where/code nur, wenn der Dialog aus einer
 * Fehlermeldung kommt; detail (kann Namen enthalten) kommt nur mit Haken in den Text, und der ist jedes Mal aus. */
function slReportDialog(root, t, env) {
  const WHERE = [["card", t.bug_w_card, "Dashboard card"], ["side", t.bug_w_side, "Sidebar page"], ["share", t.bug_w_share, "Share page"],
    ["settings", t.bug_w_settings, "Settings"], ["other", t.bug_w_other, "Other"]];
  const more = h("input", { type: "checkbox", style: "width:18px;height:18px;margin:0;flex:none" });
  const sel = h("select", { "aria-label": t.bug_where, style: "width:100%;font:inherit;padding:8px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color)" },
    h("option", { value: "" }, t.bug_choose), WHERE.map(([id, label]) => h("option", { value: id, selected: env.where === id }, label)));
  const body = () => { const w = WHERE.find((x) => x[0] === sel.value);
    return ["### What happened?", "", "", "### What did you expect?", "", "", "### Steps to reproduce", "1. ", "", "### Environment",
      ...env.lines, `- Where: ${w ? w[2] : "?"}`, ...(env.code ? [`- Error: ${env.code}`] : []), ...(env.detail && more.checked ? [`- Detail: ${env.detail}`] : [])].join("\n"); };
  const err = h("div", { role: "alert", style: "color:var(--error-color,#db4437);font-size:13px;min-height:18px;margin-top:4px" });
  sel.addEventListener("change", () => { err.textContent = ""; });
  const status = h("span", { style: "font-size:13px;color:var(--secondary-text-color);margin-right:auto" });
  const close = () => { back.remove(); document.removeEventListener("keydown", onKey, true); };
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  const need = () => { if (sel.value) return true; err.textContent = t.bug_need_where; sel.focus(); return false; };
  const copy = async () => {
    if (!need()) return;
    const text = body();
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = h("textarea", { style: "position:fixed;opacity:0" }); ta.value = text; back.append(ta); ta.select(); try { document.execCommand("copy"); } catch (e2) { /* */ } ta.remove(); }
    status.textContent = "✓ " + t.bug_copied;
  };
  const open = () => { if (!need()) return; window.open(`${env.repo}/issues/new?body=${encodeURIComponent(body())}`, "_blank", "noopener"); close(); };
  const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; }, onclick: (ev) => { if (ev.target === back && back._down) close(); } },
    h("style", {}, DIALOG_STYLE),
    h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.bug_title, style: "max-width:460px" },
      h("h2", {}, t.bug_title),
      h("label", { style: "display:block;font-weight:600;margin:4px 0 6px" }, t.bug_where), sel, err,
      env.detail ? h("label", { style: "display:flex;gap:10px;align-items:flex-start;margin:4px 0 8px;cursor:pointer" }, more, h("span", {}, t.bug_detail, h("br"), h("small", { style: "color:var(--secondary-text-color)" }, env.detail))) : null,
      h("p", { style: "margin:6px 0 0;font-size:13px;color:var(--secondary-text-color)" }, t.bug_note),
      h("div", { class: "row", style: "flex-wrap:wrap" }, status, h("button", { type: "button", onclick: close }, t.cancel),
        h("button", { type: "button", onclick: copy }, t.bug_copy), h("button", { type: "button", class: "ok", onclick: open }, t.bug_open))));
  document.addEventListener("keydown", onKey, true);
  root.append(back);
  setTimeout(() => sel.focus(), 30);
}

// Gerade gezogener Artikel (Ziehen & Ablegen zwischen Karten im selben Fenster)
let SL_DRAG = null;

/* Zone anlegen: Name, Ort (aktueller Standort / Zuhause / Karte / Koordinaten bzw. Karten-Link), Radius.
 * Die Karte nutzt HAs eigenen Orts-Editor (ha-locations-editor), sofern das Frontend ihn geladen hat –
 * sonst bleiben Standort, Zuhause und Koordinaten. → Promise<{name, latitude, longitude, radius} | null> */
function parseCoords(text) {
  const s = String(text || "").trim();
  const pats = [/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, /[?&](?:q|ll|query|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /mlat=(-?\d+(?:\.\d+)?).*mlon=(-?\d+(?:\.\d+)?)/i, /#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/, /^(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)$/];
  for (const re of pats) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1].replace(",", ".")), lon = Number(m[2].replace(",", "."));
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { latitude: lat, longitude: lon };
    }
  }
  return null;
}
function slZoneDialog(root, hass, t, name) {
  return new Promise((resolve) => {
    const home = { latitude: hass.config && hass.config.latitude, longitude: hass.config && hass.config.longitude };
    let pos = null, mode = "here";
    const nameIn = h("input", { value: name || "", "aria-label": t.zone_name, placeholder: t.zone_name, maxlength: "60" });
    const radiusIn = h("input", { type: "number", min: "20", max: "5000", step: "10", value: "100", "aria-label": t.zone_radius, style: "width:100px;margin:0" });
    const coordIn = h("input", { placeholder: t.zone_coords_placeholder, "aria-label": t.zone_coords });
    const info = h("p", { style: "margin:8px 0" });
    const mapBox = h("div", { style: "height:240px;border-radius:10px;overflow:hidden;margin:0 0 10px" });
    const hasMap = !!customElements.get("ha-locations-editor");
    const ok = h("button", { type: "button", class: "ok" }, t.create);
    const update = () => {
      coordIn.hidden = mode !== "coords";
      mapBox.hidden = mode !== "map";
      if (mode === "home") pos = home;
      if (mode === "coords") pos = parseCoords(coordIn.value);
      info.textContent = pos && pos.latitude != null ? `📍 ${Number(pos.latitude).toFixed(5)}, ${Number(pos.longitude).toFixed(5)}`
        : mode === "here" ? t.zone_locating : mode === "coords" && coordIn.value ? t.zone_coords_bad : "";
      ok.disabled = !(pos && pos.latitude != null && nameIn.value.trim());
    };
    const locate = () => {
      pos = null; update();
      if (!navigator.geolocation) { info.textContent = t.zone_no_location; return; }
      navigator.geolocation.getCurrentPosition((p) => { if (mode === "here") { pos = { latitude: p.coords.latitude, longitude: p.coords.longitude }; update(); } },
        () => { if (mode === "here") info.textContent = t.zone_no_location; }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    };
    const showMap = () => {
      if (!hasMap) return;
      const start = pos && pos.latitude != null ? pos : home;
      pos = { ...start };
      const ed = document.createElement("ha-locations-editor");
      ed.hass = hass;
      ed.style.height = "100%";
      ed.locations = [{ id: "new", latitude: start.latitude, longitude: start.longitude, radius: Number(radiusIn.value) || 100,
        radius_color: "var(--accent-color)", icon: "mdi:cart", location_editable: true, radius_editable: true }];
      ed.addEventListener("location-updated", (e) => { pos = { latitude: e.detail.location[0], longitude: e.detail.location[1] }; update(); });
      ed.addEventListener("radius-updated", (e) => { radiusIn.value = String(Math.round(e.detail.radius)); });
      fill(mapBox, ed);
      update();
    };
    const opt = (value, label) => h("label", { style: "display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer" },
      h("input", { type: "radio", name: "zpos", value, checked: value === mode, style: "width:auto;height:auto;margin:0",
        onchange: () => { mode = value; if (value === "here") locate(); else if (value === "map") showMap(); else update(); } }), label);
    const close = (v) => { back.remove(); resolve(v); };
    ok.addEventListener("click", () => {
      if (ok.disabled) return;
      close({ name: nameIn.value.trim(), latitude: Number(pos.latitude), longitude: Number(pos.longitude), radius: Math.max(20, Number(radiusIn.value) || 100) });
    });
    nameIn.addEventListener("input", update);
    coordIn.addEventListener("input", update);
    const back = h("div", { class: "dlg-back", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.zone_new, style: "max-width:460px" },
        h("h2", {}, t.zone_new),
        nameIn,
        h("div", { style: "margin:0 0 6px;font-weight:600" }, t.zone_where),
        opt("here", "📍 " + t.zone_here_opt), opt("home", "🏠 " + t.zone_home_opt),
        hasMap ? opt("map", "🗺️ " + t.zone_map_opt) : null, opt("coords", "⌨️ " + t.zone_coords),
        coordIn, mapBox, info,
        h("label", { style: "display:flex;align-items:center;gap:8px;margin:0 0 14px" }, t.zone_radius, radiusIn, "m"),
        h("p", {}, t.zone_after),
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => close(null) }, t.cancel), ok)));
    root.append(back);
    coordIn.hidden = true; mapBox.hidden = true;
    locate();
    setTimeout(() => nameIn.focus(), 30);
  });
}

/* Kleiner QR-Code-Erzeuger (Byte-Modus, Fehlerkorrektur M, Version 1–15) – ohne externe Bibliothek.
 * Nach dem Verfahren von Project Nayuki (MIT). qrMatrix(text) → Array von Zeilen (true = dunkel). */
const QR_ECC_M = { // je Version: [EC-Codewörter je Block, Blöcke]
  1: [10, 1], 2: [16, 1], 3: [26, 1], 4: [18, 2], 5: [24, 2], 6: [16, 4], 7: [18, 4], 8: [22, 4], 9: [22, 5], 10: [26, 5],
  11: [30, 5], 12: [22, 8], 13: [22, 9], 14: [24, 9], 15: [24, 10],
};
function qrRawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}
function qrAlignPos(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const out = [6];
  for (let p = ver * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p);
  return out;
}
function rsDivisor(degree) {
  const res = new Array(degree).fill(0); res[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < res.length; j++) { res[j] = rsMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
    root = rsMul(root, 0x02);
  }
  return res;
}
function rsRemainder(data, div) {
  const res = div.map(() => 0);
  for (const b of data) {
    const f = b ^ res.shift(); res.push(0);
    div.forEach((c, i) => { res[i] ^= rsMul(c, f); });
  }
  return res;
}
function rsMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z & 0xff;
}
function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 15; ver++) {
    const [ecLen, blocks] = QR_ECC_M[ver];
    const dataCap = Math.floor(qrRawModules(ver) / 8) - ecLen * blocks;
    const need = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8;
    if (need <= dataCap * 8) break;
  }
  if (ver > 15) throw new Error("text too long for QR");
  const [ecLen, numBlocks] = QR_ECC_M[ver];
  const rawCw = Math.floor(qrRawModules(ver) / 8);
  const dataCw = rawCw - ecLen * numBlocks;
  // Bitstrom
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCw * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < dataCw * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // Blöcke + Fehlerkorrektur, verschränkt
  const shortBlocks = numBlocks - (rawCw % numBlocks);
  const shortLen = Math.floor(rawCw / numBlocks);
  const div = rsDivisor(ecLen);
  const blocks = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - ecLen + (i < shortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < shortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const cw = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= shortBlocks) cw.push(b[i]); });
  // Matrix
  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = qrAlignPos(ver);
  al.forEach((a, i) => al.forEach((b, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const dataBits = (0 << 3) | mask; // ECC M = 00
    let rem = dataBits;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const b = ((dataBits << 10) | rem) ^ 0x5412;
    const bit = (i) => ((b >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const b = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const v = ((b >>> i) & 1) !== 0, a = size - 11 + (i % 3), c = Math.floor(i / 3);
      set(a, c, v); set(c, a, v);
    }
  }
  // Daten im Zickzack
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
      if (!fn[y][x] && i < cw.length * 8) { m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
    }
  }
  // Maske mit geringster Strafe wählen
  const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const apply = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0;
    const line = (get) => {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b <= size; b++) {
          if (b < size && get(a, b) === get(a, b - 1)) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        for (let b = 0; b + 10 < size + 1; b++) {
          const s = Array.from({ length: 11 }, (_, k) => (b + k < size ? get(a, b + k) : false));
          const pat = [true, false, true, true, true, false, true];
          const w = [false, false, false, false];
          if ((pat.every((v, k) => s[k] === v) && w.every((v, k) => s[7 + k] === v)) ||
              (w.every((v, k) => s[k] === v) && pat.every((v, k) => s[4 + k] === v))) p += 40;
        }
      }
    };
    line((a, b) => m[a][b]); line((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    const dark = m.flat().filter(Boolean).length, total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) {
    apply(k); drawFormat(k);
    const p = penalty();
    if (p < bestP) { bestP = p; best = k; }
    apply(k);
  }
  apply(best); drawFormat(best);
  return m;
}
// als SVG (mit Ruhezone), für <img src> bzw. direkt einfügen
function qrSvg(text, px = 4) {
  const m = qrMatrix(text);
  const n = m.length + 8;
  let d = "";
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + 4},${y + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n * px}" height="${n * px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// Anzeigename eines Marktes ("rewe" → "REWE") aus den bekannten Märkten
const itemStoreLabel = (key, cfg) => { const k = ((cfg && cfg.known_stores) || []).find((x) => String(x.value).toLowerCase() === key); return k ? k.value : key; };
// Geldbetrag in der Sprache von HA ("2,38 €")
// Währung des Haushalts (Einstellungen → Preise & Währung); gleiche Liste wie learning.CURRENCIES
const CURRENCIES = { EUR: ["€", "EUR"], CHF: ["CHF", "Fr.", "SFr"], GBP: ["£", "GBP"], USD: ["$", "USD"], PLN: ["zł", "PLN"],
  SEK: ["kr", "SEK"], DKK: ["kr", "DKK"], NOK: ["kr", "NOK"], CZK: ["Kč", "CZK"], HUF: ["Ft", "HUF"] };
// "custom" = eigenes Symbol (SL_LOOK.currency_symbol) statt einer Währung aus der Liste
const slCurrency = () => (SL_LOOK && SL_LOOK.currency === "custom" && SL_LOOK.currency_symbol ? "custom" : SL_LOOK && CURRENCIES[SL_LOOK.currency] ? SL_LOOK.currency : "EUR");
const slSymbols = () => (slCurrency() === "custom" ? [SL_LOOK.currency_symbol] : CURRENCIES[slCurrency()]);
const slCurrencySymbol = () => slSymbols()[0];
const ROW_ORDER = ["store", "tag", "person", "price", "note"];
const slRowOrder = () => (SL_LOOK && Array.isArray(SL_LOOK.order) && SL_LOOK.order.length ? [...SL_LOOK.order, ...ROW_ORDER.filter((x) => !SL_LOOK.order.includes(x))] : ROW_ORDER);
const fmtMoney = (v, lang) => (v == null ? "" : slCurrency() === "custom"
  ? `${new Intl.NumberFormat(lang || "de", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}\u00a0${SL_LOOK.currency_symbol}`
  : new Intl.NumberFormat(lang || "de", { style: "currency", currency: slCurrency() }).format(v));

/* Symbol-Auswahl (Emoji) für Vorlagen und Badges: Raster nach Gruppen + freie Eingabe.
 * slEmojiPicker(root, current, t) → Promise<string | null> ("" = ohne Symbol) */
const EMOJI_GROUPS = [
  ["food", "🥞🍝🍕🍔🌭🥗🍲🍛🍜🍣🥘🌮🥪🍳🥐🍞🥖🧀🥩🍗🥓🐟🍤🥦🥕🍅🍎🍌🍓🍇🍉🥑🌽🥔🧅🧄🍰🎂🍪🍫🍦☕🍵🍺🍷🥂🧃🥤"],
  ["occasion", "🔥🎉🎄🎃🥳🏕️🧺🛒🛍️🎁🍼🧹🧴🧻🧼🧽🐶🐱🌿🏠🚗🏖️"],
  ["people", "👤👥👨👩👧👦🧑👵👴🧔👶🙂😀😎🤓🦸🧙🤖"],
  ["symbols", "#️⃣🏷️✅⭐❤️💚💙💛🧡💜🖤🌱♻️🔖📌🔔❗💶🎯⚡"],
];
function slEmojiPicker(root, current, t) {
  return new Promise((resolve) => {
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(null); } };
    const free = h("input", { value: current || "", placeholder: t.emoji_free, "aria-label": t.emoji_free, maxlength: "8", style: "width:90px;text-align:center;margin:0" });
    // Antippen wählt nur aus (Vorschau im Feld) – übernommen wird mit OK
    const btn = (e) => h("button", { type: "button", class: "emo", title: e, "aria-label": e, onclick: () => { free.value = e; free.focus(); } }, e);
    const back = h("div", { class: "dlg-back", style: "z-index:1001", onpointerdown: (ev) => { back._down = ev.target === back; if (!back._down && ev.target.closest && ev.target.closest("input, textarea, select, .emo, .swatch")) back._dirty = true; }, oninput: () => { back._dirty = true; }, onclick: (ev) => { if (backdropClose(back, ev)) close(null); } },
      h("style", {}, DIALOG_STYLE + `.dlg .emo{width:42px;height:42px;border-radius:10px;border:none;background:none;font-size:22px;line-height:1;cursor:pointer;padding:0;
          display:inline-flex;align-items:center;justify-content:center;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
        .dlg .emo:hover,.dlg .emo:focus-visible{background:var(--secondary-background-color,#eee)}.egrid{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 10px}
        .eh{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color,#777);margin:6px 0 2px}`),
      h("div", { class: "dlg", role: "dialog", "aria-modal": "true", "aria-label": t.emoji_pick, style: "max-width:420px;max-height:85vh;overflow:auto" },
        h("h2", {}, t.emoji_pick),
        EMOJI_GROUPS.map(([key, list]) => [h("div", { class: "eh" }, t["emoji_" + key]),
          h("div", { class: "egrid" }, Array.from(new Intl.Segmenter ? [...new Intl.Segmenter().segment(list)].map((x) => x.segment) : [...list]).map(btn))]),
        h("div", { class: "row", style: "align-items:center" }, free,
          h("button", { type: "button", onclick: () => close(free.value.trim()) }, "OK"),
          h("button", { type: "button", style: "margin-right:auto", onclick: () => close("") }, t.emoji_none),
          h("button", { type: "button", onclick: () => close(null) }, t.cancel))));
    document.addEventListener("keydown", onKey, true);
    root.append(back);
  });
}
// Eingabefeld mit Symbol-Auswahl: Antippen öffnet das Raster, Tippen ins Feld geht weiterhin
function emojiField(root, input, t, onpick) {
  input.readOnly = false;
  input.style.cursor = "pointer";
  input.addEventListener("click", async () => {
    const v = await slEmojiPicker(root, input.value, t);
    if (v == null) return;
    input.value = v;
    if (onpick) onpick(v);
    input.dispatchEvent(new Event("change"));
  });
  return input;
}

// Für die Suche: klein, ohne Akzente/Umlaut-Punkte ("Äpfel" → "apfel"), ß → ss
function searchKey(s) {
  return String(s || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Gegenstück zu itemtext.split_offer (Angebots-Zeile der App in der Notiz)
function parseOfferNote(note, stores) {
  const m = /[⚙\u2699]\ufe0f?\s*OFFER\s*:/i.exec(note || "");
  if (!m) return { note, offer: null };
  const clean = note.slice(0, m.index).trim();
  try {
    const j = JSON.parse(note.slice(m.index + m[0].length).trim());
    if (!j || !j.s) return { note: clean, offer: null };
    const k = (stores || []).find((x) => x.value.toLowerCase() === String(j.s).toLowerCase());
    const num = (v) => (v == null || v === "" ? null : Number(String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")));
    return { note: clean, offer: { store: j.s, store_label: k ? k.value : j.s, color: k ? k.color : null, price: num(j.p), old_price: num(j.o),
      discount: j.d || null, valid_from: j.v || null, valid_until: j.e || null, bonus: num(j.b) ? { value: num(j.b), kind: j.bk === "pct" ? "pct" : "eur" } : null, expired: !!j.e && String(j.e).slice(0, 10) < new Date().toISOString().slice(0, 10) } };
  } catch (e) { return { note: clean, offer: null }; }
}
window.SmartListsText = { parseText, encodeText, openTagQuery, splitTags, parseImportText };

