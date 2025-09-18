import { goto } from '$app/navigation';
import { PUBLIC_PB_URL } from '$env/static/public';
import Pocketbase from 'pocketbase';
import { get, writable } from 'svelte/store';

export const pb = new Pocketbase(PUBLIC_PB_URL);
export const pbUser = writable(pb.authStore.record);

pb.authStore.onChange(() => {
	pbUser.set(pb.authStore.record);
}, true);

export async function login(get_token = false) {
	const newWindow = window.open("");
	const {record, meta} = await pb.collection('users').authWithOAuth2({
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
	.catch(() => {alert("This device can only hold one account. This is to prevent cheating."); goto('/');});
	if (get_token) 
		pb.collection('users').update(record.id, {
			google_refresh_token: meta?.refreshToken,
		});
}
