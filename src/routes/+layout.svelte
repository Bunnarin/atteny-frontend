

<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, pbUser } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	
	async function logout() {
		pb.authStore.clear();
		await invalidateAll();
		goto('/');
	}

	async function login() {
		// doing this then calling window.open directly to avoid being blocked by safari
		const newWindow = window.open("");
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
			urlCallback: (url) => newWindow.location = url,
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
			<button class="btn-primary" on:click={() => goto('/buy')}>Buy</button>
			<button class="btn-secondary" on:click={logout}>Logout</button>
		</div>
	{:else}
		<button class="btn-primary" on:click={login}>Login</button>
	{/if}
</div>
<slot />
