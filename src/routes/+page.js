import { workplaceStore } from '$lib/stores/workplace';
import { requestStore } from '$lib/stores/request';
import { pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export async function load() {
    if (!get(pbUser)) return {
        workplaces_as_employer: [],
        workplaces_as_employee: [],
        requests: []
    };

    // Wait for both stores to initialize
    await Promise.all([
        workplaceStore.ensureInitialized(),
        requestStore.ensureInitialized()
    ]);
    
    const workplaces = get(workplaceStore);
    const requests = get(requestStore);
    const user = get(pbUser);
    
    return {
        workplaces_as_employer: workplaces.filter(w => w.employer === user.id),
        workplaces_as_employee: workplaces.filter(w => w.employees?.includes(user.id)),
        requests
    };
}
