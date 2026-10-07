<script lang="ts">
	import DomainMark from './DomainMark.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import { COPYRIGHT, INSTAGRAM, LEGAL_LINKS } from '$lib/js/site';

	let { inert = false }: { inert?: boolean } = $props();
</script>

<!-- SP only — the shared footer from the bottom of Figma's SP About frame
     (123:115). On PC the legal line lives in the left panel instead. -->
<footer class="SiteFooter sp" {inert}>
	<DomainMark />

	<div class="bottom t-meta">
		<a class="insta" href={INSTAGRAM.url} target="_blank" rel="noopener">{INSTAGRAM.handle}</a>
		<p class="legal">
			{#each LEGAL_LINKS as l (l.label)}
				{#if l.href}<a href={l.href}>{l.label}</a>{:else}<span>{l.label}</span>{/if}
			{/each}
			<LangSwitch />
		</p>
		<p class="copy">{COPYRIGHT}</p>
	</div>
</footer>

<style>
	/* The ii-ii.co wordmark across the full width, then 40px down the
	   Instagram handle and the legal + © row. */
	.SiteFooter {
		padding: 120px var(--gutter) calc(18px + env(safe-area-inset-bottom, 0px));
		text-align: center;
	}

	.bottom {
		margin-top: 40px;
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'insta .'
			'legal copy';
		row-gap: 8px;
		text-align: left;
	}

	.insta {
		grid-area: insta;
		justify-self: start;
	}

	.legal {
		grid-area: legal;
		display: flex;
		gap: 0.9em;
		color: var(--color-text-mute);
	}

	.copy {
		grid-area: copy;
		white-space: pre; /* keeps the double space before the year */
	}
</style>
