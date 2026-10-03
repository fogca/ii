<script lang="ts">
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();

	// Plain CSS grid — 3 columns on PC, 2 on SP. Rows line up (unlike the
	// /works/grid masonry, which packs columns); every image keeps its own
	// aspect ratio, uncropped, hung from the top of its row.
	const SIZES = '(min-width: 1024px) calc((100vw - 455 / 1440 * 100vw) / 3), 50vw';
	const WIDTHS = [480, 700, 940, 1400];
	const EAGER_COUNT = 3; // the first row
</script>

<section class="Works" aria-label="Works">
	{#each data.cards as card, i (card.slug)}
		<a class="card" href="/works/{card.slug}">
			{#if card.visual}
				<Media media={card.visual} sizes={SIZES} widths={WIDTHS} eager={i < EAGER_COUNT} alt={card.title} />
			{/if}
			<p class="meta t-meta">
				<span class="num">{card.number}</span>
				<span class="title">{card.title}</span>
				{#if card.scope}<span class="scope">{card.scope}</span>{/if}
			</p>
		</a>
	{/each}
</section>

<style>
	/* ── SP: 2 columns ── */
	.Works {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: 40px 12px;
		padding: 0 var(--gutter);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.card :global(.Media) {
		transition: opacity 0.4s ease;
	}

	@media (hover: hover) {
		.card:hover :global(.Media) {
			opacity: 0.85;
		}
	}

	/* "01 Title" on the first line, the scope under it. */
	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: 8px;
	}

	.num,
	.scope {
		opacity: 0.6;
	}

	.scope {
		flex-basis: 100%;
	}

	/* ── PC: 3 columns in the panel right of the fixed left column, aligned
	   to the panel's left edge like the other pages. ── */
	@media (min-width: 1024px) {
		.Works {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 80px 20px;
			padding: 120px var(--gutter) 160px 0;
		}
	}
</style>
