<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
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

	// Page changes, as on Otic: the page shrinks toward the screen's middle
	// and darkens while a panel slides up over it; under the panel the new
	// page is put in place, and the panel then fades away onto it.
	// It starts on the click (beforeNavigate), not once the next page's data
	// has loaded, so there is no dead pause first; the shrink runs on a View
	// Transitions snapshot of the page, so fixed parts (left panel, a work's
	// text) shrink with it instead of jumping, as a transform on the live
	// page would make them. The motion is CSS (base.css, "Page
	// transitions"); the panel is .vt-panel below. Going to the top page the
	// panel is black and the opening plays out of it (Opening waits for
	// html.vt-running to clear). Without the API, navigation is instant.
	const PANEL_FADE_MS = 700; // = the .vt-panel opacity transition in base.css
	let covering: Promise<void> | null = null;

	const endTransition = () => {
		const html = document.documentElement;
		html.classList.remove('vt-running', 'vt-panel-on', 'vt-panel-out');
		delete html.dataset.vtTo;
		covering = null;
	};

	beforeNavigate((nav) => {
		if (!document.startViewTransition || !nav.to || nav.willUnload) return;
		if (nav.to.url.origin !== location.origin) return;
		if (nav.from?.url.pathname === nav.to.url.pathname) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const html = document.documentElement;
		const home = nav.to.url.pathname === '/';
		html.dataset.vtTo = home ? 'home' : 'page';
		if (home) html.dataset.op = 'play';
		html.classList.add('vt-running');
		// The snapshot shrinks and darkens; the panel (shown in the new
		// state) slides up and stays, covering the page.
		covering = document.startViewTransition(() => html.classList.add('vt-panel-on')).finished.then(
			() => {},
			() => {}
		);
		// A navigation that is cancelled or fails takes the panel away again.
		nav.complete.catch(() => {
			html.classList.add('vt-panel-out');
			setTimeout(endTransition, PANEL_FADE_MS);
		});
	});

	// The new page is rendered only once the panel covers the old one.
	onNavigate(async () => {
		if (covering) await covering;
	});

	afterNavigate((nav) => {
		const html = document.documentElement;
		if (nav.type === 'enter' || !html.classList.contains('vt-panel-on')) return;
		requestAnimationFrame(() => {
			html.classList.add('vt-panel-out');
			setTimeout(endTransition, PANEL_FADE_MS);
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
	// A work page lays itself out (a band over a strip of images, one
	// screen): no left panel, no footer.
	const isWork = $derived(page.route.id === '/works/[slug=slug]');
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
{#if aside && !isWork}
	<Aside eyebrow={aside.eyebrow} title={aside.title} inert={ui.menuOpen} />
{/if}

<main class="Main" class:has-aside={!!aside && !isWork} inert={ui.menuOpen}>
	{@render children()}
</main>

<!-- The top page is the film alone, a work page one screen: no footer. -->
{#if page.url.pathname !== '/' && !isWork}
	<SiteFooter inert={ui.menuOpen} />
{/if}

<!-- The page-transition panel (see onNavigate above). -->
<div class="vt-panel" aria-hidden="true"></div>

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
