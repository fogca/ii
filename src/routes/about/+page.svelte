<script lang="ts">
	import { ABOUT } from '$lib/content/about';

	// The accent background covers the whole page (body), not just this
	// article — flag <html> while About is shown.
	$effect(() => {
		document.documentElement.classList.add('is-about');
		return () => document.documentElement.classList.remove('is-about');
	});
</script>

<article class="About">
	<figure class="photo">
		<img src="/images/about.jpg" alt="" width="736" height="981" decoding="async" fetchpriority="high" />
	</figure>

	<div class="text t-body">
		<!-- Both languages are in the page; html[data-lang] picks one. The
		     numbered section titles stay English. -->
		{#each ABOUT as section (section.title)}
			<section>
				<h2 class="title" lang="en">{section.title}</h2>
				{#if section.heading}
					<h3 class="heading x-en" lang="en">{section.heading.en}</h3>
					<h3 class="heading x-ja" lang="ja">{section.heading.ja}</h3>
				{/if}
				{#if section.body}
					<p class="copy x-en" lang="en">{section.body.en}</p>
					<p class="copy x-ja" lang="ja">{section.body.ja}</p>
				{/if}
				<!-- Items run on as one paragraph: "1. Name (bold) body 2. Name
				     body …" — the name in the reading language. -->
				{#if section.items}
					<p class="copy x-en" lang="en">
						{#each section.items as item, i (item.name)}<b class="name"
								>{i + 1}. {item.name}</b
							> {item.body.en}{' '}{/each}
					</p>
					<p class="copy x-ja" lang="ja">
						{#each section.items as item, i (item.name)}<b class="name"
								>{i + 1}. {item.nameJa}</b
							> {item.body.ja}{' '}{/each}
					</p>
				{/if}
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
	   breakpoints); the statement body is --fs-about (SP 16px / PC 28px),
	   section heads keep the body size. */
	:global(html.is-about body) {
		background: var(--color-accent);
	}

	/* Numbered titles and item names at the body size; headings and copy
	   at --fs-about (SP 16px / PC 28px). */
	.heading,
	.copy {
		font-size: var(--fs-about);
	}

	.heading {
		font-weight: var(--fw-medium);
		margin-bottom: 0.6em;
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
	   width of the panel at 28px and passes OVER the photo, which stays
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
