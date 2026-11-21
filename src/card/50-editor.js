/* Visueller Editor für den Dashboard-Karten-Dialog */
class SmartListsCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._build(); }
  set hass(hass) {
    const relabel = this._form && this._hass && hass && this._hass.language !== hass.language;
    this._hass = hass;
    if (this._form) { this._form.hass = hass; if (relabel) this._form.schema = this._schema(); }
  }
  get _lang() { return slLang(this._hass); }
  get _t() { return TEXTS[this._lang] || TEXTS.en; }

  // Einfach: nur das Wichtigste. Erweitert: alle Abschnitte. Merkt sich die Wahl im Browser.
  get _advanced() { try { return localStorage.getItem("smartlists-editor-advanced") === "1"; } catch (e) { return false; } }
  set _advanced(v) { try { localStorage.setItem("smartlists-editor-advanced", v ? "1" : "0"); } catch (e) { /* */ } }

  // Notizlisten der App sind keine Einkaufslisten – nur anbieten, wenn sie schon gewählt sind
  _noNotes() {
    const st = (this._hass && this._hass.states) || {};
    const cur = [this._config && this._config.entity, ...((this._config && this._config.entities) || [])].map((e) => (typeof e === "string" ? e : e && e.entity));
    const ex = Object.keys(st).filter((e) => e.startsWith("todo.") && isNotesEntity(e, st[e].attributes.friendly_name) && !cur.includes(e));
    return ex.length ? { exclude_entities: ex } : {};
  }
  _schema() {
    const t = this._t;
    const b = (name) => ({ name, selector: { boolean: {} } });
    const section = (key, icon, schema) => ({ type: "expandable", name: "", flatten: true, title: t["e_sec_" + key], icon, schema });
    const sel = (name, options) => ({ name, selector: { select: { mode: "dropdown", options: options.map(([value, label]) => ({ value, label })) } } });
    const basic = [
      sel("preset", [["", t.e_preset_pick], ...Object.keys(PRESETS).map((k) => [k, t["e_pre_" + k]])]),
      { name: "entity", selector: { entity: { domain: "todo", ...this._noNotes() } } },
      { name: "title", selector: { text: {} } },
      sel("view", [["list", t.e_view_list], ["tiles", t.e_view_tiles], ["mini", t.e_view_mini]]),
      sel("sort", [["category", t.e_sort_category], ["alpha", t.sort_alpha], ["added", t.e_sort_added], ["list", t.e_sort_list]]),
      b("advanced"),
    ];
    if (!this._advanced) return basic;
    return [
      ...basic,
      section("multi", "mdi:view-column-outline", [
        { name: "entities", selector: { entity: { domain: "todo", multiple: true, ...this._noNotes() } } },
        sel("layout", [["tabs", t.e_layout_tabs], ["columns", t.e_layout_columns], ["stack", t.e_layout_stack]]),
      ]),
      section("filter", "mdi:filter-outline", [
        { name: "filter_store", selector: { text: {} } },
        { name: "filter_person", selector: { text: {} } },
        { name: "filter_tag", selector: { text: {} } },
        { name: "filter_category", selector: { select: { multiple: true, mode: "dropdown", options: categoryOptions(this._lang).map(([value, label]) => ({ value, label })) } } },
        b("filter_offers"), b("filter_tags_new_items"), b("show_filter_chips"),
      ]),
      section("look", "mdi:palette-outline", [
        sel("density", [["compact", t.e_density_compact], ["normal", t.e_density_normal], ["comfortable", t.e_density_comfortable]]),
        { name: "font_scale", selector: { number: { min: 0.8, max: 1.6, step: 0.05, mode: "slider" } } },
        { name: "radius", selector: { number: { min: 0, max: 32, step: 1, mode: "box", unit_of_measurement: "px" } } },
        { name: "accent_color", selector: { color_rgb: {} } },
        { name: "max_height", selector: { number: { min: 150, max: 2000, step: 50, mode: "box", unit_of_measurement: "px" } } },
      ]),
      section("header", "mdi:page-layout-header",
        [b("show_header"), b("show_count"), b("show_search"), b("show_sort"), b("show_shopping"), b("show_undo"), b("show_import"), b("show_settings")]),
      section("input", "mdi:plus-box-outline", [b("show_title"), b("show_add"), b("show_frequent"), b("show_templates"), b("show_scan"), b("show_offer_hints"), b("show_clear_done")]),
      section("list", "mdi:format-list-bulleted",
        [b("drag_drop"), b("show_stepper"), b("show_offer"), b("show_prices"), b("show_tags"), b("show_source"), b("show_note"), b("show_category_titles")]),
      section("done", "mdi:check-all", [b("show_completed"), b("collapse_completed")]),
      section("shop", "mdi:cart-outline", [b("start_shopping")]),
    ];
  }

  _build() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // Texte in TEXTS (l_… = Beschriftung, hh_… = Hilfe), Sprache von HA
      this._form.computeLabel = (sch) => this._t["l_" + sch.name] || sch.name;
      this._form.computeHelper = (sch) => this._t["hh_" + sch.name];
      this._form.addEventListener("value-changed", (e) => {
        const cfg = { ...e.detail.value };
        if ("advanced" in cfg) {
          const adv = !!cfg.advanced; delete cfg.advanced;
          if (adv !== this._advanced) { this._advanced = adv; this._form.schema = this._schema(); }
        }
        if (cfg.preset) { Object.assign(cfg, PRESETS[cfg.preset] ? PRESETS[cfg.preset].values : {}); }
        delete cfg.preset;
        // nur Abweichungen vom Standard speichern → schlankes YAML
        for (const [k, v] of Object.entries(CARD_DEFAULTS)) if (JSON.stringify(cfg[k]) === JSON.stringify(v)) delete cfg[k];
        for (const k of ["max_height", "radius", "title", "accent_color", "filter_store", "filter_person", "filter_tag"]) if (cfg[k] === "" || cfg[k] == null) delete cfg[k];
        if (Array.isArray(cfg.entities) && !cfg.entities.length) delete cfg.entities;
        if (Array.isArray(cfg.entities) && cfg.entities.length) delete cfg.entity;
        this._config = cfg;
        this._form.data = this._data();
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = this._data();
  }
  _data() { return { ...CARD_DEFAULTS, ...this._config, preset: "", advanced: this._advanced }; }
}

/* ------------------------------------------------------------------ */
/* Seitenleisten-Seite „SmartLists“ (von der Integration registriert)  */
/* ------------------------------------------------------------------ */
const PANEL_KEY = "smartlists-panel-list";
const PANEL_PREFS = "smartlists-panel-prefs";
