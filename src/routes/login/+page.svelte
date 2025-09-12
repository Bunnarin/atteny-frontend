<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import { pbUser } from '$lib/pocketbase';

	let username;
	let password;
	let message = $page.url.searchParams.get('message');

	async function handleLogin() {
		try {
			await pb.collection('users').authWithPassword(username, password);
			username = '';
			password = '';
			goto('/app?message="logged in successfully"');
		} catch (error) {
			message = error.message;
		}
	}
</script>

{#if $pbUser}
	<h2>You are already logged in</h2>
{:else}
	<form on:submit|preventDefault={handleLogin}>
		<h2>Login to Pocketbase</h2>
		<label for="username"
			>Username or Email
			<input
				autocomplete="on"
				bind:value={username}
				id="username"
				name="username"
				type="text"
			/></label
		>
		<label for="password"
			>Password
			<input
				autocomplete="on"
				bind:value={password}
				id="password"
				name="password"
				type="password"
			/></label
		>
		<button type="submit">Login</button>

		{#if message}
			<div id="error">
				<span>{message}</span>
			</div>
		{/if}
	</form>
{/if}
