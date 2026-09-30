<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Logo from './Logo.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { imgOpt, imgSrcset } from '$lib/js/img';
	import { CONTACT_URL, COPYRIGHT, INSTAGRAM, LEGAL_LINKS } from '$lib/js/site';

	type Feature = { slug: string; title: string; image: { src: string; width: number; height: number } };
	let { features = [] }: { features?: Feature[] } = $props();

	const LINKS = [
		{ label: 'Archives', href: '/works', external: false },
		{ label: 'Institute', href: '/about', external: false },
		{ label: 'Contact', href: CONTACT_URL, external: true }
	];
	const FEATURE_WIDTHS = [480, 700, 940, 1400];

	let sheet = $state<HTMLDivElement>();
	let wasOpen = false;

	// Focus moves into the sheet on open and back to the menu button on close.
	$effect(() => {
		const open = ui.menuOpen;
		if (open && !wasOpen) {
			tick().then(() => sheet?.querySelector<HTMLAnchorElement>('.nav a')?.focus({ preventScroll: true }));
		} else if (!open && wasOpen) {
			document.querySelector<HTMLButtonElement>('.menu-btn')?.focus({ preventScroll: true });
		}
		wasOpen = open;
		document.documentElement.classList.toggle('is-menu-open', open);
	});

	afterNavigate(() => {
		ui.menuOpen = false;
	});

	const close = () => (ui.menuOpen = false);

	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && ui.menuOpen) close();
	};

	const isCurrent = (href: string) => page.url.pathname === href;
</script>

<svelte:window onkeydown={onKeydown} />

<div class="Menu" class:is-open={ui.menuOpen} id="site-menu" inert={!ui.menuOpen} aria-hidden={!ui.menuOpen}>
	<button class="scrim" type="button" tabindex="-1" aria-label="Close menu" onclick={close}></button>

	<!-- Modality comes from +layout.svelte making everything else inert while
	     open (so the toggle, outside this element, stays reachable) — hence no
	     aria-modal here. -->
	<div class="sheet" role="dialog" aria-label="Menu" bind:this={sheet}>
		<nav class="nav" aria-label="Site">
			<ul>
				{#each LINKS as link, i (link.label)}
					<li style="--i: {i}">
						{#if link.external}
							<a class="t-menu" href={link.href} target="_blank" rel="noopener">{link.label}</a>
						{:else}
							<a class="t-menu" href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>
								{link.label}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
			<p class="lang t-eyebrow" style="--i: {LINKS.length}"><LangSwitch /></p>
		</nav>

		<a class="mark" href="/" aria-label="II — Creation Archive" tabindex="-1">
			<Logo sizes="95px" />
		</a>

		{#if features.length}
			<ul class="features">
				{#each features as f, i (f.slug)}
					<li style="--i: {i + LINKS.length}">
						<a href="/works/{f.slug}" aria-label={f.title}>
							<img
								src={imgOpt(f.image.src, 940, 70)}
								srcset={imgSrcset(f.image.src, FEATURE_WIDTHS, 70)}
								sizes="(min-width: 1024px) 48vw, 100vw"
								alt=""
								loading="lazy"
								decoding="async"
							/>
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="foot t-meta">
			<a href={INSTAGRAM.url} target="_blank" rel="noopener">{INSTAGRAM.handle}</a>
			<p class="legal">
				{#each LEGAL_LINKS as l (l.label)}
					{#if l.href}<a href={l.href}>{l.label}</a>{:else}<span>{l.label}</span>{/if}
				{/each}
			</p>
			<p class="copy">{COPYRIGHT}</p>
		</div>
	</div>
</div>

<style>
	.Menu {
		position: fixed;
		inset: 0;
		z-index: var(--z-menu);
		visibility: hidden;
		transition: visibility 0s linear 0.8s;
	}

	.Menu.is-open {
		visibility: visible;
		transition-delay: 0s;
	}

	.scrim {
		position: absolute;
		inset: 0;
		width: 100%;
		background: var(--color-scrim);
		opacity: 0;
		cursor: default;
		transition: opacity 0.6s var(--ease-out);
	}

	.is-open .scrim {
		opacity: 1;
	}

	/* SP: the sheet fills the screen (no SP menu frame exists in Figma — this
	   follows the PC sheet's type and order). */
	.sheet {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 100vh;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: calc(var(--header-h) + 24px + env(safe-area-inset-top, 0px)) var(--gutter)
			calc(18px + env(safe-area-inset-bottom, 0px));
		background: var(--color-bg);
		transform: translateY(-100%);
		transition: transform 0.8s var(--ease-silk);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.is-open .sheet {
		transform: none;
	}

	.lang {
		margin-top: 24px;
	}

	.nav li,
	.nav .lang,
	.features li {
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s var(--ease-out),
			transform 0.7s var(--ease-out);
	}

	.is-open .nav li,
	.is-open .nav .lang,
	.is-open .features li {
		opacity: 1;
		transform: none;
		transition-delay: calc(0.35s + var(--i) * 0.06s);
	}

	.nav ul {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.nav a {
		display: inline-block;
		transition: opacity 0.3s ease;
	}

	.nav a:hover {
		opacity: 0.5;
	}

	/* Large mark: PC only (on SP the header's own mark stays on top). */
	.mark {
		display: none;
	}

	.features {
		display: none;
	}

	.foot {
		margin-top: auto;
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'insta .'
			'legal copy';
		row-gap: 8px;
	}

	.foot > a {
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

	/* PC (Figma II_Menu 109:390): a white sheet 657/900 of the viewport tall
	   over a 65% black scrim; links at (21, 82) with a 53px pitch; a 94.9px
	   mark at the top right; two 680 × 300 image panels at y=286. */
	@media (min-width: 1024px) {
		.sheet {
			height: auto;
			min-height: calc(657 / 900 * 100vh);
			display: grid;
			grid-template-columns: 1fr auto;
			grid-template-rows: auto 1fr;
			align-content: start;
			/* 40px on the right: Figma's panels are 680 wide at x=20 / 720 */
			padding: 82px 40px 71px 21px;
			overflow: visible;
		}

		.nav ul {
			gap: calc(53px - var(--fs-menu) * var(--lh-title));
		}

		.mark {
			display: block;
			position: absolute;
			top: 37px;
			right: 32px;
			width: 94.9px;
			color: var(--color-text);
		}

		.features {
			grid-column: 1 / -1;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 20px;
			margin-top: calc(286px - 82px - 3 * var(--fs-menu) * var(--lh-title) - 2 * (53px - var(--fs-menu) * var(--lh-title)));
			margin-left: -1px;
		}

		.features a {
			display: block;
			aspect-ratio: 680 / 300;
			overflow: hidden;
			background: var(--color-tile);
		}

		.features img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: transform 1.2s var(--ease-out);
		}

		.features a:hover img {
			transform: scale(1.03);
		}

		.foot {
			display: none;
		}
	}
</style>
