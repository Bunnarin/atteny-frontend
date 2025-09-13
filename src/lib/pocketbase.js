import { PUBLIC_PB_URL } from '$env/static/public';
import Pocketbase from 'pocketbase';
import { writable } from 'svelte/store';

export const pb = new Pocketbase(PUBLIC_PB_URL);
export const pbUser = writable(pb.authStore.model);

pb.authStore.onChange(() => {
	pbUser.set(pb.authStore.model);
}, true);
