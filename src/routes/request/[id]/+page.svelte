<script>
    import { pb } from '$lib/pocketbase';
    import { requestStore } from '$lib/stores/request.js';
    export let data;
    let requests = data.requests;

    function approve(id) {
        // confirm first
        if (!confirm('approve?')) return;
        requests = requests.filter(request => request.id !== id);
        pb.send(`/approve/${id}`, { method: 'POST' })
            .then(() => requestStore.refresh())
            .catch(error => alert(error.message));
    }
    function reject(id) {
        // confirm first
        if (!confirm('reject?')) return;
        requests = requests.filter(request => request.id !== id);
        pb.send(`/reject/${id}`, { method: 'POST' })
            .then(() => requestStore.refresh())
            .catch(error => alert(error.message));
    }
</script>

<h1 class="form-title">Pending Requests</h1>

{#each requests as request}
    <div class="form-question">
        Name: <strong>{request.expand?.createdBy?.name}</strong>
        Because: <strong>{request.reason}</strong><br>
        On: <strong>{new Date(request.date).toLocaleDateString().slice(0, 5)}</strong>
        For: <strong>{request.duration} days</strong><br>
        <button class="btn-primary" on:click={() => approve(request.id)}>Approve</button>
        <button class="btn-secondary" on:click={() => reject(request.id)}>Reject</button>
    </div>
{/each}
