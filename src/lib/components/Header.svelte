<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import DomainMark from './DomainMark.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { NAV_LINKS } from '$lib/js/site';

	const isCurrent = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	// PC: Works sits by the mark on the left; Type, Institute, Contact on the right.
	const byLabel = (label: string) => NAV_LINKS.find((l) => l.label === label)!;
	const LEFT_LINKS = [byLabel('Works')];
	const RIGHT_LINKS = [byLabel('Type'), byLabel('Institute'), byLabel('Contact')];

	// Tucks away while scrolling down, returns on the first scroll up — so
	// the fixed mark never sits on top of text scrolling beneath it. SP: the
	// menu button + mark; PC: only the center mark (the button sits over the
	// left panel, which never scrolls).
	const DIRECTION_THRESHOLD = 8;
	const TOP_ZONE = 76; // ≈ header height: above this the controls always show

	let hidden = $state(false);
	let atTop = $state(true);

	onMount(() => {
		let lastY = window.scrollY;

		const onScroll = () => {
			const y = window.scrollY;
			atTop = y <= TOP_ZONE;
			if (ui.menuOpen) {
				hidden = false;
				lastY = y;
				return;
			}
			const dy = y - lastY;
			if (Math.abs(dy) < DIRECTION_THRESHOLD) return;
			hidden = dy > 0 && !atTop;
			lastY = y;
		};

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const toggleMenu = () => {
		ui.menuOpen = !ui.menuOpen;
	};
</script>

<header
	class="Header"
	class:is-entered={ui.entered}
	class:is-hidden={hidden && !ui.menuOpen}
	class:is-menu-open={ui.menuOpen}
>
	<button
		class="menu-btn"
		type="button"
		aria-expanded={ui.menuOpen}
		aria-controls="site-menu"
		aria-label={ui.menuOpen ? 'Close menu' : 'Open menu'}
		onclick={toggleMenu}
	>
		<span class="lines" aria-hidden="true">
			<span class="line line--top"></span>
			<span class="line line--bottom"></span>
		</span>
	</button>

	<!-- PC: the links themselves, no menu button — Works by the mark on the
	     left, the rest on the right. -->
	{#each [{ side: 'left', links: LEFT_LINKS }, { side: 'right', links: RIGHT_LINKS }] as group (group.side)}
		<nav class="links links--{group.side}" class:is-scrolled={!atTop} aria-label={group.side === 'left' ? 'Works' : 'Site'}>
			{#each group.links as link (link.label)}
				{#if link.external}
					<a href={link.href} target="_blank" rel="noopener">{link.label}</a>
				{:else}
					<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
				{/if}
			{/each}
		</nav>
	{/each}

	<a class="mark" class:is-away={!atTop} href="/" aria-label="II — Design Creation" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
		<Logo />
	</a>

	<!-- PC, once the page is scrolled: the centered ii gives way to the
	     ii-ii.co wordmark at the left, Works stepping aside for it. -->
	<a class="domain" class:is-on={!atTop} href="/" aria-label="II — Design Creation" tabindex={atTop ? -1 : undefined}>
		<DomainMark />
	</a>
</header>

<style>
	/* SP geometry (Figma 113:516): lines 40 × 1.5px, 8px apart, the top
	   stroke's ink at y=23.5 (Figma's group box y=25 is the stroke's lower
	   edge); mark 39.76px wide at top 18.22, centered. */
	.Header {
		--btn-w: 40px;
		--btn-gap: 8px; /* distance between the two line centers */
		--btn-x: 20px;
		--btn-y: 23.5px;
		--mark-w: 39.76px;
		--mark-y: 18.22px;
		--angle: 15deg; /* Figma II_Menu close icon: 57.96 × 15.53 from a 60px line */
		/* Where the X crosses, as an offset of the top line (SP: midway —
		   no SP menu frame exists; PC: Figma 109:406 crosses at y≈20.25). */
		--x-shift: calc(var(--btn-gap) / 2);

		display: contents;
	}

	/* No background on either breakpoint — the controls sit straight on the
	   page (SP tucks them away on scroll-down instead). */
	.menu-btn,
	.mark,
	.links {
		position: fixed;
		transition:
			opacity 0.8s var(--ease-out),
			transform 0.6s var(--ease-out);
	}

	/* Until the page enters (the opening plays over it) the controls are
	   invisible AND unreachable — no invisible click/Tab targets under the
	   overlay. JS only: without it they simply show. */
	:global(html.js) .Header:not(.is-entered) :is(.menu-btn, .mark, .links) {
		opacity: 0;
		visibility: hidden;
	}

	.is-hidden .menu-btn,
	.is-hidden .mark {
		transform: translateY(-100%);
	}

	.is-hidden .mark {
		transform: translate(-50%, calc(-100% - var(--mark-y)));
	}

	.is-hidden .menu-btn {
		transform: translateY(calc(-100% - var(--btn-y)));
	}

	/* Hit area is 44px+; the drawn lines keep their Figma position. */
	.menu-btn {
		top: calc(var(--btn-y) - 18px + env(safe-area-inset-top, 0px));
		left: calc(var(--btn-x) - 12px);
		z-index: calc(var(--z-menu) + 2);
		padding: 18px 12px;
		color: var(--color-text);
	}

	.lines {
		position: relative;
		display: block;
		width: var(--btn-w);
		height: calc(var(--btn-gap) + 1.5px);
	}

	.line {
		position: absolute;
		left: 0;
		width: 100%;
		height: 1.5px;
		background: currentColor;
		transition: transform 0.6s var(--ease-silk);
	}

	.line--top {
		top: 0;
	}

	.line--bottom {
		bottom: 0;
	}

	/* Open: the lines cross at ±15° (Figma II_Menu). */
	.is-menu-open .line--top {
		transform: translateY(var(--x-shift)) rotate(calc(-1 * var(--angle)));
	}

	.is-menu-open .line--bottom {
		transform: translateY(calc(var(--x-shift) - var(--btn-gap))) rotate(var(--angle));
	}

	/* SP: the menu button instead (and the ii mark only). */
	.links,
	.domain {
		display: none;
	}

	.mark {
		top: calc(var(--mark-y) + env(safe-area-inset-top, 0px));
		left: 50%;
		z-index: calc(var(--z-menu) + 2);
		width: var(--mark-w);
		transform: translateX(-50%);
		/* Black over photographs too, as drawn in Figma (a difference blend
		   was tried — it keeps the mark visible on dark images but tints it
		   in the photo's complementary color, e.g. cyan over red). */
		color: var(--color-text);
	}

	/* Top page (full-bleed photographs): white controls; the mark turns
	   white too — the vector by color, the 3D render by inversion (keeps
	   its modelling instead of swapping to the flat mark). */
	:global(html.is-top) .Header:not(.is-menu-open) :is(.menu-btn, .mark, .links) {
		color: #fff;
	}

	:global(html.is-top) .Header:not(.is-menu-open) .mark :global(img.Logo) {
		filter: invert(1);
	}

	/* PC geometry (Figma 79:154): lines 60 × 1.5px, 11px apart, top stroke's
	   ink at y=18.5; mark 31.76px wide at top 21.22. On PC the menu sheet
	   covers the small mark (its own large mark takes over) — only the
	   button stays on top. */
	@media (min-width: 1024px) {
		.Header {
			--btn-w: 60px;
			--btn-gap: 11px;
			--btn-y: 18.5px;
			--mark-w: 31.76px;
			--mark-y: 21.22px;
			--links-y: 18px;
			--links-gap: 40px;
			--domain-w: 56px; /* the ii-ii.co wordmark once scrolled */
			--x-shift: 1px;
		}

		/* Under the sheet: out of the tab order too (flipped once the
		   sliding sheet has covered it). */
		.is-menu-open .mark {
			visibility: hidden;
			transition: visibility 0s linear 0.5s;
		}

		/* Before scrolling: the ii alone, centered. Once scrolled it gives way
		   to the ii-ii.co wordmark at the left. The PC header stays put on
		   scroll (it doesn't tuck away as on SP). */
		.mark {
			z-index: var(--z-header);
		}

		.mark.is-away,
		.is-hidden .mark.is-away {
			opacity: 0;
			visibility: hidden;
			transform: translate(-50%, -6px);
		}

		.is-hidden .mark:not(.is-away) {
			transform: translateX(-50%);
		}

		.domain {
			display: block;
			position: fixed;
			top: calc(var(--links-y) - 1px + env(safe-area-inset-top, 0px));
			left: var(--gutter);
			z-index: var(--z-header);
			width: var(--domain-w);
			color: var(--color-text);
			opacity: 0;
			visibility: hidden;
			transform: translateY(6px);
			transition:
				opacity 0.5s var(--ease-out),
				transform 0.6s var(--ease-out),
				visibility 0s linear 0.5s;
		}

		.domain.is-on {
			opacity: 1;
			visibility: visible;
			transform: none;
			transition-delay: 0.1s, 0.1s, 0s;
		}

		:global(html.is-top) .Header:not(.is-menu-open) .domain {
			color: #fff;
		}

		/* PC: the links straight in the header (Works left by the mark;
		   Type · Institute · Contact right); the button and its sheet are SP
		   only. */
		.menu-btn {
			display: none;
		}

		.links {
			display: flex;
			gap: var(--links-gap);
			top: calc(var(--links-y) + env(safe-area-inset-top, 0px));
			z-index: var(--z-header);
			font-size: 12.5px;
			font-weight: 450;
			line-height: 1;
			color: var(--color-text);
		}

		.links--left {
			left: var(--gutter);
			transition:
				left 0.6s var(--ease-out),
				opacity 0.8s var(--ease-out);
		}

		.links--left.is-scrolled {
			left: calc(var(--gutter) + var(--domain-w) + var(--links-gap));
		}

		.links--right {
			right: var(--gutter);
		}

		.links a {
			transition: opacity 0.3s ease;
		}

		.links a:hover {
			opacity: 0.5;
		}

		/* The page you're on: a 5px dot to the left of its link. */
		.links a[aria-current='page'] {
			position: relative;
		}

		.links a[aria-current='page']::before {
			content: '';
			position: absolute;
			top: 52.5%;
			right: calc(100% + 4px);
			width: 4px;
			height: 4px;
			border-radius: 50%;
			background: currentColor;
			transform: translateY(-50%);
		}

		/* The PC header stays over the page as it scrolls: white in
		   difference blend, so it reads on light and dark alike. (Last in
		   the block, so it wins over the colors set above.) */
		.mark,
		.domain,
		.links {
			color: #fff;
			mix-blend-mode: difference;
		}
	}
</style>
