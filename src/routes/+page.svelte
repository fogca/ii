<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import Masonry from '$lib/components/Masonry.svelte';

	let { data } = $props();
</script>

<Opening />

<section class="Works" aria-label="Works">
	<Masonry tiles={data.tiles} />
</section>
