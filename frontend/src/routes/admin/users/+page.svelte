<script lang="ts">
  import { apiFetch } from "$lib/scripts/api";
  import { alertModal } from "$lib/store/alert.svelte";
  import type { User } from "$lib/type/user";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
    let users:User[] = $state([]);
    let currentPage = $state(1);
    let nextToken = $state<string | null>(null);
    let cursorStack: (string | null)[] = $state([null]);
    let editing = $state({index: -1, role: ''});

    $effect(() => {
        users = data.users.items;
        currentPage = data.currentPage;
        nextToken = data.users.nextToken;
        cursorStack = data.cursorStack;
        editing = {index: -1, role: ''};
    });

    function isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    function getResponseError(payload: unknown, fallback: string): string {
        if (!isRecord(payload)) return fallback;

        const body = isRecord(payload.body) ? payload.body : undefined;
        const error = payload.error ?? body?.error;
        if (typeof error === "string" && error.trim()) return error;
        if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }
        if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
        return fallback;
    }

    async function fetchNextPage() {
        if (!nextToken) return;
        const page = currentPage + 1;
        const updatedCursorStack = [...cursorStack];
        updatedCursorStack[page - 1] = nextToken;
        const query = new URLSearchParams({
            page: String(page),
            cursors: JSON.stringify(updatedCursorStack)
        });
        await goto(`/admin/users?${query}`);
    }

    async function fetchPreviousPage() {
        if (currentPage === 1) return;
        const page = currentPage - 1;
        const query = new URLSearchParams({
            page: String(page),
            cursors: JSON.stringify(cursorStack)
        });
        await goto(`/admin/users?${query}`);
    }

    async function saveRole(index:number) {
        const user = users[index];
        const requestedRole = editing.role;

        try {
            const response = await apiFetch(
                `/user/editRole?email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(requestedRole)}`,
                { method: 'POST' }
            );
            const payload: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                alertModal.failure(
                    'แก้ไขบทบาทล้มเหลว',
                    getResponseError(payload, `เซิร์ฟเวอร์ตอบกลับข้อผิดพลาด (${response.status})`)
                );
                return;
            }

            const body = isRecord(payload) && isRecord(payload.body) ? payload.body : undefined;
            const updatedUserValue = body?.updatedUser ?? body?.newAttributes;
            const updatedUser = isRecord(updatedUserValue) ? updatedUserValue : undefined;
            if (!updatedUser || typeof updatedUser.role !== "string") {
                alertModal.failure(
                    'แก้ไขบทบาทล้มเหลว',
                    'เซิร์ฟเวอร์ตอบกลับว่าสำเร็จ แต่ไม่มีข้อมูลบทบาทผู้ใช้ที่อัปเดต'
                );
                return;
            }

            user.role = updatedUser.role;
            const updatedName = typeof updatedUser.name === "string" ? updatedUser.name : user.name || user.email;
            alertModal.success(
                'สำเร็จ',
                `เปลี่ยนบทบาทของผู้ใช้ ${updatedName} เป็น ${updatedUser.role} สำเร็จ`
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            alertModal.failure('แก้ไขบทบาทล้มเหลว', `ส่งคำขอไม่สำเร็จ: ${message}`);
        } finally {
            editing = {index: -1, role: ''};
        }
    }

    function editRole(index:number) {
        editing = {index, role: users[index].role};
    }
</script>
<div class="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
    <nav class="mb-5 flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
        <a href="/admin/users" class="transition-colors hover:text-dark">ผู้ดูแลระบบ</a>
        <span aria-hidden="true">/</span>
        <span class="truncate font-semibold text-dark-muted">บัญชีผู้ใช้</span>
    </nav>
    <h1 class="mb-6 text-3xl font-bold tracking-tight text-dark sm:text-4xl">บัญชีผู้ใช้</h1>
    <div class="mb-5 flex flex-col gap-4 rounded-2xl border border-border-subtle bg-white p-4 shadow-xs sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div class="w-full sm:max-w-xs">
            <label for="user-search" class="mb-2 block text-sm font-semibold text-dark">ค้นหาผู้ใช้</label>
            <input
                id="user-search"
                type="search"
                placeholder="ค้นหาบัญชีผู้ใช้"
                class="w-full rounded-lg border border-border-strong bg-surface-base px-3 py-2 text-sm text-dark placeholder:text-dark-soft focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden"
            >
        </div>
    </div>
    <section class="w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xs">
        <div class="overflow-x-auto">
            <table class="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead class="bg-surface-subtle text-dark-muted">
                    <tr>
                        <th scope="col" class="border border-border-strong px-4 py-4 font-semibold sm:px-5">อีเมล</th>
                        <th scope="col" class="border border-border-strong px-4 py-4 font-semibold sm:px-5">ชื่อ</th>
                        <th scope="col" class="border border-border-strong px-4 py-4 font-semibold sm:px-5">บทบาท</th>
                        <th scope="col" class="border border-border-strong px-4 py-4 font-semibold sm:px-5">จัดการ</th>
                    </tr>
                </thead>
                <tbody class="text-dark-muted">
                    {#each users as user, index}
                        <tr class="transition-colors odd:bg-white even:bg-surface-base/60 hover:bg-secondary-subtle/40">
                            <td class="border border-border-strong px-4 py-4 sm:px-5">{user.email}</td>
                            <td class="border border-border-strong px-4 py-4 sm:px-5">{user.name}</td>
                            {#if editing.index === index}
                                <td class="border border-border-strong px-4 py-4 sm:px-5">
                                    <select bind:value={editing.role} class="w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-dark focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-hidden">
                                        <option value="admin">admin</option>
                                        <option value="organizer">organizer</option>
                                        <option value="guest">guest</option>
                                    </select>
                                </td>
                                <td class="border border-border-strong px-4 py-4 sm:px-5">
                                    <div class="flex min-w-40 gap-2">
                                        <button onclick={() => {editing = {index: -1, role: ''};}} class="w-1/2 rounded-lg border border-border-strong bg-white px-3 py-2 font-medium text-dark transition-colors hover:bg-surface-subtle cursor-pointer">ยกเลิก</button>
                                        <button onclick={() => {saveRole(index)}} class="w-1/2 rounded-lg bg-secondary px-3 py-2 font-semibold text-white transition-colors hover:bg-secondary-hover cursor-pointer">บันทึก</button>
                                    </div>
                                </td>
                            {:else}
                                <td class="border border-border-strong px-4 py-4 sm:px-5">{user.role}</td>
                                <td class="border border-border-strong px-4 py-4 sm:px-5">
                                    <button onclick={() => editRole(index)} class="w-full min-w-40 rounded-lg bg-secondary px-3 py-2 font-semibold text-white transition-colors hover:bg-secondary-hover cursor-pointer">แก้ไขบทบาท</button>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>
    <div class="my-5 flex gap-3 flex-row items-center justify-between">
        <p class="text-sm text-dark-soft">หน้า {currentPage}</p>
        <div class="flex justify-end gap-2">
            <button class="rounded-lg border border-border-strong bg-white px-4 py-2 text-dark transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50" onclick={fetchPreviousPage} disabled={currentPage === 1}>ก่อนหน้า</button>
            <button class="rounded-lg bg-secondary px-4 py-2 text-white transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50" onclick={fetchNextPage} disabled={!nextToken}>ถัดไป</button>
        </div>
    </div>
</div>