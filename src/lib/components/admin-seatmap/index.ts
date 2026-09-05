// Public API surface for the admin-seatmap component family
export { default as SeatmapEditor } from './SeatmapEditor.svelte';
export { default as Toolbar } from './Toolbar.svelte';
export { default as PresetPanel } from './PresetPanel.svelte';
export { default as PropertiesPanel } from './PropertiesPanel.svelte';

// Type exports for consumers
export type {
  NodeKind,
  ToolMode,
  PresetType,
  SeatStatus,
  SeatProps,
  RowConfig,
  GridConfig,
  SerializedNode,
  SeatmapDocument,
} from './types';

// Konva utility exports (for advanced consumers or tests)
export { exportToJSON, buildDocument } from './konva/export';
export { copyNodes, pasteNodes } from './konva/clipboard';
