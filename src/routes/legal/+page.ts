import { titleOf } from '$lib/js/site';
import { LEGAL } from '$lib/content/legal';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	seo: { title: titleOf('Legal'), description: LEGAL.description }
});
