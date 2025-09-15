

<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { pb, pbUser } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
	
	async function logout() {
		pb.authStore.clear();
		await invalidateAll();
		goto('/');
	}

	async function login() {
		const {record, meta} = await pb.collection('users').authWithOAuth2({
			provider: 'google',
			scopes: [
				"https://www.googleapis.com/auth/userinfo.profile",
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/drive.file",
			],
			params: {
				prompt: "consent",
				access_type: "offline",
			},
		});
		if (!record.google_refresh_token)
			await pb.collection('users').update(record.id, {
				google_refresh_token: meta?.refreshToken,
			});
		window.location.reload();
	}
</script>

<div class="header">
	<a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
	{#if $pbUser}
		<div class="user">
			<button class="btn-primary" on:click={() => goto('/payway')}>Buy</button>
			<button class="btn-secondary" on:click={logout}>Logout</button>
		</div>
	{:else}
		<button class="btn-primary" on:click={login}>Login</button>
	{/if}
</div>
<slot />
