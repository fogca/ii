// Display language for bilingual content (same model as the Office site's
// lib/state/lang.svelte.ts). <html data-lang> drives show/hide CSS on pages
// that hold both EN and JA copy; app.html's pre-paint script sets it first
// (no flash) and restore() mirrors that decision — keep the two in sync.
// An explicit choice lasts for the tab session (sessionStorage); without
// one, the browser's own language decides.
export type Lang = 'en' | 'ja';

export const LANG_STORAGE_KEY = 'ii-lang';

class LangState {
	current = $state<Lang>('en');

	/** Client-only: adopt the session's choice, else the browser language. */
	restore() {
		try {
			const saved = sessionStorage.getItem(LANG_STORAGE_KEY);
			if (saved === 'en' || saved === 'ja') {
				this.current = saved;
				return;
			}
		} catch {
			// storage unavailable — fall through to detection
		}
		if (navigator.language?.toLowerCase().startsWith('ja')) this.current = 'ja';
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
