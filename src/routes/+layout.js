import { pb } from '$lib/pocketbase';

export const ssr = false;
export const prerender = true;

// one time auth refresh when initial load
export async function load() {
	if (pb.authStore.isValid) 
		await pb.collection('users').authRefresh()
			.catch(() => pb.authStore.clear());
}
