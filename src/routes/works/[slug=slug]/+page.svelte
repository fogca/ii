<script lang="ts">
	import Media from '$lib/components/Media.svelte';
	import { spRatio } from '$lib/js/works';

	let { data } = $props();
	const work = $derived(data.work);

	// PC: once the page is scrolled, the left panel's title block (Aside.svelte)
	// is reset at the panel's top left — eyebrow, "PJ: title", "Scope: …"
	// stacked small — and the work's text (lead + body) fades in below. The
	// change is a letter cascade, not a move: the letters drop away one after
	// another, the layout switches, and they drop in again at the new place.
	// It plays on a throwaway copy of the block (split into one span per
	// letter), so the real heading is never re-written — Svelte's DOM and
	// the type's kerning stay intact. SP keeps the text in the flow. Works
	// without text keep the title where it is.
	const SWAP_AFTER = 80; // px of scroll
	const DROP = '0.45em'; // how far each letter travels
	const OUT_MS = 380;
	const IN_MS = 620;
	const STEP_MS = 18; // stagger per letter…
	const STAGGER_MAX_MS = 420; // …squeezed so a long title stays brisk
	const PC_QUERY = '(min-width: 1024px)';

	/** Splits every text node under `root` into inline-block letter spans
	    (words kept unbreakable); returns the letters that are displayed. */
	const splitLetters = (root: HTMLElement): HTMLElement[] => {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const nodes: Text[] = [];
		while (walker.nextNode()) nodes.push(walker.currentNode as Text);
		const letters: HTMLElement[] = [];
		for (const node of nodes) {
			const frag = document.createDocumentFragment();
			for (const part of node.data.split(/(\s+)/)) {
				if (!part) continue;
				if (/^\s+$/.test(part)) {
					frag.append(part);
					continue;
				}
				const word = document.createElement('span');
				word.style.whiteSpace = 'nowrap';
				for (const char of part) {
					const letter = document.createElement('span');
					letter.textContent = char;
					letter.style.display = 'inline-block';
					word.append(letter);
					letters.push(letter);
				}
				frag.append(word);
			}
			node.replaceWith(frag);
		}
		return letters.filter((l) => l.getClientRects().length > 0);
	};

	/** A letter-split copy of the head laid over it, in its current layout. */
	const copyOf = (head: HTMLElement) => {
		const copy = head.cloneNode(true) as HTMLElement;
		copy.setAttribute('aria-hidden', 'true');
		copy.style.transition = 'none';
		copy.style.visibility = '';
		head.after(copy);
		return { copy, letters: splitLetters(copy) };
	};

	const cascade = (letters: HTMLElement[], keyframes: Keyframe[], duration: number, easing: string) => {
		const step = Math.min(STEP_MS, STAGGER_MAX_MS / Math.max(letters.length, 1));
		return Promise.all(
			letters.map(
				(l, i) => l.animate(keyframes, { duration, delay: i * step, easing, fill: 'both' }).finished
			)
		);
	};

	let busy = false;

	const setSwapped = async (html: HTMLElement, on: boolean) => {
		if (busy || html.classList.contains('is-aside-swapped') === on) return;
		const head = document.querySelector<HTMLElement>('.Aside .head');
		const animate =
			!!head && matchMedia(PC_QUERY).matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!animate) {
			html.classList.toggle('is-aside-swapped', on);
			return;
		}
		busy = true;
		head.style.transition = 'none';
		const out = copyOf(head);
		head.style.visibility = 'hidden';
		await cascade(
			out.letters,
			[{ transform: 'none', opacity: 1 }, { transform: `translateY(${DROP})`, opacity: 0 }],
			OUT_MS,
			'cubic-bezier(0.55, 0, 1, 0.45)' // ease-in: they fall away
		);
		out.copy.remove();
		html.classList.toggle('is-aside-swapped', on);
		const inn = copyOf(head);
		await cascade(
			inn.letters,
			[{ transform: `translateY(-${DROP})`, opacity: 0 }, { transform: 'none', opacity: 1 }],
			IN_MS,
			'cubic-bezier(0.22, 1, 0.36, 1)' // --ease-out: they settle
		);
		head.style.visibility = '';
		inn.copy.remove();
		requestAnimationFrame(() => (head.style.transition = ''));
		busy = false;
		// The scroll may have crossed back while this played.
		setSwapped(html, window.scrollY > SWAP_AFTER);
	};

	$effect(() => {
		if (!work.lead && !work.body) return;
		const html = document.documentElement;
		const update = () => setSwapped(html, window.scrollY > SWAP_AFTER);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => {
			window.removeEventListener('scroll', update);
			html.classList.remove('is-aside-swapped');
			// Leaving mid-cascade: drop the copies, show the real heading.
			document.querySelectorAll('.Aside .head[aria-hidden="true"]').forEach((c) => c.remove());
			document.querySelector<HTMLElement>('.Aside .head')?.style.removeProperty('visibility');
			busy = false;
		};
	});

	// Flags the work page on <html> so its SP title block (the shared
	// Aside) can take this page's own spacing.
	$effect(() => {
		document.documentElement.classList.add('is-work');
		return () => document.documentElement.classList.remove('is-work');
	});

	// Panel width on PC = viewport minus the 455/1440 left panel.
	const PANEL = 'calc(100vw - 455 / 1440 * 100vw)';
	const HERO_SIZES = `(min-width: 1024px) ${PANEL}, 100vw`;
	const REST_SIZES = `(min-width: 1024px) ${PANEL}, calc(100vw - 40px)`;
	const HERO_WIDTHS = [640, 900, 1400, 2000, 2800];
	const REST_WIDTHS = [640, 900, 1400, 2000, 2800];
	// The work page is where the photographs are looked at closely: a higher
	// encode than the site default (72) — about +30% bytes.
	const QUALITY = 85;

	/** w/h of the hero's box (videos: 16:9 until known). */
	const arOf = (m: { width?: number; height?: number }) =>
		m.width && m.height ? m.width / m.height : 16 / 9;
</script>

{#key work.slug}
	<article class="Work" class:has-text={!!(work.lead || work.body)}>
		<!-- Scope (CMS select): SP above the hero; PC pinned at the bottom of
		     the left panel, above the legal line. -->
		{#if work.scope.length}
			<p class="scope t-eyebrow" aria-label="Scope">{work.scope.join(' / ')}</p>
		{/if}

		{#if work.hero}
			<div class="hero" style="--ar: {arOf(work.hero)}; --ar-sp: {spRatio(work.hero)}">
				<Media media={work.hero} cover eager sizes={HERO_SIZES} widths={HERO_WIDTHS} quality={QUALITY} alt={work.title} />
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

		{#if work.rest.length}
			<div class="rest">
				{#each work.rest as media, i (i)}
					<div class="rest-item">
						<Media {media} sizes={REST_SIZES} widths={REST_WIDTHS} quality={QUALITY} />
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

	/* ── PC (Figma 79:229) ──────────────────────────────────────────────
	   The panel right of the left column scrolls with the page: the hero,
	   then every other image full width, one under the other, 2px apart;
	   the text moves into the left panel. */
	@media (min-width: 1024px) {
		.hero {
			aspect-ratio: var(--ar);
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
			opacity: 1;
			text-align: left;
		}

		/* A work with text shows its scope in the left panel's moved title
		   block instead (Aside.svelte); one without keeps it down here. */
		.has-text .scope {
			display: none;
		}

		.rest {
			gap: var(--tile-gap);
			margin-top: var(--tile-gap);
			padding: 0;
		}

		/* The text lives in the left panel, shown once the page scrolls
		   (html.is-aside-swapped, set above) under the moved title and
		   scope line. */
		.text {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 48px; /* clear of the legal line */
			z-index: var(--z-content);
			width: var(--aside-w);
			padding: 130px var(--gutter) 24px; /* under the moved title block */
			/* Not a scroll container: the wheel over the panel scrolls the
			   page, like anywhere else. */
			overflow: clip;
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
			transition-delay: 0.45s, 0.45s, 0s; /* after the title has mostly moved */
		}

		.body {
			margin-top: 10px;
			max-width: none;
		}

		.body:lang(ja) {
			font-size: 14px;
		}

		.Colophon {
			padding: 120px var(--gutter) 160px 0;
		}

		/* The rows run the full width of the panel, to the right gutter. */
		.Colophon dl {
			max-width: none;
			margin-top: 28px;
		}
	}
</style>
