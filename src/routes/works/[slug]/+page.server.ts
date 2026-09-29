import { error } from '@sveltejs/kit';
import { getDetail, getVisibleWorks } from '$lib/js/microcms';
import { toWorkDetail } from '$lib/js/works';
import { imgOpt } from '$lib/js/img';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

// II_Works_Slug — one work.
export const load: PageServerLoad = async ({ params }) => {
	let work;
	try {
		work = await getDetail(params.slug);
	} catch {
		error(404, `Work "${params.slug}" not found`);
	}

	// "Creation Archive NN": the work's position in the archive's own order
	// (same numbering rule as Office). A `hidden` work is still reachable by
	// direct URL — as on Office, `hidden` only drops it from listings — so
	// it simply goes unnumbered.
	const list = await getVisibleWorks({ limit: 100, orders: 'order', fields: ['id', 'hidden'] });
	const index = list.contents.findIndex((w) => w.id === work.id);
	const detail = toWorkDetail(work, Math.max(index, 0));

	const ogImage = detail.hero && !detail.hero.isVideo ? imgOpt(detail.hero.src, 1200) : undefined;

	return {
		work: detail,
		aside: {
			eyebrow: index >= 0 ? `Creation Archive ${detail.number}` : 'Creation Archive',
			title: work.title
		},
		seo: {
			title: titleOf(work.title),
			description: detail.lead?.lang === 'en' ? detail.lead.text : undefined,
			image: ogImage
		}
	};
};
