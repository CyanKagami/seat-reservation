<script lang="ts">
  import NavBarAdmin from '$lib/components/admin/NavBarAdmin.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import { userStore } from '$lib/store/auth.svelte';

	let { children } = $props();

</script>
<div class="flex flex-col justify-center w-full font-inter my-20">

{#if userStore.isAuthenticated && userStore.currentUser?.role === "admin"}
	<NavBarAdmin></NavBarAdmin>	
{:else}
	<NavBar></NavBar>
{/if}

	{@render children()}
</div>