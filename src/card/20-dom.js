/* ------------------------------------------------------------------ */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value") el.value = v;
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function svg(path, size = 20, cls) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", size);
  s.setAttribute("height", size);
  if (cls) s.setAttribute("class", cls);
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "currentColor");
  s.append(p);
  return s;
}
// Wie el.replaceChildren(), aber null/false/"" werden übersprungen statt als Text "null" zu erscheinen
function fill(el, ...children) {
  el.replaceChildren(...children.flat(Infinity).filter((c) => c != null && c !== false && c !== ""));
  return el;
}
// Klick neben ein Fenster schließt es nur, wenn der Klick dort auch begann (nicht beim Markieren von Text)
// und noch nichts eingetippt/geändert wurde – sonst wackelt das Fenster kurz.
function backdropClose(back, ev) {
  if (ev.target !== back || !back._down) return false;
  if (back._dirty) {
    const d = back.querySelector(".dlg, .lsd-win, .wiz");
    if (d && d.animate) d.animate([{ transform: "scale(1)" }, { transform: "scale(1.015)" }, { transform: "scale(1)" }], { duration: 180 });
    return false;
  }
  return true;
}
const iconBtn = (path, title, onclick, cls = "") =>
  h("button", { class: `icon-btn ${cls}`, title, "aria-label": title, type: "button", onclick }, svg(path, 18));
// Anzahl („2×“) und Größe („1 l“, „2,5 kg“) eines Artikels – in der Zeile fest markiert.
// Mit Einheit ist quantity die Größe und pack_count die Anzahl („Milch 2x 1 l“); ohne Einheit ist quantity die Anzahl.
// Ein wörtlich gemeintes "2x" steht im Text in Anführungszeichen – angezeigt wird es ohne
const showName = (name) => String(name == null ? "" : name).replace(/["“„”](\d{1,3}[×xX])["“”]/g, "$1");
const countOf = (it) => {
  const n = it.unit ? it.pack_count : it.quantity;
  return n != null && Number(n) !== 1 ? `${fmtQty(n)}×` : "";
};
const sizeOf = (it) => (it.unit && it.quantity != null ? `${fmtQty(it.quantity)}\u00a0${it.unit}` : "");
// Farbe der Kategorie-Balken (eigene Kategorien: aus dem Namen abgeleitet)
const CAT_COLORS = { obst_gemuese: "#5fae4c", fleisch: "#d9655b", kuehlung: "#4a8fd8", grundnahrung: "#c8973a", backwaren: "#d5964a", getraenke: "#35a3bd",
  suessigkeiten: "#c56fb0", haushalt: "#7d8f9c", drogerie: "#9b74dc", tiefkuehl: "#5bb6d6", tierbedarf: "#a0855b", sonstiges: "#7d8790" };
const catColor = (id) => CAT_COLORS[id] || hashColor(String(id || ""));
const emojiOf = (label) => (label || "").split(" ")[0];
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function hashColor(s) {
  let x = 0;
  for (const c of s.toLowerCase()) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${x % 360} 55% 42%)`;
}
/* Badges & Farben des Haushalts (smartlists/config → appearance). Wird beim Laden gesetzt; ohne
 * Einstellung sehen Badges aus wie bisher (Markt gefüllt in Markenfarbe, Person/Schlagwort dezent). */
let SL_LOOK = { kinds: {}, values: {} };
const BADGE_STYLES = ["filled", "soft", "outline", "text"];
const BADGE_DEFAULTS = { store: { style: "filled", icon: "" }, person: { style: "soft", icon: "👤" }, tag: { style: "soft", icon: "#" } };
function textOn(color) {
  // helle Farben → dunkle Schrift (Lesbarkeit bei „gefüllt“)
  const m = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#1a1a1a" : "#fff";
}
// Anzahl („2ד), Größe („1 l“) und Angebots-Hinweis: Stil und Farbe wie bei den Badges einstellbar (Einstellungen → Badges & Farben)
const MARK_DEFAULTS = { count: { style: "soft", color: "#e39a1c" }, size: { style: "outline", color: "#e39a1c" }, offer: { style: "filled", color: "#f2b705" } };
function markStyle(kind, look = SL_LOOK) {
  const k = { ...MARK_DEFAULTS[kind], ...(((look && look.kinds) || {})[kind] || {}) }, c = k.color;
  if (k.style === "filled") return `background:${c};color:${k.text || textOn(c)};border:1.5px solid ${c}`;
  if (k.style === "outline") return `background:none;color:${k.text || c};border:1.5px solid ${c}`;
  if (k.style === "text") return `background:none;color:${k.text || c};border:1.5px solid transparent;padding-left:0;padding-right:0`;
  return `background:color-mix(in srgb, ${c} 18%, transparent);color:${k.text || c};border:1.5px solid transparent`;
}
function badge(tag, look = SL_LOOK) {
  if (!look || typeof look !== "object") look = SL_LOOK; // auch bei tags.map(badge) (2. Argument = Index)
  const kind = tag.kind === "store" || tag.kind === "person" ? tag.kind : "tag";
  const k = { ...BADGE_DEFAULTS[kind], ...((look.kinds || {})[kind] || {}) };
  // Schlagwörter sehen alle gleich aus (Einstellung „Je Art“); einzeln anpassen nur Märkte und Personen
  const v = kind === "tag" ? {} : (look.values || {})[`${kind}:${String(tag.value).toLowerCase()}`] || {};
  const label = (kind === "store" && v.label) || tag.label || tag.value;
  const color = v.color || (kind === "store" ? tag.color || k.color || hashColor(String(tag.value)) : tag.color || k.color);
  const text = v.text || k.text; // eigene Schriftfarbe (optional)
  const css = !color ? (text ? `color:${text}` : "") : k.style === "filled" ? `background:${color};color:${text || textOn(color)}`
    : k.style === "soft" ? `background:color-mix(in srgb, ${color} 18%, transparent);color:${text || color}`
    : `color:${text || color}`;
  const cls = { store: "store", person: "person", tag: "hash" }[kind];
  // Herkunfts-Badge (implizit, aus dem Listennamen): ohne Symbol – nur der Name in der Farbe der Quell-Liste
  const icon = k.icon && !tag.implicit ? (kind === "person" ? `${k.icon} ` : k.icon) : "";
  return h("span", { class: `tag ${cls} s-${k.style}`, style: css, title: label }, icon, label);
}

// Fälligkeit kurz: "2026-11-20" → "20.11.", "2026-11-20T18:00" → "20.11. 18:00"
function slDue(due) {
  const d = String(due || "");
  return d.length < 10 ? "" : `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.length > 10 ? " " + d.slice(11, 16) : ""}`;
}

function slToday(offset = 0) {
  const n = new Date(); n.setDate(n.getDate() + offset);
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

// "over" (vor heute), "today" oder "later"
function slDueState(due) {
  const day = String(due || "").slice(0, 10), today = slToday();
  return day < today ? "over" : day === today ? "today" : "later";
}

// Klartext: "überfällig · 10.11.", "heute 18:00", "morgen", sonst "So 22.11."
function slDueText(due, t, lang) {
  const d = String(due || ""), day = d.slice(0, 10), time = d.length > 10 ? " " + d.slice(11, 16) : "";
  const state = slDueState(d);
  if (state === "over") return `${t.due_over} · ${slDue(day)}`;
  if (state === "today") return t.due_today + time;
  if (day === slToday(1)) return t.due_tomorrow + time;
  let wd = "";
  try { wd = new Date(day + "T12:00").toLocaleDateString(lang || "de", { weekday: "short" }) + " "; } catch (e) { /* ohne Wochentag */ }
  return wd + slDue(d);
}
