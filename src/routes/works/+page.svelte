<script lang="ts">
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();

	// SP: 2 columns, each image at its own ratio, caption under it.
	// PC: full-width 3-column grid (no left panel), 3px apart, every image
	// cropped to 3:2; the caption shows over the image's bottom-left on hover.
	const SIZES = '(min-width: 1024px) 33vw, 50vw';
	const WIDTHS = [480, 700, 940, 1400];
	const EAGER_COUNT = 3; // the first row

	const arOf = (m: { width?: number; height?: number } | null) =>
		m?.width && m.height ? m.width / m.height : 3 / 2;

	// The PC layout drops the left panel on this page (flag on <html>).
	$effect(() => {
		document.documentElement.classList.add('is-works-wide');
		return () => document.documentElement.classList.remove('is-works-wide');
	});
</script>

<section class="Works" aria-label="Works">
	{#each data.cards as card, i (card.key)}
		<a class="card" href="/works/{card.slug}">
			{#if card.visual}
				<div class="thumb" style="--ar: {arOf(card.visual)}">
					<Media media={card.visual} cover sizes={SIZES} widths={WIDTHS} eager={i < EAGER_COUNT} alt={card.title} />
				</div>
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
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	/* Box at the image's own ratio on SP, so `cover` crops nothing. */
	.thumb {
		aspect-ratio: var(--ar);
	}

	.thumb :global(.Media) {
		transition: opacity 0.4s ease;
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

	/* ── PC ── */
	@media (min-width: 1024px) {
		:global(html.is-works-wide main.Main.has-aside) {
			margin-left: 0;
			padding-top: 80px;
		}

		:global(html.is-works-wide .Aside) {
			display: none;
		}

		.Works {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 3px;
			padding: 0;
		}

		.card {
			display: block;
		}

		.thumb {
			position: relative;
			aspect-ratio: 3 / 2;
		}

		/* A soft shade along the bottom on hover so the white caption reads
		   on light images too. */
		.thumb::after {
			content: '';
			position: absolute;
			inset: auto 0 0;
			height: 40%;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent);
			opacity: 0;
			transition: opacity 0.35s ease;
			pointer-events: none;
		}

		.card:hover .thumb::after,
		.card:focus-visible .thumb::after {
			opacity: 1;
		}

		.meta {
			position: absolute;
			left: 12px;
			right: 12px;
			bottom: 10px;
			color: #fff;
			opacity: 0;
			transform: translateY(4px);
			transition:
				opacity 0.35s ease,
				transform 0.5s var(--ease-out);
			pointer-events: none;
		}

		.card:hover .meta,
		.card:focus-visible .meta {
			opacity: 1;
			transform: none;
		}

		.card:hover .thumb :global(.Media) {
			opacity: 0.85;
		}
	}
</style>
