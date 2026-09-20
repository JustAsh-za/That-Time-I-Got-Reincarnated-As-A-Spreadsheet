# That Time I Got Reincarnated As A Spreadsheet

*When you die and wake up as an anime rating aggregator... but at least you have a really good sorting algorithm* 📊✨

A Node.js tool that aggregates anime ratings from MyAnimeList, AniList, and IMDb, tracks your watching progress, and serves a beautiful two-theme library UI to help you decide what to watch next.

## Features

- **Multi-Source Aggregation**: Ratings from MyAnimeList, AniList, and IMDb (via IMDb's suggestion + GraphQL APIs — no scraping)
- **Progress Tracking**: Backlog / Watching / Completed / On-Hold / Dropped shelves, per-episode progress, and personal notes
- **Next-Season Nudge**: finishing a season offers a one-click "Add to backlog" for its sequel (via AniList relations); completed entries also show an "Up next" panel in their detail view
- **Local Server Mode**: `npm run serve` turns the report into a small app — add anime with live AniList search, change status, tick off episodes, write notes; everything saves back to `anime.json`
- **Two Themes**:
  - ☀️ **Yume Library** — cream parchment, forest green, storybook serif (light)
  - 🌙 **The Neon Curator** — nocturnal violet, electric purple/cyan (dark)
- **Static Reports**: `npm start` still generates a shareable read-only `report.html` and `report.md`
- **Smart Caching**: fetched data cached for 30 days in `anime_cache.json`

## Installation

```bash
git clone https://github.com/JustAsh-za/That-Time-I-Got-Reincarnated-As-A-Spreadsheet.git
cd That-Time-I-Got-Reincarnated-As-A-Spreadsheet
npm install
```

## Usage

### Interactive app (recommended)

```bash
npm run serve
```

Open http://localhost:4400. From there you can:

- **Add anime**: type in the "Add an anime…" box, pick a match from AniList
- **Track progress**: open any card → +/− episode buttons (auto-moves Backlog → Watching → Completed)
- **Move shelves**: Backlog / Watching / Completed / On Hold / Dropped
- **Write notes**: the "Personal journal" panel autosaves
- **Refetch ratings** or **remove** an entry from the detail view

All changes are written straight to `anime.json`, so they survive regeneration and live in git.

### Static report

```bash
npm start
```

Fetches anything missing/expired, then writes `report.html` (read-only UI) and `report.md`.

## anime.json format

```json
[
  { "title": "Steins;Gate", "status": "watching", "progress": 8, "notes": "El Psy Kongroo" }
]
```

Legacy plain-string entries (`"Steins;Gate"`) still work and are upgraded automatically on the next run.

## How It Works

1. **Fetching**: AniList (GraphQL), MyAnimeList (mal-scraper), IMDb (suggestion API for the title ID, then the public GraphQL API for rating/plot/genres — IMDb's HTML pages are WAF-protected and no longer scrapeable)
2. **Rating**: sources are normalized to a 0–10 scale and averaged
3. **Tiers**: S ≥ 8.5 · A ≥ 8.0 · B ≥ 7.5 · C below
4. **Caching**: fetched data lives in `anime_cache.json` for 30 days (`CACHE_DURATION_MS` in `utils/cache.js`); tracking data lives in `anime.json` and is never expired

## Project Structure

```
├── fetchers/
│   ├── index.js       # fetchSources() — all three in parallel
│   ├── anilist.js     # AniList GraphQL API
│   ├── mal.js         # MyAnimeList via mal-scraper
│   └── imdb.js        # IMDb suggestion + GraphQL APIs
├── utils/
│   ├── library.js     # anime.json load/save/normalize + result merging
│   ├── cache.js       # 30-day fetch cache
│   ├── report.js      # Markdown + console table report
│   ├── htmlReport.js  # inlines webapp/ assets into one HTML file
│   └── webapp/        # template.html, styles.css, app.js (the UI)
├── server.js          # local app server + JSON API (port 4400)
├── index.js           # CLI: fetch + generate static reports
└── anime.json         # your library (titles + status/progress/notes)
```

## API (server mode)

| Route | Description |
|---|---|
| `GET /` | the app |
| `GET /api/library` | merged library JSON |
| `GET /api/search?q=` | AniList title search (for the add box) |
| `POST /api/anime` `{title}` | add + fetch a title |
| `PATCH /api/anime` `{title, status?, progress?, notes?}` | update tracking |
| `DELETE /api/anime` `{title}` | remove from library |
| `POST /api/refetch` `{title}` | drop cache and refetch a title |
| `GET /api/sequel?title=` | the title's sequel from AniList relations (null if none or already in library) |

## Troubleshooting

- **No data for an anime?** Try a different title variation, or use *Refetch ratings* in the detail view.
- **Wrong match?** Remove it and re-add via the search box (it uses AniList's canonical titles).
- **Stale ratings?** Delete `anime_cache.json` (or one entry) and rerun — tracking data in `anime.json` is unaffected.
- **Port in use?** `PORT=4500 npm run serve`

## License

MIT — data sourced from [MyAnimeList](https://myanimelist.net/), [AniList](https://anilist.co/), and [IMDb](https://www.imdb.com/) for personal, non-commercial use.
