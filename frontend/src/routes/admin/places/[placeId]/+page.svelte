<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/scripts/api.js";
  import { invalidateAll } from "$app/navigation";
  import { alertModal } from "$lib/store/alert.svelte";
  import type { CampusLocation } from "$lib/type/location";
  import type { Place } from "$lib/type/place";
  import type { PageData } from "./$types";

  const { data, params }: { data: PageData; params: { placeId: string } } = $props();
  let place: Place | null = $state(null);
  let locations: CampusLocation[] = $derived(data.locations);
  let imageFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  $effect(() => {
    place = data.place;
  });

  onMount(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  function handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    errorMessage = null;

    if (!file) return;

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

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    imageFile = file;
    previewUrl = URL.createObjectURL(file);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!place) return;

    isSubmitting = true;
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) {
      isSubmitting = false;
      throw new Error("Place form is unavailable.");
    }

    const formData = new FormData(formElement);
    if (imageFile) formData.set("picture", imageFile, imageFile.name);
    else formData.set("picture", "");
    formData.set("placeId", params.placeId);

    try {
      const response = await apiFetch("/place", {
        method: "PATCH",
        body: formData
      });

      if (!response.ok) {
        const result = await response.json();
        alertModal.failure("เกิดข้อผิดพลาด", result.error || "ไม่สามารถบันทึกข้อมูลได้");
        return;
      }

      alertModal.success("สำเร็จ", "บันทึกการเปลี่ยนแปลงเรียบร้อย!");
      imageFile = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      await invalidateAll();
    } catch (error) {
      alertModal.failure("เกิดข้อผิดพลาด", "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
  <nav class="mb-5 flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
    <a href="/admin/users" class="shrink-0 transition-colors hover:text-dark">ผู้ดูแลระบบ</a>
    <span aria-hidden="true">/</span>
    <a href="/admin/places" class="shrink-0 transition-colors hover:text-dark">สถานที่จัดงาน</a>
    <span aria-hidden="true">/</span>
    <span class="truncate font-semibold text-dark-muted">{place?.name || "จัดการสถานที่"}</span>
  </nav>

  <header class="mb-6">
    <h1 class="text-2xl font-bold tracking-tight text-dark sm:text-3xl">จัดการสถานที่</h1>
    <p class="mt-1 text-sm text-dark-soft">แก้ไขข้อมูลสถานที่และจัดการแผนผังที่นั่ง</p>
  </header>

  {#if place}
    <form onsubmit={handleSubmit} enctype="multipart/form-data" class="flex flex-col gap-6">
      <section class="rounded-2xl border border-border-subtle bg-white p-4 shadow-xs sm:p-6">
        <div class="mb-5 border-b border-border-subtle pb-4">
          <h2 class="text-lg font-bold text-dark sm:text-xl">ข้อมูลเบื้องต้น</h2>
          <p class="mt-1 text-sm text-dark-soft">ข้อมูลและรูปภาพของสถานที่จัดงาน</p>
        </div>

        <div class="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div class="flex min-w-0 flex-col gap-2">
            <label for="picture" class="text-sm font-semibold text-dark">รูปภาพหน้าปก</label>
            <div class="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-border-subtle bg-surface-base p-4 sm:flex-row sm:items-center">
              <div class="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-white sm:w-64">
                <img
                  src={previewUrl || place.picture || "/image/defaultEvent.png"}
                  alt={`รูปภาพสถานที่ ${place.name}`}
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="flex min-w-0 flex-col gap-2">
                <input
                  id="picture"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onchange={handleFileSelect}
                  class="block w-full min-w-0 text-sm text-dark file:mr-3 file:rounded-xl file:border-0 file:bg-secondary-subtle file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary hover:file:cursor-pointer hover:file:bg-secondary-subtle/70"
                />
                <p class="text-xs text-dark-soft">รองรับ JPG, PNG และ WEBP (ขนาดไม่เกิน 5MB)</p>
              </div>
            </div>
            {#if errorMessage}
              <p class="text-sm font-medium text-red-600" role="alert">{errorMessage}</p>
            {/if}
          </div>

          <div class="flex min-w-0 flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label for="name" class="text-sm font-semibold text-dark">ชื่อสถานที่</label>
              <input
                id="name"
                name="name"
                bind:value={place.name}
                required
                class="w-full rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-sm text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="location" class="text-sm font-semibold text-dark">สถานที่ตั้ง</label>
              <select
                id="location"
                name="location"
                value={place.location?.locationId || ""}
                required
                class="w-full rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-sm text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden"
              >
                {#each locations as location (location.locationId)}
                  <option value={location.locationId}>{location.name}</option>
                {/each}
              </select>
            </div>

            <div class="flex min-w-0 flex-col gap-2">
              <label for="description" class="text-sm font-semibold text-dark">รายละเอียด</label>
              <textarea
                id="description"
                name="description"
                bind:value={place.description}
                rows="5"
                class="w-full resize-y rounded-xl border border-border-strong bg-surface-base px-4 py-3 text-sm text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
          <a
            href="/admin/places"
            class="inline-flex items-center justify-center rounded-xl border border-border-strong bg-white px-5 py-3 text-sm font-semibold text-dark transition-colors hover:bg-surface-subtle sm:min-w-32"
          >
            ยกเลิก
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            class="inline-flex items-center justify-center rounded-xl bg-accent cursor-pointer px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-subtle/70 text-secondary">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 21h18M5 21V7l8-4v18m6 0V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01m8-5v.01m0 3v.01" />
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="font-bold text-dark">แผนผังที่นั่ง</h2>
            <p class="mt-1 text-sm text-dark-soft">จัดการผังและกำหนดที่นั่งของสถานที่นี้</p>
          </div>
        </div>
        <a
          href="/admin/places/{params.placeId}/seatmap"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-hover"
        >
          แก้ไขแผนผัง
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </a>
      </section>
    </form>
  {/if}
</div>
