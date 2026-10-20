<script lang="ts">
	import { onMount } from 'svelte';
	import { TYPE_URL } from '$lib/js/site';

	// /type, after studiosly.com.au/fonts: one screen per typeface — a row of
	// Info / Buy / Specimen, a row of controls (size, weight, spacing,
	// leading, background), and the name set large in the face itself, which
	// can be typed over. Info opens the typeface's note in place.
	type Font = {
		name: string;
		family: string;
		/** The variable weight axis this file carries. */
		weight: { min: number; max: number; value: number };
		note: string[];
		buy: string;
		specimen: string;
	};

	// Copy from the foundry's own site (august.tf) — only what it states.
	const FONTS: Font[] = [
		{
			name: 'Ango',
			family: "'Ango', sans-serif",
			weight: { min: 150, max: 950, value: 400 },
			note: ['Reticent and Ravenous.', 'In development · 9 weights.', 'By Apres Guerre.'],
			buy: `${TYPE_URL}/buy`,
			specimen: `${TYPE_URL}/fonts/ango`
		}
	];

	type State = {
		size: number;
		weight: number;
		spacing: number;
		leading: number;
		dark: boolean;
		info: boolean;
		/** What the tester shows while it types itself, and whether its own
		    caret is still up (until the visitor clicks in to type). */
		typed: string;
		caret: boolean;
	};
	// The tester types its greeting itself, as a person would: a caret
	// blinking alone first, then uneven keystrokes, the caret lit while keys
	// go down and blinking (hard on/off) once the hand rests. Clicking in
	// hands it over to the visitor (the browser's own caret from then on).
	const SAMPLE = 'Hello!';
	const TYPE_START_MS = 900;
	const KEY_MS = 90; // fastest keystroke…
	const KEY_SPREAD_MS = 110; // …plus up to this much, at random
	const SIZE = { min: 24, max: 320, value: 180 }; // px
	const SPACING = { min: -0.08, max: 0.2, value: 0 }; // em
	const LEADING = { min: 0.8, max: 1.6, value: 1 };

	let states = $state<State[]>(
		FONTS.map((f) => ({
			size: SIZE.value,
			weight: f.weight.value,
			spacing: SPACING.value,
			leading: LEADING.value,
			dark: false,
			info: false,
			typed: '',
			caret: true
		}))
	);
	let typing = $state(false);

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			states.forEach((s) => (s.typed = SAMPLE));
			return;
		}
		const timers: number[] = [];
		let at = TYPE_START_MS;
		for (let k = 1; k <= SAMPLE.length; k++) {
			timers.push(
				window.setTimeout(() => {
					typing = true;
					states.forEach((s) => s.caret && (s.typed = SAMPLE.slice(0, k)));
				}, at)
			);
			at += KEY_MS + Math.random() * KEY_SPREAD_MS;
		}
		timers.push(window.setTimeout(() => (typing = false), at + 400));
		return () => timers.forEach((t) => clearTimeout(t));
	});

	/** The visitor takes over: the whole greeting, the browser's caret. */
	const handOver = (s: State) => {
		if (!s.caret) return;
		s.typed = SAMPLE;
		s.caret = false;
	};
</script>

<section class="Type" aria-label="Typefaces">
	{#each FONTS as font, i (font.name)}
		{@const s = states[i]}
		<article class="font" class:is-dark={s.dark} aria-label={font.name}>
			<div class="bar t-meta">
				<button type="button" class="btn" aria-expanded={s.info} onclick={() => (s.info = !s.info)}>Info</button>
				<a class="btn" href={font.buy} target="_blank" rel="noopener">Buy</a>
				<a class="btn" href={font.specimen} target="_blank" rel="noopener">Specimen</a>
			</div>

			{#if s.info}
				<div class="info">
					{#each font.note as line (line)}<p>{line}</p>{/each}
					<button type="button" class="btn close t-meta" onclick={() => (s.info = false)}>Close</button>
				</div>
			{/if}

			<div class="controls t-meta">
				<label class="control">
					<span>Size</span>
					<input type="range" min={SIZE.min} max={SIZE.max} step="1" bind:value={s.size} />
				</label>
				<label class="control">
					<span>Weight</span>
					<input type="range" min={font.weight.min} max={font.weight.max} step="1" bind:value={s.weight} />
				</label>
				<label class="control">
					<span>Spacing</span>
					<input type="range" min={SPACING.min} max={SPACING.max} step="0.005" bind:value={s.spacing} />
				</label>
				<label class="control">
					<span>Leading</span>
					<input type="range" min={LEADING.min} max={LEADING.max} step="0.01" bind:value={s.leading} />
				</label>
				<button
					type="button"
					class="control background"
					aria-pressed={s.dark}
					onclick={() => (s.dark = !s.dark)}
				>
					<span>Background</span>
					<span class="swatch" aria-hidden="true"></span>
				</button>
			</div>

			<!-- The tester: a greeting set in the face itself; type over it. -->
			<div class="stage">
			<div
				class="tester"
				contenteditable="plaintext-only"
				spellcheck="false"
				role="textbox"
				aria-label="{font.name} type tester"
				tabindex="0"
				style:font-family={font.family}
				style:font-size="min({s.size}px, 22vw)"
				style:font-weight={s.weight}
				style:letter-spacing="{s.spacing}em"
				style:line-height={s.leading}
				onfocus={() => handOver(s)}
			>
				{s.typed}{#if s.caret}<span class="caret" class:is-typing={typing} contenteditable="false" aria-hidden="true"></span>{/if}
			</div>
			</div>
		</article>
	{/each}
</section>

<style>
	.Type {
		padding-top: 70px;
	}

	.font {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 70px);
		min-height: calc(100dvh - 70px);
		padding: 0 var(--gutter) 40px;
		background: var(--color-bg);
		color: var(--color-text);
		transition:
			background-color 0.4s ease,
			color 0.4s ease;
	}

	.font.is-dark {
		background: #000;
		color: #fff;
	}

	/* Info · Buy · Specimen */
	.bar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		font-size: 12.5px;
	}

	.bar .btn:nth-child(1) {
		justify-self: start;
	}

	.bar .btn:nth-child(2) {
		justify-self: center;
	}

	.bar .btn:nth-child(3) {
		justify-self: end;
	}

	.btn {
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition: opacity 0.3s ease;
	}

	.btn:hover {
		opacity: 0.5;
	}

	.info {
		max-width: 460px;
		margin-top: 24px;
		font-size: 14px;
		line-height: 1.5;
	}

	.close {
		margin-top: 12px;
		font-size: 12.5px;
	}

	/* Size · Weight · Spacing · Leading · Background */
	.controls {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px 24px;
		margin-top: 32px;
		font-size: 12.5px;
	}

	.control {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.background {
		align-items: flex-start;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.swatch {
		width: 16px;
		height: 16px;
		border: 1px solid currentColor;
		border-radius: 50%;
	}

	.background[aria-pressed='true'] .swatch {
		background: currentColor;
	}

	/* A hairline track with a pill-shaped handle. */
	input[type='range'] {
		appearance: none;
		width: 100%;
		height: 16px;
		margin: 0;
		background: linear-gradient(currentColor, currentColor) center / 100% 1px no-repeat;
		color: inherit;
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 28px;
		height: 16px;
		border-radius: 8px;
		background: currentColor;
	}

	input[type='range']::-moz-range-thumb {
		width: 28px;
		height: 16px;
		border: 0;
		border-radius: 8px;
		background: currentColor;
	}

	.stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}

	.tester {
		width: 100%;
		outline: none;
		text-align: center;
		overflow-wrap: anywhere;
		cursor: text;
	}

	/* The tester's own caret while it types: a thin bar, about the text's
	   height, lit while typing and blinking at rest. */
	.caret {
		display: inline-block;
		width: max(2px, 0.03em);
		height: 1em;
		margin-left: 0.04em;
		vertical-align: -0.12em;
		background: currentColor;
		animation: caret-blink 1.06s steps(1, end) infinite;
	}

	.caret.is-typing {
		animation: none;
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

	@media (min-width: 1024px) {
		.Type {
			padding-top: 80px;
		}

		.font {
			min-height: calc(100vh - 80px);
			min-height: calc(100dvh - 80px);
		}

		.controls {
			grid-template-columns: repeat(4, minmax(0, 240px)) auto;
			justify-content: space-between;
			gap: 24px;
		}

		/* PC: each label with its track to its right, on one line. */
		.control {
			flex-direction: row;
			align-items: center;
			gap: 14px;
		}

		.control > span:first-child {
			flex: none;
		}

		/* A small round handle. */
		input[type='range']::-webkit-slider-thumb {
			width: 11px;
			height: 11px;
			border-radius: 50%;
		}

		input[type='range']::-moz-range-thumb {
			width: 11px;
			height: 11px;
			border-radius: 50%;
		}
	}
</style>
