<script lang="ts">
  import Carousel from "$lib/components/Carousel.svelte";
    import type { Slide } from "$lib/type/slide";
  // sample data
    const mySlides: Slide[] = [
    {
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      title: 'Misty Mountains',
      description: 'Explore nature in all its beauty.'
    },
    {
      image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
      title: 'Dense Forest',
      description: 'Feel the fresh air and tranquility.'
    },
    {
      image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80',
      title: 'Serene Waterfalls',
      description: 'Discover hidden spots around the world.'
    }
  ];
</script>
<Carousel slides={mySlides} />