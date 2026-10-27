<script lang="ts">
	import { onMount } from 'svelte';
	import { HELLO, HELLO_SCALE, INSTITUTE, SMILE } from '$lib/js/greeting-glyphs';

	/** The top page's greeting, typed in the logo's own outlines: "Hello!
	    ii", a pause, the "ii" taken back and spelt out — "Hello! isobe
	    institute :)". The same typing as InstituteMark (About): each
	    keystroke snaps the re-centered line and the caret; uneven keys; a
	    real text caret, lit while keys go down, blinking at rest. Letter
	    gaps are the artworks' own. Plays once on mount; with reduced motion
	    the whole greeting just shows. */

	const VB_W = 116.25; // viewBox width = the full greeting
	const SMILE_DY = 0.75; // ":)" sits this much lower (InstituteMark EXTRA_DY)
	const SPACE_GAP_AFTER = 0.35; // the gap a word's first letter keeps after the space
	const II_GAP = 0.33; // "i" to "i", as the ii-ii.co artwork sets it
	const COLON_PAREN_GAP = 0.3; // ":" to ")"
	const FALLBACK_GAP = 0.45;

	// Timing (ms).
	const START = 700;
	const KEY = 80; // fastest keystroke…
	const KEY_SPREAD = 110; // …plus up to this much, at random
	const PAUSE = 1000; // looking at "ii" before taking it back
	const BACKSPACE = 90;
	const REST_AFTER = 300; // no key for this long: the caret blinks

	// Caret, in viewBox units (the glyphs run 0 → 8.71 baseline).
	const CARET_TOP = -0.9;
	const CARET_BOTTOM = 10.9;
	const CARET_GAP = 0.28;
	const CARET_MIN_PX = 2;
	const CARET_EM = 0.16;

	let svg = $state<SVGSVGElement>();
	let group = $state<SVGGElement>();
	let cursor = $state<SVGRectElement>();
	let phase = $state<'idle' | 'typing' | 'rest'>('idle');

	// "ii" (typed, then taken back) are institute "i"s of their own.
	const II = [INSTITUTE[0], INSTITUTE[5]];

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
		const ii = glyphsOf('ii');
		const word = glyphsOf('institute');
		const smile = glyphsOf('smile', SMILE_DY);
		const all = [...hello, ...ii, ...word, ...smile];

		// Letter-to-letter gaps (ink to ink) as the artworks set them.
		const gaps = new Map<string, number>();
		const learn = (seq: Glyph[]) =>
			seq.forEach((g, i) => i && gaps.set(seq[i - 1].ch + g.ch, g.left - (seq[i - 1].left + seq[i - 1].width)));
		learn(hello);
		learn(word.slice(0, 5)); // isobe
		learn(word.slice(5)); // institute
		gaps.set('ii', II_GAP);
		gaps.set(':)', COLON_PAREN_GAP);
		const spaceW = word[5].left - (word[4].left + word[4].width) - SPACE_GAP_AFTER;

		type Token = { glyph: Glyph } | { space: true };
		const line: Token[] = [];

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
		// end. No transitions — every change snaps.
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
			caret.setAttribute('x', String(!last ? -caretW / 2 : end + ('space' in last ? 0 : CARET_GAP)));
		};

		const type = (...tokens: Token[]) => tokens.forEach((t) => steps.push({ wait: human(), act: () => line.push(t) }));
		const glyphs = (gs: Glyph[]) => gs.map((glyph) => ({ glyph }));
		const SPACE: Token = { space: true };

		// The keystrokes, each with the wait before it.
		const steps: { wait: number; act: () => void }[] = [];
		const human = () => KEY + Math.random() * KEY_SPREAD;
		type(...glyphs(hello), SPACE, ...glyphs(ii));
		steps[0].wait = START;
		steps.push({ wait: PAUSE, act: () => line.pop() }, { wait: BACKSPACE, act: () => line.pop() });
		const newWord = steps.length;
		type(...glyphs(word.slice(0, 5)), SPACE, ...glyphs(word.slice(5)), SPACE, ...glyphs(smile));
		steps[newWord].wait += KEY; // a beat before spelling it out

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			steps.forEach((s) => s.act());
			draw();
			phase = 'rest';
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
		return () => timers.forEach((id) => clearTimeout(id));
	});
</script>

<!-- The glyphs wait hidden until typed (the script sets each one's
     opacity and place). The viewBox runs 0.15 past the glyphs top and
     bottom so round bottoms are not shaved. -->
<svg bind:this={svg} class="GreetingMark" data-state={phase} viewBox="0 -0.15 {VB_W} 9.15" aria-hidden="true">
	<g bind:this={group}>
		{#each HELLO as g, i (i)}<path data-set="hello" data-ch={g.ch} d={g.d} />{/each}
		{#each II as g, i (i)}<path data-set="ii" data-ch={g.ch} d={g.d} />{/each}
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
