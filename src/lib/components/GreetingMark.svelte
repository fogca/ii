<script lang="ts">
	import { onMount } from 'svelte';
	import { HELLO, HELLO_SCALE, INSTITUTE, SMILE } from '$lib/js/greeting-glyphs';

	/** The top page's greeting, typed in the logo's own outlines: "ii!
	    Hello :)", a pause, then edited back to "ii" and spelt out — "sobe "
	    typed between the two i's, End, "nstitute": "isobe institute".
	    The same typing as InstituteMark (About): each
	    keystroke snaps the re-centered line and the caret; uneven keys; a
	    real text caret, lit while keys go down, blinking at rest. Letter
	    gaps are the artworks' own. Plays once on mount; with reduced motion
	    the whole greeting just shows. */

	const VB_W = 73.66; // viewBox width = "isobe institute", the widest the line gets
	const SMILE_DY = 0.75; // ":)" sits this much lower (InstituteMark EXTRA_DY)
	const SPACE_GAP_AFTER = 0.35; // the gap a word's first letter keeps after the space
	const II_GAP = 0.33; // "i" to "i", as the ii-ii.co artwork sets it
	const BANG_AFTER = 'o'; // "i!" takes the artwork's "o!" gap
	const COLON_PAREN_GAP = 0.3; // ":" to ")"
	const FALLBACK_GAP = 0.45;

	// Timing (ms).
	const START = 700;
	const KEY = 80; // fastest keystroke…
	const KEY_SPREAD = 110; // …plus up to this much, at random
	const PAUSE = 1000; // reading "ii! Hello :)" before editing it
	const BACKSPACE = 70; // …plus up to this much, at random
	const BACKSPACE_SPREAD = 50;
	const BEAT = 380; // small decisions: a caret move, the next edit
	const REST_AFTER = 300; // no key for this long: the caret blinks
	const DONE_AFTER = 600; // after the last key, the greeting counts as read

	// Caret, in viewBox units (the glyphs run 0 → 8.71 baseline).
	const CARET_TOP = -0.9;
	const CARET_BOTTOM = 10.9;
	const CARET_GAP = 0.28;
	const CARET_MIN_PX = 2;
	const CARET_EM = 0.16;

	let { onDone }: { /** Called a beat after the last key. */ onDone?: () => void } = $props();

	let svg = $state<SVGSVGElement>();
	let group = $state<SVGGElement>();
	let cursor = $state<SVGRectElement>();
	let phase = $state<'idle' | 'typing' | 'rest'>('idle');

	onMount(() => {
		if (!svg || !group || !cursor) return;
		const root = svg;
		const track = group;
		const caret = cursor;

		type Glyph = { el: SVGPathElement; ch: string; left: number; width: number; dy: number; scale: number };
		const glyphsOf = (set: string, dy = 0, scale = 1): Glyph[] =>
			[...root.querySelectorAll<SVGPathElement>(`path[data-set='${set}']`)].map((el) => {
				const b = el.getBBox();
				return { el, ch: el.dataset.ch ?? '', left: b.x * scale, width: b.width * scale, dy, scale };
			});
		const hello = glyphsOf('hello', 0, HELLO_SCALE);
		const word = glyphsOf('institute');
		const smile = glyphsOf('smile', SMILE_DY);
		const all = [...hello, ...word, ...smile];

		// Letter-to-letter gaps (ink to ink) as the artworks set them.
		const gaps = new Map<string, number>();
		const learn = (seq: Glyph[]) =>
			seq.forEach((g, i) => i && gaps.set(seq[i - 1].ch + g.ch, g.left - (seq[i - 1].left + seq[i - 1].width)));
		learn(hello);
		learn(word.slice(0, 5)); // isobe
		learn(word.slice(5)); // institute
		gaps.set('ii', II_GAP);
		gaps.set('i!', gaps.get(BANG_AFTER + '!') ?? FALLBACK_GAP);
		gaps.set(':)', COLON_PAREN_GAP);
		const spaceW = word[5].left - (word[4].left + word[4].width) - SPACE_GAP_AFTER;

		type Token = { glyph: Glyph } | { space: true };
		const line: Token[] = [];
		let at = 0; // the caret's index in the line

		const layout = () => {
			const xs: number[] = [];
			let x = 0;
			let prev: Glyph | null = null;
			let afterSpace = false;
			for (const t of line) {
				if ('space' in t) {
					xs.push(x);
					x += spaceW;
					afterSpace = true;
					continue;
				}
				const g = t.glyph;
				const gap = !prev ? 0 : afterSpace ? SPACE_GAP_AFTER : (gaps.get(prev.ch + g.ch) ?? FALLBACK_GAP);
				xs.push(x + gap);
				x += gap + g.width;
				prev = g;
				afterSpace = false;
			}
			return { xs, end: x };
		};

		const caretW = Math.max(CARET_EM, CARET_MIN_PX / (root.getBoundingClientRect().width / VB_W));
		caret.setAttribute('y', String(CARET_TOP));
		caret.setAttribute('height', String(CARET_BOTTOM - CARET_TOP));
		caret.setAttribute('width', String(caretW));

		// Shown glyphs at their places, the line centered, the caret at its
		// index. No transitions — every change snaps.
		const draw = () => {
			const { xs, end } = layout();
			all.forEach((g) => (g.el.style.opacity = '0'));
			line.forEach((t, i) => {
				if ('space' in t) return;
				const g = t.glyph;
				g.el.style.opacity = '1';
				g.el.setAttribute('transform', `translate(${xs[i] - g.left} ${g.dy}) scale(${g.scale})`);
			});
			track.setAttribute('transform', `translate(${(VB_W - end) / 2} 0)`);
			const last = line[line.length - 1];
			let cx: number;
			if (!last) cx = -caretW / 2;
			else if (at >= line.length) cx = end + ('space' in last ? 0 : CARET_GAP);
			else cx = xs[at] - CARET_GAP - caretW;
			caret.setAttribute('x', String(cx));
		};

		// The keystrokes, each with the wait before it.
		const steps: { wait: number; act: () => void }[] = [];
		const human = () => KEY + Math.random() * KEY_SPREAD;
		const SPACE: Token = { space: true };
		const glyphs = (gs: Glyph[]) => gs.map((glyph) => ({ glyph }));
		/** Types at the caret; the first key waits `first`. */
		const type = (tokens: Token[], first = human()) =>
			tokens.forEach((t, i) => steps.push({ wait: i ? human() : first, act: () => (line.splice(at, 0, t), at++) }));
		const backspace = (n: number, first: number) => {
			for (let i = 0; i < n; i++)
				steps.push({
					wait: i ? BACKSPACE + Math.random() * BACKSPACE_SPREAD : first,
					act: () => (line.splice(at - 1, 1), at--)
				});
		};
		const helloWord = hello.slice(0, 5);
		const bang = hello[5];
		// 1. ii! Hello :)
		type([...glyphs([word[0], word[5], bang]), SPACE, ...glyphs(helloWord), SPACE, ...glyphs(smile)], START);
		// 2. back to "ii"
		backspace(10, PAUSE);
		// 3. one step left, between the i's: "sobe "
		steps.push({ wait: BEAT, act: () => at-- });
		type([...glyphs(word.slice(1, 5)), SPACE], BEAT);
		// 4. End, then "nstitute"
		steps.push({ wait: BEAT, act: () => (at = line.length) });
		type(glyphs(word.slice(6)), BEAT);

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			steps.forEach((s) => s.act());
			draw();
			phase = 'rest';
			onDone?.();
			return;
		}

		const timers: number[] = [];
		draw();
		let t = 0;
		steps.forEach((s, i) => {
			t += s.wait;
			timers.push(
				window.setTimeout(() => {
					s.act();
					draw();
					phase = 'typing';
				}, t)
			);
			const next = steps[i + 1]?.wait ?? Infinity;
			if (next > REST_AFTER) timers.push(window.setTimeout(() => (phase = 'rest'), t + REST_AFTER));
		});
		timers.push(window.setTimeout(() => onDone?.(), t + DONE_AFTER));
		return () => timers.forEach((id) => clearTimeout(id));
	});
</script>

<!-- The glyphs wait hidden until typed (the script sets each one's
     opacity and place). The viewBox runs 0.15 past the glyphs top and
     bottom so round bottoms are not shaved. -->
<svg bind:this={svg} class="GreetingMark" data-state={phase} viewBox="0 -0.15 {VB_W} 9.15" aria-hidden="true">
	<g bind:this={group}>
		{#each HELLO as g, i (i)}<path data-set="hello" data-ch={g.ch} d={g.d} />{/each}
		{#each INSTITUTE as g, i (i)}<path data-set="institute" data-ch={g.ch} d={g.d} />{/each}
		{#each SMILE as g, i (i)}<path data-set="smile" data-ch={g.ch} d={g.d} />{/each}
		<rect bind:this={cursor} class="cursor" x="0" y="0" width="0" height="0" />
	</g>
</svg>

<style>
	.GreetingMark {
		display: block;
		width: 100%;
		fill: currentColor;
		/* The caret reaches past the glyphs (above, below, after). */
		overflow: visible;
	}

	path {
		opacity: 0;
	}

	/* Lit while typing; blinking, hard on/off, when the hand rests. */
	.GreetingMark[data-state='idle'] .cursor,
	.GreetingMark[data-state='rest'] .cursor {
		animation: caret-blink 1.06s steps(1, end) infinite;
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
</style>
