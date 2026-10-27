<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import TopReel from '$lib/components/TopReel.svelte';
	import Media from '$lib/components/Media.svelte';
	import { onMount } from 'svelte';
	import { reveal } from '$lib/actions/reveal';
	import { ABOUT } from '$lib/content/about';
	import { CONTACT_URL, OPENING } from '$lib/js/site';

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

	// The greeting types itself as a person would: "Hello! ii", a pause,
	// the "ii" taken back and spelt out — "isobe institute :)". Uneven
	// keystrokes; the caret lit while keys go down, blinking (hard on/off)
	// whenever the hand rests.
	const FIRST = 'Hello! ii';
	const GREETING = 'Hello! isobe institute :)';
	const TYPE_START_MS = 700;
	const KEY_MS = 80; // fastest keystroke…
	const KEY_SPREAD_MS = 110; // …plus up to this much, at random
	const PAUSE_MS = 1000; // looking at "ii" before taking it back
	const BACKSPACE_MS = 90;
	const IDLE_AFTER_MS = 300; // no key for this long: the caret blinks
	let typed = $state('');
	let typing = $state(false);

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			typed = GREETING;
			return;
		}
		// The script: every keystroke's time and the text after it.
		const steps: { at: number; text: string }[] = [];
		let at = TYPE_START_MS;
		const typeOn = (from: string, to: string) => {
			for (let k = from.length + 1; k <= to.length; k++) {
				steps.push({ at, text: to.slice(0, k) });
				at += KEY_MS + Math.random() * KEY_SPREAD_MS;
			}
		};
		typeOn('', FIRST);
		at += PAUSE_MS;
		const kept = 'Hello! ';
		for (let k = FIRST.length - 1; k >= kept.length; k--) {
			steps.push({ at, text: FIRST.slice(0, k) });
			at += BACKSPACE_MS;
		}
		at += KEY_MS * 2;
		typeOn(kept, GREETING);

		const timers: number[] = [];
		let idle = 0;
		for (const step of steps) {
			timers.push(
				window.setTimeout(() => {
					typing = true;
					typed = step.text;
					clearTimeout(idle);
					idle = window.setTimeout(() => (typing = false), IDLE_AFTER_MS);
				}, step.at)
			);
		}
		return () => {
			timers.forEach((t) => clearTimeout(t));
			clearTimeout(idle);
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
		return {
			destroy() {
				cancelAnimationFrame(raf);
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', onScroll);
			}
		};
	}

	const CARD_SIZES = '(min-width: 1024px) 33vw, 50vw';
</script>

{#if OPENING}
	<Opening slides={data.slides} />
{/if}

<h1 class="hero" aria-label={GREETING}>
	<span class="greeting" aria-hidden="true">{typed}<span class="caret" class:is-typing={typing}></span></span>
</h1>

<section class="film" aria-label="Works film" use:parallax>
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

	/* The first screen: the greeting across the page, black on white. */
	.hero {
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 0 var(--gutter);
		/* the full greeting near the full width (the content's, on large
		   desktops) */
		font-size: min(8.6vw, calc(0.086 * var(--content-max, 100vw)));
		font-weight: 450;
		line-height: 1;
		letter-spacing: 0;
		text-transform: none;
		white-space: pre;
	}

	/* A thin bar the height of the capitals: lit while typing, blinking
	   (hard on/off) at rest. */
	.caret {
		display: inline-block;
		width: max(2px, 0.025em);
		height: 0.8em;
		margin-left: 0.04em;
		vertical-align: -0.06em;
		background: currentColor;
		animation: caret-blink 1.06s steps(1, end) infinite;
	}

	.caret.is-typing {
		animation: none;
	}

	@keyframes caret-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
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

	@media (min-width: 1024px) {
		.statement {
			padding: 40px var(--gutter) 240px;
		}

		.statement p {
			font-size: 40px;
			line-height: 1.35;
		}

		.statement p:lang(ja) {
			font-size: 32px;
			line-height: 1.7;
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
