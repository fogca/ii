// Masonry placement resolved to CSS, so it renders on the server and never
// re-flows on the client. Every box's place is a calc() over two variables
// the container provides — the column width `cw` and the `gap` — because
// with a fixed px gap and fluid columns a box's top is (sum of 1/ratio above
// it) × cw + (boxes above it) × gap: exact at any width, no measuring.
// Column choice (shortest first) is made once at a reference width; it stays
// a sensible packing at others.

export type Placement = { left: string; top: string; width: string; full: boolean };

type Column = { base: string | null; s: number; n: number; px: number };

export type MasonryOptions = {
	cols: number;
	/** CSS variable names (with --) the expressions refer to. */
	cw: string;
	gap: string;
	/** px values used only to pick the shortest column. */
	refCw: number;
	refGap: number;
	/** Whether item i (with this ratio) spans every column. */
	full?: (i: number, ratio: number, sinceFull: number) => boolean;
};

const num = (v: number) => Number(v.toFixed(5));

export const masonry = (ratios: number[], o: MasonryOptions) => {
	const cw = `var(${o.cw})`;
	const gap = `var(${o.gap})`;
	const cols: Column[] = Array.from({ length: o.cols }, () => ({ base: null, s: 0, n: 0, px: 0 }));
	const height = (c: Column) =>
		`${c.base ? `${c.base} + ` : ''}${num(c.s)} * ${cw} + ${num(c.n)} * ${gap}`;
	const fullWidth = `(${o.cols} * ${cw} + ${o.cols - 1} * ${gap})`;

	const items: Placement[] = [];
	let sinceFull = 0;
	ratios.forEach((ratio, i) => {
		if (o.full?.(i, ratio, sinceFull)) {
			const top = `max(${cols.map((c) => `calc(${height(c)})`).join(', ')})`;
			items.push({ left: '0px', top, width: `calc${fullWidth}`, full: true });
			const px = Math.max(...cols.map((c) => c.px)) + (o.cols * o.refCw + (o.cols - 1) * o.refGap) / ratio + o.refGap;
			for (const c of cols) {
				// Everything below starts under the full-width box.
				c.base = `${top} + ${fullWidth} / ${num(ratio)} + ${gap}`;
				c.s = 0;
				c.n = 0;
				c.px = px;
			}
			sinceFull = 0;
			return;
		}
		const k = cols.reduce((best, c, j) => (c.px < cols[best].px - 0.5 ? j : best), 0);
		const c = cols[k];
		items.push({
			left: `calc(${k} * (${cw} + ${gap}))`,
			top: `calc(${height(c)})`,
			width: cw,
			full: false
		});
		c.s += 1 / ratio;
		c.n += 1;
		c.px += o.refCw / ratio + o.refGap;
		sinceFull++;
	});

	// The tallest column, less the gap after its last box.
	const total = `max(${cols.map((c) => `calc(${height(c)} - ${gap})`).join(', ')})`;
	return { items, height: total };
};
