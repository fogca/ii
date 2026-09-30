<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { lang, type Lang } from '$lib/state/lang.svelte';
	import { COPYRIGHT, LEGAL_LINKS } from '$lib/js/site';

	let {
		eyebrow = '',
		title = '',
		inert = false
	}: { eyebrow?: string; title?: string; inert?: boolean } = $props();

	const LANGS: { code: Lang; label: string; name: string }[] = [
		{ code: 'ja', label: 'JA', name: '日本語' },
		{ code: 'en', label: 'EN', name: 'English' }
	];
</script>

<!-- PC: the fixed left panel ("header" column) carrying the page title and
     the legal line. SP: the same title block, in flow at the top of the page.
     A plain div, not <aside>: it holds the page's h1, which must not sit in a
     complementary landmark. -->
<div class="Aside" class:is-entered={ui.entered} {inert}>
	{#key title}
		<div class="head">
			{#if eyebrow}<p class="eyebrow t-eyebrow">{eyebrow}</p>{/if}
			<h1 class="title t-title">{title}</h1>
		</div>
	{/key}

	<div class="foot t-meta pc">
		<p class="legal">
			{#each LEGAL_LINKS as l (l.label)}
				{#if l.href}<a href={l.href}>{l.label}</a>{:else}<span>{l.label}</span>{/if}
			{/each}
			<!-- Display language (Office's model — lib/state/lang.svelte.ts):
			     the current one reads in full black, the other stays muted. -->
			<span class="lang" role="group" aria-label="Language">
				{#each LANGS as l, i (l.code)}
					{#if i > 0}<span aria-hidden="true">/</span>{/if}
					<button
						type="button"
						class:is-current={lang.current === l.code}
						aria-pressed={lang.current === l.code}
						aria-label={l.name}
						onclick={() => lang.set(l.code)}>{l.label}</button
					>
				{/each}
			</span>
		</p>
		<p class="copy">{COPYRIGHT}</p>
	</div>
</div>

<style>
	/* SP (Figma 113:516 / 128:376 / 123:115): eyebrow at y=147, title at
	   y=168 (both centered), content from y=344. */
	.Aside {
		position: relative;
		padding: 147px var(--gutter) 0;
		min-height: 344px;
		text-align: center;
	}

	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 9px;
		transition:
			opacity 0.9s var(--ease-out) 0.15s,
			transform 1.1s var(--ease-out) 0.15s;
	}

	/* Fades in when the page enters (JS only — without it, just shown). */
	:global(html.js) .Aside:not(.is-entered) .head {
		opacity: 0;
		transform: translateY(8px);
	}

	.title {
		/* Figma breaks every title onto two lines ("CREATION / ARCHIVE",
		   "MOKUSEKI / FURNITURE"); CMS titles have no break of their own, so
		   a ~9-character measure + balance reproduces that. */
		max-width: 9.6em;
		white-space: pre-line;
		text-wrap: balance;
	}

	/* PC (Figma 79:154): fixed 455/1440-wide panel; title vertically
	   centered (y≈399–500 of 900), eyebrow 12px above it; legal line at the
	   bottom (y=873). */
	@media (min-width: 1024px) {
		.Aside {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			width: var(--aside-w);
			min-height: 0;
			padding: 0 var(--gutter);
			z-index: var(--z-content);
		}

		/* Figma centers the title block on x=220.5 of the 455px panel, not
		   its middle (227.5) — 14/1440 more room on the right. */
		.head {
			position: absolute;
			top: 50%;
			left: var(--gutter);
			right: calc(var(--gutter) + 14 / 1440 * 100vw);
			display: block;
			transform: translateY(-50%);
		}

		:global(html.js) .Aside:not(.is-entered) .head {
			transform: translateY(calc(-50% + 8px));
		}

		.eyebrow {
			position: absolute;
			left: 0;
			right: 0;
			bottom: calc(100% + 12px);
		}

		.title {
			margin-inline: auto;
		}

		/* Figma: legal line from x=20, © ending at x≈429, baseline row y=873. */
		.foot {
			position: absolute;
			left: var(--gutter);
			right: calc(26 / 1440 * 100vw);
			bottom: calc(16px + env(safe-area-inset-bottom, 0px));
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			color: var(--color-text-mute);
			text-align: left;
			transition: opacity 0.9s var(--ease-out) 0.3s;
		}

		:global(html.js) .Aside:not(.is-entered) .foot {
			opacity: 0;
		}

		.copy {
			white-space: pre; /* keeps the double space before the year */
		}

		.legal {
			display: flex;
			gap: 0.9em;
		}

		.lang {
			display: inline-flex;
			gap: 0.35em;
		}

		.lang button {
			padding: 0;
			line-height: inherit;
			transition: color 0.3s ease;
		}

		.lang button:hover,
		.lang button.is-current {
			color: var(--color-text);
		}
	}
</style>
