<script lang='ts'>
    let { status }: { status: string } = $props();

    const steps = [
        { id: "zone", label: "เลือกโซน", num: 1 },
        { id: "seat", label: "เลือกที่นั่ง", num: 2 },
        { id: "confirm", label: "ยืนยันการจอง", num: 3 },
    ];

    function getStepState(stepId: string) {
        if (status === "confirm") {
            return stepId === "confirm" ? "active" : "completed";
        }
        if (status === "seat") {
            if (stepId === "zone") return "completed";
            if (stepId === "seat") return "active";
            return "upcoming";
        }
        // status === "zone"
        return stepId === "zone" ? "active" : "upcoming";
    }
</script>

<nav aria-label="ขั้นตอนการจองที่นั่ง" class="w-full max-w-xl mx-auto my-6 px-4">
    <ol class="flex items-center justify-between w-full relative">
        <!-- Connecting Line Background -->
        <div class="absolute left-6 right-6 top-4 h-0.5 bg-border-strong -z-0"></div>
        <!-- Active Progress Line Fill -->
        <div 
            class="absolute left-6 top-4 h-0.5 bg-secondary transition-all duration-300 -z-0"
            style="width: {status === 'confirm' ? 'calc(100% - 3rem)' : status === 'seat' ? 'calc(50% - 1.5rem)' : '0%'};"
        ></div>

        {#each steps as step}
            {@const state = getStepState(step.id)}
            <li class="flex flex-col items-center relative z-10">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 {
                    state === 'completed'
                        ? 'bg-secondary text-white shadow-xs'
                        : state === 'active'
                        ? 'bg-white text-secondary ring-3 ring-secondary shadow-xs'
                        : 'bg-surface-subtle text-dark-soft border border-border-strong'
                }">
                    {#if state === 'completed'}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>
                    {:else}
                        <span>{step.num}</span>
                    {/if}
                </div>
                <span class="text-xs sm:text-sm font-semibold mt-2 {
                    state === 'active' ? 'text-secondary' : state === 'completed' ? 'text-dark' : 'text-dark-soft'
                }">
                    {step.label}
                </span>
            </li>
        {/each}
    </ol>
</nav>
