<script lang="ts">
  import GoogleAuthButton from "$lib/components/GoogleAuthButton.svelte";
  import type { GoogleUser } from "$lib/type/googleUser";

  let user: GoogleUser | null = null;
  let errorMessage: string = '';

  const GOOGLE_CLIENT_ID: string = "105840083664-qflud4d4d32sqo6fp27d57v7rm6pd0m3.apps.googleusercontent.com";

  // show/unshow password
  let isShow = $state(false)
</script>

<div class="min-h-screen w-full bg-[url(/image/kmitlbuilding.webp)] bg-cover bg-top bg-blend-overlay flex flex-col justify-start items-center px-4 pt-16 pb-8">

  <!-- Header / Title -->
  <div class="flex flex-col items-center text-center max-w-md w-full">
    <h1 class="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight">
      K-<span class="text-accent">SEAT</span>
    </h1>
    <!-- ซ่อนบนมือถือ และแสดงตั้งแต่หน้าจอ sm (Tablet/Desktop) ขึ้นไป -->
    <p class="font-medium text-sm sm:text-base mt-2 text-gray-800 hidden sm:block">
      ระบบจองที่นั่งและลงทะเบียนเข้าร่วมกิจกรรม
    </p>
  </div>

  <!-- Login Container -->
  <div class="mt-8 sm:mt-12 flex flex-col items-center gap-4 bg-white/80 backdrop-blur-sm w-full max-w-lg p-6 sm:p-10 rounded-2xl shadow-lg border border-white/20">

    <h2 class="font-semibold text-base sm:text-lg text-center text-gray-800">
      เข้าสู่ระบบผ่านบัญชี Google
    </h2>

    <div class="w-full flex justify-center mt-2">
      <GoogleAuthButton clientId={GOOGLE_CLIENT_ID} />
    </div>

  </div>
</div>