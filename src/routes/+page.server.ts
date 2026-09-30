import { getVisibleWorks } from '$lib/js/microcms';
import { padNumber, workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

export type Slide = { slug: string; title: string; number: string; visual: Media };

// Top — one full-screen slide per work (hinc.jp-style stack), in the
// archive's order. Works without any visual are skipped.
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'main_visual', 'thumbnail', 'repeat', 'hidden']
	});

	const slides: Slide[] = data.contents
		.map((w, i) => ({ slug: w.id, title: w.title, number: padNumber(i), visual: workMedia(w)[0] }))
		.filter((s): s is Slide => !!s.visual);

	return { slides, seo: { title: titleOf() } };
};
