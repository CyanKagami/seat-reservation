<script lang="ts">
	import SeatEditor from "$lib/components/seat-editor/components/SeatEditor.svelte";
	import { SeatEditorState } from "$lib/components/seat-editor/seatState.svelte.js";
	import { onMount } from "svelte";
	let { params } = $props();
	let state: SeatEditorState | undefined = $state();
	onMount(async () => {
		fetch(`/api/place/layout?placeId=${params.placeId}`, {
			method: 'GET',
			credentials:'include'
		})
		.then((response) => {
			return response.arrayBuffer()
		})
		.then((data) => {
			state?.loadFromMessagePack(data);
			// if (data.statusCode === 200){
			// 	state?.loadFromMessagePack(data.body.layout);
			// }
		})
		.catch((err) => {
			alert(err);
		})
	})
</script>

<SeatEditor placeId={params.placeId} bind:state={state}></SeatEditor>