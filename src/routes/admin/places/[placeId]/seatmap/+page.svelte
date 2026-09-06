<script>
import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	let { params } = $props();
</script>

<SeatEditor placeId={params.placeId}></SeatEditor>