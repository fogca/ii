// Site-wide constants (client-safe).

export const SITE_NAME = 'II';
export const SITE_FULL_NAME = 'Isobe Institute';
export const SITE_DESCRIPTION =
	'II — Isobe Institute. A creative institute for design and craft, at the intersection of culture, philosophy and creation.';

export const INSTAGRAM = {
	handle: '@ii_ii.co',
	url: 'https://www.instagram.com/ii_ii.co/'
};

// TODO(launch): no contact page or address has been designed yet — "Get in
// touch" points at Instagram until one exists.
export const CONTACT_URL = INSTAGRAM.url;

/** The type foundry (Apres Guerre, formerly August). */
export const TYPE_URL = 'https://august.tf';

/** Site navigation: PC header links and the menu sheet. */
export const NAV_LINKS: { label: string; href: string; external: boolean }[] = [
	{ label: 'Works', href: '/works', external: false },
	{ label: 'Institute', href: '/about', external: false },
	{ label: 'Type', href: '/type', external: false },
	{ label: 'Contact', href: CONTACT_URL, external: true }
];

// TODO(launch): Legal / Company / Cookies pages aren't designed yet, so
// these render as plain text. Give each an `href` once its page exists.
export const LEGAL_LINKS: { label: string; href?: string }[] = [
	{ label: 'Legal' },
	{ label: 'Company' },
	{ label: 'Cookies' }
];

// Double space before the year, as set in Figma (render with white-space: pre).
/** Which II mark the site shows (2026-09-30 trial):
    'ii' = the lowercase "ii" of the ii-ii.co wordmark (2026-10-07),
    'render' = the shaded 3D render (static/images/logo/ii-render-*.webp,
    source in src/lib/assets/logo/), 'vector' = the flat Figma mark.
    Switching back is this one line. */
export const LOGO_STYLE: 'ii' | 'render' | 'vector' = 'ii';

export const COPYRIGHT = `©II All Rights Reserved,  ${new Date().getFullYear()}`;

/** <title>: the page's name in capitals (a work keeps its own casing —
    see workTitleOf). */
export const titleOf = (page?: string) =>
	page ? `${page.toUpperCase()} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_FULL_NAME.toUpperCase()}`;

export const workTitleOf = (work: string) => `${work} — ${SITE_NAME}`;
