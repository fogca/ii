import { getVisibleWorks } from '$lib/js/microcms';
import { padNumber, workMedia, type Media } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import { videoSize } from '$lib/server/videoSize';
import type { PageServerLoad } from './$types';

export type Slide = { slug: string; title: string; number: string; visual: Media };

// Top — every work's thumbnail as one continuous film (TopReel), in the
// archive's order. Works without any visual are skipped.
export const load: PageServerLoad = async () => {
	const data = await getVisibleWorks({
		limit: 100,
		orders: 'order',
		fields: ['id', 'title', 'main_visual', 'thumbnail', 'sp_thumbnail', 'sp_thumbnail_video', 'repeat', 'hidden']
	});

	const slides: Slide[] = data.contents
		.map((w, i) => ({ slug: w.id, title: w.title, number: padNumber(i), visual: workMedia(w)[0] }))
		.filter((s): s is Slide => !!s.visual);

	// The opening sizes its card like the first work's card on /works, which
	// needs that work's real ratio (the CMS has none for a video).
	await Promise.all(
		[slides[0]?.visual, slides[0]?.visual.sp]
			.filter((m): m is Media => !!m?.isVideo && !m.width)
			.map(async (m) => {
				const size = await videoSize(m.src);
				if (size) Object.assign(m, size);
			})
	);

	return { slides, seo: { title: titleOf() } };
};
