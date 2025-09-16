

<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { pb, pbUser, login } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	let loggin_in = false;	
	async function logout() {
		pb.authStore.clear();
		await invalidateAll();
		goto('/');
	}
</script>

<div class="header">
	<a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
	
	{#if $pbUser}
		<div class="user">
			<button class="btn-primary" on:click={() => goto('/buy')}>Buy</button>
			<button class="btn-secondary" on:click={logout}>Logout</button>
		</div>
	{:else}
		<button class="btn-primary" disabled={loggin_in}
			on:click={async () => {
				loggin_in=true;
				login(false).then(() => loggin_in=false);
				}}>
			{#if loggin_in}Logging in...{:else}Login{/if}
		</button>
	{/if}
</div>

<div style="padding: 20px;"><slot /></div>

