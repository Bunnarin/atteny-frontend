<script>
    import { pb } from '$lib/pocketbase';
    import { goto } from '$app/navigation';
    import { PUBLIC_PAYWAY_ENDPOINT } from '$env/static/public';
    let amount = 1;

    function populateForm() {
        pb.send(`/buy/${amount}`, {method: 'POST'})
            .then(data => {
                const form = document.getElementById('payway_form');
                Object.entries(data).forEach(([key, value]) => {
                    const input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = value
                    form?.appendChild(input)
                });
                form?.submit();
            })
            .catch(error => goto('/?message=' + encodeURIComponent(error.message)));
    }
</script>

<input type="number" bind:value={amount} min="1" required />
<button on:click={populateForm}>Buy</button>

<form id="payway_form" action="{PUBLIC_PAYWAY_ENDPOINT}" method="POST">
</form>
