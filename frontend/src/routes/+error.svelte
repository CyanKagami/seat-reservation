<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · K-SEAT</title>
</svelte:head>

<main class="flex min-h-[70vh] flex-1 items-center justify-center bg-surface-base px-4 py-16">
	<section class="w-full max-w-xl rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-sm sm:p-12">
		<p class="text-sm font-bold uppercase tracking-[0.2em] text-accent">
			{page.status === 404 ? '404 · ไม่พบหน้า' : page.status === 403 ? '403 · ไม่มีสิทธิ์เข้าถึง' : `ข้อผิดพลาด ${page.status}`}
		</p>

		<h1 class="mt-4 text-2xl font-bold text-dark sm:text-3xl">
			{#if page.status === 404}
				ไม่พบหน้าที่คุณกำลังค้นหา
			{:else if page.status === 403}
				คุณไม่มีสิทธิ์เข้าถึงหน้านี้
			{:else}
				เกิดข้อผิดพลาด
			{/if}
		</h1>

		<p class="mt-3 text-sm leading-6 text-dark-muted">
			{#if page.status === 404}
				ลิงก์อาจไม่ถูกต้อง หรือเนื้อหานี้อาจถูกย้ายหรือลบไปแล้ว
			{:else if page.status === 403}
				บัญชีของคุณไม่มีสิทธิ์ใช้งานหน้านี้ หากคิดว่าเป็นข้อผิดพลาด โปรดติดต่อผู้ดูแลระบบ
			{:else}
				{page.error?.message ?? 'ระบบไม่สามารถดำเนินการตามคำขอได้ในขณะนี้'}
			{/if}
		</p>

		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a href="/" class="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
				กลับหน้าหลัก
			</a>
		</div>
	</section>
</main>
