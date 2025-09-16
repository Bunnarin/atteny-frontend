import { writable } from 'svelte/store';
import { pb } from "$lib/pocketbase";

function createRequestStore() {
    const { subscribe, set } = writable([]);
    let initialized = false;
    let initPromise = null;
    
    async function refresh() {
        const requests = await pb.collection('request').getFullList({
            expand: 'createdBy'
        });
        set(requests);
        initialized = true;
        return requests;
    }

    // Initialize on first access
    function ensureInitialized() {
        if (!initPromise) {
            initPromise = refresh();
        }
        return initPromise;
    }

    // Start initialization
    ensureInitialized();

    return {
        subscribe,
        refresh,
        initialized: () => initialized,
        ensureInitialized
    };
}

export const requestStore = createRequestStore();