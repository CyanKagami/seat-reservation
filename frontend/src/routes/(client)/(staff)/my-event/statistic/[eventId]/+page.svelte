<script lang='ts'>
    const {data} = $props();
    const percentage = $derived(data.checkedInCount / (data.totalReservation || 1) * 100);

</script>
<div class="flex flex-col items-center mt-10 sm:mt-14 mx-auto w-full max-w-6xl sm:max-w-7xl self-center p-5 pt-12">
    <h1 class="text-4xl font-semibold mb-10">สถิติการเข้าร่วม</h1>
    <div class="w-full rounded-lg grid grid-cols-3 pt-5 gap-5">
        <div class="col-span-2 bg-white rounded-lg border border-accent drop-shadow-md h-full w-ful flex gap-3">
            <div class="bg-accent px-7 h-full rounded-l-lg flex items-center justify-center w-fit">
                <svg class="w-20 h-20 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zm0-464a208 208 0 1 0 0 416 208 208 0 1 0 0-416zm70.7 121.9c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L243.4 366.1c-4.1 5.7-10.5 9.3-17.5 9.8-7 .5-13.9-2-18.8-6.9l-55.9-55.9c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l36 36 105.6-145.2z"/></svg>
            </div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base">สมัครเข้าร่วมงาน</p>
                <p class="text-4xl">{data.totalReservation} คน</p>
            </div>
            <div class="w-0.5 bg-black my-5"></div>
            <div class="bg-white p-5 text-left flex flex-col gap-2">
                <p class="text-base font-semibold">คณะที่เข้าร่วมมากที่สุด</p>
                <p class="text-base">
                {
                    data.demographic.mostParticipatedFaculty?.name
                    ? `${data.demographic.mostParticipatedFaculty?.name} (${(data.demographic.mostParticipatedFaculty?.count || 0) / (data.totalReservation || 1) * 100} %)`
                    : "ยังไม่มีข้อมูล"
                } 
                </p>
                <p class="text-base font-semibold">ชั้นปีที่เข้าร่วมมากที่สุด</p>
                <p class="text-base">
                {
                    data.demographic.mostParticipatedYear?.name
                    ? `นักศึกษาที่เข้าศึกษาในปี ${data.demographic.mostParticipatedYear?.name} (${(data.demographic.mostParticipatedYear?.count || 0) / (data.totalReservation || 1) * 100} %)`
                    : "ยังไม่มีข้อมูล"
                }
                </p>
            </div>
        </div>
        <div class="bg-white rounded-lg border border-secondary drop-shadow-md h-full w-ful flex gap-3">
            <div class="bg-secondary px-7 h-full rounded-l-lg flex items-center justify-center w-fit">
                <svg class="w-20 h-20 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>
            </div>
            <div class="bg-white p-5 text-left flex flex-col gap-2 rounded-r-lg">
                <p class="text-base">เข้าร่วมงานแล้ว</p>
                <div class="flex items-end">
                    <p class="text-4xl">{data.checkedInCount} คน</p>
                    <p class="ml-3 text-sm font-semibold">({percentage.toFixed(2)} %)</p>
                </div>
            </div>
        </div>
    </div>

    <table class="w-full mt-10 border-2 border-collapse drop-shadow-md">
        <thead>
            <tr>
               <th rowspan="2" class=" bg-secondary text-white border-2 border-black p-5">โซนที่นั่ง</th>
               <th rowspan="2" class=" bg-secondary text-white border-2 border-black">ความจุที่นั่ง</th>
               <th colspan="2" class="bg-secondary text-white border-2 border-black">จองแล้ว</th>
               <th colspan="2" class="bg-secondary text-white border-2 border-black">คงเหลือ</th>
            </tr>
            <tr>
                <th class="bg-secondary text-white border-2 border-black">จำนวน</th>
                <th class="bg-secondary text-white border-2 border-black">เปอร์เซ็นต์</th>
                <th class="bg-secondary text-white border-2 border-black">จำนวน</th>
                <th class="bg-secondary text-white border-2 border-black">เปอร์เซ็นต์</th>
            </tr>
            <!-- Data -->
            {#each Object.entries(data.zoneData) as [key, val] (key)}
                {#if val.capacity && val.id !== 'zone-unavailable'}
                    <tr>
                        <td class="text-center border-2 p-2">{val.name}</td>
                        <td class="text-center border-2 p-2">{val.capacity}</td>
                        <td class="text-center border-2 p-2">{val.takenCount}</td>
                        <td class="text-center border-2 p-2">{(val.takenCount / val.capacity * 100).toFixed(2)}</td>
                        <td class="text-center border-2 p-2">{val.capacity - val.takenCount}</td>
                        <td class="text-center border-2 p-2">{((val.capacity - val.takenCount) / val.capacity * 100).toFixed(2)}</td>
                    </tr>
                {/if}

            {/each}
            <!-- สรุป -->
             <tr>
                <td class="bg-accent text-white text-center border-2 p-3 border-black">รวม</td>
                <td class="bg-accent/40 text-center border-2 p-2">{data.totalCapacity}</td>
                <td class="bg-accent/40 text-center border-2 p-2">{data.totalReservation}</td>
                <td class="bg-accent/40 text-center border-2 p-2">{data.totalCapacity ? (data.totalReservation / data.totalCapacity * 100).toFixed(2) : '-'}</td>
                <td class="bg-accent/40 text-center border-2 p-2">{data.remainingCapacity}</td>
                <td class="bg-accent/40 text-center border-2 p-2">{data.remainingCapacity ? (data.remainingCapacity / data.totalCapacity * 100).toFixed(2) : '-'}</td>
             </tr>
        </thead>
    </table>
</div>
