<script lang="ts">
  import type { User } from "$lib/type/user";
  import { onMount } from "svelte";
    let users:User[] = $state([])
    let currentPage = $state(1);
    let token:string[] = $state([])
    let editing = $state({index: -1, role: ''});
    onMount(async () => {
        await fetch("/api/user", {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            users = data.body.items;
            token.push(data.body.nextToken);
        })
    })

    async function fetchNextPage() {
        let fetchUrl = "/api/user?nextToken=" + token[currentPage - 1];
        if (token[currentPage - 1] === null) return; // No more pages
        await fetch(fetchUrl, {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            users = data.body.items;
            if (currentPage > token.length) {
                token.push(data.body.nextToken);
            }
        })
        currentPage += 1;
        editing = {index: -1, role: ''}; // Reset editing state when changing pages
    }

    async function fetchPreviousPage() {
        if (currentPage === 1) return; // No previous page
        let fetchUrl = "/api/user?nextToken=" + token[currentPage - 3];
        if (currentPage === 2) {
            fetchUrl = "/api/user";
        }
        await fetch(fetchUrl, {method: 'GET' , credentials: 'include'})
        .then((res) => res.json())
        .then((data) => {
            users = data.body.items;
        })
        currentPage -= 1;
        editing = {index: -1, role: ''}; // Reset editing state when changing pages
    }

    async function saveRole(index:number) {
        await fetch(`/api/user/editRole?userId=${encodeURIComponent(users[index].userId)}&email=${encodeURIComponent(users[index].email)}&role=${encodeURIComponent(editing.role)}`, {
            method: 'POST',
            credentials: 'include'
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.statusCode === 200) {
                users[index].role = editing.role;
            } else {
                alert("Failed to update role: " + data.body.error);
            }
        })
        editing = {index: -1, role: ''}; // Reset editing state when changing pages
    }

    function editRole(index:number) {
        editing = {index, role: users[index].role};
    }
</script>
<div class="w-full max-w-6xl mx-auto mt-10 px-5">
    <h1 class="text-3xl font-semibold mb-5 text-center">บัญชีผู้ใช้</h1>
    <!--Search bar-->
        <div>
            <p class="text-sm font-semibold">Search</p>
            <input class="rounded-lg w-96">
        </div>
    <hr class="my-5 border-dim-gray">
    <table class="w-full border-separate border-spacing-0 border border-dim-gray rounded-lg overflow-hidden table-fixed">
        <thead>
            <tr class="bg-pale">
                <th class="border w-64 border-dim-gray p-2 text-left rounded-tl-lg">อีเมล</th>
                <th class="border w-64 border-dim-gray p-2 text-left">ชื่อ</th>
                <th class="border w-48 border-dim-gray p-2 text-left">บทบาท</th>
                <th class="border w-52 border-dim-gray p-2 text-left rounded-tr-lg">Action</th>
            </tr>
        </thead>
        <tbody>
            {#each users as user, index}
                <tr>
                    <td class="border border-dim-gray p-2">{user.email}</td>
                    <td class="border border-dim-gray p-2">{user.name}</td>
                    {#if editing.index === index}
                        <td class="border border-dim-gray p-2">
                            <select bind:value={editing.role} class="w-full rounded-lg border border-dim-gray p-1">
                                <option value="admin">admin</option>
                                <option value="organizer">organizer</option>
                                <option value="guest">guest</option>
                            </select>
                        </td>
                        <td class="border border-dim-gray p-2 flex gap-2">
                            <button onclick={() => {editing = {index: -1, role: ''};}} class="bg-white border border-black cursor-pointer text-black w-1/2 px-3 py-1 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                            <button onclick={() => {saveRole(index)}} class="bg-secondary cursor-pointer text-white w-1/2 px-3 py-1 rounded-lg hover:bg-secondary-hover">บันทึก</button>
                        </td>
                    {:else}
                        <td class="border border-dim-gray p-2">{user.role}</td>
                        <td class="border border-dim-gray p-2">
                            <button onclick={() => editRole(index)} class="bg-secondary cursor-pointer text-white w-full px-3 py-1 rounded-lg hover:bg-secondary-hover">แก้ไขบทบาท</button>
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
    <div class="flex gap-2 my-4 justify-end">
        <button class="bg-secondary cursor-pointer text-white px-3 py-1 rounded-lg hover:bg-secondary-hover disabled:bg-dim-gray disabled:cursor-auto" onclick={fetchPreviousPage} disabled={currentPage === 1}>Previous</button>
        <button class="bg-secondary cursor-pointer text-white px-3 py-1 rounded-lg hover:bg-secondary-hover disabled:bg-dim-gray disabled:cursor-auto" onclick={fetchNextPage} disabled={currentPage > 1 || token[currentPage - 1] === null}>Next</button>
    </div>
</div>