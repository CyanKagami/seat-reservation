<script lang="ts">
    import PlaceBox from "$lib/components/admin/PlaceBox.svelte";
  import { apiFetch } from "$lib/scripts/api";
    import { alertModal } from "$lib/store/alert.svelte";
    import type { CampusLocation } from "$lib/type/location";
  import type { Place } from "$lib/type/place";
  import { onMount } from "svelte";

  let places: Place[] = $state([]);
  let locations: CampusLocation[] = $state([]);
  let searchQuery = $state("");
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);

  onMount(() => {
    void fetchPageData();
  });

  async function fetchPageData() {
    try {
      isLoading = true;
      loadError = null;
      const [placesResponse, locationsResponse] = await Promise.all([
        apiFetch("/place", { method: "GET" }),
        apiFetch("/location", { method: "GET" })
      ]);
      if (!placesResponse.ok || !locationsResponse.ok) {
        throw new Error("Unable to load places and locations.");
      }
      const [placesData, locationsData] = await Promise.all([
        placesResponse.json(),
        locationsResponse.json()
      ]);
      places = placesData.body.data;
      locations = locationsData.body.data;
    } catch (error) {
      loadError = "ไม่สามารถโหลดข้อมูลสถานที่ได้ กรุณาลองอีกครั้ง";
    } finally {
      isLoading = false;
    }
  }

  const filteredPlaces = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return places;
    return places.filter((place) =>
      place.name?.toLowerCase().includes(query) ||
      place.location?.name?.toLowerCase().includes(query) ||
      place.creatorName?.toLowerCase().includes(query)
    );
  });

  let isCreatePopupOpen = $state(false);
  let imageFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let isSubmitting = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  // จำกัดขนาดไฟล์ที่ 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  function handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    errorMessage = null;

    if (!file) return;

    // 1. Client-side Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      errorMessage = "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP เท่านั้น";
      target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      errorMessage = "ขนาดไฟล์ต้องไม่เกิน 5MB";
      target.value = "";
      return;
    }

    imageFile = file;
    previewUrl = URL.createObjectURL(file);
  }
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();


    isSubmitting = true;
    let data = new FormData();
    if (e.target) {
      let formData = new FormData(e.target as HTMLFormElement);
      if (imageFile) formData.set("picture", imageFile, imageFile?.name);
      data = formData;
    }

    try {
      const res = await apiFetch("/place", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        alertModal.success("สำเร็จ", "บันทึกลง DynamoDB เรียบร้อย!");
        await fetchPageData();
      } else {
        const err = await res.json();
        alertModal.failure("เกิดข้อผิดพลาด", String(err.error));
      }
    } catch (err) {
      alertModal.failure("เกิดข้อผิดพลาด", `ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ: ${String(err)}`);
    } finally {
      isSubmitting = false;
      isCreatePopupOpen = false;
    }
  }
</script>
<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <nav class="mb-5 flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
        <a href="/admin/users" class="transition-colors hover:text-dark">ผู้ดูแลระบบ</a>
        <span aria-hidden="true">/</span>
        <span class="truncate font-semibold text-dark-muted">สถานที่จัดงาน</span>
    </nav>
    <div class="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-dark sm:text-3xl">สถานที่จัดงาน</h1>
            <p class="mt-1 text-sm text-dark-soft">จัดการสถานที่และผังที่นั่งสำหรับกิจกรรม</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="relative w-full sm:w-64 md:w-72">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-dark-soft">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                    </svg>
                </div>
                <input
                    type="search"
                    bind:value={searchQuery}
                    placeholder="ค้นหาสถานที่..."
                    aria-label="ค้นหาสถานที่"
                    class="w-full rounded-xl border border-border-strong bg-white py-2 pl-9 pr-3 text-sm text-dark placeholder:text-dark-soft focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-hidden"
                />
            </div>
            <button
                type="button"
                onclick={() => {isCreatePopupOpen = true;}}
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:cursor-pointer hover:bg-accent-hover"
            >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>เพิ่มสถานที่</span>
            </button>
        </div>
    </div>

    <div class="pt-8">
        {#if isLoading}
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {#each Array(3) as _}
                    <div class="animate-pulse rounded-2xl border border-border-subtle bg-white p-4">
                        <div class="aspect-video rounded-xl bg-surface-subtle"></div>
                        <div class="mt-4 h-5 w-3/4 rounded-sm bg-surface-subtle"></div>
                        <div class="mt-2 h-4 w-1/2 rounded-sm bg-surface-subtle"></div>
                    </div>
                {/each}
            </div>
        {:else if loadError}
            <div class="rounded-2xl border border-border-subtle bg-white px-6 py-10 text-center">
                <p class="text-sm text-dark-muted">{loadError}</p>
                <button onclick={fetchPageData} class="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover cursor-pointer">ลองอีกครั้ง</button>
            </div>
        {:else if filteredPlaces.length === 0}
            <div class="mx-auto my-8 flex max-w-md flex-col items-center rounded-2xl border border-border-subtle bg-white p-10 text-center">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-subtle/70 text-secondary">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M5 21V7l8-4v18m6 0V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01m8-5v.01m0 3v.01" />
                    </svg>
                </div>
                <h2 class="text-lg font-bold text-dark">{searchQuery ? "ไม่พบสถานที่ที่ค้นหา" : "ยังไม่มีสถานที่จัดงาน"}</h2>
                <p class="mt-1.5 text-sm leading-relaxed text-dark-soft">
                    {searchQuery ? "ลองตรวจสอบคำค้นหาหรือล้างคำค้นหา" : "เพิ่มสถานที่เพื่อเริ่มจัดการผังที่นั่ง"}
                </p>
                {#if !searchQuery}
                    <button
                        type="button"
                        onclick={() => {isCreatePopupOpen = true;}}
                        class="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover cursor-pointer"
                    >
                        + เพิ่มสถานที่แรก
                    </button>
                {/if}
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                {#each filteredPlaces as place (place.placeId)}
                    <PlaceBox {place} />
                {/each}
            </div>
        {/if}
    </div>

    {#if isCreatePopupOpen}
    <form method="POST" onsubmit={handleSubmit} enctype="multipart/form-data" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <div class="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-2xl sm:p-7">
            <div>
                <h2 class="text-xl font-bold text-dark sm:text-2xl">เพิ่มสถานที่</h2>
                <p class="mt-1 text-sm text-dark-soft">กรอกข้อมูลและเลือกรูปภาพหน้าปกของสถานที่</p>
            </div>
            <div class="w-full">
                <label for="picture" class="mb-2 block text-sm font-semibold text-dark">รูปภาพหน้าปก</label>
                <div class="flex flex-col gap-4 border-b border-dashed border-border-subtle pb-5">
                    <div class="relative aspect-video w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-base sm:max-w-sm">
                        {#if previewUrl}
                            <img src={previewUrl} alt="ตัวอย่างรูปภาพสถานที่" class="h-full w-full object-cover" />
                        {:else}
                            <div class="flex h-full items-center justify-center text-sm text-dark-soft">ยังไม่ได้เลือกรูปภาพ</div>
                        {/if}
                    </div>
                    <input
                        id="picture"
                        type="file"
                        name="picture"
                        accept="image/png, image/jpeg, image/webp"
                        onchange={handleFileSelect}
                        class="block w-full text-sm text-dark file:mr-4 file:rounded-lg file:border file:border-accent file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:cursor-pointer hover:file:bg-accent-hover hover:file:text-white"
                    />
                    {#if errorMessage}
                        <p class="text-sm font-medium text-red-600" role="alert">{errorMessage}</p>
                    {/if}
                </div>
            </div>
            <div class="w-full">
                <label for="place-name" class="mb-2 block text-sm font-semibold text-dark">ชื่อสถานที่</label>
                <input id="place-name" name="name" class="w-full rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-sm text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden" required>
            </div>
            <div class="w-full">
                <label for="place-location" class="mb-2 block text-sm font-semibold text-dark">สถานที่ตั้ง</label>
                <select id="place-location" name="location" class="w-full rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-sm text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden" required>
                    {#each locations as location}
                        <option value={location.locationId}>{location.name}</option>
                    {/each}
                </select>
            </div>
            <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" class="rounded-xl border border-border-strong bg-white px-5 py-3 text-sm font-semibold text-dark transition-colors hover:bg-surface-subtle sm:min-w-28 cursor-pointer" onclick={() => {isCreatePopupOpen = false}}>ยกเลิก</button>
                <button type="submit" disabled={isSubmitting} class="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-28 cursor-pointer">
                    {isSubmitting ? "กำลังบันทึก..." : "สร้างสถานที่"}
                </button>
            </div>
        </div>
    </form>
    {/if}
</div>