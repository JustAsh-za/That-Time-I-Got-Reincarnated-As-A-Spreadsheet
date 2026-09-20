# Anime Backlog: IMDb fix, UI redesign, tracking, and easier entry management

> **Status: implemented 2026-07-09.** Everything below was built and verified end-to-end.
> Additions discovered during implementation (not in the original plan):
> - `anime.json` entries store an `anilistId` when added through the UI; fetchers use it to pin the exact AniList record instead of fuzzy title search (fixes wrong-match adds like Frieren resolving to a spin-off).
> - IMDb search queries normalize typographic quotes/dashes (`’` → `'`) — curly apostrophes broke suggestion matching.
> - One-time cache repair in `index.js`: entries cached while IMDb was broken get just their IMDb part refetched instead of waiting out the 30-day cache.
> - `.gitignore`'s `*.html` rule scoped to root-only (`/*.html`) so `utils/webapp/template.html` stays tracked.
> - Global `[hidden] { display: none !important; }` CSS rule — flex display rules on the modal backdrop were overriding the `hidden` attribute.

## Context

The anime backlog aggregator (fetch ratings from AniList/MAL/IMDb → generate report.html) has four problems to solve:

1. **IMDb fetcher is broken.** Verified live: IMDb now fronts all HTML pages (search + title) with an AWS WAF JavaScript challenge — every request returns HTTP 202 with a challenge page regardless of User-Agent, so the Googlebot-UA scraping approach in `fetchers/imdb.js` is dead. Two endpoints verified working with plain axios (no WAF, no auth):
   - **Suggestion API**: `GET https://v2.sg.media-imdb.com/suggestion/{firstChar}/{urlencoded query}.json` → `{d: [{id: "tt1910272", l: "Steins; Gate", q: "TV series", qid: "tvSeries", y: 2011, i: {imageUrl}}, ...]}`
   - **GraphQL API**: `POST https://api.graphql.imdb.com/` with `{query: 'query{title(id:"tt1910272"){titleText{text} ratingsSummary{aggregateRating voteCount} plot{plotText{plainText}} titleGenres{genres{genre{text}}}}}'}` → returned rating 8.8, plot, genres. (Disclaimer allows limited non-commercial use — fine for this personal tool.)
2. **UI redesign** following both design docs, which describe opposite aesthetics. User decision: **both as themes** — light mode = "Yume Library / Whimsical Forest" (`stitch_anime_backlog_manager/DESIGN.md` tokens + `code.html` mockup), dark mode = "The Neon Curator" (root `DESIGN.md`). Replaces the current 3-theme system.
3. **Progress tracking**: statuses Backlog / Watching / Completed / On-Hold / Dropped, per-anime episode progress (8/12 with +/- controls), and personal notes.
4. **Easier entry management**: user currently hand-edits `anime.json`. Decision: **lite local server** (plain Node `http`, zero new deps) that serves the UI and writes changes back to disk; adding anime becomes an in-UI search box (live AniList autocomplete → click to add).

UI scope decision: redesigned **library grid + per-anime detail view** (modal-style, like the stitch mockup: hero image, progress section, synopsis, metadata, notes). Existing features (search, genre filter, sort, tier badges S/A/B/C, grid/list toggle) carry over.

## Data model change

`anime.json` migrates from `["Title", ...]` to an array of objects:

```json
{ "title": "Steins;Gate", "status": "backlog", "progress": 0, "notes": "" }
```

- `status` ∈ `backlog | watching | completed | on-hold | dropped`; default `backlog`, `progress` default 0.
- **Backward compatible loading**: a shared loader (new `utils/library.js`) accepts string entries and normalizes them to objects; the file is rewritten in object form on first save. `ghibli.json` untouched (still works if swapped in, thanks to the normalizer).
- Fetched metadata stays in `anime_cache.json` (unchanged, keyed by title). Tracking data and fetched data merge at render/serve time.

## Implementation

### 1. Fix IMDb fetcher — `fetchers/imdb.js` (rewrite)

- Replace both scraping steps with: suggestion API → take the first result whose `qid` is a title type (`tvSeries`, `movie`, `tvMovie`, `tvMiniSeries`, `video`, `tvSpecial`) → GraphQL API for `titleText`, `ratingsSummary{aggregateRating voteCount}`, `plot`, `titleGenres`.
- Note the suggestion URL path shape: first path segment = first character of the lowercased query (fallback `x` for non-alphanumeric). Query itself URL-encoded.
- Keep the existing `fetchWithRetry`-style backoff (429/503) and the same return shape `{source, title, rating, description, genres, url}` / `{source: 'IMDb', error}` so `index.js` needs no changes. Drop cheerio usage here (stays a dep for now — mal-scraper aside, harmless).
- URL becomes `https://www.imdb.com/title/<id>/`.

### 2. Shared library module — new `utils/library.js`

- `loadLibrary()` / `saveLibrary(entries)`: read/write `anime.json`, normalizing string entries to `{title, status:'backlog', progress:0, notes:''}`.
- `buildResults(entries, cache)`: extract the per-title merge/normalize logic currently inline in `index.js` (average rating across sources, description/genre priority MAL→AniList→IMDb, image/color from AniList) so both the CLI and the server reuse it. `index.js` shrinks to: load library → fetch missing/expired via existing fetchers (unchanged parallel fetch + 1s delay) → save cache → generate reports.
- Result objects gain `status`, `progress`, `notes` fields passed through to the report generators.

### 3. Lite local server — new `server.js` (plain `node:http`, no new dependencies)

- `npm run serve` → `http://localhost:4400`.
- Routes:
  - `GET /` → generates the report HTML on the fly from current `anime.json` + cache (always fresh, no manual regeneration).
  - `GET /api/library` → merged results JSON.
  - `POST /api/anime` `{title}` → append to `anime.json`, fetch all 3 sources (reusing fetchers), cache, return the merged entry.
  - `PATCH /api/anime` `{title, status?, progress?, notes?}` → update entry, save `anime.json`.
  - `DELETE /api/anime` `{title}` → remove entry (leaves cache intact).
  - `GET /api/search?q=` → proxy AniList GraphQL search (top ~8: title, year, format, episodes, cover thumbnail) for the add-anime autocomplete.
  - `POST /api/refetch` `{title}` → drop the cache entry and refetch (fixes stale/wrong matches).
- The generated HTML's JS detects the API (fetch `/api/library`); when opened as a static `file://` report, edit controls hide and it degrades to a read-only report — `node index.js` static generation keeps working for sharing.

### 4. UI redesign — restructure `utils/htmlReport.js`

Split the monolithic 900-line template literal into asset files inlined at generation time (keeps the output a self-contained single HTML file):

- `utils/webapp/template.html` — page skeleton
- `utils/webapp/styles.css` — all styles, token-driven
- `utils/webapp/app.js` — all client logic
- `utils/htmlReport.js` — reads the three assets, injects the data JSON, returns/writes HTML (used by both CLI and server).

**Theming** — CSS custom properties on `:root[data-theme=light|dark]`, toggle in header, persisted to localStorage, default from `prefers-color-scheme`:
- **Light "Yume Library"**: exact tokens from `stitch_anime_backlog_manager/DESIGN.md` frontmatter (surface `#fcf9f3`, primary forest `#154212`, secondary sky `#00668a`, tertiary ochre, etc.). Playfair Display (display/headlines) + Plus Jakarta Sans (body). Soft green-tinted shadows, `1.5rem` card radii, pill buttons, grain/watercolor accents per the mockup (`code.html` is the visual reference).
- **Dark "Neon Curator"**: tokens from root `DESIGN.md` (surface `#15052b`, containers `#1b0933`/`#291446`, primary `#ca98ff`→`#9c42f4` gradient, secondary cyan `#00e3fd`, tertiary pink `#ff9bbe`). Space Grotesk (display) + Manrope (body). "No-line rule": tonal layering instead of borders; ghost borders at 15% opacity max; backdrop-blur glass header.
- Fonts via Google Fonts `<link>` (all four families; report already requires internet for cover images). No Tailwind — plain CSS.

**Library view**:
- Sticky glass header: title, theme toggle, add-anime search box (server mode only).
- Status tabs: All / Backlog / Watching / Completed / On-Hold / Dropped (with counts).
- Carried-over controls restyled as chips/pills: text search, genre filter, sort (avg/MAL/AniList/IMDb), grid/list toggle, Surprise Me.
- Cards: cover image, tier badge (S=secondary accent, A=primary per DESIGN.md), title, avg rating hero-sized, genre chips, status pill; thin episode-progress bar on watching cards. Click → detail view.

**Detail view** (overlay modal, mirrors stitch `code.html` layout):
- Hero: cover/banner image with gradient scrim, genre chips, big display-font title, one-line tagline.
- "Your Progress": `NN / total` counter, progress bar, − / + round buttons (PATCH progress; auto-set status → watching on first +, prompt-free set to completed when reaching final episode).
- Status selector (5 pill options) — PATCH status.
- Synopsis section + ratings row (AniList /100, MAL /10, IMDb /10 with links, numbers hero-styled per DESIGN.md §5).
- "Personal Journal" notes card: textarea, debounced PATCH save (handwritten/italic styling in light theme).
- Refetch + Remove actions (Remove confirms).

**Add-anime flow** (server mode): header search box → debounced `GET /api/search` → dropdown of AniList matches (thumb, title, year, format) → click → `POST /api/anime` → card appears in Backlog tab with a loading state while sources fetch.

`utils/report.js` (markdown/console) gets a minor touch: include status/progress columns.

### 5. Docs & cleanup

- `package.json`: add `"serve": "node server.js"` script.
- README: rewrite usage (serve workflow, tracking, add-via-UI), fix stale 7-day cache claim (it's 30 days), document new `anime.json` format and IMDb approach.
- CLAUDE.md: update architecture section to match (fetcher change, library.js, server, webapp assets).
- Add `1anime_cache.json` (stray junk) — ask nothing, just leave it; do NOT delete user files. (No action.)

## Files touched

| File | Action |
|---|---|
| `fetchers/imdb.js` | rewrite (suggestion + GraphQL APIs) |
| `utils/library.js` | new (load/save/normalize/merge) |
| `server.js` | new (plain http server + API) |
| `utils/webapp/{template.html,styles.css,app.js}` | new (UI assets) |
| `utils/htmlReport.js` | rewrite as thin asset-inliner |
| `index.js` | slim down to use `utils/library.js` |
| `utils/report.js` | minor: status/progress in output |
| `anime.json` | migrated to object entries on first save |
| `package.json`, `README.md`, `CLAUDE.md` | docs/scripts |

## Verification

1. **IMDb**: `node -e "require('./fetchers/imdb')('Steins;Gate').then(console.log)"` → rating ~8.8 with genres/plot; also test a miss (gibberish title) → `{error:'Not Found'}`.
2. **CLI path**: delete one cache entry, run `node index.js` → all three sources populate, `report.html`/`report.md` regenerate, static report opens read-only (no edit controls) from `file://`.
3. **Server path**: `npm run serve`, then via Claude Preview (add a `.claude/launch.json` entry) or browser:
   - Library renders in both themes (toggle + persistence; verify token colors with preview_inspect).
   - Change status → tab counts update and `anime.json` on disk shows the change.
   - Episode +/- updates bar and persists; reaching max sets completed.
   - Notes save (reload page, notes still there).
   - Add anime via search box → appears in Backlog, sources fetched, cache updated.
   - Refetch and Remove work; `anime.json` reflects removal.
4. Old string-array `ghibli.json` swapped in as a smoke test of the normalizer (read-only check, then swap back).
