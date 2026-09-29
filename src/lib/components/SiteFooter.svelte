<script lang="ts">
	import Logo from './Logo.svelte';
	import { COPYRIGHT, INSTAGRAM, LEGAL_LINKS, SITE_FULL_NAME } from '$lib/js/site';

	let { inert = false }: { inert?: boolean } = $props();
</script>

<!-- SP only — the shared footer from the bottom of Figma's SP About frame
     (123:115). On PC the legal line lives in the left panel instead. -->
<footer class="SiteFooter sp" {inert}>
	<a class="mark" href="/" aria-label="II — Creation Archive">
		<Logo />
	</a>
	<p class="name t-subtitle">{SITE_FULL_NAME}</p>

	<div class="bottom t-meta">
		<a class="insta" href={INSTAGRAM.url} target="_blank" rel="noopener">{INSTAGRAM.handle}</a>
		<p class="legal">
			{#each LEGAL_LINKS as l (l.label)}
				{#if l.href}<a href={l.href}>{l.label}</a>{:else}<span>{l.label}</span>{/if}
			{/each}
		</p>
		<p class="copy">{COPYRIGHT}</p>
	</div>
</footer>

<style>
	/* Figma: 74px under the last text line, mark 133.7px at y=1756,
	   "ISOBE INSTITUTE" 18px at y=1929, @ii_institute at y=2091, legal + ©
	   at y=2110, frame ends y=2139. */
	.SiteFooter {
		padding: 74px var(--gutter) calc(18px + env(safe-area-inset-bottom, 0px));
		text-align: center;
	}

	.mark {
		display: block;
		width: 133.7px;
		margin: 0 auto;
	}

	.name {
		margin-top: 39px;
		font-size: var(--fs-brand);
	}

	.bottom {
		margin-top: 140px;
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
