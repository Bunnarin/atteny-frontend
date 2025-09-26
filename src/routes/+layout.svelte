<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pbUser, login, logout } from '$lib/stores/pocketbase';
    import { onMount } from 'svelte';
    import { totalEmployeeStore } from '$lib/stores/total_employees';
    // Reactive values from pbUser store
    let live_mode = $pbUser?.live_mode;
    let max_employees = $pbUser?.max_employees || 0;
    
    let installPrompt = null;
    onMount(() => {
        window.addEventListener('beforeinstallprompt', e => installPrompt = e);
    });
</script>

<div class="header">
    <a href="/"><img class="logo" src="/logo192.png" alt="Logo"/></a>
    {#if $pbUser}
        <div class="user">    
            {#if installPrompt}
                <button on:click={() => installPrompt.prompt()}>install</button>      
            {/if}  
            {#if $pbUser.refresh_token}
                <button 
                    class={live_mode ? 'btn-primary' : 'btn-secondary'} 
                    on:click={() => goto('/buy')}>
                    live
                </button>
                
                <button class={$totalEmployeeStore >= max_employees ? 'btn-primary' : 'btn-secondary'} 
                    on:click={() => goto('/buy')}>
                    {$totalEmployeeStore}/{max_employees}
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
