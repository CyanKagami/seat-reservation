<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { seatmapStore } from './state/seatmapStore';
	import { setCanvasSize } from './state/actions';
	import { toolStore } from './state/toolStore';
	import { isSeat } from './guards';
	import { placeSeatAt } from './tools/addSeatTool';
	import type { StageManager } from './canvas/StageManager';
	import type { SeatsSync } from './canvas/SceneSync';

	interface Props {
		/** Which room this editor instance is for — one editor per room, per the confirmed design. */
		roomId: string;
		roomName?: string;
	}

	let { roomId, roomName = 'Untitled' }: Props = $props();

	let containerEl: HTMLDivElement;

	// $state.raw for both: Konva's Stage and our own sync object hold live
	// Konva node references internally. Deep-proxying either through plain
	// $state would wrap that third-party/Konva-facing state in Svelte's
	// reactivity proxy for no benefit — nothing here needs to react to
	// changes *inside* them — and risks subtly breaking Konva's own
	// identity/`this` assumptions. raw still triggers effects on
	// reassignment (null -> the created value below), which is all this needs.
	let stageManager = $state.raw<StageManager | null>(null);
	let seatsSync = $state.raw<SeatsSync | null>(null);

	// Local, editable mirrors of the canvas size. Kept separate from the
	// store so that typing "1000" doesn't briefly resize the stage to "1"
	// then "10" then "100" as each digit lands — committed to the store (and
	// so to the live stage) only on blur/Enter, via commitWidth/commitHeight.
	let widthInput = $state($seatmapStore.canvas.width);
	let heightInput = $state($seatmapStore.canvas.height);

	onMount(() => {
		seatmapStore.reset(roomId, roomName);
		widthInput = $seatmapStore.canvas.width;
		heightInput = $seatmapStore.canvas.height;

		// Konva touches `window`/`document` at Stage-construction time, so it
		// must never load during SSR. onMount alone only runs client-side,
		// but the dynamic import is extra insurance: it keeps `konva` out of
		// the module graph SvelteKit evaluates when server-rendering this
		// component, rather than relying solely on this callback not firing.
		if (browser) {
			import('./canvas/StageManager').then(async ({ createStageManager }) => {
				const manager = createStageManager(containerEl, $seatmapStore.canvas);
				stageManager = manager;

				const { createSeatsSync } = await import('./canvas/SceneSync');
				seatsSync = createSeatsSync(manager.layers.seats);

				// Click-to-place: currently the only stage interaction. Tool
				// dispatch grows here in later phases (lasso-select, draw
				// shapes, text, icons) rather than each tool wiring its own
				// stage listener.
				manager.stage.on('click', () => {
					const pos = manager.stage.getPointerPosition();
					if (!pos) return;
					if ($toolStore === 'add-seat') {
						placeSeatAt(pos.x, pos.y);
					}
				});
			});
		}
	});

	onDestroy(() => {
		seatsSync?.destroy();
		stageManager?.destroy();
	});

	// Keep the live Konva stage in sync with the store's canvas config,
	// regardless of what changed it — these size inputs, undo/redo, a future
	// JSON import, etc. all end up here through the same store subscription.
	$effect(() => {
		if (stageManager && $seatmapStore.canvas) {
			stageManager.setCanvasConfig($seatmapStore.canvas);
		}
	});

	// Reconcile the seats layer whenever the seat elements change, by
	// whatever path (this tool, undo/redo, a future bulk-add tool...).
	$effect(() => {
		if (seatsSync) {
			seatsSync.sync($seatmapStore.elements.filter(isSeat));
		}
	});

	function commitWidth(): void {
		const width = Math.max(100, Math.round(widthInput));
		widthInput = width;
		setCanvasSize(width, $seatmapStore.canvas.height);
	}

	function commitHeight(): void {
		const height = Math.max(100, Math.round(heightInput));
		heightInput = height;
		setCanvasSize($seatmapStore.canvas.width, height);
	}

	function handleSizeKeydown(event: KeyboardEvent, commit: () => void): void {
		if (event.key === 'Enter') commit();
	}
</script>

<div class="seatmap-editor">
	<div class="seatmap-editor__header">
		<span class="seatmap-editor__title">{roomName}</span>
	</div>

	<div class="seatmap-editor__toolbar">
		<span class="seatmap-editor__size-label">ขนาด</span>
		<input
			class="seatmap-editor__size-input"
			type="number"
			min="100"
			bind:value={widthInput}
			onblur={commitWidth}
			onkeydown={(e) => handleSizeKeydown(e, commitWidth)}
		/>
		<span class="seatmap-editor__size-x">x</span>
		<input
			class="seatmap-editor__size-input"
			type="number"
			min="100"
			bind:value={heightInput}
			onblur={commitHeight}
			onkeydown={(e) => handleSizeKeydown(e, commitHeight)}
		/>

		<div class="seatmap-editor__tool-group">
			<button
				type="button"
				class="seatmap-editor__tool-btn"
				class:seatmap-editor__tool-btn--active={$toolStore === 'select'}
				onclick={() => toolStore.set('select')}
			>
				เลือก
			</button>
			<button
				type="button"
				class="seatmap-editor__tool-btn"
				class:seatmap-editor__tool-btn--active={$toolStore === 'add-seat'}
				onclick={() => toolStore.set('add-seat')}
			>
				เพิ่มที่นั่ง
			</button>
		</div>

		<!--
			The remaining tool icons (lasso/line/grid/draw-shape/text), the left
			component palette, and the right properties panel land in this
			toolbar row / around this layout in later phases — see the plan's
			Phases 2-5. Phase 1 is deliberately just single-seat placement.
		-->
	</div>

	<div class="seatmap-editor__canvas-wrap">
		<div
			class="seatmap-editor__canvas"
			bind:this={containerEl}
			style:cursor={$toolStore === 'add-seat' ? 'crosshair' : 'default'}
		></div>
	</div>
</div>

<style>
	.seatmap-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #f5f5f5;
		font-family: sans-serif;
	}

	.seatmap-editor__header {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background: #ffffff;
		border-bottom: 1px solid #e0e0e0;
	}

	.seatmap-editor__title {
		font-weight: 600;
		font-size: 16px;
	}

	.seatmap-editor__toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #ffffff;
		border-bottom: 1px solid #e0e0e0;
	}

	.seatmap-editor__size-label {
		font-size: 13px;
		color: #616161;
		margin-right: 4px;
	}

	.seatmap-editor__size-input {
		width: 64px;
		padding: 4px 8px;
		border: 1px solid #bdbdbd;
		border-radius: 4px;
		font-size: 13px;
	}

	.seatmap-editor__size-x {
		font-size: 13px;
		color: #616161;
	}

	.seatmap-editor__tool-group {
		display: flex;
		gap: 4px;
		margin-left: 16px;
		padding-left: 16px;
		border-left: 1px solid #e0e0e0;
	}

	.seatmap-editor__tool-btn {
		padding: 6px 12px;
		border: 1px solid #bdbdbd;
		border-radius: 4px;
		background: #ffffff;
		font-size: 13px;
		cursor: pointer;
	}

	.seatmap-editor__tool-btn--active {
		background: #e3e3e3;
		border-color: #9e9e9e;
	}

	.seatmap-editor__canvas-wrap {
		flex: 1;
		overflow: auto;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 24px;
	}

	.seatmap-editor__canvas {
		box-shadow: 0 0 0 1px #e0e0e0;
	}
</style>
