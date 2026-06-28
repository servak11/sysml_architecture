
# Technical Specification: SysML Block Definition Diagram (BDD) Web Editor

complete, self-contained functional specification for your SysML Block Definition Diagram (BDD) editor

copy and paste this markdown block directly into a new Gemini prompt window to instantly re-establish this development baseline

## 1. System Overview & Objective

The objective is to implement a single-file, production-ready SysML Block Definition Diagram (BDD) visual editor written exclusively in HTML5, CSS3, and vanilla JavaScript. The application runs entirely client-side, adopts a modern Dark Mode aesthetic, fits its work environment dynamically to the viewport window, and acts as a stateful diagraming tool without external dependencies.

---

## 2. Global UI Framework & Styling

### 2.1 Color Palette (Dark Theme CSS Variables)

* `--bg-color`: `#1e1e1e` (App framing context)
* `--canvas-bg`: `#2d2d2d` (Grid workspace backplane)
* `--border-color`: `#555` (Subtle frame structural split lines)
* `--text-color`: `#e0e0e0` (High contrast labels and geometry boundaries)
* `--accent-color`: `#007acc` (Interactive UI highlights)
* `--selected-color`: `#ff9900` (Focused attention indicator for blocks, lines, ports)
* `--danger-color`: `#ff3333` (Destructive action hover highlights)
* `--port-color`: `#4caf50` (Standard SysML flow port color)

### 2.2 Layout Composition

* **Fixed Icon Toolbar:** Positioned at the top (`height: 45px`, background `#111`). Contains a textless layout icon shortcut panel including:
* `↶` Undo (Disabled state variable)
* `🗑` Delete Selected (Disabled when nothing is focused)
* `＋` Scale Up Element (Disabled unless a Block element is selected)
* `－` Scale Down Element (Disabled unless a Block element is selected)


* **Canvas Vector Viewport:** Takes up the remaining vertical room (`height: calc(100vh - 45px)`). It features an infinite grid pattern via dual overlaying CSS `linear-gradient` declarations sized precisely at `20px 20px`. Scrolling bounds are locked via `overflow: hidden` to enable pan/drag coordination.

---

## 3. Element Definitions & Architecture

### 3.1 SysML Structural Blocks (`.block`)

* Rendered as an absolute-positioned DOM container (`z-index: 2`).
* Default geometric footprint initialized at `130px` width by `80px` height.
* Borders are configured at `2px solid var(--text-color)`. When targeted by selection flags, the style switches to `2px dashed var(--selected-color)`.
* **Inner Layout:** Displays a fixed text block string `«block»` in italics at the top center (`font-size: 10px`). Directly below is an editable title section element wrapper (`.text`, `font-size: 13px`, bold).

### 3.2 System Flow Ports (`.port`)

* Represented as explicit square layout indicators (`12px` by `12px`) embedded seamlessly on the bounding frame of their parent container.
* Styled with standard `var(--port-color)` values and masked with a `1px solid #fff` ring overlay.
* Z-index is locked at `10` to ensure interaction handlers intercept mouse events ahead of block drag surfaces.

### 3.3 Relational Connections

* Managed globally within a single flat vector overlay element layer (`<svg id="svg-layer">`).
* Connections use an advanced double-path composition inside a grouping block (`<g class="connection-wrapper">`):
1. An invisible underlying path tracking mask (`stroke-width: 12`, `fill: none`) to easily capture mouse click triggers.
2. An explicit visual connector lane (`stroke-width: 2`, `fill: none`) colored by default via `var(--text-color)`. Shifting to a highlighted selected layout converts this into a broken dash profile (`stroke-dasharray: 4`) mapped to `var(--selected-color)`.



---

## 4. Interaction Engine Rules & Finite State Machine

The interface must track user interaction exactly through the following input state logic patterns:

```
[ Canvas Surface Click ] ➔ Instantiates new Block centered on cursor (offset top by 45px)
[ Canvas Selection Clear ] ➔ Clicking raw background drops all current active selections

```

### 4.1 Strict Two-Stage Block Editing Protocol

1. **Stage 1 (First Click / MouseDown):** Activates a standard element transformation handle. Sets focus selection style to active (`.selected`). Pressing and moving the cursor tracks block transposition coordinates, dynamically shifting element `.style.left` and `.style.top`. Boundaries are clamped to prevent dragging elements off-canvas.
2. **Stage 2 (Second Click on an Already Selected Block):** Temporarily toggles text container mechanics (`pointer-events: auto`, `contentEditable: true`), programmatic element focus, and triggers a full string auto-selection selection command (`document.execCommand('selectAll')`). On an explicit `blur` event, the runtime checks if modifications occurred, updates database state tables, and reverts the element back to native protected view locks.

### 4.2 Proximity-Aware Border Interception (Port Handling)

* Clicking near block boundaries requires complex intersection detection. A margin boundary zone threshold is configured at exactly `10px`.
* When a `mousedown` registers inside this border zone, the system calculates the absolute distances to all existing port objects assigned to that specific block.
* **Decision Matrix:**
* **Port Select Mode:** If the click event lands within a proximity circle radius of **14 pixels** relative to any pre-existing port center point, **do not create a port**. Instead, immediately redirect execution to select that port, or complete an active connection sequence.
* **Port Create Mode:** If the zone click falls outside the 14-pixel safety window, instantiate a new port. Mathematically determine the nearest structural face edge (`left`, `right`, `top`, or `bottom`), bind its relative attachment vector position using CSS percentage values, and automatically apply center compensation tracking logic (`calc(pct% - 6px)`).



### 4.3 Connection Vector Flow Mapping

* Clicking a single port flags it as the current sequence origin.
* Clicking an alternative, secondary target port draws a new relation line, wiping active selection buffers clean.
* Lines are drawn dynamically using explicit cubic Bezier vector definitions (`M x1 y1 C cx1 cy1, cx2 cy2, x2 y2`). Control vectors project outwards by a constant normal distance offset of `45px` based on the designated target anchor face edge parameters (`left`, `right`, `top`, `bottom`) to create polished, curved orthogonal schematics.

### 4.4 Toolbar Geometry Modifiers

* Selecting an active block unlocks the custom scale toolbar button pathways (`＋` and `－`).
* Clicking `＋` increments element size by `+20px` width and `+15px` height.
* Clicking `－` decrements element size by `-20px` width and `-15px` height (enforcing safe design bounds of `90px` width and `60px` height minimums).
* Any resize operation forces an immediate visual update to all connected vector lines.

---

## 5. Persistence & State Change Engineering

### 5.1 Local Storage State Engine (`localStorage`)

The application operates as a state-preserving platform across page refreshes. Every element change must automatically sync to browser cache memory:

* **Storage Target Key:** `sysml_bdd_diagram_state`
* **Payload Profile:** A complete structural JSON object parsing configuration values for tracking primary auto-increment indices (`blockCounter`, `portCounter`, `connCounter`), detailed positional information objects (`blocks`), individual node connections (`ports`), and relationship path records (`connections`).
* **Instantiation Protocol:** During the initialization window lifecycle event (`DOMContentLoaded`), the engine automatically queries storage keys. If a valid configuration payload string exists, the editor reads the schema, clears default DOM parameters, loops through tracking keys, and rebuilds the interactive diagram view.

### 5.2 Transaction History Snapshot Architecture (Undo)

* The application tracks changes via an internal state stack array array (`historyStack`).
* Before any mutation occurs (including block placement, connection routing, label revisions, resizing, or deletion passes), a snapshot of the serialized database state is deep-cloned and appended to the history array stack.
* Clicking the `↶ Undo` interface button pops the top snapshot state payload back into memory, rebuilds the workspace layout cleanly, and saves the updated layout to `localStorage`. If the history tracking array stack empties out entirely, the interface explicitly locks out button interaction states.

