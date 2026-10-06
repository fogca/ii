<script lang="ts">
	import { ABOUT } from '$lib/content/about';

	// Photo hidden for now (2026-09-30) — a new image will be added later.
	// Flip back to true to show /images/about.jpg again.
	const SHOW_PHOTO = false;

	// The accent background covers the whole page (body), not just this
	// article — flag <html> while About is shown.
	$effect(() => {
		document.documentElement.classList.add('is-about');
		return () => document.documentElement.classList.remove('is-about');
	});
</script>

<article class="About">
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
	/* ── SP (Figma 123:115): photo full-bleed at y=333 (11px above the
	   shared 344 content line), 527 tall; statement in a 353px column 40px
	   below it, 11px / 1.5. */
	.photo {
		margin-top: -11px;
		aspect-ratio: 393 / 527;
		background: var(--color-tile);
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.text {
		max-width: calc(var(--measure) + 2 * var(--gutter));
		padding: 40px var(--gutter) 0;
	}

	/* The whole page takes the accent color while About is shown (both
	   breakpoints); the statement body is --fs-about (SP 16px / PC 20px),
	   section heads keep the body size. */
	:global(html.is-about body) {
		background: var(--color-accent);
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

	/* ── PC: the page goes to the accent color; the statement runs the full
	   width of the panel at 20px and passes OVER the photo, which stays
	   pinned at the top right (446 × 595, 24px from the edge, y=22) while
	   the text scrolls. Section heads keep the 16px body size. ── */
	@media (min-width: 1024px) {
		.About {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			padding-right: calc(24 / 1440 * 100vw);
			padding-bottom: 160px;
		}

		.photo {
			grid-column: 1;
			grid-row: 1;
			justify-self: end;
			align-self: start;
			position: sticky;
			top: 22px;
			width: calc(446 / 1440 * 100vw);
			margin-top: 22px;
			aspect-ratio: 446 / 595;
		}

		.text {
			grid-column: 1;
			grid-row: 1;
			position: relative;
			z-index: 1;
			max-width: none;
			padding: 84px 0 0;
		}
	}
</style>
