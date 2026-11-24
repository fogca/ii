import { titleOf } from '$lib/js/site';
import { COMPANY } from '$lib/content/legal';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	seo: { title: titleOf('Company'), description: COMPANY.description }
});
