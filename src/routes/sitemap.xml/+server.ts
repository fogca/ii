import { getVisibleWorks } from '$lib/js/microcms';
import { SITE_URL } from '$lib/js/site';
import type { RequestHandler } from './$types';

// /sitemap.xml — the static pages plus every visible work. Rendered on
// request (the works come from microCMS), cached for an hour.
const STATIC_PATHS = ['/', '/works', '/about', '/type', '/contact', '/legal', '/company', '/cookies'];
const CACHE_SECONDS = 3600;

const escapeXml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: RequestHandler = async () => {
	let slugs: { id: string; updatedAt?: string }[] = [];
	try {
		const data = await getVisibleWorks({ limit: 100, fields: ['id', 'updatedAt'] });
		slugs = data.contents.map((w) => ({ id: w.id, updatedAt: (w as { updatedAt?: string }).updatedAt }));
	} catch {
		// the static pages are still listed
	}
	const urls = [
		...STATIC_PATHS.map((p) => `<url><loc>${SITE_URL}${p}</loc></url>`),
		...slugs.map(
			(w) =>
				`<url><loc>${escapeXml(`${SITE_URL}/works/${w.id}`)}</loc>${
					w.updatedAt ? `<lastmod>${w.updatedAt.slice(0, 10)}</lastmod>` : ''
				}</url>`
		)
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': `public, max-age=${CACHE_SECONDS}`
		}
	});
};
