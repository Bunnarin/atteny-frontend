<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { get, writable } from 'svelte/store';
    import { pb, pbUser } from '$lib/stores/pocketbase.js';
    export let data;

    const [today, _] = new Date().toLocaleDateString();

    // Store for clock-in statuses
    let clockInStore = writable({});

    // helper to calculate distance
    const deg2rad = deg => deg * (Math.PI / 180);
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radius of the earth in m
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in m
    }

    // 2nd level helper
    const convertToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    // 1st level helper
    const isBetween = (timeStr, startStr, endStr) => {
        const timeMn = convertToMinutes(timeStr);
        const startMn = convertToMinutes(startStr);
        const endMn = convertToMinutes(endStr);
        if (endMn > startMn) //daytime
            return timeMn > startMn && timeMn < endMn;
        else //nighttime
            return timeMn < startMn && timeMn > endMn;
    }

    function canClockin(workplace) {
        // first check if there's any time window in the workplace.rules that allow
        if (!workplace.rules.length) 
            return true; // 24/7 access if no rules
        
        const timeStr = new Date().toLocaleTimeString().slice(0, 5);
        const matchingRule = workplace.rules.find(rule => isBetween(timeStr, rule.s, rule.e));
        if (!matchingRule)
            return false //not allowed clock in at this time
    
        // then check if there's already a clockin in that timewindow
        const clockIns = get(clockInStore);
        const mounted = clockIns[today]; //because error if not mounted
        if (mounted)
            for (const pastTimeStr of (clockIns[today][workplace.id] || []))
                if (isBetween(pastTimeStr, matchingRule.s, matchingRule.e))
                    return false // already clocked in for this timewindow
        
        // after passing all the check
        return true;
    }

    function recordClockIn(workplaceId) {
        // update the reactive store and localstorage
        const timeStr = new Date().toLocaleTimeString().slice(0, 5);
        const clockIns = get(clockInStore);
        clockIns[today][workplaceId] ??= [];
        clockIns[today][workplaceId].push(timeStr);
        clockInStore.set(clockIns);
        localStorage.setItem('clockIns', JSON.stringify(clockIns));
    }

    async function clockIn(e, workplace) {
        e.target.textContent = 'clocking in...';
        // confirm them to make sure that they don't deny it the first time
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permissionStatus.state === "prompt")
            alert(`We need your location to confirm that you are at this workplace. Please click allow on the next prompt. We do not track your location 24/7. We only check it everytime you clockin.`);
        
        navigator.geolocation.getCurrentPosition(
            pos => {
                const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, workplace.location.lat, workplace.location.lon);
                if (distance > workplace.proximity) {
                    e.target.textContent = 'clock in';
                    alert(`You are ${distance.toFixed(2)} m away from ${workplace.name}. You must be within ${workplace.proximity} m to clock in.`);
                }
                else
                    pb.send(`/clockin/${workplace.id}`, {method: 'POST', body: {timezone: Intl.DateTimeFormat().resolvedOptions().timeZone}})
                    .then(() => {
                        e.target.textContent = '✅';
                        setTimeout(() => e.target.textContent = 'clock in', 10000);
                        recordClockIn(workplace.id);
                    })
                    .catch(error => {alert(error); e.target.textContent = 'clock in';});
            },
            error => {
                alert("Please make sure that you enable location on your device and that this browser has permission. If you didn't allow us to access your location the first time, please manually allow it on your browser.");
                e.target.textContent = 'clock in';
            }
        );
    }

    // clean up & load clockin status
    onMount(() => {
        const clockIns = JSON.parse(localStorage.getItem('clockIns') || '{}');
        clockIns[today] ??= {}; //init today's records
        Object.keys(clockIns).forEach(date => {
            if (date != today) 
                delete clockIns[date];
        });
        // Save back the cleaned records
        clockInStore.set(clockIns);
        localStorage.setItem('clockIns', JSON.stringify(clockIns));
    });
</script>

{#if $pbUser}
<div class="form-actions">
    <button class="btn-primary" on:click={() => goto('/workplace/new')}>Add Workplace</button>
</div>
{/if}

{#if data.workplaces_as_employer.length}
    <h1 class="form-title">Workplaces (as employer)</h1>
    {#each data.workplaces_as_employer as workplace}
        <div class="form-section">
            <h2>{workplace.name}</h2>
            <button class="btn-primary" on:click={() => goto(`/workplace/${workplace.id}`)}>Edit</button>
            <button class="btn-secondary" on:click={e => {
                navigator.clipboard.writeText(window.location.origin + '/subscribe/' + workplace.id);
                e.target.textContent = "copied";
            }}>
                copy link
            </button>
        </div>
    {/each}
{/if}

{#if data.workplaces_as_employee.length}
    <h1 class="form-title">Workplaces (as employee)</h1>
    {#each data.workplaces_as_employee as workplace}
        <div class="form-section">
            <h2>{workplace.name}</h2>
            <button on:click={e => clockIn(e, workplace)} 
                disabled={!canClockin(workplace, $clockInStore)} 
                title={!canClockin(workplace, $clockInStore) ? "your employer doesn't want you to clock in at this time" : ""}
                class="btn-primary">
                clock in
            </button>
        </div>
    {/each}
{/if}

{#if !$pbUser}
    <!-- Hero Section - Catchy headline and call to action -->
    <section class="py-20 md:py-32 text-center">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4 leading-tight">
                Track Employee Attendance, The Easy Way.
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                A simple, intuitive, and completely free attendance solution for small businesses.
            </p>
        </div>
    </section>

    <!-- Features Section - Highlight key benefits -->
    <section class="py-16 md:py-24 bg-gray-100">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
                Features Built for Simplicity
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <div class="w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">One-Click Clock-In</h3>
                    <p class="text-gray-600">
                        Employees can clock in and out with a single tap, no app download required.
                    </p>
                </div>

                <!-- Feature 2 -->
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <div class="w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Instant Data Sync</h3>
                    <p class="text-gray-600">
                        Attendance data is instantly synced to your Google Sheets, giving you real-time access.
                    </p>
                </div>

                <!-- Feature 3 -->
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <div class="w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.047m0 0a12.042 12.042 0 00-2.887 6.945c.188 1.944.978 3.864 2.307 5.594l.872.871a1.002 1.002 0 001.414 0l.871-.871a12.042 12.042 0 002.307-5.594c.007-.03.013-.06.02-.09m0 0a12.042 12.042 0 00-2.887-6.945z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Zero-Cost Solution</h3>
                    <p class="text-gray-600">
                        Leveraging free platforms, we provide a powerful tool without the heavy subscription fees.
                    </p>
                </div>
            </div>
        </div>
    </section>
{/if}