<script lang="ts">
  import { untrack } from "svelte";
  import DateRangeSelector from "$lib/components/DateRangeSelector.svelte";
  import { apiFetch } from "$lib/scripts/api";
  import { userStore } from "$lib/store/auth.svelte";
  import { alertModal } from "$lib/store/alert.svelte";
  import type { Daytable } from "$lib/type/event";
  import type { PageData } from "./$types";

  // Receive loaded page data from +page.ts
  let { data }: { data: PageData } = $props();

  interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  interface DateTimeRange {
    start: Date;
    end: Date;
  }
  
  let eventDate : DateTimeRange = $state({
    start: new Date(),
    end: new Date(Date.now() + 86400000 * 3)
  });
  let registerDate : DateTimeRange = $state({
    start: new Date(),
    end: new Date(Date.now() + 86400000 * 3)
  });

  let timetable: Daytable[] = $state([]);
  let isSubmitting = $state(false);

  // Helper to generate list of YYYY-MM-DD date strings between start and end date
  function getDatesInRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return dates;

    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (current <= last) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Derived: All dates available within the current eventDate range
  let availableDates = $derived(getDatesInRange(eventDate.start, eventDate.end));

  // Derived: Dates in the range that don't have a timetable yet
  let unusedDates = $derived(
    availableDates.filter((dateStr) => !timetable.some((item) => item.date === dateStr))
  );

  // Effect: Remove timetables whose dates fall outside the active range when eventDate changes
  $effect(() => {
    const activeDates = availableDates;
    untrack(() => {
      const filtered = timetable.filter((item) => activeDates.includes(item.date));
      if (filtered.length !== timetable.length) {
        timetable = filtered;
      }
    });
  });

  // Add timetable for a specific date
  function addTimetableForDate(dateStr: string) {
    if (!dateStr || timetable.some((t) => t.date === dateStr)) return;

    timetable.push({
      date: dateStr,
      activity: [
        {
          start: "",
          end: "",
          activity: ""
        }
      ]
    });

    timetable.sort((a, b) => a.date.localeCompare(b.date));
  }

  function addActivity(index: number) {
    timetable[index].activity.push({
      start: "",
      end: "",
      activity: "",
    });
  }

  function deleteDay(index: number) {
    timetable.splice(index, 1);
  }

  function deleteActivity(dayIndex: number, activityIndex: number) {
    timetable[dayIndex].activity.splice(activityIndex, 1);
  }

  let imageFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let isUploading = $state<boolean>(false);
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
      alertModal.warning("ไฟล์ไม่ถูกต้อง", errorMessage);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      errorMessage = "ขนาดไฟล์ต้องไม่เกิน 5MB";
      alertModal.warning("ไฟล์ขนาดใหญ่เกินไป", errorMessage);
      return;
    }

    imageFile = file;
    previewUrl = URL.createObjectURL(file);
  }

  function validateTimetable(days: Daytable[]): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(days) || days.length === 0) {
      return { isValid: true, errors: [] };
    }

    const seenDates = new Set<string>();

    days.forEach((day, dayIndex) => {
      const dayNum = dayIndex + 1;

      // 2. ตรวจสอบรูปแบบวันที่ (YYYY-MM-DD)
      if (!day.date || isNaN(Date.parse(day.date))) {
        errors.push(`วันที่ในรายการที่ ${dayNum} ไม่ถูกต้อง`);
      } else {
        // ตรวจสอบวันที่ซ้ำกัน
        if (seenDates.has(day.date)) {
          errors.push(`วันที่ ${day.date} มีรายการซ้ำกัน`);
        }
        seenDates.add(day.date);
      }

      // 3. ตรวจสอบว่ามีกิจกรรมในวันนั้นหรือไม่
      if (!Array.isArray(day.activity) || day.activity.length === 0) {
        errors.push(`วันที่ ${day.date || dayNum} ต้องมีอย่างน้อย 1 กิจกรรม`);
        return;
      }

      // เรียงกิจกรรมตามเวลาเริ่มเพื่อใช้วิเคราะห์การซ้อนทับ (Overlap)
      const sortedActivities = [...day.activity].sort((a, b) =>
        a.start.localeCompare(b.start),
      );

      sortedActivities.forEach((act, actIndex) => {
        const actNum = actIndex + 1;

        // 4. ตรวจสอบการกรอกข้อมูลให้ครบถ้วน
        if (!act.start || !act.end || !act.activity.trim()) {
          errors.push(
            `วันที่ ${day.date}: กิจกรรมที่ ${actNum} กรอกข้อมูลไม่ครบถ้วน`,
          );
          return;
        }

        // 5. ตรวจสอบว่า เวลาจบ ต้องมากกว่า เวลาเริ่ม
        if (act.start >= act.end) {
          errors.push(
            `วันที่ ${day.date}: กิจกรรม "${act.activity}" มีเวลาจบ (${act.end}) ไม่ถูกต้อง (ต้องมากกว่าเวลาเริ่ม ${act.start})`,
          );
        }

        // 6. ตรวจสอบเวลาซ้อนทับกับกิจกรรมก่อนหน้า (Time Overlap Check)
        if (actIndex > 0) {
          const prevAct = sortedActivities[actIndex - 1];
          if (act.start < prevAct.end) {
            errors.push(
              `วันที่ ${day.date}: กิจกรรม "${act.activity}" (${act.start}-${act.end}) มีเวลาซ้อนทับกับ "${prevAct.activity}" (${prevAct.start}-${prevAct.end})`,
            );
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Form Submit Handler
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    const validation = validateTimetable(timetable);
    if (!validation.isValid) {
      alertModal.warning("ข้อมูลตารางกิจกรรมไม่ถูกต้อง", validation.errors.join("\n"));
      return;
    }

    isSubmitting = true;
    let data = new FormData();
    if (e.target) {
      let formData = new FormData(e.target as HTMLFormElement);
      formData.append("start", eventDate.start.toISOString());
      formData.append("end", eventDate.end.toISOString());
      formData.append("register-date-start", registerDate.start.toISOString());
      formData.append("register-date-end", registerDate.end.toISOString());
      if (imageFile) formData.append("img", imageFile, imageFile?.name);
      formData.append("timetable", JSON.stringify(timetable));
      formData.append(
        "creatorId",
        userStore.currentUser?.email ? userStore.currentUser?.email : "",
      );
      data = formData;
    }

    try {
      const res = await apiFetch("/event", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        alertModal.success("สำเร็จ", "บันทึกลง DynamoDB เรียบร้อย!");
      } else {
        const err = await res.json();
        alertModal.failure("เกิดข้อผิดพลาด", err.error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (err) {
      alertModal.failure("เกิดข้อผิดพลาด", "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  class="flex flex-col items-center mt-24 sm:mt-32 border-5 rounded-2xl border-secondary w-2/4 self-center p-5 pt-12"
>
  <h1 class="text-4xl font-bold">เพิ่มกิจกรรม</h1>
  <form
    class="flex flex-col gap-5"
    onsubmit={handleSubmit}
    enctype="multipart/form-data"
  >
    <label for="picture" class="text-xl font-bold">รูปภาพหน้าปก</label>
    <div class="flex flex-col items-center gap-4 border-b pb-5 border-dashed">
      <!-- Preview Box -->
      {#if previewUrl}
        <div
          class="relative w-64 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        >
          <img
            src={previewUrl}
            alt="Preview"
            class="w-full h-full object-cover"
          />
        </div>
      {:else}
        <div
          class="relative w-64 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        ></div>
      {/if}

      <!-- Input Field & Info Label -->
      <div class="flex flex-col gap-1.5 self-start">
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onchange={handleFileSelect}
          class="block w-fit text-sm text-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:text-sm file:font-semibold file:border-accent hover:file:bg-accent-hover hover:file:text-white hover:cursor-pointer"
        />
        <span class="text-xs text-gray-500">รองรับไฟล์ JPG, PNG และ WEBP (ขนาดไม่เกิน 5MB)</span>
      </div>
    </div>

    <div class="flex w-full gap-3 justify-between items-center">
      <label for="name">ชื่อกิจกรรม</label>
      <input name="name" class="w-100 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
    </div>
    <div class="flex w-full gap-3 justify-between items-center">
      <label for="host">ชื่อผู้จัด</label>
      <input name="host" class="w-100 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
    </div>
    <div class="flex w-full gap-3 justify-between items-center">
      <label for="place">สถานที่จัด</label>
      <select name="place" class="w-100 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
        {#each data.places as place}
          <option value={place.placeId}>{place.name} ({place.location.name})</option>
        {/each} 
      </select>
    </div>
    <div class="flex w-full gap-3 justify-between items-start">
      <label for="detail" class="mt-2">รายละเอียด</label>
      <textarea name="detail" class="resize-none w-100 h-30 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      ></textarea>
    </div>
    <div class="flex w-full gap-3 justify-between items-center">
      <label for="condition">เงื่อนไขการเข้าร่วมกิจกรรม</label>
      <input name="condition" class="w-100 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
    </div>

    <div class="flex w-full gap-3 justify-between items-center">
      <label for="event-date">ช่วงเวลาจัดกิจกรรม</label>
      <div class="flex w-100 justify-between items-center">
        <DateRangeSelector bind:value={eventDate}></DateRangeSelector>
      </div>
    </div>
    <div class="flex w-full gap-3 justify-between items-center">
      <label for="register-date">เวลาเปิดลงทะเบียน</label>
      <div class="w-100 flex justify-between items-center">
        <DateRangeSelector bind:value={registerDate}></DateRangeSelector>
      </div>
    </div>

    <div class="my-10">
      <label for="timetable" class="text-xl font-bold block mb-3">ตารางกิจกรรม</label>

      <!-- Date selector chips -->
      {#if unusedDates.length > 0}
        <div class="flex flex-col gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span class="text-sm font-semibold text-gray-700">เลือกวันที่ต้องการเพิ่มตารางกิจกรรม:</span>
          <div class="flex flex-wrap gap-2">
            {#each unusedDates as dateStr}
              <button
                type="button"
                onclick={() => addTimetableForDate(dateStr)}
                class="px-3 py-1.5 bg-accent/10 text-accent font-medium hover:bg-accent hover:text-white rounded-lg text-sm transition-colors border border-accent/30 flex items-center gap-1 cursor-pointer"
              >
                <span>+</span>
                <span>{dateStr}</span>
              </button>
            {/each}
          </div>
        </div>
      {:else if availableDates.length > 0 && timetable.length === availableDates.length}
        <p class="text-sm text-gray-500 mb-6 italic">เพิ่มตารางกิจกรรมครบทุกวันในช่วงเวลานี้แล้ว</p>
      {/if}

      <!-- Timetables list -->
      <div class="flex flex-col gap-8">
        {#each timetable as table, dayIndex}
          <div class="flex flex-col gap-3 p-4 border border-gray-200 rounded-xl bg-white shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-lg text-slate-800">{table.date}</span>
            </div>

            {#if table.activity.length > 0}
              <table class="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="py-3 px-4 text-center font-normal text-gray-700">เริ่มกิจกรรม</th>
                    <th class="py-3 px-4 text-center font-normal text-gray-700">สิ้นสุดกิจกรรม</th>
                    <th class="py-3 px-4 text-center font-normal text-gray-700">กิจกรรม</th>
                    <th class="py-3 px-4 text-center font-normal text-gray-700">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {#each table.activity as activity, activityIndex}
                    <tr class={activityIndex % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                      <td class="py-3 px-4 text-center">
                        <input type="time" class="rounded-lg border border-slate-200 px-2.5 py-1 text-center text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" bind:value={activity.start} />
                      </td>
                      <td class="py-3 px-4 text-center">
                        <input type="time" class="rounded-lg border border-slate-200 px-2.5 py-1 text-center text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" bind:value={activity.end} />
                      </td>
                      <td class="py-3 px-4 text-center">
                        <input type="text" class="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" bind:value={activity.activity} />
                      </td>
                      <td class="py-3 px-4 text-center">
                        <button
                          type="button"
                          onclick={() => deleteActivity(dayIndex, activityIndex)}
                          disabled={table.activity.length === 1}
                          class="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600 transition-colors duration-200"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}

            <div class="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onclick={() => deleteDay(dayIndex)}
                class="bg-red-500 px-5 py-2 text-white rounded-lg hover:cursor-pointer hover:bg-red-600 transition-colors duration-200" 
              >
                ลบวัน
              </button>
              <button
                type="button"
                onclick={() => addActivity(dayIndex)}
                class="bg-secondary px-5 py-2 text-white rounded-lg hover:cursor-pointer hover:bg-secondary-hover transition-colors duration-200"
              >
                เพิ่มกิจกรรม
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="flex w-full justify-end mt-5">
      <button 
        type="submit" 
        disabled={isSubmitting} 
        class="bg-gray-300 py-3 px-5 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? "กำลังบันทึก..." : "สร้าง"}
      </button>
    </div>
  </form>
</div>