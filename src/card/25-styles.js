const STYLE = `
  /* Anpassbar per Theme oder card-mod: --smartlists-accent, --smartlists-radius, --smartlists-row-height */
  :host { display:block; --sl-accent: var(--smartlists-accent, var(--primary-color)); }
  ha-card { border-radius: var(--smartlists-radius, var(--ha-card-border-radius, 12px)); }
  [hidden] { display:none !important; }
  ha-card { overflow:visible; position:relative; }
  .head { display:flex; align-items:center; gap:4px 8px; padding:16px 12px 8px 16px; flex-wrap:wrap; }
  .title { font-size:1.25rem; font-weight:500; flex:1 1 120px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* schmale Karten (Handy, mehrere Spalten): Knöpfe brechen in eine zweite Zeile um statt die Karte zu verbreitern */
  .head .sort select { max-width:110px; }
  ha-card { max-width:100%; }
  .badge { font-size:.7rem; padding:2px 8px; border-radius:10px; background:var(--sl-accent); color:var(--text-primary-color,#fff); white-space:nowrap; }
  .badge.foreign { background:var(--warning-color,#f5a623); }
  .badge.own { background:var(--secondary-background-color,#eee); color:var(--primary-text-color); }
  button.badge { border:none; font:inherit; font-size:.7rem; cursor:pointer; line-height:inherit; }
  button.badge:hover { filter:brightness(1.1); }
  .badge.combined { background:var(--info-color,#2196f3); }
  /* schmale Karte (Handy): „Kombiniert“ / „privat“ / „geteilt“ nur als Symbol, der Text steht im Tooltip */
  .head { container-type:inline-size; }
  .badge .bi { display:none; } .badge .bi.on { display:inline; }
  @container (max-width: 480px) {
    .head .badge .bt { display:none; } .head .badge .bi { display:inline; }
    .head .badge.combined, .head .badge.own { padding:2px 6px; }
    /* Titel bekommt die ganze erste Zeile, alle Symbole stehen in EINER Zeile darunter (Knöpfe rechts) */
    .head .title { flex:1 1 100%; }
    .head .count { margin-right:auto; }
  }
  .head .grow { flex:1 1 0; }
  .pubhelp summary { cursor:pointer; color:var(--sl-accent); font-size:.85rem; padding:4px 0; }
  .pubsteps { margin:4px 0 8px; padding-left:20px; line-height:1.5; } .pubsteps li { margin:2px 0; }
  .badge.offline { background:color-mix(in srgb, var(--warning-color,#ff9800) 25%, transparent); color:var(--warning-color,#ff9800); font-weight:600; }
  .badge.public { background:color-mix(in srgb, var(--warning-color,#ff9800) 22%, transparent); color:var(--warning-color,#ff9800); font-weight:600; }
  .count { color:var(--secondary-text-color); font-size:.85rem; white-space:nowrap; }
  .sort { display:flex; align-items:center; gap:2px; color:var(--secondary-text-color); }
  .sort select { background:none; border:none; padding:4px 2px; font-size:.85rem; color:var(--secondary-text-color); cursor:pointer; }

  .add { position:relative; padding:4px 16px 10px; }
  .add-row { display:flex; gap:6px; }
  input, select { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color,#f2f2f2);
    border:1px solid transparent; border-radius:8px; padding:9px 11px; min-width:0; box-sizing:border-box; }
  input:focus, select:focus { outline:none; border-color:var(--sl-accent); }
  .add .smart { flex:1; min-width:0; }
  .go { border:none; border-radius:8px; background:var(--sl-accent); color:var(--text-primary-color,#fff);
    padding:0 14px; cursor:pointer; display:flex; align-items:center; }
  .go:disabled { opacity:.45; cursor:default; }
  /* Strichcode-Knopf: gleiche Größe und Form wie „+“, aber neutral – „+“ bleibt die Hauptaktion */
  .add-row .scanbtn { width:auto; height:auto; min-width:46px; padding:0 12px; border-radius:8px; background:var(--secondary-background-color,#f2f2f2); color:var(--primary-text-color); }
  .add-row .scanbtn svg { width:22px; height:22px; }
  .preview { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-height:24px; margin-top:6px; font-size:.82rem; color:var(--secondary-text-color); }
  .preview:empty { display:none; }
  .catchip { display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--divider-color,#ccc); background:none; border-radius:12px;
    padding:2px 9px; font:inherit; font-size:.8rem; color:var(--primary-text-color); cursor:pointer; }
  .catchip:hover { border-color:var(--sl-accent); }
  .catchip .src { color:var(--secondary-text-color); font-size:.72rem; }
  .catchip.manual { border-style:solid; border-color:var(--sl-accent); }
  .hint { font-size:.75rem; color:var(--secondary-text-color); }
  .catpick { position:absolute; z-index:6; left:16px; right:16px; top:calc(100% - 6px); background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:6px; display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:2px; }
  .catpick button { text-align:left; border:none; background:none; border-radius:6px; padding:7px 8px; font:inherit; font-size:.85rem; cursor:pointer; color:var(--primary-text-color); }
  .catpick button:hover, .catpick button.sel { background:var(--secondary-background-color,#eee); }
  .catpick button.auto { grid-column:1/-1; color:var(--secondary-text-color); }

  .sugg { position:absolute; z-index:5; left:16px; right:16px; top:52px; background:var(--card-background-color,#fff);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.2); padding:4px 0; margin:0; list-style:none; max-height:320px; overflow:auto; }
  .sugg li { display:flex; align-items:center; gap:10px; padding:8px 12px; cursor:pointer; }
  .sugg li:hover { background:var(--secondary-background-color,#eee); }
  .sugg li.active { background:color-mix(in srgb, var(--sl-accent) 22%, transparent); box-shadow:inset 3px 0 0 var(--sl-accent); }
  .sugg .e { width:22px; text-align:center; }
  .editwrap { position:relative; flex:1 1 100%; min-width:0; display:flex; }
  .editwrap > input { flex:1; min-width:0; }
  .sugg.editsugg { left:0; right:0; top:calc(100% + 4px); }
  .sugg .n { flex:1; min-width:0; }
  .sugg .n b { font-weight:600; }
  .sugg .u { font-size:.75rem; color:var(--secondary-text-color); }
  .sugg .s { color:var(--secondary-text-color); opacity:.7; display:flex; }
  .sugg .in { font-size:.72rem; color:var(--secondary-text-color); font-style:italic; }

  .frequent { display:flex; gap:6px; overflow-x:auto; padding:2px 16px 10px; scrollbar-width:none; }
  .frequent .lbl { font-size:.75rem; color:var(--secondary-text-color); align-self:center; white-space:nowrap; }
  .fchip { border:1px solid var(--divider-color,#ddd); background:none; border-radius:16px; padding:4px 10px; font:inherit; font-size:.82rem;
    white-space:nowrap; cursor:pointer; color:var(--primary-text-color); }
  .fchip:hover { border-color:var(--sl-accent); color:var(--sl-accent); }
  .fchip.fedit { color:var(--secondary-text-color); padding:4px 8px; }
  .fchip.del { border-style:dashed; } .fchip.del:hover, .fchip.warn { color:var(--error-color,#db4437); border-color:var(--error-color,#db4437); }

  .locked { display:flex; align-items:center; gap:8px; padding:4px 16px 12px; color:var(--secondary-text-color); font-size:.85rem; }
  .group { padding:2px 0; }
  .group-title { padding:8px 16px 2px; font-size:.78rem; font-weight:600; letter-spacing:.03em; color:var(--secondary-text-color); text-transform:uppercase; }
  /* Feste Spalten, damit Menge und Einheit in allen Zeilen untereinander stehen:
     Haken | (Emoji) | Name + Badges | Menge | Einheit | Aktionen */
  /* Alle Zeilen eines Abschnitts teilen sich EIN Raster: jede Spalte ist so breit wie ihr längster
     Eintrag, dazwischen überall derselbe Abstand (--gap) – wie zwischen Menge/Einheit und Stift/Papierkorb. */
  .items { --gap:10px; display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; column-gap:var(--gap); }
  .items.emoji { grid-template-columns:auto auto minmax(0,1fr) auto auto; }
  .items > .full { grid-column:1 / -1; }
  .row { display:grid; grid-template-columns:subgrid; grid-column:1 / -1; align-items:center;
    padding:6px 8px 6px 16px; min-height:40px; }
  @supports not (grid-template-columns: subgrid) {
    .row { grid-template-columns:22px minmax(0,1fr) 62px 64px; column-gap:var(--gap); }
    .items.emoji .row { grid-template-columns:22px 20px minmax(0,1fr) 62px 64px; }
  }
  .qtycol { text-align:right; font-variant-numeric:tabular-nums; font-weight:600; color:var(--sl-accent); white-space:nowrap; font-size:.9rem; }
  .unitcol { text-align:left; color:var(--secondary-text-color); white-space:nowrap; font-size:.85rem; }
  .row.checked .qtycol { color:var(--secondary-text-color); font-weight:400; }
  /* 4.0: Anzahl und Größe fest markiert. Anpassbar: --smartlists-qty-color */
  .qpill, .sizechip { --q: var(--smartlists-qty-color, #e39a1c); color:var(--q); font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; font-size:.86rem; border-radius:8px; }
  .qpill { background:color-mix(in srgb, var(--q) 18%, transparent); padding:0 7px; }
  .sizechip { border:1.5px solid color-mix(in srgb, var(--q) 70%, transparent); padding:0 6px; line-height:1.35; }
  .row.checked .qpill, .row.checked .sizechip { color:var(--secondary-text-color); border-color:var(--divider-color,#ddd); background:none; }
  .subline { display:flex; flex-wrap:wrap; align-items:center; gap:4px 6px; margin-top:3px; }
  .subline .note { margin:0; }
  .stepcol { display:flex; justify-content:flex-end; }
  .expbox { margin:4px 10px 8px; padding:10px 12px; border-radius:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;
    background:color-mix(in srgb, var(--warning-color,#ff9800) 14%, transparent); border:1px solid color-mix(in srgb, var(--warning-color,#ff9800) 40%, transparent); }
  .expbox .et { flex:1 1 200px; min-width:0; } .expbox .et small { display:block; color:var(--secondary-text-color); font-size:.76rem; }
  .expbox .eb { display:flex; gap:6px; margin-left:auto; } .expbox .btn2 { height:32px; }
  .kv { display:grid; grid-template-columns:auto 1fr; gap:4px 16px; font-size:.9rem; } .kv span { color:var(--secondary-text-color); }
  /* Kategorie als getönter Balken */
  .group-title.bar { --cc: var(--secondary-text-color); display:flex; align-items:center; gap:8px; margin:8px 10px 2px; padding:6px 10px; border-radius:10px;
    background:color-mix(in srgb, var(--cc) 16%, transparent); color:var(--cc); font-size:.9rem; font-weight:700; text-transform:none; letter-spacing:0; }
  button.group-title.bar { border:none; font:inherit; font-size:.9rem; font-weight:700; cursor:pointer; text-align:left; width:calc(100% - 20px); box-sizing:border-box; }
  .group-title.bar .grow { flex:1; } .group-title.bar .chev { transition:transform .15s; opacity:.8; }
  .group-title.bar.closed .chev { transform:rotate(-90deg); }
  .fchip.flbl { display:inline-flex; align-items:center; gap:2px; border-color:transparent; color:var(--secondary-text-color); padding-left:2px; font-size:.75rem; }
  .fchip.flbl .chev { transition:transform .15s; } .fchip.flbl.closed .chev { transform:rotate(-90deg); }
  .dealhint { border:none; font:inherit; font-size:.72rem; font-weight:700; background:#f2b705; color:#1a1a1a; border-radius:9px; padding:1px 8px; cursor:pointer; white-space:nowrap; }
  .group-title.bar small { color:var(--secondary-text-color); font-weight:400; font-size:.78rem; }
  /* schmale Karte: Stift/Papierkorb ausblenden – Bearbeiten über die Geste (Einstellungen → Bedienung) */
  .listwrap { container-type:inline-size; }
  @container (max-width: 480px) { .listwrap .row:not(.edit) .actions .icon-btn { display:none; } }
  /* Mengen-Stepper − 2 + (wie in der App) */
  .stepper { display:inline-flex; align-items:center; justify-content:flex-end; border:1px solid var(--divider-color,#ddd); border-radius:16px; }
  .stepper .sbtn { border:none !important; }
  .stepper .sbtn { width:24px; height:24px; border-radius:50%; border:1px solid var(--divider-color,#ddd); background:none; padding:0;
    display:inline-flex; align-items:center; justify-content:center; color:var(--secondary-text-color); cursor:pointer; flex:none; }
  .stepper .sbtn:hover { border-color:var(--sl-accent); color:var(--sl-accent); }
  .stepper .sval { min-width:1.6em; text-align:center; }
  .shopping .row.large .stepper .sbtn { width:30px; height:30px; }
  .row:hover { background:var(--secondary-background-color,#f6f6f6); }
  .box { flex:none; width:22px; height:22px; border-radius:50%; border:2px solid var(--secondary-text-color); background:none;
    padding:0; cursor:pointer; display:flex; align-items:center; justify-content:center; color:transparent; }
  .box.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .box:disabled { opacity:.45; cursor:not-allowed; }
  .main { flex:1; min-width:0; }
  .name-line { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-width:0; }
  /* Lange Namen hart umbrechen statt die Spalten zu verschieben */
  .iname { overflow-wrap:anywhere; hyphens:auto; min-width:0; }
  .row.checked .iname { text-decoration:line-through; color:var(--secondary-text-color); }
  .row.checked .tag { opacity:.55; }
  .chip { font-size:.72rem; padding:1px 7px; border-radius:9px; background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); white-space:nowrap; }
  button.chip { border:0; cursor:pointer; font:inherit; font-size:.8rem; padding:4px 10px; border-radius:999px; }
  .chip.qty { background:color-mix(in srgb, var(--sl-accent) 14%, transparent); color:var(--sl-accent); font-weight:600; }
  .tag { font-size:.7rem; font-weight:700; padding:1px 7px; border-radius:4px; white-space:nowrap; letter-spacing:.02em; }
  .tag.store { color:#fff; }
  .tag.person { background:color-mix(in srgb, var(--info-color,#7b61ff) 15%, transparent); color:var(--info-color,#7b61ff); font-weight:600; border-radius:9px; }
  .tag.hash { background:var(--secondary-background-color,#eee); color:var(--secondary-text-color); font-weight:600; border-radius:9px; }
  .tag.s-filled.person, .tag.s-filled.hash { border-radius:4px; }
  .notes { padding:4px 12px 12px; display:grid; gap:10px; }
  .priceline { font-size:.78rem; color:var(--secondary-text-color); font-variant-numeric:tabular-nums; }
  .priceline b { color:var(--primary-text-color); font-weight:600; }
  .softchk { font-size:.74rem; color:var(--sl-accent); }
  .sumbar { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 16px; background:var(--secondary-background-color,#f2f2f2); font-variant-numeric:tabular-nums; }
  .sumbar small { color:var(--secondary-text-color); font-weight:400; }
  .edit .price-in { flex:1 1 150px; min-width:150px; max-width:220px; }
  .tplbar { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; padding:8px 12px 10px; }
  .tcard { position:relative; text-align:left; border:1px solid var(--divider-color,#ddd); border-radius:12px; padding:10px; background:var(--secondary-background-color,#f6f6f6); font:inherit; color:inherit; cursor:pointer; }
  .tcard b { display:block; overflow-wrap:anywhere; } .tcard small { color:var(--secondary-text-color); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tcard.new { border-style:dashed; display:grid; place-items:center; color:var(--sl-accent); }
  .tcard .ed { position:absolute; top:4px; right:4px; }
  .bars { display:flex; align-items:flex-end; gap:6px; height:120px; margin:8px 0 22px; }
  .bars .b { flex:1; display:flex; flex-direction:column-reverse; border-radius:6px 6px 0 0; overflow:hidden; position:relative; min-height:2px; }
  .bars .b span { position:absolute; bottom:-18px; left:-4px; right:-4px; text-align:center; font-size:.68rem; color:var(--secondary-text-color); }
  .legend { display:flex; gap:10px; flex-wrap:wrap; font-size:.78rem; color:var(--secondary-text-color); }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
  input.pick { width:16px; height:16px; margin:0 8px 0 0; vertical-align:-3px; accent-color:var(--sl-accent); }
  .linkbtn.danger { color:var(--error-color,#db4437); }
  .statrow { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 10px; padding:4px 0; }
  .statrow .bar2 { grid-column:1/-1; height:5px; border-radius:3px; background:var(--divider-color,#ddd); overflow:hidden; }
  .statrow .bar2 i { display:block; height:100%; background:var(--sl-accent); }
  .qr { display:grid; place-items:center; margin:8px 0; } .qr svg { width:180px; height:180px; border-radius:8px; }
  /* QR links, Einstellungen rechts – in schmalen Spalten (Listen-Fenster) rutschen die Einstellungen unter den QR-Code */
  .sharegrid { display:flex; flex-wrap:wrap; gap:6px 18px; align-items:flex-start; }
  .sharegrid > .qrbox { flex:0 0 170px; }
  .sharegrid > div:last-child { flex:1 1 280px; min-width:0; }
  .sharegrid .srow2 { flex-wrap:wrap; }
  .sharegrid .srow2 > .sl { flex:1 1 150px; min-width:140px; }
  .sharegrid .srow2 > input { flex:1 1 160px; max-width:100%; }
  .qrbox { width:170px; height:170px; border-radius:12px; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:8px; box-sizing:border-box; }
  .qrbox svg { width:100%; height:100%; } .qrbox .qrph { font-size:2rem; opacity:.35; } .qrbox small { color:#777; font-size:.72rem; text-align:center; }
  .pendbox { margin:4px 12px 8px; padding:6px 10px; border-radius:10px; background:color-mix(in srgb, var(--warning-color,#ff9800) 12%, transparent); }
  .pendrow { display:flex; align-items:center; gap:6px; padding:5px 0; } .pendrow .pt { flex:1; min-width:0; }
  .pendrow small { display:block; color:var(--secondary-text-color); font-size:.74rem; } .pendrow .btn2 { height:30px; padding:0 12px; }
  .ntiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px; margin:6px 0 10px; }
  .ntile { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1px solid var(--divider-color,#ddd);
    background:var(--card-background-color,#fff); color:inherit; font:inherit; text-align:left; cursor:pointer; min-height:52px; box-sizing:border-box; }
  .ntile.on { border-color:var(--sl-accent); background:color-mix(in srgb, var(--sl-accent) 12%, transparent); }
  .ntile.add { border-style:dashed; color:var(--sl-accent); }
  .ntile .ni { font-size:1.3rem; width:26px; text-align:center; flex:none; } .ntile .nn { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; }
  .ntile .nn small { display:block; color:var(--secondary-text-color); font-size:.72rem; overflow:hidden; text-overflow:ellipsis; }
  .ntile .nc { color:var(--sl-accent); font-weight:700; width:14px; }
  .prow { display:flex; align-items:center; gap:10px; padding:7px 0; border-top:1px solid var(--divider-color,#e0e0e0); flex-wrap:wrap; }
  .prow .pn { flex:1 1 100px; min-width:0; } .prow .pn small { display:block; color:var(--secondary-text-color); font-size:.72rem; }
  .pctl { display:flex; align-items:center; gap:2px; flex:none; margin-left:auto; } .prow .seg button { padding:4px 9px; }
  .pav { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; font-size:.8rem; flex:none; }
  .seg { display:inline-flex; border:1px solid var(--divider-color,#ccc); border-radius:18px; overflow:hidden; }
  .seg button { border:0; background:none; color:inherit; font:inherit; font-size:.82rem; padding:4px 12px; cursor:pointer; }
  .seg button.on { background:color-mix(in srgb, var(--sl-accent) 35%, transparent); color:var(--primary-text-color); font-weight:600; }
  @media (max-width: 520px) { .sharegrid { grid-template-columns:1fr; } .qrbox { margin:0 auto; } }
  .sharelink { font:600 .78rem ui-monospace,monospace; overflow-wrap:anywhere; padding:8px; border-radius:8px; background:var(--secondary-background-color,#f2f2f2); }
  .aisle { display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--divider-color,#ddd); border-radius:10px; margin:5px 0; background:var(--secondary-background-color,#f6f6f6); }
  .aisle .n { width:22px; height:22px; border-radius:50%; background:var(--sl-accent); color:var(--text-primary-color,#fff); display:grid; place-items:center; font-size:.72rem; font-weight:700; flex:none; }
  .aisle .grow { flex:1; }
  .selbar { position:sticky; top:0; z-index:4; display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:8px 12px; margin:0 8px 6px;
    border-radius:12px; background:color-mix(in srgb, var(--sl-accent) 14%, var(--card-background-color,#fff)); }
  .selbar .grow { flex:1; min-width:90px; } .selbar .btn2 { height:32px; padding:0 12px; } .selbar .btn2:disabled { opacity:.45; cursor:default; }
  .row.selmode { cursor:pointer; user-select:none; } .row.selmode.sel { background:color-mix(in srgb, var(--sl-accent) 12%, transparent); }
  .row.selmode .selbox { display:grid; place-items:center; border-radius:6px; }
  .row.selmode .selbox.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .xdel { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; padding:0 6px; }
  .xdel:hover { color:var(--error-color,#db4437); }
  .sumbar .btn2 { margin-left:8px; }
  .aisle .handle { cursor:grab; touch-action:none; user-select:none; font-size:1.1rem; padding:0 4px; color:var(--secondary-text-color); }
  .aisle.dragging { opacity:.5; } .aisle.drop { outline:2px dashed var(--sl-accent); outline-offset:1px; }
  .scanbox { position:relative; border-radius:12px; overflow:hidden; background:#000; aspect-ratio:4/3; margin:0 0 10px; }
  .scanbox video { width:100%; height:100%; object-fit:cover; display:block; }
  .scanbox::after { content:""; position:absolute; left:12%; right:12%; top:50%; height:2px; background:var(--error-color,#db4437); box-shadow:0 0 8px var(--error-color,#db4437); }
  .notes.grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
  .notes.list { grid-template-columns:minmax(0,1fr); }
  .notecard { text-align:left; font:inherit; color:inherit; cursor:pointer; border:1px solid var(--divider-color,#e0e0e0); border-radius:12px;
    background:var(--secondary-background-color,#f6f6f6); padding:10px 12px; min-height:64px; display:flex; flex-direction:column; gap:4px; }
  .notecard:hover { border-color:var(--sl-accent); }
  .notecard .nt { font-weight:600; overflow-wrap:anywhere; }
  .notecard .nb { font-size:.86rem; color:var(--secondary-text-color); white-space:pre-wrap; overflow-wrap:anywhere;
    display:-webkit-box; -webkit-line-clamp:6; -webkit-box-orient:vertical; overflow:hidden; }
  .notes.list .notecard .nb { -webkit-line-clamp:2; }
  .notecard.done { opacity:.6; }
  .tag.s-outline { background:none !important; border:1px solid currentColor; padding:0 6px; }
  .tag.s-text { background:none !important; padding:0 2px; }
  .look-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .vrow { border-top:1px solid var(--divider-color,#e0e0e0); }
  .vhead { display:flex; align-items:center; gap:10px; width:100%; background:none; border:0; color:inherit; font:inherit; padding:8px 2px; cursor:pointer; text-align:left; }
  .vhead .sl { flex:1; display:flex; align-items:center; gap:8px; } .vhead small { color:var(--secondary-text-color); }
  .vmark { color:var(--sl-accent); font-size:.6rem; } .vchev { color:var(--secondary-text-color); width:20px; text-align:center; }
  .vbody { padding:0 2px 10px; flex-wrap:wrap; justify-content:flex-end; }
  .look-row input[type=color] { width:36px; height:30px; padding:0 2px; border:1px solid var(--divider-color,#ddd); border-radius:8px; background:none; cursor:pointer; flex:none; }
  .look-row input.icon { width:46px; text-align:center; height:30px; }
  .look-row select { width:auto !important; }
  .zchips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; align-items:center; }
  .srow2.storerow { flex-wrap:wrap; align-items:flex-start; }
  .storecard { border:1px solid var(--divider-color,#e0e0e0); border-radius:12px; padding:10px 12px; margin:8px 0; }
  .sthead { display:flex; align-items:center; gap:10px; flex-wrap:wrap; } .stinfo { flex:1; color:var(--secondary-text-color); font-size:.82rem; }
  .stzones { margin-top:6px; } .stzone { display:flex; align-items:center; gap:6px; padding:3px 0 3px 4px; font-size:.9rem; } .stzone > span { flex:1; }
  .stadd { margin-top:6px; width:100%; border-style:dashed !important; }
  .storerow .sl { flex:0 0 auto; min-width:90px; }
  .storerow .sl small { white-space:nowrap; margin-top:4px; }
  .storerow .zchips { flex:1 1 240px; }
  .storerow .zchips select { width:auto !important; min-width:110px; }
  .zchip { display:inline-flex; align-items:center; gap:2px; border:1px solid var(--divider-color,#ddd); border-radius:14px; padding:2px 4px 2px 10px; font-size:.8rem; }
  .zchip button { background:none; border:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; line-height:1; padding:0 4px; }
  .tags { display:flex; gap:4px; margin-left:auto; flex-wrap:wrap; justify-content:flex-end; }
  .catemoji { text-align:center; }
  .offer { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:2px; font-size:.78rem; color:var(--secondary-text-color); }
  .offer .olabel { font-weight:600; color:var(--success-color,#43a047); }
  .offer .oprice { font-weight:700; color:var(--primary-text-color); }
  .offer .oold { text-decoration:line-through; }
  .offer .odisc { font-weight:700; color:var(--error-color,#db4437); }
  .offer.expired .olabel, .offer.expired .odate { color:var(--error-color,#db4437); }
  .offer.expired .oprice { color:var(--secondary-text-color); }
  .row.checked .offer { opacity:.55; }
  .note { font-size:.8rem; color:var(--secondary-text-color); margin-top:1px; }
  .actions { display:flex; justify-content:flex-end; gap:2px; }
  .icon-btn { background:none; border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center;
    color:var(--secondary-text-color); cursor:pointer; padding:0; flex:none; }
  .icon-btn:hover { background:var(--divider-color,#ddd); color:var(--primary-text-color); }
  .icon-btn.danger:hover { color:var(--error-color,#db4437); }
  .lock-ic { color:var(--secondary-text-color); opacity:.7; display:flex; padding:0 6px; }
  .edit { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:6px; padding:8px 16px 10px; background:var(--secondary-background-color,#f6f6f6); }
  .edit input, .edit select { background:var(--card-background-color,#fff); }
  .edit .text { flex:1 1 100%; } .edit .cat { flex:1 1 160px; } .edit .note-in { flex:2 1 200px; }
  .edit .btns { display:flex; gap:8px; flex:1 1 100%; justify-content:flex-end; }
  .btn { font:inherit; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; background:none; color:var(--sl-accent); }
  .btn.primary { background:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .btn.small { padding:4px 10px; font-size:.85rem; }
  .done-head { display:flex; align-items:center; gap:6px; padding:8px 8px 8px 16px; cursor:pointer; color:var(--secondary-text-color);
    font-size:.85rem; border-top:1px solid var(--divider-color,#e0e0e0); user-select:none; }
  .done-head .grow { flex:1; }
  .done-head .chev { transition:transform .15s; } .done-head.collapsed .chev { transform:rotate(-90deg); }
  .empty, .msg { padding:20px 16px; text-align:center; color:var(--secondary-text-color); }
  .msg.err { color:var(--error-color,#db4437); padding:8px 16px; }

  .compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .compact .group-title { padding-top:4px; }
  .compact .head { padding-top:10px; }
  .row.press { cursor:default; -webkit-touch-callout:none; user-select:none; }
  .row.pressing { background:var(--secondary-background-color,#eee); transition:background .4s; }
  .morewrap { position:static; }
  .moreback { position:fixed; inset:0; z-index:7; }
  .menu.morepop { top:52px; right:10px; left:auto; width:260px; position:absolute; }
  .morepop .sortrow { cursor:default; padding:6px 10px; } .morepop .sortrow:hover { background:none; }
  .morepop .sortrow select { flex:1; min-width:0; width:auto; max-width:100%; box-sizing:border-box; margin:0; }
  ha-card { position:relative; }
  .menu { position:absolute; z-index:8; left:16px; right:16px; max-width:340px; margin:0 auto; background:var(--card-background-color,#fff);
    border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.25); padding:6px; }
  .menu .mh { display:flex; align-items:center; gap:6px; padding:6px 8px 8px; font-weight:600; border-bottom:1px solid var(--divider-color,#e0e0e0); margin-bottom:4px; }
  .menu .mh span { flex:1; min-width:0; overflow-wrap:anywhere; }
  .ihist { padding:2px 6px 6px; max-height:300px; overflow:auto; }
  .ih { display:grid; grid-template-columns:96px minmax(0,1fr); gap:8px; padding:7px 4px; border-bottom:1px solid var(--divider-color,#e0e0e0); font-size:.88rem; }
  .ih:last-child { border-bottom:none; } .ih .a { color:var(--secondary-text-color); } .ih small { display:block; color:var(--secondary-text-color); font-size:.76rem; }
  .menu .mi { display:flex; align-items:center; gap:12px; width:100%; border:none; background:none; border-radius:8px; padding:10px; font:inherit;
    color:var(--primary-text-color); cursor:pointer; text-align:left; }
  .menu .mi:hover { background:var(--secondary-background-color,#eee); }
  .menu .mi.danger { color:var(--error-color,#db4437); }
  .menu .mi svg { color:var(--secondary-text-color); flex:none; } .menu .mi.danger svg { color:inherit; }
  .menu .mgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:2px; }
  .menu .empty { padding:12px; }
  .backdrop { position:fixed; inset:0; z-index:7; }

  /* Einkaufsmodus */
  .shopbtn.on { color:var(--text-primary-color,#fff); background:var(--sl-accent); }
  .progress { height:4px; margin:0 16px 8px; border-radius:2px; background:var(--secondary-background-color,#eee); overflow:hidden; }
  .progress > div { height:100%; background:var(--success-color,#43a047); transition:width .3s; }
  .shopping .row.large { min-height:54px; font-size:1.08rem; }
  .shopping .row.large .box { width:28px; height:28px; }
  .shopping .row.tap { cursor:pointer; user-select:none; -webkit-user-select:none; -webkit-tap-highlight-color:transparent; }
  .snack { position:sticky; bottom:8px; margin:8px 16px; display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px;
    background:#323232; color:#fff; font-size:.9rem; z-index:4; }
  .snack span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .snack button { border:none; background:none; color:#8ab4f8; font:inherit; font-weight:600; cursor:pointer; padding:2px 4px; }
  .uigrid { display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center; font-size:.88rem; }
  .uigrid select { padding:6px 8px; }
  .checks { display:flex; flex-direction:column; gap:4px; font-size:.88rem; margin:6px 0; }
  .checks label, .inline-checks label { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .own { color:var(--sl-accent); font-weight:700; margin-left:2px; }
  .inline-checks { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:.85rem; }

  .tabs { display:flex; gap:4px; margin:10px 0 8px; }
  .tabs button { flex:1; border:1px solid var(--divider-color,#ddd); background:none; border-radius:8px; padding:7px; font:inherit; font-size:.88rem;
    cursor:pointer; color:var(--primary-text-color); }
  .tabs button.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  textarea { font:inherit; width:100%; box-sizing:border-box; min-height:120px; resize:vertical; color:var(--primary-text-color);
    background:var(--secondary-background-color,#f2f2f2); border:1px solid transparent; border-radius:8px; padding:9px 11px; }
  textarea:focus { outline:none; border-color:var(--sl-accent); }
  .imp-src { width:100%; }
  .imp-prev { max-height:220px; overflow:auto; border:1px solid var(--divider-color,#e0e0e0); border-radius:8px; margin-top:8px; }
  .imp-prev .ir { display:flex; align-items:center; gap:8px; padding:5px 10px; font-size:.88rem; border-bottom:1px solid var(--divider-color,#eee); }
  .imp-prev .ir:last-child { border-bottom:none; }
  .imp-prev .ir.dupe { opacity:.45; }
  .imp-prev .ir .n { flex:1; min-width:0; overflow-wrap:anywhere; }
  .imp-prev .ir.checked .n { text-decoration:line-through; }

  .searchbar { display:flex; align-items:center; gap:6px; padding:0 16px 10px; }
  .searchbar input { flex:1; }
  .iname mark { background:color-mix(in srgb, var(--warning-color,#f5a623) 35%, transparent); color:inherit; border-radius:2px; padding:0 1px; }
  .nohits { padding:16px; text-align:center; color:var(--secondary-text-color); }
  .nohits .btn { margin-top:6px; }

  .settings { padding:4px 16px 16px; border-top:1px solid var(--divider-color,#e0e0e0); }
  .settings h3 { font-size:.95rem; font-weight:600; margin:14px 0 2px; }
  .settings .help { font-size:.8rem; color:var(--secondary-text-color); margin:0 0 8px; }
  .rule { display:flex; gap:6px; align-items:center; margin-bottom:6px; }
  .rule input { width:48px; text-align:center; font-weight:700; font-size:1.05rem; padding:6px; }
  .rule select { flex:1; padding:7px 9px; }
  .example { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:.85rem; padding:8px 10px; border-radius:8px;
    background:var(--secondary-background-color,#f4f4f4); margin:6px 0; }
  .example code { font-family:ui-monospace,monospace; font-size:.8rem; color:var(--secondary-text-color); }
  .srow { display:flex; align-items:center; gap:8px; justify-content:flex-end; margin-top:6px; }
  .srow .ok { color:var(--success-color,#43a047); font-size:.85rem; }
  .learned { max-height:200px; overflow:auto; }
  .lrow { display:flex; align-items:center; gap:8px; padding:3px 0; font-size:.88rem; }
  .lrow .w { flex:1; }

  .row[draggable="true"] { cursor:grab; }
  .row.dragging { opacity:.4; }
  .row.dropbefore { box-shadow: inset 0 3px 0 var(--sl-accent); }
  ha-card.droptarget { outline:2px dashed var(--sl-accent); outline-offset:-4px; }
  .density-compact .row { min-height:30px; padding-top:2px; padding-bottom:2px; }
  .density-comfortable .row { min-height:var(--smartlists-row-height, 54px); }
  .density-comfortable .box { width:26px; height:26px; }
  .filterbar { display:flex; gap:6px; overflow-x:auto; padding:0 16px 8px; scrollbar-width:none; }
  .fchip.on { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .fixedfilter { padding:0 16px 6px; font-size:.78rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--smartlists-tile-size,110px),1fr)); gap:8px; padding:4px 16px 12px; }
  .tile { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-height:96px; padding:10px 6px;
    border-radius:12px; border:1px solid var(--divider-color,#e0e0e0); background:var(--card-background-color,#fff); cursor:pointer; text-align:center;
    font:inherit; color:var(--primary-text-color); }
  .tile:hover { border-color:var(--sl-accent); }
  .tile .te { font-size:1.8rem; line-height:1; }
  .tile .tn { font-size:.9rem; overflow-wrap:anywhere; }
  .tile .tq { font-size:.78rem; font-weight:700; color:var(--sl-accent); }
  .tile .tb { display:flex; gap:3px; flex-wrap:wrap; justify-content:center; }
  .tile.checked { opacity:.45; } .tile.checked .tn { text-decoration:line-through; }
  .tile:disabled { cursor:default; }
  .mini { display:flex; align-items:center; gap:10px; padding:14px 16px; cursor:pointer; }
  .mini .mt { font-weight:600; flex:1; min-width:0; }
  .mini .ms { font-size:.82rem; color:var(--secondary-text-color); display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .mini .mcount { font-size:1.6rem; font-weight:700; color:var(--sl-accent); }

  /* Zahnrad-Menü */
  .sl-settings { border-top:1px solid var(--divider-color,#e0e0e0); container-type:inline-size; }
  .sgrid { display:grid; grid-template-columns:minmax(0,1fr); }
  .snav { padding:12px 10px 14px; }
  .snav .search2 { margin:0 0 6px; height:36px; }
  .snav h4 { margin:14px 10px 4px; font-size:.76rem; font-weight:600; color:var(--secondary-text-color); }
  .snav h4 span { font-weight:400; }
  .snav button { display:block; width:100%; text-align:left; border:none; background:none; color:var(--primary-text-color); font:inherit; padding:8px 10px; border-radius:8px; cursor:pointer; }
  .snav button:hover { background:var(--secondary-background-color,#f2f2f2); }
  .snav button.on { color:var(--sl-accent); font-weight:600; background:color-mix(in srgb, var(--sl-accent) 10%, transparent); }
  .snav .ver { display:flex; justify-content:space-between; margin:16px 10px 0; font-size:.75rem; color:var(--secondary-text-color); }
  .snav .ver a { color:var(--sl-accent); text-decoration:none; }
  .smain { padding:14px 16px 4px; min-width:0; }
  .smain > header h2 { margin:0; font-size:1.3rem; font-weight:600; letter-spacing:-.01em; }
  .smain > header p { margin:2px 0 0; color:var(--secondary-text-color); font-size:.88rem; max-width:70ch; }
  .smain > header { margin-bottom:18px; }
  .sback { border:none; background:none; color:var(--sl-accent); font:inherit; padding:0 0 10px; cursor:pointer; }
  .sgrid:not(.detail) .smain { display:none; } .sgrid.detail .snav { display:none; }
  @container (min-width: 720px) {
    .sgrid { grid-template-columns:210px minmax(0,1fr); }
    .sgrid:not(.detail) .smain, .sgrid.detail .snav { display:block; }
    .snav { border-right:1px solid var(--divider-color,#e0e0e0); }
    .sback { display:none; }
    .smain { padding:20px 26px 6px; }
    .acols { columns:2 300px; column-gap:40px; }
  }
  .linkbtn { border:none; background:none; color:var(--sl-accent); font:inherit; padding:8px 0; cursor:pointer; }
  /* Gruppen ohne Kästen: Überschrift, feine Linien, Abstand */
  .sec { break-inside:avoid; margin:0 0 26px; }
  .sh { display:flex; align-items:baseline; gap:8px; }
  .sh h3 { margin:0; font-size:.82rem; font-weight:600; color:var(--secondary-text-color); flex:1; min-width:0; }
  .sh .cnt { font-size:.75rem; color:var(--secondary-text-color); white-space:nowrap; }
  .shelp { margin:2px 0 4px; padding:0; color:var(--secondary-text-color); font-size:.8rem; }
  .sbody { padding:0; }
  .srow2 { display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--divider-color,#e0e0e0); }
  .sbody > .srow2:first-child, .chips + .srow2, .grp + .srow2 { border-top:none; }
  .srow2 .sl { flex:1; min-width:0; }
  .srow2 .sl small { display:block; color:var(--secondary-text-color); font-size:.76rem; overflow-wrap:anywhere; }
  .srow2 select { width:180px; flex:none; height:36px; padding:0 10px; }
  /* 4.0 – schmale Einstellungen (Handy): Beschriftung über dem Feld statt daneben; nichts wird mehr gequetscht oder
     überlagert (Tunnel-Token, Badges & Farben, lange Auswahllisten). Schalter bleiben rechts neben dem Text. */
  @container (max-width: 520px) {
    .srow2 { flex-wrap:wrap; row-gap:6px; }
    .srow2 > .sl { flex:1 1 60%; min-width:150px; }
    .srow2 > select, .srow2 > input:not([type=checkbox]):not([type=color]), .srow2 > .look-row, .srow2 > textarea { flex:1 1 100%; width:auto; max-width:100%; min-width:0; }
    .srow2 > .look-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:flex-start; }
    .srow2 > .look-row select { flex:1 1 140px; width:auto; }
  }
  .srow2 .val { color:var(--secondary-text-color); font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
  .grp { font-size:.8rem; font-weight:600; color:var(--secondary-text-color); margin:14px 0 2px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip2 { border:1px solid var(--divider-color,#ddd); background:none; color:var(--primary-text-color); border-radius:16px; padding:6px 12px; font:inherit; font-size:.85rem; cursor:pointer; }
  .chip2.on { background:color-mix(in srgb, var(--sl-accent) 18%, transparent); border-color:var(--sl-accent); color:var(--sl-accent); font-weight:600; }
  .switch { position:relative; width:38px; height:22px; flex:none; display:inline-block; }
  .switch input { opacity:0; width:0; height:0; position:absolute; }
  .switch span { position:absolute; inset:0; border-radius:11px; background:var(--divider-color,#ccc); transition:.15s; cursor:pointer; }
  .switch span::after { content:""; position:absolute; width:16px; height:16px; left:3px; top:3px; border-radius:50%; background:#bdbdbd; transition:.15s; }
  .switch input:checked + span { background:color-mix(in srgb, var(--sl-accent) 55%, transparent); }
  .switch input:checked + span::after { left:19px; background:var(--sl-accent); }
  .switch input:focus-visible + span { outline:2px solid var(--sl-accent); outline-offset:2px; }
  .rule2 { display:grid; grid-template-columns:44px 1fr 32px; gap:8px; align-items:center; margin-bottom:8px; }
  .rule2 .char { height:40px; text-align:center; font:700 1.1rem/1 ui-monospace, monospace; padding:0; }
  .rule2 select { height:40px; width:100%; }
  .preview2 { padding:10px 12px; border-radius:10px; background:var(--secondary-background-color,#f2f2f2); display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:.85rem; }
  .preview2 code { color:var(--secondary-text-color); font-size:.8rem; }
  .preview2 .arrow { color:var(--secondary-text-color); }
  .acts { display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .ok2 { margin-right:auto; color:var(--success-color,#43a047); font-size:.8rem; }
  .btn2 { height:36px; padding:0 14px; border-radius:18px; font:inherit; font-weight:500; cursor:pointer; border:1px solid var(--divider-color,#ddd); background:none; color:var(--sl-accent); }
  .btn2.primary { background:var(--sl-accent); border-color:var(--sl-accent); color:var(--text-primary-color,#fff); }
  .srow2 .icon-btn.up svg, .aisle .icon-btn.up svg, .icon-btn.up svg { transform:rotate(180deg); }
  .btn2.danger { color:var(--error-color,#db4437); }
  .search2 { width:100%; height:40px; box-sizing:border-box; }
  .packadd { display:flex; flex-direction:column; gap:8px; margin:4px 0 10px; }
  .packadd2 { display:flex; gap:8px; align-items:center; }
  .packadd2 select { flex:1 1 auto; min-width:0; height:40px; }
  .packadd2 .btn2, .btn2 { white-space:nowrap; flex:none; }
  .learned2 { max-height:236px; overflow:auto; margin-top:8px; border:1px solid var(--divider-color,#e0e0e0); border-radius:10px; }
  .lrow2 { display:grid; grid-template-columns:minmax(0,1fr) auto 30px; align-items:center; gap:8px; padding:4px 4px 4px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .lrow2:last-child { border-bottom:none; }
  .lrow2:nth-child(odd) { background:color-mix(in srgb, var(--secondary-background-color,#f2f2f2) 45%, transparent); }
  .lrow2 .w { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lrow2 select.cat { height:30px; max-width:170px; }
  .lrow2 .cat { font-size:.78rem; padding:3px 9px; border-radius:12px; background:var(--secondary-background-color,#eee); border:1px solid var(--divider-color,#ddd); white-space:nowrap; }
  .manual { font-size:.68rem; color:var(--sl-accent); margin-left:6px; }
  .foot2 { display:flex; justify-content:space-between; padding:0 4px; font-size:.75rem; color:var(--secondary-text-color); }
  .foot2 a { color:var(--sl-accent); text-decoration:none; }
`;

const WIZARD_STYLE = `
  .wiz-back { padding:16px; }
  .dlg.wiz { position:relative; max-width:960px; width:100%; padding:0; display:grid; grid-template-columns:minmax(0,1fr); max-height:94vh; overflow:auto;
    --sl-accent:var(--primary-color,#03a9f4); }
  .wside { display:none; padding:26px 18px; border-right:1px solid var(--divider-color,#e0e0e0); }
  .wside h1 { font-size:1.15rem; margin:0 0 2px; }
  .wsteps { list-style:none; margin:18px 0 0; padding:0; }
  .wsteps li { display:flex; gap:12px; align-items:center; padding:8px 6px; border-radius:8px; color:var(--secondary-text-color); cursor:pointer; }
  .wsteps li .n { width:24px; height:24px; border-radius:50%; border:1.5px solid var(--divider-color,#ccc); display:grid; place-items:center; font-size:.75rem; flex:none; }
  .wsteps li.now { color:var(--primary-text-color); font-weight:600; } .wsteps li.now .n { border-color:var(--sl-accent); color:var(--sl-accent); }
  .wsteps li.done .n { background:var(--success-color,#43a047); border-color:var(--success-color,#43a047); color:#fff; }
  .wpane { display:flex; flex-direction:column; min-width:0; min-height:520px; }
  .wbar { padding:16px 20px 0; } .wbar small { color:var(--secondary-text-color); }
  .wbar div { height:4px; border-radius:2px; background:var(--divider-color,#ddd); margin-top:8px; overflow:hidden; } .wbar i { display:block; height:100%; background:var(--sl-accent); }
  .wbody { padding:18px 20px 8px; flex:1; }
  .wbody h2 { font-size:1.35rem; font-weight:600; margin:0 0 4px; letter-spacing:-.01em; }
  .wbody .lead { margin:0 0 18px; color:var(--secondary-text-color); max-width:56ch; font-size:.95rem; }
  .m { color:var(--secondary-text-color); } .small { font-size:.82rem; }
  .wset { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:4px 16px; padding:10px 0; border-bottom:1px solid var(--divider-color,#e0e0e0); min-height:46px; }
  .wset small { display:block; color:var(--secondary-text-color); font-size:.8rem; }
  .wpick { display:flex; gap:12px; align-items:flex-start; width:100%; text-align:left; padding:12px 14px; border:1px solid var(--divider-color,#ddd); border-radius:10px;
    margin:0 0 10px; background:none; color:inherit; font:inherit; cursor:pointer; height:auto; }
  .wpick small { display:block; color:var(--secondary-text-color); font-size:.82rem; }
  .wpick .r { width:18px; height:18px; border-radius:50%; border:2px solid var(--secondary-text-color); margin-top:2px; flex:none; box-sizing:border-box; }
  .wpick.on { border-color:var(--sl-accent); background:color-mix(in srgb, var(--sl-accent) 7%, transparent); }
  .wpick.on .r { border-color:var(--sl-accent); background:radial-gradient(var(--sl-accent) 42%, transparent 48%); }
  .winset { margin:0 0 12px 30px; }
  .wchk { width:22px; height:22px; border-radius:6px; border:2px solid var(--secondary-text-color); background:none; padding:0; cursor:pointer; display:grid; place-items:center; color:#fff; }
  .wchk.on { background:var(--sl-accent); border-color:var(--sl-accent); } .wchk.on::after { content:"✓"; font-size:13px; line-height:1; }
  .wstores { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .wstore { display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 14px 0 10px; border:1px solid var(--divider-color,#ddd); border-radius:8px;
    background:none; color:var(--primary-text-color); font:inherit; line-height:1; cursor:pointer; }
  .wstore::before { content:""; box-sizing:border-box; width:18px; height:18px; border-radius:50%; border:1.5px solid var(--secondary-text-color); flex:none;
    display:grid; place-items:center; font-size:11px; line-height:1; }
  .wstore.on { border-color:var(--sl-accent); background:color-mix(in srgb, var(--sl-accent) 14%, transparent); }
  .wstore.on::before { content:"✓"; border-color:var(--sl-accent); background:var(--sl-accent); color:#fff; }
  .wrow { display:inline-flex; gap:8px; align-items:center; }
  .wchar { width:48px !important; text-align:center; font-weight:600; padding:0; }
  .werr { color:var(--error-color,#db4437); font-size:.85rem; margin:8px 0 0; min-height:1em; }
  .weg { margin:12px 0 0; padding:10px 12px; background:var(--secondary-background-color,#f2f2f2); border-radius:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .weg code { color:var(--secondary-text-color); } .weg .q { color:var(--sl-accent); }
  .wsum { list-style:none; padding:0; margin:0; } .wsum li { padding:10px 0; border-bottom:1px solid var(--divider-color,#e0e0e0); display:flex; gap:10px; }
  .wsum li::before { content:"✓"; color:var(--success-color,#43a047); font-weight:700; }
  .wfoot { display:flex; align-items:center; gap:10px; padding:12px 20px 16px; border-top:1px solid var(--divider-color,#e0e0e0); position:sticky; bottom:0; background:var(--card-background-color,#fff); }
  .wfoot .grow { flex:1; } .wfoot .wl { display:none; }
  .wx { position:absolute; top:10px; right:10px; width:34px; height:34px; border-radius:50%; border:none; background:none; color:var(--secondary-text-color); cursor:pointer; font-size:1rem; }
  .dlg.wiz input, .dlg.wiz select { margin:0; width:auto; height:36px; }
  .dlg.wiz .wset select { width:180px; } .dlg.wiz .wset .search2 { width:200px; }
  @media (min-width: 760px) {
    .dlg.wiz { grid-template-columns:230px minmax(0,1fr); }
    .wside { display:block; } .wbar { display:none; }
    .wbody { padding:30px 34px 8px; } .wfoot { padding:14px 34px 18px; } .wfoot .wl { display:inline; }
  }
`;

const LIST_DIALOG_STYLE = `
  .lsd { align-items:flex-end; padding:0; }
  .lsheet { max-width:none; width:100%; max-height:92vh; overflow:auto; padding:0; border-radius:16px 16px 0 0; --sl-accent:var(--primary-color,#03a9f4); }
  .ltop { display:flex; align-items:center; gap:10px; padding:14px 18px 12px; border-bottom:1px solid var(--divider-color,#e0e0e0); position:sticky; top:0; background:var(--card-background-color,#fff); z-index:1; }
  .lwho { flex:1; min-width:0; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .lwho h2 { margin:0; font-size:1.15rem; } .lwho small { color:var(--secondary-text-color); }
  .ltwo { display:grid; grid-template-columns:minmax(0,1fr); gap:0 40px; padding:18px 18px 0; }
  .lfoot { display:flex; align-items:center; gap:10px; padding:10px 18px 14px; border-top:1px solid var(--divider-color,#e0e0e0); }
  .lfoot .shelp { flex:1; margin:0; }
  .dlg.lsheet input, .dlg.lsheet select { width:auto; margin:0; height:36px; }
  /* Farbwähler (z. B. Farbe je Quell-Liste): sonst schrumpft er im Listen-Fenster auf einen Strich */
  .dlg.lsheet .look-row input[type=color], .dlg .look-row input[type=color] { width:44px; min-width:44px; height:32px; padding:2px; margin:0;
    border:1px solid var(--divider-color,#ccc); border-radius:8px; background:none; cursor:pointer; flex:none; box-sizing:border-box; }
  .dlg.lsheet .srow2 select { width:180px; }
  /* 4.0 – Handy: auch im Listen-/Teilen-Fenster die Beschriftung über Auswahl und Eingabefeld (nichts abgeschnitten) */
  @media (max-width: 520px) {
    .dlg.lsheet .srow2 { flex-wrap:wrap; row-gap:6px; }
    .dlg.lsheet .srow2 > .sl { flex:1 1 60%; min-width:150px; }
    .dlg.lsheet .srow2 > select, .dlg.lsheet .srow2 > input:not([type=checkbox]):not([type=color]) { flex:1 1 100%; width:auto; max-width:100%; min-width:0; margin:0; }
  }
  .dlg.lsheet button { height:auto; }
  .dlg.lsheet .btn2 { height:36px; } .dlg.lsheet .icon-btn { border:none; padding:0; }
  .dlg.lsheet .lfoot .ok { height:38px; }
  @media (min-width: 760px) {
    .lsd { align-items:center; padding:16px; }
    .lsheet { max-width:860px; border-radius:16px; }
    .ltwo:not(.one) { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
    .ltwo { padding:22px 24px 0; } .ltop, .lfoot { padding-left:24px; padding-right:24px; }
  }
`;

