<script lang='ts'>
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { userStore } from "$lib/store/auth.svelte";
    import { alertModal } from "$lib/store/alert.svelte.js";

    const user = $derived(userStore.currentUser);

    // สเตทสำหรับควบคุมการเปิด/ปิด Dropdown
    let isDropdownOpen = $state(false);

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function handleLogout() {
        isDropdownOpen = false;
        alertModal.information("คุณกำลังจะออกจากระบบ", "คุณแน่ใจหรือไม่?", {
            onconfirm: () => {
                userStore.logout();
                goto("/login", { replaceState: true });
            },
            showCancel: true,
        })
    }
</script>

<!-- พื้นหลังโปร่งใสสำหรับดักคลิกเพื่อปิด Dropdown เมื่อกดพื้นที่ว่างข้างนอก -->
{#if isDropdownOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-40" onclick={() => isDropdownOpen = false}></div>
{/if}

<div class="w-full h-20 py-4 px-4 sm:py-5 sm:px-10 bg-pale flex justify-between items-center fixed top-0 z-50 shadow-sm">
    <!-- Logo -->
    <a href="/" class="text-2xl sm:text-4xl font-semibold tracking-tight">
        K-<span class="text-accent">SEAT</span>
    </a>

    <!-- Right Menu -->
    <div class="flex gap-4 sm:gap-10 items-center">
        <a href="/admin/users" class="font-semibold text-sm sm:text-xl hover:text-accent hover:cursor-pointer transition-colors">
            Users
        </a>
        <a href="/admin/places" class="font-semibold text-sm sm:text-xl hover:text-accent hover:cursor-pointer transition-colors">
            Places
        </a>

        <!-- Profile & Dropdown Container -->
        <div class="relative">
            <!-- Profile Avatar (กดคลิกเพื่อเปิด/ปิด Dropdown) -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                onclick={toggleDropdown}
                class="ring-2 ring-secondary h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:ring-4 transition-all flex items-center justify-center cursor-pointer overflow-hidden"
            >
                <img src={user?.picture} alt="your profile" class="object-cover h-full w-full rounded-full" referrerpolicy="no-referrer">
            </div>

            <!-- Dropdown Menu (แสดงผลเมื่อ isDropdownOpen เป็น true) -->
            {#if isDropdownOpen}
                <div class="absolute right-0 top-full pt-2 w-64 z-50">
                    <div class="bg-white border-2 border-black rounded-lg shadow-xl p-4 flex flex-col gap-2">
                        <p class="font-semibold underline text-sm sm:text-lg truncate">{user?.email}</p>
                        <p class="font-light text-xs sm:text-sm text-gray-600 truncate">{user?.name}</p>

                        <hr class="bg-gray-300 h-px border-0 my-1">

                        <div class="flex flex-col gap-2">
                            {#if page.url.pathname.startsWith('/admin')}
                                <a
                                    href="/"
                                    onclick={() => isDropdownOpen = false}
                                    class="text-sm sm:text-base font-medium hover:text-secondary hover:cursor-pointer transition-colors"
                                >
                                    กลับหน้าผู้ใช้
                                </a>
                            {:else}
                                <a
                                    href="/admin/users"
                                    onclick={() => isDropdownOpen = false}
                                    class="text-sm sm:text-base font-medium hover:text-secondary hover:cursor-pointer transition-colors"
                                >
                                    Admin Dashboard
                                </a>
                            {/if}

                            <button onclick={handleLogout} class="flex justify-between items-center group/btn hover:cursor-pointer pt-1">
                                <p class="text-red-500 group-hover/btn:text-red-700 font-medium text-sm sm:text-base">Log Out</p>
                                <svg class="fill-red-500 h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:fill-red-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path d="M505 273c9.4-9.4 9.4-24.6 0-33.9L361 95c-6.9-6.9-17.2-8.9-26.2-5.2S320 102.3 320 112l0 80-112 0c-26.5 0-48 21.5-48 48l0 32c0 26.5 21.5 48 48 48l112 0 0 80c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2L505 273zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>