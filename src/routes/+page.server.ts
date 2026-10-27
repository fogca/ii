import { getVisibleWorks } from '$lib/js/microcms';
import { padNumber, workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

export type Slide = { slug: string; title: string; number: string; visual: Media };
export type HomeWork = Slide & { scope: string };

/** How many works the top page's grid shows (the archive has the rest). */
const GRID_COUNT = 12;

// Top — every work's thumbnail as one continuous film (TopReel), and the
// first works of the archive as a grid, both in the archive's order. Works
// without any visual are skipped.
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'scope', 'main_visual', 'thumbnail', 'sp_thumbnail', 'sp_thumbnail_video', 'repeat', 'hidden']
	});

	const works: HomeWork[] = data.contents
		.map((w, i) => ({
			slug: w.id,
			title: w.title,
			number: padNumber(i),
			scope: (w.scope ?? []).slice(0, 2).join(' / '),
			visual: workMedia(w)[0]
		}))
		.filter((s): s is HomeWork => !!s.visual);

	const slides: Slide[] = works.map(({ slug, title, number, visual }) => ({ slug, title, number, visual }));

	return { slides, works: works.slice(0, GRID_COUNT), seo: { title: titleOf() } };
};
