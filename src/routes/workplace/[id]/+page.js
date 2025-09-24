import { workplaceStore } from '$lib/stores/workplace';
import { pb, pbUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    const { rent_price } = await pb.send('/pricings');
    let total_employees = 0;
    await pb.collection('total_employees').getOne(get(pbUser)?.id)
        .then(({value}) => total_employees = value)
        .catch(() => {});
    const workplaces = get(workplaceStore);
    let workplace = null;
    if (params.id != "new") 
        [workplace] = workplaces.filter(w => w.id == params.id);
    
    return {
        rent_price,
        has_card: get(pbUser)?.payway_token,
        workplace,
        free_spots: get(pbUser).max_employees - total_employees + (workplace?.employees?.length || 0),
    }
}