<script lang='ts'>
  import { goto } from "$app/navigation";
    import { userStore } from "$lib/store/auth.svelte";
    const user = $derived(userStore.currentUser);
    function handleLogout() {
        userStore.logout();
        goto("/login", { replaceState: true });
    }
</script>
<div class="w-full h-20 py-5 px-10 bg-pale flex justify-between fixed top-0 z-50">
    <a href="/" class="text-4xl font-semibold">K-<span class="text-accent">SEAT</span></a>
    <div class="flex gap-10 items-center">
        <a href="/my-event" class="font-semibold text-xl hover:text-accent hover:cursor-pointer">My Events</a>
        <div>
            <div class="ring ring-secondary h-12 w-12 rounded-full hover:ring-4 flex items-center justify-center group relative">
            <img src={user?.picture} alt="your profile" class="object-cover h-full w-full rounded-full" referrerpolicy="no-referrer">
            <div class="hidden group-hover:block absolute top-0 h-40 w-18 right-0">
                <div class="hidden group-hover:block bg-white border-2 border-black w-64 h-24 absolute top-14 right-0 p-2">
                <p class="font-semibold underline text-lg">{user?.email}</p>
                <p class="font-light text-sm">{user?.name}</p>
                <hr class="bg-gray-400 h-px border-0">
                <div class="flex justify-between items-center h-10">
                    <p class="text-red-500">Log Out</p>
                    <!--logout icon-->
                    <buntton onclick={handleLogout}>
                        <svg class="fill-red-500 h-5 w-5 hover:fill-red-700 hover:cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M505 273c9.4-9.4 9.4-24.6 0-33.9L361 95c-6.9-6.9-17.2-8.9-26.2-5.2S320 102.3 320 112l0 80-112 0c-26.5 0-48 21.5-48 48l0 32c0 26.5 21.5 48 48 48l112 0 0 80c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2L505 273zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z"/></svg>
                    </buntton>
                </div>
            </div>
            </div>

        </div>
        </div>

    </div>
</div>