<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import { ui } from '$lib/state/ui.svelte';

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

	<a class="mark" href="/" aria-label="II — Creation Archive" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
		<Logo />
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
	.mark {
		position: fixed;
		transition:
			opacity 0.8s var(--ease-out),
			transform 0.6s var(--ease-out);
	}

	/* Until the page enters (the opening plays over it) the controls are
	   invisible AND unreachable — no invisible click/Tab targets under the
	   overlay. JS only: without it they simply show. */
	:global(html.js) .Header:not(.is-entered) :is(.menu-btn, .mark) {
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
			--x-shift: 1px;
		}

		/* Under the sheet: out of the tab order too (flipped once the
		   sliding sheet has covered it). */
		.is-menu-open .mark {
			visibility: hidden;
			transition: visibility 0s linear 0.5s;
		}

		.mark {
			z-index: var(--z-header);
		}

		.is-hidden .mark {
			opacity: 0;
		}

		.is-hidden .menu-btn {
			transform: none;
		}
	}
</style>
