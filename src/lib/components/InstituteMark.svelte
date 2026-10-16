<script lang="ts">
	import { onMount } from 'svelte';

	/** The About wordmark, typed like text in a centered field: "isobe
	    institute" is typed out, read for a moment, then edited down to its
	    initials — backspace from the end to "isobe i", one step left,
	    backspace "sobe " so the two i's close up into "ii" — and finally
	    End and "-ii.co" typed on: Isobe Institute → ii → ii-ii.co.
	    The "-ii.co" glyphs come from the ii-ii.co artwork, which is the same
	    type at the same size (identical outlines, baseline 0.75 lower here),
	    and every letter-to-letter gap is the artwork's own where the pair
	    exists in either mark, so "ii-ii.co" lands exactly on the artwork.
	    Then, after a beat, " :)" — the colon is the artwork's period twice,
	    the parenthesis drawn to match (neither artwork has them).
	    What makes it read as typing rather than animation: nothing moves
	    smoothly (each keystroke snaps the re-centered line and the caret),
	    the rhythm is a person's (uneven keys, a pause before a new word,
	    deliberate edits), and the caret is a real text caret — a thin bar
	    from above the ascenders to below the baseline, lit while keys go
	    down, blinking (hard on/off, ~530 ms) when the hand rests.
	    Plays once on mount; with reduced motion "isobe institute" just
	    shows (as it does without JS). */
	let {
		typewriter = false,
		speed = 1,
		onDone
	}: {
		typewriter?: boolean;
		/** Runs the whole sequence this many times faster (the opening
		    plays it at a clip). */
		speed?: number;
		/** Called a beat after the last key. */
		onDone?: () => void;
	} = $props();

	const VB_W = 73.66; // viewBox width = the full "isobe institute"
	const EXTRA_DY = 0.75; // ii-ii.co artwork baseline → this one's
	const SPACE_GAP_AFTER = 0.35; // the gap a word's first letter keeps after the space
	const FALLBACK_GAP = 0.45; // for pairs neither artwork shows (only mid-edit)

	// Timing (ms).
	const START = 1060; // the caret blinks alone first
	const KEY = 75; // fastest keystroke…
	const KEY_SPREAD = 85; // …plus up to this much, at random
	const HESITATE_CHANCE = 0.15;
	const HESITATE = 110;
	const NEW_WORD = 180; // after the space, before the next word
	const READ = 1700; // "isobe institute" stays, the caret blinking
	const DELETE = 70; // backspace…
	const DELETE_SPREAD = 50; // …uneven too
	const BEAT = 380; // small decisions: a caret move, the next edit
	const SEE_II = 900; // "ii" stays a moment
	const BEFORE_SMILE = 650; // a beat after "ii-ii.co", then " :)"
	const COLON_PAREN_GAP = 0.3; // ":" to ")" (neither artwork has the pair)
	const REST_AFTER = 530; // the caret starts blinking this long after a key

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

	onMount(() => {
		if (!typewriter || !svg || !group || !cursor) return;
		const root = svg;
		const track = group;
		const caret = cursor;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			root.querySelectorAll<SVGPathElement>('path:not(.extra):not(.ref):not(.smile)').forEach((p) => (p.style.opacity = '1'));
			phase = 'rest';
			onDone?.();
			return;
		}

		type Glyph = { el: SVGPathElement; ch: string; left: number; width: number; dy: number };
		const glyphOf = (el: SVGPathElement, dy: number): Glyph => {
			const b = el.getBBox();
			return { el, ch: el.dataset.ch ?? '', left: b.x, width: b.width, dy };
		};
		const word = [...root.querySelectorAll<SVGPathElement>('path:not(.extra):not(.ref):not(.smile)')].map((el) => glyphOf(el, 0));
		const extra = [...root.querySelectorAll<SVGPathElement>('path.extra')].map((el) => glyphOf(el, EXTRA_DY));
		const ref = [...root.querySelectorAll<SVGPathElement>('path.ref')].map((el) => glyphOf(el, EXTRA_DY));
		const smile = [...root.querySelectorAll<SVGPathElement>('path.smile')].map((el) => glyphOf(el, EXTRA_DY));

		// Letter-to-letter gaps (ink to ink) as the two artworks set them.
		const gaps = new Map<string, number>();
		const learn = (seq: Glyph[]) =>
			seq.forEach((g, i) => i && gaps.set(seq[i - 1].ch + g.ch, g.left - (seq[i - 1].left + seq[i - 1].width)));
		learn(word.slice(0, 5)); // isobe
		learn(word.slice(5)); // institute
		learn([...ref, ...extra]); // ii-ii.co
		gaps.set(':)', COLON_PAREN_GAP);
		const spaceW = word[5].left - (word[4].left + word[4].width) - SPACE_GAP_AFTER;

		// The line being edited: glyphs and the one space, and a caret index.
		type Token = { glyph: Glyph } | { space: true };
		const line: Token[] = [];
		let at = 0;

		const layout = () => {
			const xs: { left: number; right: number }[] = [];
			let x = 0;
			let prev: Glyph | null = null;
			let afterSpace = false;
			for (const t of line) {
				if ('space' in t) {
					x += spaceW;
					xs.push({ left: x - spaceW, right: x });
					afterSpace = true;
					continue;
				}
				const g = t.glyph;
				const gap = !prev ? 0 : afterSpace ? SPACE_GAP_AFTER : (gaps.get(prev.ch + g.ch) ?? FALLBACK_GAP);
				const left = x + gap;
				xs.push({ left, right: left + g.width });
				x = left + g.width;
				prev = g;
				afterSpace = false;
			}
			return { xs, end: x };
		};

		const caretW = Math.max(CARET_EM, CARET_MIN_PX / (root.getBoundingClientRect().width / VB_W));
		caret.setAttribute('y', String(CARET_TOP));
		caret.setAttribute('height', String(CARET_BOTTOM - CARET_TOP));
		caret.setAttribute('width', String(caretW));

		// Draw the line: shown glyphs at their places, the line centered on
		// the box, the caret at its index. No transitions — every change snaps.
		const draw = () => {
			const { xs, end } = layout();
			[...word, ...extra, ...smile].forEach((g) => (g.el.style.opacity = '0'));
			line.forEach((t, i) => {
				if ('space' in t) return;
				const g = t.glyph;
				g.el.style.opacity = '1';
				g.el.setAttribute('transform', `translate(${xs[i].left - g.left} ${g.dy})`);
			});
			track.setAttribute('transform', `translate(${(VB_W - end) / 2} 0)`);
			let cx: number;
			if (!line.length) cx = -caretW / 2;
			else if (at >= line.length) cx = end + ('space' in line[line.length - 1] ? 0 : CARET_GAP);
			else cx = xs[at].left - CARET_GAP - caretW;
			caret.setAttribute('x', String(cx));
		};

		// The keystrokes, each with the wait before it.
		type Step = { wait: number; act: () => void };
		const steps: Step[] = [];
		const human = () => KEY + Math.random() * KEY_SPREAD + (Math.random() < HESITATE_CHANCE ? HESITATE : 0);
		const typeOne = (t: Token, wait: number) =>
			steps.push({ wait, act: () => (line.splice(at, 0, t), at++) });
		const backspace = (wait: number) => steps.push({ wait, act: () => (line.splice(at - 1, 1), at--) });

		// 1. isobe institute
		word.forEach((g, i) => {
			typeOne({ glyph: g }, i === 0 ? START : i === 5 ? human() + NEW_WORD : human());
			if (i === 4) typeOne({ space: true }, human());
		});
		// 2. backspace "nstitute" → "isobe i"
		for (let i = 0; i < 8; i++) backspace(i === 0 ? READ : DELETE + Math.random() * DELETE_SPREAD);
		// 3. one step left, before that last "i"
		steps.push({ wait: BEAT, act: () => at-- });
		// 4. backspace "sobe " → "ii"
		for (let i = 0; i < 5; i++) backspace(i === 0 ? BEAT : DELETE + 30 + Math.random() * DELETE_SPREAD);
		// 5. End, then "-ii.co"
		steps.push({ wait: SEE_II, act: () => (at = line.length) });
		extra.forEach((g, i) => typeOne({ glyph: g }, i === 0 ? BEAT : human()));
		// 6. and a smile: " :)"
		typeOne({ space: true }, BEFORE_SMILE);
		smile.forEach((g) => typeOne({ glyph: g }, human()));

		const timers: number[] = [];
		draw();
		phase = 'idle';
		let t = 0;
		steps.forEach((s, i) => {
			t += s.wait / speed;
			timers.push(
				window.setTimeout(() => {
					s.act();
					draw();
					phase = 'typing';
				}, t)
			);
			const next = steps[i + 1]?.wait ?? Infinity;
			if (next > REST_AFTER + 120) {
				timers.push(window.setTimeout(() => (phase = 'rest'), t + REST_AFTER / speed));
			}
		});
		timers.push(window.setTimeout(() => onDone?.(), t + (REST_AFTER + 450) / speed));

		return () => timers.forEach((id) => clearTimeout(id));
	});
</script>

<!-- "Isobe Institute" wordmark (outlined artwork). Fills its container's
     width; takes the text color. The viewBox runs 0.15 past the glyphs top
     and bottom: the round bottoms end at 8.87, past 8.85, and the svg's
     clip would shave them flat. With `typewriter`, it also carries the
     "-ii.co" glyphs of the ii-ii.co artwork (hidden until typed) and two
     of its "i"s as spacing references (never shown). -->
<svg
	bind:this={svg}
	class="InstituteMark"
	data-typewriter={typewriter ? '' : undefined}
	data-state={phase}
	viewBox="0 -0.15 73.66 9.15"
	role="img"
	aria-label="Isobe Institute"
>
	<g bind:this={group}>
		<path data-ch="i" d="M0,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16H0ZM1.55.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path data-ch="s" d="M7.28,3.35v1.44h-.16c-.42-.56-.95-.92-1.34-.92-.28,0-.46.18-.46.42,0,.37.3.54.86.88.77.48,1.42.91,1.42,1.91,0,1.07-.9,1.78-2.21,1.78-.77,0-1.34-.22-1.6-.35-.06-.43-.1-1.29-.1-1.93h.17c.4.74.97,1.47,1.55,1.47.37,0,.59-.24.59-.54,0-.37-.22-.55-.84-.94-.68-.42-1.35-.89-1.35-1.79,0-1.01.79-1.58,2.1-1.58.49,0,1.12.07,1.37.16Z" />
		<path data-ch="o" d="M11.21,3.19c1.39,0,2.99.89,2.99,2.76s-1.66,2.9-3.02,2.9-2.96-.89-2.96-2.76,1.64-2.9,3-2.9ZM11.19,8.1c.55,0,1.13-.89,1.13-2.05s-.58-2.12-1.13-2.12-1.09.91-1.09,2.09.56,2.09,1.09,2.09Z" />
		<path data-ch="b" d="M14.26.97v-.16c.23-.1,1.58-.56,2.57-.82v3.93c.52-.44,1.15-.77,1.72-.77.91,0,2.05.76,2.05,2.5,0,2.22-1.74,3.12-3.12,3.12-.5,0-1.5-.07-2.33-.07h-.06V1.51l-.83-.54ZM16.82,4.45v3.3c.13.13.38.29.68.29.7,0,1.27-.82,1.27-1.94,0-1.19-.55-1.83-1.32-1.83-.3,0-.53.11-.64.19Z" />
		<path data-ch="e" d="M22.77,5.68c.04,1.24.79,1.9,1.99,1.9.64,0,1.22-.14,1.5-.24l.07.13c-.38.58-1.18,1.37-2.53,1.37-1.54,0-2.65-1.06-2.65-2.72s1.4-2.93,2.64-2.93,2.06.91,2.45,2.39v.11h-3.47ZM22.82,5.07h1.75c-.13-.86-.6-1.14-.85-1.14-.3,0-.76.41-.9,1.14Z" />
		<path data-ch="i" d="M28.98,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM30.53.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path data-ch="n" d="M36.08,8.71v-.16l.71-.56v-2.96c0-.29-.29-.67-.92-.67-.47,0-.79.22-.9.31v3.32l.71.56v.16h-3.18v-.16l.73-.56v-3.41l-.73-.54v-.16c.22-.1,1.54-.5,2.47-.73v.96c.61-.58,1.2-.92,1.79-.92,1.24,0,1.76.97,1.76,1.29v3.5l.72.56v.16h-3.15Z" />
		<path data-ch="s" d="M43.32,3.35v1.44h-.16c-.42-.56-.95-.92-1.34-.92-.28,0-.46.18-.46.42,0,.37.3.54.86.88.77.48,1.42.91,1.42,1.91,0,1.07-.9,1.78-2.21,1.78-.77,0-1.34-.22-1.59-.35-.06-.43-.1-1.29-.1-1.93h.17c.4.74.97,1.47,1.55,1.47.37,0,.59-.24.59-.54,0-.37-.22-.55-.84-.94-.68-.42-1.36-.89-1.36-1.79,0-1.01.79-1.58,2.1-1.58.49,0,1.12.07,1.37.16Z" />
		<path data-ch="t" d="M46.51,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path data-ch="i" d="M48.84,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM50.39.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path data-ch="t" d="M54.69,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path data-ch="u" d="M61.14,7.9c-.64.62-1.21.94-1.73.94-1.28,0-1.74-.97-1.74-1.31v-2.95l-.72-.53v-.17c.23-.1,1.46-.49,2.45-.74v3.89c0,.29.24.65.88.65.4,0,.72-.2.86-.31v-2.78l-.83-.53v-.17c.22-.1,1.52-.48,2.55-.74v4.37l.78.52v.16c-.19.06-1.86.54-2.51.67v-.95Z" />
		<path data-ch="t" d="M66.19,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path data-ch="e" d="M70.1,5.68c.04,1.24.79,1.9,1.99,1.9.64,0,1.22-.14,1.5-.24l.07.13c-.38.58-1.18,1.37-2.53,1.37-1.54,0-2.65-1.06-2.65-2.72s1.4-2.93,2.64-2.93,2.06.91,2.45,2.39v.11h-3.47ZM70.15,5.07h1.75c-.13-.86-.6-1.14-.85-1.14-.3,0-.75.41-.9,1.14Z" />
		{#if typewriter}
			<path class="extra" data-ch="-" d="M7.4,4.29h2.6v1.39h-2.6v-1.39Z" />
			<path class="extra" data-ch="i" d="M10.74,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM12.29,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
			<path class="extra" data-ch="i" d="M14.26,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM15.8,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
			<path class="extra" data-ch="." d="M19.1,8.13c-.61,0-1.03-.44-1.03-1.01s.42-1.02,1.03-1.02c.56,0,1.01.46,1.01,1.02s-.43,1.01-1.01,1.01Z" />
			<path class="extra" data-ch="c" d="M25.5,2.59v1.75h-.16c-.77-.72-1.46-1.1-1.85-1.1s-1.1.58-1.1,1.64c0,1.13.76,1.96,1.96,1.96.59,0,1.09-.16,1.32-.25l.11.14c-.31.5-1.22,1.37-2.31,1.37-1.44,0-2.72-.98-2.72-2.69s1.26-2.97,3.26-2.97c.6,0,1.31.12,1.5.16Z" />
			<path class="extra" data-ch="o" d="M29.24,2.45c1.39,0,2.99.89,2.99,2.76s-1.66,2.9-3.02,2.9-2.96-.89-2.96-2.76,1.64-2.9,3-2.9ZM29.23,7.35c.55,0,1.13-.89,1.13-2.05s-.58-2.12-1.13-2.12-1.09.91-1.09,2.09.56,2.09,1.09,2.09Z" />
			<path class="ref" data-ch="i" d="M0,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16H0ZM1.55,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
			<path class="ref" data-ch="i" d="M3.52,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM5.06,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
			<!-- ":" = the artwork's "." twice, the upper one topped at the
			     x-height; ")" drawn to the type's weight, from above the
			     ascenders to below the baseline (neither artwork has them). -->
			<path
				class="smile"
				data-ch=":"
				d="M19.1,8.13c-.61,0-1.03-.44-1.03-1.01s.42-1.02,1.03-1.02c.56,0,1.01.46,1.01,1.02s-.43,1.01-1.01,1.01ZM19.1,4.63c-.61,0-1.03-.44-1.03-1.01s.42-1.02,1.03-1.02c.56,0,1.01.46,1.01,1.02s-.43,1.01-1.01,1.01Z"
			/>
			<path
				class="smile"
				data-ch=")"
				d="M0,-.6C2.75,1,3.55,2.9,3.55,4.5S2.75,8,0,9.6L-.35,9.15C1.4,7.75,1.85,6.2,1.85,4.5S1.4,1.25-.35,-.15Z"
			/>
			<rect bind:this={cursor} class="cursor" x="0" y="0" width="0" height="0" />
		{/if}
	</g>
</svg>

<style>
	.InstituteMark {
		display: block;
		width: 100%;
		fill: currentColor;
		/* The caret reaches past the glyphs (above, below, after). */
		overflow: visible;
	}

	/* Without JS the mark is just shown; with it, the letters wait for
	   their keystroke (the script sets each one's opacity). The ii-ii.co
	   glyphs only ever show when typed; the reference "i"s never do. */
	:global(html.js) .InstituteMark[data-typewriter] path,
	.extra,
	.smile,
	.ref {
		opacity: 0;
	}

	/* Lit while typing; blinking, hard on/off like a text caret, when the
	   hand rests — before the first key and after the last. */
	.cursor {
		opacity: 1;
	}

	.InstituteMark[data-state='idle'] .cursor,
	.InstituteMark[data-state='rest'] .cursor {
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
