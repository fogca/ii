import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The list view lived here briefly (2026-09-30 → 10-01) before moving to
// /works (now the 3-column grid) — keep old links working.
export const load: PageServerLoad = () => {
	redirect(301, '/works');
};
