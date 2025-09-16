import { pb } from '$lib/pocketbase';

export async function load() {
	if (pb.authStore.isValid) 
		await pb.collection('users').authRefresh()
			.catch(() => pb.authStore.clear());
}

export const ssr = false;
export const prerender = true;
