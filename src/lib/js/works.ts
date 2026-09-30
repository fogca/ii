// Shapes microCMS `works` into what II's pages render. Pure functions — no
// env access — so they're safe to import anywhere (the loaders call them).
import type { MediaRow, Work } from './microcms';

/** One photograph/video on a page. `width`/`height` are the CMS's intrinsic
    pixel size (absent for videos — the CMS doesn't store them). */
export type Media = {
	src: string;
	isVideo: boolean;
	width?: number;
	height?: number;
	caption?: string;
};

/** One tile of the archive masonry — always an image (see buildTiles). */
export type Tile = {
	src: string;
	width: number;
	height: number;
	slug: string;
	title: string;
};

export type ColophonRow = { label: string; value: string; html?: boolean };

export type WorkDetail = {
	slug: string;
	title: string;
	number: string;
	hero: Media | null;
	/** The two images directly under the hero (Figma: 552 + 432 / 197 + 194). */
	pair: Media[];
	/** Everything after the text block. */
	rest: Media[];
	lead: { text: string; lang: 'en' | 'ja' } | null;
	body: { text: string; lang: 'en' | 'ja' } | null;
	colophon: ColophonRow[];
};

/** Zero-padded 1-based index: 0 → "01". Same numbering as Office (list
    position after `orders: 'order'`, not the raw `order` value, which has
    duplicates in the CMS). */
export const padNumber = (n: number): string => String(n + 1).padStart(2, '0');

const rowMedia = (row: MediaRow | null | undefined): Media | null => {
	if (!row) return null;
	const caption = row.pj_images_title?.trim() || undefined;
	const video = row.pj_videos?.trim();
	if (video) return { src: video, isVideo: true, caption };
	const img = row.pj_images;
	if (img?.url) return { src: img.url, isVideo: false, width: img.width, height: img.height, caption };
	return null;
};

/** Every visual of a work in display order: the lead visual first (a
    repeat row flagged 優先表示 beats main_visual, as on Office), then the
    remaining rows. Falls back to the legacy `thumbnail` when a work has no
    main_visual at all (e.g. YSOVE). */
export const workMedia = (w: Work): Media[] => {
	const rows = (w.repeat ?? []).map((row) => ({ row, media: rowMedia(row) }));
	const priority = rows.find((r) => r.row.pj_images_priority && r.media);
	const main = rowMedia(w.main_visual);
	const lead =
		priority?.media ??
		main ??
		(w.thumbnail?.url
			? { src: w.thumbnail.url, isVideo: false, width: w.thumbnail.width, height: w.thumbnail.height }
			: null);

	const others = rows
		.filter((r) => r !== priority && r.media)
		.map((r) => r.media as Media);
	// A priority row displaced main_visual from the lead slot — keep it in
	// the sequence rather than dropping it.
	if (priority?.media && main) others.unshift(main);

	return lead ? [lead, ...others] : others;
};

const MAX_TILES_PER_WORK = 6;

/** Archive masonry tiles: images only (videos would keep a hardware decoder
    busy per tile in a strip that's permanently in motion), at most
    MAX_TILES_PER_WORK per work, interleaved round-robin across works so one
    project never stacks up in a single stretch. */
export const buildTiles = (works: Work[]): Tile[] => {
	const perWork = works.map((w) => {
		const images = workMedia(w).filter((m) => !m.isVideo && m.width && m.height);
		// Works whose visuals are all video still deserve a tile.
		if (!images.length && w.thumbnail?.url) {
			images.push({
				src: w.thumbnail.url,
				isVideo: false,
				width: w.thumbnail.width,
				height: w.thumbnail.height
			});
		}
		return images.slice(0, MAX_TILES_PER_WORK).map(
			(m): Tile => ({
				src: m.src,
				width: m.width as number,
				height: m.height as number,
				slug: w.id,
				title: w.title
			})
		);
	});

	const tiles: Tile[] = [];
	const rounds = Math.max(0, ...perWork.map((list) => list.length));
	for (let round = 0; round < rounds; round++) {
		for (const list of perWork) {
			if (list[round]) tiles.push(list[round]);
		}
	}
	return tiles;
};

/** "ja!en" → the half for the given language ("?" = manual line break). */
const splitTag = (description: string): { ja: string; en: string } => {
	const breakify = (s: string) => s.trim().replace(/\?/g, '\n');
	const i = description.indexOf('!');
	if (i === -1) return { ja: breakify(description), en: '' };
	return { ja: breakify(description.slice(0, i)), en: breakify(description.slice(i + 1)) };
};

/** The label is rendered as text, so the editor's HTML entities have to be
    decoded first ("Art &amp; Direction" → "Art & Direction"). */
const decodeEntities = (s: string): string =>
	s
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&');

/** colophon_text (richEditor HTML) → rows. One "Label!Value" per line;
    inline <a> survives into the value (rendered with {@html}). Same parser
    as Office's work page. */
const parseColophon = (html: string | undefined): ColophonRow[] =>
	(html ?? '')
		.replace(/<\/(p|div)>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<(?!\/?a(?:\s|>))[^>]*>/gi, '')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.includes('!'))
		.map((line): ColophonRow => {
			const [label, ...rest] = line.split('!');
			return {
				label: decodeEntities(label.replace(/<[^>]+>/g, '')).trim(),
				value: rest.join('!').trim(),
				html: true
			};
		})
		.filter((row) => row.label && row.value);

export const toWorkDetail = (w: Work, index: number): WorkDetail => {
	const [hero = null, ...gallery] = workMedia(w);

	const tag = w.description ? splitTag(w.description) : { ja: '', en: '' };
	const leadEn = w.headline?.trim() || tag.en;
	const lead = leadEn
		? { text: leadEn, lang: 'en' as const }
		: tag.ja
			? { text: tag.ja, lang: 'ja' as const }
			: null;

	const bodyEn = w.body_en?.trim();
	const bodyJa = w.body_jp?.trim();
	const body = bodyEn
		? { text: bodyEn, lang: 'en' as const }
		: bodyJa
			? { text: bodyJa, lang: 'ja' as const }
			: null;

	// colophon_text only — a work without one shows no Colophon section.
	const colophon = parseColophon(w.colophon_text);

	return {
		slug: w.id,
		title: w.title,
		number: padNumber(index),
		hero,
		pair: gallery.slice(0, 2),
		rest: gallery.slice(2),
		lead,
		body,
		colophon
	};
};
