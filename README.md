# ii

II — Isobe Institute. SvelteKit 2 (Svelte 5) on Cloudflare Pages.

## Setup

```sh
npm install
cp .env.example .env   # microCMS credentials — the same service as the Office site (Dev/OTIF)
npm run dev            # http://localhost:3300
```

## Cloudflare Pages

- Framework preset: SvelteKit — build command `npm run build`, output directory `.svelte-kit/cloudflare`
- Environment variables (build time): `MICROCMS_SERVICE_DOMAIN`, `MICROCMS_API_KEY`

## Before launch

- Register the production domain (and the `*.pages.dev` preview host) with **TypeSquare** (石井ゴシック) and **FONTPLUS** (Tazugane) — both only serve registered domains.
- `src/lib/js/site.ts`: give Legal / Company / Cookies their pages and set `CONTACT_URL` (currently Instagram).

## Structure

| Path | |
|---|---|
| `src/routes/+page.*` | Opening (stack of works climbing, after Otic) + every work's thumbnail as one continuous film, hard cuts (TopReel) |
| `src/routes/works/+page.*` | All works in a masonry, 3 columns (2 on SP, the odd card full width) — default archive view |
| `src/routes/works/grid` | Design Creation (flowing masonry) |
| `src/routes/works/list` | 301 → `/works` (old URL of the former list view) |
| `src/routes/works/[slug=slug]` | Work detail |
| `src/routes/about` | About Institute (static copy in `src/lib/content/about.ts`) |
| `src/lib/components` | Header, Menu, Aside (left panel / page head), SiteFooter (SP), Opening, Masonry, Media, Logo |
| `src/lib/js/works.ts` | microCMS `works` → page data |
| `static/css/base.css` | tokens, reset, type primitives |
| `static/fonts` | Ango VF31 (Latin; formerly Elio), Norma VF09 (fallback for glyphs Ango doesn't ship) |
