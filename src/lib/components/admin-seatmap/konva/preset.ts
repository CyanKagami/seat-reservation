import Konva from 'konva';
import { nanoid } from 'nanoid';
import { PRESET_SIZE, PRESET_LABELS, type PresetType } from '../types';

interface PresetConfig {
  emoji: string;
  fill: string;
  stroke: string;
  dashLine: boolean;
}

const CONFIGS: Record<PresetType, PresetConfig> = {
  toilet: { emoji: '🚻', fill: '#dbeafe', stroke: '#93c5fd', dashLine: true },
  door:   { emoji: '🚪', fill: '#fce7f3', stroke: '#f9a8d4', dashLine: true },
  stage:  { emoji: '🎭', fill: '#fef9c3', stroke: '#fde047', dashLine: false },
};

// ─── Create a preset Group: dashed outline + emoji + Thai label ───────────────
export function createPreset(type: PresetType, x: number, y: number): Konva.Group {
  const cfg = CONFIGS[type];
  const label = PRESET_LABELS[type];

  const group = new Konva.Group({
    id: nanoid(),
    x,
    y,
    draggable: true,
    name: 'selectable',
  });
  group.setAttr('kind', 'preset');
  group.setAttr('presetType', type);

  // Outer boundary (dashed = polygon-like)
  const outline = new Konva.Rect({
    x: 0, y: 0,
    width: PRESET_SIZE, height: PRESET_SIZE,
    fill: cfg.fill,
    stroke: cfg.stroke,
    strokeWidth: 2,
    cornerRadius: 10,
    dash: cfg.dashLine ? [8, 4] : undefined,
    listening: false,
  });

  // Emoji icon, rendered as a large text glyph
  const icon = new Konva.Text({
    x: 0, y: 10,
    width: PRESET_SIZE,
    text: cfg.emoji,
    fontSize: 30,
    align: 'center',
    listening: false,
  });

  // Thai label underneath the icon
  const labelText = new Konva.Text({
    x: 0, y: PRESET_SIZE - 20,
    width: PRESET_SIZE,
    text: label,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#374151',
    align: 'center',
    listening: false,
  });

  group.add(outline, icon, labelText);
  return group;
}
