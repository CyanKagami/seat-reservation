<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
  	import { navigating } from '$app/state';
	import AlertModal from '$lib/components/AlertModal.svelte';
	import { alertModal } from '$lib/store/alert.svelte';

	let { children } = $props();
</script>
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex flex-col justify-center w-full font-inter">
	{#await navigating.complete}
		<div class="fixed top-0 left-0 w-screen h-screen flex items-center justify-center">
			<p>กำลังโหลดข้อมูลผู้ใช้...</p>
		</div>
	{:then _} 
		{@render children()}
		<!-- Global Alert Modal Singleton Instance -->
		<AlertModal 
		bind:isOpen={alertModal.isOpen}
		type={alertModal.type}
		title={alertModal.title}
		message={alertModal.message}
		confirmText={alertModal.confirmText}
		cancelText={alertModal.cancelText}
		showCancel={alertModal.showCancel}
		onconfirm={alertModal.onconfirm}
		oncancel={alertModal.oncancel}
		/>
	{/await}
</div>


