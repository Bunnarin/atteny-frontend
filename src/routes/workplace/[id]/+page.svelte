<script lang="ts">
    import {PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_PROJECT_NUMBER} from '$env/static/public';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { pb, pbUser } from '$lib/pocketbase';
    import { get } from 'svelte/store';
    import { workplaceStore } from '$lib/stores/workplace';
    export let data;
        
    // Initialize workplace_fixture with data or defaults
    const workplace_fixture = {
        name: data.workplace?.name || '',
        file_id: data.workplace?.file_id || '',
        location: data.workplace?.location || { lat: 0, lon: 0 },
        rules: data.workplace?.rules ? JSON.parse(JSON.stringify(data.workplace.rules)) : [],
        employer: get(pbUser)?.id,
        employees: data.workplace?.employees || [],
        proximity: data.workplace?.proximity || 10
    }
    let emails = JSON.parse(JSON.stringify(data.workplace?.expand?.employees?.map(e => e.email) || []));
    let currentEmail = '';
    let selectedFile = data.workplace?.file_id;
    let showPicker = false;

    // Default to Phnom Penh coordinates    
    let lat = workplace_fixture.location.lat;
    let lon = workplace_fixture.location.lon;
    let map;
    let marker;
    let userLocationMarker;
    let L;
    let userLat = 0;
    let userLon = 0;

    // Rules for clock-in time windows
    // copy it so that we can change it
    let rules = workplace_fixture?.rules ? JSON.parse(JSON.stringify(workplace_fixture.rules)) : [];

    onMount(async () => {
        await import('@googleworkspace/drive-picker-element');
        
        L = (await import('leaflet')).default;

        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(map);

        // Create a blue dot icon for user location
        const blueDot = L.divIcon({
            className: 'user-location-dot',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10],
            html: '<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>'
        });

        // Add user location marker
        userLocationMarker = L.marker([0, 0], {
            icon: blueDot,
            interactive: false
        }).addTo(map);

        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    userLat = position.coords.latitude;
                    userLon = position.coords.longitude;

                    // Update user location marker
                    userLocationMarker.setLatLng([userLat, userLon]);

                    // If this is a new workplace, center the map on user's location
                    if (!data.workplace) {
                        lat = userLat;
                        lon = userLon;
                        map.setView([lat, lon], 13);
                        if (marker) {
                            marker.setLatLng([lat, lon]);
                        }
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        }

        // Existing marker for workplace location
        marker = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                shadowSize: [41, 41]
            })
        }).addTo(map);

        map.on('click', (e) => {
            lat = e.latlng.lat;
            lon = e.latlng.lng;
            marker.setLatLng([lat, lon]);
        });
    });

    $: if (L && map && lat !== undefined && lon !== undefined) {
        map.setView([lat, lon], 13);
        marker.setLatLng([lat, lon]);
    }

    function addEmail(event) {
        if (event.key !== 'Enter' || emails.length >= data.free_spots)
            return;
        event.preventDefault();
        if (emails.includes(currentEmail.trim()) || !currentEmail.includes('@'))
            return;
        if (currentEmail.trim()) {
            emails = [...emails, currentEmail.trim()];
            currentEmail = '';
        }
    }

    async function delete_workplace() {
        if (!confirm('delete?')) return;
        await pb.collection('workplace').delete(data.workplace.id);
        goto('/');
    }

    async function upsert() {
        // to ensure that a file is selected
        if (!selectedFile) 
            alert('Please select a spreadsheet file before submitting.');
        // email to employee
        const employees = [];
        await Promise.all(emails.map(async (email) => {
            await pb.collection('users').getFirstListItem(`email = "${email}"`)
            .then(user => employees.push(user.id))
            .catch(async () => { // create the user
                const password = (Math.random() + 1).toString(36).substring(7);
                await pb.collection('users').create({
                    email: email,
                    password: password,
                    passwordConfirm: password,
                })
                .then(newUser => employees.push(newUser.id));
            });
        }));
        // assign the location and file id
        workplace_fixture.location = { lat, lon };
        workplace_fixture.file_id = selectedFile.id;
        workplace_fixture.employees = employees;

        if (data.workplace)
            await pb.collection('workplace').update(data.workplace.id, workplace_fixture);
        else
            await pb.collection('workplace').create(workplace_fixture);
        // refresh the workplace store
        workplaceStore.refresh();
        goto('/');
    }
</script>

{#if data.workplace}
<div class="form-actions">
    <button class="btn-primary" on:click={delete_workplace}>Delete</button>
</div>
{/if}

<div class="form-question">
    Workplace Name: <input id="name" name="name" maxlength="255" required bind:value={workplace_fixture.name}/>
</div>

<div class="form-question">
    <label class="question-title" for="file_id">Link Spreadsheet:</label>
    <button class="btn-secondary" on:click={(e) => { e.preventDefault(); showPicker = true; }}>
        {#if selectedFile} Selected {:else} Select {/if}
    </button>
</div>

{#if showPicker}
<drive-picker
    client-id="{PUBLIC_GOOGLE_CLIENT_ID}"
    app-id="{PUBLIC_GOOGLE_PROJECT_NUMBER}"
    login-hint="{get(pbUser).email}"
    on:picker:picked={(e) => [ selectedFile ] = e.detail.docs}
    >
    <drive-picker-docs-view owned-by-me="true"
        mime-types="application/vnd.google-apps.spreadsheet">
    </drive-picker-docs-view>
</drive-picker>
{/if}

<div class="form-question">
    Remaining: {emails.length} of {data.free_spots}
    <input
        id="email"
        type="email"
        bind:value={currentEmail}
        on:keydown={addEmail}
        placeholder={emails.length >= data.free_spots ? 'No more spots available' : 'Enter email address and press Enter'}
        readonly={emails.length >= data.free_spots}
    />
    {#each emails as email, index}
    <span class="employee-item">
        <button class="btn-primary" on:click={() => emails = emails.filter((_, i) => i !== index)}>x</button>
        {email}
    </span>
{/each}
</div>

<div class="form-section">
    <h2>Select Location</h2>
    <div id="map" class="map-container" style="position: relative;">
        <button type="button" class="center-button" on:click|stopPropagation={() => map.setView([userLat, userLon], 13)}>
            <img src="/center.png" alt="center"/>
        </button>
    </div>
</div>

<div class="form-question">
    Proximity (m): <input id="proximity" name="proximity" type="number" min="10" max="10000" required bind:value={workplace_fixture.proximity}/>
</div>

<div class="form-section">
    <h2>Clock-in Time Rules</h2>
    <p>Define time windows when employees can clock in. Leave empty for 24/7 access.</p>
    <!-- how to get key, value -->
    {#each rules as rule, index}
        <div>
            <input type="time" bind:value={rule.s} class="compact-time-input"/>
            to  
            <input type="time" bind:value={rule.e} class="compact-time-input"/>
            <button class="btn-primary" type="button" on:click={() => rules = rules.filter((_, i) => i !== index) }>x</button>
        </div>
    {/each}
    <button class="btn-secondary" type="button" on:click={() => rules = [...rules, {s: '01:00', e: '23:59'}]}>Add Time Window</button>
</div>

<div class="form-actions">
    <button class="btn-primary" on:click={upsert}>Save Changes</button>
</div>