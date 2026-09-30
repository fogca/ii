<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Logo from './Logo.svelte';
	import { ui } from '$lib/state/ui.svelte';

	// Opening (Figma II_OP 79:139 → 79:149; SP 113:491 → 113:500):
	//   1. white screen, the II mark fades in (black)
	//   2. the photograph comes in behind it, 20px inset on every side,
	//      while the mark turns #F1F0EF
	//   3. hand-off: the overlay fades and the archive flows in beneath it
	// Whether it plays at all is decided pre-paint in app.html
	// (html[data-op]); when skipped, the page enters immediately.
	const LOGO_IN = 1.1;
	const LOGO_HOLD = 0.5;
	const IMAGE_IN = 1.6;
	const IMAGE_HOLD = 1.0;
	const HANDOFF = 0.8; // overlay fade
	// The archive starts flowing in just after the overlay starts to clear,
	// so the columns' directions read instead of happening under the veil.
	const ENTER_AFTER = 0.15;
	// The photograph waits (at most this long) to be decoded before it fades
	// in, so a slow connection never shows it half-painted.
	const IMAGE_WAIT_MS = 2500;

	let root = $state<HTMLDivElement>();
	let logo = $state<HTMLDivElement>();
	let logoLight = $state<HTMLDivElement>();
	let image = $state<HTMLDivElement>();
	let photo = $state<HTMLImageElement>();
	let done = $state(false);
	let running = $state(false);

	onMount(() => {
		if (document.documentElement.dataset.op !== 'play') {
			done = true;
			ui.entered = true;
			return;
		}

		let cancelled = false;
		let tl: gsap.core.Timeline | undefined;
		const html = document.documentElement;
		html.classList.add('is-op');

		// Once played, a later client-side return to the index must not
		// replay it (the pre-paint decision only covers full page loads).
		const finish = () => {
			html.classList.remove('is-op');
			html.dataset.op = 'skip';
			done = true;
		};

		// If the animation code can't load, don't leave a white screen.
		const bail = () => {
			if (cancelled) return;
			finish();
			ui.entered = true;
		};

		import('gsap')
			.then(async ({ gsap }) => {
				if (cancelled) return;
				await tick();
				// Two frames so bind:this targets are settled before reading them.
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
				if (cancelled || !root || !logo || !logoLight || !image) return;

				const photoReady = Promise.race([
					photo?.decode().catch(() => {}) ?? Promise.resolve(),
					new Promise((r) => setTimeout(r, IMAGE_WAIT_MS))
				]);
				let photoDecoded = false;
				photoReady.then(() => (photoDecoded = true));

				running = true;
				tl = gsap.timeline({ onComplete: finish });
				tl.set(logo, { opacity: 0, filter: 'blur(6px)' })
					.set(image, { opacity: 0, scale: 1.08 })
					.to(logo, { opacity: 1, filter: 'blur(0px)', duration: LOGO_IN, ease: 'power2.out' }, 0.2)
					.addLabel('image', `>+${LOGO_HOLD}`)
					.call(
						() => {
							if (photoDecoded) return;
							tl?.pause();
							photoReady.then(() => {
								if (!cancelled) tl?.play();
							});
						},
						[],
						'image'
					)
					.to(image, { opacity: 1, duration: IMAGE_IN * 0.7, ease: 'power2.out' }, 'image')
					.to(image, { scale: 1, duration: IMAGE_IN, ease: 'power3.out' }, 'image')
					.to(logo, { opacity: 0, duration: IMAGE_IN * 0.6, ease: 'power2.inOut' }, 'image')
					.to(logoLight, { opacity: 1, duration: IMAGE_IN * 0.6, ease: 'power2.inOut' }, 'image')
					// Absolute from 'image' — '>' would resolve against the (shorter)
					// color tween added last, not the image's full settle.
					.addLabel('handoff', `image+=${IMAGE_IN + IMAGE_HOLD}`)
					.to(root, { opacity: 0, duration: HANDOFF, ease: 'power2.out' }, 'handoff')
					.call(
						() => {
							ui.entered = true;
						},
						[],
						`handoff+=${ENTER_AFTER}`
					);
			})
			.catch(bail);

		return () => {
			cancelled = true;
			tl?.kill();
			html.classList.remove('is-op');
			html.dataset.op = 'skip';
			ui.entered = true;
		};
	});
</script>

{#if !done}
	<div class="Opening" class:is-running={running} bind:this={root} aria-hidden="true">
		<div class="image" bind:this={image}>
			<!-- lazy: when the opening is skipped the overlay is display:none,
			     and a lazy image there is never fetched; when it plays, the
			     overlay is on screen and the photo loads during the logo phase. -->
			<picture>
				<source media="(min-width: 1024px)" srcset="/images/op-landscape.jpg" />
				<img src="/images/op-portrait.jpg" alt="" loading="lazy" decoding="async" bind:this={photo} />
			</picture>
		</div>
		<div class="logo" bind:this={logo}>
			<Logo sizes="(min-width: 1024px) 25vw, 34vw" />
		</div>
		<!-- The light mark over the photograph: always the flat vector (a
		     render can't turn #F1F0EF), crossfaded in as the photo arrives. -->
		<div class="logo logo--light" bind:this={logoLight}>
			<Logo vector />
		</div>
	</div>
{/if}

<style>
	/* Painted only when the pre-paint script chose to play it — so it never
	   flashes when skipped, and never shows at all without JS. */
	.Opening {
		display: none;
		position: fixed;
		inset: 0;
		z-index: var(--z-op);
		background: var(--color-bg);
		pointer-events: none;
		/* Last resort if the app's JS never runs: the server-rendered overlay
		   clears itself instead of leaving a white screen. Cancelled the
		   moment the timeline starts. */
		animation: op-failsafe 0.6s ease 9s forwards;
	}

	.Opening.is-running {
		animation: none;
	}

	@keyframes op-failsafe {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}

	:global(html[data-op='play']) .Opening {
		display: block;
	}

	.image {
		position: absolute;
		inset: 20px;
		overflow: hidden;
		opacity: 0;
	}

	.image picture,
	.image img {
		display: block;
		width: 100%;
		height: 100%;
	}

	.image img {
		object-fit: cover;
	}

	/* Figma: 133 / 393 of the SP width, 357.3 / 1440 of the PC width —
	   capped by height so a short landscape window keeps it inside. */
	.logo--light {
		color: var(--color-logo-on-image);
	}

	.logo {
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(calc(133 / 393 * 100vw), 33vh);
		transform: translate(-50%, -50%);
		color: var(--color-text);
		opacity: 0;
	}

	/* PC (Figma 79:139 / 79:149): the mark's center sits at y=479.26 of 900,
	   below the frame's middle; the photograph is a 1567 × 882 crop anchored
	   at the top of the frame, seen through the 20px-inset window. */
	@media (min-width: 1024px) {
		.logo {
			top: calc(479.26 / 900 * 100%);
			width: min(calc(357.311 / 1440 * 100vw), calc(357.48 / 900 * 100vh));
		}

		.image img {
			height: calc(100% + 22px);
			margin-top: -20px;
		}
	}

	/* The page never scrolls under the opening. */
	:global(html.is-op),
	:global(html.is-op body) {
		overflow: hidden;
	}
</style>
