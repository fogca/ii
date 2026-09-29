// Global cap on how many <video> elements may hold a decoder at once.
//
// Why this exists: release-on-exit (lazyVideo / lazyGridVideo detaching src
// when an item scrolls away) only bounds ACCUMULATION — it never bounded
// CONCURRENCY. Measured on production /archives before this cap: up to 8
// simultaneously-playing videos on SP (15 on PC), and 10 of the 18 grid
// videos are 4K sources — each active 4K stream holds roughly 40-100MB of
// decode surfaces regardless of how small its tile renders. 8 × 4K on an
// iPhone is jetsam territory: iOS kills background audio first (the user's
// music stops), then the Safari tab itself (the crash). Two real incidents.
//
// Mechanism: actions ask for a slot before attaching src/playing. If the
// budget is full the video stays in its designed placeholder state (LQIP
// background) and joins a wait list; whenever a slot frees (scroll-away,
// unmount), the WAITING video nearest the viewport gets it. The queue also
// self-heals across SvelteKit navigations (new page's requests may briefly
// find the budget full before the old page's actions destroy and release).
const holders = new Set<HTMLElement>();
type Waiter = { node: HTMLElement; start: () => void };
const waiters: Waiter[] = [];

// 6 on touch devices, 12 on desktop. The first pass at this was 3/6, which
// bounded memory but starved the page visually: with more tiles on screen
// than slots, the surplus sat frozen on their LQIP poster, which reads as
// broken rather than as restraint.
//
// What makes 6 defensible on mobile now is that the worst source is gone.
// The site used to serve a 5523x1628 yuv444p file at 25.72 MiB/frame — 4:4:4
// carries chroma at full resolution, so its buffer was w*h*3, not w*h*1.5,
// making it 2.17x heavier than a 4K frame despite having fewer pixels. It is
// no longer referenced. Today's ceiling is a uniform 11.86 MiB/frame (10 of
// the 17 files are 3840x2160), so 6 concurrent is ~71 MiB of frame buffers
// against the ~100-150 MiB mix that was crashing at 8.
//
// That is a real but bounded increase, and it is still the SOURCES doing the
// damage: every one of those tiles renders at a few hundred px. Serving
// pre-transcoded 1280-wide derivatives would cut each stream ~9x and make
// this cap comfortable rather than calculated. Evaluated per call so a
// resize or mode change is picked up on the next grant.
function limit(): number {
	return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 6 : 12;
}

// Distance from the viewport's edges (0 while intersecting) — used to pick
// which waiter deserves a freed slot first.
function distanceToViewport(node: HTMLElement): number {
	const r = node.getBoundingClientRect();
	const vh = window.innerHeight;
	if (r.bottom < 0) return -r.bottom;
	if (r.top > vh) return r.top - vh;
	return 0;
}

function grantFreedSlots(): void {
	while (holders.size < limit() && waiters.length > 0) {
		waiters.sort((a, b) => distanceToViewport(a.node) - distanceToViewport(b.node));
		const next = waiters.shift()!;
		holders.add(next.node);
		next.start();
	}
}

/** Ask for a decoder slot. `start` runs immediately if one is free (or the
    node already holds one), otherwise when a slot frees up — possibly much
    later, or never if the node releases first. */
export function acquireVideoSlot(node: HTMLElement, start: () => void): void {
	if (holders.has(node)) {
		start();
		return;
	}
	if (holders.size < limit()) {
		holders.add(node);
		start();
		return;
	}
	const existing = waiters.find((w) => w.node === node);
	if (existing) {
		existing.start = start;
	} else {
		waiters.push({ node, start });
	}
}

/** Give the slot back (or leave the wait list). Callers do their own media
    teardown; this only manages the budget and hands freed slots on. */
export function releaseVideoSlot(node: HTMLElement): void {
	const waiting = waiters.findIndex((w) => w.node === node);
	if (waiting !== -1) waiters.splice(waiting, 1);
	if (holders.delete(node)) grantFreedSlots();
}
