<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
  	import { onMount } from 'svelte';
	import { userStore } from '$lib/store/auth.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let loading = $state(true);
	onMount(() => {
		if (userStore.currentUser) {
			loading = false;
			return;
		}
		fetch('/api/auth/google', {
			method: 'GET',
			credentials: 'include'
		}).then((response) => {
			if (!response.ok) {
				console.error('Failed to fetch user data:', response.statusText);
			}
			return response.json();
		}).then((userData) => {
			userStore.setUser(userData.body);
			if (userData.body === null) {
				goto("/login", { replaceState: true });
			}
			loading = false;
		}).catch((error) => {
			console.error('Error fetching user data:', error);
		});
	});
</script>
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex flex-col justify-center w-full font-inter">
	{#if loading}
		<div class="fixed top-0 left-0 w-screen h-screen flex items-center justify-center">
			<p>กำลังโหลดข้อมูลผู้ใช้...</p>
		</div>
	{:else}
		{@render children()}
	{/if}
</div>


