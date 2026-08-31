<script lang="ts">
  import { userStore } from "$lib/store/auth.svelte";
  import type { Daytable } from "$lib/type/event";

  interface ValidationResult {
  isValid: boolean;
  errors: string[];
  }

  let timetable:Daytable [] = $state([])
  let isSubmitting = $state(false);

  // ฟังก์ชันเพิ่มแถว
  function addDate() {
    timetable.push({
      date: "",
      activity: []
    })
  }

  function addActivity(index:number) {
    timetable[index].activity.push(
      {
        start:"",
        end:"",
        activity:""
      }
    )
  }

  function deleteDay(index:number) {
    timetable.splice(index, 1)
  }

  function deleteActivity(dayIndex:number, activityIndex:number) {
    timetable[dayIndex].activity.splice(activityIndex, 1)
  }

  let imageFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let isUploading = $state<boolean>(false);
  let errorMessage = $state<string | null>(null);

  // จำกัดขนาดไฟล์ที่ 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    errorMessage = null;

    if (!file) return;

    // 1. Client-side Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      errorMessage = 'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP เท่านั้น';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      errorMessage = 'ขนาดไฟล์ต้องไม่เกิน 5MB';
      return;
    }

    imageFile = file;
    previewUrl = URL.createObjectURL(file);
  }

  function validateTimetable(days: Daytable[]): ValidationResult {
  const errors: string[] = [];

  // 1. ตรวจสอบว่าต้องมีอย่างน้อย 1 วัน
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
    const sortedActivities = [...day.activity].sort((a, b) => a.start.localeCompare(b.start));

    sortedActivities.forEach((act, actIndex) => {
      const actNum = actIndex + 1;

      // 4. ตรวจสอบการกรอกข้อมูลให้ครบถ้วน
      if (!act.start || !act.end || !act.activity.trim()) {
        errors.push(`วันที่ ${day.date}: กิจกรรมที่ ${actNum} กรอกข้อมูลไม่ครบถ้วน`);
        return;
      }

      // 5. ตรวจสอบว่า เวลาจบ ต้องมากกว่า เวลาเริ่ม
      if (act.start >= act.end) {
        errors.push(
          `วันที่ ${day.date}: กิจกรรม "${act.activity}" มีเวลาจบ (${act.end}) ไม่ถูกต้อง (ต้องมากกว่าเวลาเริ่ม ${act.start})`
        );
      }

      // 6. ตรวจสอบเวลาซ้อนทับกับกิจกรรมก่อนหน้า (Time Overlap Check)
      if (actIndex > 0) {
        const prevAct = sortedActivities[actIndex - 1];
        if (act.start < prevAct.end) {
          errors.push(
            `วันที่ ${day.date}: กิจกรรม "${act.activity}" (${act.start}-${act.end}) มีเวลาซ้อนทับกับ "${prevAct.activity}" (${prevAct.start}-${prevAct.end})`
          );
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

  // Form Submit Handler
  async function handleSubmit(e:SubmitEvent) {
    e.preventDefault();

    // Validation เบื้องต้น
    if (!validateTimetable(timetable).isValid) {
      alert (validateTimetable(timetable).errors)
      return
    }

    isSubmitting = true;
    let data = new FormData()
    if (e.target) {
      let formData = new FormData(e.target as HTMLFormElement)
      if (imageFile) formData.append("img", imageFile, imageFile?.name)
      formData.append("timetable",JSON.stringify(timetable))
      formData.append("host", userStore.currentUser?.email ? userStore.currentUser?.email : "")
      data = formData
    }

    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        body: data
      });

      if (res.ok) {
        alert('บันทึกลง DynamoDB เรียบร้อย!');
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error}`);
      }
    } catch (err) {
      alert('ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      isSubmitting = false;
    }
  }
</script>
<div class="flex flex-col items-center mt-5 border-5 rounded-2xl border-secondary w-2/4 self-center p-5 pt-12">
    <h1 class="text-4xl font-bold">เพิ่มกิจกรรม</h1>
    <form class="flex flex-col gap-5" onsubmit={handleSubmit} enctype="multipart/form-data">
        <label for="picture" class="text-xl font-bold">รูปภาพหน้าปก</label>
        <div class="flex flex-col items-center gap-4 border-b pb-5 border-dashed">
            <!-- Preview Box -->
            {#if previewUrl}
            <div class="relative w-64 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
            </div>
            {:else}
            <div class="relative w-64 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            </div>
            {/if}

            <!-- Input Field -->
            <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onchange={handleFileSelect}
            class="block w-fit text-sm text-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:text-sm file:font-semibold file:border-accent  hover:file:bg-accent-hover hover:file:text-white hover:cursor-pointer self-start"
            />

        </div>

        <div class="flex w-full gap-3 justify-between">
          <label for="name">ชื่อกิจกรรม</label>
          <input name="name" class="w-100 rounded-sm" required>
        </div>
        <div class="flex w-full gap-3 justify-between">
          <label for="place">สถานที่จัด</label>
          <input name="place" class="w-100 rounded-sm">
        </div>
        <div class="flex w-full gap-3 justify-between">
          <label for="detail">รายละเอียด</label>
          <textarea name="detail" class="resize-none w-100 h-30 rounded-sm"></textarea>
        </div>
        <div class="flex w-full gap-3 justify-between">
          <label for="condition">เงื่อนไขการเข้าร่วมกิจกรรม</label>
          <input name="condition" class="w-100 rounded-sm">
        </div>

         <div class="flex w-full gap-3 justify-between items-center">
          <label for="start">ช่วงเวลาจัดกิจกรรม</label>
          <div class="flex w-100 justify-between items-center">
            <input type="datetime-local" name="start" class="w-45 rounded-sm">
            <p>-</p>
            <input type="datetime-local" name="end" class="w-45 rounded-sm">
          </div>
        </div>
        <div class="flex w-full gap-3 justify-between items-center">
          <label for="start">เวลาเปิดลงทะเบียน</label>
          <div class="w-100 flex justify-between items-center">
             <input type="datetime-local" name="register-date-start" class="w-45 rounded-sm">
              <p>-</p>
              <input type="datetime-local" name="register-date-end" class="w-45 rounded-sm">
          </div>

        </div>


        <div class="my-10">
            <label for="timetable" class="text-xl font-bold block">ตารางเวลากิจกรรม</label>
            <div>
                {#each timetable as table, dayIndex}
                  <input type="date" class="w-45 rounded-sm block" bind:value={table.date}>
                  {#each table.activity as activity, activityIndex }
                  <div class="flex">
                    <input type="time" class="w-45 rounded-sm block" bind:value={activity.start}>
                    <input type="time" class="w-45 rounded-sm block" bind:value={activity.end}>
                    <input type="text" class="w-45 rounded-sm block" bind:value={activity.activity}>
                    <button type="button" onclick={() => deleteActivity(dayIndex, activityIndex)} class="bg-red-500 text-white p-3">ลบ</button>
                  </div>
                  {/each}
                  <div class="flex justify-end w-full">
                    <button type="button" onclick={() => addActivity(dayIndex)} class="bg-secondary p-3 text-white rounded-lg">เพิ่มกิจกรรม</button>
                    <button type="button" onclick={() => deleteDay(dayIndex)} class="bg-red-500 p-3 text-white rounded-lg">ลบวัน</button>
                  </div>
              {/each}

            </div>

            <div class="flex justify-end">
              <button type="button" onclick={addDate} class="bg-accent p-3 text-white rounded-lg">เพิ่มวัน</button>
            </div>
        </div>

        <div class="flex w-full justify-end mt-5">
            <button type="submit" class="bg-gray-300 py-3 px-5 cursor-pointer">สร้าง</button>
        </div>
    </form>
</div>
