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

export type Bilingual = { en: string; ja: string };

export type WorkDetail = {
	slug: string;
	title: string;
	number: string;
	/** The CMS `scope` select values (V.I. / Web / …). */
	scope: string[];
	hero: Media | null;
	/** The two images directly under the hero (Figma: 552 + 432 / 197 + 194). */
	pair: Media[];
	/** Everything after the text block. */
	rest: Media[];
	/** EN/JA copy; either may be '' (the page then shows the other one in
	    both languages). null when neither exists. */
	lead: Bilingual | null;
	body: Bilingual | null;
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

/** /works cards for one work: its thumbnail (main_visual, else the legacy
    thumbnail, else its first visual) followed by every repeat row flagged
    優先表示 (pj_images_priority). */
export const thumbAndPriority = (w: Work): { thumb: Media | null; priority: Media[] } => {
	const legacy = w.thumbnail?.url
		? { src: w.thumbnail.url, isVideo: false, width: w.thumbnail.width, height: w.thumbnail.height }
		: null;
	const rows = (w.repeat ?? []).map((row) => ({ row, media: rowMedia(row) }));
	const thumb = rowMedia(w.main_visual) ?? legacy ?? rows.find((r) => r.media)?.media ?? null;
	const priority = rows
		.filter((r) => r.row.pj_images_priority && r.media && r.media.src !== thumb?.src)
		.map((r) => r.media as Media);
	return { thumb, priority };
};

/** Every visual of a work in display order: the thumbnail (main_visual,
    else the legacy `thumbnail`, e.g. YSOVE) first, then the repeat rows in
    CMS order. */
export const workMedia = (w: Work): Media[] => {
	// The thumbnail (main_visual, else the legacy thumbnail) always leads;
	// 優先表示 (pj_images_priority) does NOT reorder anything here — it only
	// picks the extra images shown on /works (see thumbAndPriority).
	const rows = (w.repeat ?? []).map((row) => rowMedia(row)).filter((m): m is Media => m !== null);
	const main =
		rowMedia(w.main_visual) ??
		(w.thumbnail?.url
			? { src: w.thumbnail.url, isVideo: false, width: w.thumbnail.width, height: w.thumbnail.height }
			: null);
	return main ? [main, ...rows] : rows;
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
	const bilingual = (en: string, ja: string): Bilingual | null =>
		en || ja ? { en, ja } : null;
	// `headline` may use the same "ja!en" format as `description` (e.g. ANGO);
	// without a "!" it's a plain English line, as before.
	const headline = w.headline?.trim() ?? '';
	const head = headline.includes('!') ? splitTag(headline) : { ja: '', en: headline };
	const lead = bilingual(head.en || tag.en, head.ja || tag.ja);
	const body = bilingual(w.body_en?.trim() ?? '', w.body_jp?.trim() ?? '');

	// colophon_text only — a work without one shows no Colophon section.
	const colophon = parseColophon(w.colophon_text);

	return {
		slug: w.id,
		title: w.title,
		number: padNumber(index),
		scope: w.scope ?? [],
		hero,
		pair: gallery.slice(0, 2),
		rest: gallery.slice(2),
		lead,
		body,
		colophon
	};
};
