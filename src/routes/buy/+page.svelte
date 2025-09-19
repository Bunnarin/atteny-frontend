<script>
    import { pb } from '$lib/pocketbase';
    import { PUBLIC_PAYWAY_ENDPOINT, PUBLIC_UNIT_PRICE } from '$env/static/public';
    export let data;
    $: amount = 1;
    let paying = false;

    async function populateForm() {
        paying = true;
        const data = await pb.send(`/buy/${amount}`, {method: 'POST'});
        const form = document.getElementById('payway_form');
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
{#if paying}
    <p>Processing payment...</p>
{:else}
<form on:submit={populateForm}>
<div class="form-question">
    <h1>Your current employees: {data.total_employees}/{data.max_employees}</h1>
    <br>
    Number of employees to buy: 
    <br>
    (Total: ${amount * PUBLIC_UNIT_PRICE})
    <input type="number" bind:value={amount} min="1" required />
    <br><br>
    <button type="submit" class="btn-primary">Buy</button>
</div>
</form>
{/if}
<form id="payway_form" action="{PUBLIC_PAYWAY_ENDPOINT}" method="POST" target="_blank"></form>
