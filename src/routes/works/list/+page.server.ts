import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The list view lived here briefly (2026-09-30 → 10-01) before becoming the
// default /works — keep old links working.
export const load: PageServerLoad = () => {
	redirect(301, '/works');
};
