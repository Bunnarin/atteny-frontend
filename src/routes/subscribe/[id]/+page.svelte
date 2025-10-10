<script>
    import { goto } from '$app/navigation';
    import { pb, pbUser, login } from '$lib/stores/pocketbase';
    import { page } from '$app/stores';
    import { workplaceStore } from '$lib/stores/workplace';
    import { onMount } from 'svelte';

    onMount(async () => {
        if (!$pbUser.id)
            await login(false)
                .then(() => goto(`/subscribe/${$page.params.id}`))
                .catch(error => {alert(error.message); goto('/');});

        pb.send(`/subscribe/${$page.params.id}`, {method: 'POST'})
            .then(() => workplaceStore.refresh())
            .then(() => goto('/'))
            .catch(() => {alert('This workplace ran out of employees spot. Please contact your employer to upgrade his plan'); goto('/');});  
    });  
</script>