import { pb } from '$lib/pocketbase';

export async function load() {
	try {
		await pb.collection('users').authRefresh();
	} catch (error) {
		pb.authStore.clear();
	}
}

export const ssr = false;
export const prerender = true;
