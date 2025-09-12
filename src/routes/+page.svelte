<script lang="ts">
    import { goto } from '$app/navigation';
    import { pbUser } from '$lib/pocketbase';
</script>

{#if $pbUser}
<div class="form-actions">
    <button class="btn-primary" on:click={() => goto('/workplace/new')}>Add Workplace</button>
</div>
{/if}