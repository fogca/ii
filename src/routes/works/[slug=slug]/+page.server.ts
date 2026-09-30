import { error } from '@sveltejs/kit';
import { isMicroCMSRequestError } from 'microcms-js-sdk';
import { getDetail, getVisibleWorks, type Work } from '$lib/js/microcms';
import { toWorkDetail } from '$lib/js/works';
import { titleOf } from '$lib/js/site';
import type { PageServerLoad } from './$types';

// II_Works_Slug — one work.
export const load: PageServerLoad = async ({ params }) => {
	let work: Work;
	try {
		work = await getDetail(params.slug);
	} catch (e) {
		// Only a real "no such content" is a 404 — an outage, rate limit or
		// bad key must not tell visitors (and crawlers) the page is gone.
		if (isMicroCMSRequestError(e) && e.status === 404) {
			error(404, `Work "${params.slug}" not found`);
		}
		error(503, 'The archive is temporarily unavailable');
	}
	if (!work?.id || !work.title) error(404, `Work "${params.slug}" not found`);

	// "Creation Archive NN": the work's position in the archive's own order
	// (same numbering rule as Office). A `hidden` work is still reachable by
	// direct URL — as on Office, `hidden` only drops it from listings — so
	// it simply goes unnumbered, as does every work if this lookup fails.
	let index = -1;
	try {
		const list = await getVisibleWorks({ limit: 100, orders: 'order', fields: ['id', 'hidden'] });
		index = list.contents.findIndex((w) => w.id === work.id);
	} catch {
		// keep -1
	}
	const detail = toWorkDetail(work, Math.max(index, 0));

	// JPEG, cropped to the OG box — some link-preview crawlers still skip
	// WebP (imgOpt forces fm=webp for on-page images).
	const ogImage =
		detail.hero && !detail.hero.isVideo
			? `${detail.hero.src}?fm=jpg&w=1200&h=630&fit=crop&q=80`
			: undefined;

	return {
		work: detail,
		aside: {
			eyebrow: index >= 0 ? `Creation Archive ${detail.number}` : 'Creation Archive',
			title: work.title
		},
		seo: {
			title: titleOf(work.title),
			description: detail.lead?.en || undefined,
			image: ogImage
		}
	};
};
