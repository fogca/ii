<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import TopReel from '$lib/components/TopReel.svelte';
	import Media from '$lib/components/Media.svelte';
	import GreetingMark from '$lib/components/GreetingMark.svelte';
	import StillSlider from '$lib/components/StillSlider.svelte';
	import StrategyMotion from '$lib/components/StrategyMotion.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { ABOUT } from '$lib/content/about';
	import { OPENING } from '$lib/js/site';
	import { ui } from '$lib/state/ui.svelte';
	import { PROCESS, PROCESS_HEADING, PROCESS_LEAD } from '$lib/content/process';

	let { data } = $props();

	// Top, from the top down: the greeting, typed in the middle of the
	// screen, then risen to be the logotype · the statement right under it ·
	// nine works as a grid from half the screen down (SP squares; PC each at
	// its own ratio) · the services · the process (the footer then invites
	// contact). The works' film (TopReel) is off for now (FILM_ON).
	// The statement and services are About's own copy (lib/content/about).
	// The opening is off for now (OPENING in lib/js/site).
	const [INTRO, SERVICES] = ABOUT;
	const PARALLAX = 0.1; // the film travels ±10% of its height against the page

	// The greeting, in the logo's type: "ii! Hello :)", then the "ii"
	// spelt out (GreetingMark).
	const GREETING = 'isobe institute';
	// As "Hello :)" has been typed (not the whole line), the first screen
	// eases up to half a screen, bringing the film's top half into view.
	let greeted = $state(false);
	let film = $state<HTMLElement>();

	// PC, once greeted: between the top and the film's top the page moves
	// in one step — a scroll down there glides the film up to the top of
	// the screen, a scroll up glides back to the greeting. Past the film's
	// top, the page scrolls as usual.
	const PC = '(min-width: 1024px)';

	// The film (and PC's one-step glide onto it) is off for now.
	const FILM_ON = false;
	const SNAP_MS = 700;
	// After a glide, the trackpad's coasting wheel (deltas dying away) is
	// swallowed, but never for longer than this — and a fresh swipe (a delta
	// growing again) goes straight through, so the page below is one more
	// scroll away, not a wait.
	const SNAP_HOLD_MS = 350;
	const SNAP_QUIET_MS = 120; // no wheel for this long: the coasting has stopped
	const SNAP_EDGE = 2; // px of slack at the stops
	const easeOut = (t: number) => 1 - (1 - t) ** 4; // moves at once, settles softly

	$effect(() => {
		if (!greeted || !film || !matchMedia(PC).matches) return;
		const el = film;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let raf = 0;
		let gliding = false;
		let quietTimer = 0;
		let holdUntil = 0; // swallow coasting wheel until then at the latest
		let lastDelta = 0;
		const filmTop = () => el.getBoundingClientRect().top + scrollY;

		/** The direction to glide in, if this scroll starts one. */
		const snapFor = (down: boolean): 'film' | 'top' | null => {
			const y = scrollY;
			const top = filmTop();
			if (down) return y < top - SNAP_EDGE ? 'film' : null;
			return y > 0 && y <= top + SNAP_EDGE ? 'top' : null;
		};

		const glide = (to: 'film' | 'top') => {
			const from = scrollY;
			// The film's top is read every frame: it may still be moving
			// (the greeting easing to half a screen).
			const target = () => (to === 'film' ? filmTop() : 0);
			if (reduced) return scrollTo({ top: target(), behavior: 'instant' });
			gliding = true;
			const start = performance.now();
			const step = (now: number) => {
				const t = Math.min(1, (now - start) / SNAP_MS);
				scrollTo({ top: from + (target() - from) * easeOut(t), behavior: 'instant' });
				if (t < 1) raf = requestAnimationFrame(step);
				else {
					gliding = false;
					holdUntil = performance.now() + SNAP_HOLD_MS;
				}
			};
			raf = requestAnimationFrame(step);
		};

		const swallowUntilQuiet = () => {
			clearTimeout(quietTimer);
			quietTimer = window.setTimeout(() => (quietTimer = 0), SNAP_QUIET_MS);
		};

		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // pinch, sideways
			const d = Math.abs(e.deltaY);
			const coasting = quietTimer && performance.now() < holdUntil && d <= lastDelta;
			lastDelta = d;
			if (gliding || coasting) {
				e.preventDefault();
				swallowUntilQuiet();
				return;
			}
			const to = snapFor(e.deltaY > 0);
			if (!to) return;
			e.preventDefault();
			swallowUntilQuiet();
			holdUntil = Infinity; // until the glide ends
			glide(to);
		};

		const KEYS_DOWN = ['ArrowDown', 'PageDown', ' '];
		const KEYS_UP = ['ArrowUp', 'PageUp'];
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (t.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.altKey || e.ctrlKey) return;
			const down = KEYS_DOWN.includes(e.key) && !e.shiftKey;
			const up = KEYS_UP.includes(e.key) || (e.key === ' ' && e.shiftKey);
			if (!down && !up) return;
			if (gliding) return e.preventDefault();
			const to = snapFor(down);
			if (!to) return;
			e.preventDefault();
			glide(to);
		};

		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('keydown', onKey);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(quietTimer);
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', onKey);
		};
	});

	// The greeting is the logotype. It types at the middle of the screen with
	// nothing else showing; once typed it rises and the page comes up under
	// it. There is no header at first; on the first scroll the greeting is
	// edited down to "ii" as it rises, and where it reaches the header's place
	// the header's own mark takes over. Past the middle of the page only the
	// dots stay.
	const SHORTEN_AT = 8; // px of scroll
	const SETTLE_MS = 420; // the shortening and shrinking, seen through before the swap
	// The header mark's width and top (Header --mark-w, --mark-y).
	const MARK_SP = { w: 28, y: 18.22 };
	const MARK_PC = { w: 31.76, y: 21.22 };
	let hero = $state<HTMLElement>();
	/** The "ii" in the greeting, as shares of its width (GreetingMark). */
	let markBox = $state<{ top: number; width: number; height: number }>();
	let lifted = $state(false); // typed: risen from the middle
	let isShort = $state(false);
	let settled = $state(false);

	$effect(() => {
		if (!isShort) {
			settled = false;
			return;
		}
		const timer = setTimeout(() => (settled = true), SETTLE_MS);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		if (!hero || !markBox) return;
		const el = hero;
		const box = markBox;
		const done = settled;
		const mq = matchMedia(PC);
		let raf = 0;
		const update = () => {
			raf = 0;
			const mark = mq.matches ? MARK_PC : MARK_SP;
			const style = getComputedStyle(el);
			const width = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
			const safeTop = parseFloat(style.getPropertyValue('--safe-top')) || 0;
			const markTop = box.top * width;
			const stick = mark.y + safeTop - markTop;
			const travel = parseFloat(style.marginTop) - stick;
			el.style.setProperty('--stick', `${stick}px`);
			el.style.setProperty('--mark-top', `${markTop}px`);
			el.style.setProperty('--mark-scale', `${mark.w / (box.width * width)}`);
			const y = scrollY;
			const middle = (document.documentElement.scrollHeight - innerHeight) / 2;
			isShort = y > SHORTEN_AT;
			ui.homeMark = !done || y < travel ? 'hidden' : y < middle ? 'ii' : 'dots';
		};
		const onScroll = () => (raf ||= requestAnimationFrame(update));
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	// Leaving the page, the header goes back to its own ways.
	$effect(() => () => (ui.homeMark = 'hidden'));

	// <html> flag: the SP header reads in difference over white and film.
	$effect(() => {
		document.documentElement.classList.add('is-top');
		return () => document.documentElement.classList.remove('is-top');
	});

	/** Shifts the film inside its frame as the frame crosses the screen:
	    -PARALLAX (entering at the bottom) → +PARALLAX (leaving at the top). */
	function parallax(node: HTMLElement) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let raf = 0;
		const update = () => {
			raf = 0;
			const r = node.getBoundingClientRect();
			const vh = window.innerHeight;
			if (r.bottom < 0 || r.top > vh) return;
			const t = (vh - r.top) / (vh + r.height); // 0 → 1 across the screen
			node.style.setProperty('--py', `${((t - 0.5) * 2 * PARALLAX * r.height).toFixed(1)}px`);
		};
		const onScroll = () => (raf ||= requestAnimationFrame(update));
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		// The page above can change height without a scroll (the first
		// screen easing to half): follow it frame by frame.
		const ro = new ResizeObserver(onScroll);
		ro.observe(document.body);
		return {
			destroy() {
				cancelAnimationFrame(raf);
				ro.disconnect();
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', onScroll);
			}
		};
	}

	// SP crops every card to a square, so a landscape visual needs a source
	// wider than its tile (the big tiles are every third one).
	const CARD_SIZES = '(min-width: 1024px) 33vw, 75vw';
	const BIG_CARD_SIZES = '(min-width: 1024px) 33vw, 160vw';
	const FILM_SIZES = '(min-width: 1024px) 25vw, 100vw';
</script>

{#if OPENING}
	<Opening slides={data.slides} />
{/if}

<h1
	class="hero"
	class:is-lifted={lifted}
	class:is-short={isShort}
	class:is-handed={ui.homeMark !== 'hidden'}
	aria-label={GREETING}
	bind:this={hero}
>
	<GreetingMark
		short={isShort}
		onHello={() => (greeted = true)}
		onDone={() => (lifted = true)}
		onMarkBox={(box) => (markBox = box)}
	/>
</h1>

{#if FILM_ON}
	<section class="film" aria-label="Works film" bind:this={film} use:parallax>
		<TopReel slides={data.slides} />
	</section>
{/if}

<section class="statement" aria-label="Introduction">
	<p class="x-en reveal" lang="en" use:reveal>{INTRO.body?.en}</p>
	<p class="x-ja reveal" lang="ja" use:reveal>{INTRO.body?.ja}</p>
</section>

<section class="works" aria-labelledby="home-works">
	<div class="head">
		<h2 id="home-works">Works</h2>
		<a href="/works">View all</a>
	</div>
	<ul class="grid">
		{#each data.works as w, i (w.slug)}
			<li class="reveal" use:reveal>
				<a class="card" href="/works/{w.slug}">
					<div class="thumb">
						<Media media={w.visual} sizes={i % 3 === 0 ? BIG_CARD_SIZES : CARD_SIZES} alt={w.title} />
					</div>
					<div class="meta">
						<p class="caption">
							<span class="title">{w.title}</span>
						</p>
						{#if w.scope}<p class="scope">{w.scope}</p>{/if}
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>

<section class="services" aria-labelledby="home-services">
	<div class="head">
		<h2 id="home-services">Services</h2>
		<a href="/about">Institute</a>
	</div>
	{#if SERVICES.heading}
		<p class="services-heading reveal" use:reveal>
			<span class="x-en" lang="en">{SERVICES.heading.en}</span><span class="x-ja" lang="ja">{SERVICES.heading.ja}</span>
		</p>
	{/if}
	{#if SERVICES.body}
		<p class="section-lead x-en reveal" lang="en" use:reveal>{SERVICES.body.en}</p>
		<p class="section-lead x-ja reveal" lang="ja" use:reveal>{SERVICES.body.ja}</p>
	{/if}
	<ol class="items">
		{#each SERVICES.items ?? [] as item, i (item.name)}
			<li class="item reveal" use:reveal>
				{#if item.motion === 'strategy'}
					<div class="item-film"><StrategyMotion /></div>
				{:else if item.stills}
					<div class="item-film">
						<StillSlider stills={item.stills} />
					</div>
				{:else if item.film}
					<div class="item-film">
						<Media media={{ src: item.film, isVideo: true }} sizes={FILM_SIZES} cover />
					</div>
				{/if}
				<p class="item-num">{String(i + 1).padStart(2, '0')}</p>
				<h3 class="item-name">
					<span class="x-en" lang="en">{item.name}</span><span class="x-ja" lang="ja">{item.nameJa}</span>
				</h3>
				<p class="item-body x-en" lang="en">{item.body.en}</p>
				<p class="item-body x-ja" lang="ja">{item.body.ja}</p>
			</li>
		{/each}
	</ol>
</section>

<!-- How we work: a loop of four phases, each with the work it holds —
     numbered rows between hairlines (et cetera's About Services). -->
<section class="process" aria-labelledby="home-process">
	<div class="head">
		<h2 id="home-process">Process</h2>
	</div>
	<p class="services-heading reveal" use:reveal>
		<span class="x-en" lang="en">{PROCESS_HEADING.en}</span><span class="x-ja" lang="ja">{PROCESS_HEADING.ja}</span>
	</p>
	<p class="section-lead x-en reveal" lang="en" use:reveal>{PROCESS_LEAD.en}</p>
	<p class="section-lead x-ja reveal" lang="ja" use:reveal>{PROCESS_LEAD.ja}</p>
	<ol class="phases">
		{#each PROCESS as phase, i (phase.name)}
			<li class="phase reveal" use:reveal>
				<p class="phase-num">{String(i + 1).padStart(2, '0')}</p>
				<div class="phase-title">
					<h3 class="phase-name" lang="en">{phase.name}</h3>
					<p class="phase-label">
						<span class="x-en" lang="en">{phase.label.en}</span><span class="x-ja" lang="ja">{phase.label.ja}</span>
					</p>
				</div>
				<div class="phase-text">
					<p class="phase-body x-en" lang="en">{phase.body.en}</p>
					<p class="phase-body x-ja" lang="ja">{phase.body.ja}</p>
					<ul class="tasks">
						{#each phase.tasks as task (task.en)}
							<li><span class="x-en" lang="en">{task.en}</span><span class="x-ja" lang="ja">{task.ja}</span></li>
						{/each}
					</ul>
				</div>
			</li>
		{/each}
	</ol>
</section>

<style>
	:global(html[data-lang='ja']) .x-en,
	:global(html:not([data-lang='ja'])) .x-ja {
		display: none;
	}

	/* Fades up as it comes into view (JS only — without it, just shown). */
	:global(html.js) .reveal {
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 1.2s var(--ease-out),
			transform 1.2s var(--ease-out);
	}

	:global(html.js) .reveal:global(.is-in) {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html.js) .reveal {
			opacity: 1;
			transform: none;
		}
	}

	/* The first screen: the logotype (gutter to gutter), the statement right
	   under it, and the first work from half the screen down. The logotype
	   sticks where the header's mark sits, shrinking to its size on the way. */
	.hero {
		--safe-top: env(safe-area-inset-top, 0px);
		--intro-top: 12vh;
		--intro-top: 12svh;
		position: sticky;
		top: var(--stick, 0px);
		z-index: 2;
		margin-top: var(--intro-top);
		padding: 0 var(--gutter);
		pointer-events: none;
	}

	.hero :global(.GreetingMark) {
		width: 100%;
		transform-origin: 50% var(--mark-top, 0px);
		transition: transform 0.4s var(--ease-out);
	}

	.hero.is-short :global(.GreetingMark) {
		transform: scale(var(--mark-scale, 1));
	}

	/* The header's mark is showing in its place. */
	.hero.is-handed {
		visibility: hidden;
	}

	/* While it types it sits in the middle of the screen, alone; typed, it
	   rises, and everything else comes up a little as it appears. */
	:global(html.js) .hero:not(.is-lifted) {
		transform: translateY(calc(50vh - var(--intro-top) - 50%));
		transform: translateY(calc(50svh - var(--intro-top) - 50%));
	}

	:global(html.js) .hero:not(.is-lifted) ~ section {
		opacity: 0;
		transform: translateY(40px);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero {
			transition: transform 1.2s var(--ease-out);
		}

		.hero ~ section {
			transition:
				opacity 1.2s var(--ease-out) 0.15s,
				transform 1.2s var(--ease-out) 0.15s;
		}
	}

	/* The film, a screen tall; its picture is taller than the frame by the
	   parallax travel on each side and moves within it. */
	.film {
		--py: 0px;
		position: relative;
		height: 75vh;
		height: 75dvh;
		overflow: clip;
	}

	.film :global(.TopReel) {
		height: 100%;
	}

	.film :global(.TopReel .stage) {
		inset: -10% 0;
		transform: translateY(var(--py));
		will-change: transform;
	}

	/* Fills what is left of the first half (above it, --intro-top and the
	   logotype, as tall as 9.15 / 73.66 of its width). */
	.statement {
		min-height: calc(38vh - (100vw - 2 * var(--gutter)) * 0.1242);
		min-height: calc(38svh - (100vw - 2 * var(--gutter)) * 0.1242);
		padding: 28px var(--gutter) 24px;
	}

	.statement p {
		max-width: 1100px;
		font-size: 12.5px;
		line-height: 1.6;
		letter-spacing: 0;
	}

	.statement p:lang(ja) {
		line-height: 1.8;
	}

	/* Section heads: the name at the left, a link onward at the right. */
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 24px;
		font-size: 12.5px;
		line-height: 15px;
	}

	.head h2 {
		font: inherit;
		text-transform: none;
		letter-spacing: 0;
	}

	.head a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
		transition: opacity 0.3s ease;
	}

	.head a:hover {
		opacity: 0.5;
	}

	/* The cards come first; the "Works" name is off (still read aloud) and
	   "View all" follows them. */
	.works {
		display: flex;
		flex-direction: column;
		padding: 0 var(--gutter) 160px;
	}

	.works .head {
		order: 1;
		justify-content: flex-end;
		margin: 24px 0 0;
	}

	.works .head h2 {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* Each visual at its own ratio; a row's cards hang from its top. */
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: 5px;
	}

	/* SP: the cards run to 5px from the edges, as the work page's images do. */
	@media (max-width: 1023.98px) {
		.works {
			padding-inline: 5px;
		}

		.works .head {
			padding-inline: calc(var(--gutter) - 5px);
		}

		/* Rows of 1 · 2 · 1 · 2 …: every third card runs full width, the
		   ones between pair up. */
		.works .grid > li:nth-child(3n + 1) {
			grid-column: 1 / -1;
		}

		/* Big and small alike, every card is a square (the visual is cropped
		   to fill it). */
		.works .thumb :global(.Media) {
			aspect-ratio: 1;
		}
	}

	.card {
		position: relative;
		display: block;
	}

	.thumb {
		overflow: clip;
	}

	.thumb :global(.Media) {
		transition: transform 1.2s var(--ease-out);
	}

	.card:hover .thumb :global(.Media) {
		transform: scale(1.03);
	}

	/* Title and scope sit on the visual, bottom left, in difference
	   against it. */
	.meta {
		position: absolute;
		right: 8px;
		bottom: 8px;
		left: 8px;
		color: #fff;
		mix-blend-mode: difference;
		pointer-events: none;
	}

	.meta p,
	.meta span {
		color: inherit;
		font-size: 9px;
		line-height: 12px;
	}

	.services {
		padding: 0 var(--gutter) 200px;
	}

	.services-heading {
		max-width: 1100px;
		margin-bottom: 56px;
		font-size: 24px;
		line-height: 1.45;
	}

	.items {
		display: grid;
		gap: 40px;
	}

	/* 16:9, the film cropped to fill. */
	.item-film {
		aspect-ratio: 16 / 9;
		margin-bottom: 16px;
		overflow: clip;
		background: #f4f4f4;
	}

	.item-film {
		position: relative;
	}

	.item-film :global(.Media) {
		width: 100%;
		height: 100%;
	}

	.item-num {
		color: var(--color-text-mute);
		font-size: 12.5px;
		line-height: 15px;
	}

	.item-name {
		margin-top: 12px;
		font-size: 16px;
		font-weight: var(--fw-medium);
		line-height: 1.4;
		text-transform: none;
		letter-spacing: 0;
	}

	.item-body {
		margin-top: 10px;
		font-size: 13.5px;
		line-height: 1.7;
	}

	.process {
		padding: 0 var(--gutter) 200px;
	}

	/* "Process" close above its heading. */
	.process .head {
		margin-bottom: 12px;
	}

	/* The lead sits close under the heading (12px; PC 16px). */
	.section-lead {
		max-width: 760px;
		margin-top: -44px;
		margin-bottom: 56px;
		font-size: 13.5px;
		line-height: 1.7;
	}

	/* Numbered rows between hairlines: the number in its own column, the
	   phase and its line, then the text and the work it holds. */
	.phase {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr);
		column-gap: 0;
		padding: 24px 0 32px;
		border-top: 0.5px solid var(--color-line, rgba(0, 0, 0, 0.25));
	}

	.phase:last-child {
		border-bottom: 0.5px solid var(--color-line, rgba(0, 0, 0, 0.25));
	}

	.phase-num,
	.phase-label,
	.tasks {
		color: var(--color-text-mute);
	}

	.phase-num {
		font-size: 12.5px;
		line-height: 1.4;
	}

	.phase-title,
	.phase-text {
		grid-column: 2;
	}

	.phase-name {
		font-size: 16px;
		font-weight: var(--fw-regular);
		line-height: 1.4;
		text-transform: uppercase;
		letter-spacing: 0;
	}

	.phase-label {
		margin-top: 2px;
		font-size: 12.5px;
		line-height: 1.4;
	}

	.phase-text {
		margin-top: 16px;
	}

	.phase-body {
		font-size: 13.5px;
		line-height: 1.7;
	}

	.tasks {
		margin-top: 16px;
		font-size: 12.5px;
		line-height: 1.7;
	}

	@media (min-width: 1024px) {
		.film {
			height: 100vh;
			height: 100dvh;
		}

		.hero {
			--intro-top: 7vh;
			--intro-top: 7svh;
		}

		.statement {
			min-height: calc(43vh - (100vw - 2 * var(--gutter)) * 0.1242);
			min-height: calc(43svh - (100vw - 2 * var(--gutter)) * 0.1242);
			padding-block: 32px;
		}

		.statement p {
			font-size: 28px;
			line-height: 1.4;
		}

		.statement p:lang(ja) {
			font-size: 24px;
			line-height: 1.7;
		}

		.works .head {
			font-size: 16px;
			line-height: 1.2;
		}

		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 10px;
		}

		.services-heading {
			font-size: 40px;
			line-height: 1.35;
		}

		.items {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 24px;
		}

		.item-name {
			font-size: 24px;
		}

		.section-lead {
			margin-top: -40px;
			margin-bottom: 80px;
			font-size: 16px;
		}

		/* number · phase · text, side by side */
		.phase {
			grid-template-columns: 1fr 4fr 7fr;
			column-gap: 24px;
			padding: 32px 0 48px;
		}

		.phase-title {
			grid-column: 2;
		}

		.phase-text {
			grid-column: 3;
			margin-top: 0;
		}

		.phase-num,
		.phase-name {
			font-size: 24px;
			line-height: 1.3;
		}

		.phase-label {
			margin-top: 4px;
			font-size: 16px;
		}

		.phase-body {
			max-width: 640px;
			font-size: 16px;
		}

		.tasks {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 24px;
			margin-top: 24px;
			font-size: 14px;
		}
	}
</style>
