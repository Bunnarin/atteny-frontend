import { get } from 'svelte/store';
import { pb, pbUser } from '$lib/pocketbase';

export const load = async ({ params }) => {
    const {value} = await pb.collection('total_employees').getOne(get(pbUser).id);
    return {
        total_employees: value,
        max_employees: get(pbUser).free_spots + value
    }
}