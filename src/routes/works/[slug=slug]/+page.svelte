<script lang="ts">
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();
	const work = $derived(data.work);

	// Panel width on PC = viewport minus the 455/1440 left panel.
	const PANEL = 'calc(100vw - 455 / 1440 * 100vw)';
	const HERO_SIZES = `(min-width: 1024px) ${PANEL}, 100vw`;
	const PAIR_SIZES = `(min-width: 1024px) calc(${PANEL} * 0.56), 50vw`;
	const REST_SIZES = `(min-width: 1024px) ${PANEL}, calc(100vw - 40px)`;
	const HERO_WIDTHS = [640, 900, 1400, 2000, 2800];
	const REST_WIDTHS = [640, 900, 1400, 2000, 2800];

	/** w/h for the width cap on tall images (videos: 16:9 until known). */
	const arOf = (m: { width?: number; height?: number }) =>
		m.width && m.height ? m.width / m.height : 16 / 9;
</script>

{#key work.slug}
	<article class="Work">
		{#if work.hero}
			<div class="hero">
				<Media media={work.hero} cover eager sizes={HERO_SIZES} widths={HERO_WIDTHS} alt={work.title} />
			</div>
		{/if}

		{#if work.pair.length}
			<div class="pair" class:is-single={work.pair.length === 1}>
				{#each work.pair as media, i (i)}
					<div class="cell cell--{i + 1}">
						<Media {media} cover sizes={PAIR_SIZES} />
					</div>
				{/each}
			</div>
		{/if}

		{#if work.lead || work.body}
			<section class="text">
				{#if work.lead}
					<h2 class="lead t-subtitle" lang={work.lead.lang}>{work.lead.text}</h2>
				{/if}
				{#if work.body}
					<p class="body t-body" lang={work.body.lang}>{work.body.text}</p>
				{/if}
			</section>
		{/if}

		{#if work.rest.length}
			<div class="rest">
				{#each work.rest as media, i (i)}
					<div class="rest-item" style="--ar: {arOf(media)}">
						<Media {media} sizes={REST_SIZES} widths={REST_WIDTHS} />
					</div>
				{/each}
			</div>
		{/if}

		{#if work.colophon.length}
			<section class="Colophon" aria-labelledby="colophon-heading">
				<h2 class="t-subtitle" id="colophon-heading">Colophon</h2>
				<dl>
					{#each work.colophon as row, i (i)}
						<div class="row">
							<dt>{row.label}</dt>
							<span class="leader" aria-hidden="true"></span>
							<!-- colophon_text is editor-authored HTML from our own CMS;
							     only <a> survives the parser (lib/js/works.ts). -->
							<dd>{#if row.html}{@html row.value}{:else}{row.value}{/if}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}
	</article>
{/key}

<style>
	/* ── SP (Figma 128:376) ─────────────────────────────────────────────
	   hero 393 × 376 full-bleed · pair 197 × 264 + 194 × 159 (2px apart,
	   top-aligned) · lead 24px at x=20 · body 11px / 1.5 in 353px · further
	   images 353px wide, 20px apart · Colophon */
	.hero {
		aspect-ratio: 393 / 376;
	}

	.pair {
		display: grid;
		grid-template-columns: 197fr 194fr;
		align-items: start;
		gap: var(--tile-gap);
		margin-top: var(--tile-gap);
	}

	.pair.is-single {
		grid-template-columns: 1fr;
	}

	.cell--1 {
		aspect-ratio: 197 / 264;
	}

	.cell--2 {
		aspect-ratio: 194 / 159;
	}

	.is-single .cell--1 {
		aspect-ratio: 393 / 264;
	}

	.text {
		padding: 68px var(--gutter) 0;
	}

	.lead {
		white-space: pre-line;
	}

	.body {
		max-width: var(--measure);
		margin-top: 10px;
		white-space: pre-line;
	}

	.rest {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 50px var(--gutter) 0;
	}

	.rest-item {
		width: min(100%, calc((100vh - 2 * var(--header-h)) * var(--ar)));
	}

	.Colophon {
		padding: 60px var(--gutter) 0;
	}

	.Colophon dl {
		max-width: var(--measure);
		margin-top: 20px;
	}

	/* Label · hairline leader · value (Figma: 0.5px black lines at the
	   baseline, ~7px clear of the text on each side). */
	.row {
		display: flex;
		align-items: baseline;
		line-height: var(--lh-colophon);
	}

	/* Both ends may shrink/wrap, so a long credit can never push the row
	   past the screen edge. */
	dt {
		flex: 0 1 auto;
		min-width: 0;
		font-size: var(--fs-colophon-label);
	}

	/* A true hairline in every engine (Chromium rounds a 0.5px border up to
	   1 CSS px), lifted ~1.5px off the baseline as in Figma. */
	.leader {
		flex: 1 1 auto;
		min-width: 24px;
		height: 1px;
		margin: 0 7px 1.5px;
		background: var(--color-text);
		transform: scaleY(0.5);
		transform-origin: bottom;
	}

	dd {
		flex: 0 1 auto;
		min-width: 0;
		max-width: 60%;
		font-size: var(--fs-colophon-value);
		text-align: right;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	dd :global(a) {
		text-decoration: underline;
		text-underline-offset: 0.2em;
		text-decoration-thickness: 0.5px;
	}

	/* ── PC (Figma 79:229) ──────────────────────────────────────────────
	   The panel right of the left column scrolls with the page: hero
	   984 × 822, then 552 + 432 × 480; below the fold the SP order
	   continues at PC type sizes, text aligned to the panel's left edge
	   like About. */
	@media (min-width: 1024px) {
		.hero {
			aspect-ratio: 984 / 822;
		}

		.pair {
			grid-template-columns: 552fr 432fr;
			align-items: stretch;
			aspect-ratio: 984 / 480;
		}

		.cell--1,
		.cell--2,
		.is-single .cell--1 {
			aspect-ratio: auto;
			height: 100%;
		}

		.text {
			padding: 120px var(--gutter) 0 0;
		}

		.body {
			margin-top: 24px;
		}

		.rest {
			gap: var(--tile-gap);
			padding: 120px 0 0;
		}

		.rest-item {
			width: min(100%, calc(100vh * var(--ar)));
		}

		.Colophon {
			padding: 120px var(--gutter) 160px 0;
		}

		.Colophon dl {
			margin-top: 28px;
		}
	}
</style>
