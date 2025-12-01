# That Time I Got Reincarnated As A Spreadsheet

*When you die and wake up as an anime rating aggregator... but at least you have a really good sorting algorithm* 📊✨

A powerful Node.js tool that aggregates anime ratings from multiple sources (MyAnimeList, AniList, and IMDb) and generates beautiful, interactive HTML reports to help you decide what to watch next from your backlog.

## Features

- **Multi-Source Aggregation**: Fetches ratings from MyAnimeList, AniList, and IMDb
- **Smart Caching**: Reduces API calls with intelligent 7-day caching
- **Beautiful Reports**: Generates interactive HTML reports with:
  - Tier-based ranking (S, A, B, C)
  - Multiple themes (Dark, Light, Cyberpunk)
  - Grid and List view modes
  - Search and filter by genre
  - Sort by average, MAL, AniList, or IMDb ratings
  - Responsive mobile design
- **Markdown Export**: Also generates markdown reports for easy sharing

## Installation

1. Clone the repository:
```bash
git clone https://github.com/JustAsh-za/That-Time-I-Got-Reincarnated-As-A-Spreadsheet.git
cd That-Time-I-Got-Reincarnated-As-A-Spreadsheet
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Add your anime titles to `anime.json`:
```json
[
  "Hunter × Hunter(2011)",
  "Cowboy Bebop",
  "Steins;Gate"
]
```

2. Run the aggregator:
```bash
npm start
```

3. Open the generated `report.html` in your browser to explore your personalized anime backlog!

## Project Structure

```
that-time-i-got-reincarnated-as-a-spreadsheet/
├── fetchers/           # API fetchers for each source
│   ├── anilist.js     # AniList GraphQL API
│   ├── mal.js         # MyAnimeList scraper
│   └── imdb.js        # IMDb search and scraper
├── utils/             # Utility functions
│   ├── cache.js       # Caching system
│   ├── report.js      # Markdown report generator
│   └── htmlReport.js  # HTML report generator
├── anime.json         # Your anime list
├── index.js           # Main entry point
└── package.json       # Dependencies and metadata
```

## How It Works

1. **Data Fetching**: The tool reads your anime list and fetches data from:
   - **AniList**: Ratings, images, genres, episode count, format
   - **MyAnimeList**: Ratings, descriptions, genres
   - **IMDb**: Ratings (when available)

2. **Rating Calculation**: Averages the ratings from all available sources to give you a balanced score

3. **Tier Assignment**: 
   - S Tier: 8.5+ ⭐
   - A Tier: 8.0-8.49
   - B Tier: 7.5-7.99
   - C Tier: <7.5

4. **Report Generation**: Creates both HTML and Markdown reports sorted by rating

5. **Caching**: Stores fetched data for 7 days to minimize API calls

## Interactive HTML Report Features

### Themes
- **Dark Mode** 🌙 (Default): Easy on the eyes
- **Light Mode** ☀️: Bright and clean
- **Cyberpunk** 🤖: Neon aesthetics

### View Modes
- **Grid View**: Card-based layout with images
- **List View**: Compact horizontal layout

### Controls
- **Search**: Filter anime by title
- **Genre Filter**: Show only specific genres
- **Sort Options**: By Average, MAL, AniList, or IMDb ratings
- **Surprise Me!**: Randomly highlights a highly-rated anime

## Customization

### Adding More Anime
Simply edit `anime.json` and add more titles to the array.

### Adjusting Cache Duration
Edit `utils/cache.js` and change the `CACHE_DURATION` constant (default: 7 days).

### Modifying Tier Thresholds
Edit the `getTier()` function in `utils/htmlReport.js`.

## Dependencies

- **axios**: HTTP client for API requests
- **cheerio**: HTML parsing for web scraping
- **cli-table3**: Terminal table formatting
- **mal-scraper**: MyAnimeList data scraping

## API Rate Limiting

The tool includes built-in rate limiting:
- 1 second delay between requests
- Caching to minimize API calls
- Graceful error handling

## Troubleshooting

**No data found for an anime?**
- Try different title variations (e.g., with/without year, English vs. Japanese)
- Check if the anime exists on all three platforms

**Cache issues?**
- Delete `anime_cache.json` to force a refresh

**Slow fetching?**
- This is normal! The tool respects API rate limits (1 second per anime)
- Use the cache for faster subsequent runs

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT License - feel free to use this project however you'd like!

## Acknowledgments

- Data sourced from [MyAnimeList](https://myanimelist.net/), [AniList](https://anilist.co/), and [IMDb](https://www.imdb.com/)
- Built with ❤️ for anime fans

---

**Enjoy discovering your next favorite anime!** 🎬✨
