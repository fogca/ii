<script lang="ts">
	import { imgOpt } from '$lib/js/img';

	type Still = { src: string; width: number; height: number };

	let { stills }: { stills: Still[] } = $props();

	/* Small stills in a row on #f6f6f6, each at its own ratio and the same
	   height, carried right to left one at a time: each stops in the
	   middle, then the next comes in (after 12_one_pv_slider.mp4). The row
	   is set three times over so neighbours always show on both sides; on
	   reaching the third copy it jumps back to the same still in the
	   middle copy, unseen. With reduced motion it rests on the first. */

	const HEIGHT = 0.62; // a still's height, of the frame's
	const GAP = 0.06; // between stills, of the frame's height
	const HOLD_MS = 1600; // resting in the middle
	const MOVE_MS = 900; // carried to the next
	const IMG_W = 640; // requested width (the stills show small)
	const COPIES = 3;

	let frameW = $state(0);
	let frameH = $state(0);
	let at = $state(0); // the still in the middle (set into the middle copy on mount)
	let moving = $state(false); // false for the unseen jumps

	const row = $derived(Array.from({ length: COPIES }, () => stills).flat());
	const h = $derived(frameH * HEIGHT);
	const gap = $derived(frameH * GAP);
	const widths = $derived(row.map((s) => (h * s.width) / s.height));
	/** Shift that puts still `i`'s centre on the frame's centre. */
	const shift = $derived.by(() => {
		let x = 0;
		for (let i = 0; i < at; i++) x += widths[i] + gap;
		return frameW / 2 - (x + widths[at] / 2);
	});

	$effect(() => {
		const n = stills.length;
		at = n;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let timer = 0;
		const step = () => {
			moving = true;
			at++;
			timer = window.setTimeout(() => {
				// Past the middle copy: back to the same still in it.
				if (at >= 2 * n) {
					moving = false;
					at -= n;
				}
				timer = window.setTimeout(step, HOLD_MS);
			}, MOVE_MS);
		};
		timer = window.setTimeout(step, HOLD_MS);
		return () => clearTimeout(timer);
	});
</script>

<div class="StillSlider" bind:clientWidth={frameW} bind:clientHeight={frameH}>
	<div
		class="row"
		class:is-moving={moving}
		style:gap="{gap}px"
		style:transform="translate3d({shift}px, -50%, 0)"
		style:--move="{MOVE_MS}ms"
	>
		{#each row as s, i (i)}
			<img src={imgOpt(s.src, IMG_W)} alt="" width={widths[i]} height={h} loading="lazy" decoding="async" />
		{/each}
	</div>
</div>

<style>
	.StillSlider {
		position: absolute;
		inset: 0;
		overflow: clip;
		background: #f6f6f6;
	}

	.row {
		position: absolute;
		top: 50%;
		left: 0;
		display: flex;
		align-items: center;
		will-change: transform;
	}

	.row.is-moving {
		transition: transform var(--move) cubic-bezier(0.65, 0, 0.35, 1);
	}

	img {
		display: block;
		flex: none;
		object-fit: cover;
	}
</style>
