<script>
  import { onMount } from 'svelte';

  // --- Canvas & Konva References ---
  let container;
  let Konva;
  let stage, layer, transformer;

  // --- Reactive UI States ---
  let canvasWidth = 800;
  let canvasHeight = 600;
  
  // Selected Node Properties (Right Panel)
  let selectedNode = null;
  let seatStatus = 'พร้อมใช้งาน'; // Available
  let seatType = 'เก้าอี้พับ ใหม่';  // Folding Chair

  onMount(async () => {
    // Dynamically import Konva (Client-side only)
    Konva = (await import('konva')).default;

    initCanvas();
  });

  function initCanvas() {
    stage = new Konva.Stage({
      container: container,
      width: canvasWidth,
      height: canvasHeight,
    });

    layer = new Konva.Layer();
    stage.add(layer);

    // Transformer for handles/selection
    transformer = new Konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    });
    layer.add(transformer);

    // Stage click -> Deselect when clicking empty canvas
    stage.on('click tap', (e) => {
      if (e.target === stage) {
        deselectNode();
      }
    });
  }

  // --- Node Selection Logic ---
  function selectNode(node) {
    selectedNode = node;
    transformer.nodes([node]);
    
    // Read custom properties if available
    if (node.attrs.seatStatus) seatStatus = node.attrs.seatStatus;
    if (node.attrs.seatType) seatType = node.attrs.seatType;

    layer.draw();
  }

  function deselectNode() {
    selectedNode = null;
    transformer.nodes([]);
    layer.draw();
  }

  // --- Tool Actions ---
  function updateCanvasDimensions() {
    if (stage) {
      stage.width(canvasWidth);
      stage.height(canvasHeight);
    }
  }

  // Single Seat Creator
  function addSeat(x = 100, y = 100) {
    const seat = new Konva.Rect({
      x,
      y,
      width: 36,
      height: 36,
      fill: '#D1D5DB',
      stroke: '#4B5563',
      strokeWidth: 1,
      cornerRadius: 3,
      draggable: true,
      name: 'seat',
      seatStatus: 'พร้อมใช้งาน',
      seatType: 'เก้าอี้พับ ใหม่',
    });

    attachNodeEvents(seat);
    layer.add(seat);
    selectNode(seat);
  }

  // Grid Generator (Adds 3x5 seats matrix)
  function addSeatGrid() {
    const startX = 150;
    const startY = 150;
    const gap = 8;
    const size = 36;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        addSeat(startX + c * (size + gap), startY + r * (size + gap));
      }
    }
  }

  // Stage Shape Creator
  function addStageElement() {
    const group = new Konva.Group({
      x: 200,
      y: 50,
      draggable: true,
      name: 'stage-element',
    });

    const shape = new Konva.Path({
      data: 'M0,0 H220 L260,35 L220,70 H0 Z',
      fill: '#FCA5A5',
      stroke: '#EF4444',
      strokeWidth: 1.5,
    });

    const text = new Konva.Text({
      text: 'เวที',
      fontSize: 14,
      fontStyle: 'bold',
      fill: '#1F2937',
      x: 110,
      y: 35,
    });
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);

    group.add(shape, text);
    attachNodeEvents(group);
    layer.add(group);
    selectNode(group);
  }

  function attachNodeEvents(node) {
    node.on('mousedown touchstart', (e) => {
      e.cancelBubble = true;
      selectNode(node);
    });
  }

  // --- Right Panel Property Updates ---
  function handleStatusChange() {
    if (!selectedNode) return;
    selectedNode.setAttr('seatStatus', seatStatus);

    // Update visual feedback based on status
    if (seatStatus === 'พร้อมใช้งาน') {
      selectedNode.fill('#D1D5DB');
    } else if (seatStatus === 'ไม่พร้อมใช้งาน') {
      selectedNode.fill('#EF4444');
    }
    layer.draw();
  }

  // JSON Export for database save
  function handleSave() {
    const jsonOutput = layer.toJSON();
    console.log('Saved Seatmap Layout:', jsonOutput);
    alert('บันทึกผังเรียบร้อย! (Check browser console)');
  }
</script>

<div class="flex flex-col h-screen w-full bg-slate-100 font-sans text-slate-800">
  
  <header class="flex items-center justify-between px-6 py-3 bg-slate-200 border-b border-slate-300">
    <div class="flex items-center gap-2">
      <span class="text-2xl font-black tracking-wider text-rose-600">K-</span>
      <span class="text-2xl font-black tracking-wider text-rose-500">SEAT</span>
    </div>
    <nav class="flex items-center gap-8 font-semibold text-slate-700">
      <a href="#users" class="hover:text-black">Users</a>
      <a href="#locations" class="hover:text-black">Locations</a>
      <a href="#events" class="hover:text-black">Events</a>
      <div class="w-10 h-10 rounded-full bg-slate-300 border border-slate-400"></div>
    </nav>
  </header>

  <div class="flex items-center justify-between px-6 py-3 bg-slate-100 border-b border-slate-300">
    <h1 class="text-lg font-bold">แผนผังของ I-1</h1>
    <button 
      on:click={handleSave} 
      class="px-5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded shadow-sm transition"
    >
      บันทึก
    </button>
  </div>

  <div class="flex items-center gap-4 px-6 py-2 bg-slate-200 border-b border-slate-300 text-sm">
    <div class="flex items-center gap-2">
      <span>ขนาด</span>
      <input 
        type="number" 
        bind:value={canvasWidth} 
        on:change={updateCanvasDimensions}
        class="w-16 px-2 py-0.5 border border-slate-400 rounded text-center bg-white" 
      />
      <span>×</span>
      <input 
        type="number" 
        bind:value={canvasHeight} 
        on:change={updateCanvasDimensions}
        class="w-16 px-2 py-0.5 border border-slate-400 rounded text-center bg-white" 
      />
    </div>

    <div class="h-5 w-px bg-slate-300 mx-2"></div>

    <div class="flex items-center gap-1">
      <button title="Add Single Seat" on:click={() => addSeat()} class="p-1.5 rounded hover:bg-slate-300 border border-slate-400 bg-white">
        ▢<sup>+</sup>
      </button>
      <button title="Add Seat Grid" on:click={addSeatGrid} class="p-1.5 rounded hover:bg-slate-300 border border-slate-400 bg-white">
        ▦<sup>+</sup>
      </button>
      <button title="Add Stage Shape" on:click={addStageElement} class="p-1.5 rounded hover:bg-slate-300 border border-slate-400 bg-white">
        ⎚<sup>+</sup>
      </button>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">
    
    <aside class="w-48 bg-slate-100 border-r border-slate-300 p-4">
      <h2 class="text-xs font-bold text-slate-600 mb-3 uppercase">องค์ประกอบ</h2>
      <div class="grid grid-cols-2 gap-2">
        <button 
          on:click={() => addSeat()} 
          class="flex flex-col items-center justify-center p-3 bg-white border border-dashed border-slate-400 rounded hover:border-slate-600"
        >
          <span class="text-xl">🪑</span>
          <span class="text-xs mt-1">เก้าอี้</span>
        </button>
        <button 
          on:click={addStageElement} 
          class="flex flex-col items-center justify-center p-3 bg-white border border-dashed border-slate-400 rounded hover:border-slate-600"
        >
          <span class="text-xl">🗣️</span>
          <span class="text-xs mt-1">เวที</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 bg-slate-300 p-6 overflow-auto flex items-center justify-center">
      <div 
        bind:this={container} 
        class="bg-white shadow-md border border-slate-300"
      ></div>
    </main>

    <aside class="w-64 bg-slate-100 border-l border-slate-300 p-4 flex flex-col gap-4">
      {#if selectedNode}
        <div>
          <label for="seat-status" class="block text-xs font-bold text-slate-600 mb-1">สถานะเก้าอี้</label>
          <select 
            id="seat-status"
            bind:value={seatStatus} 
            on:change={handleStatusChange}
            class="w-full p-2 border border-slate-300 rounded bg-white text-sm"
          >
            <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
            <option value="ไม่พร้อมใช้งาน">ไม่พร้อมใช้งาน</option>
          </select>
        </div>

        <div>
          <label for="seat-type" class="block text-xs font-bold text-slate-600 mb-1">ลักษณะเก้าอี้</label>
          <select 
            id="seat-type"
            bind:value={seatType} 
            class="w-full p-2 border border-slate-300 rounded bg-white text-sm"
          >
            <option value="เก้าอี้พับ ใหม่">เก้าอี้พับ ใหม่</option>
            <option value="เก้าอี้โซฟา">เก้าอี้โซฟา</option>
            <option value="วีไอพี">วีไอพี</option>
          </select>
        </div>
      {:else}
        <div class="text-xs text-slate-400 text-center py-8">
          เลือกองค์ประกอบบนผังเพื่อแก้ไขคุณสมบัติ
        </div>
      {/if}
    </aside>

  </div>
</div>