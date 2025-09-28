<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pbUser, login, logout } from '$lib/stores/pocketbase';
    import { totalEmployeeStore } from '$lib/stores/total_employees';
</script>

<div class="header">
    <a href="/"><img class="logo" src="/logo192.png" alt="Logo"/></a>

    {#if $pbUser}
        <div class="user">  
            {#if window.deferredInstallPrompt}
                <button class="btn-secondary" onclick="window.deferredInstallPrompt.prompt()">Install</button>
            {/if}
            {#if $pbUser.refresh_token}
                <button 
                    class={$pbUser?.live_mode ? 'btn-primary' : 'btn-secondary'} 
                    on:click={() => goto('/buy')}>
                    live mode
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
