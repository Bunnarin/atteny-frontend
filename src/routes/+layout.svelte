<script>
	import { goto } from '$app/navigation';
	import { pbUser, logout } from '$lib/pocketbase';
</script>

<main class="form-container">
	<div class="header">
		<a href="/"><img class="logo" src="/favicon.png" alt="Logo"/></a>
		{#if $pbUser}
			<div class="user">
				<button class="btn-primary" on:click={() => goto('/payway')}>Buy</button>
				<button class="btn-secondary" on:click={() => logout()}>Logout</button>
			</div>
		{:else}
		<button class="btn-primary" on:click={() => goto('/login')}>Login</button>
		{/if}
	</div>
	<slot />
</main>
