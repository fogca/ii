<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { COPYRIGHT, LEGAL_LINKS } from '$lib/js/site';

	let { eyebrow = '', title = '' }: { eyebrow?: string; title?: string } = $props();
</script>

<!-- PC: the fixed left panel ("header" column) carrying the page title and
     the legal line. SP: the same title block, in flow at the top of the page. -->
<aside class="Aside" class:is-entered={ui.entered} aria-label="Page">
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
		</p>
		<p class="copy">{COPYRIGHT}</p>
	</div>
</aside>

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
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 0.9s var(--ease-out) 0.15s,
			transform 1.1s var(--ease-out) 0.15s;
	}

	.is-entered .head {
		opacity: 1;
		transform: none;
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

		.head {
			position: absolute;
			top: 50%;
			left: var(--gutter);
			right: var(--gutter);
			display: block;
			transform: translateY(calc(-50% + 8px));
		}

		.is-entered .head {
			transform: translateY(-50%);
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

		.foot {
			position: absolute;
			left: var(--gutter);
			right: var(--gutter);
			bottom: calc(16px + env(safe-area-inset-bottom, 0px));
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			color: var(--color-text-mute);
			text-align: left;
			opacity: 0;
			transition: opacity 0.9s var(--ease-out) 0.3s;
		}

		.is-entered .foot {
			opacity: 1;
		}

		.legal {
			display: flex;
			gap: 0.9em;
		}
	}
</style>
