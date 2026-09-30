<script lang="ts">
	import Masonry from '$lib/components/Masonry.svelte';

	let { data } = $props();
</script>

<section class="Works" aria-label="Works">
	<Masonry tiles={data.tiles} />
</section>
