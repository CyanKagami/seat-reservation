<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
  	import NavBarAdmin from '$lib/components/admin/NavBarAdmin.svelte';
  	import NavBar from '$lib/components/NavBar.svelte';
  	import { userStore } from '$lib/store/auth.svelte';


	let { children } = $props();

	let role = userStore.currentUser?.role
</script>
<div class="flex flex-col justify-center w-full font-inter my-20">
{#if role === "admin"}
<NavBarAdmin></NavBarAdmin>
{:else}
<NavBar></NavBar>
{/if}
	{@render children()}
</div>