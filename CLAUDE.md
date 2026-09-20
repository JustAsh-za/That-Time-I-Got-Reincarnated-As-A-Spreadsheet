# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"That Time I Got Reincarnated As A Spreadsheet" — a Node.js tool that aggregates anime ratings from MyAnimeList, AniList, and IMDb, tracks watching progress, and serves an interactive library UI. CommonJS throughout, no build step, no tests, no linter.

## Commands

```bash
npm install        # install dependencies
npm run serve      # local app at http://localhost:4400 (interactive, writes back to anime.json)
npm start          # CLI: fetch missing/expired data, generate static report.html + report.md
```

To force a re-fetch of one anime, use "Refetch ratings" in the UI, or delete its entry from `anime_cache.json`. Cache expires after 30 days (`CACHE_DURATION_MS` in [utils/cache.js](utils/cache.js)).

## Architecture

Two entry points share the same core:

- **[index.js](index.js)** (CLI): load library → fetch uncached/expired titles → save cache → write `report.html` (read-only mode) + `report.md`. Also repairs cache entries whose IMDb part is missing/errored without a full refetch.
- **[server.js](server.js)**: plain `node:http` server (no framework). `GET /` renders the app fresh from disk state; JSON API (`/api/library`, `/api/search`, `POST|PATCH|DELETE /api/anime`, `/api/refetch`, `/api/sequel`) mutates `anime.json` / `anime_cache.json`. Seasons are separate entries (matching AniList/MAL's model); `/api/sequel` reads AniList `relations` (lazily backfilled into the cache) to power the "next season" nudge on completion.

Core modules:

- **utils/library.js** — the data model. `anime.json` entries are `{title, status, progress, notes}` (legacy plain strings are normalized on load; statuses: backlog/watching/completed/on-hold/dropped). `buildResults(entries, cache)` merges tracking data with cached fetch data into render-ready results: average rating across available sources (AniList /100 is divided by 10), description/genres prefer MAL → AniList → IMDb, image/color from AniList. Tracking fields never come from the cache.
- **fetchers/** — one module per source, each `async (title) => data | {source, error}`; `fetchers/index.js` exposes `fetchSources(title)` running all three in parallel (failures are per-source, non-fatal — downstream must null-check `anilist`/`mal`/`imdb`).
  - `imdb.js`: IMDb's HTML pages are behind an AWS WAF JS challenge (HTTP 202), so it uses the **suggestion API** (`v2.sg.media-imdb.com/suggestion/{firstChar}/{query}.json`, note first-char path segment) to resolve the ID, then **`api.graphql.imdb.com`** for rating/plot/genres. Do not reintroduce HTML scraping — it cannot work.
  - `anilist.js`: GraphQL, ratings 0–100, handles 429 with Retry-After/backoff.
  - `mal.js`: `mal-scraper` package, ratings 0–10.
- **utils/cache.js** — `anime_cache.json`: `{[title]: {timestamp, data: {anilist, mal, imdb}}}`. Older entries stored the full merged result; `fetchedFromCache` in library.js unwraps both shapes.
- **utils/htmlReport.js** — inlines `utils/webapp/{template.html,styles.css,app.js}` into one self-contained HTML file. `renderHTML(results, {serverMode})` for the server; default export writes static `report.html` with `serverMode: false`.
- **utils/webapp/** — the UI. Two themes via CSS custom properties on `:root[data-theme]`: light = "Yume Library" (tokens from [stitch_anime_backlog_manager/DESIGN.md](stitch_anime_backlog_manager/DESIGN.md), Playfair Display + Plus Jakarta Sans), dark = "The Neon Curator" (tokens from [DESIGN.md](DESIGN.md), Space Grotesk + Manrope, tonal layering instead of borders). `app.js` reads `window.__DATA__`, verifies the API is reachable, and degrades to read-only when opened as a static file. Tier thresholds (S ≥ 8.5, A ≥ 8.0, B ≥ 7.5) live in `getTier()` there.

## Gotchas

- Generated/cache files (`report.html`, `report.md`, `anime_cache.json`, root-level `/*.html`) are gitignored. The HTML ignore is root-only so `utils/webapp/template.html` stays tracked.
- `ghibli.json` is an alternate title list; input path `anime.json` is fixed in `utils/library.js` (`LIBRARY_FILE`), functions accept a `file` override.
- Client-side: source descriptions may contain HTML (AniList uses `<br>`); `app.js` strips to plain text before rendering — keep it that way to avoid injection.
