# Svelte Seatmap Editor — Implementation Plan

## 1. Core Architecture Decision: Rendering Layer

This is the decision everything else depends on.

| Option | Verdict |
|---|---|
| Plain SVG + Svelte `{#each}` | ❌ Avoid. 1000+ DOM nodes with drag/rotate/selection causes layout thrashing and janky interaction. |
| Raw HTML5 Canvas 2D, hand-rolled | ⚠️ Viable, but you re-invent hit-testing, transformers, layering, hover states. Lots of boilerplate. |
| **Konva.js (via `svelte-konva` or direct API)** | ✅ **Recommended.** Purpose-built for exactly this (cinema/stadium seat pickers are a canonical Konva example). Gives you: Canvas-based rendering (fast at 1000+ nodes), built-in `Transformer` node (rotate/resize handles for free), built-in drag, layering, group selection, hit-graph for fast click detection, event system similar to DOM events. |
| PixiJS | ⚠️ Faster raw perf (WebGL) but more low-level — you build hit-testing/transformers yourself. Overkill unless you outgrow Konva. |

**Recommendation: Konva.js**, wrapped in Svelte components. It gets you rotate/select/multi-drag "for free" via `Konva.Transformer`, and its scene graph + `FastLayer` / caching options handle 1000+ shapes fine if you batch correctly (see Performance section).

Fallback plan: if Konva's Svelte bindings feel awkward, use Konva directly (imperative) inside a single Svelte component that owns a `<canvas>` — Svelte becomes the "chrome" (toolbars, panels, forms) while Konva owns the stage. This is actually the pattern I'd lean toward: **Svelte for UI shell, Konva imperative API for the canvas itself.**

---

## 2. Data Model (the JSON schema you'll export)

Design this early — it's the contract between editor, storage, and whatever consumes it at booking time.

Since there's no existing backend schema to match, this is designed so a **separate booking app** can consume it directly: every bookable thing has a stable `id`, a `status` enum, and a `zoneId` — that's the minimum a reservation UI needs to render seats and let a user pick one.

```
SeatMap
├── id, roomId, name, version
├── canvas: { width, height, unit, backgroundColor, gridSize, gridEnabled }
├── zones: [ { id, name, color, description } ]
├── elements: [ Element ]   // unified array, ordered by z-index

Element (discriminated union by "type"):
├── Seat        { id, type: "seat", x, y, rotation, width, height,
│                 zoneId, seatNumber, row, groupId,
│                 status: "available" | "unavailable" | "held",
│                 shape: "square" | "circle" }
│                 // "status" here is an editor-time DEFAULT only —
│                 // the booking app overlays live reservation state
│                 // (booked/selected/etc.) at render time, keyed by seat id.
├── Shape       { id, type: "rect"|"circle"|"polygon", x, y, rotation,
│                 width/height/radius/points, fill, stroke, strokeWidth, label? }
├── Text        { id, type: "text", x, y, rotation, content, fontSize, fontFamily, fill }
└── Group       { id, type: "group", x, y, rotation, childIds: [] }
    // "line of seats" / "2D array" as a movable unit
```

Key decisions baked in here:
- **Every element has `id, x, y, rotation`** — one uniform shape for the Transformer/selection/move/rotate logic to operate on regardless of element type.
- **Seats reference `zoneId`**, not zone name/color inline — zones are a separate lookup table so recoloring a zone is O(1).
- **`status` on a seat is an editor-time default** (e.g. mark a broken seat "unavailable" at design time), not live booking state. The booking app should treat this JSON as the static layout and merge in real-time reservation data (booked by whom, held in a checkout flow, etc.) keyed by `seat.id` — keeps the seatmap file itself simple and cache-able.
- **Groups** (line-of-seats, 2D-array-of-seats) are first-class so multi-select + move/rotate of a "row" is one operation, but individual seats inside remain addressable (for zone assignment, status, etc.) — store seats as flat entries with an optional `groupId`, rather than deeply nesting, so hit-testing/perf stays flat.
- **`roomId`** on the top-level object, since you confirmed one editor instance per room — the export is one JSON file per room, and a "Locations" page elsewhere presumably lists rooms and links to each editor instance.

---

## 3. Suggested File/Folder Structure

```
src/lib/seatmap/
├── SeatmapEditor.svelte        # top-level: layout, toolbar, panels
├── canvas/
│   ├── StageManager.js         # imperative Konva setup, owns Stage/Layers
│   ├── SeatRenderer.js         # seat shape factory + style-by-status/zone
│   ├── ShapeRenderer.js        # rect/circle/polygon factory
│   ├── TextRenderer.js
│   ├── SelectionManager.js     # Transformer wiring, multi-select box
│   └── ClipboardManager.js     # copy/paste logic
├── tools/
│   ├── AddSeatTool.js
│   ├── AddSeatLineTool.js
│   ├── AddSeatGridTool.js
│   ├── DrawShapeTool.js        # square/circle/polygon, shared drag-to-draw logic
│   └── TextTool.js
├── state/
│   ├── seatmapStore.js         # Svelte store: elements, zones, canvas config
│   ├── selectionStore.js       # selected element ids
│   ├── historyStore.js         # undo/redo (command pattern)
│   └── toolStore.js            # currently active tool / mode
├── panels/
│   ├── Toolbar.svelte
│   ├── ZonePanel.svelte        # create/edit/assign zones
│   ├── PropertiesPanel.svelte  # edit selected element(s) props
│   └── CanvasSettingsPanel.svelte  # width/height/grid
├── io/
│   ├── exportJSON.js
│   └── importJSON.js
└── utils/
    ├── geometry.js             # rotation math, grid snapping, bounds
    └── idGenerator.js
```

Svelte owns everything under `panels/` and top-level layout; everything under `canvas/` is Konva-imperative, driven by subscribing to the stores.

---

## 4. Build Order (Phased)

### Phase 0 — Skeleton
1. `SeatmapEditor.svelte` with a resizable `<div>` container and a Konva `Stage` + base `Layer` inside it mounted on `onMount`.
2. `seatmapStore` holding `{ canvas, zones, elements }`, initialized empty.
3. Canvas size controls (width/height inputs) wired to `stage.width()/height()` and store `canvas` config.

### Phase 1 — Single seat placement
4. "Add Seat" tool: click-to-place, seat = `Konva.Circle` or custom sprite (small circle + seat number text), pushed into `seatmapStore.elements`.
5. Render loop: subscribe to store, reconcile Konva nodes (diff by id — don't `destroy()`/recreate everything on every store change, see Perf section).
6. Basic seat styling by status (available/reserved/disabled) as a placeholder — real booking-state usage comes later.

### Phase 2 — Bulk seat creation
7. "Add Line of Seats" tool: modal/inline form for count, spacing, starting row/number, orientation → generates N seat elements with a shared `groupId`.
8. "Add 2D Array" tool: rows × cols, row/column spacing, numbering pattern (e.g. A1, A2… B1, B2…) → generates grid, also `groupId`-tagged.

### Phase 3 — Shape & text tools
9. Drag-to-draw for Rect and Circle (mousedown → track drag → mouseup finalizes shape).
10. Polygon tool: click to add vertices, double-click or Enter to close the shape (classic point-and-click polygon drawing).
11. Text tool: click to place, inline-editable text box (Konva doesn't do native text editing — overlay an HTML `<input>`/`<textarea>` positioned above the canvas during edit, matching the common Konva text-editing pattern).

### Phase 4 — Selection, move, rotate
12. Single click selects an element → attach `Konva.Transformer` to it (gives resize + rotate handles automatically).
13. Shift-click or drag-select rectangle → multi-select → attach Transformer to multiple nodes (Konva supports multi-node transformers) or wrap selection in a temporary `Konva.Group` for the duration of the transform.
14. Drag-to-move: native Konva draggable, but snap to grid if enabled.
15. Rotate: via Transformer's rotate handle; also expose a numeric "rotation" field in the Properties panel for precision.

### Phase 5 — Zones
16. `ZonePanel`: CRUD for zones (name + color).
17. Assign zone: with N seats selected, "Assign to Zone" dropdown in Properties panel → bulk-updates `zoneId` + visual fill color on selected seats.
18. Visual legend showing zone colors.

### Phase 6 — Clipboard & history
19. `Ctrl+C`: serialize selected elements (deep clone, keep relative positions) into `ClipboardManager` (in-memory, not real OS clipboard, to keep it reliable and JSON-shaped).
20. `Ctrl+V`: paste — new ids generated, offset by e.g. +20px from original so pasted items don't sit exactly on top, then auto-selected.
21. Undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`): command-pattern history store — every mutating action (add, delete, move, rotate, zone-assign, paste) pushes a `{do, undo}` pair.

### Phase 7 — Export/Import
22. `exportJSON.js`: serialize `seatmapStore` state to the schema in Section 2, trigger a file download (`Blob` + `URL.createObjectURL`) — this is the "ready for S3" artifact; actual upload is a later, separate step (just a `PUT` call once you're ready).
23. `importJSON.js`: validate + load a JSON file back into the stores (needed for editing existing maps, and useful for testing).

### Phase 8 — Performance pass
(details below — do this once the feature set is complete, informed by real profiling with 1000+ seats)

---

## 5. Selection / Move / Rotate — Konva-specific mechanics

- Keep **seats on their own Layer**, shapes/text on another, "UI overlay" (selection rectangle, Transformer) on a third. Konva redraws per-layer, so dragging a Transformer only repaints the UI layer, not the 1000-seat layer, if seats aren't being moved.
- Use `Konva.Transformer` with `nodes([...])` for multi-select — it handles the combined bounding box, rotate handle, and per-node transform math for you.
- For "select multiple → move as one," you don't need to reparent into a real Group permanently — Transformer dragging multiple nodes moves them all consistently already. Reserve actual `Group` nodes for things that should conceptually always move together (a placed "row of seats").
- Rectangular drag-select: track mousedown/mousemove/mouseup on the stage background, compute intersection of the drag rect with each seat's client rect (`Konva.Util.haveIntersection`), rather than iterating and doing expensive per-shape geometry by hand.

---

## 6. Performance Plan for 1000+ Seats

1. **Diff, don't rebuild.** Never `layer.destroyChildren()` + recreate on every state change. Keep a `Map<id, KonvaNode>` and only create/update/remove the nodes that actually changed.
2. **Batch draws.** Use `layer.batchDraw()` instead of `draw()`, and batch multiple element updates within one animation frame (`requestAnimationFrame` coalescing) rather than redrawing per store mutation.
3. **Separate static vs. active layers.** Seats not currently being dragged/transformed live on a layer you rarely redraw; the item being actively manipulated moves to a lightweight "drag layer" during the interaction (a standard Konva performance pattern) and merges back on drop.
4. **Simplify seat shapes.** A seat = one small `Circle`/`Rect` + optionally cached seat-number text; avoid seat = "group of 5 shapes" × 1000. If you want richer seat icons, pre-render the icon shapes into a single cached bitmap per status/zone combo (`node.cache()`), not fresh shape trees.
5. **Use `listening: false`** on decorative/non-interactive shapes (labels, background zone outlines) so Konva skips them in hit-graph calculations.
6. **Throttle Properties-panel reactivity.** Don't bind every seat's live x/y into Svelte reactive statements during drag — only sync store state on drag-end, and read live values imperatively from Konva during the drag itself.
7. **Virtualize only if needed.** At ~1000 seats, Konva + the above should hold 60fps without viewport virtualization. If you scale toward 5–10k, revisit with offscreen-canvas caching per layer or a switch to PixiJS/WebGL.

---

## 7. State Management Summary

- `seatmapStore` — single source of truth for exportable data (canvas config, zones, elements). This is *the* JSON.
- `selectionStore` — transient, not exported: currently selected element ids.
- `toolStore` — transient: current active tool (select / add-seat / draw-rect / draw-polygon / text / pan).
- `historyStore` — transient: undo/redo stack of commands, each command mutates `seatmapStore` and knows how to reverse itself.

Keep Konva nodes as a **derived, non-reactive cache** (`Map<id, Konva.Node>`) that a subscriber function reconciles against `seatmapStore` — don't put live Konva node instances into Svelte stores themselves (they're not serializable and you don't want Svelte's reactivity diffing them).

---

## 8. UI Layout (matched to your mockup)

Confirmed layout — building this as the actual target, not a rough sketch:

**Header bar:** app branding (left), nav links (Users / Locations / Events), account avatar (right) — this lives above/outside the seatmap editor component (app shell), not part of `SeatmapEditor.svelte` itself.

**Editor header bar:** room name ("แผนผังของ I-1" = "Floor plan of I-1"), Save button (`บันทึก`) right-aligned. Save here = your explicit "commit this version" action — separate from autosave (see below).

**Toolbar row** — maps directly to `toolStore` values:

| Icon (in mockup) | Tool | `toolStore` value |
|---|---|---|
| Size `100 x 100` inputs | Canvas width/height | mutates `canvas.width/height` directly, not a "tool" |
| Arrow cursor | Select / move / rotate | `select` |
| Dashed lasso | Freeform / rubber-band multi-select | `lasso-select` |
| Filled square | Add one seat | `add-seat` |
| `···` dashes | Add a line of seats | `add-seat-line` |
| Grid (4-square) icon | Add a 2D array of seats | `add-seat-grid` |
| — separator — | | |
| Rounded square w/ corner mark | Draw square (symbol) | `draw-rect` |
| Circle w/ corner mark | Draw circle (symbol) | `draw-circle` |
| Blob/corner icon | Draw polygon (symbol) | `draw-polygon` |
| — separator — | | |
| `T+` | Add text | `add-text` |

Toolbar is a horizontal icon strip, active tool visually highlighted (as in the mockup's greyed-out "select" state).

**Canvas area:** plain white/light-gray canvas, no background floorplan image (confirmed — blank canvas). Seats render as light-gray rounded squares with a thin border by default.

**Selection state (from mockup):** selected seat gets a **dashed outline**, plus a single **rotate handle**: a thin line extending straight up from the seat's top edge, ending in a small dot/grip — this is exactly `Konva.Transformer`'s default rotate-anchor visual when configured with `resizeEnabled: false` (rotate-only, no corner/edge resize anchors shown) — **seats are not resizable**, fixed `width`/`height` per seat (set at creation, not user-adjustable per instance). Shapes (rect/circle/polygon symbols) keep full resize + rotate anchors since they're not standardized units.

**Left panel — "องค์ประกอบ" (Components):** *(added in revised mockup)* a drag-source palette of preset venue fixtures — restroom (ห้องน้ำ), door (ประตู), stage (เวที) — each an icon + Thai label. Dragging one onto the canvas instantiates an `IconElement` at the drop position (see updated data model). This is additive to the draw-square/circle/polygon toolbar tools, not a replacement — the palette covers the three common cases with one drag; the draw tools remain for anything custom.

**Right panel:** appears when there's an active selection, now two dropdowns instead of the earlier single zone dropdown — **zones were removed from this editor** (moved to a separate workflow) in favor of:
- **"สถานะเก้าอี้" (Seat status)** — maps to `Seat.status` (available/unavailable/held).
- **"ลักษณะเก้าอี้" (Seat characteristics)** — maps to `Seat.seatTypeId`, referencing the new `SeatType` registry (size & material, e.g. "Standard plastic chair"). Managed via the "เพิ่มชนิดเก้าอี้" (Add seat type) modal — name + description fields, Cancel/Add actions — presumably opened from an "add new" option in this dropdown.

Extend this panel to also show numeric x/y/rotation/width/height fields when a seat/shape is selected, and for Shape/Text/Icon elements show fill/stroke/content/label fields instead of the seat-specific dropdowns.

**Note on canvas size units:** confirmed — the `100 x 100` size fields are plain **pixels**.

**Localization:** the mockup UI is in Thai. I'll build the component with an i18n string dictionary (`labels.ts`/`labels.js`) from the start rather than hardcoding Thai (or English) inline — trivial extra effort now, saves a rewrite later if you need bilingual admin support.

---

## 9. Undo/Redo Depth & Autosave

- `historyStore` caps at **48 steps** — implement as a fixed-size ring buffer (push past 48 → drop oldest), not an unbounded array, so memory stays flat regardless of session length.
- **Autosave:** debounce writes to the browser's `localStorage`/`IndexedDB` (IndexedDB preferred once seat count is large, since `localStorage` is capped ~5MB and synchronous) a couple seconds after the last change, plus on tab/window `beforeunload`. This is a **draft**, distinct from the explicit `บันทึก` (Save) action — on load, if a newer autosaved draft exists than the last explicit save, prompt "Restore unsaved changes?" (standard editor pattern, e.g. Figma/Google Docs style recovery banner).
- Autosave writes the same JSON shape as export, just to local storage instead of triggering a download — so the "restore draft" and "export" code paths share one serializer.

---

## 10. Open Questions / Assumptions to Confirm

Reasonable defaults I'm assuming for now — flag any of these you want changed:
- ~~Zone colors~~ — superseded: zones removed from this editor entirely (see Section 8). Seats no longer carry a color-by-zone visual; open question below is what, if anything, visually distinguishes seat *type* (characteristics) on canvas.
- **Seat "status" colors** (available/unavailable/held): proposing gray = available (default), red/hatched = unavailable, amber = held — purely editor-side visual cues, easy to restyle.
- **Seat type visual distinction:** confirmed — no canvas-level visual cue. `SeatType` (name/description) is metadata only, surfaced through the properties panel dropdown; seat appearance on canvas is driven solely by `status`, not by type.
- **Icon rendering:** confirmed — icons are polygon-boundary shapes (`points`, same model as the polygon draw tool), not fixed-size boxes. The glyph (person-pair for restroom, door outline, stage/person-on-platform for stage) + Thai label render centered inside whatever boundary the user places/draws, rather than at a fixed size. Quick palette placement defaults to a rectangular boundary sized from `ICON_LIBRARY`, which the user can then drag-corner-resize/reshape like any other shape.
- **Seat resizing:** confirmed — removed. Seats are rotate-only via the Transformer (`resizeEnabled: false`), fixed size per seat. Shapes keep full resize.
- **Canvas size unit:** confirmed — pixels.
- **Canvas size unit** (see Section 8) — defaulting to pixels.
- **Resize behavior:** ~~seats rotate-only~~ → **confirmed: seats get full drag-corner resize**, same as shapes. So every element type (seat, shape, text) uses the same full `Konva.Transformer` (8 resize anchors + rotate anchor), rather than a cut-down rotate-only variant for seats. Numeric width/height/rotation fields in the Properties panel stay too, as a precise alternative to dragging. One implication worth flagging: with free corner-resize enabled, decide whether seat resize should be **locked to uniform scaling** (`keepRatio: true` on the Transformer) so seats stay square/circular rather than stretching into ovals/rectangles — I'd default `keepRatio: true` for seats specifically (shapes can stay freely stretchable) unless you want seats stretchable too.

Everything else (Konva as the engine, one-editor-per-room, blank canvas, 48-step undo, autosave, no external backend schema to match) is settled per your last message — I'm ready to start on Phase 0 skeleton + the data model whenever you say go, or if you'd like, I can go straight to scaffolding the actual Svelte/Konva project structure next.
