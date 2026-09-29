// Prioritises video bandwidth AND memory toward whatever is actually on
// screen. Markup keeps src + preload="metadata", so every video still
// reports its intrinsic size up front (the gallery's heights depend on it)
// — that part is cheap: metadata alone holds no decoder.
//
// Near the viewport: switch to full buffering + play. Once it scrolls away
// again: fully RELEASE the video (pause + detach src + load()), not just
// pause() — on iOS every <video> that keeps a src keeps a hardware decoder
// slot and its buffer in memory, and long pages accumulated one per passed
// video until decoders/memory ran out (videos went black, then the tab
// crashed). Before detaching, the current aspect-ratio is frozen as an
// inline style so the element's rendered height survives losing its
// intrinsic size (no layout jump); re-entering re-attaches the same src,
// re-buffered from the HTTP cache.
//
// `src` is always the raw R2 file — NOT routed through Cloudflare Media
// Transformations. That was tried (see git history) to cut decode memory
// via a smaller rendition; the disqualifiers are the 2000px output cap and
// the non-streaming cold transform, NOT Range support (see the detailed
// note on VIDEO_CDN in $lib/js/img.ts — an earlier version of this comment
// had the causality wrong). The right lever is smaller SOURCES.
import { acquireVideoSlot, releaseVideoSlot } from './videoBudget';

export function lazyVideo(node: HTMLVideoElement, opts: { rootMargin?: string } = {}) {
	// 200px (not 400px) — slug's gallery items run close to full-viewport
	// height stacked in a single column (unlike the grid's multi-column
	// layout), so 400px could put 2+ heavy videos "active" simultaneously,
	// contending for iOS's small shared hardware-decoder pool. Reported as
	// "stuck blurred, never plays" on some slug videos — plausible but not
	// reproduced directly here (tested multiple slugs, local + production,
	// slow and fast/stress scrolling, all loaded fine); this narrows the
	// concurrent-decoder window as a targeted, low-risk mitigation rather
	// than a confirmed fix. Flag it again if it recurs.
	// Full activation is additionally gated by the global videoBudget cap
	// (shared with the archives grid) — see videoBudget.ts for the memory
	// story. Dormant state (src + preload=metadata) holds no decoder and
	// stays outside the budget.
	const { rootMargin = '200px' } = opts;
	// Remembered so release() can detach it and activate() can put it back.
	// Re-read on every activate/release rather than captured once at mount:
	// if the element is reused for a DIFFERENT video (same-route navigation
	// patching src in place), a value captured here would be the previous
	// clip's URL, and the first release/re-enter cycle would restore THAT —
	// the video silently reverting to the last project's footage.
	let src = node.getAttribute('src') ?? '';
	let active = false;

	const activate = () => {
		const current = node.getAttribute('src');
		if (current) src = current;
		if (!current && src) {
			node.setAttribute('src', src);
			node.load();
		}
		active = true;
		node.preload = 'auto';
		node.play?.().catch(() => {});
	};

	const release = () => {
		// Only videos that were actually activated hold heavy resources —
		// never-approached ones stay in their cheap metadata-only state, so
		// their first-layout intrinsic sizing keeps working exactly as before.
		if (!active) {
			node.pause();
			return;
		}
		active = false;
		node.pause();
		// Capture whatever it is playing NOW, so re-entry restores this clip
		// and not one the element held earlier.
		const current = node.getAttribute('src');
		if (current) src = current;
		// Freeze the rendered proportions before the intrinsic size is lost
		// with the src (width:100%/height:auto would otherwise collapse to
		// the 300x150 default and jump the scroll position).
		if (node.videoWidth && node.videoHeight && !node.style.aspectRatio) {
			node.style.aspectRatio = `${node.videoWidth} / ${node.videoHeight}`;
		}
		// The canonical WebKit way to free the decoder + buffer.
		node.removeAttribute('src');
		node.load();
	};

	if (typeof IntersectionObserver === 'undefined') {
		node.play?.().catch(() => {});
		return;
	}

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					acquireVideoSlot(node, activate);
				} else {
					releaseVideoSlot(node);
					release();
				}
			}
		},
		{ rootMargin }
	);
	io.observe(node);

	return {
		destroy() {
			io.disconnect();
			releaseVideoSlot(node);
		}
	};
}
