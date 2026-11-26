// Shared UI state across the layout shell and pages.

class Ui {
	/** Menu sheet open. */
	menuOpen = $state(false);
	/** Becomes true when the opening hands off to the page — or straight
	    away when the opening is skipped. Chrome (header, aside title) and
	    the archive masonry's flow-in wait on this. */
	entered = $state(false);
	/** SP, top page: what the header shows. Nothing while the greeting is
	    still the logotype, then the "ii" it shortens to, then (past the
	    page's middle) only the dots. */
	homeMark = $state<'hidden' | 'ii' | 'dots'>('hidden');
}

export const ui = new Ui();
