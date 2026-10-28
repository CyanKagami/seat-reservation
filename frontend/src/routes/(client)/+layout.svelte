<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';
  import AdminNavBar from '$lib/components/admin/NavBarAdmin.svelte';
  import { page } from '$app/state';
  import { userStore } from '$lib/store/auth.svelte';

  let { children } = $props();
  const isReservationPage = $derived(page.url.pathname.startsWith('/reservation/'));
</script>

<div class="min-h-screen flex flex-col bg-surface-base text-dark">
  {#if userStore.currentUser?.role === 'admin'}
    <AdminNavBar />
  {:else}
    <NavBar />
  {/if}
  <main class="flex-1 w-full {isReservationPage ? 'pb-0' : 'pb-16'}">
    {@render children()}
  </main>
</div>
