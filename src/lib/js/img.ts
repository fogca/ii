// microCMS (imgix Rendering API) image optimization helpers.
// Pure string utilities — safe to import in client components (no env access).
//
// fm=webp     → force WebP output. auto=format (imgix's usual Accept-header
//               content negotiation) does NOT work on microCMS's delivery
//               CDN — verified it returns image/jpeg regardless of the
//               request's Accept header, so format is forced explicitly here.
// compress    → extra lossless/lossy optimization.
// q (def 72)  → output quality. fit=max → never upscales past the source.

import type { MicroCMSImage } from 'microcms-js-sdk';
import type { Work } from './microcms';

/** A work's primary visual: the `main_visual` custom field — a Cloudflare
    video (`pj_videos`) or its image (`pj_images`). The legacy `thumbnail` is
    intentionally NOT used (migrated into main_visual). Returns null when
    main_visual is unset. Client-safe (no env access), so components can derive
    visuals directly. */
export type Visual = {
	src: string;
	isVideo: boolean;
	width?: number;
	height?: number;
};

export const mainVisual = (w: Work): Visual | null => {
	const video = w.main_visual?.pj_videos?.trim();
	if (video) return { src: video, isVideo: true };
	const img = w.main_visual?.pj_images;
	if (img?.url) return { src: img.url, isVideo: false, width: img.width, height: img.height };
	return null;
};

/** Image-only resolution for contexts that can't play video (intro Loader,
    SP archive cards): main_visual's image. (No thumbnail fallback.) */
export const mainVisualImage = (w: Work): MicroCMSImage | undefined =>
	w.main_visual?.pj_images;

export const imgOpt = (url: string | undefined, width: number, quality = 72): string => {
	if (!url) return '';
	const sep = url.includes('?') ? '&' : '?';
	return `${url}${sep}fm=webp&auto=compress&q=${quality}&w=${width}&fit=max`;
};

/** Cloudflare Media Transformations CDN root — used by videoFrame() below.
    NOT used for video `src` itself. mode=video IS enabled on this zone and
    does transform all our sources correctly, so the reason is not "it
    doesn't work" — it's that this endpoint is a proof press, not a print
    run. Re-measured 2026-07-28:
      - Output width is hard-capped at 2000px (width=2400 -> error 9401).
        The slug gallery renders ~2300 device px on a 1512pt laptop, and
        one source is natively 2800px wide — this alone disqualifies it.
      - A cold transform is non-streaming: nothing is returned until the
        whole file is re-encoded (measured TTFB 3-14s). Warm is ~0.4s,
        cached 20 days.
      - quality= is silently ignored; format= only accepts jpg/png/m4a, so
        there is no control over the output encode at all.
    An earlier version of this comment blamed Range support. That fact is
    real (mode=video answers a Range request with 200 + the whole body, no
    Content-Range, while still advertising accept-ranges) but the causal
    story was wrong: real Safari plays AND seeks such a response fine — the
    "stuck loading, still blurred" symptom was the cold-transform latency
    above, sitting behind a mode=frame LQIP of that same video. Do not
    revive this endpoint for `src` on the theory that smaller files would
    fix it; the 2000px cap and the encode latency are the blockers.
    Video `src` therefore uses the raw URL directly everywhere, served from
    pre-transcoded derivatives (see git history for the removed videoOpt). */
const VIDEO_CDN = 'https://cdn.takumiisobe.com/';

/** Tiny first-frame capture of a CDN video (Media Transformations
    mode=frame) — used as an LQIP background under <video> elements so
    loading/unloaded videos show a soft low-res preview of themselves
    instead of a flat gray/white box (~1KB each). The blur is free: a
    64px capture upscaled to fill its box by background-size:cover is
    naturally soft. Returns '' for non-CDN URLs (callers skip the
    background); if transformations are ever disabled the URL 404s and
    the background simply doesn't render — the plain wrapper shows,
    exactly the pre-LQIP behavior. */
export const videoFrame = (url: string, width = 64): string => {
	if (!url.startsWith(VIDEO_CDN)) return '';
	const path = url.slice(VIDEO_CDN.length);
	return `${VIDEO_CDN}cdn-cgi/media/mode=frame,time=0s,format=jpg,width=${width},fit=scale-down/${path}`;
};

/** Downscaled video via Media Transformations (mode=video).
 *
 * ONLY safe where the rendered box stays well under the endpoint's hard
 * 2000px output cap. Measured 2026-07-29: archives grid tiles render at
 * 187 CSS px (SP) / 264 (PC) — ~561 device px at 3x — so 1280 covers every
 * viewport with room to spare. The slug gallery does NOT qualify: its
 * items reach ~2800 device px, past the cap, so those keep the raw URL.
 *
 * Why this is worth it: decode memory scales with the SOURCE frame, not
 * the box it's drawn into. Ten of the grid's videos are 3840x2160 —
 * 11.86 MiB per frame each — to fill a 187px tile. At width=1280 that
 * becomes 1.31 MiB (9x less) and 6.0MB of transfer becomes 845KB.
 *
 * Cold transforms are non-streaming (Cloudflare re-encodes before sending
 * a byte) but the result is edge-cached for 20 days, and the LQIP poster
 * from videoFrame() covers the gap. Returns the URL unchanged for
 * non-CDN sources. */
export const videoOpt = (url: string, width = 1280): string => {
	if (!url.startsWith(VIDEO_CDN)) return url;
	const path = url.slice(VIDEO_CDN.length);
	return `${VIDEO_CDN}cdn-cgi/media/mode=video,width=${width}/${path}`;
};

/** Responsive srcset for a microCMS image across the given widths. */
export const imgSrcset = (url: string | undefined, widths: number[], quality = 72): string => {
	if (!url) return '';
	return widths.map((w) => `${imgOpt(url, w, quality)} ${w}w`).join(', ');
};
