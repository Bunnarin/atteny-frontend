<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pb, pbUser, login, logout } from '$lib/pocketbase';
    import '@khmyznikov/pwa-install';
    import { onMount } from "svelte";

    // Reactive values from pbUser store
    $: live_mode = $pbUser?.live_mode;
    $: has_card = $pbUser?.payway_token;
    $: max_employees = $pbUser?.max_employees || 0;
    $: total_employees = 0;
    
    if (pb.authStore.isValid) 
        pb.collection('total_employees').getOne($pbUser.id)
            .then(data => total_employees = data.total_employees)
    
    let pwaInstallComponent;
    let isMobile = false;

    // Check if mobile on mount and on window resize
    onMount(() => isMobile = window.innerWidth <= 768 );
</script>

<div class="header">
    <a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
    {#if $pbUser}
        <div class="user">
            {#if isMobile}
                <pwa-install name="atteny" icon="/favicon.png" manifest-url="/manifest.json" bind:this={pwaInstallComponent}></pwa-install>
                <button class="btn-secondary" on:click={() => pwaInstallComponent.showDialog(true)}>install</button>
            {/if}
            
            {#if $pbUser.refresh_token}
            <button 
                class={live_mode ? 'btn-primary' : 'btn-secondary'} 
                on:click={() => goto('/buy')}>
                live
            </button>
            
            <button 
                class={total_employees >= max_employees ? 'btn-primary' : 'btn-secondary'} 
                on:click={() => goto('/buy')}>
                {#if !has_card}
                    Link Card
                {:else}
                    {total_employees}/{max_employees}
                {/if}
            </button>
            {/if}
            <button class="btn-secondary" on:click={logout}>➜]</button>
        </div>
    {:else}
        <button 
            class="btn-primary"
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

<div style="padding: 20px;">
    <slot />
</div>
