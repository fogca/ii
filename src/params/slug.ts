import type { ParamMatcher } from '@sveltejs/kit';

// Work slugs are microCMS content IDs. The loader concatenates the slug into
// the CMS request URL, so anything else (e.g. "..%2Fworks", "?fields=")
// could reach other endpoints/queries with the server's API key — reject it
// here (non-matching URLs simply 404).
export const match: ParamMatcher = (param) => /^[A-Za-z0-9_-]+$/.test(param);
