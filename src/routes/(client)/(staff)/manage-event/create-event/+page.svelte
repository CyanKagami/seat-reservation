<script lang="ts">
    let timetable = $state([
    { start: '09:00', end: '10:00', activity: '' }
  ]);
  let isSubmitting = $state(false);

  // ฟังก์ชันเพิ่มแถว
  function addRow() {
    // ดึงเวลา end ของแถวล่าสุดมาตั้งเป็น start ของแถวใหม่ (ถ้ามี)
    const lastEnd = timetable.length > 0 ? timetable[timetable.length - 1].end : '09:00';
    timetable.push({ start: lastEnd, end: '', activity: '' });
  }

  // ฟังก์ชันลบแถว
  function removeRow(index:Number) {
    timetable = timetable.filter((_, i) => i !== index);
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

  // Form Submit Handler
  async function handleSubmit(e:SubmitEvent) {
    e.preventDefault();

    // Validation เบื้องต้น
    for (const item of timetable) {
      if (!item.start || !item.end || !item.activity.trim()) {
        alert('กรุณากรอกข้อมูลในทุกช่องให้ครบถ้วน');
        return;
      }
      if (item.start >= item.end) {
        alert(`เวลาจบ (${item.end}) ต้องมากกว่าเวลาเริ่ม (${item.start})`);
        return;
      }
    }

    isSubmitting = true;

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable })
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
    <form class="flex flex-col gap-5">
        <label for="picture">รูปภาพหน้าปก</label>
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
            class="block w-full text-sm text-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:text-sm file:font-semibold file:border-accent  hover:file:bg-accent-hover hover:file:text-white hover:cursor-pointer"
            />

        </div>

        <div class="flex w-full gap-3 justify-between">
          <label for="name">ชื่อกิจกรรม</label>
          <input name="name" class="w-100 rounded-sm">
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
            <label for="timetable">ตารางเวลากิจกรรม</label>
            {#each timetable as item, index}
                <div class="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-3 {index === 0 ? "border-t" : ""} border-b">
                    <input type="time" bind:value={item.start} class="border p-2 rounded w-full sm:w-32" required />
                    <span class="hidden sm:inline">-</span>
                    <input type="time" bind:value={item.end} class="border p-2 rounded w-full sm:w-32" required />
                    <input type="text" bind:value={item.activity} placeholder="ชื่อกิจกรรม" class="border p-2 rounded flex-1 w-full" required />

                    {#if timetable.length > 1}
                        <button type="button" onclick={() => removeRow(index)} class="text-red-500 hover:bg-red-50 p-2 rounded">
                        ลบ
                        </button>
                    {/if}
                </div>
            {/each}

            <div class="flex justify-end pt-4">
                <button type="button" onclick={addRow} class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg">
                + เพิ่มรายการ
                </button>
            </div>
        </div>

        <div class="flex justify-end mt-5">
            <button type="submit" class="bg-gray-300 py-3 px-5 cursor-pointer">สร้าง</button>
        </div>
    </form>
</div>
