import { writable, get } from 'svelte/store';
import { pb, pbUser } from "$lib/stores/pocketbase";

function createTotalEmployeesStore() {
    const { subscribe, set } = writable(0);
    let initialized = false;
    let initPromise = null;
    
    async function refresh() {
        if (!get(pbUser))
            return;
        const { total_employees } = await pb.collection('total_employees').getOne(get(pbUser).id);
        set(total_employees);
        initialized = true;
        return total_employees;
    }

    // Initialize on first access
    function ensureInitialized() {
        if (!initPromise) 
            initPromise = refresh();
        return initPromise;
    }

    return {
        subscribe,
        refresh,
        initialized: () => initialized,
        ensureInitialized
    };
}

export const totalEmployeeStore = createTotalEmployeesStore();