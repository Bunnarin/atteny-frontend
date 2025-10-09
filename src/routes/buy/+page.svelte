<script>
    import { pb, pbUser } from '$lib/stores/pocketbase.js';
    import { PUBLIC_PAYWAY_ENDPOINT, PUBLIC_PB_ENDPOINT } from '$env/static/public';
    
    export let data;
    let quantity = 1;
    $: amount = quantity * data.license_price;
    
    let merchant_id;
    pb.send('/payway-merchant-id').then(res => merchant_id = res.merchant_id);
    const return_url = PUBLIC_PB_ENDPOINT + "/webhook/purchase/" + $pbUser.id;

    let checkoutUrl;
    async function purchase_payway(method) {
        if (!Number.isInteger(quantity))
            return alert('amount must be integer');

        const timestamp = Math.floor(Date.now() / 1000);
        const { hash } = await pb.send('/hash-payway', {
            method: 'POST', 
            body: { hashStr: timestamp + merchant_id + timestamp + amount + $pbUser.email + method + return_url + window.location.href + "USD" }
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
            currency: "USD",
            continue_success_url: window.location.href,
            view_type: "popup",
            payment_gate: 0
        }

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
            redirect: 'follow'
        };

        fetch(PUBLIC_PAYWAY_ENDPOINT + "/api/payment-gateway/v1/payments/purchase", requestOptions)
            .then(res => res.json())
            .then(data => {
                console.table(data);
                const isMobile = window.innerWidth <= 768;
                if (isMobile) 
                    window.location.href = data.abapay_deeplink
                // else 
                //     checkoutUrl = data.qrImage
            });
    }
</script>

{#if checkoutUrl}
<div class="modal-overlay">
    <div class="modal-content">
        <!-- <iframe src={checkoutUrl} title="Payment Gateway"></iframe> -->
        <img src={checkoutUrl} alt="Payment QR Code"/>
    </div>
</div>
{/if}

<div class="flex flex-wrap gap-4 max-w-2xl mx-auto">
    <div class="flex-1 rounded-lg shadow min-w-full">
        <h2 class="p-6 border-b text-xl font-semibold text-gray-900">One-Time Purchase</h2>
        <div class="p-6 space-y-4">
            <input type="number" bind:value={quantity} placeholder="${data.license_price} per employee" class="w-full px-3 py-2 border rounded-md"/>
            <p class="text-lg">Total: ${(quantity || 0) * data.license_price}</p>
            <p class="text-lg">Choose Payment Method</p>
            {#each data.paymentMethods as method}
                <button on:click={purchase_payway(method.id)} class="flex gap-4 w-full p-4 bg-gray-100 rounded items-center">
                    <img src="/payway/{method.id}.png" alt={method.name} class="w-12 rounded-md">
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
