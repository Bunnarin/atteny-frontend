<script>
    import { pb } from '$lib/pocketbase';
    import { goto } from '$app/navigation';
    import { requestStore } from '$lib/stores/request.js';
    export let data;
    let handledRequests = [];

    function approve(id) {
        // confirm first
        if (!confirm('approve?')) return;
        pb.send(`/approve/${id}`, { method: 'POST' })
            .then(() => {handledRequests = [...handledRequests, id]; requestStore.refresh();})
            .catch(error => goto('/?message=' + encodeURIComponent(error.message)));
    }
    function reject(id) {
        // confirm first
        if (!confirm('reject?')) return;
        pb.send(`/reject/${id}`, { method: 'POST' })
            .then(() => {handledRequests = [...handledRequests, id]; requestStore.refresh();})
            .catch(error => goto('/?message=' + encodeURIComponent(error.message)));
    }
</script>

<h1>Pending Requests</h1>

{#each data.requests as request}
    {#if !handledRequests.includes(request.id)}
    <div class="form-section">
        <strong>Date:</strong> {new Date(request.date).toLocaleDateString()}<br>
        <strong>Reason:</strong> {request.reason}<br>
        <strong>Created by:</strong> {request.expand?.createdBy?.name}<br>
        <button class="btn-primary" on:click={approve(request.id)}>Approve</button>
        <button class="btn-primary" on:click={reject(request.id)}>Reject</button>
    </div>
    {/if}
{/each}
