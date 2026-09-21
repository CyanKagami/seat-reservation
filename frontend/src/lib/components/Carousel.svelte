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

<section class="relative w-full overflow-hidden">
  <div class="w-full flex justify-center gap-10 h-96 items-center">
    <!--Previos Button-->
    <button
      onclick={prevSlide}
      class=" bg-black/50 text-white p-2 rounded-full"
    >
      ❮
    </button>
    <div class="relative w-full max-w-4xl overflow-hidden rounded-xl h-96">
      <!--Slide Tracks-->
      <div
        class="flex transition-transform duration-500 ease-out"
        style="transform: translateX(-{currentIndex * 100}%);"
      >
        {#each slides as slide}
          <div class="w-full shrink-0">
            <img src={slide.image} alt={slide.title} class="w-full h-auto" />
          </div>
        {/each}
      </div>

      <!--Dot Track-->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {#each slides as _, i}
          <button
            onclick={() => goToSlide(i)}
            class="h-2 rounded-full transition-all {currentIndex === i
              ? 'w-8 bg-white'
              : 'w-2 bg-white/50'}"
            aria-label="slide-{i}"
          ></button>
        {/each}
      </div>
    </div>

    <!-- Next Button -->
    <button
      onclick={nextSlide}
      class=" bg-black/50 text-white p-2 rounded-full"
    >
      ❯
    </button>
  </div>
</section>
