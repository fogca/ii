<script lang="ts">
	import Opening from '$lib/components/Opening.svelte';
	import TopReel from '$lib/components/TopReel.svelte';
	import InstituteMark from '$lib/components/InstituteMark.svelte';
	import Media from '$lib/components/Media.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { ABOUT } from '$lib/content/about';
	import { OPENING } from '$lib/js/site';

	let { data } = $props();

	// Top, from the top down: the wordmark typing itself, large, black on
	// white (the whole first screen) · the works' film (TopReel), a screen
	// tall, moving a little slower than the page (parallax) · the
	// statement, large · the first works as a grid · the services.
	// The statement and services are About's own copy (lib/content/about).
	// The opening is off for now (OPENING in lib/js/site).
	const [INTRO, SERVICES] = ABOUT;
	const PARALLAX = 0.1; // the film travels ±10% of its height against the page

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

<h1 class="hero"><InstituteMark typewriter /></h1>

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
						<Media media={w.visual} cover sizes={CARD_SIZES} alt={w.title} />
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

	/* The first screen: the wordmark across the page, black on white. */
	.hero {
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 0 var(--gutter);
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
		padding: 160px var(--gutter);
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

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 32px 5px;
	}

	.card {
		display: block;
	}

	.thumb {
		aspect-ratio: 4 / 5;
		overflow: clip;
	}

	.thumb :global(.Media) {
		height: 100%;
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

	@media (min-width: 1024px) {
		.statement {
			padding: 240px var(--gutter);
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
	}
</style>
