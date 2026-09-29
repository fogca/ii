<script lang="ts">
	import { ABOUT } from '$lib/content/about';
</script>

<article class="About">
	<figure class="photo">
		<img src="/images/about.jpg" alt="" width="736" height="981" decoding="async" fetchpriority="high" />
	</figure>

	<div class="text t-body">
		{#each ABOUT as section (section.heading)}
			<section>
				<h2>{section.heading}</h2>
				<p>{section.body}</p>
			</section>
		{/each}
	</div>
</article>

<style>
	/* ── SP (Figma 123:115): photo full-bleed (395 × 527), statement in a
	   353px column 40px below it, 11px / 1.5. */
	.photo {
		aspect-ratio: 395 / 527;
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

	/* Figma separates the sections by two empty lines. */
	section + section {
		margin-top: calc(2 * var(--lh-body) * 1em);
	}

	/* ── PC (Figma 79:204): statement column from the panel's left edge
	   (y=84, 16px / 1.4, ≤537px); photo 446 × 595 at the top right
	   (24px from the edge, y=22), held in place while the text scrolls.
	   Figma lets the 537px column run 23px under the photo — the column
	   stops 24px short of it instead. */
	@media (min-width: 1024px) {
		.About {
			display: grid;
			grid-template-columns: minmax(0, 1fr) calc(446 / 1440 * 100vw);
			column-gap: calc(24 / 1440 * 100vw);
			padding-right: calc(24 / 1440 * 100vw);
			padding-bottom: 160px;
		}

		.photo {
			grid-column: 2;
			grid-row: 1;
			position: sticky;
			top: 22px;
			margin-top: 22px;
			aspect-ratio: 446 / 595;
		}

		.text {
			grid-column: 1;
			grid-row: 1;
			max-width: var(--measure);
			padding: 84px 0 0;
		}
	}
</style>
