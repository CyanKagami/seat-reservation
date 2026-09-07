<script lang="ts">
    import PlaceBox from "$lib/components/admin/PlaceBox.svelte"
    import type { CampusLocation } from "$lib/type/location";
    import type { Place } from "$lib/type/place";
    import { onMount } from "svelte";
    const {params} = $props();
    let data: Place;
    let locations: CampusLocation[] = $state([])
    onMount(() => {
        fetchPageData()
    })
    function fetchPageData(){
        fetch(`/api/place/${params.placeId}`, {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            data = data.body.data;
        })
        fetch("/api/location", {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            locations = data.body.data;
        })
    }
    let isCreatePopupOpen = $state(false)
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
        return;
        }

        if (file.size > MAX_FILE_SIZE) {
        errorMessage = "ขนาดไฟล์ต้องไม่เกิน 5MB";
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
            if (imageFile) formData.append("picture", imageFile, imageFile?.name);
            data = formData;
        }

        try {
            const res = await fetch("/api/place", {
                method: "POST",
                body: data,
            });

            if (res.ok) {
                alert("บันทึกลง DynamoDB เรียบร้อย!");
                fetchPageData();
            } else {
                const err = await res.json();
                alert(`เกิดข้อผิดพลาด: ${err.error}`);
            }
        } catch (err) {
            alert("ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
        } finally {
            isSubmitting = false;
        }
    }
</script>
<div class="w-full max-w-6xl mx-auto mt-10 px-5">
    <h1 class="text-3xl font-semibold mb-5 text-center">สถานที่จัดงาน</h1>
    <div class="flex justify-between items-center">
        <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>
        <button onclick={() => {isCreatePopupOpen = true}} class = "px-5 h-12 bg-secondary rounded-lg text-white hover:bg-secondary-hover hover:cursor-pointer">+ เพิ่มสถานที่</button>
    </div>

    <hr class="my-5 border-dim-gray">
        <!--content-->
    <!--Event Registration-->
        <div class="w-full flex flex-wrap gap-15 gap-y-10">
        {#each places as place }
            <PlaceBox place={place}></PlaceBox>
        {/each}
        </div>

    <!--Create Place Popup-->
    {#if isCreatePopupOpen}
    <form method="POST" onsubmit={handleSubmit} enctype="multipart/form-data" class="w-full h-full bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center">
        <div class="bg-white w-120 rounded-lg flex flex-col items-center p-7 gap-4">
            <p class="text-2xl font-semibold">เพิ่มสถานที่</p>
            <div class="w-full">
                <label for="picture" class="mb-4 block">รูปภาพหน้าปก</label>
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

                <!-- Input Field -->
                <input
                    type="file"
                    name="picture"
                    accept="image/png, image/jpeg, image/webp"
                    onchange={handleFileSelect}
                    class="block w-fit text-sm text-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:text-sm file:font-semibold file:border-accent hover:file:bg-accent-hover hover:file:text-white hover:cursor-pointer self-start"
                />
                </div>
            </div>
            
            <div class="w-full">
                <p>ชื่อสถานที่</p>
                <input name="name" class="w-full rounded-lg" required>
            </div>
            <div class="w-full">
                <p>สถานที่ตั้ง</p>
                <select name="location" class="w-full rounded-lg">
                    {#each locations as location}
                        <option value={location.locationId}>{location.name}</option>
                    {/each}
                    
                </select>
            </div>
            <div class="w-full flex justify-between gap-3">
                <button class="w-1/2 border-2 border-black h-10 hover:bg-accent-hover hover:cursor-pointer rounded-lg" onclick={() => {isCreatePopupOpen = false}}>ยกเลิก</button>
                <button class="w-1/2 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg">สร้าง</button>
            </div>
        </div>
    </form>
    {/if}
</div>