// microCMS client — the SAME service as the Office site (Dev/OTIF, service
// "tia", endpoint `works`). Credentials come from .env (see .env.example);
// $env/static/private means they must exist at build time.
import type { MicroCMSImage, MicroCMSQueries } from 'microcms-js-sdk';
import { createClient } from 'microcms-js-sdk';
import { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } from '$env/static/private';

const client = createClient({
	serviceDomain: MICROCMS_SERVICE_DOMAIN,
	apiKey: MICROCMS_API_KEY
});

/** One `pj_images` custom-field row: an image OR a Cloudflare video URL. */
export type MediaRow = {
	fieldId: string;
	pj_images?: MicroCMSImage;
	pj_videos?: string;
	pj_images_title?: string;
	pj_images_priority?: boolean;
};

/** `works` as it exists in the live schema (checked 2026-09-29). Office's
    own Work type also lists year/stack/pc_thumbnail/repeatImg/colophon —
    none of those are live CMS fields, so they're left out here. */
export type Work = {
	id: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	revisedAt: string;
	title: string;
	brand?: string;
	order?: number;
	/** When true the work is left out of every listing. */
	hidden?: boolean;
	/** "ja!en" tagline ("?" = manual line break inside either half). */
	description?: string;
	scope?: string[];
	headline?: string;
	body_en?: string;
	body_jp?: string;
	/** Legacy primary image — still set on most works; used as a fallback. */
	thumbnail?: MicroCMSImage;
	main_visual?: MediaRow | null;
	repeat?: MediaRow[];
	/** richEditor HTML, one "Label!Value" credit per line. */
	colophon_text?: string;
};

export type WorkResponse = {
	totalCount: number;
	offset: number;
	limit: number;
	contents: Work[];
};

export const getList = async (queries?: MicroCMSQueries) => {
	return await client.get<WorkResponse>({ endpoint: 'works', queries });
};

/** getList minus works flagged `hidden`. The exclusion runs server-side
    (so `limit` caps the VISIBLE count) AND again client-side: the
    `hidden[not_equals]true` filter has been seen letting a hidden work
    through (Office, 2026-09). Any `fields` list must include 'hidden'. */
export const getVisibleWorks = async (queries?: MicroCMSQueries) => {
	const hiddenFilter = 'hidden[not_equals]true';
	const filters = queries?.filters ? `(${queries.filters})[and](${hiddenFilter})` : hiddenFilter;
	const data = await getList({ ...queries, filters });
	return { ...data, contents: data.contents.filter((w) => w.hidden !== true) };
};

export const getDetail = async (contentId: string, queries?: MicroCMSQueries) => {
	return await client.getListDetail<Work>({ endpoint: 'works', contentId, queries });
};
