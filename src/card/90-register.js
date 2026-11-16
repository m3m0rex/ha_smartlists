/* Registrieren. Ist schon eine ÄLTERE Fassung geladen (z.B. eine alte Kopie als Dashboard-Ressource
 * oder über HACS als „Dashboard“), lässt sich das Element nicht neu definieren – dann werden die
 * Methoden der vorhandenen Klasse durch die neuen ersetzt, damit überall die aktuelle Karte läuft. */
function semverNewer(a, b) {
  const pa = String(a || "0").split("."), pb = String(b || "0").split(".");
  for (let i = 0; i < 3; i++) { const d = (Number(pa[i]) || 0) - (Number(pb[i]) || 0); if (d) return d > 0; }
  return false;
}
function defineOrUpgrade(tag, cls) {
  const existing = customElements.get(tag);
  if (!existing) { customElements.define(tag, cls); return "neu"; }
  if (existing === cls || !semverNewer(CARD_VERSION, existing.__smartlistsVersion)) return "vorhanden";
  for (const target of [existing.prototype, existing]) {
    const source = target === existing ? cls : cls.prototype;
    for (const name of Object.getOwnPropertyNames(source)) {
      if (["prototype", "length", "name", "constructor"].includes(name)) continue;
      Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
    }
  }
  existing.__smartlistsVersion = CARD_VERSION;
  return "ersetzt";
}
for (const c of [SmartListsCard, SmartListsCardEditor, SmartListsPanel]) c.__smartlistsVersion = CARD_VERSION;
const _slResult = defineOrUpgrade("smartlists-card", SmartListsCard);
defineOrUpgrade("smartlists-card-editor", SmartListsCardEditor);
defineOrUpgrade("smartlists-panel", SmartListsPanel);
if (_slResult !== "vorhanden" || !(window.customCards || []).some((c) => c.type === "smartlists-card")) {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "smartlists-card")) {
    window.customCards.push({
      type: "smartlists-card",
      name: "SmartLists",
      description: (TEXTS[String((document.documentElement && document.documentElement.lang) || navigator.language || "en").slice(0, 2)] || TEXTS.en).card_desc,
      preview: false,
    });
  }
}
if (_slResult.startsWith("ersetzt")) {
  console.warn(`SmartLists: eine ältere Karten-Datei war schon geladen und wurde durch ${CARD_VERSION} ersetzt. `
    + "Bitte die alte Dashboard-Ressource bzw. den HACS-Eintrag vom Typ „Dashboard“ entfernen.");
}
console.info(`%c SmartLists %c ${CARD_VERSION} `, "background:#1747B5;color:#fff;border-radius:3px 0 0 3px", "background:#3E7BFA;color:#fff;border-radius:0 3px 3px 0");


