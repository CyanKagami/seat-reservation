<script lang="ts">
  import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
</script>
<div class="flex flex-col justify-center w-full font-inter mb-20">

<NavBar></NavBar>

	{@render children()}
</div>