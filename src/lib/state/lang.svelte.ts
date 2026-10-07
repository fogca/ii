// Display language for bilingual content (same model as the Office site's
// lib/state/lang.svelte.ts). <html data-lang> drives show/hide CSS on pages
// that hold both EN and JA copy; app.html's pre-paint script sets it first
// (no flash) and restore() mirrors that decision — keep the two in sync.
// An explicit choice lasts for the tab session (sessionStorage); without
// one the site is Japanese — the browser's language is deliberately NOT
// consulted (unlike Office): JA is the default for everyone.
export type Lang = 'en' | 'ja';

export const LANG_STORAGE_KEY = 'ii-lang';

class LangState {
	current = $state<Lang>('ja');

	/** Client-only: adopt the session's choice, else stay Japanese. */
	restore() {
		try {
			const saved = sessionStorage.getItem(LANG_STORAGE_KEY);
			if (saved === 'en' || saved === 'ja') this.current = saved;
		} catch {
			// storage unavailable — stays Japanese
		}
	}

	set(next: Lang) {
		if (next === this.current) return;
		this.current = next;
		try {
			sessionStorage.setItem(LANG_STORAGE_KEY, next);
		} catch {
			// not persisted this session — still switches
		}
	}
}

export const lang = new LangState();
