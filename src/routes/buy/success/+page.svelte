<script>
    import { pb } from '$lib/pocketbase';
    import { goto } from '$app/navigation';
    // refresh so that they see their updated free_spots
    pb.collection('users').authRefresh()
    .catch(() => pb.authStore.clear());
    goto('/');
</script>

