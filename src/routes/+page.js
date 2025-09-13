import { workplaces } from '$lib/stores/workplace';
import { pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export async function load() {
    // First, ensure we have the latest data
    await workplaces.refresh();
    const workplacesData = get(workplaces);
    const user = get(pbUser);
    return {
        workplaces_as_employer: workplacesData.filter(w => w.employer === user.id) || [],
        workplaces_as_employee: workplacesData.filter(w => w.employees?.includes(user.id)) || []
    };
}
