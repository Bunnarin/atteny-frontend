import { workplaceStore } from '$lib/stores/workplace';
import { pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    // calling the api all the time if I call refresh
    const workplaces = get(workplaceStore);
    let workplace = null;
    if (params.id != "new") 
        [workplace] = workplaces.filter(w => w.id == params.id);
    
    return {
        workplace,
        free_spots: get(pbUser).free_spots + (workplace?.employees?.length || 0),
    }
}