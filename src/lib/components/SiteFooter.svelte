<script lang="ts">
	import LangSwitch from './LangSwitch.svelte';
	import { COPYRIGHT, INSTAGRAM, LEGAL_LINKS } from '$lib/js/site';

	let { inert = false }: { inert?: boolean } = $props();
</script>

<!-- SP only — the shared footer from the bottom of Figma's SP About frame
     (123:115). On PC the legal line lives in the left panel instead. -->
<footer class="SiteFooter sp" {inert}>
	<!-- "ii-ii.co" wordmark (outlined artwork), the full content width. -->
	<svg class="domain" viewBox="0 0 32.23 8.13" role="img" aria-label="ii-ii.co">
		<path d="M0,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16H0ZM1.55,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M3.52,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM5.06,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M7.4,4.29h2.6v1.39h-2.6v-1.39Z" />
		<path d="M10.74,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM12.29,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M14.26,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM15.8,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" />
		<path d="M19.1,8.13c-.61,0-1.03-.44-1.03-1.01s.42-1.02,1.03-1.02c.56,0,1.01.46,1.01,1.02s-.43,1.01-1.01,1.01Z" />
		<path d="M25.5,2.59v1.75h-.16c-.77-.72-1.46-1.1-1.85-1.1s-1.1.58-1.1,1.64c0,1.13.76,1.96,1.96,1.96.59,0,1.09-.16,1.32-.25l.11.14c-.31.5-1.22,1.37-2.31,1.37-1.44,0-2.72-.98-2.72-2.69s1.26-2.97,3.26-2.97c.6,0,1.31.12,1.5.16Z" />
		<path d="M29.24,2.45c1.39,0,2.99.89,2.99,2.76s-1.66,2.9-3.02,2.9-2.96-.89-2.96-2.76,1.64-2.9,3-2.9ZM29.23,7.35c.55,0,1.13-.89,1.13-2.05s-.58-2.12-1.13-2.12-1.09.91-1.09,2.09.56,2.09,1.09,2.09Z" />
	</svg>

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
		padding: 74px var(--gutter) calc(18px + env(safe-area-inset-bottom, 0px));
		text-align: center;
	}

	.domain {
		display: block;
		width: 100%;
		fill: currentColor;
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
