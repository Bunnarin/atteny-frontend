<script>
    import "../app.css";
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { pb, pbUser, login, logout } from '$lib/pocketbase';
    
    let pwaInstallPrompt = null;
    let showInstallButton = false;
    
    // Reactive values from pbUser store
    $: has_card = $pbUser?.payway_token;
    $: total_employees = 0;
    $: max_employees = $pbUser?.max_employees || 0;
    
    if (pb.authStore.isValid) 
        pb.collection('total_employees').getOne($pbUser.id)
            .then(({value}) => total_employees = value)
            .catch(() => {});

    onMount(() => {
        // Handle PWA installation prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            pwaInstallPrompt = e;
            showInstallButton = true;
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        // Cleanup
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    });
</script>

<div class="header">
    <a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
    
    {#if $pbUser}
        <div class="user">
            {#if showInstallButton}
                <button class="btn-primary" on:click={() => pwaInstallPrompt?.prompt()}>
                    Install App
                </button>
            {/if}
            
            <button 
                class={total_employees >= max_employees ? 'btn-primary' : 'btn-secondary'} 
                on:click={() => goto('/buy')}>
                {#if total_employees < max_employees}
                    Free Tier: {total_employees}/{max_employees}
                {:else if !has_card}
                    Link Card
                {:else}
                    Subscribed: {total_employees}/{max_employees}
                {/if}
            </button>
            
            <button class="btn-secondary" on:click={logout}>
                Logout
            </button>
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
