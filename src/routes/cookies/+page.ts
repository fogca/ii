import { titleOf } from '$lib/js/site';
import { COOKIES } from '$lib/content/legal';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	seo: { title: titleOf('Cookies'), description: COOKIES.description }
});
