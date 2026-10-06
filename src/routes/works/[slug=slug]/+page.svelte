<script lang="ts">
	import Media from '$lib/components/Media.svelte';

	let { data } = $props();
	const work = $derived(data.work);

	// PC: once the page is scrolled, the left panel swaps the work's title
	// for its text (lead + body) — the title fades out (Aside.svelte), the
	// .text block below fades in, pinned in the panel. SP keeps the text in
	// the flow. Works without text keep the title.
	const SWAP_AFTER = 80; // px of scroll
	$effect(() => {
		if (!work.lead && !work.body) return;
		const html = document.documentElement;
		const update = () => html.classList.toggle('is-aside-swapped', window.scrollY > SWAP_AFTER);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => {
			window.removeEventListener('scroll', update);
			html.classList.remove('is-aside-swapped');
		};
	});

	// Panel width on PC = viewport minus the 455/1440 left panel.
	const PANEL = 'calc(100vw - 455 / 1440 * 100vw)';
	const HERO_SIZES = `(min-width: 1024px) ${PANEL}, 100vw`;
	const PAIR_SIZES = `(min-width: 1024px) calc(${PANEL} * 0.56), 50vw`;
	const REST_SIZES = `(min-width: 1024px) ${PANEL}, calc(100vw - 40px)`;
	const HERO_WIDTHS = [640, 900, 1400, 2000, 2800];
	const REST_WIDTHS = [640, 900, 1400, 2000, 2800];

	/** w/h — the hero's box and the SP pair's shared row height (videos:
	    16:9 until known). */
	const arOf = (m: { width?: number; height?: number }) =>
		m.width && m.height ? m.width / m.height : 16 / 9;
</script>

{#key work.slug}
	<article class="Work">
		<!-- Scope (CMS select): SP above the hero; PC pinned at the bottom of
		     the left panel, above the legal line. -->
		{#if work.scope.length}
			<p class="scope t-eyebrow" aria-label="Scope">{work.scope.join(' / ')}</p>
		{/if}

		{#if work.hero}
			<div class="hero" style="--ar: {arOf(work.hero)}">
				<Media media={work.hero} cover eager sizes={HERO_SIZES} widths={HERO_WIDTHS} alt={work.title} />
			</div>
		{/if}

		{#if work.pair.length}
			<div class="pair" class:is-single={work.pair.length === 1}>
				{#each work.pair as media, i (i)}
					<div class="cell" style="--ar: {arOf(media)}">
						<Media {media} sizes={PAIR_SIZES} />
					</div>
				{/each}
			</div>
		{/if}

		{#if work.lead || work.body}
			<section class="text">
				<!-- Both languages are in the page; html[data-lang] picks one.
				     A work missing one language shows the other in both
				     (.is-only). -->
				{#if work.lead}
					{#if work.lead.en}
						<h2 class="lead t-subtitle x-en" class:is-only={!work.lead.ja} lang="en">{work.lead.en}</h2>
					{/if}
					{#if work.lead.ja}
						<h2 class="lead t-subtitle x-ja" class:is-only={!work.lead.en} lang="ja">{work.lead.ja}</h2>
					{/if}
				{/if}
				{#if work.body}
					{#if work.body.en}
						<p class="body t-body x-en" class:is-only={!work.body.ja} lang="en">{work.body.en}</p>
					{/if}
					{#if work.body.ja}
						<p class="body t-body x-ja" class:is-only={!work.body.en} lang="ja">{work.body.ja}</p>
					{/if}
				{/if}
			</section>
		{/if}

		{#if work.rest.length}
			<div class="rest">
				{#each work.rest as media, i (i)}
					<div class="rest-item">
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
	   hero full-bleed · image pair (2px apart) · lead 24px at x=20 · body
	   11px / 1.5 in 353px · further images 353px wide, 20px apart ·
	   Colophon. Every image keeps its own aspect ratio — nothing is
	   cropped (Figma's fixed 393 × 376 / 197 × 264 + 194 × 159 boxes were
	   placeholders). */

	.scope {
		padding: 0 var(--gutter) 12px;
	}

	/* The hero's box takes the image's own ratio (so `cover` crops nothing);
	   on PC it's also at least a screen tall. */
	.hero {
		aspect-ratio: var(--ar);
	}

	/* The pair shares one row height: each image's width is proportional to
	   its aspect ratio, so both show whole at the same height. */
	.pair {
		display: flex;
		gap: var(--tile-gap);
		margin-top: var(--tile-gap);
	}

	.cell {
		flex: var(--ar) 1 0;
		min-width: 0;
	}

	.pair.is-single .cell {
		flex: none;
		width: 100%;
	}

	.text {
		padding: 68px var(--gutter) 0;
	}

	.lead {
		white-space: pre-line;
	}

	:global(html[data-lang='ja']) .x-en:not(.is-only),
	:global(html:not([data-lang='ja'])) .x-ja:not(.is-only) {
		display: none;
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
	   The panel right of the left column scrolls with the page: hero, then
	   the image pair (uncropped, as on SP); below the fold the SP order
	   continues at PC type sizes, text aligned to the panel's left edge
	   like About. */
	@media (min-width: 1024px) {
		.hero {
			min-height: 100vh;
			min-height: 100dvh;
		}

		.scope {
			position: fixed;
			left: var(--gutter);
			bottom: calc(44px + env(safe-area-inset-bottom, 0px));
			z-index: var(--z-content);
			width: calc(var(--aside-w) - 2 * var(--gutter));
			padding: 0;
		}

		/* No pair on PC: every image after the hero runs full width, one
		   under the other, 2px apart. */
		.pair {
			flex-direction: column;
		}

		.cell,
		.pair.is-single .cell {
			flex: none;
			width: 100%;
		}

		.rest {
			gap: var(--tile-gap);
			margin-top: var(--tile-gap);
			padding: 0;
		}

		/* The text lives in the left panel, shown once the page scrolls
		   (html.is-aside-swapped, set above) as the title fades out. It
		   stops above the panel's legal line and scrolls itself if long. */
		.text {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 64px;
			z-index: var(--z-content);
			width: var(--aside-w);
			padding: 80px var(--gutter) 24px;
			overflow-y: auto;
			overscroll-behavior: contain;
			scrollbar-width: none;
			opacity: 0;
			visibility: hidden;
			transform: translateY(10px);
			transition:
				opacity 0.9s var(--ease-out),
				transform 1.1s var(--ease-out),
				visibility 0s linear 0.9s;
		}

		:global(html.is-aside-swapped) .text {
			opacity: 1;
			visibility: visible;
			transform: none;
			transition-delay: 0.2s, 0.2s, 0s;
		}

		.body {
			margin-top: 10px;
			max-width: none;
		}

		.lead:lang(ja) {
			line-height: 1.4;
		}

		.Colophon {
			padding: 120px var(--gutter) 160px 0;
		}

		.Colophon dl {
			margin-top: 28px;
		}
	}
</style>
