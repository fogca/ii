import { titleOf } from '$lib/js/site';
import type { PageLoad } from './$types';

// /type — the typefaces of Apres Guerre (the foundry), each with a simple
// type tester. Static: no left panel.
export const load: PageLoad = () => ({
	seo: { title: titleOf('Type') }
});
