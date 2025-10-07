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
				name: 'ABA KHQR',
				description: 'Link your ABA account',
			},
			// {
			// 	id: 'cards',
			// 	name: 'Credit/Debit Card',
			// 	description: '',
			// }
		]
	};
}
