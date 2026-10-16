// Masonry placement resolved to CSS, so it renders on the server and never
// re-flows on the client. Every box's place is a calc() over two variables
// the container provides — the column width `cw` and the `gap` — because
// with a fixed px gap and fluid columns a box's top is (sum of 1/ratio above
// it) × cw + (boxes above it) × gap: exact at any width, no measuring.
// Column choice (shortest first) is made once at a reference width; it stays
// a sensible packing at others.

export type Placement = {
	left: string;
	top: string;
	width: string;
	full: boolean;
	/** Set when the box is stretched (its own ratio is not kept) so its
	    column ends level with the tallest one, ahead of a full-width box. */
	height?: string;
};

type Column = { s: number; n: number; px: number; last: number | null };

export type MasonryOptions = {
	cols: number;
	/** Prefix for the base variables this layout declares (see `vars`). */
	name: string;
	/** CSS variable names (with --) the expressions refer to. */
	cw: string;
	gap: string;
	/** px values used only to pick the shortest column. */
	refCw: number;
	refGap: number;
	/** A box that, once `afterSince` boxes have run since the last one, spans
	    every column — only the ones this accepts (by ratio). It waits, the
	    boxes after it filling the shorter columns, until the columns end
	    within `maxSpread` px of each other; the last box of each shorter
	    column is then stretched (cropped by `cover`) so every column ends
	    level and the full-width box sits flush, with no hole above it. If
	    that takes more than `maxWait` boxes it stays an ordinary box. */
	full?: { afterSince: number; accepts: (ratio: number) => boolean; maxSpread: number; maxWait: number };
};

const num = (v: number) => Number(v.toFixed(5));

export const masonry = (ratios: number[], o: MasonryOptions) => {
	const cw = `var(${o.cw})`;
	const gap = `var(${o.gap})`;
	const cols: Column[] = Array.from({ length: o.cols }, () => ({ s: 0, n: 0, px: 0, last: null }));
	// Below a full-width box every column starts at the same height. That
	// height is declared once on the container as a variable (`vars`, each
	// one built on the previous), and the boxes under it refer to it — so
	// the markup grows by one short expression per box, not by a copy of
	// everything above it.
	let base: string | null = null;
	const vars: string[] = [];
	const local = (c: Column) => `${num(c.s)} * ${cw} + ${num(c.n)} * ${gap}`;
	const from = (expr: string) => (base ? `${base} + ${expr}` : expr);
	const tallest = () => `max(${cols.map((c) => `calc(${local(c)})`).join(', ')})`;
	const fullWidth = `(${o.cols} * ${cw} + ${o.cols - 1} * ${gap})`;

	const items: Placement[] = new Array(ratios.length);
	const spread = () => Math.max(...cols.map((c) => c.px)) - Math.min(...cols.map((c) => c.px));

	const placeRegular = (i: number) => {
		const ratio = ratios[i];
		const k = cols.reduce((best, c, j) => (c.px < cols[best].px - 0.5 ? j : best), 0);
		const c = cols[k];
		items[i] = {
			left: `calc(${k} * (${cw} + ${gap}))`,
			top: `calc(${from(local(c))})`,
			width: cw,
			full: false
		};
		c.s += 1 / ratio;
		c.n += 1;
		c.px += o.refCw / ratio + o.refGap;
		c.last = i;
	};

	const placeFull = (i: number) => {
		const ratio = ratios[i];
		// Level the columns first: each column's last box takes up the
		// difference to the tallest (zero for the tallest itself).
		for (const c of cols) {
			if (c.last === null) continue;
			items[c.last].height = `calc(${cw} / ${num(ratios[c.last])} + max(${cols.map((x) => `calc(${local(x)})`).join(', ')}) - (${local(c)}))`;
		}
		const top = from(tallest());
		items[i] = { left: '0px', top: `calc(${top})`, width: `calc${fullWidth}`, full: true };
		const px = Math.max(...cols.map((c) => c.px)) + (o.cols * o.refCw + (o.cols - 1) * o.refGap) / ratio + o.refGap;
		const name = `--${o.name}-b${vars.length + 1}`;
		vars.push(`${name}: calc(${top} + ${fullWidth} / ${num(ratio)} + ${gap})`);
		base = `var(${name})`;
		for (const c of cols) {
			c.s = 0;
			c.n = 0;
			c.px = px;
			c.last = null;
		}
	};

	let sinceFull = 0;
	let pending: number | null = null;
	let waited = 0;
	for (let i = 0; i < ratios.length; i++) {
		if (o.full && pending === null && sinceFull >= o.full.afterSince && o.full.accepts(ratios[i])) {
			pending = i;
			waited = 0;
			if (spread() <= o.full.maxSpread) {
				placeFull(i);
				pending = null;
				sinceFull = 0;
			}
			continue;
		}
		placeRegular(i);
		sinceFull++;
		if (pending !== null && o.full) {
			waited++;
			if (spread() <= o.full.maxSpread) {
				placeFull(pending);
				pending = null;
				sinceFull = 0;
			} else if (waited >= o.full.maxWait) {
				placeRegular(pending); // gave up: an ordinary box
				pending = null;
			}
		}
	}
	if (pending !== null) placeRegular(pending);

	// The tallest column, less the gap after its last box.
	return { items, height: `calc(${from(tallest())} - ${gap})`, vars: vars.join('; ') };
};
