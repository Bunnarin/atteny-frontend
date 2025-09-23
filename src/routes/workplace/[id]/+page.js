import { workplaceStore } from '$lib/stores/workplace';
import { pb, pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    let total_employees = 0;
    await pb.collection('total_employees').getOne(get(pbUser)?.id)
        .then(({value}) => total_employees = value)
        .catch(() => {});
    const workplaces = get(workplaceStore);
    let workplace = null;
    if (params.id != "new") 
        [workplace] = workplaces.filter(w => w.id == params.id);
    
    return {
        workplace,
        free_spots: get(pbUser).max_employees - total_employees + (workplace?.employees?.length || 0),
    }
}