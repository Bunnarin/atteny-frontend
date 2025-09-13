import { workplaces } from '$lib/stores/workplace';
import { pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    const workplacesData = get(workplaces);
    let workplace = null;
    if (params.id != "new") {
        [workplace] = workplacesData.filter(w => w.id == params.id);
    }
    return {
        workplace,
        free_spots: get(pbUser).free_spots + (workplace?.employees?.length || 0),
    }
}