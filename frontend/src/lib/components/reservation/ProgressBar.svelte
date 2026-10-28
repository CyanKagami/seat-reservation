<script lang='ts'>
    let { status }: { status: string } = $props();
    let activeStep = $derived(status === "confirm" ? 2 : status === "seat" ? 1 : 0);

    const steps = [
        { id: "zone", label: "เลือกโซน", num: 1 },
        { id: "seat", label: "เลือกที่นั่ง", num: 2 },
        { id: "confirm", label: "ยืนยันการจอง", num: 3 },
    ];

    function getStepState(stepId: string) {
        const stepIndex = steps.findIndex((step) => step.id === stepId);
        if (stepIndex < activeStep) return "completed";
        if (stepIndex === activeStep) return "active";
        return "upcoming";
    }
</script>

<nav aria-label="ขั้นตอนการจองที่นั่ง" class="mx-auto my-2 w-full max-w-xl px-4 sm:my-6">
    <div
        role="progressbar"
        aria-valuemin="1"
        aria-valuemax="3"
        aria-valuenow={activeStep + 1}
        aria-valuetext={`ขั้นตอนที่ ${activeStep + 1} จาก 3`}
        class="flex w-full gap-2 sm:hidden"
    >
        {#each [0, 1, 2] as step}
            <span
                aria-hidden="true"
                class="h-1.5 flex-1 rounded-full transition-colors duration-300 {step <= activeStep ? 'bg-secondary' : 'bg-border-strong'}"
            ></span>
        {/each}
    </div>

    <ol class="relative hidden w-full grid-cols-3 items-center sm:grid">
        <div class="absolute left-[16.6667%] right-[16.6667%] top-4 -z-0 h-0.5 bg-border-strong"></div>
        <div
            class="absolute left-[16.6667%] top-4 -z-0 h-0.5 bg-secondary transition-all duration-300"
            style="width: {activeStep * 33.3333}%;"
        ></div>

        {#each steps as step}
            {@const state = getStepState(step.id)}
            <li class="relative z-10 flex w-full flex-col items-center">
                <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 {
                    state === 'completed'
                        ? 'bg-secondary text-white shadow-xs'
                        : state === 'active'
                        ? 'bg-white text-secondary ring-3 ring-secondary shadow-xs'
                        : 'border border-border-strong bg-surface-subtle text-dark-soft'
                }">
                    {#if state === 'completed'}
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>
                    {:else}
                        <span>{step.num}</span>
                    {/if}
                </div>
                <span class="mt-2 text-xs font-semibold sm:text-sm {
                    state === 'active' ? 'text-secondary' : state === 'completed' ? 'text-dark' : 'text-dark-soft'
                }">
                    {step.label}
                </span>
            </li>
        {/each}
    </ol>
</nav>
