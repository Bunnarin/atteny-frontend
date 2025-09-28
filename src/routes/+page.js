import { workplaceStore } from '$lib/stores/workplace';
import { pbUser } from '$lib/stores/pocketbase';
import { get } from 'svelte/store';

export async function load() {
    await workplaceStore.ensureInitialized();
    
    const workplaces = get(workplaceStore);
    
    return {
        workplaces_as_employer: workplaces.filter(w => w.employer === get(pbUser)?.id),
        workplaces_as_employee: workplaces.filter(w => w.employees?.includes(get(pbUser)?.id)),
    };
}
