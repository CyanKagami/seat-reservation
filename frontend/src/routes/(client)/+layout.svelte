<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-surface-base text-dark">
  <NavBar />
  <main class="flex-1 w-full pb-16">
    {@render children()}
  </main>
</div>
