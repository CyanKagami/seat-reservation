<script>
  import SeatViewer from "$lib/components/SeatViewer.svelte";

  const sampleData = {
    "location_id": "v_123",
    "dimension": {
      "width": 80,
      "height": 60
    },
    "seats": [
      { "seat_id": "s_1", "x": 40, "y": 40 },
      { "seat_id": "s_2", "x": 160, "y": 40 }
    ]
  };

  let activeSeat = $state(null);
</script>

<div class="w-screen h-screen">
  <SeatViewer 
    mapData={sampleData} 
    bind:selectedSeatId={activeSeat} 
    onSeatSelect={(seat) => console.log("Seat clicked:", seat)}
  />
</div>