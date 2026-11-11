<script lang="ts">
	import DomainMark from './DomainMark.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import { CONTACT_URL, COPYRIGHT, INSTAGRAM, LEGAL_LINKS, NAV_LINKS } from '$lib/js/site';

	let {
		pc = false,
		inert = false
	}: {
		/** Shown on PC too (a page without the left panel). */
		pc?: boolean;
		inert?: boolean;
	} = $props();
</script>

<!-- The footer as on the first Otic site (Dev/OTIF Footer): black, four
     columns — the wordmark, small, with a line on the institute · the
     site links · Find us · Contact — then the legal + © row.
     SP only, except where `pc` asks for it — on PC the legal line
     otherwise lives in the left panel. -->
<footer class="SiteFooter" class:sp={!pc} {inert}>
	<div class="grid">
		<div class="col brand">
			<a class="logo" href="/" aria-label="ii-ii.co"><DomainMark /></a>
			<p class="note">
				<span class="x-en" lang="en">A creative institute for design and craft.<br />Tokyo, Japan.</span><span
					class="x-ja"
					lang="ja">デザインとクラフトのクリエイティブインスティチュート。<br />東京。</span
				>
			</p>
		</div>

		<nav class="col" aria-label="Footer">
			<ul class="list">
				{#each NAV_LINKS as l (l.href)}
					<li><a href={l.href}>{l.label}</a></li>
				{/each}
			</ul>
		</nav>

		<div class="col">
			<p class="heading">Find us</p>
			<ul class="list">
				<li><a href={INSTAGRAM.url} target="_blank" rel="noopener">Instagram ↗</a></li>
			</ul>
		</div>

		<div class="col">
			<p class="heading">Contact</p>
			<p class="note">
				<span class="x-en" lang="en"
					>For new projects, collaborations and any other enquiries — across brand, typeface, product,
					furniture and digital. Please feel free to reach out.</span
				><span class="x-ja" lang="ja"
					>新しいプロジェクトのご相談、協業、その他のお問い合わせはこちらから。ブランド、書体、プロダクト、家具、デジタルまで、お気軽にご連絡ください。</span
				>
			</p>
			<a class="cta" href={CONTACT_URL}>Get in touch →</a>
		</div>
	</div>

	<div class="bottom">
		<p class="legal">
			{#each LEGAL_LINKS as l (l.label)}
				{#if l.href}<a href={l.href}>{l.label}</a>{:else}<span>{l.label}</span>{/if}
			{/each}
			<LangSwitch />
		</p>
		<p class="copy">{COPYRIGHT}</p>
	</div>
</footer>

<style>
	.SiteFooter {
		--color-text: #fff;
		--color-text-mute: rgba(255, 255, 255, 0.5);
		background: #000;
		color: var(--color-text);
		padding: 64px var(--gutter) calc(24px + env(safe-area-inset-bottom, 0px));
		font-size: 13.5px;
		line-height: 1.5;
	}

	:global(html[data-lang='ja']) .x-en,
	:global(html:not([data-lang='ja'])) .x-ja {
		display: none;
	}

	.grid {
		display: grid;
		gap: 48px;
	}

	.col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}

	.logo {
		display: block;
		width: 160px;
	}

	.note,
	.heading {
		color: var(--color-text-mute);
	}

	.note {
		max-width: 36ch;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.list a,
	.cta,
	.legal a {
		transition: color 0.3s ease;
	}

	.list a:hover,
	.legal a:hover {
		color: var(--color-text-mute);
	}

	.cta {
		padding-bottom: 4px;
		border-bottom: 1px solid var(--color-text-mute);
		transition: border-color 0.3s ease;
	}

	.cta:hover {
		border-color: var(--color-text);
	}

	.bottom {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 56px;
		padding-top: 24px;
		border-top: 0.5px solid rgba(255, 255, 255, 0.25);
		font-size: 12.5px;
		line-height: 15px;
	}

	.legal {
		display: flex;
		gap: 0.9em;
		color: var(--color-text-mute);
	}

	.copy {
		color: var(--color-text-mute);
		white-space: pre; /* keeps the double space before the year */
	}

	@media (min-width: 768px) {
		.grid {
			grid-template-columns: 2fr 1fr 1fr 2fr;
			gap: 32px;
		}

		.logo {
			width: 200px;
		}

		.bottom {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}
</style>
