import { get } from 'svelte/store';
import { pb, pbUser } from '$lib/pocketbase';

export const load = async () => {
    let total_employees = 0;

    await pb.collection('total_employees').getOne(get(pbUser).id)
    .then(({value}) => total_employees = value)
    .catch(() => {});
    
    return {
        total_employees,
        max_employees: get(pbUser).free_spots + total_employees
    }
}