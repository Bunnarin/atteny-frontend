import { get } from 'svelte/store';
import { pb, pbUser } from '$lib/stores/pocketbase';
import { totalEmployeeStore } from '$lib/stores/total_employees.js';

export const load = async () => {
    await pb.collection('users').authRefresh();

    const { license_price, rent_price, live_mode_price } = await pb.send('/pricings');
    
    return {
        total_employees: get(totalEmployeeStore),
        max_employees: get(pbUser).max_employees,
        has_card: get(pbUser).payway_token,
        license_price,
        rent_price,
        live_mode_price,
        live_mode: get(pbUser).live_mode
    }
}