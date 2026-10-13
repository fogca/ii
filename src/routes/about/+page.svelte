<script lang="ts">
	import { ABOUT } from '$lib/content/about';
	import InstituteMark from '$lib/components/InstituteMark.svelte';

	// Photo hidden for now (2026-09-30) — a new image will be added later.
	// Flip back to true to show /images/about.jpg again.
	const SHOW_PHOTO = false;

	// The black background covers the whole page (body), not just this
	// article — flag <html> while About is shown.
	$effect(() => {
		document.documentElement.classList.add('is-about');
		return () => document.documentElement.classList.remove('is-about');
	});
</script>

<article class="About">
	<h1 class="mark"><InstituteMark /></h1>

	{#if SHOW_PHOTO}
		<figure class="photo">
			<img src="/images/about.jpg" alt="" width="736" height="981" decoding="async" fetchpriority="high" />
		</figure>
	{/if}

	<div class="text t-body">
		<!-- Both languages are in the page; html[data-lang] picks one. The
		     numbered section titles stay English. -->
		{#each ABOUT as section (section.title)}
			<section>
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
		padding: 0 var(--gutter) 120px;
	}

	/* The first screen: the wordmark at the full column width, centered
	   both ways in the viewport; the text starts below it. */
	.mark {
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100dvh;
	}

	.text {
		padding-top: 40px;
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

	/* The whole page goes black with white text while About is shown (both
	   breakpoints): the color tokens are swapped on <html>, so the header,
	   footer and menu follow; the statement body is --fs-about
	   (SP 16px / PC 20px), section heads keep the body size. */
	:global(html.is-about) {
		--color-bg: #000000;
		--color-text: #ffffff;
		--color-text-mute: rgba(255, 255, 255, 0.3);
		color-scheme: dark;
	}

	/* PC: the text is 65% of the width (centered), so the lines stay
	   readable. */
	@media (min-width: 1024px) {
		.text {
			width: 65%;
			margin-inline: auto;
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
