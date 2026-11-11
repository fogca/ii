<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import TopReel from '$lib/components/TopReel.svelte';
	import Media from '$lib/components/Media.svelte';
	import GreetingMark from '$lib/components/GreetingMark.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { ABOUT } from '$lib/content/about';
	import { CONTACT_URL, OPENING } from '$lib/js/site';
	import { PROCESS, PROCESS_HEADING, PROCESS_LEAD } from '$lib/content/process';

	let { data } = $props();

	// Top, from the top down: the greeting typing itself, large, black on
	// white (the whole first screen) · the works' film (TopReel), a screen
	// tall, moving a little slower than the page (parallax) · the
	// statement, large · the first six works as a grid, each at its own
	// ratio · the services · an invitation to get in touch, black, full
	// bleed.
	// The statement and services are About's own copy (lib/content/about).
	// The opening is off for now (OPENING in lib/js/site).
	const [INTRO, SERVICES] = ABOUT;
	const PARALLAX = 0.1; // the film travels ±10% of its height against the page

	// The greeting, in the logo's type: "ii! Hello :)", then the "ii"
	// spelt out (GreetingMark).
	const GREETING = 'isobe institute';
	// Once it has been typed, the first screen (PC) eases up to half a
	// screen, bringing the film's top half into view.
	let greeted = $state(false);
	let film = $state<HTMLElement>();

	// PC, once greeted: between the top and the film's top the page moves
	// in one step — a scroll down there glides the film up to the top of
	// the screen, a scroll up glides back to the greeting. Past the film's
	// top, the page scrolls as usual.
	const PC = '(min-width: 1024px)';
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

	const CARD_SIZES = '(min-width: 1024px) 33vw, 50vw';
	const FILM_SIZES = '(min-width: 1024px) 25vw, 100vw';

	// A service shown by stills rather than a film: they crossfade, one
	// every STILL_MS (held on the first with reduced motion).
	const STILL_MS = 2600;
	let stillAt = $state(0);
	$effect(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const id = setInterval(() => stillAt++, STILL_MS);
		return () => clearInterval(id);
	});
</script>

{#if OPENING}
	<Opening slides={data.slides} />
{/if}

<h1 class="hero" class:is-greeted={greeted} aria-label={GREETING}>
	<GreetingMark onDone={() => (greeted = true)} />
</h1>

<section class="film" aria-label="Works film" bind:this={film} use:parallax>
	<TopReel slides={data.slides} />
</section>

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
		{#each data.works as w (w.slug)}
			<li class="reveal" use:reveal>
				<a class="card" href="/works/{w.slug}">
					<div class="thumb">
						<Media media={w.visual} sizes={CARD_SIZES} alt={w.title} />
					</div>
					<p class="caption">
						<span class="num">{w.number}</span>
						<span class="title">{w.title}</span>
					</p>
					{#if w.scope}<p class="scope">{w.scope}</p>{/if}
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
	<ol class="items">
		{#each SERVICES.items ?? [] as item, i (item.name)}
			<li class="item reveal" use:reveal>
				{#if item.stills}
					<div class="item-film">
						{#each item.stills as still, j (still.src)}
							<div class="still" class:is-on={j === stillAt % item.stills.length}>
								<Media media={{ ...still, isVideo: false }} sizes={FILM_SIZES} cover />
							</div>
						{/each}
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
	<p class="process-lead x-en reveal" lang="en" use:reveal>{PROCESS_LEAD.en}</p>
	<p class="process-lead x-ja reveal" lang="ja" use:reveal>{PROCESS_LEAD.ja}</p>
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

<section class="contact" aria-labelledby="home-contact">
	<div class="head">
		<h2 id="home-contact">Contact</h2>
	</div>
	<p class="contact-lead reveal" use:reveal>
		<span class="x-en" lang="en">For new projects, collaborations and any other enquiries.</span><span
			class="x-ja"
			lang="ja">新しいプロジェクトのご相談、協業、その他のお問い合わせはこちらから。</span
		>
	</p>
	<a class="contact-link reveal" href={CONTACT_URL} use:reveal>
		<span class="x-en" lang="en">Get in touch</span><span class="x-ja" lang="ja">お問い合わせ</span>
	</a>
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

	/* The first screen: the greeting across the page (gutter to gutter),
	   black on white. */
	.hero {
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 0 var(--gutter);
	}

	.hero :global(.GreetingMark) {
		width: 100%;
	}

	/* The film, a screen tall; its picture is taller than the frame by the
	   parallax travel on each side and moves within it. */
	.film {
		--py: 0px;
		position: relative;
		height: 100vh;
		height: 100dvh;
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

	.statement {
		padding: 40px var(--gutter) 160px;
	}

	.statement p {
		max-width: 1100px;
		font-size: 24px;
		line-height: 1.45;
		letter-spacing: 0;
	}

	.statement p:lang(ja) {
		font-size: 20px;
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

	.works {
		padding: 0 var(--gutter) 160px;
	}

	/* Each visual at its own ratio; a row's cards hang from its top. */
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: 32px 5px;
	}

	.card {
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

	.caption,
	.scope {
		font-size: 12.5px;
		line-height: 15px;
	}

	.caption {
		display: flex;
		gap: 0.8em;
		margin-top: 10px;
	}

	.num,
	.scope {
		color: var(--color-text-mute);
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

	.still {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 1.2s var(--ease-out);
	}

	.still.is-on {
		opacity: 1;
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

	.process-lead {
		max-width: 760px;
		margin-top: -32px;
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
		text-transform: none;
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

	/* Black, the full width (the gutter keeps its text in the column). */
	.contact {
		padding: 120px var(--gutter) 160px;
		background: #000;
		color: #fff;
		--color-text-mute: rgba(255, 255, 255, 0.5);
	}

	.contact-lead {
		max-width: 1100px;
		font-size: 24px;
		line-height: 1.45;
	}

	.contact-lead :lang(ja) {
		font-size: 20px;
		line-height: 1.8;
	}

	.contact-link {
		display: inline-block;
		margin-top: 40px;
		font-size: 24px;
		line-height: 1.2;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.contact-link:hover {
		opacity: 0.5;
	}

	:global(html.js) .contact-link.reveal {
		transition:
			opacity 1.2s var(--ease-out),
			transform 1.2s var(--ease-out);
	}

	@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
		.hero {
			transition: min-height 1.6s var(--ease-out);
		}
	}

	@media (min-width: 1024px) {
		.hero.is-greeted {
			min-height: 50vh;
			min-height: 50dvh;
		}

		.statement {
			padding: 80px var(--gutter) 240px;
		}

		.statement p {
			font-size: 40px;
			line-height: 1.35;
		}

		.statement p:lang(ja) {
			font-size: 32px;
			line-height: 1.7;
		}

		.works .head {
			font-size: 36px;
			line-height: 1.2;
		}

		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 48px 10px;
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

		.process-lead {
			margin-top: -24px;
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

		.contact {
			padding: 160px var(--gutter) 240px;
		}

		.contact-lead,
		.contact-link {
			font-size: 40px;
			line-height: 1.35;
		}

		.contact-lead :lang(ja) {
			font-size: 32px;
			line-height: 1.7;
		}

		.contact-link {
			margin-top: 56px;
		}
	}
</style>
