<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import Aside from '$lib/components/Aside.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { SITE_DESCRIPTION, titleOf } from '$lib/js/site';

	let { children, data } = $props();

	// Only the archive index has an opening (Opening.svelte flips
	// ui.entered itself there); every other page enters at once.
	onMount(() => {
		if (page.url.pathname !== '/') ui.entered = true;
	});

	// Page changes cross-fade through the View Transitions API where the
	// browser has it; elsewhere navigation is simply instant.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// Japanese webfonts (same loaders as Office) only style text present
	// when they scan the page — rescan after every client-side navigation.
	// FONTPLUS exposes reload(); this TypeSquare build (tsst v3) has no JS
	// API, so its tag is re-inserted.
	const TYPESQUARE_SRC = 'https://typesquare.com/3/tsst/script/ja/typesquare.js?616abf4f07244993b0057f1eac1e02e5';
	type Fontplus = { reload: (init?: boolean) => void };
	afterNavigate((nav) => {
		if (nav.type === 'enter') return;
		const fp = (window as unknown as { FONTPLUS?: Fontplus }).FONTPLUS;
		fp?.reload?.(false);
		document.querySelectorAll('script[data-ts-rescan]').forEach((s) => s.remove());
		const s = document.createElement('script');
		s.src = TYPESQUARE_SRC;
		s.async = true;
		s.dataset.tsRescan = '';
		document.head.appendChild(s);
	});

	const seo = $derived(page.data.seo);
	const aside = $derived(page.data.aside);
</script>

<svelte:head>
	<title>{seo?.title ?? titleOf()}</title>
	<meta name="description" content={seo?.description ?? SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="II — Isobe Institute" />
	<meta property="og:title" content={seo?.title ?? titleOf()} />
	<meta property="og:description" content={seo?.description ?? SITE_DESCRIPTION} />
	<meta property="og:image" content={seo?.image ?? `${page.url.origin}/images/op-landscape.jpg`} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Header />
<Menu features={data.features} />

{#if aside}
	<Aside eyebrow={aside.eyebrow} title={aside.title} />
{/if}

<main class="Main" class:has-aside={!!aside}>
	{@render children()}
</main>

<SiteFooter />

<style>
	.Main {
		position: relative;
		z-index: var(--z-content);
	}

	@media (min-width: 1024px) {
		.Main.has-aside {
			margin-left: var(--aside-w);
		}
	}
</style>
