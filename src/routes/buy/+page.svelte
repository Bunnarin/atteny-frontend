<script>
    import { pb } from '$lib/stores/pocketbase.js';
    import { PUBLIC_PAYWAY_ENDPOINT } from '$env/static/public';
    
    export let data;
    let amount;

    async function redirect_to_aba_page(payway_endpoint, pb_endpoint) {
        const formData = await pb.send(pb_endpoint, {method: 'POST'});
        const form = document.createElement('form');
        document.body.appendChild(form);
        form.action = PUBLIC_PAYWAY_ENDPOINT + payway_endpoint;
        form.method = 'POST';
        Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });
        form.submit();
    }

    // Calculate total price
    $: totalPrice = (amount || 0) * data.license_price;
</script>

<div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
        <div class="flex flex-wrap gap-4">
            <!-- One-Time Purchase with Payment Options -->
            <div class="flex-1 rounded-lg shadow">
                <div class="p-6 border-b">
                    <h2 class="text-xl font-semibold text-gray-900">One-Time Purchase</h2>
                </div>
                <div>
                    <input type="number" bind:value={amount} placeholder="${data.license_price} per employee" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    <br>
                    <div class="p-6 border-b">
                        <h3 class="text-lg">Choose Payment Method</h3>
                    </div>
                    <div class="space-y-2">
                        {#each data.paymentMethods as method}
                            <button class="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg flex items-center justify-between group">
                                <div class="flex items-center gap-4 flex-grow">
                                    <img src="/payway/{method.id}.png" class="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-2xl" alt={method.name}>
                                    <div class="flex-1 text-left">
                                        <p class="font-medium text-gray-900 mb-1">{method.name}</p>
                                        <p class="text-sm text-gray-500">{method.description}</p>
                                        {#if method.id === 'cards'}
                                            <div class="flex gap-2 mt-2">
                                                {#each data.cards as card}
                                                    <img src="/payway/{card}.png" alt={card} class="w-8 h-5 rounded text-white text-xs flex">
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                    <img src="/payway/arrow.png" alt="next" class="w-5 h-5 ml-4">
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Pay-as-you-go Section -->
            <div class="flex-1 rounded-lg shadow">
                <div class="p-6 border-b">
                    <h2 class="text-xl font-semibold text-gray-900">or Pay-as-you-go</h2>
                    {#if data.total_employees > data.max_employees}
                        <p class="text-sm text-gray-600">
                            Monthly cost: {(data.total_employees - data.max_employees) * data.rent_price}/month
                        </p>
                    {/if}
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <p class="text-gray-600">Link your payment method for automatic monthly billing</p>
                        <div class="flex flex-wrap gap-4">
                            <button
                                class={data.has_card ? 'btn-secondary' : 'btn-primary'}
                                on:click={() => redirect_to_aba_page('/api/payment-credential/v3/cof/link-card', '/link-payment')}
                            >
                                {data.has_card ? 'Update Card' : 'Link Card'}
                            </button>

                            <button
                                class={data.has_card ? 'btn-secondary' : 'btn-primary'}
                                on:click={() => redirect_to_aba_page('/api/payment-credential/v3/aof/link-account', '/link-payment')}
                            >
                                {data.has_card ? 'Update ABA' : 'Link ABA'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>