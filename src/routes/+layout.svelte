<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pb, pbUser, login, logout } from '$lib/stores/pocketbase';
    import { totalEmployeeStore } from '$lib/stores/total_employees';
    import { PUBLIC_FORM_URL } from '$env/static/public';
    export let data;
    let live_mode_modal = false;
    let live_mode_price;
</script>

<div class="header">
    <a href="/"><img class="logo" src="/logo192.png" alt="Logo"/></a>

    {#if $pbUser}
        <div class="user">  
            {#if window.deferredInstallPrompt}
                <button class="btn-secondary" onclick="window.deferredInstallPrompt.prompt()">Add to homescreen</button>
            {/if}
            <a href={PUBLIC_FORM_URL} target="_blank"><button class="btn-secondary">✍️</button></a>
            {#if $pbUser.refresh_token}
                <button on:click={async () => {
                    if (live_mode_price) 
                        return live_mode_modal = true;
                    await pb.send('/pricings')
                        .then(res => live_mode_price = res.live_mode_price)
                        .then(() => live_mode_modal = true)
                        .catch();
                }} 
                    class={$pbUser?.live_mode ? 'btn-primary' : 'btn-secondary'}>
                    live mode
                </button>
                <button class="btn-secondary" on:click={() => goto('/buy')}>
                    {$totalEmployeeStore}/{$pbUser?.max_employees}
                </button>
            {/if}
            <button class="btn-secondary" on:click={logout}>➜]</button>
        </div>
    {:else}
        <button class="btn-primary"
            on:click={async e => {
                e.target.disabled = true;
                e.target.textContent = 'Logging in...';
                await login(false)
                    .then(() => window.location.reload())
                    .catch(() => alert("This device can only hold one account. This is to prevent cheating."));
            }}>
            Login
        </button>
    {/if}
</div>
{#if live_mode_modal}
<div class="modal-overlay">
    <div class="modal-content">
        <div class="form-title">Live Mode: ${live_mode_price}/month</div>
            <p>Live mode allows you to see real-time clock-ins and clock-outs.</p>
            <br>
            {#if data.has_card}
                <button class={data.live_mode ? 'btn-secondary' : 'btn-primary'} 
                    on:click={async (e) => {
                        await pb.send(`/toggle-live-mode`, {method: 'POST'})
                            .then(() => {e.target.textContent = 'saved'; e.target.disabled = true;})
                            .catch(error => alert(error))
                    }}>
                    {data.live_mode ? 'Disable' : 'Enable'}
                </button>
            {:else}
                <div class="flex flex-wrap gap-4">
                    <button class="w-full flex-1 btn-primary"
                        
                    >
                        Link Card
                    </button>

                    <button class="w-full flex-1 btn-primary" 
                        
                    >
                        Link ABA
                    </button>
                    <button class="btn-secondary" on:click={() => live_mode_modal=false}>cancel</button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<div style="padding: 20px;">
    <slot />
</div>
