<script lang="ts">
	import Media from '$lib/components/Media.svelte';
	import LangSwitch from '$lib/components/LangSwitch.svelte';
	import { spRatio } from '$lib/js/works';

	let { data } = $props();
	const work = $derived(data.work);

	// After studiosly.com.au/project/…
	// PC: one screen — a band across the top quarter (DESIGN CREATION NN
	// over the name · Project Overview · scope · Back) over a strip of every
	// image at the same height, each at its own ratio, that the wheel (or a
	// drag, or a trackpad) runs sideways. Project Overview lays the work's
	// text and colophon over the strip.
	// SP: a page that scrolls — the same band, the hero, then the text in
	// the open (no toggle), the other images one under another, the
	// colophon.
	const PC_QUERY = '(min-width: 1024px)';
	const EASE = 0.12; // share of the remaining distance per frame
	const LINE_PX = 40; // wheel "lines" (Firefox) → px
	const DRAG_THRESHOLD = 6; // px before a press becomes a drag

	let strip = $state<HTMLDivElement>();
	let summary = $state(false);

	// PC: vertical wheel → horizontal travel, eased. Horizontal input
	// (trackpad swipes) is left native. The page itself never scrolls.
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

	// PC: the strip is 75% of the screen tall, so an image is that × its
	// ratio wide. SP: the screen's width.
	const STRIP_VH = 75;
	const sizesOf = (ar: number) => `(min-width: 1024px) calc(${STRIP_VH}vh * ${ar.toFixed(3)}), 100vw`;
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
		<!-- The band over the strip. -->
		<div class="band">
			<div class="b-name">
				<p class="b-number">{data.aside.eyebrow}</p>
				<h1>{work.title}</h1>
			</div>
			<div class="b-summary">
				{#if hasSummary}
					<button type="button" aria-expanded={summary} aria-controls="work-summary" onclick={() => (summary = !summary)}
						>{summary ? 'Images' : 'Project Overview'}</button
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
						sizes={sizesOf(arOf(work.hero))}
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
							<Media {media} cover sizes={sizesOf(arOf(media))} widths={REST_WIDTHS} quality={QUALITY} />
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="summary" id="work-summary">
			{#if work.lead || work.body}
				<section class="text">
					<p class="overview" aria-hidden="true">Project Overview</p>
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
	/* After studiosly.com.au/project/forest.
	   Band: DESIGN CREATION NN over the name; PC adds Project Overview ·
	   scope · Back in columns at 0 / 40% / 81% / the right edge; SP puts
	   Back at the right and the scope under the name. */
	.band {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas: 'name back' 'scope scope';
		align-items: start;
		align-content: start;
		font-size: 12.5px;
		line-height: 15px;
	}

	.b-name {
		grid-area: name;
	}

	.band h1 {
		font: inherit;
		text-transform: none;
		letter-spacing: 0;
	}

	.b-number,
	.overview {
		color: var(--color-text-mute);
		text-transform: uppercase;
	}

	.b-summary {
		grid-area: summary;
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

	.b-scope {
		grid-area: scope;
	}

	.b-back {
		grid-area: back;
		justify-self: end;
		transition: opacity 0.3s ease;
	}

	.b-back:hover,
	.b-summary button:hover {
		opacity: 0.5;
	}

	.strip :global(img) {
		-webkit-user-drag: none;
	}

	/* Text */
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
		white-space: pre-line;
	}

	/* The Japanese lead keeps its Latin words as written (no uppercase). */
	.lead:lang(ja) {
		line-height: 1.4;
		text-transform: none;
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

	/* ── SP: a page that scrolls. The band, the hero, the text in the open,
	   the other images one under another (5px apart and from the edges,
	   as the archive), the colophon. The strip and the overview dissolve so
	   their pieces fall into that order. */
	@media (max-width: 1023.98px) {
		.Work {
			display: flex;
			flex-direction: column;
			padding-bottom: 80px;
		}

		.band {
			order: 0;
			row-gap: 0;
			padding: 120px var(--gutter) 40px;
		}

		.b-summary {
			display: none;
		}

		.b-scope {
			display: flex;
			flex-wrap: wrap;
			margin-top: 12px;
		}

		.b-scope li:not(:last-child)::after {
			content: '/';
			margin: 0 0.4em;
			color: var(--color-text-mute);
		}

		.strip,
		.summary,
		.rest {
			display: contents;
		}

		.hero {
			order: 1;
			margin: 0 5px;
			aspect-ratio: var(--ar-sp); /* the mobile thumbnail's, if any */
		}

		.text {
			order: 2;
			padding: 48px var(--gutter) 56px;
		}

		.overview {
			margin-bottom: 16px;
			font-size: 12.5px;
			line-height: 15px;
		}

		.body {
			margin-top: 20px;
		}

		.body:lang(ja) {
			font-size: 13.5px;
			line-height: 1.7;
		}

		.pc-br {
			display: none;
		}

		.rest-item {
			order: 3;
			margin: 5px 5px 0;
			aspect-ratio: var(--ar);
		}

		.Colophon {
			order: 4;
			padding: 60px var(--gutter) 0;
		}

		.Colophon dl {
			margin-top: 20px;
		}
	}

	/* ── PC: one screen — the band (25%) over the strip (75%) of every image
	   at the strip's height and its own ratio, 10px apart, run sideways.
	   Project Overview covers the strip with the lead at the left and the
	   body and colophon from its own column (40%). */
	@media (min-width: 1024px) {
		.Work {
			position: relative;
			height: 100vh;
			height: 100dvh;
			overflow: hidden;
		}

		.band {
			grid-template-columns: 40% 41% 1fr auto;
			grid-template-areas: 'name summary scope back';
			height: 25vh;
			height: 25dvh;
			/* the band's text 94px above the strip (Studio Sly) */
			padding: max(64px, calc(25dvh - 94px)) var(--gutter) 0;
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
			height: 100%;
			aspect-ratio: var(--ar);
		}

		.summary {
			z-index: 1;
			display: grid;
			grid-template-columns: 40% minmax(0, 600px);
			align-content: start;
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

		.overview {
			display: none;
		}

		.lead {
			grid-column: 1;
			padding-right: 40px;
		}

		.body {
			grid-column: 2;
		}

		.body:lang(ja) {
			font-size: 14px;
		}

		.Colophon {
			grid-column: 2;
			padding-top: 60px;
		}

		.Colophon dl {
			margin-top: 28px;
		}
	}
</style>
