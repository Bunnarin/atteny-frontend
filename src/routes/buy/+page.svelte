<script>
    import { pb, pbUser } from '$lib/stores/pocketbase.js';
    import { PUBLIC_PAYWAY_ENDPOINT, PUBLIC_PB_ENDPOINT } from '$env/static/public';
    
    export let data;
    let quantity;

    async function purchase_payway(method) {
        if (!Number.isInteger(quantity))
            return alert('amount must be integer');

        const timestamp = Math.floor(Date.now() / 1000);
        const { merchant_id } = await pb.send('/payway-merchant-id');
        const return_url = PUBLIC_PB_ENDPOINT + "/webhook/purchase/" + $pbUser.id;
        const amount = quantity * data.license_price;
        const formData = new FormData();
        formData.append("amount", amount);
        formData.append("req_time", timestamp);
        formData.append("email", $pbUser.email);
        formData.append("merchant_id", merchant_id);
        formData.append("tran_id", timestamp);
        formData.append("return_url", return_url);
        formData.append("payment_option", method);
        const hashStr = timestamp + merchant_id + timestamp + amount + $pbUser.email + method + return_url;
        const { hash } = await pb.send('/hash-payway', {method: 'POST', body: { hashStr }});
        formData.append("hash", hash);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            body: formData,
        };
        fetch(`${PUBLIC_PAYWAY_ENDPOINT}/api/payment-gateway/v1/payments/purchase`, requestOptions);
    }
</script>

<div class="flex flex-wrap gap-4 max-w-2xl mx-auto">
    <!-- One-Time Purchase -->
    <div class="flex-1 rounded-lg shadow min-w-full">
        <div class="p-6 border-b">
            <h2 class="text-xl font-semibold text-gray-900">One-Time Purchase</h2>
        </div>
        <div>
            <input type="number" bind:value={quantity} placeholder="${data.license_price} per employee" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            <br>
            <div class="p-6 border-b">
                <p class="text-lg">Total: ${(quantity || 0) * data.license_price}</p>
                <h3 class="text-lg">Choose Payment Method</h3>
            </div>
            <div class="p-6 space-y-4">
                {#each data.paymentMethods as method}
                    <button class="flex gap-4 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded items-center justify-between"
                        on:click={purchase_payway(method.id)}>
                        <img src="/payway/{method.id}.png" class="w-12 h-12 flex items-center justify-center text-2xl" alt={method.name}>
                        <div class="flex-1 text-left">
                            <p class="font-bold text-gray-900 mb-1">{method.name}</p>
                            <p class="text-sm text-gray-500">{method.description}</p>
                            {#if method.id === 'cards'}
                                <div class="flex gap-2 mt-2">
                                    {#each data.cards as card}
                                        <img src="/payway/{card}.png" alt={card} class="w-8 h-5 flex">
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <img src="/payway/arrow.png" alt="next" class="w-5 h-5 ml-4">
                    </button>
                {/each}
            </div>
        </div>
    </div>
</div>
