import { writable } from 'svelte/store';
import { pb } from "$lib/pocketbase";

function createWorkplaceStore() {
    const { subscribe, set } = writable([]);
    let initialized = false;
    
    async function refresh() {
        const workplaces = await pb.collection('workplace').getFullList({
            expand: 'employees'
        });
        set(workplaces);
        initialized = true;
        return workplaces;
    }

    // Initial load
    refresh();

    return {
        subscribe,
        refresh,
        initialized: () => initialized
    };
}

export const workplaceStore = createWorkplaceStore();