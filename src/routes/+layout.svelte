<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import Aside from '$lib/components/Aside.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { lang } from '$lib/state/lang.svelte';
	import { browser } from '$app/environment';
	import { SITE_DESCRIPTION, titleOf } from '$lib/js/site';

	let { children, data } = $props();

	// Adopt the language app.html already applied pre-paint (during init, so
	// the toggle renders right on first paint), then keep <html data-lang>
	// following the store.
	if (browser) lang.restore();
	$effect(() => {
		document.documentElement.dataset.lang = lang.current;
	});

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
	// Most II pages carry no Japanese at all, and every re-insertion re-runs
	// the whole ~370KB loader (incl. its babel polyfill, which then warns) —
	// so only rescan when the new page actually has Japanese text.
	const HAS_JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/;
	afterNavigate((nav) => {
		if (nav.type === 'enter') return;
		const fp = (window as unknown as { FONTPLUS?: Fontplus }).FONTPLUS;
		fp?.reload?.(false);
		if (!HAS_JAPANESE.test(document.querySelector('main')?.textContent ?? '')) return;
		document.querySelectorAll('script[data-ts-rescan]').forEach((s) => s.remove());
		const s = document.createElement('script');
		s.src = TYPESQUARE_SRC;
		s.async = true;
		s.dataset.tsRescan = '';
		document.head.appendChild(s);
	});

	const seo = $derived(page.data.seo);
	const aside = $derived(page.data.aside);
	// One place for <title> — the error page included, so leaving it always
	// changes the value and the head updates.
	const pageTitle = $derived(page.error ? `${page.status} — II` : (seo?.title ?? titleOf()));
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={seo?.description ?? SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="II — Isobe Institute" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={seo?.description ?? SITE_DESCRIPTION} />
	<meta property="og:image" content={seo?.image ?? `${page.url.origin}/images/op-landscape.jpg`} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Header />
<Menu features={data.features} />

<!-- While the menu is open everything but the menu and its toggle is inert,
     which is what makes the sheet modal (see Menu.svelte). -->
{#if aside}
	<Aside eyebrow={aside.eyebrow} title={aside.title} inert={ui.menuOpen} />
{/if}

<main class="Main" class:has-aside={!!aside} inert={ui.menuOpen}>
	{@render children()}
</main>

<SiteFooter inert={ui.menuOpen} />

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
