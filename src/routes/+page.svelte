<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import TopReel from '$lib/components/TopReel.svelte';

	let { data } = $props();

	// Full-bleed page: the header's controls turn white over the film
	// (flagged on <html> while the top page is shown).
	$effect(() => {
		document.documentElement.classList.add('is-top');
		return () => document.documentElement.classList.remove('is-top');
	});
</script>

<Opening />

<TopReel slides={data.slides} />
