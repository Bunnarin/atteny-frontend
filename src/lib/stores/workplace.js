import { writable } from 'svelte/store';
import { pb } from "$lib/stores/pocketbase";

function createWorkplaceStore() {
    const { subscribe, set } = writable([]);
    let initialized = false;
    let initPromise = null;
    
    async function refresh() {
        const workplaces = await pb.collection('workplace').getFullList({
            expand: 'employees'
        });
        set(workplaces);
        initialized = true;
        return workplaces;
    }

    // Initialize on first access
    function ensureInitialized() {
        if (!initPromise) {
            initPromise = refresh();
        }
        return initPromise;
    }

    return {
        subscribe,
        refresh,
        initialized: () => initialized,
        ensureInitialized
    };
}

export const workplaceStore = createWorkplaceStore();