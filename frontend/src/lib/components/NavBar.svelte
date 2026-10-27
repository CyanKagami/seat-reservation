<script lang='ts'>
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { alertModal } from "$lib/store/alert.svelte";
    import { userStore } from "$lib/store/auth.svelte";

    const user = $derived(userStore.currentUser);
    let isDropdownOpen = $state(false);

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function handleLogout() {
        isDropdownOpen = false;
        alertModal.warning("คุณกำลังจะออกจากระบบ", "คุณแน่ใจหรือไม่ที่จะออกจากระบบ?", {
            onconfirm: () => {
                userStore.logout();
                goto("/login", { replaceState: true });
            },
            showCancel: true,
        });
    }

    const currentPath = $derived(page.url.pathname);
</script>

<!-- Backdrop click detector to dismiss dropdown -->
{#if isDropdownOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-40" onclick={() => isDropdownOpen = false}></div>
{/if}

<header class="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border-subtle transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-secondary rounded-lg px-1 py-0.5">
            <span class="text-2xl sm:text-3xl font-bold tracking-tight text-dark group-hover:opacity-90 transition-opacity">
                K-<span class="text-accent">SEAT</span>
            </span>
        </a>

        <!-- Navigation Links & User Action -->
        <nav class="flex items-center gap-3 sm:gap-6">
            <a 
                href="/" 
                class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath === '/' ? 'text-accent font-semibold bg-accent-subtle/50' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
            >
                กิจกรรมทั้งหมด
            </a>

            {#if user}
                {#if user.role === 'admin' || user.role === 'organizer'}
                    <a 
                        href="/my-event" 
                        class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath.startsWith('/my-event') ? 'text-accent font-semibold bg-accent-subtle/50' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
                    >
                        กิจกรรมที่จัด
                    </a>
                    <a
                        href="/reserved-event"
                        class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath.startsWith('/reserved-event') ? 'text-accent font-semibold bg-accent-subtle/50' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
                    >
                        ที่นั่งของฉัน
                    </a>
                {:else}
                    <a 
                        href="/reserved-event" 
                        class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath.startsWith('/reserved-event') ? 'text-accent font-semibold bg-accent-subtle/50' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
                    >
                        ที่นั่งของฉัน
                    </a>
                {/if}


            {/if}

            <!-- Profile & Dropdown Container or Login CTA -->
            {#if user}
                <div class="relative ml-1 sm:ml-2">
                    <button
                        type="button"
                        onclick={toggleDropdown}
                        aria-label="เมนูผู้ใช้งาน"
                        aria-expanded={isDropdownOpen}
                        class="ring-2 ring-secondary/30 hover:ring-secondary/70 focus-visible:ring-secondary focus-visible:outline-hidden h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all flex items-center justify-center cursor-pointer overflow-hidden bg-surface-subtle"
                    >
                        {#if user.picture}
                            <img src={user.picture} alt={user.name || "User profile"} class="object-cover h-full w-full rounded-full" referrerpolicy="no-referrer">
                        {:else}
                            <span class="text-sm font-bold text-secondary">
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                            </span>
                        {/if}
                    </button>

                    <!-- Dropdown Menu -->
                    {#if isDropdownOpen}
                        <div class="absolute right-0 top-full pt-2 w-72 z-50">
                            <div class="bg-white rounded-xl shadow-xl border border-border-subtle p-4 flex flex-col gap-3">
                                <div>
                                    <div class="flex items-center justify-between gap-2">
                                        <p class="font-semibold text-sm text-dark truncate">{user.name || "ผู้ใช้งาน"}</p>
                                        <span class="text-xs px-2 py-0.5 rounded-full font-medium capitalize {user.role === 'admin' ? 'bg-secondary-subtle text-secondary' : 'bg-pale text-dark-secondary'}">
                                            {user.role}
                                        </span>
                                    </div>
                                    <p class="text-xs text-dark-soft truncate mt-0.5">{user.email}</p>
                                </div>

                                <hr class="border-border-subtle my-0.5">

                                <div class="flex flex-col gap-1 text-sm">
                                    {#if user.role === 'admin'}
                                        <a
                                            href="/admin/users"
                                            onclick={() => isDropdownOpen = false}
                                            class="px-2.5 py-2 rounded-lg font-medium text-dark-muted hover:text-dark hover:bg-surface-subtle transition-colors flex items-center justify-between"
                                        >
                                            <span>จัดการบทบาทผู้ใช้</span>
                                            <span class="text-xs text-secondary font-semibold">Admin</span>
                                        </a>
                                        <a
                                            href="/admin/places"
                                            onclick={() => isDropdownOpen = false}
                                            class="px-2.5 py-2 rounded-lg font-medium text-dark-muted hover:text-dark hover:bg-surface-subtle transition-colors flex items-center justify-between"
                                        >
                                            <span>จัดการสถานที่ & ผัง</span>
                                            <span class="text-xs text-secondary font-semibold">Admin</span>
                                        </a>
                                        <hr class="border-border-subtle my-0.5">
                                    {/if}

                                    <button 
                                        type="button"
                                        onclick={handleLogout} 
                                        class="w-full px-2.5 py-2 rounded-lg text-left text-accent hover:text-accent-hover hover:bg-accent-subtle/40 font-medium transition-colors flex items-center justify-between cursor-pointer"
                                    >
                                        <span>ออกจากระบบ</span>
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <a 
                    href="/login" 
                    class="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                    เข้าสู่ระบบ
                </a>
            {/if}
        </nav>
    </div>
</header>
