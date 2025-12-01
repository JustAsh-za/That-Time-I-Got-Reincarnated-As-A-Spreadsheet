const malScraper = require('mal-scraper');

async function fetchMAL(title) {
    try {
        // Search for the anime to get the best match
        const results = await malScraper.getResultsFromSearch(title);

        if (!results || results.length === 0) {
            return { source: 'MyAnimeList', error: 'Not Found' };
        }

        // Use the first result
        const bestMatch = results[0];

        // Fetch full details (optional, but search result usually has score)
        // Search result 'score' is often 0 or missing if not detailed, so let's fetch info
        // Actually mal-scraper search results usually contain 'score'

        // However, getInfoFromName is more robust for details
        const info = await malScraper.getInfoFromName(bestMatch.name);

        return {
            source: 'MyAnimeList',
            title: info.title,
            rating: info.score, // 0-10
            description: info.synopsis ? info.synopsis.replace('[Written by MAL Rewrite]', '').trim() : 'N/A',
            genres: info.genres,
            episodes: info.episodes,
            format: info.type,
            url: info.url
        };

    } catch (error) {
        // console.error(`MAL Error for ${title}:`, error.message);
        return { source: 'MyAnimeList', error: 'Not Found' };
    }
}

module.exports = fetchMAL;
