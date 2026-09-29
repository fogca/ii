<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ui } from '$lib/state/ui.svelte';

	onMount(() => {
		ui.entered = true;
	});
</script>

<svelte:head>
	<title>{page.status} — II</title>
</svelte:head>

<section class="Error">
	<p class="t-eyebrow">{page.status}</p>
	<h1 class="t-title">{page.status === 404 ? 'Not Found' : 'Error'}</h1>
	<a class="back t-eyebrow" href="/">Creation Archive</a>
</section>

<style>
	.Error {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: var(--gutter);
		text-align: center;
	}

	.back {
		margin-top: 28px;
		text-decoration: underline;
		text-underline-offset: 0.3em;
	}
</style>
