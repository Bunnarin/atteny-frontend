<script>
    import { pb, pbUser } from '$lib/stores/pocketbase.js';
    import { PUBLIC_PAYWAY_ENDPOINT, PUBLIC_PB_ENDPOINT } from '$env/static/public';
    
    export let data;
    let quantity;
    $: amount = quantity * data.license_price;
    
    let merchant_id;
    pb.send('/payway-merchant-id').then(res => merchant_id = res.merchant_id);
    const return_url = PUBLIC_PB_ENDPOINT + "/webhook/purchase/" + $pbUser.id;

    async function purchase_payway(method) {
        if (!Number.isInteger(quantity))
            return alert('amount must be integer');

        const timestamp = Math.floor(Date.now() / 1000);
        const { hash } = await pb.send('/hash-payway', {
            method: 'POST', 
            body: { hashStr: timestamp + merchant_id + timestamp + amount + $pbUser.email + method + return_url }
        });
        
        const body = {
            req_time: timestamp,
            tran_id: timestamp,
            payment_option: method,
            hash,
            amount,
            email: $pbUser.email,
            merchant_id,
            return_url,
            view_type: 'popup'
        }

        // fetch(PUBLIC_PAYWAY_ENDPOINT + "/api/payment-gateway/v1/payments/purchase", {method: 'POST', body: JSON.stringify(body)})
        //     .then(res => console.log(res));

        const form = document.getElementById('payway_form');
        form.insertAdjacentHTML('beforeend',`
            <input type="hidden" name="req_time" value="${timestamp}">
            <input type="hidden" name="tran_id" value="${timestamp}">
            <input type="hidden" name="payment_option" value="${method}">
            <input type="hidden" name="hash" value="${hash}">
        `);
        form.submit();
    }
</script>

<form id="payway_form" target="aba_webservice" action="{PUBLIC_PAYWAY_ENDPOINT}/api/payment-gateway/v1/payments/purchase" method="POST">
    <input type="hidden" name="amount" value="{amount}"/>
    <input type="hidden" name="email" value="{$pbUser.email}"/>
    <input type="hidden" name="merchant_id" value="{$merchant_id}"/>
    <input type="hidden" name="return_url" value="{return_url}"/>
</form>

<div class="flex flex-wrap gap-4 max-w-2xl mx-auto">
    <div class="flex-1 rounded-lg shadow min-w-full">
        <h2 class="p-6 border-b text-xl font-semibold text-gray-900">One-Time Purchase</h2>
        <div class="p-6 space-y-4">
            <input type="number" bind:value={quantity} placeholder="${data.license_price} per employee" class="w-full px-3 py-2 border rounded-md"/>
            <p class="text-lg">Total: ${(quantity || 0) * data.license_price}</p>
            <p class="text-lg">Choose Payment Method</p>
            {#each data.paymentMethods as method}
                <button class="flex gap-4 w-full p-4 bg-gray-100 rounded items-center"
                    on:click={purchase_payway(method.id)}>
                    <img src="/payway/{method.id}.png" alt={method.name}>
                    <div class="flex-1 text-left">
                        <p class="font-bold text-lg">{method.name}</p>
                        <p class="text-gray-500">{method.description}</p>
                        {#if method.id === 'cards'}
                            <div class="flex gap-2 mt-2">
                                {#each data.cards as card}
                                    <img src="/payway/{card}.png" alt={card} class="w-8 h-5 flex">
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <img src="/payway/arrow.png" alt="next">
                </button>
            {/each}
        </div>
    </div>
</div>
