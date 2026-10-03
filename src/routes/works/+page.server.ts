import { getVisibleWorks } from '$lib/js/microcms';
import { padNumber, workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

export type WorkCard = {
	slug: string;
	title: string;
	number: string;
	/** First two scope tags, e.g. "V.I. / Web" (same as Office's home feed). */
	scope: string;
	visual: Media | null;
};

// /works — the default archive view: every work in a 3-column grid (2 on
// SP), lead visual + number / title / scope. The masonry lives at
// /works/grid.
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'scope', 'main_visual', 'thumbnail', 'repeat', 'hidden']
	});

	const cards: WorkCard[] = data.contents.map((w, i) => ({
		slug: w.id,
		title: w.title,
		number: padNumber(i),
		scope: (w.scope ?? []).slice(0, 2).join(' / '),
		visual: workMedia(w)[0] ?? null
	}));

	return {
		cards,
		aside: { eyebrow: 'Creation Archive', title: 'Work\nArchives' },
		seo: { title: titleOf('Work Archives') }
	};
};
