<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { imgOpt, imgSrcset } from '$lib/js/img';
	import { ui } from '$lib/state/ui.svelte';
	import type { Media as MediaItem } from '$lib/js/works';

	type Slide = { slug: string; title: string; number: string; visual: MediaItem };
	let { slides }: { slides: Slide[] } = $props();

	// The first view as one continuous film: every work's thumbnail (video
	// or still) for 3–4 s, hard cuts, no fades, looping. A click anywhere
	// opens the archive (/works); the caption names the shot on air. To keep the cuts
	// clean, only the shot on screen and the next one exist; the next one
	// waits underneath, already decoded to its first frame (a muted
	// play/pause primes it — iOS buffers nothing on `preload` alone), and a
	// cut waits for it to be ready rather than ever showing black. Every
	// other shot has no element at all, so at most two videos ever hold a
	// decoder. SP plays the mobile thumbnail (video or image) when a work
	// has one.
	const HOLD_MS = 3000; // each shot runs this long…
	const HOLD_SPREAD_MS = 1000; // …plus up to this much
	const READY_POLL_MS = 60;
	const READY_MAX_MS = 4000; // past this, cut anyway
	const SP_QUERY = '(max-width: 1023.98px)';
	const IMG_WIDTHS = [900, 1400, 2000, 2800];

	let started = $state(false);
	let isSP = $state(false);
	let current = $state(0);
	const next = $derived((current + 1) % slides.length);
	const els: (HTMLVideoElement | HTMLImageElement | undefined)[] = $state([]);

	const shotOf = (s: Slide): MediaItem => (isSP && s.visual.sp ? s.visual.sp : s.visual);
	const live = (i: number) => started && (i === current || i === next);

	const isReady = (el: HTMLVideoElement | HTMLImageElement | undefined) => {
		if (!el) return false;
		if (el instanceof HTMLVideoElement) return el.readyState >= 3;
		return el.complete && el.naturalWidth > 0;
	};

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

	/** Decodes the first frame without letting it run on. */
	const prime = async (el: HTMLVideoElement | HTMLImageElement | undefined) => {
		if (!(el instanceof HTMLVideoElement)) return;
		el.muted = true;
		try {
			await el.play();
		} catch {
			// autoplay refused: readiness polling still works on preload
		}
		el.pause();
		el.currentTime = 0;
	};

	/** Frees the decoder the moment a shot leaves. */
	function release(node: HTMLVideoElement) {
		return {
			destroy() {
				node.pause();
				node.removeAttribute('src');
				node.load();
			}
		};
	}

	onMount(() => {
		if (!slides.length) return;
		const mq = matchMedia(SP_QUERY);
		isSP = mq.matches;
		const onMq = () => (isSP = mq.matches);
		mq.addEventListener('change', onMq);
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let alive = true;
		started = true;

		const run = async () => {
			// The film starts with its first shot as the opening lifts (at once
			// when there is no opening), not somewhere in the middle.
			while (alive && !ui.entered) await sleep(50);
			while (alive) {
				await tick();
				const cur = els[current];
				if (cur instanceof HTMLVideoElement && !still) {
					// Primed shots already sit on frame 0; a needless seek would
					// drop the decoded frame for a moment.
					if (cur.currentTime > 0.05) cur.currentTime = 0;
					cur.play().catch(() => {});
				}
				if (still || slides.length < 2) return;
				prime(els[next]);
				await sleep(HOLD_MS + Math.random() * HOLD_SPREAD_MS);
				for (let waited = 0; alive && waited < READY_MAX_MS && !isReady(els[next]); waited += READY_POLL_MS) {
					await sleep(READY_POLL_MS);
				}
				// A hidden tab holds the film where it is.
				while (alive && document.hidden) await sleep(250);
				if (alive) current = next;
			}
		};
		run();

		return () => {
			alive = false;
			mq.removeEventListener('change', onMq);
		};
	});

	const shown = $derived(slides[current]);
</script>

<section class="TopReel" aria-label="Works">
	<a class="stage" href="/works" aria-label="Work Archives">
		{#each slides as slide, i (slide.slug)}
			{#if live(i)}
				{@const shot = shotOf(slide)}
				<div class="shot" class:is-on={i === current}>
					{#if shot.isVideo}
						<video bind:this={els[i]} src={shot.src} muted playsinline preload="auto" use:release></video>
					{:else}
						<img
							bind:this={els[i]}
							src={imgOpt(shot.src, 1400, 85)}
							srcset={imgSrcset(shot.src, IMG_WIDTHS, 85)}
							sizes="100vw"
							alt=""
							decoding="async"
						/>
					{/if}
				</div>
			{/if}
		{/each}
	</a>

	<p class="caption">
		<span class="num">{shown.number}</span>
		<span class="title">{shown.title}</span>
	</p>
</section>

<style>
	.TopReel {
		position: relative;
		height: 100vh;
		height: 100dvh;
		overflow: clip;
		background: #000;
	}

	.stage {
		position: absolute;
		inset: 0;
		display: block;
	}

	/* Both live shots fill the screen; the one on air sits on top, the next
	   waits underneath, primed. */
	.shot {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.shot.is-on {
		z-index: 1;
	}

	.shot video,
	.shot img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Bottom left, over the film, in difference blend so it reads on light
	   and dark shots alike; it changes with the cut. */
	.caption {
		position: absolute;
		left: var(--gutter);
		bottom: calc(18px + env(safe-area-inset-bottom, 0px));
		z-index: 2;
		display: flex;
		gap: 0.8em;
		color: #fff;
		mix-blend-mode: difference;
		font-size: 12px;
		line-height: 1.2;
		pointer-events: none;
	}

	.num {
		opacity: 0.6;
	}

	@media (min-width: 1024px) {
		.caption {
			font-size: 16px;
		}
	}
</style>
