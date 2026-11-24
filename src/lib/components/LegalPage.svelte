<script lang="ts">
	import type { LegalDoc } from '$lib/content/legal';
	import { COMPANY_FACTS } from '$lib/content/legal';

	let { doc, facts = false }: { doc: LegalDoc; facts?: boolean } = $props();
</script>

<!-- A plain single column (like About): the title, then the sections. Both
     languages are in the page; html[data-lang] picks one. -->
<article class="Legal t-body">
	<h1 class="title t-title">
		<span class="x-en" lang="en">{doc.title.en}</span><span class="x-ja" lang="ja">{doc.title.ja}</span>
	</h1>

	{#if facts}
		<dl class="facts">
			{#each COMPANY_FACTS as f (f.label.en)}
				<div class="row">
					<dt><span class="x-en" lang="en">{f.label.en}</span><span class="x-ja" lang="ja">{f.label.ja}</span></dt>
					<dd><span class="x-en" lang="en">{f.value.en}</span><span class="x-ja" lang="ja">{f.value.ja}</span></dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#each doc.sections as s (s.title.en)}
		<section>
			<h2 class="heading">
				<span class="x-en" lang="en">{s.title.en}</span><span class="x-ja" lang="ja">{s.title.ja}</span>
			</h2>
			{#each s.paragraphs as p (p.en)}
				<p class="x-en" lang="en">{p.en}</p>
				<p class="x-ja" lang="ja">{p.ja}</p>
			{/each}
		</section>
	{/each}
</article>

<style>
	.Legal {
		padding: 160px var(--gutter) 160px;
		max-width: 860px;
		margin-inline: auto;
	}

	.title {
		margin-bottom: 64px;
		font-weight: 550;
	}

	section + section {
		margin-top: 48px;
	}

	.heading {
		margin-bottom: 12px;
		font-size: inherit;
		font-weight: var(--fw-medium);
	}

	p {
		font-size: var(--fs-about);
		line-height: 1.7;
	}

	p + p {
		margin-top: 12px;
	}

	.facts {
		margin-bottom: 64px;
	}

	.row {
		display: grid;
		grid-template-columns: 9em 1fr;
		gap: 16px;
		padding: 12px 0;
		border-top: 1px solid rgba(0, 0, 0, 0.12);
		font-size: var(--fs-about);
		line-height: 1.6;
	}

	dt {
		font-weight: var(--fw-medium);
	}

	:global(html[data-lang='ja']) .x-en,
	:global(html:not([data-lang='ja'])) .x-ja {
		display: none;
	}

	@media (min-width: 1024px) {
		.Legal {
			padding-top: 200px;
		}
	}
</style>
