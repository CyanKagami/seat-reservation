<script lang="ts">
  import AdminNavBar from '$lib/components/admin/NavBarAdmin.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-surface-base text-dark font-inter">
  <AdminNavBar />
  <main class="flex-1 w-full pb-16">
    {@render children()}
  </main>
</div>
