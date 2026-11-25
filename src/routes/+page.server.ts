import { getVisibleWorks } from '$lib/js/microcms';
import { workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import { videoSize } from '$lib/server/videoSize';
import type { PageServerLoad } from './$types';

export type Slide = { slug: string; title: string; visual: Media };
export type HomeWork = Slide & { scope: string };

/** How many works the top page's grid shows (the archive has the rest). */
const GRID_COUNT = 9;
/** The top grid's order (the archive's own order is unchanged); any place
    left over follows the archive. */
const GRID_ORDER = ['rc1', 'ysove', 'ttt', 'jds', 'mksk', 'humorist', 'etc', 'one'];

// Top — every work's thumbnail as one continuous film (TopReel), in the
// archive's order, and a grid of nine: GRID_ORDER first, then the archive.
// Works without any visual are skipped.
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
			scope: (w.scope ?? []).slice(0, 2).join(' / '),
			visual: workMedia(w)[0]
		}))
		.filter((s): s is HomeWork => !!s.visual);

	const slides: Slide[] = works.map(({ slug, title, visual }) => ({ slug, title, visual }));

	// The grid keeps each visual's own ratio: read the videos' from the files.
	const lead = GRID_ORDER.map((slug) => works.find((w) => w.slug === slug)).filter(
		(w): w is HomeWork => !!w
	);
	const grid = [...lead, ...works.filter((w) => !lead.includes(w))].slice(0, GRID_COUNT);
	await Promise.all(
		grid
			.flatMap((w) => [w.visual, w.visual.sp])
			.filter((m): m is Media => !!m?.isVideo && !m.width)
			.map(async (m) => {
				const size = await videoSize(m.src);
				if (size) Object.assign(m, size);
			})
	);

	return { slides, works: grid, seo: { title: titleOf() } };
};
