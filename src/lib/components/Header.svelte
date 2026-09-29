<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import { ui } from '$lib/state/ui.svelte';

	// Tucks away while scrolling down, returns on the first scroll up — so
	// the fixed mark never sits on top of text scrolling beneath it. SP: the
	// whole bar; PC: only the center mark (the menu button sits over the
	// left panel, which never scrolls).
	const DIRECTION_THRESHOLD = 8;
	const TOP_ZONE = 76; // ≈ bar height: above this the bar always shows, bare

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
	class:is-solid={!atTop && !ui.menuOpen}
	class:is-menu-open={ui.menuOpen}
>
	<div class="bar" aria-hidden="true"></div>

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
	/* SP geometry (Figma 113:516): lines 40 × 1.5px, 8px apart, at (20, 25);
	   mark 39.76px wide at top 18.22, centered. */
	.Header {
		--btn-w: 40px;
		--btn-gap: 8px; /* distance between the two line centers */
		--btn-x: 20px;
		--btn-y: 25px;
		--mark-w: 39.76px;
		--mark-y: 18.22px;
		--angle: 15deg; /* Figma II_Menu close icon: 57.96 × 15.53 from a 60px line */

		display: contents;
	}

	.bar,
	.menu-btn,
	.mark {
		position: fixed;
		opacity: 0;
		transition:
			opacity 0.8s var(--ease-out),
			transform 0.6s var(--ease-out),
			background-color 0.3s ease;
	}

	.is-entered .bar,
	.is-entered .menu-btn,
	.is-entered .mark {
		opacity: 1;
	}

	/* SP bar: white only once the page has scrolled (the Figma frames show
	   the header on the bare page). */
	.bar {
		top: 0;
		left: 0;
		right: 0;
		height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
		z-index: calc(var(--z-menu) + 1);
		background: transparent;
		pointer-events: none;
	}

	.is-solid .bar {
		background: var(--color-bg);
	}

	.is-hidden .bar,
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

	/* Open: both lines meet at the center and cross at ±15° (Figma II_Menu). */
	.is-menu-open .line--top {
		transform: translateY(calc(var(--btn-gap) / 2)) rotate(calc(-1 * var(--angle)));
	}

	.is-menu-open .line--bottom {
		transform: translateY(calc(var(--btn-gap) / -2)) rotate(var(--angle));
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

	/* PC geometry (Figma 79:154): lines 60 × 1.5px, 11px apart, at (20, 20);
	   mark 31.76px wide at top 21.22. On PC the menu sheet covers the small
	   mark (its own large mark takes over) — only the button stays on top. */
	@media (min-width: 1024px) {
		.Header {
			--btn-w: 60px;
			--btn-gap: 11px;
			--btn-y: 20px;
			--mark-w: 31.76px;
			--mark-y: 21.22px;
		}

		.bar {
			display: none;
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
