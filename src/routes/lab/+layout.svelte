<script lang="ts">
	let { children } = $props();
</script>

<!-- Experimental versions of live pages (/lab/top, /lab/works), reachable
     by URL only and kept out of search results. -->
<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{@render children()}
