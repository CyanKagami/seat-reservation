<script lang="ts">
  import GoogleAuthButton from "$lib/components/GoogleAuthButton.svelte";

  const GOOGLE_CLIENT_ID: string = "105840083664-qflud4d4d32sqo6fp27d57v7rm6pd0m3.apps.googleusercontent.com";
</script>

<svelte:head>
  <title>เข้าสู่ระบบ · K-SEAT KMITL</title>
</svelte:head>

<div class="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-dark overflow-hidden">
  <!-- Atmospheric Architectural Backdrop -->
  <div class="absolute inset-0 z-0">
    <!-- University Building Background Image -->
    <img 
      src="/image/kmitlbuilding.webp" 
      alt="KMITL Campus" 
      class="w-full h-full object-cover object-top opacity-100 filter contrast-125 saturate-50"
    />
    <!-- Deep Brand Gradient Overlay (avoids washed-out look) -->
    <div class="absolute inset-0 bg-gradient-to-tr from-dark via-dark/85 to-[#0e2f38]/90"></div>
    
    <!-- Subtle Architectural Grid Pattern -->
    <div 
      class="absolute inset-0 opacity-25"
      style="background-image: radial-gradient(#1D738B 1px, transparent 1px); background-size: 32px 32px;"
    ></div>
  </div>

  <!-- Main Split-Screen Container -->
  <div class="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
    
    <!-- Left Column: Institutional Value Props & Campus Showcase (Desktop) -->
    <div class="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 text-white">
      <div>
        <!-- Institutional Badge -->
        <div class="inline-flex items-center gap-2 px-3 rounded-lg border-b border-white/10 text-xs font-semibold text-pale-soft mb-6 w-full">
        </div>
        

        <!-- Big Display Headline -->
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          ระบบสำรองที่นั่งกิจกรรม <br class="hidden sm:inline" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-white via-pale to-slate-200">
            K-SEAT Platform
          </span>
        </h1>

        <p class="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
          แพลตฟอร์มบริหารจัดการและลงทะเบียนที่นั่งงานสัมมนา และกิจกรรมภายในสถาบัน
        </p>

        <!-- Feature Pillars List -->
        <div class="mt-8 space-y-4">
          <div class="flex items-start gap-3.5">
            <div class="w-8 h-8 rounded-lg bg-secondary/30 border border-secondary/50 flex items-center justify-center shrink-0 mt-0.5 text-pale">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-white">ผังจำลองสถานที่และที่นั่งจริง</h2>
              <p class="text-xs text-slate-300 mt-0.5">ตรวจสอบตำแหน่งเก้าอี้และโซนมุมมองเวทีก่อนกดยืนยัน</p>
            </div>
          </div>

          <div class="flex items-start gap-3.5">
            <div class="w-8 h-8 rounded-lg bg-secondary/30 border border-secondary/50 flex items-center justify-center shrink-0 mt-0.5 text-pale">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-white">เช็คชื่อหน้างาน</h2>
              <p class="text-xs text-slate-300 mt-0.5">ใช้รหัสนักศึกษาเช็คชื่อเข้าร่วมกิจกรรมได้ทันที</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Left Bottom Footer -->
      <div class="pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span>คณะเทคโนโลยีสารสนเทศ (IT KMITL)</span>
        <span>King Mongkut's Institute of Technology Ladkrabang</span>
      </div>
    </div>

    <!-- Right Column: Authentication Card -->
    <div class="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-white text-dark">
      <div>
        <!-- Brand Logo Header -->
        <div class="flex items-center justify-between mb-8">
          <a href="/" class="flex items-center gap-2 group">
            <span class="text-3xl font-bold tracking-tight text-dark">
              K-<span class="text-accent">SEAT</span>
            </span>
          </a>


        </div>

        <!-- Auth Title -->
        <div class="space-y-1.5 mb-8">
          <h2 class="text-2xl font-bold text-dark tracking-tight">
            เข้าสู่ระบบบัญชีสถาบัน
          </h2>
          <p class="text-xs sm:text-sm text-dark-soft">
            สำหรับนักศึกษา บุคลากร และผู้จัดกิจกรรม สจล.
          </p>
        </div>

        <!-- Google OAuth Action Box -->
        <div class="space-y-4">
          <GoogleAuthButton clientId={GOOGLE_CLIENT_ID} />

          <!-- Helpful Account Restriction Notice -->
          <div class="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-2.5">
            <svg class="w-4 h-4 text-secondary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-xs text-dark-muted leading-relaxed">
              กรุณาเข้าสู่ระบบด้วยอีเมลสถาบัน <span class="font-semibold text-dark">@kmitl.ac.th</span>
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
