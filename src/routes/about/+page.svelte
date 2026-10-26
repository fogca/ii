<script lang="ts">
	import { ABOUT } from '$lib/content/about';
	import InstituteMark from '$lib/components/InstituteMark.svelte';

	// Photo hidden for now (2026-09-30) — a new image will be added later.
	// Flip back to true to show /images/about.jpg again.
	const SHOW_PHOTO = false;

	// The first screen is a film: the wordmark typing itself in white on
	// black, the full screen. Below it the page is white and the text comes
	// in, section by section, as it scrolls into view. <html> is flagged
	// so the SP header can read over the black.
	$effect(() => {
		document.documentElement.classList.add('is-about');
		return () => document.documentElement.classList.remove('is-about');
	});

	const REVEAL_MARGIN = '0px 0px -12% 0px'; // a little way into the screen

	/** Fades a section in the first time it enters the screen. */
	function reveal(node: HTMLElement) {
		const io = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) return;
				node.classList.add('is-in');
				io.disconnect();
			},
			{ rootMargin: REVEAL_MARGIN }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
</script>

<article class="About">
	<h1 class="film"><InstituteMark typewriter /></h1>

	{#if SHOW_PHOTO}
		<figure class="photo">
			<img src="/images/about.jpg" alt="" width="736" height="981" decoding="async" fetchpriority="high" />
		</figure>
	{/if}

	<div class="text t-body">
		<!-- Both languages are in the page; html[data-lang] picks one. The
		     numbered section titles stay English. -->
		{#each ABOUT as section (section.title)}
			<section class="reveal" use:reveal>
				<h2 class="title" lang="en">{section.title}</h2>
				<!-- One block per language: heading, then (line break) the lead,
				     then (line break) the numbered items run on — "1. Name (bold)
				     body 2. Name body …", names in the reading language. -->
				{#each ['en', 'ja'] as const as l (l)}
					<p class="copy x-{l}" lang={l}>
						{#if section.heading}<b class="heading">{section.heading[l]}</b><br />{/if}
						{#if section.body}{#each section.body[l].split('\n') as line, j (j)}{#if j}<br
									/>{/if}{line}{/each}{#if section.items}<br />{/if}{/if}
						{#each section.items ?? [] as item, i (item.name)}<b class="name"
								>{i + 1}. {l === 'en' ? item.name : item.nameJa}</b
							> {item.body[l]}{' '}{/each}
					</p>
				{/each}
			</section>
		{/each}
	</div>
</article>

<style>
	/* Plain single column (no left panel, no two-column layout, both
	   breakpoints). */
	.About {
		padding-bottom: 120px;
	}

	/* The first screen, as a film: black, full bleed, the wordmark (white,
	   at the column width) centered both ways. */
	.film {
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 0 var(--gutter);
		background: #000;
		color: #fff;
	}

	.text {
		padding: 120px var(--gutter) 0;
	}

	/* Each section fades up as it comes into view (JS only — without it
	   the text simply shows). */
	:global(html.js) .reveal {
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 1.2s var(--ease-out),
			transform 1.2s var(--ease-out);
	}

	:global(html.js) .reveal:global(.is-in) {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html.js) .reveal {
			opacity: 1;
			transform: none;
		}
	}

	.photo {
		aspect-ratio: 393 / 527;
		background: var(--color-tile);
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* PC: the text is 65% of the width (centered), so the lines stay
	   readable. */
	@media (min-width: 1024px) {
		.text {
			width: 65%;
			margin-inline: auto;
			padding-inline: 0;
		}
	}

	/* Numbered titles at the body size; everything else at --fs-about
	   (SP 16px / PC 20px), headings and item names in the medium weight. */
	.copy {
		font-size: var(--fs-about);
	}

	.heading {
		font-weight: var(--fw-medium);
	}

	.name {
		font-weight: var(--fw-medium);
	}

	:global(html[data-lang='ja']) .x-en,
	:global(html:not([data-lang='ja'])) .x-ja {
		display: none;
	}

	/* Figma separates the sections by two empty lines. */
	section + section {
		margin-top: calc(2 * var(--lh-body) * 1em);
	}
</style>
