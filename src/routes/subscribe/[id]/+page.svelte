<script>
    import { goto } from '$app/navigation';
    import { pb } from '$lib/pocketbase';
    import { page } from '$app/stores';

    if (!pb.authStore.isValid)
        pb.collection('users').authWithOAuth2({provider: 'google'})
            .then(() => goto(`/subscribe/${$page.params.id}`))
            .catch(error => goto('/?message=' + encodeURIComponent(error.message)));

    pb.send(`/subscribe/${$page.params.id}`, {method: 'POST'})
        .then(() => goto('/'))
        .catch(error => goto('/?message=' + encodeURIComponent(error.message)));    
</script>