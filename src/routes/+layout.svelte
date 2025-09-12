

<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { pb, pbUser } from '$lib/pocketbase';
	import { invalidateAll } from '$app/navigation';
	
	async function logout() {
		pb.authStore.clear();
		await invalidateAll();
		goto('/?message="logged out"');
	}

	async function login() {
		const authMethods = await pb.collection('users').listAuthMethods();
		const [provider] = authMethods.oauth2.providers;
		await pb.collection('users').authWithOAuth2({
			provider: provider.name,
			redirectURL: window.location.href,
			codeVerifier: provider.codeVerifier
		});
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
