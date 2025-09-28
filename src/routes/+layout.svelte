<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pbUser, login, logout } from '$lib/stores/pocketbase';
    import '@khmyznikov/pwa-install';
    import { totalEmployeeStore } from '$lib/stores/total_employees';
    
    let installPrompt;
</script>

<div class="header">
    <a href="/"><img class="logo" src="/logo192.png" alt="Logo"/></a>
    <pwa-install bind:this={installPrompt} manifest-url="/manifest.json"></pwa-install>  
    <button on:click={installPrompt.install()}>Install</button>

    {#if $pbUser}
        <div class="user">  
            {#if $pbUser.refresh_token}
                <button 
                    class={$pbUser?.live_mode ? 'btn-primary' : 'btn-secondary'} 
                    on:click={() => goto('/buy')}>
                    live
                </button>
                
                <button class={$totalEmployeeStore >= $pbUser?.max_employees ? 'btn-primary' : 'btn-secondary'} 
                    on:click={() => goto('/buy')}>
                    {$totalEmployeeStore}/{$pbUser?.max_employees}
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
