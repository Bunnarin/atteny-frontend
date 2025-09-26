import { goto, invalidateAll } from '$app/navigation';
import { PUBLIC_PB_URL } from '$env/static/public';
import Pocketbase from 'pocketbase';
import { get, writable } from 'svelte/store';

export const pb = new Pocketbase(PUBLIC_PB_URL);
export const pbUser = writable(pb.authStore.record);

pb.authStore.onChange(() => pbUser.set(pb.authStore.record), true);

export async function login(get_token = false) {
	// do this to prevent safari from blocking this popup
	const newWindow = window.open("");
	await pb.collection('users').authWithOAuth2({
		provider: 'google',
		urlCallback: (url) => newWindow.location = url,
		scopes: get_token ? [
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/drive.file",
		] : [],
		params: get_token ? {
			prompt: "consent",
			access_type: "offline",
			login_hint: get(pbUser)?.email,
		} : {},
	})
}

export async function logout() {
	pb.authStore.clear();
	await invalidateAll();
	goto('/');
}
