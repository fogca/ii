// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			/** Title block shown in the left panel (PC) / page head (SP). */
			aside?: { eyebrow: string; title: string };
			seo?: { title: string; description?: string; image?: string };
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
