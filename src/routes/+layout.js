import { pb, pbUser } from '$lib/stores/pocketbase';
import { totalEmployeeStore } from '$lib/stores/total_employees';
import { get } from 'svelte/store';

export const ssr = false;
export const prerender = true;

// one time auth refresh when initial load
export async function load() {
	await totalEmployeeStore.ensureInitialized();

	let has_card;
	if (pb.authStore.isValid) {
		await pb.collection('users').authRefresh()
			.catch(() => pb.authStore.clear());
		has_card = get(pbUser).payway_token;
	}
	
	return { has_card};
}
