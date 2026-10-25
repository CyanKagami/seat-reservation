<script lang="ts">
  import EventBox from "$lib/components/EventBox.svelte";
  import type { Event } from "$lib/type/event";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/scripts/api";
  import { registrationOpen } from "$lib/scripts/booking";
  import { formatThaiDateTimeShort } from "$lib/scripts/formatTime";

  let events: Event[] = $state([]);
  let isLoading = $state(true);
  let searchQuery = $state("");
  let activeTab = $state<"all" | "open" | "upcoming">("all");

  onMount(async () => {
    try {
      const response = await apiFetch("/event/", { method: "GET" });
      const data = await response.json();
      events = data.body || [];
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      isLoading = false;
    }
  });

  // Spotlight featured event: preferentially one that is currently open, else first upcoming/available
  const featuredEvent = $derived.by(() => {
    if (events.length === 0) return null;
    const openEvent = events.find((e) => registrationOpen(e));
    return openEvent || events[0];
  });

  // Reactive event filter
  const filteredEvents = $derived.by(() => {
    const now = Date.now();
    return events.filter((e) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = e.name?.toLowerCase().includes(query);
        const matchesHost = e.host?.toLowerCase().includes(query);
        const matchesPlace = e.place?.name?.toLowerCase().includes(query);
        const matchesLocation = e.place?.location?.name?.toLowerCase().includes(query);
        if (!matchesName && !matchesHost && !matchesPlace && !matchesLocation) {
          return false;
        }
      }

      // 2. Tab filter
      if (activeTab === "open") {
        return registrationOpen(e);
      } else if (activeTab === "upcoming") {
        const regStart = e["register-date"]?.start ? new Date(e["register-date"].start).getTime() : 0;
        return now < regStart;
      }
      return true;
    });
  });

  function clearSearch() {
    searchQuery = "";
  }
</script>

<div class="w-full">
  <!-- Hero Section / Featured Spotlight Stage -->
  {#if featuredEvent}
    <section class="w-full bg-gradient-to-b from-surface-subtle via-pale-soft/30 to-surface-base border-b border-border-subtle pt-6 pb-12 sm:pt-10 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="relative bg-white rounded-2xl border border-border-subtle shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          <!-- Featured Image (Clean, No AI pill stickers pasted on top) -->
          <div class="relative lg:col-span-7 aspect-video lg:aspect-auto min-h-64 sm:min-h-80 bg-surface-subtle">
            <img 
              src={featuredEvent.picture || '/image/defaultEvent.png'} 
              alt={featuredEvent.name}
              class="object-cover w-full h-full"
            />
          </div>

          <!-- Featured Details & Actions -->
          <div class="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
            <div class="flex flex-col gap-3">
              <!-- Editorial Kicker Header -->
              <div class="flex items-center gap-2 text-xs font-semibold text-secondary">
                <span class="text-accent font-bold tracking-wider uppercase text-[11px] bg-accent-subtle/80 px-2 py-0.5 rounded-md">
                  กิจกรรมแนะนำ
                </span>
                <span>·</span>
                <time>{formatThaiDateTimeShort(new Date(featuredEvent.date?.start || Date.now()), new Date(featuredEvent.date?.end || Date.now()))}</time>
              </div>

              <h1 class="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight leading-tight">
                {featuredEvent.name}
              </h1>

              {#if featuredEvent.place}
                <div class="flex items-center gap-2 text-sm text-dark-muted">
                  <svg class="h-4 w-4 text-dark-soft shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="truncate">{featuredEvent.place.name} ({featuredEvent.place.location?.name || ''})</span>
                </div>
              {/if}

              {#if featuredEvent.detail}
                <p class="text-sm text-dark-soft line-clamp-3 leading-relaxed mt-1">
                  {featuredEvent.detail}
                </p>
              {/if}
            </div>

            <!-- Action buttons -->
            <div class="pt-6 border-t border-border-subtle mt-6 flex flex-col sm:flex-row gap-3">
              <a 
                href="/event-info/{featuredEvent.eventId}" 
                class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all shadow-xs"
              >
                <span>เลือกที่นั่งทันที</span>
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
              <a 
                href="/event-info/{featuredEvent.eventId}" 
                class="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-surface-subtle hover:bg-border-subtle text-dark font-medium text-sm transition-colors"
              >
                รายละเอียด
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  {:else}
    <!-- Clean Institutional Welcome Header when no featured event yet -->
    <section class="w-full bg-gradient-to-b from-surface-subtle to-surface-base border-b border-border-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="max-w-3xl">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-pale-soft text-dark-secondary border border-pale inline-block mb-3">
            KMITL Seat Reservation Platform
          </span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-dark tracking-tight leading-tight">
            ระบบจองและจัดการที่นั่งกิจกรรม สจล.
          </h1>
          <p class="text-base text-dark-muted mt-3 leading-relaxed">
            เลือกดูผังที่นั่งจริง ตรวจสอบสถานะที่นั่งว่าง และลงทะเบียนร่วมกิจกรรมของสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบังได้อย่างสะดวกและรวดเร็ว
          </p>
        </div>
      </div>
    </section>
  {/if}

  <!-- Main Catalog Content Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <!-- Filter Toolbar & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
      <!-- Tabs Filter (Clean typography, no dots) -->
      <div class="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border-subtle self-start">
        <button
          type="button"
          onclick={() => activeTab = "all"}
          class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer {
            activeTab === 'all'
              ? 'bg-white text-dark shadow-xs'
              : 'text-dark-muted hover:text-dark hover:bg-white/50'
          }"
        >
          กิจกรรมทั้งหมด
        </button>
        <button
          type="button"
          onclick={() => activeTab = "open"}
          class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer {
            activeTab === 'open'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-dark-muted hover:text-dark hover:bg-white/50'
          }"
        >
          เปิดลงทะเบียน
        </button>
        <button
          type="button"
          onclick={() => activeTab = "upcoming"}
          class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer {
            activeTab === 'upcoming'
              ? 'bg-white text-secondary shadow-xs'
              : 'text-dark-muted hover:text-dark hover:bg-white/50'
          }"
        >
          เร็วๆ นี้
        </button>
      </div>

      <!-- Reactive Search Input -->
      <div class="relative w-full sm:w-80 md:w-96">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-soft">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="ค้นหากิจกรรม, สถานที่ หรือผู้จัด..."
          class="w-full pl-10 pr-9 py-2 rounded-xl border border-border-strong bg-white text-dark text-sm placeholder:text-dark-soft focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-hidden transition-all shadow-2xs"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={clearSearch}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-soft hover:text-dark cursor-pointer"
            aria-label="ล้างคำค้นหา"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Results Status Meta -->
    <div class="pt-6 pb-4 flex items-center justify-between text-xs sm:text-sm text-dark-soft">
      <span>
        พบ {filteredEvents.length} กิจกรรม
        {#if searchQuery}
          สำหรับคำค้นหา "{searchQuery}"
        {/if}
      </span>
    </div>

    <!-- Event Cards Grid / Skeleton Loading -->
    {#if isLoading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {#each Array(6) as _}
          <div class="bg-white rounded-xl border border-border-subtle p-4 flex flex-col gap-3 animate-pulse">
            <div class="w-full aspect-video bg-surface-subtle rounded-lg"></div>
            <div class="h-4 bg-surface-subtle rounded-sm w-1/3"></div>
            <div class="h-6 bg-surface-subtle rounded-sm w-3/4"></div>
            <div class="h-4 bg-surface-subtle rounded-sm w-1/2"></div>
            <div class="h-10 bg-surface-subtle rounded-lg mt-4"></div>
          </div>
        {/each}
      </div>
    {:else if filteredEvents.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {#each filteredEvents as event (event.eventId)}
          <EventBox {event} />
        {/each}
      </div>
    {:else}
      <!-- Honest Empty State -->
      <div class="bg-white rounded-2xl border border-border-subtle p-12 text-center flex flex-col items-center max-w-lg mx-auto my-8">
        <div class="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-dark-soft mb-4">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-dark">ไม่พบกิจกรรมที่ตรงกับเงื่อนไข</h3>
        <p class="text-xs sm:text-sm text-dark-soft mt-1.5 leading-relaxed">
          {#if searchQuery}
            ลองตรวจสอบคำสะกด หรือล้างคำค้นหาเพื่อดูกิจกรรมทั้งหมด
          {:else}
            ยังไม่มีกิจกรรมในหมวดหมู่นี้ในขณะนี้ กรุณาตรวจสอบใหม่อีกครั้งในภายหลัง
          {/if}
        </p>
        {#if searchQuery}
          <button
            type="button"
            onclick={clearSearch}
            class="mt-5 px-4 py-2 rounded-lg bg-surface-subtle hover:bg-border-subtle text-dark text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            ล้างคำค้นหา
          </button>
        {/if}
      </div>
    {/if}
  </main>
</div>
