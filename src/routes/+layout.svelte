

<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { pbUser, login, logout } from '$lib/pocketbase';
	import { onMount } from 'svelte';

	let deferredPrompt;
    let installAvailable = false;
    
    onMount(() => {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installAvailable = true;
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', () => installAvailable = false);
    });

    async function installPWA() {
        deferredPrompt.prompt();
        deferredPrompt = null;
        installAvailable = false;
    }
</script>

<div class="header">
	<a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
	
	{#if $pbUser}
		<div class="user">
			{#if installAvailable}
				<button class="btn-primary" on:click={installPWA}>Install</button>
			{/if}
			<button class="btn-primary" on:click={() => goto('/buy')}>Buy</button>
			<button class="btn-secondary" on:click={logout}>Logout</button>
		</div>
	{:else}
		<button class="btn-primary"
			on:click={async e => {
				e.target.disabled = true;
				e.target.textContent = 'Logging in...';
				await login(false)
					.catch(() => alert("This device can only hold one account. This is to prevent cheating."));
				window.location.reload();
				}}>
			login
		</button>
	{/if}
</div>

<div style="padding: 20px;"><slot /></div>

