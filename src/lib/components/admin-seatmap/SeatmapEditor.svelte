<script lang="ts">
  import { onMount } from 'svelte';
  import Konva from 'konva';

  import Toolbar from './Toolbar.svelte';
  import PresetPanel from './PresetPanel.svelte';
  import PropertiesPanel from './PropertiesPanel.svelte';

  import { createStage, updateBackground, centerStageOnCanvas, resizeStage } from './konva/stage';
  import { createSeatGroup, addOneSeat, addSeatRow, addSeatGrid, applySeatSelection, updateSeatProps } from './konva/seat';
  import { DrawingManager, createTextNode } from './konva/shapes';
  import { createPreset } from './konva/preset';
  import { copyNodes, pasteNodes } from './konva/clipboard';
  import { exportToJSON } from './konva/export';

  import {
    type ToolMode,
    type RowConfig,
    type GridConfig,
    type SeatProps,
    type PresetType,
  } from './types';

  // ── Props ──────────────────────────────────────────────────────────────────
  interface Props {
    title?: string;
    initialWidth?: number;
    initialHeight?: number;
    onSave?: () => void;
  }

  let {
    title = 'แผนผังของ l-1',
    initialWidth = 1000,
    initialHeight = 800,
    onSave,
  }: Props = $props();

  // ── UI state (Svelte 5 runes) ──────────────────────────────────────────────
  let toolMode = $state<ToolMode>('select');
  // svelte-ignore state_referenced_locally
  let canvasWidth = $state(initialWidth);
  // svelte-ignore state_referenced_locally
  let canvasHeight = $state(initialHeight);

  let rowConfig = $state<RowConfig>({ count: 5, spacing: 50 });
  let gridConfig = $state<GridConfig>({ rows: 3, cols: 5, spacingX: 50, spacingY: 50 });

  // Selection-driven state (used by PropertiesPanel)
  let selectedNodeIds = $state<string[]>([]);
  let panelSeatProps = $state<SeatProps | null>(null);
  let panelSeatCount = $state(0);

  // Text input overlay state
  let textOverlay = $state<{
    visible: boolean;
    x: number; // px relative to container
    y: number;
    stageX: number; // canvas coords for placing the node
    stageY: number;
    value: string;
  }>({ visible: false, x: 0, y: 0, stageX: 0, stageY: 0, value: '' });

  // ── DOM refs ───────────────────────────────────────────────────────────────
  let containerEl = $state<HTMLDivElement | null>(null);
  let textInputEl = $state<HTMLInputElement | null>(null);

  // ── Konva objects (imperative, not reactive) ───────────────────────────────
  let stage: Konva.Stage;
  let bgLayer: Konva.Layer;
  let mainLayer: Konva.Layer;
  let uiLayer: Konva.Layer;
  let transformer: Konva.Transformer;
  let drawMgr: DrawingManager;

  // Selection tracking (parallel with Konva)
  let selectedNodes: Konva.Node[] = [];

  // Multi-drag state
  let isDragging = false;
  let dragStart: { x: number; y: number } | null = null;
  let dragInitPos = new Map<string, { x: number; y: number }>();

  // Marquee selection state
  let isMarqueeing = false;
  let marqueeRect: Konva.Rect | null = null;
  let marqueeStart: { x: number; y: number } | null = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Walk up the parent chain to find the direct child of mainLayer */
  function getSelectableNode(target: Konva.Node): Konva.Node | null {
    let node: Konva.Node | null = target;
    while (node) {
      if (node.getParent() === mainLayer && node.getAttr('kind')) return node;
      node = node.getParent() as Konva.Node | null;
    }
    return null;
  }

  /** Replace transformer nodes and re-apply selection colours */
  function syncTransformer() {
    transformer.nodes(selectedNodes as Konva.Shape[]);

    const allSeats = selectedNodes.length > 0 && selectedNodes.every(n => n.getAttr('kind') === 'seat');
    transformer.setAttrs({
      enabledAnchors: allSeats
        ? [] // seat selections: rotation only
        : ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'],
      rotateEnabled: selectedNodes.length > 0,
    });

    uiLayer.batchDraw();
    mainLayer.batchDraw();
  }

  /** Commit selection state to Svelte for PropertiesPanel */
  function updateSvelteSelection() {
    selectedNodeIds = selectedNodes.map(n => n.id());

    const seats = selectedNodes.filter(n => n.getAttr('kind') === 'seat');
    panelSeatCount = seats.length;

    if (seats.length === 1) {
      panelSeatProps = { ...(seats[0].getAttr('seatProps') as SeatProps) };
    } else if (seats.length > 1) {
      // Check if all have same props
      const first = seats[0].getAttr('seatProps') as SeatProps;
      const allSame = seats.every(s => {
        const p = s.getAttr('seatProps') as SeatProps;
        return p.status === first.status && p.chairType === first.chairType;
      });
      panelSeatProps = allSame ? { ...first } : null;
    } else {
      panelSeatProps = null;
    }
  }

  /** Select nodes (replacing or additive) */
  function selectNodes(nodes: Konva.Node[], additive = false) {
    if (!additive) {
      selectedNodes.forEach(n => {
        if (n.getAttr('kind') === 'seat') applySeatSelection(n as Konva.Group, false);
      });
      selectedNodes = [];
    }

    nodes.forEach(n => {
      if (!selectedNodes.includes(n)) {
        selectedNodes.push(n);
        if (n.getAttr('kind') === 'seat') applySeatSelection(n as Konva.Group, true);
      }
    });

    syncTransformer();
    updateSvelteSelection();
  }

  /** Toggle one node in/out of selection */
  function toggleNode(node: Konva.Node) {
    const idx = selectedNodes.indexOf(node);
    if (idx >= 0) {
      selectedNodes.splice(idx, 1);
      if (node.getAttr('kind') === 'seat') applySeatSelection(node as Konva.Group, false);
    } else {
      selectedNodes.push(node);
      if (node.getAttr('kind') === 'seat') applySeatSelection(node as Konva.Group, true);
    }
    syncTransformer();
    updateSvelteSelection();
  }

  function clearSelection() {
    selectedNodes.forEach(n => {
      if (n.getAttr('kind') === 'seat') applySeatSelection(n as Konva.Group, false);
    });
    selectedNodes = [];
    syncTransformer();
    updateSvelteSelection();
  }

  /** Wire click + drag handlers onto every node added to mainLayer */
  function attachNodeHandlers(node: Konva.Node) {
    node.on('click', (e) => {
      if (toolMode !== 'select') return;
      e.cancelBubble = true;

      if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
        toggleNode(node);
      } else {
        selectNodes([node]);
      }
    });

    node.on('mousedown', (e) => {
      if (e.evt.button !== 0) return;
      if (toolMode !== 'select') return;

      e.cancelBubble = true;

      // Ensure node is selected
      if (!selectedNodes.includes(node)) {
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
          toggleNode(node);
        } else {
          selectNodes([node]);
        }
      }

      // Begin multi-drag
      isDragging = true;
      const pos = stage.getRelativePointerPosition()!;
      dragStart = { ...pos };
      dragInitPos.clear();
      selectedNodes.forEach(n => {
        dragInitPos.set(n.id(), { x: n.x(), y: n.y() });
      });
    });
  }

  // ── Toolbar callbacks ──────────────────────────────────────────────────────

  function handleToolChange(tool: ToolMode) {
    if (toolMode === 'draw_polygon' && drawMgr) drawMgr.cancelPolygon();
    if (tool !== 'draw_rect' && tool !== 'draw_circle' && drawMgr) drawMgr.cancelDraw();
    toolMode = tool;

    // Sync draggable: only allow drag in select mode
    if (mainLayer) {
      const draggable = tool === 'select';
      mainLayer.getChildren().forEach(n => n.draggable(draggable));
    }
  }

  function handleCanvasResize(w: number, h: number) {
    canvasWidth = w;
    canvasHeight = h;
    if (bgLayer) updateBackground(bgLayer, w, h);
  }

  function handleExport() {
    if (mainLayer) exportToJSON(mainLayer, canvasWidth, canvasHeight);
  }

  // ── PropertiesPanel callback ───────────────────────────────────────────────

  function handlePropsUpdate(props: SeatProps) {
    const seats = selectedNodes.filter(n => n.getAttr('kind') === 'seat');
    seats.forEach(n => {
      updateSeatProps(n as Konva.Group, props);
    });
    panelSeatProps = { ...props };
    mainLayer.batchDraw();
  }

  // ── Text overlay ───────────────────────────────────────────────────────────

  function showTextInput(stagePos: { x: number; y: number }) {
    const containerRect = containerEl!.getBoundingClientRect();
    const screenX = stagePos.x * stage.scaleX() + stage.x();
    const screenY = stagePos.y * stage.scaleY() + stage.y();
    textOverlay = {
      visible: true,
      x: screenX,
      y: screenY,
      stageX: stagePos.x,
      stageY: stagePos.y,
      value: '',
    };
    // Focus on next tick
    setTimeout(() => textInputEl?.focus(), 0);
  }

  function commitTextInput() {
    if (!textOverlay.visible || !textOverlay.value.trim()) {
      textOverlay = { ...textOverlay, visible: false };
      return;
    }
    const node = createTextNode(textOverlay.stageX, textOverlay.stageY, textOverlay.value.trim());
    mainLayer.add(node);
    mainLayer.batchDraw();
    attachNodeHandlers(node);
    textOverlay = { ...textOverlay, visible: false };
  }

  // ── Drag-and-drop from PresetPanel ────────────────────────────────────────

  function handleDragOver(e: DragEvent) {
    if (e.dataTransfer?.types.includes('presettype')) {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer?.getData('presetType') as PresetType | '';
    if (!type || !stage) return;

    const rect = containerEl!.getBoundingClientRect();
    const x = (e.clientX - rect.left - stage.x()) / stage.scaleX();
    const y = (e.clientY - rect.top - stage.y()) / stage.scaleY();

    const preset = createPreset(type, x - 40, y - 40); // centre under cursor
    mainLayer.add(preset);
    attachNodeHandlers(preset);
    mainLayer.batchDraw();
    selectNodes([preset]);
    handleToolChange('select');
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  function handleKeyDown(e: KeyboardEvent) {
    // Don't intercept while typing in text input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (drawMgr) drawMgr.cancelAll();
      textOverlay = { ...textOverlay, visible: false };
      handleToolChange('select');
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      selectedNodes.forEach(n => n.destroy());
      clearSelection();
      mainLayer.batchDraw();
      return;
    }

    if (isCtrl) {
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyNodes(selectedNodes);
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const pasted = pasteNodes(mainLayer);
        pasted.forEach(n => {
          if (toolMode === 'select') n.draggable(true);
          attachNodeHandlers(n);
        });
        selectNodes(pasted);
      }
      return;
    }

    // Single-key tool shortcuts
    const shortcuts: Record<string, ToolMode> = {
      v: 'select', a: 'add_seat', r: 'add_row',
      g: 'add_grid', q: 'draw_rect', c: 'draw_circle',
      p: 'draw_polygon', t: 'add_text',
    };
    if (shortcuts[e.key.toLowerCase()]) {
      handleToolChange(shortcuts[e.key.toLowerCase()]);
    }
  }

  // ── Mount ──────────────────────────────────────────────────────────────────

  onMount(() => {
    if (!containerEl) return;

    // 1. Create stage + layers
    const setup = createStage(containerEl, canvasWidth, canvasHeight);
    stage = setup.stage;
    bgLayer = setup.bgLayer;
    mainLayer = setup.mainLayer;
    uiLayer = setup.uiLayer;

    // 2. Transformer (on uiLayer)
    transformer = new Konva.Transformer({
      padding: 4,
      borderStroke: '#6366f1',
      borderStrokeWidth: 1.5,
      anchorFill: '#ffffff',
      anchorStroke: '#6366f1',
      anchorSize: 8,
      rotateAnchorOffset: 22,
      keepRatio: false,
      rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
    });
    uiLayer.add(transformer);

    // 3. Drawing manager
    drawMgr = new DrawingManager(stage, mainLayer, uiLayer);
    drawMgr.onShapeCommitted = (node) => {
      if (toolMode === 'select') node.draggable(true);
      attachNodeHandlers(node);
      selectNodes([node]);
    };

    // 4. Stage event handling ────────────────────────────────────────────────

    stage.on('mousedown', (e) => {
      if (e.evt.button !== 0) return; // Skip middle/right (handled in stage.ts)

      const pos = stage.getRelativePointerPosition()!;
      const target = e.target;
      const onStage = target === stage;

      if (toolMode === 'select') {
        if (onStage) {
          // Clear selection (unless shift held for additive marquee)
          if (!e.evt.shiftKey) clearSelection();
          // Begin marquee
          isMarqueeing = true;
          marqueeStart = { ...pos };
          marqueeRect = new Konva.Rect({
            x: pos.x, y: pos.y, width: 0, height: 0,
            fill: 'rgba(99,102,241,0.08)',
            stroke: '#6366f1',
            strokeWidth: 1,
            dash: [5, 4],
            listening: false,
          });
          uiLayer.add(marqueeRect);
        }
      } else if (toolMode === 'draw_rect' || toolMode === 'draw_circle') {
        drawMgr.startDraw(toolMode, pos);
      }
    });

    stage.on('mousemove', () => {
      const pos = stage.getRelativePointerPosition()!;

      if (isMarqueeing && marqueeRect && marqueeStart) {
        const x = Math.min(pos.x, marqueeStart.x);
        const y = Math.min(pos.y, marqueeStart.y);
        marqueeRect.setAttrs({
          x, y,
          width: Math.abs(pos.x - marqueeStart.x),
          height: Math.abs(pos.y - marqueeStart.y),
        });
        uiLayer.batchDraw();
        return;
      }

      if (isDragging && dragStart) {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        selectedNodes.forEach(n => {
          const init = dragInitPos.get(n.id());
          if (init) n.position({ x: init.x + dx, y: init.y + dy });
        });
        // Keep transformer updated
        uiLayer.batchDraw();
        mainLayer.batchDraw();
        return;
      }

      if (toolMode === 'draw_rect' || toolMode === 'draw_circle') {
        drawMgr.moveDraw(toolMode, pos);
      } else if (toolMode === 'draw_polygon') {
        drawMgr.movePolyPreview(pos);
      }
    });

    stage.on('mouseup', (e) => {
      if (e.evt.button !== 0) return;

      if (isMarqueeing && marqueeRect && marqueeStart) {
        const box = marqueeRect.getClientRect();
        marqueeRect.destroy();
        marqueeRect = null;
        isMarqueeing = false;
        marqueeStart = null;
        uiLayer.batchDraw();

        // Hit-test all selectable nodes
        const all = mainLayer.find<Konva.Node>('.selectable');
        const inBox = all.filter(node => {
          const nb = node.getClientRect();
          return !(nb.x > box.x + box.width || nb.x + nb.width < box.x ||
                   nb.y > box.y + box.height || nb.y + nb.height < box.y);
        });
        selectNodes(inBox, e.evt.shiftKey);
        return;
      }

      if (isDragging) {
        isDragging = false;
        dragStart = null;
        dragInitPos.clear();
        return;
      }

      if (toolMode === 'draw_rect' || toolMode === 'draw_circle') {
        drawMgr.commitDraw(toolMode);
      }
    });

    stage.on('click', (e) => {
      if (e.evt.button !== 0) return;
      const pos = stage.getRelativePointerPosition()!;
      const onStage = e.target === stage;

      if (toolMode === 'add_seat' && onStage) {
        const node = addOneSeat(mainLayer, pos.x, pos.y);
        node.draggable(false); // select mode is not active
        attachNodeHandlers(node);
      } else if (toolMode === 'add_row' && onStage) {
        const nodes = addSeatRow(mainLayer, pos.x, pos.y, rowConfig);
        nodes.forEach(n => { n.draggable(false); attachNodeHandlers(n); });
      } else if (toolMode === 'add_grid' && onStage) {
        const nodes = addSeatGrid(mainLayer, pos.x, pos.y, gridConfig);
        nodes.forEach(n => { n.draggable(false); attachNodeHandlers(n); });
      } else if (toolMode === 'draw_polygon') {
        drawMgr.addPolyVertex(pos);
      } else if (toolMode === 'add_text' && onStage) {
        showTextInput(pos);
      }
    });

    stage.on('dblclick', (e) => {
      if (toolMode === 'draw_polygon') {
        e.cancelBubble = true;
        drawMgr.finishPolyOnDblClick();
      }
    });

    // 5. Center on initial canvas
    centerStageOnCanvas(stage, canvasWidth, canvasHeight);

    // 6. Responsive resize
    const ro = new ResizeObserver(() => resizeStage(stage, containerEl!));
    ro.observe(containerEl);

    return () => {
      ro.disconnect();
      stage.destroy();
    };
  });
</script>

<!-- ── Keyboard handler ──────────────────────────────────────────────────── -->
<svelte:body onkeydown={handleKeyDown} />

<!-- ── Root layout ──────────────────────────────────────────────────────── -->
<div class="flex flex-col h-full w-full bg-gray-100 select-none overflow-hidden">

  <Toolbar
    {toolMode}
    {canvasWidth}
    {canvasHeight}
    {rowConfig}
    {gridConfig}
    {title}
    onToolChange={handleToolChange}
    onCanvasResize={handleCanvasResize}
    onRowConfigChange={(cfg) => (rowConfig = cfg)}
    onGridConfigChange={(cfg) => (gridConfig = cfg)}
    onExport={handleExport}
    {onSave}
  />

  <!-- Three-column work area -->
  <div class="flex flex-1 min-h-0">
    <PresetPanel />

    <!-- Canvas host -->
    <div
      class="relative flex-1 min-w-0 overflow-hidden bg-gray-200"
      bind:this={containerEl}
      ondragover={handleDragOver}
      ondrop={handleDrop}
      role="application"
      aria-label="แผนผังที่นั่ง"
    >
      <!-- Text input overlay (for add_text tool) -->
      {#if textOverlay.visible}
        <input
          bind:this={textInputEl}
          bind:value={textOverlay.value}
          type="text"
          placeholder="พิมพ์ข้อความ..."
          class="absolute z-10 border-2 border-indigo-500 rounded px-2 py-1 text-sm
                 bg-white shadow-lg outline-none focus:ring-2 focus:ring-indigo-300
                 min-w-32"
          style="left:{textOverlay.x}px; top:{textOverlay.y}px;"
          onkeydown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitTextInput(); }
            if (e.key === 'Escape') { textOverlay = { ...textOverlay, visible: false }; }
          }}
          onblur={commitTextInput}
        />
      {/if}

      <!-- Cursor hints based on active tool -->
      <div
        class="absolute inset-0 pointer-events-none z-0"
        class:cursor-crosshair={toolMode !== 'select'}
        class:cursor-default={toolMode === 'select'}
      ></div>
    </div>

    <PropertiesPanel
      seatProps={panelSeatProps}
      selectionCount={panelSeatCount}
      onUpdate={handlePropsUpdate}
    />
  </div>

  <!-- Status bar -->
  <div
    class="shrink-0 flex items-center gap-4 px-4 py-1 bg-white border-t border-gray-200
           text-[11px] text-gray-500"
  >
    <span>เก้าอี้ที่เลือก: <strong class="text-gray-700">{selectedNodeIds.length}</strong></span>
    <span>ขนาด: <strong class="text-gray-700">{canvasWidth} × {canvasHeight}</strong> px</span>
    <span class="ml-auto opacity-70">
      🖱️ เลื่อน = ซูม · กลาง = แพน ·
      Ctrl+C/V = คัดลอก/วาง · Del = ลบ · Esc = ยกเลิก
    </span>
  </div>
</div>
