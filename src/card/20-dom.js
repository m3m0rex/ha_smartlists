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

