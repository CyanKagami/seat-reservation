<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
  	import { navigating } from '$app/state';
	import AlertModal from '$lib/components/AlertModal.svelte';
	import { alertModal } from '$lib/store/alert.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>K-SEAT · ระบบจองที่นั่งกิจกรรม KMITL</title>
	<meta name="description" content="ระบบจองและจัดการที่นั่งกิจกรรม สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)" />
</svelte:head>

<div class="min-h-screen w-full flex flex-col font-inter">
	{#await navigating.complete}
		<div class="fixed inset-0 bg-surface-base/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50">
			<div class="w-8 h-8 border-3 border-secondary/30 border-t-accent rounded-full animate-spin"></div>
			<p class="text-sm font-medium text-dark-muted">กำลังโหลดข้อมูล...</p>
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
