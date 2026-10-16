<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { imgOpt, imgSrcset } from '$lib/js/img';
	import InstituteMark from './InstituteMark.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import type { Media } from '$lib/js/works';

	type Slide = { slug: string; title: string; visual: Media };
	let { slides = [] }: { slides?: Slide[] } = $props();

	// Opening, as on Otic (OTIF): on black, works' stills come in one after
	// another, each sliding up from the bottom of a centered card (clip-path)
	// while it zooms in a little, the next starting before the last has
	// finished. The background then turns white while the card settles a
	// little smaller — on Otic its last frame becomes the home page's first
	// card; here the last frame is solid black, and in it the wordmark types
	// itself out (as on About). Then the card opens to the whole screen and
	// the overlay clears onto the film.
	// It plays on every full load of the top page (app.html sets
	// html[data-op]); a client-side return doesn't replay it.
	const FRAMES = 6; // stills, then the black frame
	const START = 0.3;
	const REVEAL = 1.2; // one frame's slide-up (Otic)
	const STAGGER = 0.35; // the next frame starts this long after the last (Otic)
	const ZOOM = 1.1; // each still grows 1 → this while it comes in (Otic)
	const CARD_FROM = 1.08; // the card's scale while the frames climb…
	const BG_DELAY = 0.3; // …then, after this pause (Otic),
	const BG_FADE = 0.9; // the black turns white and the card settles to 1 (Otic)
	const TYPE_SPEED = 1.7; // the About typing, this many times faster
	const EXPAND = 1.0;
	const HANDOFF = 0.6; // overlay fade
	// Frames wait (at most this long) to be decoded, so a slow connection
	// never shows one half-painted.
	const DECODE_WAIT_MS = 2500;

	// Still images only (a video can't be a slide-up frame), in archive
	// order; on SP a work's mobile thumbnail replaces it when that is an image.
	const frames = $derived(
		slides
			.filter((s) => !s.visual.isVideo)
			.slice(0, FRAMES)
			.map((s) => ({
				slug: s.slug,
				src: s.visual.src,
				sp: s.visual.sp && !s.visual.sp.isVideo ? s.visual.sp.src : null
			}))
	);

	let root = $state<HTMLDivElement>();
	let stack = $state<HTMLDivElement>();
	let frameEls = $state<HTMLDivElement[]>([]);
	let imgEls = $state<HTMLImageElement[]>([]);
	let blackEl = $state<HTMLDivElement>();
	let done = $state(false);
	let running = $state(false);
	let typing = $state(false);
	let tl: gsap.core.Timeline | undefined;

	onMount(() => {
		if (document.documentElement.dataset.op !== 'play') {
			done = true;
			ui.entered = true;
			return;
		}

		let cancelled = false;
		const html = document.documentElement;
		html.classList.add('is-op');

		// Once played, a later client-side return to the index must not
		// replay it (the pre-paint decision only covers full page loads).
		const finish = () => {
			html.classList.remove('is-op');
			html.dataset.op = 'skip';
			done = true;
		};

		// If the animation code can't load, don't leave a blank screen.
		const bail = () => {
			if (cancelled) return;
			finish();
			ui.entered = true;
		};

		import('gsap')
			.then(async ({ gsap }) => {
				if (cancelled) return;
				await tick();
				// Two frames so bind:this targets are settled before reading them.
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
				const stills = frameEls.filter(Boolean);
				const imgs = imgEls.filter(Boolean);
				if (cancelled || !root || !stack || !blackEl) return;
				const layers = [...stills, blackEl];

				gsap.set(layers, { clipPath: 'inset(100% 0% 0% 0%)' });
				gsap.set(stack, { scale: CARD_FROM, force3D: true });

				await Promise.race([
					Promise.all(imgs.map((im) => im.decode().catch(() => {}))),
					new Promise((r) => setTimeout(r, DECODE_WAIT_MS))
				]);
				if (cancelled) return;

				running = true;
				tl = gsap.timeline({ onComplete: finish });
				layers.forEach((el, i) => {
					const at = START + i * STAGGER;
					tl!.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: REVEAL, ease: 'power3.out' }, at);
					if (imgs[i]) {
						tl!.to(imgs[i], { scale: ZOOM, duration: REVEAL + STAGGER, ease: 'power3.out', force3D: true }, at);
					}
				});

				// Black → white while the card (its last frame now solid black)
				// settles a little smaller — Otic's hand-off to its first card.
				const settled = START + (layers.length - 1) * STAGGER + REVEAL + BG_DELAY;
				tl.addLabel('white', settled)
					.to(root, { backgroundColor: '#ffffff', duration: BG_FADE, ease: 'power2.inOut' }, 'white')
					.to(stack, { scale: 1, duration: BG_FADE, ease: 'power2.inOut' }, 'white')
					// Once it is white, the wordmark types itself out in the black
					// card; the timeline waits for it (resumed by onDone below).
					// (Pausing any earlier would freeze the fade half-way: grey.)
					.call(
						() => {
							typing = true;
							tl?.pause();
						},
						[],
						`white+=${BG_FADE}`
					)
					.addLabel('open', `white+=${BG_FADE}`)
					.call(
						() => {
							// The card's height comes from its ratio; pin it in px so it
							// can tween to the full screen.
							if (stack) {
								stack.style.height = `${stack.offsetHeight}px`;
								stack.style.aspectRatio = 'auto';
							}
						},
						[],
						'open'
					)
					.to(stack, { width: '100vw', height: '100dvh', duration: EXPAND, ease: 'power3.inOut' }, 'open')
					.addLabel('handoff', `open+=${EXPAND}`)
					.call(() => (ui.entered = true), [], 'handoff')
					.to(root, { opacity: 0, duration: HANDOFF, ease: 'power2.out' }, 'handoff');
			})
			.catch(bail);

		return () => {
			cancelled = true;
			tl?.kill();
			html.classList.remove('is-op');
			html.dataset.op = 'skip';
			ui.entered = true;
		};
	});
</script>

{#if !done}
	<div class="Opening" class:is-running={running} bind:this={root} aria-hidden="true">
		<div class="stack" bind:this={stack}>
			{#each frames as f, i (f.slug)}
				<!-- lazy: when the opening is skipped the overlay is display:none,
				     and a lazy image there is never fetched; when it plays, the
				     overlay is on screen and they all load at once. -->
				<div class="frame" bind:this={frameEls[i]}>
					<picture>
						{#if f.sp}
							<source media="(max-width: 1023.98px)" srcset={imgSrcset(f.sp, [500, 800], 85)} sizes="320px" />
						{/if}
						<img
							bind:this={imgEls[i]}
							src={imgOpt(f.src, 800, 85)}
							srcset={imgSrcset(f.src, [500, 800, 1200], 85)}
							sizes="(min-width: 1024px) 380px, (min-width: 768px) 320px, 257px"
							alt=""
							loading="lazy"
							decoding="async"
						/>
					</picture>
				</div>
			{/each}
			<!-- The last frame: solid black, where the wordmark is typed. -->
			<div class="frame frame--black" bind:this={blackEl}>
				{#if typing}
					<div class="type">
						<InstituteMark typewriter speed={TYPE_SPEED} onDone={() => tl?.play()} />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Painted only when the pre-paint script chose to play it — so it never
	   flashes when skipped, and never shows at all without JS. */
	.Opening {
		display: none;
		position: fixed;
		inset: 0;
		z-index: var(--z-op);
		background: #000;
		pointer-events: none;
		/* Last resort if the app's JS never runs: the server-rendered overlay
		   clears itself instead of leaving a black screen. Cancelled the
		   moment the timeline starts. */
		animation: op-failsafe 0.6s ease 9s forwards;
	}

	.Opening.is-running {
		animation: none;
	}

	@keyframes op-failsafe {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}

	:global(html[data-op='play']) .Opening {
		display: block;
	}

	/* Otic's card: 257 × 385 (SP), 320 × 480 (tablet), 380 × 570 (PC),
	   centered. It opens to the full screen at the end. */
	.stack {
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		width: 257px;
		aspect-ratio: 257 / 385;
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.stack {
			width: 320px;
			aspect-ratio: 320 / 480;
		}
	}

	@media (min-width: 1024px) {
		.stack {
			width: 380px;
			aspect-ratio: 380 / 570;
		}
	}

	.frame {
		position: absolute;
		inset: 0;
		clip-path: inset(100% 0% 0% 0%); /* hidden until GSAP reveals — no flash before it loads */
		will-change: clip-path;
	}

	.frame picture,
	.frame img {
		display: block;
		width: 100%;
		height: 100%;
	}

	.frame img {
		object-fit: cover;
		will-change: transform;
	}

	.frame--black {
		background: #000;
	}

	/* The wordmark, white, across the black card with a margin, centered. */
	.type {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding: 0 24px;
		color: #fff;
	}

	/* The page never scrolls under the opening. */
	:global(html.is-op),
	:global(html.is-op body) {
		overflow: hidden;
	}
</style>
