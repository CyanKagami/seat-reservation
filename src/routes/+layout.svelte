<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex flex-col justify-center w-full mt-10">
	{@render children()}
</div>


