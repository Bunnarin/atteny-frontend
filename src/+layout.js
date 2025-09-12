import { pb } from '$lib/pocketbase';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	// if authstore invalid and path is not /login
	if (!pb.authStore.isValid && url.pathname !== '/login') {
		redirect(302, `/login?message=${url.pathname} requires authentation`);
	}

	try {
		await pb.collection('users').authRefresh();
	} catch (error) {
		pb.authStore.clear();
		redirect(302, '/login?message=error logging in');
	}
}

export const ssr = false;
