<script lang="ts">
	import { lang, type Lang } from '$lib/state/lang.svelte';

	// "JA / EN" display-language switch (Office's model — see
	// lib/state/lang.svelte.ts). The current language reads in full black,
	// the other stays muted. Size comes from the parent's font-size.
	const LANGS: { code: Lang; label: string; name: string }[] = [
		{ code: 'ja', label: 'JA', name: '日本語' },
		{ code: 'en', label: 'EN', name: 'English' }
	];
</script>

<span class="LangSwitch" role="group" aria-label="Language">
	{#each LANGS as l, i (l.code)}
		{#if i > 0}<span aria-hidden="true">/</span>{/if}
		<button
			type="button"
			class:is-current={lang.current === l.code}
			aria-pressed={lang.current === l.code}
			aria-label={l.name}
			onclick={() => lang.set(l.code)}>{l.label}</button
		>
	{/each}
</span>

<style>
	.LangSwitch {
		display: inline-flex;
		gap: 0.35em;
		color: var(--color-text-mute);
	}

	button {
		padding: 0;
		line-height: inherit;
		transition: color 0.3s ease;
	}

	button:hover,
	button.is-current {
		color: var(--color-text);
	}
</style>
