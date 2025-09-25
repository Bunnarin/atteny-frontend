<script>
    import { pb } from '$lib/pocketbase';
    import { PUBLIC_PAYWAY_ENDPOINT } from '$env/static/public';
    export let data;
    let amount;

    async function populateForm(form_id, url_path) {
        const data = await pb.send(url_path, {method: 'POST'});
        const form = document.getElementById(form_id);
        Object.entries(data).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form?.appendChild(input);
        });
        form?.submit();
    }
</script>

<form id="purchase_form" action="{PUBLIC_PAYWAY_ENDPOINT}/api/payment-gateway/v1/payments/purchase" method="POST"></form>
<form id="link_card_form" action="{PUBLIC_PAYWAY_ENDPOINT}/api/payment-credential/v3/cof/link-card" method="POST"></form>

<div class="flex flex-wrap gap-4">
    <div class="form-question flex-1">
        <h2 class="form-title">One-Time Purchase</h2>
        <input 
            type="number" 
            bind:value={amount} 
            placeholder="Number of employees"
            required 
        />
        <br><br>
        <button 
            class="btn-primary w-full" 
            disabled={amount < 1 || !Number.isInteger(amount)}
            on:click={() => populateForm('purchase_form', `/buy/${amount}`)}
        >
            ${((amount || 0) * data.license_price)}
        </button>
    </div>
    <div class="text-center text-2xl py-4">OR</div>
    <div class="form-question flex-1">
        <h2 class="form-title">
            Subscription:
            {#if data.total_employees > data.max_employees}
                ${(data.total_employees - data.max_employees) * data.rent_price}/month
            {/if}
        </h2>
        
        <button 
            class={`w-full ${data.has_card ? 'btn-secondary' : 'btn-primary'}`} 
            on:click={() => populateForm('link_card_form', `/link-card`)}
        >
            {data.has_card ? 'Update Card' : 'Link Card'}
        </button>
    </div>
</div>

<div class="form-question">
    <div class="form-title">Live Mode: ${data.live_mode_price}/month</div>
    <p>Live mode allows you to see real-time clock-ins and clock-outs.</p>
    <br>
    {#if data.has_card}
        <button class={data.live_mode ? 'btn-secondary' : 'btn-primary'} 
            on:click={async (e) => {
                await pb.send(`/toggle-live-mode`, {method: 'POST'})
                    .then(() => {e.target.textContent = 'saved'; e.target.disabled = true;})
                    .catch(error => alert(error))
            }}>
            {data.live_mode ? 'Disable' : 'Enable'}
        </button>
    {:else}
        <button class="btn-primary w-full" on:click={() => populateForm('link_card_form', `/link-card`)}>
            Link Card first
        </button>
    {/if}
</div>