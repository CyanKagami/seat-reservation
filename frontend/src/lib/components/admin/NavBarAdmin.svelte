<script lang='ts'>
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { userStore } from "$lib/store/auth.svelte";
    import { alertModal } from "$lib/store/alert.svelte.js";

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

<header class="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border-subtle shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <!-- Logo with Admin Badge -->
        <div class="flex items-center gap-3">
            <a href="/" class="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-secondary rounded-lg px-1 py-0.5">
                <span class="text-2xl sm:text-3xl font-bold tracking-tight text-dark group-hover:opacity-90 transition-opacity">
                    K-<span class="text-accent">SEAT</span>
                </span>
            </a>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary-subtle text-secondary border border-secondary/20">
                Admin Console
            </span>
        </div>

        <!-- Right Menu -->
        <nav class="flex items-center gap-3 sm:gap-6">
            <a 
                href="/admin/users" 
                class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath === '/admin/users' ? 'text-secondary font-semibold bg-secondary-subtle/70' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
            >
                ผู้ใช้งาน & สิทธิ์
            </a>
            <a 
                href="/admin/places" 
                class="text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg transition-colors {currentPath.startsWith('/admin/places') ? 'text-secondary font-semibold bg-secondary-subtle/70' : 'text-dark-muted hover:text-dark hover:bg-surface-subtle'}"
            >
                สถานที่ & ผังที่นั่ง
            </a>
            <a 
                href="/" 
                class="hidden md:inline-flex text-sm sm:text-base font-medium px-3 py-1.5 rounded-lg text-dark-soft hover:text-dark hover:bg-surface-subtle transition-colors"
            >
                หน้านักศึกษา
            </a>

            <!-- Profile & Dropdown -->
            <div class="relative ml-1 sm:ml-2">
                <button
                    type="button"
                    onclick={toggleDropdown}
                    aria-label="เมนูผู้ดูแลระบบ"
                    aria-expanded={isDropdownOpen}
                    class="ring-2 ring-secondary/40 hover:ring-secondary/80 focus-visible:ring-secondary focus-visible:outline-hidden h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all flex items-center justify-center cursor-pointer overflow-hidden bg-surface-subtle"
                >
                    {#if user?.picture}
                        <img src={user.picture} alt={user.name || "Admin"} class="object-cover h-full w-full rounded-full" referrerpolicy="no-referrer">
                    {:else}
                        <span class="text-sm font-bold text-secondary">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                        </span>
                    {/if}
                </button>

                {#if isDropdownOpen}
                    <div class="absolute right-0 top-full pt-2 w-72 z-50">
                        <div class="bg-white rounded-xl shadow-xl border border-border-subtle p-4 flex flex-col gap-3">
                            <div>
                                <div class="flex items-center justify-between gap-2">
                                    <p class="font-semibold text-sm text-dark truncate">{user?.name || "ผู้ดูแลระบบ"}</p>
                                    <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary-subtle text-secondary">
                                        Admin
                                    </span>
                                </div>
                                <p class="text-xs text-dark-soft truncate mt-0.5">{user?.email}</p>
                            </div>

                            <hr class="border-border-subtle my-0.5">

                            <div class="flex flex-col gap-1 text-sm">
                                <a
                                    href="/"
                                    onclick={() => isDropdownOpen = false}
                                    class="px-2.5 py-2 rounded-lg font-medium text-dark-muted hover:text-dark hover:bg-surface-subtle transition-colors flex items-center justify-between"
                                >
                                    <span>กลับสู่หน้าผู้ใช้ทั่วไป</span>
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                </a>

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
        </nav>
    </div>
</header>
