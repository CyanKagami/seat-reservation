<script lang="ts">
  import { onMount } from "svelte";

    onMount(() => {

    })
</script>
<div class="w-full max-w-6xl mx-auto mt-10 px-5">
    <h1 class="text-3xl font-semibold mb-5 text-center">บัญชีผู้ใช้</h1>
    <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>
    <hr class="my-5 border-dim-gray">
    <table class="w-full border-separate border-spacing-0 border border-dim-gray rounded-lg overflow-hidden">
        <thead>
            <tr class="bg-pale">
                <th class="border border-dim-gray p-2 text-left rounded-tl-lg">อีเมล</th>
                <th class="border border-dim-gray p-2 text-left">ชื่อ</th>
                <th class="border border-dim-gray p-2 text-left">บทบาท</th>
                <th class="border border-dim-gray p-2 text-left rounded-tr-lg">Action</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="border border-dim-gray p-2">John Doe</td>
                <td class="border border-dim-gray p-2">john.doe@example.com</td>
                <td class="border border-dim-gray p-2">User</td>
                <td class="border border-dim-gray p-2">
                    <button class="bg-secondary cursor-pointer text-white w-full px-3 py-1 rounded-lg hover:bg-accent-dark">แก้ไขบทบาท</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>