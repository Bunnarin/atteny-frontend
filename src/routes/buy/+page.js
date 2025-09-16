import { get } from 'svelte/store';
import { pb, pbUser } from '$lib/pocketbase';

export const load = async () => {
    let total_employees = 0;
    const {unit_price} = await pb.send('/unit_price');

    await pb.collection('total_employees').getOne(get(pbUser).id)
    .then(({value}) => total_employees = value)
    .catch(() => {});
    
    return {
        unit_price,
        total_employees,
        max_employees: get(pbUser).free_spots + total_employees
    }
}