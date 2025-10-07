import { workplaceStore } from '$lib/stores/workplace';
import { totalEmployeeStore } from '$lib/stores/total_employees.js';
import { pb, pbUser } from '$lib/stores/pocketbase';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    const workplaces = get(workplaceStore);
    let workplace = null;
    if (params.id != "new") 
        [workplace] = workplaces.filter(w => w.id == params.id);
    
    return {
        workplace,
        free_spots: get(pbUser).max_employees - get(totalEmployeeStore) + (workplace?.employees?.length || 0),
    }
}