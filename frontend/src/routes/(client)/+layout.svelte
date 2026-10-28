<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';
  import AdminNavBar from '$lib/components/admin/NavBarAdmin.svelte';
  import { userStore } from '$lib/store/auth.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-surface-base text-dark">
  {#if userStore.currentUser?.role === 'admin'}
    <AdminNavBar />
  {:else}
    <NavBar />
  {/if}
  <main class="flex-1 w-full pb-16">
    {@render children()}
  </main>
</div>
