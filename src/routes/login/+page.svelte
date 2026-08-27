<script lang="ts">
  import GoogleAuthButton from "$lib/components/GoogleAuthButton.svelte";
  import type { GoogleUser } from "$lib/type/googleUser";

  let user: GoogleUser | null = null;
  let errorMessage: string = '';

  const GOOGLE_CLIENT_ID: string = "105840083664-qflud4d4d32sqo6fp27d57v7rm6pd0m3.apps.googleusercontent.com";

  // show/unshow password
  let isShow = $state(false)
</script>

<div class="w-full h-screen bg-[url(/image/kmitlbuilding.webp)] bg-cover bg-blend-overlay">
    <div class="self-center justify-self-center flex items-center flex-col mt-14">
  <div class="w-fit flex flex-col items-center">
    <h1 class="text-7xl font-semibold">
      K-<span class="text-accent">SEAT</span>
    </h1>
    <p class="font-medium">ระบบจองที่นั่งและลงทะเบียนเข้าร่วมกิจกรรม</p>
  </div>
  <div class="flex flex-col items-center mt-14 gap-3 bg-white/80 w-fit py-8 rounded-xl px-25 h-fit">
    <h2 class="font-semibold text-xl">Authentication via email or google authentication</h2>
    <div class="w-md flex flex-col gap-3">
      <p class="text-sm font-semibold">EMAIL ADDRESS</p>
      <input class="rounded-lg border-gray-400" placeholder="@kmitl.ac.th" />

      <p class="text-sm font-semibold">PASSWORD</p>
      <div class="w-full relative">
        <input type="{(isShow) ? "text" : "password" }" class="rounded-lg border-gray-400 w-full" />
        <button onclick={() => {isShow = !isShow} }>
          {#if isShow}
          <svg class="w-5 absolute top-3 left-103 hover:fill-gray-400 hover:cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"/></svg>
          {:else}
            <svg class="w-5 absolute top-3 left-103 hover:fill-gray-400 hover:cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM204.5 138.7c23.5-16.8 52.4-26.7 83.5-26.7 79.5 0 144 64.5 144 144 0 31.1-9.9 59.9-26.7 83.5l-34.7-34.7c12.7-21.4 17-47.7 10.1-73.7-13.7-51.2-66.4-81.6-117.6-67.9-8.6 2.3-16.7 5.7-24 10l-34.7-34.7zM325.3 395.1c-11.9 3.2-24.4 4.9-37.3 4.9-79.5 0-144-64.5-144-144 0-12.9 1.7-25.4 4.9-37.3L69.4 139.2c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6l-64.2-64.2z"/></svg>
          {/if}
        </button>

      </div>


      <button class="bg-accent hover:bg-accent-hover transition-colors duration-200 w-full h-10 rounded-lg text-white font-semibold">LOG IN</button>
      <div class="flex items-center my-4">
        <div class="grow border-t border-black"></div>
        <span class="px-4 text-sm font-medium text-black">OR</span>
        <div class="grow border-t border-black"></div>
      </div>
      <GoogleAuthButton clientId={GOOGLE_CLIENT_ID}></GoogleAuthButton>
    </div>
  </div>
</div>

</div>
