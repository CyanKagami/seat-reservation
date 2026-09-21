<script lang='ts'>
  import ReservationZonePicker from "./zone-editor/components/ReservationZonePicker.svelte";
  import { ZoneEditorState } from "./zone-editor/zoneState.svelte";
  let {seatState} : {seatState:ZoneEditorState} = $props();
</script>
<div class="w-3xl bg-gray-200 h-auto py-10 self-center mt-4 flex flex-col gap-5 px-10">
<ReservationZonePicker objects={seatState.objects} zone={seatState.zones} ></ReservationZonePicker>
</div>