<script>
    import "../app.css";
    import { goto } from '$app/navigation';
    import { pb, pbUser, login, logout } from '$lib/stores/pocketbase';
    import { totalEmployeeStore } from '$lib/stores/total_employees';
    import { PUBLIC_FORM_URL, PUBLIC_PAYWAY_ENDPOINT, PUBLIC_PB_ENDPOINT } from '$env/static/public';
    export let data;
    let live_mode_modal = false;
    let live_mode_price;
    
    async function purchase_payway(method) {
        const return_url = PUBLIC_PB_ENDPOINT + "/webhook/live-mode/" + $pbUser.id;
        const { merchant_id } = await pb.send('/payway-merchant-id');
        
        const timestamp = Math.floor(Date.now() / 1000);

        let payment_option = method;
        const isMobile = window.innerWidth <= 768;
        if (method == "abapay_khqr" && isMobile) 
            payment_option = "abapay_khqr_deeplink";

        const { hash } = await pb.send('/hash-payway', {
            method: 'POST', 
            body: { hashStr: timestamp + merchant_id + timestamp + live_mode_price + $pbUser.email + payment_option + return_url + window.location.origin + "USD" }
        });

        const form = document.getElementById('aba_merchant_request');
        form.insertAdjacentHTML('beforeend',`
            <input type="hidden" name="amount" value="${live_mode_price}">
            <input type="hidden" name="merchant_id" value="${merchant_id}">
            <input type="hidden" name="req_time" value="${timestamp}">
            <input type="hidden" name="tran_id" value="${timestamp}">
            <input type="hidden" name="payment_option" value="${payment_option}">
            <input type="hidden" name="hash" value="${hash}">
            <input type="hidden" name="return_url" value="${return_url}">
            <input type="hidden" name="continue_success_url" value="${window.location.origin}">
        `);

        if (!isMobile)
            AbaPayway.checkout();
        else {
            const formObject = Object.fromEntries(new FormData(form).entries());
            fetch(PUBLIC_PAYWAY_ENDPOINT + "/api/payment-gateway/v1/payments/purchase", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formObject),
                redirect: 'follow',
            })
            .then(response => response.json())
            .then(({abapay_deeplink}) => window.location.href = abapay_deeplink);
        }
    }
</script>

<form id="aba_merchant_request" target="aba_webservice" action="{PUBLIC_PAYWAY_ENDPOINT}/api/payment-gateway/v1/payments/purchase" method="POST">
    <input type="hidden" name="email" value="{$pbUser?.email}"/>
    <input type="hidden" name="currency" value="USD"/>
    <input type="hidden" name="payment_gate" value="0"/>
</form>

<div class="header">
    <a href="/"><img class="logo" src="/logo192.png" alt="Logo"/></a>

    {#if $pbUser}
        <div class="user">  
            {#if window.deferredInstallPrompt}
                <button class="btn-secondary" onclick="window.deferredInstallPrompt.prompt()">📲</button>
            {/if}
            <a href={PUBLIC_FORM_URL} target="_blank"><button class="btn-secondary">✍️</button></a>
            {#if $pbUser.refresh_token}
                <button on:click={async () => {
                    if (!live_mode_price) 
                        await pb.send('/pricings')
                            .then(res => live_mode_price = res.live_mode_price)
                            .catch();
                    live_mode_modal = true
                }} 
                class={$pbUser?.live_mode ? 'btn-primary' : 'btn-secondary'}>
                    live mode
                </button>

                <button class="btn-secondary" on:click={() => goto('/buy')}>
                    {$totalEmployeeStore}/{$pbUser?.max_employees}
                </button>
            {/if}
            <button class="btn-secondary" on:click={logout}>➜]</button>
        </div>
    {:else}
        <button class="btn-primary"
            on:click={async e => {
                e.target.disabled = true;
                e.target.textContent = 'Logging in...';
                await login(false)
                    .then(() => window.location.reload())
                    .catch(() => alert("This device can only hold one account. This is to prevent cheating."));
            }}>
            Login
        </button>
    {/if}
</div>
{#if live_mode_modal}
<div class="modal-overlay">
    <div class="modal-content">
        <div class="form-title flex justify-between">
            Updates your sheet in real-time.
            <button class="btn-secondary" on:click={() => live_mode_modal=false}>x</button>
        </div>
        {#if $pbUser?.paid_live_mode}
            <button class={$pbUser.live_mode ? 'btn-primary' : 'btn-secondary'} 
                on:click={pb.send('/toggle-live-mode', {method:'POST'}).then(() => window.location.reload())}>
                {!$pbUser.live_mode ? 'Enable' : 'Disable'}
            </button>
        {:else}
            <p class="text-lg">Total: ${live_mode_price}</p>
            <h3 class="text-lg">Choose Payment Method</h3>
            {#each data.paymentMethods as method}
                <button class="flex gap-4 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded items-center justify-between"
                    on:click={purchase_payway(method.id)}>
                    <img src="/payway/{method.id}.png" class="w-12 rounded-lg" alt={method.name}>
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
        {/if}
    </div>
</div>
{/if}

<div style="padding: 20px;">
    <slot />
</div>
