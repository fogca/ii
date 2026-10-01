import { getVisibleWorks } from '$lib/js/microcms';
import { buildTiles } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

// /works/grid — II_Works, the creation archive as a flowing masonry (was
// the top page until 2026-09-30, then /works until 10-01).
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'main_visual', 'thumbnail', 'repeat', 'hidden']
	});

	return {
		tiles: buildTiles(data.contents),
		aside: { eyebrow: 'Design to Craft', title: 'Creation\nArchive' },
		seo: { title: titleOf('Creation Archive') }
	};
};
