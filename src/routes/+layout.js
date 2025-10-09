import { pb, pbUser } from '$lib/stores/pocketbase';
import { totalEmployeeStore } from '$lib/stores/total_employees';
import { get } from 'svelte/store';

export const ssr = false;
export const prerender = true;

// one time auth refresh when initial load
export async function load() {
	await totalEmployeeStore.ensureInitialized();

	if (pb.authStore.isValid) {
		await pb.collection('users').authRefresh()
			.catch(() => pb.authStore.clear());
	}
	
	return { 
		cards: ['visa', 'mastercard', 'unionpay', 'jcb'],
		paymentMethods: [
			{
				id: 'aba-khqr',
				// id: 'cards',
				name: 'ABA KHQR',
				description: 'Scan to pay with any banking app',
			},
			// {
			// 	id: 'cards',
			// 	name: 'Credit/Debit Card',
			// 	description: '',
			// }
		]
	};
}
