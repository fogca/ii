import { load as topLoad } from '../../+page.server';
import type { PageServerLoad } from './$types';

// Same slides as the top page — only the presentation differs.
export const load = (async (event) => topLoad(event as never)) satisfies PageServerLoad;
