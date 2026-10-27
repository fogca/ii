// Fades an element in the first time it enters the screen: adds `is-in`
// (the page's CSS draws the before/after). A little way into the screen,
// not at its very edge.
const REVEAL_MARGIN = '0px 0px -12% 0px';

export function reveal(node: HTMLElement) {
	const io = new IntersectionObserver(
		([e]) => {
			if (!e.isIntersecting) return;
			node.classList.add('is-in');
			io.disconnect();
		},
		{ rootMargin: REVEAL_MARGIN }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}
