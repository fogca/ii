<script lang="ts">
	import { onMount } from 'svelte';
	import Media from './Media.svelte';
	import type { Media as MediaItem } from '$lib/js/works';

	type Slide = { slug: string; title: string; number: string; visual: MediaItem };
	let { slides }: { slides: Slide[] } = $props();

	// Scroll-scrubbed hero slider, after vision.avatr.com's section hand-off
	// (".hOBRs"): every slide stays put — the next one is uncovered from the
	// bottom by clip-path (its image already at its final size and place),
	// while the outgoing image grows from its bottom edge. Nothing slides.
	//
	// One slide per 100lvh of scroll. Within each step:
	//   incoming  clip-path: inset((1 - t) * 100% 0 0 0)   — linear in scroll
	//   outgoing  scale(1 + SCALE_GAIN * easeOutQuad(t)), origin center bottom
	// (AVATR runs the grow just before the reveal; here both share the step
	// so one scroll gesture reads as one transition.)
	const SCALE_GAIN = 0.2; // AVATR: scale(calc(var(--prg0) * .2 + 1))
	const SMOOTHING = 0.14; // per-frame approach of the drawn progress to the scroll position
	const PRELOAD_AHEAD = 1; // slides kept mounted on each side of the current one
	const WIDTHS = [900, 1400, 2000, 2800, 3840];
	const QUALITY = 85; // full-screen photographs: above the site default (72)

	// `sizes` for a full-screen `cover` image. A landscape image in a portrait
	// box is drawn at the box's HEIGHT, i.e. ratio × 100vh wide — far wider
	// than "100vw" (which made phones fetch ~1400px for a ~3800px need).
	// On SP the height-bound width is taken at 2/3 so a 3x phone gets ~2x
	// density: sharp, without decoding 3840px frames for every slide it keeps
	// mounted (iOS kills tabs that hold too many big bitmaps).
	const SP_DENSITY_CAP = 2 / 3;
	const sizesFor = (m: MediaItem): string => {
		if (!m.width || !m.height) return '100vw';
		const ratio = m.width / m.height;
		const ar = `${Math.round(ratio * 1000)}/1000`;
		return [
			`(max-width: 1023.98px) calc(${(ratio * SP_DENSITY_CAP).toFixed(3)} * 100vh)`,
			`(max-aspect-ratio: ${ar}) calc(${ratio.toFixed(3)} * 100vh)`,
			'100vw'
		].join(', ');
	};

	let root = $state<HTMLElement>();
	let slideEls = $state<HTMLElement[]>([]);
	let mediaEls = $state<HTMLElement[]>([]);
	// Media is mounted only near the current slide — all slides share the
	// viewport, so native lazy-loading would otherwise fetch every image
	// (and start every video) at once. Once mounted, a slide stays mounted.
	// (Initial value only, by design — the slide list is fixed per page.)
	// svelte-ignore state_referenced_locally
	let mounted = $state<boolean[]>(slides.map((_, i) => i <= PRELOAD_AHEAD));

	const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let target = 0;
		let drawn = 0;
		let raf = 0;
		let lastIndex = -1;

		const measure = () => {
			if (!root) return;
			const top = root.getBoundingClientRect().top + window.scrollY;
			const step = window.innerHeight;
			target = Math.min(slides.length - 1, Math.max(0, (window.scrollY - top) / step));
		};

		const render = (p: number) => {
			const index = Math.floor(p);
			const t = p - index;
			for (let i = 0; i < slides.length; i++) {
				const slide = slideEls[i];
				const media = mediaEls[i];
				if (!slide || !media) continue;
				// Incoming slide (index + 1) is uncovered by t; everything up to
				// the current one is fully shown, everything after hidden.
				const reveal = i <= index ? 1 : i === index + 1 ? t : 0;
				// Explicit values, never '' — clearing the inline style would fall
				// back to the stylesheet's hidden pre-JS state.
				slide.style.clipPath = reveal >= 1 ? 'none' : `inset(${((1 - reveal) * 100).toFixed(3)}% 0 0 0)`;
				slide.style.visibility = reveal <= 0 ? 'hidden' : 'visible';
				// The outgoing slide grows; earlier ones keep their full growth
				// (they're covered anyway), later ones sit at rest.
				const grow = i < index ? 1 : i === index ? easeOutQuad(t) : 0;
				media.style.transform = reduced || grow <= 0 ? '' : `scale(${(1 + SCALE_GAIN * grow).toFixed(4)})`;
			}
			const current = Math.round(p);
			if (current !== lastIndex) {
				lastIndex = current;
				const lo = Math.max(0, current - PRELOAD_AHEAD);
				const hi = Math.min(slides.length - 1, current + PRELOAD_AHEAD);
				if (mounted.slice(lo, hi + 1).some((m) => !m)) {
					mounted = mounted.map((m, i) => m || (i >= lo && i <= hi));
				}
			}
		};

		const frame = () => {
			drawn += (target - drawn) * (reduced ? 1 : SMOOTHING);
			if (Math.abs(target - drawn) < 0.0005) drawn = target;
			render(drawn);
			raf = drawn === target ? 0 : requestAnimationFrame(frame);
		};

		const kick = () => {
			measure();
			if (!raf) raf = requestAnimationFrame(frame);
		};

		measure();
		drawn = target;
		render(drawn);
		window.addEventListener('scroll', kick, { passive: true });
		window.addEventListener('resize', kick);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', kick);
			window.removeEventListener('resize', kick);
		};
	});
</script>

<!-- One 100lvh step of scroll per slide; the stage stays pinned while the
     steps pass. The anchors are the snap points (one per slide). -->
<section class="ProjectSlider" aria-label="Works" bind:this={root} style="--count: {slides.length}">
	{#each slides as _, i (i)}
		<span class="anchor" style="--i: {i}" aria-hidden="true"></span>
	{/each}

	<div class="stage">
		{#each slides as slide, i (slide.slug)}
			<a class="slide" href="/works/{slide.slug}" style="z-index: {i + 1}" bind:this={slideEls[i]}>
				<div class="media" bind:this={mediaEls[i]}>
					{#if mounted[i]}
						<Media
							media={slide.visual}
							cover
							eager={i === 0}
							sizes={sizesFor(slide.visual)}
							widths={WIDTHS}
							quality={QUALITY}
							alt={slide.title}
						/>
					{/if}
				</div>
				<p class="caption">
					<span class="num">{slide.number}</span>
					<span class="title">{slide.title}</span>
				</p>
			</a>
		{/each}
	</div>
</section>

<style>
	.ProjectSlider {
		position: relative;
		height: calc(var(--count) * 100vh);
		height: calc(var(--count) * 100lvh);
	}

	.anchor {
		position: absolute;
		left: 0;
		top: calc(var(--i) * 100vh);
		top: calc(var(--i) * 100lvh);
		width: 1px;
		height: 100vh;
		height: 100lvh;
		scroll-snap-align: start;
		pointer-events: none;
	}

	.stage {
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100lvh;
		overflow: clip;
	}

	/* Every slide fills the stage and never moves; only its clip changes.
	   Hit-testing follows the clip, so clicks land on whichever slide shows
	   at that point. */
	.slide {
		position: absolute;
		inset: 0;
		display: block;
		overflow: clip;
		background: var(--color-tile);
	}

	.slide:not(:first-child) {
		clip-path: inset(100% 0 0 0);
		visibility: hidden;
	}

	.media {
		position: absolute;
		inset: 0;
		transform-origin: center bottom;
		will-change: transform;
	}

	.media :global(.Media) {
		height: 100%;
	}

	.caption {
		position: absolute;
		left: var(--gutter);
		bottom: calc(18px + env(safe-area-inset-bottom, 0px));
		display: flex;
		gap: 0.8em;
		color: #fff;
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: var(--tracking-title);
		text-transform: uppercase;
	}

	.num {
		opacity: 0.6;
	}

	@media (hover: hover) {
		.title {
			background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat;
			transition: background-size 0.5s var(--ease-out);
		}

		.slide:hover .title {
			background-size: 100% 1px;
		}
	}

	@media (min-width: 1024px) {
		.caption {
			font-size: 16px;
		}
	}
</style>
