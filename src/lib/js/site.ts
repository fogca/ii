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

// TODO(launch): Legal / Company / Cookies pages aren't designed yet, so
// these render as plain text. Give each an `href` once its page exists.
export const LEGAL_LINKS: { label: string; href?: string }[] = [
	{ label: 'Legal' },
	{ label: 'Company' },
	{ label: 'Cookies' }
];

// Double space before the year, as set in Figma (render with white-space: pre).
/** Which II mark the site shows (2026-09-30 trial):
    'render' = the shaded 3D render (static/images/logo/ii-render-*.webp,
    source in src/lib/assets/logo/), 'vector' = the flat Figma mark.
    Switching back is this one line. */
export const LOGO_STYLE: 'render' | 'vector' = 'render';

export const COPYRIGHT = `©II All Rights Reserved,  ${new Date().getFullYear()}`;

/** <title> suffix. */
export const titleOf = (page?: string) => (page ? `${page} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_FULL_NAME}`);
