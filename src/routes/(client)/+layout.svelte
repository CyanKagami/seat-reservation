<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
  import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
</script>
<div class="flex flex-col justify-center w-full font-inter">
<NavBar></NavBar>
	{@render children()}
</div>