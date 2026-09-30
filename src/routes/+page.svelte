<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();

	// Full-bleed page: the header's controls turn white over the photographs
	// (flagged on <html> while the top page is shown).
	$effect(() => {
		document.documentElement.classList.add('is-top');
		return () => document.documentElement.classList.remove('is-top');
	});
</script>

<Opening />

<!-- One 100vw × 100vh slide per work. Each slide is sticky, so the next
     one scrolls up over it (hinc.jp-style stack) — plain scrolling, no
     scroll hijacking; slides snap into place (proximity). -->
<section class="Top" aria-label="Works">
	{#each data.slides as slide, i (slide.slug)}
		<a class="slide" href="/works/{slide.slug}">
			<Media media={slide.visual} cover eager={i === 0} sizes="100vw" widths={[900, 1400, 2000, 2800, 3840]} alt={slide.title} />
			<span class="shade" aria-hidden="true"></span>
			<p class="caption">
				<span class="num">{slide.number}</span>
				<span class="title">{slide.title}</span>
			</p>
		</a>
	{/each}
</section>

<style>
	:global(html.is-top) {
		scroll-snap-type: y proximity;
	}

	.slide {
		position: sticky;
		top: 0;
		display: block;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		scroll-snap-align: start;
		background: var(--color-tile);
	}

	.slide :global(.Media) {
		position: absolute;
		inset: 0;
		height: 100%;
	}

	/* The slide being covered dims as the next one rises over it
	   (scroll-driven where supported; otherwise simply no dimming). */
	.shade {
		position: absolute;
		inset: 0;
		background: #000;
		opacity: 0;
		pointer-events: none;
	}

	@supports (animation-timeline: view()) {
		.shade {
			animation: cover-dim linear both;
			animation-timeline: view();
			animation-range: exit 0% exit 100%;
		}

		@keyframes cover-dim {
			to {
				opacity: 0.6;
			}
		}
	}

	.caption {
		position: absolute;
		left: var(--gutter);
		bottom: calc(18px + env(safe-area-inset-bottom, 0px));
		display: flex;
		gap: 0.8em;
		color: #fff;
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: var(--tracking-title);
		text-transform: uppercase;
	}

	.num {
		opacity: 0.6;
	}

	@media (hover: hover) {
		.slide .title {
			background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat;
			transition: background-size 0.5s var(--ease-out);
		}

		.slide:hover .title {
			background-size: 100% 1px;
		}
	}

	@media (min-width: 1024px) {
		.caption {
			font-size: 16px;
		}
	}
</style>
