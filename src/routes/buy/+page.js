import { get } from 'svelte/store';
import { pb, pbUser } from '$lib/pocketbase';

export const load = async () => {
    await pb.collection('users').authRefresh();

    const { total_employees } = await pb.collection('total_employees').getOne(get(pbUser).id)

    const { license_price, rent_price, live_mode_price } = await pb.send('/pricings');
    
    return {
        total_employees,
        max_employees: get(pbUser).max_employees,
        has_card: get(pbUser).payway_token,
        license_price,
        rent_price,
        live_mode_price,
        live_mode: get(pbUser).live_mode
    }
}