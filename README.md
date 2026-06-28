This functional specification acts as a complete "blueprint."
You can copy and paste this entire markdown document into a fresh Gemini chat window.
(or any other LLM) to instantly recreate the exact features, rules, and UI layout we have developed.

---

# Functional Specification: System Engineering (SysML) Parallel BDD/IBD Modeling Tool

## 1. Vision & Architecture Overview

The objective is to create a lightweight, responsive, single-file HTML5/JavaScript systems engineering diagramming editor. The tool models system architectures using two fundamental, parallel SysML (Systems Modeling Language) views:

1. **Block Definition Diagram (BDD):** The master vocabulary dictionary defining core types (`«block»`).
2. **Internal Block Diagram (IBD):** The internal assembly view of a specific selected block, displaying its structural instances (`«part»`) and how they interface.

### Parallel Data Repository Model

Rather than a simple visual toggle, the application must maintain isolated parallel state data layers. Elements inside a block's child IBD exist independently from the top-level master BDD canvas, allowing hierarchical engineering design traversal.

---

## 2. Technical Stack & UI Design Requirements

* **Delivery Format:** A single, self-contained, valid HTML5 file combining structure, CSS styling, and JavaScript logic.
* **Styling Theme:** High-contrast Dark Mode.
* `Backgrounds:` Deep Charcoal (`#1e1e1e`), canvas workspaces (`#2d2d2d`) featuring a clean $20\text{px}\times20\text{px}$ alignment grid.
* `Elements:` Dark Slate (`#252526`) with crisp off-white borders (`#e0e0e0`).
* `Accents:` BDD context tags in Standard Blue (`#007acc`), IBD context tags in Amethyst Violet (`#8a2be2`), active selections highlighted in Vibrant Amber (`#ff9900`), and connection ports rendered in Forest Green (`#4caf50`).


* **Viewport Adaptability:** Responsive flex layout prioritizing desktop mouse tracking and unified layout protection for mobile/tablet touchscreen gestures. `touch-action: none` must be declared globally to suppress default device scrolling or pinching while dragging objects.

---

## 3. Component Interaction & Input Rules

### A. Element Selection Lifecycle

* **Rule:** **First Click/Tap Selects; Second Click/Tap Edits.**
* Clicking a passive block or part strictly sets its selection state (applying a dashed Amber border and enabling toolbar utility scaling updates).
* Inline text alteration is locked on the initial selection event. Only when an already-selected element receives its secondary click event does the inner string layer dynamically toggle `contentEditable="true"`, shift pointer events to catch cursor focus, and cleanly select its entire text body for rewriting. On text component `blur`, focus parameters normalize.

### B. Proximity-Based Port Safety Logic

* Mousedown/Touchstart events directed exactly over the peripheral boundary (outer $12\text{px}$ frame) of an active block generate a structural Port interface.
* **Overlap Validation Rule:** Prior to initializing a new port object, the engine must run a geometric distance calculation (radius check threshold set to **16 pixels**) relative to all pre-existing ports bound to that element. If a click falls inside this overlap range, the creation of a new port is aborted; the system instead routes the click as a **Port Selection / Connector Routing** action on the existing port.

### C. Touch Screen Responsiveness

* All component interactions (dragging blocks, border-tapping to generate ports, and line selections) must be explicitly polyfilled with touch event alternatives (`touchstart`, `touchmove`, `touchend`).
* Viewport panning must be intercepted and suppressed during active drag operations to prevent element stuttering or unexpected text selection jumps on mobile interfaces.

---

## 4. Routing Engine Specification

* Connections utilize an SVG overlay rendering layer.
* Connections must map port to port using smooth Cubic Bézier paths ($C$ commands).
* Path calculation determines control vector directionality based on the exact boundary edge location (`left`, `right`, `top`, `bottom`) of the host port, applying an automatic $45\text{px}$ orthogonal protrusion offset before plotting curves to avoid path clipping across block bodies.
* To facilitate reliable mobile tapping on fine 2px links, every visible line must be wrapped within a wider, transparent SVG hit-box overlay (`stroke-width: 14px`) optimized to pass interactive pointer-events seamlessly.

---

## 5. Storage, History, & Schema Definition

The application tracks data mutations by capturing state snapshots into a deep-cloned JSON model committed automatically to browser `localStorage` on any creation, relocation, deletion, or text adjustment.

### Underlying JSON Storage Schema

```json
{
  "currentView": "BDD", 
  "bdd": {
    "blockCounter": 1,
    "portCounter": 1,
    "connCounter": 0,
    "blocks": {
      "node_0": { "left": "150px", "top": "120px", "width": "130px", "height": "80px", "text": "PowerSupply", "ports": ["port_0"] }
    },
    "ports": {
      "port_0": { "blockId": "node_0", "pctX": 100, "pctY": 50, "edge": "right" }
    },
    "connections": {}
  },
  "ibds": {
    "node_0": {
      "blockCounter": 2,
      "portCounter": 2,
      "connCounter": 1,
      "blocks": {
        "node_0": { "left": "50px", "top": "80px", "width": "110px", "height": "70px", "text": "Transformer", "ports": ["port_1"] }
      },
      "ports": {
        "port_1": { "blockId": "node_0", "pctX": 100, "pctY": 50, "edge": "right" }
      },
      "connections": {}
    }
  }
}

```

---

## 6. Prompting Instructions to Recreate the Tool

If you want to spin up this application in a new chat session, use the following execution prompt:

> **Prompt for Initialization:**
> Please generate a single-file dark-mode SysML modeling application supporting parallel BDD and IBD environments adhering exactly to the provided Functional Specification. Ensure that the core state repository cleanly isolates the BDD definition tree from nested IBD assemblies. Embed the strict two-click selection-to-edit logic for nodes, apply the 16px port collision avoidance test on the borders, and build the custom SVG Cubic Bézier line routing logic. Deliver full desktop pointer tracking alongside mobile touch gesture polyfills. All configurations must be packed inside one block of clean, production-ready, un-truncated HTML5 code.


Here is the new functional specification chapter, formatted to integrate seamlessly into your existing blueprint document. It details the text parser, the grid alignment mechanics, and the interface requirements for the compilation engine.

---

## 7. Subsystem: Declarative SysML Script Compiling & Import Engine

### 7.1 Objective & Structural Scope

To allow seamless interoperability between textual modeling and the graphical canvas, the application includes a localized text compilation engine. This engine parses declarative SysML architecture code blocks, isolates system structures, and dynamically populates them as visual elements onto the master Block Definition Diagram (BDD) canvas without requiring page refreshes or external API dependencies.

---

### 7.2 Syntax Parsing Specifications

The compiler runs a non-destructive regular expression scanning routine over raw text inputs. It relies on a deterministic structural pattern to safely identify block elements while ignoring decorative language annotations like packages, comments, or attributes.

* **Target Compilation Pattern:** ```javascript
/(?:abstract\s+)?block\s+([A-Za-z0-9_]+)/g
```

```


* **Execution Logic:**
1. The engine reads the incoming string buffer line-by-line.
2. It matches instances of the keywords `block` or `abstract block` followed by a valid alpha-numeric identifier.
3. The matched identifier string is extracted as the canonical `text` property of the new node.
4. **Deduplication Constraint:** The compiler queries the active database arrays before spawning a node. If an element with the exact string name already exists on the canvas, the creation sequence for that specific block is safely bypassed to protect existing diagram modifications.



---

### 7.3 Smart Grid Matrix Spawning Layout

To prevent elements from stacking on top of each other when imported simultaneously, the engine automatically passes all newly compiled blocks through an algorithmic matrix layout routine. This organizes the structures into a clean grid on the Cartesian space of the BDD canvas.

| Layout Parameter | Engineering Metric | Purpose |
| --- | --- | --- |
| **Initial Origin Offset** | $X = 60\text{px}, Y = 60\text{px}$ | Prevents edge clipping against boundaries or toolbars. |
| **Horizontal Node Gap** | $160\text{px}$ | Ensures adequate space for side-mounted `StructuralPorts`. |
| **Vertical Node Gap** | $110\text{px}$ | Leaves clear vertical lanes for routing Cubic Bézier paths. |
| **Maximum Matrix Columns** | $\lfloor(\text{Canvas Width} - 60) / 160\rfloor$ | Dynamically adjusts grid column wrapping based on screen size. |

---

### 7.4 UI Layout & State Rules

* **The Script Console Panel:** A collapsible sidebar tracking the left margin (`width: 320px`). It features a toggle action to minimize or slide out of view, ensuring it never obstructs spatial diagram workflows.
* **Context Reset Invariance:** Activating the **"Compile & Import"** pipeline automatically updates the system state back to `modelState.currentView = 'BDD'`. This prevents users from accidentally loading high-level system vocabulary types directly inside a child Internal Block Diagram (IBD) part workspace.
* **Transactional History Baseline:** Before any imported blocks are rendered on the canvas, the engine calls a deep-copy snapshot function (`checkpoint()`). This backs up the current model array, allowing the entire import action to be completely reversed via the standard canvas **Undo (↶)** operation.
