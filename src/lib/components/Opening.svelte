<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { imgOpt, imgSrcset } from '$lib/js/img';
	import { ui } from '$lib/state/ui.svelte';
	import type { Media } from '$lib/js/works';

	type Slide = { slug: string; title: string; visual: Media };
	let { slides = [] }: { slides?: Slide[] } = $props();

	// Opening, after the Otic (OTIF) one: a stack of works' thumbnails comes
	// in one after another, each sliding up from the bottom of a centered
	// card (clip-path) while it zooms in a little, the next one starting
	// before the last has finished — so the card keeps climbing. Then the
	// card opens to the full screen and the overlay clears onto the film.
	// Whether it plays at all is decided pre-paint in app.html
	// (html[data-op]); when skipped, the page enters immediately.
	const FRAMES = 7;
	const START = 0.3;
	const REVEAL = 1.0; // one frame's slide-up
	const STAGGER = 0.3; // the next frame starts this long after the last
	const ZOOM = 1.1; // each frame grows 1 → this while it comes in
	const HOLD = 0.2; // the last frame rests, then the card opens
	const EXPAND = 0.9;
	const HANDOFF = 0.5; // overlay fade
	// The page starts (film cut 1) as the overlay starts to clear.
	const ENTER_AT = 0;
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
				title: s.title,
				src: s.visual.src,
				sp: s.visual.sp && !s.visual.sp.isVideo ? s.visual.sp.src : null
			}))
	);

	let root = $state<HTMLDivElement>();
	let stack = $state<HTMLDivElement>();
	let frameEls = $state<HTMLDivElement[]>([]);
	let imgEls = $state<HTMLImageElement[]>([]);
	let done = $state(false);
	let running = $state(false);

	onMount(() => {
		if (document.documentElement.dataset.op !== 'play' || !frames.length) {
			done = true;
			ui.entered = true;
			return;
		}

		let cancelled = false;
		let tl: gsap.core.Timeline | undefined;
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
				const els = frameEls.filter(Boolean);
				if (cancelled || !root || !stack || !els.length) return;

				// Hidden until each frame's turn.
				gsap.set(els, { clipPath: 'inset(100% 0% 0% 0%)' });
				gsap.set(imgEls.filter(Boolean), { scale: 1 });

				await Promise.race([
					Promise.all(imgEls.filter(Boolean).map((im) => im.decode().catch(() => {}))),
					new Promise((r) => setTimeout(r, DECODE_WAIT_MS))
				]);
				if (cancelled) return;

				running = true;
				tl = gsap.timeline({ onComplete: finish });
				els.forEach((el, i) => {
					const at = START + i * STAGGER;
					tl!.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: REVEAL, ease: 'power3.out' }, at);
					tl!.to(imgEls[i], { scale: ZOOM, duration: REVEAL + STAGGER, ease: 'power3.out' }, at);
				});
				const open = START + (els.length - 1) * STAGGER + REVEAL + HOLD;
				tl.addLabel('open', open)
					// The card opens to the whole screen; the last frame settles back to 1.
					.to(stack, { width: '100vw', height: '100dvh', duration: EXPAND, ease: 'power3.inOut' }, 'open')
					.to(imgEls[els.length - 1], { scale: 1, duration: EXPAND, ease: 'power3.inOut' }, 'open')
					.addLabel('handoff', `open+=${EXPAND}`)
					.call(
						() => {
							ui.entered = true;
						},
						[],
						`handoff+=${ENTER_AT}`
					)
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
							<source
								media="(max-width: 1023.98px)"
								srcset={imgSrcset(f.sp, [700, 1000, 1400], 85)}
								sizes="100vw"
							/>
						{/if}
						<img
							bind:this={imgEls[i]}
							src={imgOpt(f.src, 1400, 85)}
							srcset={imgSrcset(f.src, [900, 1400, 2000], 85)}
							sizes="100vw"
							alt=""
							loading="lazy"
							decoding="async"
						/>
					</picture>
				</div>
			{/each}
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

	/* The card the frames climb in: portrait, centered; it opens to the
	   full screen at the end (GSAP animates width/height). */
	.stack {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(66vw, 300px);
		aspect-ratio: 3 / 4;
		overflow: hidden;
	}

	@media (min-width: 1024px) {
		.stack {
			width: 380px;
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

	/* The page never scrolls under the opening. */
	:global(html.is-op),
	:global(html.is-op body) {
		overflow: hidden;
	}
</style>
