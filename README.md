# Sensor Status Card

A single-row Lovelace card that turns any numeric sensor into a five-zone status row. It shows an icon, the name, a status label, the value, and a colored zone bar with a position dot. Optionally it adds a lowest / highest badge across a group of sensors and, in battery mode, a battery type badge.

One card covers temperature, humidity, air quality (CO2, PM2.5, PM10, AQI), battery, CPU and RAM, plus a `custom` mode for anything else.

> **Status:** beta (`v0.1.0-beta`). Requires Home Assistant 2026.6 or newer for the "By entity" Community suggestion. The card itself works on any recent version.

## Features

- Ten presets with sensible labels, colors, scales and thresholds.
- Automatic mode detection from the sensor's device class (or CPU/RAM keywords in the name).
- The same four threshold names for every mode.
- Battery icon that follows the charge level, plus an optional battery type badge.
- Optional lowest / highest badge across a group of sensors, switched on with one toggle.
- Visual editor, with a sensor picker that filters by device class. Fields only appear when they apply.
- Suggested in the card picker's **By entity** tab, under **Community**.
- Custom labels, zone colors, scale, decimals, unit and tap action.

## Installation

1. Copy `sensor-status-card.js` to your Home Assistant `config/www/` folder.
2. Go to **Settings → Dashboards → ⋮ → Resources → Add resource**.
3. Set the URL to `/local/sensor-status-card.js` and the type to **JavaScript module**.
4. Hard-refresh the browser (Ctrl+Shift+R). If you update the file later, add a version to the URL (e.g. `/local/sensor-status-card.js?v=2`) to bypass the cache.
5. Check the browser console for `SENSOR-STATUS-CARD v0.1.0-beta`.

## Quick start

Add a card from the UI, or use YAML:

```yaml
type: custom:sensor-status-card
entity: sensor.living_room_temperature
```

With no `mode`, the card detects it from the sensor. Set `mode` explicitly if you want to be sure:

```yaml
type: custom:sensor-status-card
entity: sensor.hallway_battery
mode: battery
```

## Modes

| Mode | Used for | Unit | Scale | Zone labels (zone 1 → 5) |
| --- | --- | --- | --- | --- |
| `temperature` | Room temperature | °C | 10 – 30 | Very cold, Cold, Comfortable, Warm, Very hot |
| `humidity` | Relative humidity | % | 10 – 90 | Very dry, Dry, Comfortable, Humid, Very humid |
| `co2` | Carbon dioxide | ppm | 400 – 2000 | Excellent, Good, Moderate, Poor, Very poor |
| `pm25` | PM2.5 | µg/m³ | 0 – 75 | Excellent, Good, Moderate, Poor, Very poor |
| `pm10` | PM10 | µg/m³ | 0 – 200 | Excellent, Good, Moderate, Poor, Very poor |
| `aqi` | Air quality index | none | 0 – 300 | Good, Moderate, Poor, Unhealthy, Very unhealthy |
| `battery` | Battery level | % | 0 – 100 | Critical, Low, Medium, Good, Full |
| `cpu` | CPU usage | % | 0 – 100 | Idle, Normal, Moderate, High, Critical |
| `ram` | Memory usage | % | 0 – 100 | Low, Normal, Moderate, High, Critical |
| `custom` | Any other numeric sensor | none | 0 – 100 | Very low, Low, Normal, High, Very high |

### Auto-detection

When `mode` is omitted or set to `auto`, the card picks a mode like this:

1. If the sensor has a device class, it maps `temperature`, `humidity`, `battery`, `carbon_dioxide` (→ `co2`), `pm25`, `pm10` and `aqi` to the matching mode.
2. If there is no device class, a sensor with a `%` unit (or no unit) whose entity ID or name contains `cpu` / `processor` is `cpu`, and one containing `ram` / `memory` / `mem` / `swap` is `ram`. These are whole-word matches, so "program" does not count as "ram".
3. Anything else falls back to `custom`.

## Zones and thresholds

Every mode has five zones separated by four thresholds. They are named after the zone they bound:

| Key | Rule |
| --- | --- |
| `very_low` | Values **below** this are in zone 1 |
| `low` | Values **below** this are in zone 2 |
| `high` | Values **above** this are in zone 4 |
| `very_high` | Values **above** this are in zone 5 |

Values between `low` and `high` (inclusive) are in zone 3.

The names describe where the value sits, not whether that is good or bad. Each preset supplies its own labels and colors, so a low battery is red while a low temperature is blue.

Each threshold can be a number or a sensor entity ID. Leave one out to keep the preset default.

```yaml
type: custom:sensor-status-card
entity: sensor.hallway_battery
mode: battery
thresholds:
  very_low: 15
  low: 30
```

### Default thresholds

| Mode | `very_low` | `low` | `high` | `very_high` |
| --- | --- | --- | --- | --- |
| `temperature` | 18 | 20 | 25 | 28 |
| `humidity` | 30 | 40 | 55 | 60 |
| `co2` | 600 | 800 | 1000 | 1500 |
| `pm25` | 5 | 12 | 35 | 55 |
| `pm10` | 15 | 45 | 100 | 150 |
| `aqi` | 51 | 101 | 150 | 200 |
| `battery` | 10 | 25 | 60 | 90 |
| `cpu` | 15 | 40 | 75 | 90 |
| `ram` | 30 | 60 | 85 | 95 |
| `custom` | 20 | 40 | 60 | 80 |

The air quality and battery values are approximations of common guideline breakpoints (loosely based on WHO and EPA ranges), so adjust them to the guidelines you prefer. The temperature preset is in °C.

## Lowest / highest badge

Switch on `show_min_max` to mark the lowest and highest sensor of a group with a small icon next to the value. List the sensors to compare in `compare_entities` and repeat the same list on each card in the group.

```yaml
type: custom:sensor-status-card
entity: sensor.bedroom_co2
mode: co2
show_min_max: true
compare_entities:
  - sensor.office_co2
  - sensor.bedroom_co2
  - sensor.living_room_co2
```

- It is off by default. While it is off, `compare_entities` is ignored, and the visual editor hides the comparison field.
- The card's own sensor is always included in the comparison.
- If all compared values are equal, no badge is shown.
- Override the badge icons with `min_icon` and `max_icon`.

## Battery type badge

In `battery` mode you can show a second, optional badge to the left of the percentage with the battery type (for example `CR2032` or `2 x AAA`). Set `battery_type` to either plain text or an entity ID:

```yaml
# Plain text
type: custom:sensor-status-card
entity: sensor.door_sensor_battery
mode: battery
battery_type: CR2032
```

```yaml
# From an entity: the badge shows the entity's state
type: custom:sensor-status-card
entity: sensor.door_sensor_battery
mode: battery
battery_type: sensor.door_sensor_battery_type
```

- If the value matches an existing entity ID, the card shows that entity's state. Otherwise it shows the text as written.
- If the entity is `unknown` or `unavailable`, or `battery_type` is empty, no badge is shown.
- The option only applies in battery mode, and the visual editor only shows the field there. This includes `auto` mode when the sensor has the `battery` device class.
- Long text is shortened with an ellipsis.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | string | **required** | A `sensor.*` entity with a numeric state. |
| `mode` | string | `auto` | One of `auto`, `temperature`, `humidity`, `co2`, `pm25`, `pm10`, `aqi`, `battery`, `cpu`, `ram`, `custom`. |
| `name` | string | friendly name | Name shown on the card. |
| `icon` | string | preset or sensor icon | Overrides the icon. For `battery`, setting this turns off the charge-level icon. |
| `unit` | string | sensor unit, then preset | Unit shown after the value. Use `""` to hide it. |
| `decimals` | number | preset | Decimal places for the value. |
| `scale_min` | number or entity | preset | Left end of the zone bar. |
| `scale_max` | number or entity | preset | Right end of the zone bar. Must be greater than `scale_min`, otherwise the preset scale is used. |
| `thresholds` | object | preset | `very_low`, `low`, `high`, `very_high`. Each is a number or an entity ID. |
| `labels` | list of 5 | preset | Five status labels, zone 1 to zone 5. |
| `zone_colors` | list of 5 | preset | Five colors for the zones (see [Colors](#colors)). |
| `show_min_max` | boolean | `false` | Show the lowest / highest badge. |
| `compare_entities` | list | none | Sensors to compare. Only used when `show_min_max` is `true`. |
| `min_icon` | string | preset | Badge icon for the lowest sensor. |
| `max_icon` | string | preset | Badge icon for the highest sensor. |
| `battery_type` | string | none | Battery mode only. Text or an entity ID shown as a badge left of the value. |
| `color_map` | object | none | Map of label to color, e.g. `Warm: purple`. |
| `color_map_entity` | entity | none | Sensor whose `colors` attribute supplies a label-to-color map. |
| `default_color` | string | gray | Color used when the value is unavailable. |
| `tap_action` | object | `more-info` | Standard Home Assistant tap action (`more-info`, `navigate`, `toggle`, `perform-action`, `url`). |

### Colors

Colors can be a name (`gray`, `cyan`, `blue`, `green`, `lime`, `yellow`, `orange`, `red`, `purple`), any CSS color (`#ff8800`, `rgb(...)`), or an entity ID whose state is a color.

## Examples

### Air quality with a lowest / highest badge

```yaml
type: vertical-stack
cards:
  - type: custom:sensor-status-card
    entity: sensor.office_co2
    mode: co2
    name: Office
    show_min_max: true
    compare_entities: &rooms
      - sensor.office_co2
      - sensor.bedroom_co2
      - sensor.living_room_co2
  - type: custom:sensor-status-card
    entity: sensor.bedroom_co2
    mode: co2
    name: Bedroom
    show_min_max: true
    compare_entities: *rooms
```

### Battery with a type badge

```yaml
type: custom:sensor-status-card
entity: sensor.door_sensor_battery
mode: battery
name: Front door
battery_type: sensor.door_sensor_battery_type
```

### Server CPU with custom labels

```yaml
type: custom:sensor-status-card
entity: sensor.server_cpu_usage
mode: cpu
name: Server CPU
labels: [Idle, Fine, Busy, Heavy, Overloaded]
thresholds:
  very_low: 10
  low: 35
  high: 70
  very_high: 90
```

### Any other sensor with the custom mode

```yaml
type: custom:sensor-status-card
entity: sensor.wifi_signal
mode: custom
name: Wi-Fi signal
icon: mdi:wifi
unit: dBm
scale_min: -100
scale_max: -30
labels: [Unusable, Weak, OK, Good, Excellent]
zone_colors: [red, orange, yellow, lime, green]
thresholds:
  very_low: -85
  low: -75
  high: -60
  very_high: -50
```

### Custom tap action

```yaml
type: custom:sensor-status-card
entity: sensor.hallway_battery
mode: battery
tap_action:
  action: navigate
  navigation_path: /config/devices/dashboard
```

## Card picker suggestions

On Home Assistant 2026.6 or newer, the card appears under **Community** in the **By entity** tab when you select a matching sensor, with `mode` set automatically. It is suggested for:

- sensors with a `temperature`, `humidity`, `battery`, `carbon_dioxide`, `pm25`, `pm10` or `aqi` device class, and
- sensors without a device class whose name looks like CPU or RAM usage, with a `%` unit.

Sensors with any other device class are not suggested, but you can still add them from the **By card** tab with `mode: custom`.

### Troubleshooting

If the card does not appear, run this in the browser console, replacing the entity ID with your own:

```js
window.customCards
  .find((c) => c.type === "sensor-status-card")
  .getEntitySuggestion(document.querySelector("home-assistant").hass, "sensor.your_entity_id");
```

It should return `{ config: { type: "custom:sensor-status-card", entity: "...", mode: "..." } }`. A result of `null` means the sensor was not recognised.

## Known limitations

- Preset thresholds are in °C. Fahrenheit users should override `thresholds`, `scale_min` and `scale_max`.
- The card needs a numeric state. Non-numeric states show `--` with a gray bar.
- There is no VOC preset because units differ between sensors. Use `mode: custom` with your own thresholds.
