"""Baut mockup/card-mockup.html: echte Karte (www/smartlists-card.js) + simuliertes Home Assistant.

Das simulierte Backend nutzt das echte Kategorie-Paket (categories.json) und bildet die Logik von
learning.py nach (gemerkt > gelernt > Paket, Verlauf, Vorschläge, Tag-Regeln).
Aufruf:  python build_mockup.py
"""

import json
from pathlib import Path

here = Path(__file__).parent
comp = here.parent / "custom_components/smartlists"
card_js = (comp / "www/smartlists-card.js").read_text(encoding="utf-8")
pack = json.loads((comp / "categories.json").read_text(encoding="utf-8"))

page = r"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartLists Karte – Mockup</title>
<style>
  :root { color-scheme: light;
    --primary-color:#03a9f4; --text-primary-color:#fff; --primary-text-color:#212121; --secondary-text-color:#727272;
    --secondary-background-color:#f1f3f4; --divider-color:#e0e0e0; --error-color:#db4437; --warning-color:#f5a623; --info-color:#7b61ff;
    --success-color:#43a047; --card-background-color:#fff; --page-bg:#e9ecef; }
  body.dark { color-scheme: dark;
    --primary-text-color:#e1e1e1; --secondary-text-color:#9b9b9b;
    --secondary-background-color:#2b2b2b; --divider-color:#3a3a3a; --card-background-color:#1c1c1c; --page-bg:#111; }
  body { margin:0; font-family:Roboto,system-ui,sans-serif; background:var(--page-bg); color:var(--primary-text-color); }
  header { display:flex; align-items:center; gap:12px; padding:14px 20px; background:var(--primary-color); color:#fff; flex-wrap:wrap; }
  header h1 { font-size:1.15rem; font-weight:500; margin:0; flex:1; }
  header button { border:1px solid #fff8; background:none; color:#fff; border-radius:8px; padding:5px 12px; cursor:pointer; font:inherit; }
  .note { padding:10px 20px; font-size:.85rem; color:var(--secondary-text-color); line-height:1.5; }
  .note code { background:var(--card-background-color); padding:1px 5px; border-radius:4px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:16px; padding:0 16px 24px; align-items:start; }
  .cap { font-size:.78rem; color:var(--secondary-text-color); margin:0 4px 6px; }
</style></head>
<body>
<header><h1>Home Assistant · Dashboard (Mockup)</h1><button id="theme">Dunkel / Hell</button></header>
<div class="note">Zum Ausprobieren: <code>2 kg äp</code> tippen (Vorschlag + Einheit), <code>Brot @re</code> (Markt-Vorschlag),
<code>Hafermilch</code> → Kategorie-Chip anklicken und ändern (wird gemerkt), leeres Feld anklicken (häufig gekauft),
Sortierung oben rechts, Einkaufswagen = Einkaufsmodus, Artikel lange drücken (oder Rechtsklick) → Menü,
Pfeil nach unten = Import (aus HA oder Text), ↶ = letzte Änderung zurück, Zahnrad → Namenskonvention und Bedienung
(Standard für alle / für mich / nur dieses Gerät). Alle Daten sind simuliert.</div>
<div class="grid" id="grid"></div>

<script>
customElements.define("ha-card", class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = `<style>:host{display:block;background:var(--card-background-color);border-radius:12px;
      box-shadow:0 1px 3px rgba(0,0,0,.18);color:var(--primary-text-color);position:relative}</style><slot></slot>`; }
});
const PACK = __PACK__;
</script>
<script>
__CARD_JS__
</script>
<script>
/* ---------- simuliertes Backend (bildet learning.py nach) ---------- */
const T = window.SmartListsText;
const norm = (s) => s.trim().toLowerCase().split(/\s+/).join(" ");
const CATS = PACK.categories.map(c => ({ id: c.id, label: `${c.emoji} ${c.name}` }));
const LABEL = Object.fromEntries(CATS.map(c => [c.id, c.label]));
const TERMS = Object.entries(PACK.terms).sort((a, b) => b[0].length - a[0].length);
const PRODUCTS = PACK.products;
const PRODUCT_BY = Object.fromEntries(PRODUCTS.map(p => [norm(p[0]), p]));
const UNIT_TERMS = PRODUCTS.filter(p => p[1]).map(p => [norm(p[0]), p[1]]).sort((a, b) => b[0].length - a[0].length);
const KNOWN = [["REWE","#CC0000"],["LIDL","#FF6F00"],["ALDI","#005DFD"],["EDEKA","#00A6FF"],["NORMA","#FF5607"],["Kaufland","#E10915"],
  ["Penny","#CD1414"],["Netto","#FFD500"],["dm","#002878"],["Rossmann","#C3002D"]].map(([value,color]) => ({value,color}));
const S = { manual: {}, learned: {}, history: {}, tagHistory: {},
  rules: [{prefix:"@",kind:"store"},{prefix:"*",kind:"person"},{prefix:"#",kind:"tag"}] };
const config = () => ({ categories: CATS, tag_rules: S.rules, tag_kinds: ["store","person","tag"], allowed_prefixes: "@*#!+~$&%^=", known_stores: KNOWN });
const parse = (txt, typed) => T.parseText(txt, S.rules, KNOWN, typed);
function resolve(name) {
  const k = norm(name);
  if (S.manual[k]) return [S.manual[k], "manual"];
  for (const [w, c] of Object.entries(S.learned).sort((a, b) => b[0].length - a[0].length)) if (k.includes(w)) return [c, "learned"];
  for (const [w, c] of TERMS) if (k.includes(w)) return [c, "pack"];
  return ["sonstiges", "fallback"];
}
function unitFor(name) {
  const k = norm(name);
  if (S.history[k] && S.history[k].unit) return S.history[k].unit;
  if (PRODUCT_BY[k]) return PRODUCT_BY[k][1] || null;
  const words = k.split(" ");
  for (const [t, u] of UNIT_TERMS) {
    if (t.includes(" ")) { if (k.includes(t)) return u; continue; }
    if (words.some(w => w.startsWith(t) && t.length >= 0.7 * w.length)) return u;
  }
  return null;
}
function record(text) {
  const p = parse(text); const k = norm(p.name); if (!k) return;
  const e = S.history[k] || { count: 0 }; Object.assign(e, { name: p.name, count: e.count + 1, last: Date.now() }); if (p.unit) e.unit = p.unit; S.history[k] = e;
  for (const t of p.tags) { const tk = `${t.kind}:${t.value.toLowerCase()}`; const x = S.tagHistory[tk] || { count: 0 };
    Object.assign(x, { kind: t.kind, value: t.value, count: x.count + 1, last: Date.now() }); S.tagHistory[tk] = x; }
}
const entry = (name, source) => { const [c, o] = resolve(name); return { name, category: c, category_label: LABEL[c], category_source: o, unit: unitFor(name), source }; };
function suggest(query, listNames, limit) {
  const open = T.openTagQuery(query, S.rules);
  if (open) {
    const p = open.partial.toLowerCase(); const found = new Map();
    Object.values(S.tagHistory).sort((a, b) => b.count - a.count).forEach(t => { if (t.kind === open.kind && t.value.toLowerCase().startsWith(p)) found.set(t.value.toLowerCase(), { value: t.value, source: "history" }); });
    if (open.kind === "store") KNOWN.forEach(s => { if (s.value.toLowerCase().startsWith(p) && !found.has(s.value.toLowerCase())) found.set(s.value.toLowerCase(), { value: s.value, source: "known" }); });
    return { mode: "tag", suggestions: [...found.values()].slice(0, limit).map(e => {
      const k = KNOWN.find(s => s.value.toLowerCase() === e.value.toLowerCase());
      return { ...e, kind: open.kind, label: open.kind === "store" && k ? k.value : e.value, color: open.kind === "store" && k ? k.color : null }; }) };
  }
  const q = norm(parse(query, true).name);
  if (!q) {
    const present = new Set(listNames.map(n => norm(parse(n).name)));
    return { mode: "frequent", suggestions: Object.entries(S.history).filter(([k, e]) => !present.has(k) && e.count >= 2)
      .sort((a, b) => b[1].count - a[1].count).slice(0, limit).map(([, e]) => entry(e.name, "history")) };
  }
  const scores = new Map();
  const consider = (name, ps, cs, src) => { const k = norm(name); if (!k || k === q) return;
    const sc = k.startsWith(q) ? ps : k.includes(q) ? cs : -1; if (sc < 0) return;
    if (sc > (scores.get(k) || [-1])[0]) scores.set(k, [sc, name.trim(), src]); };
  Object.values(S.history).forEach(e => consider(e.name, 10000 + e.count, 1000 + e.count, "history"));
  listNames.forEach(n => consider(parse(n).name, 50, 10, "list"));
  if (q.length >= 2) PRODUCTS.forEach(p => consider(p[0], 5, 1, "pack"));
  return { mode: "name", suggestions: [...scores.values()].sort((a, b) => b[0] - a[0] || a[1].localeCompare(b[1])).slice(0, limit).map(([, n, s]) => entry(n, s)) };
}

/* Listen */
let uid = 100;
const full = { toggle: true, rename: true, delete: true, add: true, note: true };
const mk = (text, o = {}) => ({ uid: "u" + (uid++), text, checked: false, note: "", ...o });
const LISTS = {
  "todo.einkauf_familie": { name: "Einkauf Familie", type: "list", foreign: false, permissions: full, items: [
    mk("Äpfel 1,5 kg @REWE", { note: "Elstar wenn möglich" }), mk("Bananen 6 Stk"), mk("Vollmilch 2 l @LIDL"), mk("Joghurt Natur 4× 150 g"),
    mk("Bauernbrot @Bäcker"), mk("Hackfleisch gemischt 500 g @REWE *Max"), mk("Spülmittel #nachfüllen", { note: "das grüne" }),
    mk("Bio-Vollkorn-Dinkelspaghetti aus regionalem Anbau extra lang 2 Pck @EDEKA"), mk("Süßkartoffel 1 kg"), mk("Toilettenpapier 1 Pck @dm"),
    mk("Mineralwasser 6 Fl", { checked: true }), mk("Nudeln 2 Pck", { checked: true })] },
  "todo.grosseinkauf": { name: "Großeinkauf", type: "combined", foreign: true, source_lists: ["Anna", "Max"], permissions: full, items: [
    mk("Tomaten 1 kg @Lidl"), mk("Käse", { note: "Gouda, mittelalt" }), mk("Zahnpasta @dm"), mk("Cola 3 Fl"), mk("Pizza Salami 2 Stk"),
    mk("Reis", { checked: true })].map((it, i) => ({ ...it, source: ["Anna", "Max", "Anna", "Max", "Max", "Anna"][i],
      permissions: i % 2 === 0 ? { toggle: true, rename: true, delete: true } : { toggle: true, rename: false, delete: false } })) },
  "todo.oma": { name: "Liste von Oma", type: "list", foreign: true, permissions: { toggle: false, rename: false, delete: false, add: false }, items: [
    mk("Kartoffeln 5 kg"), mk("Eier 10 Stk"), mk("Schokolade", { note: "Vollmilch" })] },
};
// Verlauf vorbelegen, damit "häufig gekauft" und Vorschläge etwas zeigen
["Milch 1 l @REWE","Milch 2 l","Milch 1 l","Brötchen 6 Stk","Brötchen 4 Stk","Butter","Butter","Kaffee 1 Pck @ALDI","Kaffee 1 Pck","Eier 10 Stk","Eier 6 Stk",
 "Gurke","Gurke","Äpfel 1 kg @REWE","Äpfel 2 kg","Bananen 6 Stk","Bananen 5 Stk","Zahnpasta @dm","Zahnpasta"].forEach(record);

const rev = {};
const USER = { id: "u-julia", name: "Julia", is_admin: true };
const USERS = {};
let HOUSE = {};  // Haushalts-Standard (Admin)
// Eine ganz normale HA-To-do-Liste (z.B. "Einkaufsliste"-Integration) – nur zum Importieren
const HA_PLAIN = { "todo.shopping_list": { name: "Einkaufsliste (HA)", items: [
  { uid: "h1", summary: "Milch", status: "needs_action" }, { uid: "h2", summary: "Kaffee 500 g", status: "needs_action" },
  { uid: "h3", summary: "Bananen", status: "needs_action" }, { uid: "h4", summary: "Klopapier", status: "completed" },
  { uid: "h5", summary: "Geschenkpapier", status: "needs_action", description: "für Omas Geburtstag" }] } };  // Bedien-Einstellungen pro HA-Benutzer (simuliert .storage/smartlists.learning → users)
const view = (e) => { const L = LISTS[e]; return { entity_id: e, name: L.name, type: L.type, foreign: L.foreign, source_lists: L.source_lists,
  permissions: L.permissions, categories: CATS,
  items: L.items.map(i => { const p = parse(i.text); const [c, o] = resolve(p.name);
    return { ...i, ...p, category: c, category_source: o, permissions: i.permissions || { toggle: L.permissions.toggle, rename: L.permissions.rename, delete: L.permissions.delete } }; }) }; };
async function callWS(msg) {
  await new Promise(r => setTimeout(r, 40));
  if (msg.type === "todo/item/list") {  // eingebauter HA-Befehl
    if (HA_PLAIN[msg.entity_id]) return { items: HA_PLAIN[msg.entity_id].items };
    const X = LISTS[msg.entity_id];
    return { items: X.items.map(i => ({ uid: i.uid, summary: i.text, description: i.note, status: i.checked ? "completed" : "needs_action" })) };
  }
  const op = msg.type.split("/")[1];
  const L = LISTS[msg.entity_id];
  const deny = () => { throw new Error("Für diese Liste nicht erlaubt."); };
  let result = {};
  switch (op) {
    case "config": return config();
    case "suggest": return suggest(msg.query, L ? L.items.map(i => i.text) : [], msg.limit || 8);
    case "describe": return { items: msg.texts.map(t => { const p = parse(t); const [c, o] = resolve(p.name); return { ...p, category: c, category_source: o, unit_hint: unitFor(p.name) }; }) };
    case "set_category": { const n = parse(msg.name).name; const k = norm(n);
      if (msg.category) { S.manual[k] = msg.category; S.learned[k] = msg.category; } else delete S.manual[k];
      bump(); return {}; }
    case "learned": return { learned: Object.entries(S.learned).sort().map(([w, c]) => ({ word: w, category: c, label: LABEL[c], manual: !!S.manual[w] })) };
    case "forget": delete S.learned[norm(msg.word)]; delete S.manual[norm(msg.word)]; bump(); return callWS({ type: "smartlists/learned" });
    case "set_tag_rules": {
      const seen = new Set();
      for (const r of msg.rules) { if (r.prefix.length !== 1 || !"@*#!+~$&%^=".includes(r.prefix)) throw new Error(`Ungültiges Zeichen '${r.prefix}' – erlaubt: @ * # ! + ~ $ & % ^ =`);
        if (seen.has(r.prefix)) throw new Error(`Zeichen '${r.prefix}' ist doppelt vergeben`); seen.add(r.prefix); }
      S.rules = msg.rules.map(r => ({ ...r })); bump(); return config(); }
    case "get_list": return view(msg.entity_id);
    case "user_settings": return { defaults: { ...HOUSE }, settings: { ...(USERS[USER.id] || {}) } };
    case "set_user_settings":
      if (msg.scope === "household") { if (!USER.is_admin) throw new Error("Nur Administratoren können den Standard ändern."); HOUSE = { ...msg.settings }; }
      else USERS[USER.id] = { ...msg.settings };
      return { defaults: { ...HOUSE }, settings: { ...(USERS[USER.id] || {}) } };
    case "add_item": { if (!L.permissions.add) deny(); const it = mk(msg.text, { note: msg.note || "", checked: !!msg.checked });
      L.items.push(it); record(msg.text); result = { uid: it.uid }; break; }
    case "update_item": { const it = L.items.find(i => i.uid === msg.uid); const ip = it.permissions || L.permissions;
      if ("checked" in msg) { if (!ip.toggle) deny(); it.checked = msg.checked; }
      if ("text" in msg) { if (!ip.rename) deny(); it.text = msg.text; it.note = msg.note || ""; } break; }
    case "lists": return { lists: Object.entries(LISTS).map(([e, x]) => ({ entity_id: e, name: x.name, type: x.type, can_add: x.permissions.add })) };
    case "move_item": { const it = L.items.find(i => i.uid === msg.uid); const target = LISTS[msg.target];
      if (!target || !target.permissions.add) deny();
      if (!msg.copy) { if (!(it.permissions || L.permissions).delete) deny(); L.items = L.items.filter(i => i !== it); }
      const n = mk(it.text, { note: it.note }); target.items.push(n); result = { uid: n.uid }; rev[msg.target] = (rev[msg.target] || 0) + 1; break; }
    case "remove_items": L.items = L.items.filter(i => !msg.uids.includes(i.uid)); break;
    case "clear_completed": L.items = L.items.filter(i => !i.checked); break;
    default: throw new Error("unbekannt: " + msg.type);
  }
  rev[msg.entity_id] = (rev[msg.entity_id] || 0) + 1; push(); return result;
}
function bump() { for (const e in LISTS) rev[e] = (rev[e] || 0) + 1; push(); }
function states() { const s = {};
  for (const e in LISTS) s[e] = { state: String(LISTS[e].items.filter(i => !i.checked).length), last_updated: "r" + (rev[e] || 0), attributes: { friendly_name: LISTS[e].name } };
  for (const e in HA_PLAIN) s[e] = { state: "4", last_updated: "x", attributes: { friendly_name: HA_PLAIN[e].name } };
  return s; }
const cards = [];
function push() { const hass = { states: states(), language: "de", user: USER, callWS }; cards.forEach(c => c.hass = hass); }

const grid = document.getElementById("grid");
[["todo.einkauf_familie", "Eigene Liste – nach Kategorie, Markt-Badges, gemerkte Einheiten", {}],
 ["todo.grosseinkauf", "Kombinierte Liste – A–Z, Artikel von Max sind nur abhakbar", { sort: "alpha" }],
 ["todo.oma", "Fremde Liste ohne Rechte – nur ansehen", { show_settings: false }]].forEach(([entity, cap, cfg]) => {
  const wrap = document.createElement("div"); const c = document.createElement("div"); c.className = "cap"; c.textContent = cap;
  const card = document.createElement("smartlists-card"); card.setConfig({ entity, ...cfg }); wrap.append(c, card); grid.append(wrap); cards.push(card);
});
push();
document.getElementById("theme").onclick = () => document.body.classList.toggle("dark");
</script>
</body></html>
"""
out = here / "card-mockup.html"
out.write_text(
    page.replace("__PACK__", json.dumps(pack, ensure_ascii=False, separators=(",", ":"))).replace("__CARD_JS__", card_js),
    encoding="utf-8",
)
print("geschrieben:", out)
