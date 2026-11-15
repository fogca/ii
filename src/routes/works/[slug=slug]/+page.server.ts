import { error } from '@sveltejs/kit';
import { isMicroCMSRequestError } from 'microcms-js-sdk';
import { getDetail, type Work } from '$lib/js/microcms';
import { toWorkDetail } from '$lib/js/works';
import { workTitleOf } from '$lib/js/site';
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

	const detail = toWorkDetail(work);

	// JPEG, cropped to the OG box — some link-preview crawlers still skip
	// WebP (imgOpt forces fm=webp for on-page images).
	const ogImage =
		detail.hero && !detail.hero.isVideo
			? `${detail.hero.src}?fm=jpg&w=1200&h=630&fit=crop&q=80`
			: undefined;

	return {
		work: detail,
		aside: {
			eyebrow: 'Design Creation',
			title: work.title,
			scope: detail.scope.join(' / ')
		},
		seo: {
			title: workTitleOf(work.title),
			description: detail.lead?.en || undefined,
			image: ogImage
		}
	};
};
