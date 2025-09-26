import { workplaceStore } from '$lib/stores/workplace';
import { pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export async function load() {
    if (!get(pbUser)) return {
        workplaces_as_employer: [],
        workplaces_as_employee: [],
    };

    // Wait for both stores to initialize
    await workplaceStore.ensureInitialized();
    
    const workplaces = get(workplaceStore);
    const user = get(pbUser);
    
    return {
        workplaces_as_employer: workplaces.filter(w => w.employer === user.id),
        workplaces_as_employee: workplaces.filter(w => w.employees?.includes(user.id)),
    };
}
