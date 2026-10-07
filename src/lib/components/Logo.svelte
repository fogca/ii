<script lang="ts">
	import { LOGO_STYLE } from '$lib/js/site';

	// The II mark. Three looks, picked site-wide by LOGO_STYLE ($lib/js/site):
	// - 'ii': the first "ii" of the ii-ii.co wordmark (DomainMark), cropped
	//   to its own box (6.71:7.96 — close to the render's proportions, so the
	//   widths set for the render still fit); fill follows currentColor.
	// - 'render': the shaded 3D render (raster, always black-ish; the
	//   parent sets the width, height follows its 1166:1355 proportions).
	// - 'vector': Figma geometry (node 79:139, "II") — every size in the
	//   designs (31.8 / 39.8 / 94.9 / 133.8 / 357.5px) is this shape scaled;
	//   fill follows currentColor.
	// `vector` forces the flat mark regardless (e.g. where it must recolor).
	let {
		label = 'II',
		vector = false,
		sizes = '40px'
	}: { label?: string; vector?: boolean; sizes?: string } = $props();

	const RENDER_SRCSET = [160, 480, 1166].map((w) => `/images/logo/ii-render-${w}.webp ${w}w`).join(', ');
	const useRender = $derived(LOGO_STYLE === 'render' && !vector);
</script>

{#if LOGO_STYLE === 'ii'}
	<svg class="Logo" viewBox="0 0 6.71 7.96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
		<path d="M0,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16H0ZM1.55,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" fill="currentColor" />
		<path d="M3.52,7.96v-.16l.73-.56v-3.41l-.73-.54v-.16c.26-.1,1.54-.5,2.47-.73v4.83l.72.56v.16h-3.19ZM5.06,0c.53,0,.96.37.96.94,0,.52-.43.94-.96.94s-.97-.42-.97-.94c0-.56.44-.94.97-.94Z" fill="currentColor" />
	</svg>
{:else if useRender}
	<img
		class="Logo"
		src="/images/logo/ii-render-480.webp"
		srcset={RENDER_SRCSET}
		{sizes}
		alt={label}
		width="1166"
		height="1355"
		decoding="async"
	/>
{:else}
<svg
	class="Logo"
	viewBox="0 0 357.311 357.48"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label={label}
>
	<path
		d="M357.311 357.48H245.531V354.24L280.631 329.4V28.08L245.531 3.24002V0H357.311V3.24002L322.211 28.08V329.4L357.311 354.24V357.48Z"
		fill="currentColor"
	/>
	<path
		d="M111.78 357.48H6.10352e-05V354.24L35.1001 329.4V28.08L6.10352e-05 3.24002V0H111.78V3.24002L76.6801 28.08V329.4L111.78 354.24V357.48Z"
		fill="currentColor"
	/>
</svg>
{/if}

<style>
	.Logo {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
</style>
