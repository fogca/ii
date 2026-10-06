import { getVisibleWorks } from '$lib/js/microcms';
import { padNumber, thumbAndPriority, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

export type WorkCard = {
	key: string;
	slug: string;
	title: string;
	number: string;
	/** First two scope tags, e.g. "V.I. / Web" (same as Office's home feed). */
	scope: string;
	visual: Media | null;
};

// /works — the default archive view: a 3-column grid (2 on SP) of every
// work's thumbnail, then every work's 優先表示 images shuffled; number /
// title / scope per card. The masonry lives at /works/grid.

/** Random order (new on every request) in which no two neighbours come from
    the same work, as far as the mix allows: each pick is drawn at random
    from the remaining cards of a different work than the previous one. */
const shuffleApart = (cards: WorkCard[]): WorkCard[] => {
	const pool = [...cards];
	const out: WorkCard[] = [];
	while (pool.length) {
		const prev = out.at(-1)?.slug;
		const options = pool.filter((c) => c.slug !== prev);
		const from = options.length ? options : pool;
		const pick = from[Math.floor(Math.random() * from.length)];
		pool.splice(pool.indexOf(pick), 1);
		out.push(pick);
	}
	return out;
};

export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'scope', 'main_visual', 'thumbnail', 'repeat', 'hidden']
	});

	// Every work's thumbnail first (archive order), then every work's
	// 優先表示 images in random order. Each card links to its work.
	const thumbs: WorkCard[] = [];
	const extras: WorkCard[] = [];
	data.contents.forEach((w, i) => {
		const base = {
			slug: w.id,
			title: w.title,
			number: padNumber(i),
			scope: (w.scope ?? []).slice(0, 2).join(' / ')
		};
		const { thumb, priority } = thumbAndPriority(w);
		thumbs.push({ ...base, key: `${w.id}:thumb`, visual: thumb });
		priority.forEach((visual, j) => extras.push({ ...base, key: `${w.id}:p${j}`, visual }));
	});
	const cards = [...thumbs, ...shuffleApart(extras)];

	return {
		cards,
		aside: { eyebrow: 'Creation Archive', title: 'Work\nArchives' },
		seo: { title: titleOf('Work Archives') }
	};
};
