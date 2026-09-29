// Shared UI state across the layout shell and pages.

/** sessionStorage key the pre-paint script in app.html also reads/writes. */
export const OP_STORAGE_KEY = 'ii-op';

class Ui {
	/** Menu sheet open. */
	menuOpen = $state(false);
	/** Becomes true when the opening hands off to the page — or straight
	    away when the opening is skipped. Chrome (header, aside title) and
	    the archive masonry's flow-in wait on this. */
	entered = $state(false);
}

export const ui = new Ui();
