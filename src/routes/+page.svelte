<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { pb, pbUser } from '$lib/pocketbase';
    export let data;

    const [today, _] = new Date().toISOString().split('T');

    // for the request modal
    let modalRequestId = '';
    let date = today;
    let reason = '';
    let duration = 1;

    // Store for clock-in statuses
    const clockInStatuses = writable({});

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

    function hasClockedInToday(workplaceId, windowIndex, statuses) {
        const key = `clockin_${workplaceId}_${today}_${windowIndex}`;
        return statuses[key] === true;
    }

    function recordClockIn(workplaceId, windowIndex) {
        const key = `clockin_${workplaceId}_${today}_${windowIndex}`;
        localStorage.setItem(key, 'true');
        clockInStatuses.update(statuses => {
            statuses[key] = true;
            return statuses;
        });
    }

    function isWithinTimeWindow(workplaceId, rules, statuses) {
        if (!rules || rules.length === 0) 
            return { allowed: true, windowIndex: -1 }; // 24/7 access if no rules

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            // get key val from rule
            const startTime = rule.s.split(':').map(Number);
            const endTime = rule.e.split(':').map(Number);
            const startMinutes = startTime[0] * 60 + startTime[1];
            const endMinutes = endTime[0] * 60 + endTime[1];

            let isInWindow = false;
            if (startMinutes <= endMinutes) // Same day window
                isInWindow = currentTime >= startMinutes && currentTime <= endMinutes;
            else // Overnight window (e.g., 22:00 to 06:00)
                isInWindow = currentTime >= startMinutes || currentTime <= endMinutes;

            if (isInWindow) {
                // Check if already clocked in for this window today
                if (hasClockedInToday(workplaceId, i, statuses))
                    return { allowed: false, windowIndex: i, reason: 'already_clocked_in' };
                return { allowed: true, windowIndex: i };
            }
        }

        return { allowed: false, windowIndex: -1, reason: 'outside_window' };
    }

    function clockIn(e, workplace) {
        e.target.textContent = 'clocking in...';
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
                        const timeCheck = isWithinTimeWindow(workplace.id, workplace.rules, get(clockInStatuses));
                        recordClockIn(workplace.id, timeCheck.windowIndex);
                    })
                    .catch(error => {alert(error); e.target.textContent = 'clock in';});
            },
            error => {
                alert("Unable to get your location. Make sure that your browser and our site has location permission");
                e.target.textContent = 'clock in';
            }
        );
    }

    // clean up & load clockin status
    onMount(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const statuses = {};
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith('clockin_')) return;
            const [_, __, dateStr] = key.split('_');
            const entryDate = new Date(dateStr);
            if (entryDate < yesterday)
                localStorage.removeItem(key);
            else
                statuses[key] = localStorage.getItem(key) === 'true';
        });
        clockInStatuses.set(statuses);
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
        {#if data.requests.filter(r => r.workplace === workplace.id).length}
            <button class="btn-primary" on:click={() => goto(`/request/${workplace.id}`)}>
                pending requests
            </button>
        {/if}
    </div>
{/each}
{/if}

{#if data.workplaces_as_employee.length}
    <h1 class="form-title">Workplaces (as employee)</h1>
    {#each data.workplaces_as_employee as workplace}
        <div class="form-section">
            <h2>{workplace.name}</h2>
            <button
                class="btn-primary"
                on:click={e => clockIn(e, workplace)}
                disabled={!isWithinTimeWindow(workplace.id, workplace.rules, $clockInStatuses).allowed}>
                clock in
            </button>
            <button class="btn-secondary" on:click={() => modalRequestId = workplace.id}>Request Leave</button>
        </div>
    {/each}
{/if}

{#if modalRequestId}
<div class="modal-overlay">
    <div class="modal-content">
        <div class="form-question">
            <form on:submit={e => {
                e.preventDefault();
                const formValues = Object.fromEntries(new FormData(e.target));
                pb.collection('request').create({
                    workplace: modalRequestId,
                    createdBy: get(pbUser)?.id,
                    ...formValues
                })
                .catch(() => alert('you have already requested leave for this date'));
                modalRequestId = "";
            }}>
                Date: <input name="date" type="date" required min={today} value={today} />
                <br>
                Reason: <input name="reason" required maxlength="255"/>
                <br>
                For how many days: <input name="duration" required type="number" min="1" value="1"/>
                <button type="submit" class="btn-primary">Submit</button>
                <button class="btn-secondary" on:click={() => modalRequestId = ''}>Cancel</button>
            </form>
        </div>
    </div>
</div>
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

