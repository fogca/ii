import { getVisibleWorks } from '$lib/js/microcms';
import { workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import { videoSize } from '$lib/server/videoSize';
import type { PageServerLoad } from './$types';

export type Slide = { slug: string; title: string; visual: Media };
export type HomeWork = Slide & { scope: string };

/** How many works the top page's grid shows (the archive has the rest). */
const GRID_COUNT = 9;

// Top — every work's thumbnail as one continuous film (TopReel), and a
// grid of the first nine. Both follow the order of the microCMS admin list
// (no `orders` query), so reordering there reorders the page.
// Works without any visual are skipped.
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
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
	const grid = works.slice(0, GRID_COUNT);
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
