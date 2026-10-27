<script lang='ts'>
    const {data, params} = $props();
    const percentage = $derived(data.checkedInCount / (data.totalReservation || 1) * 100);
    const zones = $derived(
        Object.entries(data.zoneData).filter(([, zone]) => zone.capacity && zone.id !== "zone-unavailable"),
    );

</script>
<div class="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
    <nav class="mb-5 flex min-w-0 items-center gap-2 text-sm text-dark-soft" aria-label="Breadcrumb">
        <a href="/my-event" class="transition-colors hover:text-dark">กิจกรรมของฉัน</a>
        <span aria-hidden="true">/</span>
        <a href="/my-event/event-info/{params.eventId}" class="transition-colors hover:text-dark">รายละเอียดกิจกรรม</a>
        <span aria-hidden="true">/</span>
        <span class="truncate font-semibold text-dark-muted">สถิติการเข้าร่วม</span>
    </nav>
    <h1 class="mb-6 text-3xl font-extrabold tracking-tight text-dark sm:text-4xl">สถิติการเข้าร่วม</h1>
    <div class="grid w-full grid-cols-1 gap-4 rounded-lg pt-5 md:grid-cols-3 md:gap-5">
        <div class="flex h-full w-full min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-accent bg-white drop-shadow-md sm:flex-row md:col-span-2">
            <div class="flex shrink-0 items-center justify-center bg-accent px-5 py-4 sm:rounded-l-lg sm:px-7 sm:py-0">
                <svg class="h-12 w-12 fill-white sm:h-20 sm:w-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg>
            </div>
            <div class="flex min-w-0 flex-col gap-2 p-5 text-left">
                <p class="text-base">สมัครเข้าร่วมงาน</p>
                <p class="text-3xl sm:text-4xl">{data.totalReservation} คน</p>
            </div>
            <div class="mx-5 h-px bg-black sm:my-5 sm:mx-0 sm:h-auto sm:w-0.5"></div>
            <div class="flex min-w-0 flex-col gap-2 p-5 pt-0 text-left sm:pt-5">
                <p class="text-base font-semibold">คณะที่เข้าร่วมมากที่สุด</p>
                <p class="break-words text-base">
                {
                    data.demographic.mostParticipatedFaculty?.name
                    ? `${data.demographic.mostParticipatedFaculty?.name} (${(data.demographic.mostParticipatedFaculty?.count || 0) / (data.totalReservation || 1) * 100} %)`
                    : "ยังไม่มีข้อมูล"
                } 
                </p>
                <p class="text-base font-semibold">ชั้นปีที่เข้าร่วมมากที่สุด</p>
                <p class="break-words text-base">
                {
                    data.demographic.mostParticipatedYear?.name
                    ? `นักศึกษาที่เข้าศึกษาในปี ${data.demographic.mostParticipatedYear?.name} (${(data.demographic.mostParticipatedYear?.count || 0) / (data.totalReservation || 1) * 100} %)`
                    : "ยังไม่มีข้อมูล"
                }
                </p>
            </div>
        </div>
        <div class="flex h-full w-full min-w-0 gap-3 overflow-hidden rounded-lg border border-secondary bg-white drop-shadow-md">
            <div class="flex shrink-0 items-center justify-center rounded-l-lg bg-secondary px-5 sm:px-7">
                <svg class="h-12 w-12 fill-white sm:h-20 sm:w-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v1.07a7 7 0 0 1 5.93 5.93H20a1 1 0 1 1 0 2h-1.07A7 7 0 0 1 13 18.93V20a1 1 0 1 1-2 0v-1.07A7 7 0 0 1 5.07 13H4a1 1 0 1 1 0-2h1.07A7 7 0 0 1 11 5.07V4a1 1 0 0 1 1-1Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>
            </div>
            <div class="flex min-w-0 flex-col justify-center gap-2 p-4 text-left sm:p-5">
                <p class="text-base">เข้าร่วมงานแล้ว</p>
                <div class="flex flex-wrap items-end gap-x-3">
                    <p class="text-3xl sm:text-4xl">{data.checkedInCount} คน</p>
                    <p class="text-sm font-semibold">({percentage.toFixed(2)} %)</p>
                </div>
            </div>
        </div>
    </div>

    <section class="mt-8 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xs sm:mt-10">
        <div class="overflow-x-auto">
            <table class="w-full min-w-[44rem] border-collapse border border-border-strong text-left text-sm">
                <caption class="sr-only">สรุปจำนวนที่นั่ง ความจุ การจอง และที่นั่งคงเหลือ แยกตามโซน</caption>
                <thead class="bg-secondary text-white">
                    <tr>
                        <th rowspan="2" scope="col" class="whitespace-nowrap border border-border-strong px-3 py-4 font-semibold sm:px-5">โซนที่นั่ง</th>
                        <th rowspan="2" scope="col" class="whitespace-nowrap border border-border-strong px-3 py-4 text-right font-semibold sm:px-5">ความจุที่นั่ง</th>
                        <th colspan="2" scope="colgroup" class="whitespace-nowrap border border-border-strong px-3 py-4 text-center font-semibold sm:px-5">จองแล้ว</th>
                        <th colspan="2" scope="colgroup" class="whitespace-nowrap border border-border-strong px-3 py-4 text-center font-semibold sm:px-5">คงเหลือ</th>
                    </tr>
                    <tr>
                        <th scope="col" class="whitespace-nowrap border border-border-strong px-3 py-3 text-right text-xs font-medium sm:px-5">จำนวน</th>
                        <th scope="col" class="whitespace-nowrap border border-border-strong px-3 py-3 text-right text-xs font-medium sm:px-5">เปอร์เซ็นต์</th>
                        <th scope="col" class="whitespace-nowrap border border-border-strong px-3 py-3 text-right text-xs font-medium sm:px-5">จำนวน</th>
                        <th scope="col" class="whitespace-nowrap border border-border-strong px-3 py-3 text-right text-xs font-medium sm:px-5">เปอร์เซ็นต์</th>
                    </tr>
                </thead>
                <tbody class="text-dark-muted">
                    {#each zones as [key, val] (key)}
                        <tr class="transition-colors odd:bg-white even:bg-surface-base/60 hover:bg-secondary-subtle/40">
                            <th scope="row" class="whitespace-nowrap border border-border-strong px-3 py-4 font-semibold text-dark sm:px-5">{val.name}</th>
                            <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{val.capacity}</td>
                            <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{val.takenCount}</td>
                            <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{(val.takenCount / val.capacity * 100).toFixed(2)}%</td>
                            <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{val.capacity - val.takenCount}</td>
                            <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{((val.capacity - val.takenCount) / val.capacity * 100).toFixed(2)}%</td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="6" class="border border-border-strong px-3 py-12 text-center text-sm text-dark-soft sm:px-5">ยังไม่มีข้อมูลโซนที่นั่ง</td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot class="border-t-2 border-border-strong bg-surface-subtle font-bold text-dark">
                    <tr>
                        <th scope="row" class="whitespace-nowrap border border-border-strong px-3 py-4 sm:px-5">รวม</th>
                        <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{data.totalCapacity}</td>
                        <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{data.totalReservation}</td>
                        <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{data.totalCapacity ? `${(data.totalReservation / data.totalCapacity * 100).toFixed(2)}%` : '-'}</td>
                        <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{data.remainingCapacity}</td>
                        <td class="whitespace-nowrap border border-border-strong px-3 py-4 text-right tabular-nums sm:px-5">{data.totalCapacity ? `${(data.remainingCapacity / data.totalCapacity * 100).toFixed(2)}%` : '-'}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </section>
</div>