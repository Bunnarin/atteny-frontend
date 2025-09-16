import { requestStore } from '$lib/stores/request';
import { get } from 'svelte/store';

export const prerender = false;
export const ssr = false;

export const load = async ({ params }) => {
    await requestStore.ensureInitialized();
    const requests = get(requestStore);
    return {
        requests: requests.filter(r => r.workplace === params.id),
    }
}