import { load as worksLoad } from '../../works/+page.server';
import type { PageServerLoad } from './$types';

// Same cards as /works (every work's thumbnail, then the 優先表示 images
// shuffled) — only the layout differs.
export const load = (async (event) => worksLoad(event as never)) satisfies PageServerLoad;
