<script lang="ts">
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();

	// Width/placement per card, cycling every 10 — the Office home stream's
	// rhythm (Dev/OTIF/src/routes/+page.svelte, card-01…10), re-expressed
	// as % of II's right-hand panel instead of vw of the whole screen.
	const PATTERN_LENGTH = 10;
	const variantOf = (i: number) => (i % PATTERN_LENGTH) + 1;

	/** w/h — caps a portrait card's width so its image never exceeds 90vh
	    (videos: 16:9 until they load). */
	const aspectOf = (m: { width?: number; height?: number } | null) =>
		m?.width && m?.height ? m.width / m.height : 16 / 9;

	const SIZES = '(min-width: 1024px) 60vw, 100vw';
	const WIDTHS = [640, 900, 1400, 2000];
</script>

<section class="Stream" aria-label="Works">
	{#each data.cards as card, i (card.slug)}
		<a class="card v{variantOf(i)}" href="/works/{card.slug}" style="--aspect: {aspectOf(card.visual)}">
			{#if card.visual}
				<Media media={card.visual} sizes={SIZES} widths={WIDTHS} eager={i === 0} alt={card.title} />
			{/if}
			<p class="meta t-meta">
				<span class="num">{card.number}</span>
				<span class="title">{card.title}</span>
				<span class="scope">{card.scope}</span>
			</p>
		</a>
	{/each}
</section>

<style>
	/* ── SP: one column in the page flow, widths varying card to card ── */
	.Stream {
		display: flex;
		flex-direction: column;
		gap: 80px;
		padding: 0 var(--gutter);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		margin-inline: auto;
	}

	.card :global(.Media) {
		transition: opacity 0.4s ease;
	}

	@media (hover: hover) {
		.card:hover :global(.Media) {
			opacity: 0.85;
		}
	}

	.meta {
		display: grid;
		grid-template-columns: 12.5% 1fr auto;
		align-items: baseline;
		gap: 8px;
	}

	.num,
	.scope {
		opacity: 0.6;
	}

	.scope {
		text-align: right;
	}

	/* Full-bleed cards run edge to edge; their meta keeps the gutter. */
	.v3,
	.v5,
	.v9 {
		width: calc(100% + 2 * var(--gutter));
		margin-inline: calc(-1 * var(--gutter));
	}

	.v3 .meta,
	.v5 .meta,
	.v9 .meta {
		padding-inline: var(--gutter);
	}

	.v1,
	.v2 {
		width: 90%;
	}

	.v4,
	.v10 {
		width: 62.5%;
	}

	.v6 {
		width: 85%;
	}

	.v7 {
		width: 70%;
	}

	.v8 {
		width: 80%;
	}

	/* ── PC: the panel right of the fixed left column scrolls; each card
	   takes its own width and side, and a portrait image is narrowed so it
	   stays within 90vh (never cropped). ── */
	@media (min-width: 1024px) {
		.Stream {
			gap: 120px;
			padding: 120px var(--gutter) 160px 0;
		}

		.card {
			max-width: calc(90vh * var(--aspect));
		}

		.v3,
		.v5,
		.v9 {
			margin-inline: auto;
		}

		.v3 .meta,
		.v5 .meta,
		.v9 .meta {
			padding-inline: 0;
		}

		.v1 {
			width: 44%;
			margin-inline: auto;
		}

		.v2 {
			width: 56%;
			margin-left: auto;
			margin-right: 0;
		}

		.v3,
		.v9 {
			width: 100%;
		}

		.v4 {
			width: 40%;
			margin-left: 8%;
			margin-right: auto;
		}

		.v5 {
			width: 72%;
		}

		.v6 {
			width: 52%;
			margin-left: auto;
			margin-right: 8%;
		}

		.v7 {
			width: 44%;
			margin-left: 8%;
			margin-right: auto;
		}

		.v8 {
			width: 60%;
			margin-inline: auto;
		}

		.v10 {
			width: 42%;
			margin-left: auto;
			margin-right: 8%;
		}
	}
</style>
