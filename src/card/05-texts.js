// Texte der Oberfläche: je Sprache eine Datei in src/lang/card/<sprache>.json (de.json ist die Vorlage).
// scripts/build_card.py setzt sie hier ein; fehlende Einträge einer Sprache kommen aus en.json.
/*__TEXTS__*/

/* ------------------------------------------------------------------ */
/* Artikeltext – gleiche Regeln wie itemtext.py in der Integration     */
/* ------------------------------------------------------------------ */
const NUM = "[0-9]+(?:[.,][0-9]+)?";
const UNIT = "[a-zA-Z\\u00C0-\\u024F%°]+\\.?";
const RE_SUFFIX_UNIT = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})\\s+(${UNIT})$`);
// Maßeinheit direkt an der Zahl: "Milch 1l", "Kartoffeln 2,5kg" (gleiche Regel in itemtext.py)
const RE_SUFFIX_GLUED = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})(kg|gr|mg|g|ml|cl|l)$`, "i");
const RE_SUFFIX_ONLY = new RegExp(`^(.+?)\\s+(?:([0-9]+)[×xX]\\s+)?(${NUM})$`);
const RE_PREFIX_QTY = new RegExp(`^(${NUM})\\s*(?:(${UNIT})\\s+)?(.+)$`);
const UNIT_WORDS = new Set(("stk stück st kg g gr l ml cl pck pk packung packungen fl flasche flaschen dose dosen becher " +
  "glas gläser tube bund netz beutel tüte kiste kasten rolle rollen scheiben pkg x " +
  // weitere Sprachen (gleiche Liste in itemtext.py)
  "pcs pc piece pieces pack packs bottle bottles can cans jar jars box boxes bag bags roll rolls tin tins bunch slices dozen pièce pièces paquet paquets bouteille bouteilles boîte boîtes sachet sachets rouleau rouleaux tranches ud uds unidad unidades paquete paquetes botella botellas lata latas bolsa bolsas caja cajas bote botes rollo rollos pz pezzo pezzi confezione confezioni bottiglia bottiglie lattina lattine scatola scatole busta buste vasetto rotolo rotoli szt sztuka sztuki opak opakowanie butelka butelki puszka puszki paczka paczki słoik słoiki rolka rolki").split(" "));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const num = (s) => Number(String(s).replace(",", "."));
const fmtQty = (q) => (Number.isInteger(q) ? String(q) : String(q).replace(".", ","));

