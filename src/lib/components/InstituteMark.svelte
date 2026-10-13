<script lang="ts">
	import { onMount } from 'svelte';

	/** Types the wordmark out like text typed into a centered field: one
	    keystroke at a time, a text caret after the last letter, the line
	    re-centered on every keystroke (so it starts at the middle and widens
	    outward). What sells it as typing, not animation:
	    - nothing moves smoothly — each keystroke snaps the line by half a
	      letter and the caret jumps, exactly as a centered input does;
	    - a human rhythm — uneven intervals, a beat of thought before a new
	      word, the space typed as its own keystroke (the caret steps on, no
	      letter yet);
	    - a real caret — a thin bar from above the ascenders to below the
	      baseline (a bar stopping on the baseline reads as the letter "l"),
	      solid while keys are pressed, blinking (hard on/off, ~530 ms) only
	      when the hand rests, and still blinking at the end.
	    Plays once on mount; with reduced motion the finished mark shows. */
	let { typewriter = false }: { typewriter?: boolean } = $props();

	const START_MS = 1060; // the caret blinks alone first: one full on/off
	const KEY_MS = 75; // fastest keystroke…
	const KEY_SPREAD_MS = 85; // …plus up to this much, at random
	const HESITATE_CHANCE = 0.15; // now and then a slower key
	const HESITATE_MS = 110;
	const NEW_WORD_MS = 180; // the pause after the space, before the next word
	const SETTLE_MS = 530; // the caret stays lit this long after the last key
	// Caret, in viewBox units (the glyphs run 0 → 8.71 baseline).
	const CARET_TOP = -0.9;
	const CARET_BOTTOM = 10.9;
	const CARET_GAP = 0.28; // from the last letter's edge
	const CARET_MIN_PX = 2; // never thinner than this on screen
	const CARET_EM = 0.16; // otherwise this many viewBox units

	let svg = $state<SVGSVGElement>();
	let group = $state<SVGGElement>();
	let cursor = $state<SVGRectElement>();
	let phase = $state<'idle' | 'typing' | 'rest'>('idle');

	onMount(() => {
		if (!typewriter || !svg || !group || !cursor) return;
		const root = svg;
		const track = group;
		const caret = cursor;
		const paths = [...root.querySelectorAll<SVGPathElement>('path')];

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			paths.forEach((p) => (p.style.opacity = '1'));
			phase = 'rest';
			return;
		}

		const boxes = paths.map((p) => p.getBBox());
		const lefts = boxes.map((b) => b.x);
		const rights = boxes.map((b) => b.x + b.width);
		const total = rights[rights.length - 1];
		const unitPx = root.getBoundingClientRect().width / root.viewBox.baseVal.width;
		const caretW = Math.max(CARET_EM, CARET_MIN_PX / unitPx);
		caret.setAttribute('y', String(CARET_TOP));
		caret.setAttribute('height', String(CARET_BOTTOM - CARET_TOP));
		caret.setAttribute('width', String(caretW));

		// Keystrokes: every letter, plus the space wherever a word ends.
		type Key = { shown: number; end: number; newWord?: boolean };
		const keys: Key[] = [];
		paths.forEach((_, i) => {
			keys.push({ shown: i + 1, end: rights[i] });
			const next = lefts[i + 1];
			if (next !== undefined && next - rights[i] > 1) {
				keys.push({ shown: i + 1, end: next - CARET_GAP * 2, newWord: true });
			}
		});

		// The line [0, end] centered on the finished mark [0, total]; the
		// caret just after it. No transitions: every change is a snap.
		const press = (shown: number, end: number) => {
			paths.forEach((p, i) => (p.style.opacity = i < shown ? '1' : '0'));
			track.setAttribute('transform', `translate(${(total - end) / 2} 0)`);
			caret.setAttribute('x', String(end + CARET_GAP));
		};

		const timers: number[] = [];
		const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

		// Before typing: the caret alone, at the middle of the empty line.
		press(0, -CARET_GAP);
		track.setAttribute('transform', `translate(${total / 2 - caretW / 2} 0)`);
		phase = 'idle';

		let at = START_MS;
		keys.forEach((key, i) => {
			later(() => {
				press(key.shown, key.end);
				phase = 'typing';
			}, at);
			let wait = KEY_MS + Math.random() * KEY_SPREAD_MS;
			if (Math.random() < HESITATE_CHANCE) wait += HESITATE_MS;
			if (key.newWord) wait += NEW_WORD_MS;
			if (i < keys.length - 1) at += wait;
		});
		later(() => (phase = 'rest'), at + SETTLE_MS);

		return () => timers.forEach((t) => clearTimeout(t));
	});
</script>

<!-- "Isobe Institute" wordmark (outlined artwork). Fills its container's
     width; takes the text color. The viewBox runs 0.15 past the glyphs top
     and bottom: the round bottoms end at 8.87, past 8.85, and the svg's
     clip would shave them flat. -->
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
		<path d="M0,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16H0ZM1.55.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M7.28,3.35v1.44h-.16c-.42-.56-.95-.92-1.34-.92-.28,0-.46.18-.46.42,0,.37.3.54.86.88.77.48,1.42.91,1.42,1.91,0,1.07-.9,1.78-2.21,1.78-.77,0-1.34-.22-1.6-.35-.06-.43-.1-1.29-.1-1.93h.17c.4.74.97,1.47,1.55,1.47.37,0,.59-.24.59-.54,0-.37-.22-.55-.84-.94-.68-.42-1.35-.89-1.35-1.79,0-1.01.79-1.58,2.1-1.58.49,0,1.12.07,1.37.16Z" />
		<path d="M11.21,3.19c1.39,0,2.99.89,2.99,2.76s-1.66,2.9-3.02,2.9-2.96-.89-2.96-2.76,1.64-2.9,3-2.9ZM11.19,8.1c.55,0,1.13-.89,1.13-2.05s-.58-2.12-1.13-2.12-1.09.91-1.09,2.09.56,2.09,1.09,2.09Z" />
		<path d="M14.26.97v-.16c.23-.1,1.58-.56,2.57-.82v3.93c.52-.44,1.15-.77,1.72-.77.91,0,2.05.76,2.05,2.5,0,2.22-1.74,3.12-3.12,3.12-.5,0-1.5-.07-2.33-.07h-.06V1.51l-.83-.54ZM16.82,4.45v3.3c.13.13.38.29.68.29.7,0,1.27-.82,1.27-1.94,0-1.19-.55-1.83-1.32-1.83-.3,0-.53.11-.64.19Z" />
		<path d="M22.77,5.68c.04,1.24.79,1.9,1.99,1.9.64,0,1.22-.14,1.5-.24l.07.13c-.38.58-1.18,1.37-2.53,1.37-1.54,0-2.65-1.06-2.65-2.72s1.4-2.93,2.64-2.93,2.06.91,2.45,2.39v.11h-3.47ZM22.82,5.07h1.75c-.13-.86-.6-1.14-.85-1.14-.3,0-.76.41-.9,1.14Z" />
		<path d="M28.98,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM30.53.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M36.08,8.71v-.16l.71-.56v-2.96c0-.29-.29-.67-.92-.67-.47,0-.79.22-.9.31v3.32l.71.56v.16h-3.18v-.16l.73-.56v-3.41l-.73-.54v-.16c.22-.1,1.54-.5,2.47-.73v.96c.61-.58,1.2-.92,1.79-.92,1.24,0,1.76.97,1.76,1.29v3.5l.72.56v.16h-3.15Z" />
		<path d="M43.32,3.35v1.44h-.16c-.42-.56-.95-.92-1.34-.92-.28,0-.46.18-.46.42,0,.37.3.54.86.88.77.48,1.42.91,1.42,1.91,0,1.07-.9,1.78-2.21,1.78-.77,0-1.34-.22-1.59-.35-.06-.43-.1-1.29-.1-1.93h.17c.4.74.97,1.47,1.55,1.47.37,0,.59-.24.59-.54,0-.37-.22-.55-.84-.94-.68-.42-1.36-.89-1.36-1.79,0-1.01.79-1.58,2.1-1.58.49,0,1.12.07,1.37.16Z" />
		<path d="M46.51,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path d="M48.84,8.71v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM50.39.74c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M54.69,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path d="M61.14,7.9c-.64.62-1.21.94-1.73.94-1.28,0-1.74-.97-1.74-1.31v-2.95l-.72-.53v-.17c.23-.1,1.46-.49,2.45-.74v3.89c0,.29.24.65.88.65.4,0,.72-.2.86-.31v-2.78l-.83-.53v-.17c.22-.1,1.52-.48,2.55-.74v4.37l.78.52v.16c-.19.06-1.86.54-2.51.67v-.95Z" />
		<path d="M66.19,4.26v2.72c0,.26.25.64.97.64.37,0,.67-.08.83-.13l.08.14c-.32.42-1.08,1.21-1.98,1.21-1.09,0-1.66-.83-1.66-1.31v-3.27h-.71v-.2l2.35-1.92h.11v1.21h2.2l-.55.91h-1.64Z" />
		<path d="M70.1,5.68c.04,1.24.79,1.9,1.99,1.9.64,0,1.22-.14,1.5-.24l.07.13c-.38.58-1.18,1.37-2.53,1.37-1.54,0-2.65-1.06-2.65-2.72s1.4-2.93,2.64-2.93,2.06.91,2.45,2.39v.11h-3.47ZM70.15,5.07h1.75c-.13-.86-.6-1.14-.85-1.14-.3,0-.75.41-.9,1.14Z" />
		{#if typewriter}
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
	   their keystroke (the script sets each one's opacity). */
	:global(html.js) .InstituteMark[data-typewriter] path {
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
