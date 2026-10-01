<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import ProjectSlider from '$lib/components/ProjectSlider.svelte';

	let { data } = $props();

	// Full-bleed page: the header's controls turn white over the photographs
	// (flagged on <html> while the top page is shown).
	$effect(() => {
		document.documentElement.classList.add('is-top');
		return () => document.documentElement.classList.remove('is-top');
	});
</script>

<Opening />

<ProjectSlider slides={data.slides} />

<style>
	/* Each slide rests whole: scrolling settles on the slide boundaries. */
	:global(html.is-top) {
		scroll-snap-type: y proximity;
	}
</style>
