<script lang="ts">
	import { onMount } from 'svelte';

	/** Types the wordmark out letter by letter, a cursor trailing the last
	    letter, the typed part kept centered as it grows (so it starts at the
	    middle and widens outward). Plays once on mount; with reduced motion
	    the finished mark just shows. */
	let { typewriter = false }: { typewriter?: boolean } = $props();

	const START_MS = 500; // cursor blinks alone first
	const LETTER_MS = 115; // per letter, a touch of rhythm added below
	const WORD_GAP_MS = 140; // the pause at the space
	const BLINK_MS = 1900; // the cursor keeps blinking after the last letter, then goes
	const CURSOR_W = 0.42; // viewBox units
	const CURSOR_GAP = 0.3;

	let svg = $state<SVGSVGElement>();
	let group = $state<SVGGElement>();
	let cursor = $state<SVGRectElement>();
	let phase = $state<'idle' | 'typing' | 'blink' | 'done'>('idle');

	onMount(() => {
		if (!typewriter || !svg || !group || !cursor) return;
		const root = svg;
		const track = group;
		const bar = cursor;
		const paths = [...root.querySelectorAll<SVGPathElement>('path')];
		const rights = paths.map((p) => {
			const b = p.getBBox();
			return b.x + b.width;
		});
		const lefts = paths.map((p) => p.getBBox().x);
		const total = rights[rights.length - 1];
		const timers: number[] = [];
		const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

		const show = (k: number) => {
			paths.forEach((p, i) => (p.style.opacity = i < k ? '1' : '0'));
			// The typed span [0, rights[k-1]] centered on the full span.
			const typed = k ? rights[k - 1] : 0;
			track.style.transform = `translateX(${(total - typed) / 2}px)`;
			bar.setAttribute('x', String(k ? typed + CURSOR_GAP : total / 2 - CURSOR_W / 2));
		};

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			paths.forEach((p) => (p.style.opacity = '1'));
			phase = 'done';
			return;
		}

		show(0);
		phase = 'idle';
		let at = START_MS;
		paths.forEach((_, i) => {
			const k = i + 1;
			later(() => {
				show(k);
				phase = 'typing';
			}, at);
			// Rhythm: a little uneven, longer where the next letter starts a new word.
			const gap = i < paths.length - 1 ? lefts[i + 1] - rights[i] : 0;
			at += LETTER_MS + (gap > 1 ? WORD_GAP_MS : 0) + ((i * 37) % 5) * 8;
		});
		later(() => (phase = 'blink'), at);
		later(() => (phase = 'done'), at + BLINK_MS);

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
			<rect bind:this={cursor} class="cursor" x="0" y="0" width="0.42" height="8.87" />
		{/if}
	</g>
</svg>

<style>
	.InstituteMark {
		display: block;
		width: 100%;
		fill: currentColor;
		/* The cursor trails past the last letter. */
		overflow: visible;
	}

	/* Without JS the mark is just shown; with it, the letters wait for
	   their turn (the script sets each one's opacity). */
	:global(html.js) .InstituteMark[data-typewriter] path {
		opacity: 0;
	}

	.InstituteMark g {
		transition: transform 130ms ease-out;
	}

	.cursor {
		opacity: 0;
	}

	.InstituteMark[data-state='idle'] .cursor,
	.InstituteMark[data-state='blink'] .cursor {
		animation: cursor-blink 1.05s steps(1, end) infinite;
	}

	.InstituteMark[data-state='typing'] .cursor {
		opacity: 1;
	}

	@keyframes cursor-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
