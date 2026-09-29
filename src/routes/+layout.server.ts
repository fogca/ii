import { getVisibleWorks } from '$lib/js/microcms';
import { workMedia } from '$lib/js/works';
import type { LayoutServerLoad } from './$types';

const FEATURE_COUNT = 2;

// The menu's two image panels (Figma II_Menu) — the first works in the
// archive's own order, each shown by its lead image.
export const load: LayoutServerLoad = async () => {
	try {
		const data = await getVisibleWorks({
			limit: 8,
			orders: 'order',
			fields: ['id', 'title', 'main_visual', 'thumbnail', 'repeat', 'hidden']
		});
		const features = data.contents
			.map((w) => {
				const image = workMedia(w).find((m) => !m.isVideo && m.width && m.height);
				return image
					? {
							slug: w.id,
							title: w.title,
							image: { src: image.src, width: image.width as number, height: image.height as number }
						}
					: null;
			})
			.filter((f): f is NonNullable<typeof f> => f !== null)
			.slice(0, FEATURE_COUNT);
		return { features };
	} catch {
		// The menu still works without its images.
		return { features: [] };
	}
};
