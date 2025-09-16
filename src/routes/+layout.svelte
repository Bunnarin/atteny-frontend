

<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, pbUser, login } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	
	async function logout() {
		pb.authStore.clear();
		await invalidateAll();
		goto('/');
	}
</script>

<div class="header">
	<img class="logo" src="/favicon.png" alt="Logo" on:click={() => goto('/')} />
	{#if $pbUser}
		<div class="user">
			<button class="btn-primary" on:click={() => goto('/buy')}>Buy</button>
			<button class="btn-secondary" on:click={logout}>Logout</button>
		</div>
	{:else}
		<button class="btn-primary" on:click={() => login(false)}>Login</button>
	{/if}
</div>
<!-- give it some padding -->
<div style="padding: 20px;"><slot /></div>

