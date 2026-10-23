<script lang="ts">
  const { slides } = $props();

  let currentIndex = $state(0);

  function nextSlide() {
    // Wrap back to 0 when reaching the end
    currentIndex = (currentIndex + 1) % slides.length;
    resetAutoPlay();
  }

  function prevSlide() {
    // Wrap to the last slide when pressing previous on index 0
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    resetAutoPlay();
  }

  function goToSlide(index: number) {
    currentIndex = index;
    resetAutoPlay();
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  function startAutoPlay() {
    timer = setInterval(nextSlide, 3000);
  }

  function resetAutoPlay() {
    if (timer === null) return;
    clearInterval(timer);
    startAutoPlay();
  }

  startAutoPlay();
</script>

<section class="relative w-full overflow-hidden my-4">
  <!-- เปลี่ยนโครงสร้างให้รองรับ Responsive (ปุ่มทับบนมือถือ และอยู่ข้างนอกบนจอใหญ่) -->
  <div class="relative w-full max-w-4xl mx-auto flex items-center justify-center h-72 sm:h-96 px-0 sm:px-12">

    <!-- Previous Button (Absolute บนมือถือ, Relative ตั้งแต่ sm ขึ้นไป) -->
    <button
      onclick={prevSlide}
      class="absolute left-2 sm:left-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer"
      aria-label="Previous Slide"
    >
      ❮
    </button>

    <!-- Slider Track Container -->
    <div class="relative w-full overflow-hidden rounded-xl h-72 sm:h-96 shadow-lg">
      <div
        class="flex transition-transform duration-500 ease-out h-full"
        style="transform: translateX(-{currentIndex * 100}%);"
      >
        {#each slides as slide}
          <div class="w-full h-full shrink-0">
            <img src={slide.image} alt={slide.title || "Slide Image"} class="w-full h-full object-cover" />
          </div>
        {/each}
      </div>

      <!-- Dot Track -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {#each slides as _, i}
          <button
            onclick={() => goToSlide(i)}
            class="h-2 rounded-full transition-all cursor-pointer {currentIndex === i
              ? 'w-8 bg-white'
              : 'w-2 bg-white/50'}"
            aria-label="slide-{i}"
          ></button>
        {/each}
      </div>
    </div>

    <!-- Next Button (Absolute บนมือถือ, Relative ตั้งแต่ sm ขึ้นไป) -->
    <button
      onclick={nextSlide}
      class="absolute right-2 sm:right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer"
      aria-label="Next Slide"
    >
      ❯
    </button>
  </div>
</section>