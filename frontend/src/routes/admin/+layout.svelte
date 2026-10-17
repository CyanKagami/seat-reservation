<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
  import AdminNavBar from '$lib/components/admin/NavBarAdmin.svelte';

	let { children } = $props();
</script>
<div class="flex flex-col justify-center w-full font-inter mt-20">
<AdminNavBar></AdminNavBar>
	{@render children()}
</div>