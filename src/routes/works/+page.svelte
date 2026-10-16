<script lang="ts">
	import Media from '$lib/components/Media.svelte';
	import { masonry } from '$lib/js/masonry';
	import { spRatio, type Media as MediaItem } from '$lib/js/works';

	let { data } = $props();

	// /works: a masonry of every card at its own ratio, 10px
	// apart — 4 columns on PC; 2 on SP, where now and then a landscape
	// card runs the full width. Placement is pure CSS (see masonry.ts), so
	// it is right from the first paint at every width.
	const SIZES = '(min-width: 1024px) 25vw, 50vw';
	const SIZES_SP_FULL = '(min-width: 1024px) 25vw, 100vw';
	const WIDTHS = [480, 700, 940, 1400];
	const EAGER_COUNT = 4; // the first PC row
	const SP_FULL_AFTER = 5; // at least this many 2-column cards between full-width ones…
	const SP_FULL_MIN_RATIO = 1.25; // …and only a landscape card goes full width

	const pcRatio = (m: MediaItem) => (m.width && m.height ? m.width / m.height : 16 / 9);

	const cards = $derived(data.cards.filter((c) => c.visual));
	const pc = $derived(
		masonry(
			cards.map((c) => pcRatio(c.visual as MediaItem)),
			{ cols: 4, name: 'pc', cw: '--cw4', gap: '--gap', refCw: 342, refGap: 10 }
		)
	);
	const sp = $derived(
		masonry(
			cards.map((c) => spRatio(c.visual as MediaItem)),
			{
				cols: 2,
				name: 'sp',
				cw: '--cw2',
				gap: '--gap',
				refCw: 175,
				refGap: 10,
				full: (_, ratio, since) => since >= SP_FULL_AFTER && ratio >= SP_FULL_MIN_RATIO
			}
		)
	);

	// No left panel on PC (flag on <html>), as on /works.
	$effect(() => {
		document.documentElement.classList.add('is-works-wide');
		return () => document.documentElement.classList.remove('is-works-wide');
	});
</script>

<section class="Masonry" aria-label="Works">
	<div class="grid" style="{pc.vars}; {sp.vars}" style:--h-pc={pc.height} style:--h-sp={sp.height}>
		{#each cards as card, i (card.key)}
			{@const a = pc.items[i]}
			{@const b = sp.items[i]}
			<a
				class="card"
				href="/works/{card.slug}"
				style:--l-pc={a.left}
				style:--t-pc={a.top}
				style:--w-pc={a.width}
				style:--ar-pc={pcRatio(card.visual as MediaItem)}
				style:--l-sp={b.left}
				style:--t-sp={b.top}
				style:--w-sp={b.width}
				style:--ar-sp={spRatio(card.visual as MediaItem)}
			>
				<Media media={card.visual as MediaItem} cover sizes={b.full ? SIZES_SP_FULL : SIZES} widths={WIDTHS} eager={i < EAGER_COUNT} alt={card.title} />
				<p class="meta t-meta">
					<span class="num">{card.number}</span>
					<span class="title">{card.title}</span>
				</p>
			</a>
		{/each}
	</div>
</section>

<style>
	/* The section is the size container the column widths are taken from
	   (cqw), so they hold for `top` too, where % would mean height. */
	.Masonry {
		container-type: inline-size;
		padding: 0 var(--gutter) 120px;
		--gap: 10px;
	}

	.grid {
		--cw2: calc((100cqw - var(--gap)) / 2);
		--cw4: calc((100cqw - 3 * var(--gap)) / 4);
		position: relative;
		height: var(--h-sp);
	}

	.card {
		position: absolute;
		left: var(--l-sp);
		top: var(--t-sp);
		width: var(--w-sp);
		aspect-ratio: var(--ar-sp);
		overflow: clip;
	}

	.card :global(.Media) {
		height: 100%;
	}

	/* Number + title over the bottom-left corner, in difference blend so it
	   reads on any image. PC only, on hover (SP shows the images alone). */
	.meta {
		display: none;
		position: absolute;
		left: 10px;
		right: 10px;
		bottom: 8px;
		gap: 8px;
		color: #fff;
		mix-blend-mode: difference;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}

	.num {
		opacity: 0.6;
	}

	@media (min-width: 1024px) {
		:global(html.is-works-wide main.Main.has-aside) {
			margin-left: 0;
			padding-top: 80px;
		}

		:global(html.is-works-wide .Aside) {
			display: none;
		}

		.grid {
			height: var(--h-pc);
		}

		.card {
			left: var(--l-pc);
			top: var(--t-pc);
			width: var(--w-pc);
			aspect-ratio: var(--ar-pc);
		}

		.meta {
			display: flex;
			left: 12px;
			bottom: 10px;
			opacity: 0;
			transform: translateY(4px);
			transition:
				opacity 0.35s ease,
				transform 0.5s var(--ease-out);
		}

		.card:hover .meta,
		.card:focus-visible .meta {
			opacity: 1;
			transform: none;
		}
	}
</style>
