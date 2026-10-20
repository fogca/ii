<script lang="ts">
	import Media from '$lib/components/Media.svelte';
	import LangSwitch from '$lib/components/LangSwitch.svelte';
	import { spRatio } from '$lib/js/works';

	let { data } = $props();
	const work = $derived(data.work);

	// PC, after studiosly.com.au/project/…: the page is one screen — a band
	// across the top quarter (the work's name and number · Summary · scope ·
	// Back) over a strip of every image at the same height, each at its own
	// ratio, that the wheel (or a drag, or a trackpad) runs sideways.
	// Summary lays the work's text and colophon over the strip.
	// SP keeps the single column: scope, hero, text, images, colophon.
	const PC_QUERY = '(min-width: 1024px)';
	const EASE = 0.12; // share of the remaining distance per frame
	const LINE_PX = 40; // wheel "lines" (Firefox) → px
	const DRAG_THRESHOLD = 6; // px before a press becomes a drag

	let strip = $state<HTMLDivElement>();
	let summary = $state(false);

	// Vertical wheel → horizontal travel, eased. Horizontal input (trackpad
	// swipes) is left native. The page itself never scrolls on PC.
	$effect(() => {
		const el = strip;
		if (!el) return;
		const mq = matchMedia(PC_QUERY);
		let pos = el.scrollLeft;
		let target = pos;
		let raf = 0;
		const max = () => el.scrollWidth - el.clientWidth;
		const step = () => {
			pos += (target - pos) * EASE;
			if (Math.abs(target - pos) < 0.5) pos = target;
			el.scrollLeft = pos;
			raf = pos === target ? 0 : requestAnimationFrame(step);
		};
		const onWheel = (e: WheelEvent) => {
			if (!mq.matches || summary) return;
			if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
				cancelAnimationFrame(raf);
				raf = 0;
				return;
			}
			e.preventDefault();
			if (!raf) pos = target = el.scrollLeft;
			const dy = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaY;
			target = Math.min(max(), Math.max(0, target + dy));
			if (!raf) raf = requestAnimationFrame(step);
		};

		// Mouse drag (touch and pen scroll natively). The pointer is captured
		// only once it has moved, so a plain click stays a click.
		let down: { x: number; left: number; id: number } | null = null;
		let dragging = false;
		const onDown = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse' || e.button !== 0 || !mq.matches) return;
			cancelAnimationFrame(raf);
			raf = 0;
			down = { x: e.clientX, left: el.scrollLeft, id: e.pointerId };
		};
		const onMove = (e: PointerEvent) => {
			if (!down) return;
			const dx = e.clientX - down.x;
			if (!dragging && Math.abs(dx) > DRAG_THRESHOLD) {
				dragging = true;
				el.setPointerCapture(down.id);
				el.classList.add('is-dragging');
			}
			if (dragging) el.scrollLeft = down.left - dx;
		};
		const onUp = () => {
			down = null;
			dragging = false;
			el.classList.remove('is-dragging');
		};
		const noNativeDrag = (e: DragEvent) => e.preventDefault();

		window.addEventListener('wheel', onWheel, { passive: false });
		el.addEventListener('pointerdown', onDown);
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerup', onUp);
		el.addEventListener('pointercancel', onUp);
		el.addEventListener('dragstart', noNativeDrag);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('wheel', onWheel);
			el.removeEventListener('pointerdown', onDown);
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerup', onUp);
			el.removeEventListener('pointercancel', onUp);
			el.removeEventListener('dragstart', noNativeDrag);
		};
	});

	// Esc closes the summary.
	$effect(() => {
		if (!summary) return;
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (summary = false);
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// A new work starts on its images.
	$effect(() => {
		void work.slug;
		summary = false;
	});

	// Flags the work page on <html> so its SP title block (the shared
	// Aside) can take this page's own spacing.
	$effect(() => {
		document.documentElement.classList.add('is-work');
		return () => document.documentElement.classList.remove('is-work');
	});

	// The strip is 75% of the screen tall: an image is that × its ratio wide.
	const STRIP_VH = 75;
	const sizesOf = (m: { width?: number; height?: number }, sp: string) =>
		`(min-width: 1024px) calc(${STRIP_VH}vh * ${arOf(m).toFixed(3)}), ${sp}`;
	const HERO_WIDTHS = [640, 900, 1400, 2000, 2800];
	const REST_WIDTHS = [640, 900, 1400, 2000, 2800];
	// The work page is where the photographs are looked at closely: a higher
	// encode than the site default (72) — about +30% bytes.
	const QUALITY = 85;

	/** w/h of a media's box (videos: 16:9 until known). */
	const arOf = (m: { width?: number; height?: number }) =>
		m.width && m.height ? m.width / m.height : 16 / 9;

	const hasSummary = $derived(!!(work.lead || work.body || work.colophon.length));
</script>

{#key work.slug}
	<article class="Work" class:has-text={!!(work.lead || work.body)} class:is-summary={summary}>
		<!-- SP: the scope above the hero (PC: in the band). -->
		{#if work.scope.length}
			<p class="scope t-eyebrow" aria-label="Scope">{work.scope.join(' / ')}</p>
		{/if}

		<!-- PC: the band over the strip. -->
		<div class="band">
			<div class="b-name">
				<h1>{work.title}</h1>
				<p class="b-number">{data.aside.eyebrow}</p>
			</div>
			<div class="b-summary">
				{#if hasSummary}
					<button type="button" aria-expanded={summary} aria-controls="work-summary" onclick={() => (summary = !summary)}
						>{summary ? 'Images' : 'Summary'}</button
					>
				{/if}
				{#if summary}<LangSwitch />{/if}
			</div>
			{#if work.scope.length}
				<ul class="b-scope" aria-label="Scope">
					{#each work.scope as tag (tag)}<li>{tag}</li>{/each}
				</ul>
			{/if}
			<a class="b-back" href="/works">Back <span aria-hidden="true">×</span></a>
		</div>

		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class="strip" bind:this={strip} tabindex="0" aria-label="Images">
			{#if work.hero}
				<div class="hero" style="--ar: {arOf(work.hero)}; --ar-sp: {spRatio(work.hero)}">
					<Media
						media={work.hero}
						cover
						eager
						sizes={sizesOf(work.hero, '100vw')}
						widths={HERO_WIDTHS}
						quality={QUALITY}
						alt={work.title}
					/>
				</div>
			{/if}

			{#if work.rest.length}
				<div class="rest">
					{#each work.rest as media, i (i)}
						<div class="rest-item" style="--ar: {arOf(media)}">
							<Media {media} cover sizes={sizesOf(media, 'calc(100vw - 40px)')} widths={REST_WIDTHS} quality={QUALITY} />
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="summary" id="work-summary">
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
							<!-- Its "?" line breaks apply on PC only (SP runs it on). -->
							<h2 class="lead t-subtitle x-ja" class:is-only={!work.lead.en} lang="ja">
								{#each work.lead.ja.split('\n') as line, i (i)}{#if i}<br class="pc-br" />{/if}{line}{/each}
							</h2>
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
		</div>
	</article>
{/key}

<style>
	/* ── SP (Figma 128:376) ─────────────────────────────────────────────
	   hero full-bleed · lead 24px at x=20 · body 11px / 1.5 in 353px ·
	   the other images 353px wide, 20px apart ·
	   Colophon. Every image keeps its own aspect ratio — nothing is
	   cropped (Figma's fixed 393 × 376 / 197 × 264 + 194 × 159 boxes were
	   placeholders). */

	/* SP: the title block sits 120px down with 60px under it. */
	@media (max-width: 1023.98px) {
		:global(html.is-work .Aside) {
			min-height: auto;
			padding-top: 120px;
			padding-bottom: 60px;
		}
	}

	.scope {
		padding: 0 var(--gutter) 20px;
		opacity: 0.3;
		font-size: 12.5px;
		font-weight: var(--fw-regular); /* 450 */
		letter-spacing: 0;
		text-transform: none;
		text-align: center;
	}

	/* The hero's box takes the image's own ratio (so `cover` crops nothing);
	   on PC it's also at least a screen tall. */
	.hero {
		/* width:100% explicit — with aspect-ratio + the PC min-height, an
		   auto width would be derived from the min-height through the ratio
		   and overflow the panel (e.g. a 16:9 video hero). */
		width: 100%;
		aspect-ratio: var(--ar-sp); /* the mobile thumbnail's, if any */
	}

	.text {
		padding: 40px var(--gutter) 0;
	}

	.lead {
		white-space: pre-line;
		font-weight: 480;
	}

	/* English text block: a quieter lead (capitalized, not uppercase) and a
	   lighter body. */
	.lead:lang(en) {
		font-size: 24px;
		text-transform: capitalize;
		letter-spacing: 0;
	}

	.body:lang(en) {
		font-size: 14px;
		opacity: 0.5;
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

	/* The Japanese lead keeps its Latin words as written (no uppercase). */
	.lead:lang(ja) {
		line-height: 1.4;
		text-transform: none;
	}

	/* SP: the Japanese lead runs on as one paragraph; the body is set
	   smaller and looser. */
	@media (max-width: 1023.98px) {
		.pc-br {
			display: none;
		}

		.body:lang(ja) {
			max-width: max-content;
			font-size: 13.5px;
			line-height: 1.7;
		}
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

	/* SP: one column — the band is PC only; the strip and the summary
	   dissolve so their pieces fall into the column in reading order. */
	@media (max-width: 1023.98px) {
		.Work {
			display: flex;
			flex-direction: column;
		}

		.band {
			display: none;
		}

		.strip,
		.summary {
			display: contents;
		}

		.scope {
			order: 1;
		}

		.hero {
			order: 2;
		}

		.text {
			order: 3;
		}

		.rest {
			order: 4;
		}

		.Colophon {
			order: 5;
		}

		/* `cover` keeps the box's ratio: the images' own on SP. */
		.rest-item {
			aspect-ratio: var(--ar);
		}
	}

	/* ── PC (after studiosly.com.au/project/forest) ─────────────────────
	   One screen: the band (25%) — name and number · Summary · scope ·
	   Back, in columns at 0 / 40% / 81% / the right edge — over the strip
	   (75%): every image at the strip's height and its own ratio, 10px
	   apart, run sideways. The summary covers the strip. */
	@media (min-width: 1024px) {
		.Work {
			position: relative;
			height: 100vh;
			height: 100dvh;
			overflow: hidden;
		}

		.scope {
			display: none;
		}

		.band {
			display: grid;
			grid-template-columns: 40% 41% 1fr auto;
			align-items: start;
			height: 25vh;
			height: 25dvh;
			/* the band's text 94px above the strip (Studio Sly) */
			padding: max(64px, calc(25dvh - 94px)) var(--gutter) 0;
			font-size: 12.5px;
			line-height: 15px;
		}

		.band h1 {
			font: inherit;
			text-transform: none;
			letter-spacing: 0;
		}

		.b-number {
			color: var(--color-text-mute);
		}

		.b-summary {
			display: flex;
			gap: 24px;
		}

		.b-summary button {
			padding: 0;
			border: 0;
			background: none;
			color: inherit;
			font: inherit;
			text-decoration: underline;
			text-underline-offset: 0.2em;
			text-decoration-thickness: 1px;
			cursor: pointer;
		}

		.b-back {
			transition: opacity 0.3s ease;
		}

		.b-back:hover,
		.b-summary button:hover {
			opacity: 0.5;
		}

		.strip,
		.summary {
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 75vh;
			height: 75dvh;
		}

		.strip {
			display: flex;
			gap: 10px;
			overflow-x: auto;
			overflow-y: hidden;
			overscroll-behavior-x: contain;
			scrollbar-width: none;
			outline: none;
			cursor: grab;
		}

		.strip::-webkit-scrollbar {
			display: none;
		}

		.strip:global(.is-dragging) {
			cursor: grabbing;
			user-select: none;
		}

		.rest {
			display: contents;
		}

		.hero,
		.rest-item {
			flex: none;
			width: auto;
			height: 100%;
			aspect-ratio: var(--ar);
		}

		.strip :global(img) {
			-webkit-user-drag: none;
		}

		/* Over the strip: the lead at the left, the body and the colophon
		   from the Summary column (40%). */
		.summary {
			z-index: 1;
			display: grid;
			grid-template-columns: 40% minmax(0, 600px);
			align-content: start;
			column-gap: 0;
			padding: 0 var(--gutter) 80px;
			background: var(--color-bg);
			overflow-y: auto;
			overscroll-behavior: contain;
			opacity: 0;
			visibility: hidden;
			transition:
				opacity 0.5s var(--ease-out),
				visibility 0s linear 0.5s;
		}

		.is-summary .summary {
			opacity: 1;
			visibility: visible;
			transition: opacity 0.5s var(--ease-out);
		}

		.text {
			display: contents;
		}

		.lead {
			grid-column: 1;
			padding-right: 40px;
		}

		.body {
			grid-column: 2;
			margin-top: 0;
			max-width: none;
		}

		.body:lang(ja) {
			font-size: 14px;
		}

		.Colophon {
			grid-column: 2;
			padding: 60px 0 0;
		}

		.Colophon dl {
			max-width: none;
			margin-top: 28px;
		}
	}
</style>
