import { writable } from 'svelte/store';
import { pb } from "$lib/pocketbase";

function createRequestStore() {
    const { subscribe, set } = writable([]);
    let initialized = false;
    
    async function refresh() {
        const requests = await pb.collection('request').getFullList({
            expand: 'createdBy'
        });
        set(requests);
        initialized = true;
        return requests;
    }

    return {
        subscribe,
        refresh,
        initialized: () => initialized
    };
}

export const requestStore = createRequestStore();