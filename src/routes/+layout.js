import { pb } from '$lib/stores/pocketbase';
import { totalEmployeeStore } from '$lib/stores/total_employees';

export const ssr = false;
export const prerender = true;

// one time auth refresh when initial load
export async function load() {
	await totalEmployeeStore.ensureInitialized();

	if (pb.authStore.isValid) 
		await pb.collection('users').authRefresh()
			.catch(() => pb.authStore.clear());
}
