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
        <div class="form-title flex justify-between">
            Updates your sheet in real-time.
            <button class="btn-secondary" on:click={() => live_mode_modal=false}>X</button>
        </div>
        {#if $pbUser?.paid_live_mode}
            <button class={$pbUser.live_mode ? 'btn-primary' : 'btn-secondary'} 
                on:click={async e => await pb.send('/toggle-live-mode', {method:'POST'})}>
                {!$pbUser.live_mode ? 'Enable' : 'Disable'}
            </button>
        {:else}
            <p class="text-xl font-bold">${live_mode_price}</p>
            <h3 class="text-lg">Choose Payment Method</h3>
            {#each data.paymentMethods as method}
                <button class="flex gap-4 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded items-center justify-between"
                    on:click={() => {}}>
                    <img src="/payway/{method.id}.png" class="w-12 h-12 flex items-center justify-center text-2xl" alt={method.name}>
                    <div class="flex-1 text-left">
                        <p class="font-bold text-gray-900 mb-1">{method.name}</p>
                        <p class="text-sm text-gray-500">{method.description}</p>
                        {#if method.id === 'cards'}
                            <div class="flex gap-2 mt-2">
                                {#each data.cards as card}
                                    <img src="/payway/{card}.png" alt={card} class="w-8 h-5 flex">
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <img src="/payway/arrow.png" alt="next" class="w-5 h-5 ml-4">
                </button>
            {/each}
        {/if}
    </div>
</div>
{/if}

<div style="padding: 20px;">
    <slot />
</div>
