<script>
    import { goto } from '$app/navigation';
    import { pb, pbUser, login } from '$lib/pocketbase';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { workplaceStore } from '$lib/stores/workplace';

    if (!get(pbUser))
        login(false)
            .then(() => goto(`/subscribe/${$page.params.id}`))
            .catch(error => goto('/?message=' + encodeURIComponent(error.message)));

    pb.send(`/subscribe/${$page.params.id}`, {method: 'POST'})
        .then(() => workplaceStore.refresh().then(() => goto('/')))
        .catch(error => goto('/?message=' + encodeURIComponent(error.message)));    
</script>