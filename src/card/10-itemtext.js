function tagRegex(rules) {
  if (!rules || !rules.length) return null;
  const chars = rules.map((r) => escRe(r.prefix)).join("");
  return new RegExp(`(^|\\s)([${chars}])([\\p{L}\\p{N}_][\\p{L}\\p{N}_.\\-]*)`, "gu");
}
function storeInfo(value, stores) {
  const s = (stores || []).find((k) => k.value.toLowerCase() === value.toLowerCase());
  return s ? { label: s.value, color: s.color } : { label: value, color: null };
}
function splitTags(text, rules, stores) {
  const re = tagRegex(rules);
  if (!re) return [text.trim(), []];
  const kinds = Object.fromEntries(rules.map((r) => [r.prefix, r.kind]));
  const tags = [];
  const seen = new Set();
  for (const m of text.matchAll(re)) {
    const kind = kinds[m[2]];
    const value = m[3].replace(/[.\-]+$/, "");
    const key = `${kind}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const info = kind === "store" ? storeInfo(value, stores) : { label: value, color: null };
    tags.push({ kind, value, prefix: m[2], ...info });
  }
  return [text.replace(re, " ").split(/\s+/).filter(Boolean).join(" "), tags];
}
// Preis im Text (wie extras.split_price): "Milch 2 l 1,19€ @REWE" → ["Milch 2 l @REWE", 1.19]
// Die Schreibweisen richten sich nach der Währung des Haushalts ("CHF 2.50", "2,50 Fr.", "£1.20").
const PRICE_RES = {};
const priceRe = () => {
  const code = slCurrency() + "|" + slSymbols().join("|");
  if (!PRICE_RES[code]) {
    const sym = [...slSymbols()].sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const n = "\\d+(?:[.,]\\d{1,2})?";
    PRICE_RES[code] = new RegExp(`(^|\\s)(?:(?:${sym})\\s?(${n})|(${n})\\s?(?:${sym}))(?=\\s|$)`, "gi");
  }
  return PRICE_RES[code];
};
function splitPrice(text) {
  let last = null;
  for (const m of String(text).matchAll(priceRe())) last = m;
  if (!last) return [text, null];
  const start = last.index + last[1].length, end = last.index + last[0].length;
  return [(text.slice(0, start) + " " + text.slice(end)).split(/\s+/).filter(Boolean).join(" "), Number((last[2] || last[3]).replace(",", "."))];
}
/* ---------------- Offline-Einkauf ----------------
 * Im Laden ohne Netz: Liste aus dem Zwischenspeicher zeigen, Abhaken/Hinzufügen/Ändern/Löschen lokal sammeln und
 * beim Wiederverbinden der Reihe nach übertragen. Geht, solange die Seite offen ist; gesammelte Änderungen bleiben
 * auch über ein Neuladen erhalten und werden beim nächsten Öffnen mit Verbindung gesendet. */
const OFFLINE_TYPES = new Set(["add_item", "update_item", "remove_items"]);
const isConnErr = (e) => !!e && (e.code === 3 || /connection lost|not connected|socket/i.test(String((e && e.message) || e)));
const offSnapKey = (e) => `smartlists-offline:${e}`;
const offQueueKey = (e) => `smartlists-queue:${e}`;
// offline angelegte Artikel → echte uid (über einen abgebrochenen Abgleich hinweg) und die Sperre je Liste, damit
// zwei Karten derselben Liste (oder zwei Tabs) die Warteschlange nicht gleichzeitig senden
const offIdsKey = (e) => `smartlists-queue-ids:${e}`;
const offLockKey = (e) => `smartlists-flush:${e}`;
const OFF_LOCK_MS = 20000;
// Kennung je Änderung: Home Assistant merkt sich verarbeitete Kennungen und führt eine Wiederholung nicht doppelt aus
const offOpId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
function offLoad(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
function offSave(key, value) { try { if (value == null || (Array.isArray(value) && !value.length)) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* voll */ } }

/* Sprache der SmartLists-Oberfläche: eigene Wahl (Für mich → Sprache, auf dem Gerät gemerkt) oder die von Home Assistant */
const SL_LANGS = ["de", "en", "fr", "es", "it", "pl"];
function slLang(hass) {
  try { const v = localStorage.getItem("smartlists-ui-lang"); if (v && SL_LANGS.includes(v)) return v; } catch (e) { /* */ }
  const l = ((hass && hass.language) || "en").slice(0, 2);
  return SL_LANGS.includes(l) ? l : "en";
}

// "2x" als eigenes Wort ist die Anzahl – egal wo es steht ("Milch 2l 2x"); in Anführungszeichen ("2x") bleibt es Text
const RE_COUNT_WORD = /(?:^|(?<=\s))([0-9]{1,3})[×xX](?=\s|$)/;
function parseText(text, rules, stores, typed = false) {
  const [rest, tags] = splitTags(text || "", rules, stores);
  const c = rest.match(RE_COUNT_WORD);
  const without = c ? (rest.slice(0, c.index) + " " + rest.slice(c.index + c[0].length)).split(/\s+/).filter(Boolean).join(" ") : "";
  if (without) {
    const item = parseRest(without, tags, typed);
    if (item.quantity == null) { item.quantity = +c[1]; return item; }
    if (item.pack_count == null) { item.pack_count = +c[1]; return item; }
  }
  return parseRest(rest, tags, typed);
}
function parseRest(rest, tags, typed) {
  let m;
  if ((m = rest.match(RE_SUFFIX_UNIT))) return { name: m[1].trim(), quantity: num(m[3]), unit: m[4], pack_count: m[2] ? +m[2] : null, tags };
  if ((m = rest.match(RE_SUFFIX_GLUED))) return { name: m[1].trim(), quantity: num(m[3]), unit: m[4].toLowerCase(), pack_count: m[2] ? +m[2] : null, tags };
  if ((m = rest.match(RE_SUFFIX_ONLY))) return { name: m[1].trim(), quantity: num(m[3]), unit: null, pack_count: m[2] ? +m[2] : null, tags };
  if (typed && (m = rest.match(RE_PREFIX_QTY))) {
    let [, q, unit, name] = m;
    name = name.trim();
    if (unit && !UNIT_WORDS.has(unit.replace(/\.$/, "").toLowerCase())) { name = `${unit} ${name}`.trim(); unit = null; }
    if (name) return { name, quantity: num(q), unit: unit ? unit.replace(/\.$/, "") : null, pack_count: null, tags };
  }
  return { name: rest, quantity: null, unit: null, pack_count: null, tags };
}
function encodeText(item, rules) {
  const parts = [item.name.trim()];
  if (item.quantity != null && !Number.isNaN(item.quantity)) {
    if (item.pack_count > 1) parts.push(`${item.pack_count}×`);
    parts.push(fmtQty(item.quantity));
    if (item.unit) parts.push(item.unit.trim());
  }
  const pre = Object.fromEntries((rules || []).map((r) => [r.kind, r.prefix]));
  for (const t of item.tags || []) {
    const p = pre[t.kind] || t.prefix;
    const v = String(t.value || "").trim().replace(/\s+/g, "-");
    if (p && v) parts.push(p + v);
  }
  return parts.filter(Boolean).join(" ");
}
function openTagQuery(text, rules) {
  if (!text || /\s$/.test(text)) return null;
  const last = text.split(/\s+/).pop() || "";
  const r = (rules || []).find((x) => last.startsWith(x.prefix));
  return r ? { kind: r.kind, partial: last.slice(1) } : null;
}
// Eingefügten Text in Zeilen zerlegen: Aufzählungen, Checkboxen und Nummern entfernen.
// "* Milch" ist eine Aufzählung (Leerzeichen danach), "*Anna" dagegen ein Tag.
function parseImportText(text) {
  const out = [];
  for (let line of String(text || "").split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    let checked = false;
    line = line.replace(/^(?:[-*•·–—+]|\d+[.)])\s+/, "");
    const box = line.match(/^(?:\[( |x|X)\]|([☐☑☒✓✔]))\s*/);
    if (box) { checked = box[1] ? box[1].toLowerCase() === "x" : box[2] !== "☐"; line = line.slice(box[0].length); }
    line = line.trim();
    if (line) out.push({ text: line, checked });
  }
  return out;
}
