<script lang="ts">
	import TopReel from '$lib/components/TopReel.svelte';
	import type { Slide } from '../../+page.server';

	let { data } = $props();

	// Experimental top: the works as one continuous film in the first view.
	// The header's controls turn white over it, as on the top page.
	$effect(() => {
		document.documentElement.classList.add('is-top');
		return () => document.documentElement.classList.remove('is-top');
	});
</script>

<TopReel slides={data.slides as Slide[]} />
