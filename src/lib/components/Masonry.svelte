<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { imgOpt, imgSrcset } from '$lib/js/img';
	import type { Tile } from '$lib/js/works';

	let { tiles }: { tiles: Tile[] } = $props();

	// ── Layout ─────────────────────────────────────────────────────────
	// Figma II_Works: 3 columns filling the right of the left panel on PC
	// (455→1440, 2px hairlines), 2 columns full-width on SP (113:516).
	const PC_QUERY = '(min-width: 1024px)';
	const PC_COLUMNS = 3;
	const SP_COLUMNS = 2;
	// Figma's placeholder tiles run from 0.472 (short) to 1.2016 (tall)
	// height/width; real images keep their own aspect inside that band so a
	// 4:1 banner or a very tall portrait can't break the rhythm.
	const MIN_RATIO = 0.47;
	const MAX_RATIO = 1.25;
	const TILE_WIDTHS = [320, 480, 700, 940];

	// ── Motion (PC) ────────────────────────────────────────────────────
	// The columns never stop: 1 and 3 flow downward (in from the top), 2
	// flows upward (in from the bottom). Wheel / touch / keys push all three
	// at once — columns 1 and 3 with the gesture, column 2 against it.
	const IDLE_SPEED = 24; // px/s when left alone
	const IDLE_EASE = 3; // how fast the drift settles to its target (1/s)
	const MOMENTUM_RELEASE = 7; // how fast a wheel push is spent (1/s)
	const ENTRANCE_BOOST = 520; // px/s extra flow at the moment of entrance
	const ENTRANCE_DURATION = 2.4; // s
	const KEY_STEP = 160; // px per arrow press
	const SP_ENTRANCE_OFFSET = 90; // px

	let isPC = $state(true); // SSR renders the PC structure; corrected on mount
	let repeats = $state<number[]>([2, 2, 2]);
	let entered = $state(false); // entrance has started (columns visible)
	let mounted = $state(false);

	// Motion state lives outside the effects on purpose: the marquee effect
	// re-runs whenever the rendered structure changes (resize, copy count)
	// and must pick up where the flow was, not jump back to 0.
	let flow = 0; // accumulated flow position, px
	let momentum = 0; // wheel/touch/key push still to be spent, px
	let boost = 0; // entrance surge, px/s
	let entranceStarted = false;

	let viewport = $state<HTMLDivElement>();
	let colEls = $state<HTMLDivElement[]>([]);
	let trackEls = $state<HTMLDivElement[]>([]);

	const ratioOf = (t: Tile) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, t.height / t.width));

	/** Greedy shortest-column placement by cumulative height ratio — keeps
	    SP's column bottoms even and PC's loops of similar length. */
	const distribute = (list: Tile[], count: number): Tile[][] => {
		const cols: Tile[][] = Array.from({ length: count }, () => []);
		const heights = new Array(count).fill(0);
		for (const tile of list) {
			let target = 0;
			for (let c = 1; c < count; c++) if (heights[c] < heights[target] - 1e-6) target = c;
			cols[target].push(tile);
			heights[target] += ratioOf(tile);
		}
		return cols;
	};

	const columns = $derived(distribute(tiles, isPC ? PC_COLUMNS : SP_COLUMNS));
	/** +1 = content flows down (columns 1, 3), -1 = up (column 2). */
	const dirOf = (c: number) => (c % 2 === 0 ? 1 : -1);

	onMount(() => {
		const mq = window.matchMedia(PC_QUERY);
		isPC = mq.matches;
		mounted = true;
		const onChange = () => (isPC = mq.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	// PC: the page itself never scrolls on the archive index.
	$effect(() => {
		if (!mounted) return;
		document.documentElement.classList.toggle('is-scroll-locked', isPC);
		return () => document.documentElement.classList.remove('is-scroll-locked');
	});

	// ── PC marquee ─────────────────────────────────────────────────────
	$effect(() => {
		if (!mounted || !isPC || !viewport) return;
		// Re-run when the rendered structure changes.
		void columns;
		void repeats;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let periods: number[] = [];
		let raf = 0;
		let last = performance.now();
		let idle = reduced ? 0 : IDLE_SPEED;
		let hovering = false;
		let disposed = false;

		const measure = () => {
			const vh = viewport!.clientHeight;
			const next = repeats.slice();
			periods = trackEls.map((track, c) => {
				const sets = track?.children;
				if (!sets || sets.length < 2) return 0;
				const period = (sets[1] as HTMLElement).offsetTop - (sets[0] as HTMLElement).offsetTop;
				// Enough copies that the visible window is always covered:
				// the track is shifted by up to one period, so it needs
				// (copies - 1) periods ≥ viewport height.
				next[c] = Math.max(2, Math.ceil(vh / Math.max(period, 1)) + 1);
				return period;
			});
			if (next.some((n, c) => n !== repeats[c])) repeats = next;
		};

		const render = () => {
			for (let c = 0; c < trackEls.length; c++) {
				const period = periods[c];
				const track = trackEls[c];
				if (!period || !track) continue;
				const m = ((flow % period) + period) % period;
				const y = dirOf(c) > 0 ? m - period : -m;
				track.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
			}
		};

		const frame = (now: number) => {
			if (disposed) return;
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const target = reduced || hovering || ui.menuOpen ? 0 : IDLE_SPEED;
			idle += (target - idle) * Math.min(1, dt * IDLE_EASE);
			const spent = momentum * (1 - Math.exp(-dt * MOMENTUM_RELEASE));
			momentum -= spent;
			flow += (idle + boost) * dt - spent;
			render();
			raf = requestAnimationFrame(frame);
		};

		const push = (delta: number) => {
			if (ui.menuOpen) return;
			momentum += delta;
		};

		const onWheel = (e: WheelEvent) => {
			const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport!.clientHeight : 1;
			push(e.deltaY * unit);
		};

		let touchY: number | null = null;
		const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null);
		const onTouchMove = (e: TouchEvent) => {
			const y = e.touches[0]?.clientY;
			if (touchY == null || y == null) return;
			push((touchY - y) * 1.6);
			touchY = y;
		};

		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (t?.closest('input, textarea, select, [contenteditable]')) return;
			const vh = viewport!.clientHeight;
			const map: Record<string, number> = {
				ArrowDown: KEY_STEP,
				ArrowUp: -KEY_STEP,
				PageDown: vh * 0.8,
				PageUp: -vh * 0.8,
				' ': e.shiftKey ? -vh * 0.8 : vh * 0.8
			};
			if (e.key in map) {
				e.preventDefault();
				push(map[e.key]);
			}
		};

		const onEnter = () => (hovering = true);
		const onLeave = () => (hovering = false);

		let resizeTimer = 0;
		const onResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(measure, 120);
		};

		tick().then(() => {
			if (disposed) return;
			measure();
			render();
			raf = requestAnimationFrame(frame);
		});

		window.addEventListener('wheel', onWheel, { passive: true });
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: true });
		window.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		viewport.addEventListener('pointerenter', onEnter);
		viewport.addEventListener('pointerleave', onLeave);

		return () => {
			disposed = true;
			cancelAnimationFrame(raf);
			clearTimeout(resizeTimer);
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
			viewport?.removeEventListener('pointerenter', onEnter);
			viewport?.removeEventListener('pointerleave', onLeave);
			for (const track of trackEls) if (track) track.style.transform = '';
		};
	});

	// ── Entrance ───────────────────────────────────────────────────────
	// Waits for the opening's hand-off (or runs at once when it's skipped).
	// PC: columns 1 and 3 arrive from above, column 2 from below, while the
	// flow itself surges and settles into the idle drift. SP: the same
	// directions over a short distance.
	$effect(() => {
		if (!mounted || !ui.entered || entranceStarted) return;
		entranceStarted = true;
		const pc = untrack(() => isPC);
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			entered = true;
			return;
		}

		import('gsap').then(async ({ gsap }) => {
			await tick();
			const cols = colEls.filter(Boolean);
			const vh = window.innerHeight;
			// fromTo renders its start state immediately, so the columns are
			// already off-screen by the time .is-in makes them visible.
			cols.forEach((col, c) => {
				const from = pc ? -dirOf(c) * vh * 1.05 : -dirOf(c) * SP_ENTRANCE_OFFSET;
				gsap.fromTo(
					col,
					{ y: from, opacity: pc ? 1 : 0 },
					{
						y: 0,
						opacity: 1,
						duration: pc ? ENTRANCE_DURATION : 1.4,
						delay: c * 0.08,
						ease: pc ? 'power4.out' : 'power3.out',
						clearProps: 'transform,opacity'
					}
				);
			});
			entered = true;
			if (pc) {
				const surge = { v: ENTRANCE_BOOST };
				gsap.to(surge, {
					v: 0,
					duration: ENTRANCE_DURATION,
					ease: 'power2.out',
					onUpdate: () => {
						boost = surge.v;
					}
				});
			}
		});
	});

	/** Fades each image in over its low-res placeholder once decoded —
	    including images that finished loading before hydration. */
	function revealOnLoad(img: HTMLImageElement) {
		const done = () => img.classList.add('is-loaded');
		if (img.complete && img.naturalWidth) done();
		else img.addEventListener('load', done, { once: true });
	}
</script>

<div class="Masonry" class:is-pc={isPC} class:is-in={entered} bind:this={viewport}>
	{#each columns as column, c (c)}
		<div class="col" bind:this={colEls[c]}>
			<div class="track" bind:this={trackEls[c]}>
				{#each Array.from({ length: isPC ? (repeats[c] ?? 2) : 1 }) as _, rep (rep)}
					<div class="set" aria-hidden={rep > 0 ? 'true' : undefined}>
						{#each column as tile, i (i)}
							<a
								class="tile"
								href="/works/{tile.slug}"
								aria-label={tile.title}
								tabindex={rep > 0 ? -1 : undefined}
								style="--ratio: {ratioOf(tile)}; background-image: url('{imgOpt(tile.src, 32, 30)}')"
							>
								<img
									src={imgOpt(tile.src, 700, 60)}
									srcset={imgSrcset(tile.src, TILE_WIDTHS, 60)}
									sizes={isPC ? 'calc((100vw - 455 / 1440 * 100vw) / 3)' : '50vw'}
									alt=""
									width={tile.width}
									height={tile.height}
									loading="lazy"
									decoding="async"
									use:revealOnLoad
								/>
							</a>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	/* SP: two columns in the page flow (Figma 113:516: 195.8px columns, a
	   ~1.3px hairline between them and between tiles). */
	.Masonry {
		display: flex;
		gap: var(--tile-gap);
	}

	.col {
		flex: 1 1 0;
		min-width: 0;
	}

	.track,
	.set {
		display: flex;
		flex-direction: column;
		gap: var(--tile-gap);
	}

	.track {
		will-change: transform;
	}

	/* Hidden until the entrance takes them (JS only — without JS the grid
	   simply shows). */
	:global(html.js) .Masonry:not(.is-in) .col {
		visibility: hidden;
	}

	.tile {
		position: relative;
		display: block;
		aspect-ratio: 1 / var(--ratio);
		overflow: hidden;
		background-color: var(--color-tile);
		background-size: cover;
		background-position: center;
	}

	.tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition:
			opacity 0.8s var(--ease-out),
			transform 1.2s var(--ease-out);
	}

	.tile img:global(.is-loaded) {
		opacity: 1;
	}

	@media (hover: hover) {
		.tile:hover img {
			transform: scale(1.03);
		}
	}

	/* PC: a fixed window to the right of the left panel. */
	.Masonry.is-pc {
		position: fixed;
		top: 0;
		bottom: 0;
		left: var(--aside-w);
		right: 0;
		overflow: hidden;
	}

	.is-pc .col {
		position: relative;
	}
</style>
