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

	let loaded = $state(false);

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
	style:aspect-ratio={cover ? undefined : ratio}
	style:background-image={lqip ? `url('${lqip}')` : undefined}
>
	{#if media.isVideo}
		<video
			src={media.src}
			muted
			loop
			playsinline
			autoplay={eager}
			preload={eager ? 'auto' : 'metadata'}
			use:lazyVideo
			use:videoAspect
		></video>
	{:else}
		<img
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
		background-size: cover;
		background-position: center;
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
