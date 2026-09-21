<script lang='ts'>
    let {status} = $props()
</script>
<div class="w-180 h-20 flex items-center my-20">
    <div class="{(status === "seat" || status === "confirm") ? "bg-secondary" : "bg-gray-300"} w-1/2 h-2 flex items-center justify-start">
        <div class="w-6 h-6 rounded-full bg-secondary relative">
            <p class="absolute top-10 -left-7 w-30 text-sm">Select Zone</p>
        </div>
    </div>
    <div class="{(status === "confirm") ? "bg-secondary" : "bg-gray-300"} w-1/2 h-2 flex items-center justify-between">
        <div class="w-6 h-6 rounded-full {(status === "seat" || status === "confirm") ? "bg-secondary" : "bg-gray-300"} relative">
            <p class="absolute top-10 -left-7 w-30 text-sm">Select Seat</p>
        </div>
        <div class="w-6 h-6 rounded-full {(status === "confirm") ? "bg-secondary" : "bg-gray-300"} relative">
            <p class="absolute top-10 -left-3 w-30 text-sm">Confirm</p>
        </div>
    </div>
</div>