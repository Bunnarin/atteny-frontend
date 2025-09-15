import { PUBLIC_PB_URL } from '$env/static/public';
import Pocketbase from 'pocketbase';
import { writable } from 'svelte/store';
import { redirect } from '@sveltejs/kit';

export const pb = new Pocketbase(PUBLIC_PB_URL);
export const pbUser = writable(pb.authStore.record);

pb.authStore.onChange(() => {
	pbUser.set(pb.authStore.record);
}, true);
