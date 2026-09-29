import { titleOf } from '$lib/js/site';
import type { PageLoad } from './$types';

// II_About — static page.
export const load: PageLoad = () => ({
	aside: { eyebrow: '(Isobe Institute)', title: 'About\nInstitute' },
	seo: { title: titleOf('About Institute') }
});
