/*!
 * Sensor Status Card
 * A single-row Lovelace card that turns any numeric sensor into a five-zone status row:
 * icon, name, status label, value, a coloured zone bar with a position dot, a badge on the
 * lowest / highest sensor of a group, and a type/size badge for battery and disk modes.
 */

const CARD_TAG = "sensor-status-card";
const EDITOR_TAG = "sensor-status-card-editor";
const CARD_NAME = "Sensor Status Card";
const CARD_VERSION = "0.5.3-beta";

// Fallback/Default colors used when no explicit color or zone is provided.
const COLOR_MAP = {
  gray: "#8E8E93",
  cyan: "#64D2FF",
  blue: "#0A84FF",
  green: "#30D158",
  lime: "#A2E04B",
  yellow: "#FFD60A",
  orange: "#FF9F0A",
  red: "#FF453A",
  purple: "#BF5AF2",
};

const UNAVAILABLE = ["unknown", "unavailable", "", undefined, null];
const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const THRESHOLD_KEYS = ["very_low", "low", "high", "very_high"];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

const batteryIcon = (v) => {
  const n = Math.round(clamp(v, 0, 100) / 10) * 10;
  if (n <= 0) return "mdi:battery-outline";
  if (n >= 100) return "mdi:battery";
  return `mdi:battery-${n}`;
};

const PRESETS = {
  temperature: {
    icon: "mdi:thermometer",
    unit: "°C",
    decimals: 1,
    scale_min: 10,
    scale_max: 30,
    minIcon: "mdi:snowflake",
    maxIcon: "mdi:fire",
    labels: ["Very cold", "Cold", "Comfortable", "Warm", "Very hot"],
    zones: ["cyan", "blue", "green", "orange", "red"],
    thresholds: { very_low: 18, low: 20, high: 25, very_high: 28 },
  },
  humidity: {
    icon: "mdi:water-percent",
    unit: "%",
    decimals: 1,
    scale_min: 10,
    scale_max: 90,
    minIcon: "mdi:water-minus",
    maxIcon: "mdi:water-plus",
    labels: ["Very dry", "Dry", "Comfortable", "Humid", "Very humid"],
    zones: ["orange", "yellow", "green", "cyan", "blue"],
    thresholds: { very_low: 30, low: 40, high: 55, very_high: 60 },
  },
  co2: {
    icon: "mdi:molecule-co2",
    unit: "ppm",
    decimals: 0,
    scale_min: 400,
    scale_max: 2000,
    minIcon: "mdi:leaf",
    maxIcon: "mdi:alert",
    labels: ["Excellent", "Good", "Moderate", "Poor", "Very poor"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 600, low: 800, high: 1000, very_high: 1500 },
  },
  pm25: {
    icon: "mdi:air-filter",
    unit: "µg/m³",
    decimals: 1,
    scale_min: 0,
    scale_max: 75,
    minIcon: "mdi:leaf",
    maxIcon: "mdi:alert",
    labels: ["Excellent", "Good", "Moderate", "Poor", "Very poor"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 5, low: 12, high: 35, very_high: 55 },
  },
  pm10: {
    icon: "mdi:air-filter",
    unit: "µg/m³",
    decimals: 0,
    scale_min: 0,
    scale_max: 200,
    minIcon: "mdi:leaf",
    maxIcon: "mdi:alert",
    labels: ["Excellent", "Good", "Moderate", "Poor", "Very poor"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 15, low: 45, high: 100, very_high: 150 },
  },
  aqi: {
    icon: "mdi:weather-hazy",
    unit: "",
    decimals: 0,
    scale_min: 0,
    scale_max: 300,
    minIcon: "mdi:leaf",
    maxIcon: "mdi:alert",
    labels: ["Good", "Moderate", "Poor", "Unhealthy", "Very unhealthy"],
    zones: ["green", "yellow", "orange", "red", "purple"],
    thresholds: { very_low: 51, low: 101, high: 150, very_high: 200 },
  },
  battery: {
    icon: "mdi:battery-unknown",
    dynamicIcon: batteryIcon,
    unit: "%",
    decimals: 0,
    scale_min: 0,
    scale_max: 100,
    minIcon: "mdi:battery-alert",
    maxIcon: "mdi:battery-check",
    labels: ["Critical", "Low", "Medium", "Good", "Full"],
    zones: ["red", "orange", "yellow", "lime", "green"],
    thresholds: { very_low: 10, low: 25, high: 60, very_high: 90 },
  },
  cpu: {
    icon: "mdi:cpu",
    unit: "%",
    decimals: 1,
    scale_min: 0,
    scale_max: 100,
    minIcon: "mdi:gauge-empty",
    maxIcon: "mdi:gauge-full",
    labels: ["Idle", "Normal", "Moderate", "High", "Critical"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 15, low: 40, high: 75, very_high: 90 },
  },
  ram: {
    icon: "mdi:memory",
    unit: "%",
    decimals: 1,
    scale_min: 0,
    scale_max: 100,
    minIcon: "mdi:chip",
    maxIcon: "mdi:alert",
    labels: ["Low", "Normal", "Moderate", "High", "Critical"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 30, low: 60, high: 85, very_high: 95 },
  },
  disk: {
    icon: "mdi:harddisk",
    unit: "%",
    decimals: 1,
    scale_min: 0,
    scale_max: 100,
    minIcon: "mdi:harddisk-plus",
    maxIcon: "mdi:harddisk-remove",
    labels: ["Plenty free", "Healthy", "Filling up", "Almost full", "Critical"],
    zones: ["green", "lime", "yellow", "orange", "red"],
    thresholds: { very_low: 50, low: 70, high: 85, very_high: 95 },
  },
  custom: {
    icon: "mdi:gauge",
    unit: "",
    decimals: 1,
    scale_min: 0,
    scale_max: 100,
    minIcon: "mdi:arrow-collapse-down",
    maxIcon: "mdi:arrow-collapse-up",
    labels: ["Very low", "Low", "Normal", "High", "Very high"],
    zones: ["blue", "cyan", "green", "orange", "red"],
    thresholds: { very_low: 20, low: 40, high: 60, very_high: 80 },
  },
};

const MODE_DEVICE_CLASS = {
  temperature: "temperature",
  humidity: "humidity",
  battery: "battery",
  co2: "carbon_dioxide",
  pm25: "pm25",
  pm10: "pm10",
  aqi: "aqi",
};
const DEVICE_CLASS_MODE = Object.fromEntries(Object.entries(MODE_DEVICE_CLASS).map(([m, d]) => [d, m]));

const RAM_RE = /(?:^|[^a-z])(ram|memory|mem|swap)(?:[^a-z]|$)/;
const CPU_RE = /(?:^|[^a-z])(cpu|processor)(?:[^a-z]|$)/;
const DISK_RE = /(disk|storage|filesystem|ssd|hdd|nvme|mmcblk|partition)/;
const DRIVE_RE = /(?:^|[^a-z])(sd[a-z]\d*|vd[a-z]\d*|xvd[a-z]\d*|nvme\d+n\d+(?:p\d+)?)(?:[^a-z0-9]|$)/;

const detectMode = (hass, entityId) => {
  if (typeof entityId !== "string" || !entityId.startsWith("sensor.")) return null;
  const st = hass?.states?.[entityId];
  if (!st) return null;

  const dc = st.attributes?.device_class;
  if (dc) return DEVICE_CLASS_MODE[dc] || null;

  const unit = st.attributes?.unit_of_measurement;
  if (unit !== undefined && unit !== "%") return null;
  const text = `${entityId} ${st.attributes?.friendly_name ?? ""}`.toLowerCase();
  if (RAM_RE.test(text)) return "ram";
  if (CPU_RE.test(text)) return "cpu";
  if (DISK_RE.test(text) || DRIVE_RE.test(text)) return "disk";
  return null;
};

const resolveMode = (hass, config) => {
  const m = config?.mode;
  if (m && m !== "auto") return m;
  return detectMode(hass, config?.entity) || "custom";
};

class SensorStatusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          position: relative;
          box-sizing: border-box;
          height: 56px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pill {
          position: relative;
          box-sizing: border-box;
          height: 100%;
          display: flex;
          align-items: center;
          border-radius: 32px;
          background: color-mix(in srgb, var(--ssc-color) 10%, transparent);
          box-shadow: inset 0 0 10px color-mix(in srgb, var(--ssc-color) 45%, transparent);
        }
        .card:focus, .card:focus-visible { outline: none; }
        .card.kbd:focus-visible .pill { outline: 2px solid var(--ssc-color); outline-offset: 2px; }
        .icon {
          flex: none;
          width: 42px;
          height: 42px;
          margin: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ssc-color);
          background: color-mix(in srgb, var(--ssc-color) 20%, transparent);
          --mdc-icon-size: 24px;
        }
        .text {
          flex: 1;
          min-width: 0;
          align-self: flex-start;
          margin-top: 8px;
          line-height: 1.2;
          margin-left: 2px;
        }
        .text.single {
          align-self: center;
          margin-top: 0;
          padding-bottom: 4px;
        }
        .card.nobar .text {
          align-self: center;
          margin-top: 0;
          padding-bottom: 0;
        }
        .name {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status {
          font-size: 12px;
          color: var(--primary-text-color);
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .end {
          flex: none;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px 0 8px;
        }
        .extreme {
          display: flex;
          color: var(--ssc-color);
          --mdc-icon-size: 20px;
        }
        .type {
          flex: none;
          max-width: 90px;
          box-sizing: border-box;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--ssc-color);
          background: color-mix(in srgb, var(--ssc-color) 20%, transparent);
        }
        .value {
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
          color: var(--ssc-color);
          font-variant-numeric: tabular-nums;
        }
        .bar {
          position: absolute;
          left: 60px;
          right: 30px;
          bottom: 6px;
          height: 4px;
          border-radius: 2px;
          background: var(--ssc-bar, rgba(255, 255, 255, 0.12));
        }
        .dot {
          position: absolute;
          top: 50%;
          width: 10px;
          height: 10px;
          box-sizing: border-box;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: var(--ssc-color);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 8px var(--ssc-color);
        }
        /* ---------- Mushroom style ---------- */
        .card.mushroom { height: 68px; }
        .card.mushroom .pill {
          overflow: hidden;
          padding: 12px 8px;
          gap: 12px;
          border: 1px solid color-mix(in srgb, var(--ssc-color) 30%, transparent);
          border-radius: var(--ha-card-border-radius, 12px);
          background: color-mix(in srgb, var(--ssc-color) 8%, transparent);
          box-shadow: none;
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }
        .card.mushroom .icon {
          width: 65px;
          height: 65px;
          margin: -18px 0 0 -18px;
          --mdc-icon-size: 44px;
        }
        .card.mushroom .text,
        .card.mushroom .text.single {
          align-self: center;
          margin: 0;
          padding-bottom: 0;
        }
        .card.mushroom .end { padding: 0 4px 0 0; }
        .card.mushroom .bar { left: 67px; right: 16px; bottom: 6px; }
        @media (prefers-reduced-motion: no-preference) {
          .dot { transition: left 0.6s ease; }
        }
      </style>
      <div class="card" tabindex="0" role="button">
        <div class="pill">
          <div class="icon"></div>
          <div class="text"></div>
          <div class="end"></div>
          <div class="bar"></div>
        </div>
      </div>`;
    const $ = (s) => this.shadowRoot.querySelector(s);
    this._card = $(".card");
    this._icon = $(".icon");
    this._text = $(".text");
    this._end = $(".end");
    this._bar = $(".bar");
    this._card.addEventListener("click", (e) => {
      this._onTap();
      if (e.detail) this._card.blur(); // pointer/touch click: don't keep focus
    });
    this.shadowRoot.addEventListener("pointerdown", () => this._card.classList.remove("kbd"), true);
    this.shadowRoot.addEventListener("keydown", (e) => { if (e.key === "Tab") this._card.classList.add("kbd"); }, true);
    this._card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._onTap();
      }
    });
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    const pool = [
      ...(Array.isArray(entities) ? entities : []),
      ...(Array.isArray(entitiesFallback) ? entitiesFallback : []),
      ...Object.keys(hass?.states || {}),
    ];
    const entity = pool.find((e) => detectMode(hass, e)) || "sensor.temperature";
    return { entity, mode: detectMode(hass, entity) || "temperature" };
  }

  static getEntitySuggestion(hass, entityId) {
    const mode = detectMode(hass, entityId);
    if (!mode) return null;
    return {
      config: {
        type: `custom:${CARD_TAG}`,
        entity: entityId,
        mode,
      },
    };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Set `entity` to a numeric sensor.");
    const mode = config.mode || "auto";
    if (mode !== "auto" && !PRESETS[mode]) {
      throw new Error(`\`mode\` must be one of: auto, ${Object.keys(PRESETS).join(", ")}.`);
    }
    this._config = { tap_action: { action: "more-info" }, ...config, mode };
    this._key = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    if (this._config?.card_style === "mushroom") {
      return { columns: 12, rows: "auto", min_columns: 6 };
    }
    return { columns: 12, rows: 1, min_columns: 6, min_rows: 1 };
  }

  _mode() {
    return resolveMode(this._hass, this._config);
  }

  _textValue(spec) {
    if (spec === undefined || spec === null || spec === "") return "";
    const s = String(spec);
    if (ENTITY_ID.test(s) && this._hass?.states[s]) {
      const st = this._hass.states[s].state;
      return UNAVAILABLE.includes(st) ? "" : String(st);
    }
    return s;
  }

  _sizeValue(spec) {
    if (spec === undefined || spec === null || spec === "") return "";
    const s = String(spec);
    const st = ENTITY_ID.test(s) ? this._hass?.states[s] : null;
    if (!st) return ENTITY_ID.test(s) ? "" : s; // plain text fallback, empty if entity missing
    if (UNAVAILABLE.includes(st.state)) return "";
    const n = parseFloat(st.state);
    if (!Number.isFinite(n)) return String(st.state);
    const unit = st.attributes?.unit_of_measurement;
    return [String(Number(n.toFixed(1))), unit].filter(Boolean).join(" ");
  }

  _color(spec) {
    if (!spec) return null;
    if (COLOR_MAP[spec]) {
      return COLOR_MAP[spec];
    }
    if (ENTITY_ID.test(spec) && this._hass?.states[spec]) {
      const s = this._hass.states[spec].state;
      return UNAVAILABLE.includes(s) ? null : s;
    }
    return spec;
  }

  _num(spec) {
    if (spec === undefined || spec === null || spec === "") return null;
    if (typeof spec === "number") return spec;
    const n = Number(spec);
    if (!Number.isNaN(n)) return n;
    const st = this._hass?.states[spec];
    if (st) {
      const f = parseFloat(st.state);
      if (Number.isFinite(f)) return f;
    }
    return null;
  }

  _thresholds(preset) {
    const t = this._config.thresholds || {};
    const out = {};
    for (const key of THRESHOLD_KEYS) out[key] = this._num(t[key]) ?? preset.thresholds[key];
    return out;
  }

  _compareIds() {
    const list = this._config.compare_entities;
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.includes(this._config.entity) ? list : [...list, this._config.entity];
  }

  _compute() {
    const cfg = this._config;
    const hass = this._hass;
    const mode = this._mode();
    const preset = PRESETS[mode];
    const stateObj = hass?.states[cfg.entity];
    const labels = Array.isArray(cfg.labels) && cfg.labels.length === 5 ? cfg.labels : preset.labels;
    
    const zoneSpecs = [
      cfg.zone_1 ?? cfg.zone_colors?.[0] ?? preset.zones[0],
      cfg.zone_2 ?? cfg.zone_colors?.[1] ?? preset.zones[1],
      cfg.zone_3 ?? cfg.zone_colors?.[2] ?? preset.zones[2],
      cfg.zone_4 ?? cfg.zone_colors?.[3] ?? preset.zones[3],
      cfg.zone_5 ?? cfg.zone_colors?.[4] ?? preset.zones[4],
    ];
    const zones = zoneSpecs.map((z) => this._color(z) || COLOR_MAP.gray);
    const gray = this._color("gray") || COLOR_MAP.gray;

    const raw = stateObj ? parseFloat(stateObj.state) : NaN;
    const valid = Number.isFinite(raw);

    const { very_low: vl, low, high, very_high: vh } = this._thresholds(preset);

    let lo = this._num(cfg.scale_min) ?? preset.scale_min;
    let hi = this._num(cfg.scale_max) ?? preset.scale_max;
    if (!(hi > lo)) {
      lo = preset.scale_min;
      hi = preset.scale_max;
    }

    const pos = (x) => clamp(((x - lo) / (hi - lo)) * 100, 0, 100);
    const stops = [0, pos(vl), pos(low), pos(high), pos(vh), 100];

    let idx = -1;
    if (valid) idx = raw < vl ? 0 : raw < low ? 1 : raw <= high ? 2 : raw <= vh ? 3 : 4;
    const status = idx >= 0 && cfg.show_status !== false ? labels[idx] : "";
    const color = valid ? zones[idx] || gray : gray;

    let isMin = false;
    let isMax = false;
    if (cfg.show_min_max === true && valid && hass) {
      const vals = this._compareIds()
        .map((id) => parseFloat(hass.states[id]?.state))
        .filter((n) => Number.isFinite(n));
      if (vals.length > 1) {
        const mn = Math.min(...vals);
        const mx = Math.max(...vals);
        if (mn !== mx) {
          isMin = raw === mn;
          isMax = raw === mx;
        }
      }
    }

    const unit = cfg.unit ?? stateObj?.attributes?.unit_of_measurement ?? preset.unit;
    const decimals = cfg.decimals ?? preset.decimals;

    const bar =
      "linear-gradient(to right," +
      zones
        .map((z, i) => {
          const c = `color-mix(in srgb, ${z} 40%, transparent)`;
          return `${c} ${stops[i].toFixed(2)}%, ${c} ${stops[i + 1].toFixed(2)}%`;
        })
        .join(",") +
      ")";

    const typeBadge =
      cfg.show_badge === false
        ? ""
        : mode === "battery"
          ? this._textValue(cfg.battery_type)
          : mode === "disk"
            ? this._sizeValue(cfg.disk_size)
            : "";

    const icon =
      cfg.icon ??
      (valid && preset.dynamicIcon ? preset.dynamicIcon(raw) : null) ??
      stateObj?.attributes?.icon ??
      preset.icon;

    return {
      name: cfg.name ?? stateObj?.attributes?.friendly_name ?? cfg.entity,
      icon,
      typeBadge,
      status,
      value: valid ? [raw.toFixed(decimals), unit].filter(Boolean).join(" ") : "--",
      color,
      bar,
      dot: valid ? pos(raw) : null,
      extreme: isMin ? cfg.min_icon ?? preset.minIcon : isMax ? cfg.max_icon ?? preset.maxIcon : null,
      showBar: cfg.show_bar !== false,
      cardStyle: cfg.card_style === "mushroom" ? "mushroom" : "bubble",
    };
  }

  _render() {
    if (!this._config || !this._hass) return;
    const m = this._compute();
    const key = JSON.stringify(m);
    if (key === this._key) return;
    this._key = key;

    this._card.style.setProperty("--ssc-color", m.color);
    this._card.style.setProperty("--ssc-bar", m.bar);
    this._icon.innerHTML = `<ha-icon icon="${esc(m.icon)}"></ha-icon>`;
    this._text.innerHTML = `<div class="name">${esc(m.name)}</div><div class="status">${esc(m.status)}</div>`;
    this._text.classList.toggle("single", !m.status);
    this._end.innerHTML =
      (m.extreme ? `<div class="extreme"><ha-icon icon="${esc(m.extreme)}"></ha-icon></div>` : "") +
      (m.typeBadge ? `<div class="type">${esc(m.typeBadge)}</div>` : "") +
      `<div class="value">${esc(m.value)}</div>`;
    
    this._card.classList.toggle("mushroom", m.cardStyle === "mushroom");
    this._card.classList.toggle("nobar", !m.showBar);
    this._bar.hidden = !m.showBar;
    this._bar.innerHTML = m.showBar && m.dot !== null ? `<div class="dot" style="left:${m.dot.toFixed(2)}%"></div>` : "";
    
    this._card.setAttribute(
      "aria-label",
      [m.name, m.value, m.status, m.typeBadge].filter(Boolean).join(", ")
    );
  }

  _fire(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  _onTap() {
    const a = this._config.tap_action || { action: "more-info" };
    const hass = this._hass;
    const entityId = a.entity || this._config.entity;
    switch (a.action) {
      case "navigate":
        if (!a.navigation_path) return;
        if (a.navigation_replace) history.replaceState(null, "", a.navigation_path);
        else history.pushState(null, "", a.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !!a.navigation_replace } }));
        break;
      case "more-info":
        this._fire("hass-more-info", { entityId });
        break;
      case "toggle":
        hass.callService("homeassistant", "toggle", { entity_id: entityId });
        break;
      case "perform-action":
      case "call-service": {
        const svc = a.perform_action || a.service;
        if (!svc) return;
        const [domain, service] = svc.split(".");
        hass.callService(domain, service, a.data || a.service_data || {}, a.target);
        break;
      }
      case "url":
        if (a.url_path) window.open(a.url_path, "_blank");
        break;
      default:
        break;
    }
  }
}

// ---------- Visual editor ----------
const EDITOR_LABELS = {
  entity: "Sensor",
  mode: "Mode",
  name: "Name",
  icon: "Icon",
  show_min_max: "Show lowest / highest badge",
  compare_entities: "Sensors to compare",
  min_icon: "Minimum badge icon",
  max_icon: "Maximum badge icon",
  battery_type: "Battery type (text or entity ID)",
  disk_size: "Total disk size sensor (optional)",
  tap_action: "Tap action",
  thresholds: "Thresholds",
  very_low: "Very low (below)",
  low: "Low (below)",
  high: "High (above)",
  very_high: "Very high (above)",
  zone_1: "Zone 1 (Very low) color",
  zone_2: "Zone 2 (Low) color",
  zone_3: "Zone 3 (Normal) color",
  zone_4: "Zone 4 (High) color",
  zone_5: "Zone 5 (Very high) color",
  unit: "Unit override",
  decimals: "Decimals",
  scale_min: "Scale minimum",
  scale_max: "Scale maximum",
  show_badge: "Show badge",
  show_status: "Show status text",
  show_bar: "Show bottom zone bar",
  card_style: "Card style (icon, icon box and borders)",
};

const MODE_OPTIONS = [
  { value: "auto", label: "Auto (detect from sensor)" },
  { value: "temperature", label: "Temperature" },
  { value: "humidity", label: "Humidity" },
  { value: "co2", label: "CO2" },
  { value: "pm25", label: "PM2.5" },
  { value: "pm10", label: "PM10" },
  { value: "aqi", label: "Air quality index" },
  { value: "battery", label: "Battery" },
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" },
  { value: "disk", label: "Disk usage" },
  { value: "custom", label: "Custom" },
];

const sensorSelector = (mode, extra = {}) => {
  const dc = MODE_DEVICE_CLASS[mode];
  return { entity: { domain: "sensor", ...(dc ? { device_class: dc } : {}), ...extra } };
};

const getEditorSchema = (config, hass) => {
  const mode = config.mode || "auto";
  const showMinMax = config.show_min_max === true;
  const resolved = resolveMode(hass, config);
  const isBattery = resolved === "battery";
  const isDisk = resolved === "disk";

  return [
    { name: "entity", required: true, selector: sensorSelector(mode) },
    { name: "mode", selector: { select: { mode: "dropdown", options: MODE_OPTIONS } } },
    { name: "name", selector: { text: {} } },
    { name: "icon", selector: { icon: {} } },
    ...(isBattery ? [{ name: "battery_type", selector: { text: {} } }] : []),
    ...(isDisk ? [{ name: "disk_size", selector: { entity: { domain: "sensor" } } }] : []),
    ...(resolved === "battery" || resolved === "disk"
      ? [{ name: "show_badge", selector: { boolean: {} } }]
      : []),
    { name: "tap_action", selector: { ui_action: {} } },
    {
      type: "expandable",
      name: "thresholds",
      title: "Thresholds",
      schema: [
        { name: "disclaimer", type: "label", label: "(number or entity ID; empty uses defaults)" },
        { name: "very_low", selector: { text: {} } },
        { name: "low", selector: { text: {} } },
        { name: "high", selector: { text: {} } },
        { name: "very_high", selector: { text: {} } },
      ],
    },
    {
      type: "expandable",
      name: "colors_section",
      title: "Colors",
      flatten: true,
      schema: [
        { name: "zone_1", selector: { text: {} } },
        { name: "zone_2", selector: { text: {} } },
        { name: "zone_3", selector: { text: {} } },
        { name: "zone_4", selector: { text: {} } },
        { name: "zone_5", selector: { text: {} } },
      ],
    },
    {
      type: "expandable",
      name: "display_section",
      title: "Display settings",
      flatten: true,
      schema: [
        {
          name: "card_style",
          selector: {
            select: {
              mode: "dropdown",
              options: [
                { value: "bubble", label: "Bubble" },
                { value: "mushroom", label: "Mushroom" },
              ],
            },
          },
        },
        { name: "show_status", selector: { boolean: {} } },
        { name: "show_bar", selector: { boolean: {} } },
        { name: "unit", selector: { text: {} } },
        { name: "decimals", selector: { number: { min: 0, max: 3, mode: "box" } } },
        { name: "scale_min", selector: { number: { mode: "box" } } },
        { name: "scale_max", selector: { number: { mode: "box" } } },
      ],
    },
    {
      type: "expandable",
      name: "comparison_section",
      title: "Comparison",
      flatten: true,
      schema: [
        { name: "show_min_max", selector: { boolean: {} } },
        ...(showMinMax
          ? [
              { name: "compare_entities", selector: sensorSelector(mode, { multiple: true }) },
              { name: "min_icon", selector: { icon: {} } },
              { name: "max_icon", selector: { icon: {} } },
            ]
          : []),
      ],
    },
  ];
};

const prune = (obj) => {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = prune(v);
      const empty =
        p === undefined ||
        p === null ||
        p === "" ||
        (Array.isArray(p) && p.length === 0) ||
        (typeof p === "object" && !Array.isArray(p) && Object.keys(p).length === 0);
      if (!empty) out[k] = p;
    }
    return out;
  }
  return obj;
};

class SensorStatusCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    this._update();
  }

  _update() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = prune({ ...this._config, ...ev.detail.value });
        if (config.card_style === "bubble") delete config.card_style;
        if (config.show_badge === true) delete config.show_badge;
        if (config.show_status === true) delete config.show_status;
        if (config.show_bar === true) delete config.show_bar;
        if (config.mode === "auto") delete config.mode;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = getEditorSchema(this._config, this._hass);
    this._form.data = { mode: "auto", show_badge: true, show_status: true, show_bar: true, card_style: "bubble", ...this._config };
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, SensorStatusCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, SensorStatusCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: CARD_NAME,
    description:
      "Any numeric sensor as a status row: temperature, humidity, air quality, battery, CPU, RAM, disk or custom, with a five-zone bar and lowest/highest badge.",
    preview: true,
    getEntitySuggestion: (hass, entityId) => SensorStatusCard.getEntitySuggestion(hass, entityId),
  });
}

console.info(`%c SENSOR-STATUS-CARD %c v${CARD_VERSION} `, "color:white;background:#0A84FF;font-weight:700", "color:#0A84FF;background:white");
