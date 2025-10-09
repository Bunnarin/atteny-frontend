import { get } from 'svelte/store';
import { pb } from '$lib/stores/pocketbase';
import { totalEmployeeStore } from '$lib/stores/total_employees.js';

export const load = async () => {
    await pb.collection('users').authRefresh().catch(() => {});

    const { license_price, live_mode_price } = await pb.send('/pricings').catch();
    
    // Payment methods data
    const paymentMethods = [
        {
            id: 'abapay_khqr', 
            name: 'ABA KHQR',
            description: 'Scan to pay with any banking app',
        },
        // {
        //     id: 'cards',
        //     name: 'Credit/Debit Card',
        //     description: '',
        // },
        // {
        //     id: 'alipay',
        //     name: 'Alipay',
        //     description: 'Scan to pay with Alipay',
        // },
        // {
        //     id: 'wechat',
        //     name: 'WeChat',
        //     description: 'Scan to pay with WeChat',
        // }
    ];

    return {
        total_employees: get(totalEmployeeStore),
        license_price,
        live_mode_price,
        paymentMethods,
        cards: ['visa', 'mastercard', 'unionpay', 'jcb'],
    }
}