<script>
    import {PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_PROJECT_NUMBER} from '$env/static/public';
    import { goto } from '$app/navigation';
    import { pb, pbUser, login } from '$lib/pocketbase';
    import { get } from 'svelte/store';
    import { workplaceStore } from '$lib/stores/workplace';
    import Map from '$lib/components/map.svelte';  
    import { onMount } from 'svelte';

    export let data;

    // state
    let saving = false;

    // if the current user doesnt have refresh_token, prompt them for it.
    if (!get(pbUser)?.google_refresh_token) {
        if (!confirm('Please Login again to access this page. This is a one-time setup.')) 
            goto('/');
        else
            login(true);
    }
        
    // Initialize workplace_fixture with data or defaults
    const workplace_fixture = {
        name: data.workplace?.name || '',
        file_id: data.workplace?.file_id || '',
        location: data.workplace?.location || { lat: 0, lon: 0 },
        rules: data.workplace?.rules ? JSON.parse(JSON.stringify(data.workplace.rules)) : [],
        employer: get(pbUser)?.id,
        employees: data.workplace?.expand?.employees?.map(e => e.email) || [],
        proximity: data.workplace?.proximity || 10
    }
    let emails = workplace_fixture.employees;
    let currentEmail = '';
    let selectedFile = data.workplace?.file_id;
    let showPicker = false;

    onMount(async () => await import('@googleworkspace/drive-picker-element'));

    async function upsert() {
        saving=true;

        workplace_fixture.file_id = selectedFile ? selectedFile.id : '';
        workplace_fixture.employees = emails;
        
        if (data.workplace) 
            await pb.collection('workplace').update(data.workplace.id, workplace_fixture)
                .catch(err => alert(err));
        else 
            await pb.collection('workplace').create(workplace_fixture)
                .catch(err => alert(err));
        
        await workplaceStore.refresh();
        goto('/');
    }
</script>

{#if data.workplace}
<div class="form-actions">
    <button class="btn-primary" on:click={async () => {
        if (!confirm('delete?')) return;
        await pb.collection('workplace').delete(data.workplace.id)
        .then(async () => await workplaceStore.refresh())
        .catch(err => alert(err));
        goto('/');
    }}>Delete</button>
</div>
{/if}

<div class="form-question">
    Workplace Name: <input id="name" name="name" maxlength="255" required bind:value={workplace_fixture.name}/>
</div>

<div class="form-question">
    <label class="question-title" for="file_id">Link Spreadsheet (If not, we will create one for you):</label>
    <button class="btn-secondary" on:click={() => {showPicker=true; document.querySelector('drive-picker').visible=true;}}>
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
    <drive-picker-docs-view owned-by-me="true" mime-types="application/vnd.google-apps.spreadsheet"></drive-picker-docs-view>
</drive-picker>
{/if}

<div class="form-question">
    Remaining: {emails.length} of {data.free_spots}
    <input
        bind:value={currentEmail}
        placeholder={emails.length >= data.free_spots ? 'No more spots available' : 'Enter email and press space'}
        readonly={emails.length >= data.free_spots}
        on:input={(e) => {
            if (e.data !== " " || emails.includes(currentEmail.trim()) || !currentEmail.includes('@'))
                return; // make sure that we listen to space, that the user is unique and valid
            emails = [...emails, currentEmail.trim()];
            currentEmail = '';
        }}
    />
    {#each emails as email, index}
    <span class="employee-item">
        <button class="btn-primary" on:click={() => emails = emails.filter((_, i) => i !== index)}>x</button>
        {email}
    </span>
{/each}
</div>

<div class="form-question">
    Location: <Map bind:point={workplace_fixture.location} height={300} />
</div>

<div class="form-question">
    Proximity (m): <input name="proximity" type="number" min="10" max="10000" required bind:value={workplace_fixture.proximity}/>
</div>

<div class="form-section">
    <h2>Clock-in Time Rules</h2>
    <p>Define time windows when employees can clock in. Leave empty for 24/7 access.</p>
    {#each workplace_fixture.rules as rule, index}
        <input type="time" bind:value={rule.s} class="compact-time-input"/>
        to  
        <input type="time" bind:value={rule.e} class="compact-time-input"/>
        <button class="btn-primary" type="button" on:click={() => workplace_fixture.rules = workplace_fixture.rules.filter((_, i) => i !== index) }>x</button>
        <br>
    {/each}
    <button class="btn-secondary" type="button" on:click={() => workplace_fixture.rules = [...workplace_fixture.rules, {s: '01:00', e: '23:59'}]}>Add Time Window</button>
</div>

<div class="form-actions">
    <button class="btn-primary" disabled={saving} on:click={upsert}>
        {#if saving}saving{:else}save{/if}
    </button>
</div>