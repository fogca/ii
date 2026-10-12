<script lang="ts">
	import { lazyVideo } from '$lib/actions/lazyVideo';
	import { imgOpt, imgSrcset, videoFrame } from '$lib/js/img';
	import type { Media } from '$lib/js/works';

	let {
		media,
		sizes,
		widths = [640, 900, 1400, 2000, 2800],
		cover = false,
		eager = false,
		quality,
		alt = ''
	}: {
		media: Media;
		/** `sizes` attribute for the image srcset. */
		sizes: string;
		widths?: number[];
		/** Fill a box sized by the parent (object-fit: cover) instead of
		    keeping the media's own aspect ratio. */
		cover?: boolean;
		/** Above the fold: load immediately. */
		eager?: boolean;
		/** Output quality (imgOpt's default when omitted). */
		quality?: number;
		alt?: string;
	} = $props();

	// Videos carry no dimensions in the CMS — 16:9 until metadata arrives.
	let videoRatio = $state<string | null>(null);
	const ratio = $derived(
		media.width && media.height ? `${media.width} / ${media.height}` : (videoRatio ?? '16 / 9')
	);
	const lqip = $derived(media.isVideo ? videoFrame(media.src, 64) : imgOpt(media.src, 32, 30));

	// SP replacement (`media.sp`, the CMS mobile thumbnail — image or
	// video): shown below the PC breakpoint in place of the main image or
	// video — picked by <source media> / CSS, so the server render is the
	// same for both. A hidden video is display:none, so lazyVideo never
	// starts it; neither autoplays when a replacement exists.
	const SP_QUERY = '(max-width: 1023.98px)';
	// Stands in for the main image on SP when the replacement is a video,
	// so the browser fetches nothing for the hidden <img> there.
	const BLANK_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
	const sp = $derived(media.sp);
	const spRatio = $derived(sp?.width && sp.height ? `${sp.width} / ${sp.height}` : null);
	const spLqip = $derived(sp ? (sp.isVideo ? videoFrame(sp.src, 64) : imgOpt(sp.src, 32, 30)) : '');

	let loaded = $state(false);

	function revealOnData(video: HTMLVideoElement) {
		const done = () => (loaded = true);
		if (video.readyState >= 1) done();
		video.addEventListener('loadedmetadata', done, { once: true });
	}

	function revealOnLoad(img: HTMLImageElement) {
		const done = () => (loaded = true);
		if (img.complete && img.naturalWidth) done();
		else img.addEventListener('load', done, { once: true });
	}

	// Metadata can land before hydration — read it directly as well.
	function videoAspect(video: HTMLVideoElement) {
		const read = () => {
			if (video.videoWidth && video.videoHeight) {
				videoRatio = `${video.videoWidth} / ${video.videoHeight}`;
				loaded = true;
			}
		};
		read();
		video.addEventListener('loadedmetadata', read);
		video.addEventListener('loadeddata', read);
		return {
			destroy() {
				video.removeEventListener('loadedmetadata', read);
				video.removeEventListener('loadeddata', read);
			}
		};
	}
</script>

<figure
	class="Media"
	class:is-cover={cover}
	class:is-loaded={loaded}
	class:has-sp={!!sp}
	style:--ratio={cover ? undefined : ratio}
	style:--ratio-sp={cover ? undefined : (spRatio ?? ratio)}
	style:--lqip={lqip ? `url('${lqip}')` : undefined}
	style:--lqip-sp={spLqip ? `url('${spLqip}')` : undefined}
>
	{#if sp?.isVideo}
		<video
			class="sp-only"
			src={sp.src}
			muted
			loop
			playsinline
			preload="metadata"
			use:lazyVideo
			use:revealOnData
		></video>
	{:else if sp && media.isVideo}
		<img
			class="sp-only"
			src={imgOpt(sp.src, 1400, quality)}
			srcset={imgSrcset(sp.src, widths, quality)}
			{sizes}
			{alt}
			width={sp.width}
			height={sp.height}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			use:revealOnLoad
		/>
	{/if}
	{#if media.isVideo}
		<video
			class:pc-only={!!sp}
			src={media.src}
			muted
			loop
			playsinline
			autoplay={eager && !sp}
			preload={eager && !sp ? 'auto' : 'metadata'}
			use:lazyVideo
			use:videoAspect
		></video>
	{:else}
		<picture>
			{#if sp?.isVideo}
				<source media={SP_QUERY} srcset={BLANK_SRC} />
			{:else if sp}
				<source
					media={SP_QUERY}
					srcset={imgSrcset(sp.src, widths, quality)}
					{sizes}
					width={sp.width}
					height={sp.height}
				/>
			{/if}
			<img
				class:pc-only={sp?.isVideo}
				src={imgOpt(media.src, 1400, quality)}
				srcset={imgSrcset(media.src, widths, quality)}
				{sizes}
				{alt}
				width={media.width}
				height={media.height}
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={eager ? 'high' : undefined}
				decoding="async"
				use:revealOnLoad
			/>
		</picture>
	{/if}
	{#if media.caption}
		<figcaption class="sr-only">{media.caption}</figcaption>
	{/if}
</figure>

<style>
	.Media {
		position: relative;
		width: 100%;
		overflow: clip;
		isolation: isolate;
		background-color: var(--color-tile);
		background-image: var(--lqip);
		background-size: cover;
		background-position: center;
		aspect-ratio: var(--ratio);
	}

	@media (max-width: 1023.98px) {
		.Media.has-sp {
			background-image: var(--lqip-sp);
			aspect-ratio: var(--ratio-sp);
		}

		.pc-only {
			display: none;
		}
	}

	@media (min-width: 1024px) {
		.sp-only {
			display: none;
		}
	}

	picture {
		display: contents;
	}

	.Media.is-cover {
		height: 100%;
	}

	img,
	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.9s var(--ease-out);
	}

	/* iOS draws a hairline at a <video>'s edge that no screenshot shows —
	   overscan it out (same fix as Office). */
	video {
		transform: scale(1.02);
	}

	.is-loaded img,
	.is-loaded video {
		opacity: 1;
	}
</style>
