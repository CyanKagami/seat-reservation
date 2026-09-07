<script lang="ts">
    import PlaceBox from "$lib/components/admin/PlaceBox.svelte"
    import type { CampusLocation } from "$lib/type/location";
    import type { Place } from "$lib/type/place";
    import { onMount } from "svelte";
    const {params} = $props();
    let data: Place = $state({} as Place);
    let locations: CampusLocation[] = $state([])
    onMount(() => {
        fetchPageData()
    })
    function fetchPageData(){
        fetch(`/api/place/${params.placeId}`, {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((result) => {
            data = result.body.data;
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
            data.append("placeId", params.placeId)
        }

        try {
            const res = await fetch("/api/place", {
                method: "PATCH",
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
    <h1 class="text-3xl font-semibold mb-5 text-center">จัดการสถานที่</h1>
    <h2 class="text-center text-xl">ข้อมูลเบื้องต้น</h2>
    <form onsubmit={handleSubmit} class="flex gap-10">
        <div class="w-fit flex flex-col items-center gap-7">
            <div class="rounded-lg">
                <img src="{data.picture || ""}" alt="cover pic" class="rounded-lg block object-cover w-96 h-40">
            </div>
            <input
                    type="file"
                    name="picture"
                    accept="image/png, image/jpeg, image/webp"
                    onchange={handleFileSelect}
                    class="block w-fit text-sm text-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:text-sm file:font-semibold file:border-accent hover:file:bg-accent-hover hover:file:text-white hover:cursor-pointer self-start"
                />
        </div>
        <div class="w-3/5 flex flex-col gap-2">
            <p>ชื่อสถานที่</p>
            <input name="name" class="w-full rounded-lg" value="{data.name || ""}">
            <p>ที่ตั้ง</p>
            <select name="location" class="w-full rounded-lg">
                {#each locations as location}
                        <option value={location.locationId} selected={(data.location.locationId === location.locationId)}>{location.name}</option>
                {/each}
            </select>
            <p>รายละเอียด</p>
            <textarea name="description" class="w-full resize-none h-40 rounded-lg">{data.description}</textarea>
            <div class="flex self-end w-90 gap-3 mt-10">
                <a href="/admin/places" class="w-1/2">
                    <button type="button" class="w-full border-2 border-black h-10 hover:bg-accent-hover hover:cursor-pointer rounded-lg">ยกเลิก</button>
                </a>
                <button class="w-1/2 px-3 bg-accent h-10 hover:bg-accent-hover hover:cursor-pointer text-white rounded-lg">บันทึกการเปลี่ยนแปลง</button>
            </div>
        </div>
    </form>
</div>