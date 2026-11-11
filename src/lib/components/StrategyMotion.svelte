<script lang="ts">
	import { onMount } from 'svelte';

	/* Research & Strategy, drawn: a positioning map. The two axes draw,
	   the competitors appear one by one and gather into a ringed market,
	   our own point appears, and a path leaves it for the open quarter,
	   where a ring opens. Then it all fades and starts again. One shared
	   loop (LOOP_MS) through the Web Animations API — each mark has its
	   own moment in it — paused while off screen; with reduced motion the
	   finished map just shows. */

	const LOOP_MS = 9000;
	const FADE_FROM = 0.9; // the whole map fades out from here…
	const FADE_TO = 0.96; // …to here, then the loop starts again
	const POP = 0.03; // a mark's own time to appear, of the loop

	// Competitors (viewBox units, 1600 × 900): crowded lower left.
	const DOTS: [number, number][] = [
		[470, 560], [560, 500], [430, 650], [620, 610], [530, 700], [690, 540], [380, 520]
	];
	const DOT_FROM = 0.1;
	const DOT_STEP = 0.025;
	const ME: [number, number] = [700, 690];
	const TARGET: [number, number] = [1190, 250];
	const PATH = `M${ME[0]} ${ME[1]} C ${ME[0] + 260} ${ME[1] - 20}, ${TARGET[0] - 260} ${TARGET[1] + 260}, ${TARGET[0]} ${TARGET[1]}`;

	let svg = $state<SVGSVGElement>();

	onMount(() => {
		if (!svg) return;
		const root = svg;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return; // the finished map is the markup's resting state

		type Frame = Keyframe;
		const runs: Animation[] = [];
		const run = (el: Element | null, frames: Frame[]) => {
			if (el) runs.push(el.animate(frames, { duration: LOOP_MS, iterations: Infinity, easing: 'linear' }));
		};
		const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
		/** Hidden until `at`, appearing over `dur`, then held. */
		const appear = (el: Element | null, at: number, dur: number, from: Keyframe, to: Keyframe) =>
			run(el, [
				{ offset: 0, ...from },
				{ offset: at, ...from, easing: ease },
				{ offset: Math.min(at + dur, 1), ...to },
				{ offset: 1, ...to }
			]);
		const draw = (el: Element | null, at: number, dur: number) =>
			appear(el, at, dur, { strokeDashoffset: 1 }, { strokeDashoffset: 0 });
		const pop = (el: Element | null, at: number) =>
			appear(el, at, POP, { opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'scale(1)' });
		const q = (s: string) => root.querySelector(s);

		run(q('.map'), [
			{ offset: 0, opacity: 1 },
			{ offset: FADE_FROM, opacity: 1 },
			{ offset: FADE_TO, opacity: 0 },
			{ offset: 1, opacity: 0 }
		]);
		draw(q('.axis-x'), 0, 0.08);
		draw(q('.axis-y'), 0.02, 0.08);
		root.querySelectorAll('.dot').forEach((d, i) => pop(d, DOT_FROM + i * DOT_STEP));
		appear(q('.market'), 0.32, 0.06, { opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'scale(1)' });
		pop(q('.me'), 0.42);
		draw(q('.route'), 0.48, 0.18);
		pop(q('.target'), 0.66);
		run(q('.pulse'), [
			{ offset: 0, opacity: 0, transform: 'scale(1)' },
			{ offset: 0.67, opacity: 0, transform: 'scale(1)' },
			{ offset: 0.68, opacity: 0.5, transform: 'scale(1)', easing: 'ease-out' },
			{ offset: 0.82, opacity: 0, transform: 'scale(2.2)' },
			{ offset: 1, opacity: 0, transform: 'scale(2.2)' }
		]);

		// Only while on screen.
		const io = new IntersectionObserver(([e]) => runs.forEach((a) => (e.isIntersecting ? a.play() : a.pause())));
		io.observe(root);
		return () => {
			io.disconnect();
			runs.forEach((a) => a.cancel());
		};
	});
</script>

<svg bind:this={svg} class="StrategyMotion" viewBox="0 0 1600 900" aria-hidden="true">
	<g class="map">
		<line class="axis-x" x1="220" y1="450" x2="1380" y2="450" pathLength="1" />
		<line class="axis-y" x1="800" y1="110" x2="800" y2="790" pathLength="1" />
		<ellipse class="market" cx="535" cy="600" rx="230" ry="150" />
		{#each DOTS as [x, y], i (i)}
			<circle class="dot" cx={x} cy={y} r="17" />
		{/each}
		<path class="route" d={PATH} pathLength="1" />
		<circle class="me" cx={ME[0]} cy={ME[1]} r="22" />
		<circle class="pulse" cx={TARGET[0]} cy={TARGET[1]} r="46" />
		<circle class="target" cx={TARGET[0]} cy={TARGET[1]} r="46" />
	</g>
</svg>

<style>
	.StrategyMotion {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: #f6f6f6;
	}

	line,
	.route {
		fill: none;
		stroke: #000;
		stroke-dasharray: 1;
	}

	line {
		stroke-width: 3;
		stroke: rgba(0, 0, 0, 0.35);
	}

	.route {
		stroke-width: 6;
		stroke-linecap: round;
	}

	.dot {
		fill: #b4b4b4;
	}

	.market {
		fill: none;
		stroke: #b4b4b4;
		stroke-width: 3;
		stroke-dasharray: 10 14;
	}

	.me {
		fill: #000;
	}

	.target,
	.pulse {
		fill: none;
		stroke: #000;
		stroke-width: 6;
	}

	/* Marks scale about their own centres. */
	.dot,
	.market,
	.me,
	.target,
	.pulse {
		transform-box: fill-box;
		transform-origin: center;
	}

	.pulse {
		opacity: 0;
	}
</style>
