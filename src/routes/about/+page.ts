import { titleOf } from '$lib/js/site';
import type { PageLoad } from './$types';

// II_About — static page.
export const load: PageLoad = () => ({
	// No `aside`: About is a plain single column, without the left panel.
	seo: { title: titleOf('About Institute') }
});
