<script lang="ts">
  import type { PresetType } from './types';

  const presets: { type: PresetType; emoji: string; label: string }[] = [
    { type: 'toilet', emoji: '🚻', label: 'ห้องน้ำ' },
    { type: 'door',   emoji: '🚪', label: 'ประตู' },
    { type: 'stage',  emoji: '🎭', label: 'เวที' },
  ];

  function onDragStart(e: DragEvent, type: PresetType) {
    e.dataTransfer?.setData('presetType', type);
    e.dataTransfer!.effectAllowed = 'copy';
  }
</script>

<aside class="flex flex-col gap-2 p-3 bg-white border-r border-gray-200 w-[100px] shrink-0">
  <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-1">
    องค์ประกอบ
  </p>
  {#each presets as preset}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      draggable="true"
      ondragstart={(e) => onDragStart(e, preset.type)}
      class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 bg-gray-50
             hover:bg-blue-50 hover:border-blue-300 cursor-grab active:cursor-grabbing
             select-none transition-colors"
      title={`ลาก ${preset.label} ไปยังแผนผัง`}
    >
      <span class="text-3xl leading-none">{preset.emoji}</span>
      <span class="text-[10px] text-gray-600 font-medium">{preset.label}</span>
    </div>
  {/each}
</aside>
