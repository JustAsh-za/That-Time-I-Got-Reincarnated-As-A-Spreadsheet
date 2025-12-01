const axios = require('axios');
const cheerio = require('cheerio');

async function fetchIMDb(title) {
    try {
        // 1. Get ID via Suggestion API
        const cleanTitle = title.toLowerCase();
        const firstChar = cleanTitle.charAt(0);
        const suggestionUrl = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanTitle)}.json`;

        const suggestionRes = await axios.get(suggestionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        const suggestions = suggestionRes.data.d;
        if (!suggestions || suggestions.length === 0) {
            return { source: 'IMDb', error: 'Not Found' };
        }

        // Find the best match (usually the first one, but we can filter for TV/Anime if needed)
        // The 'q' field often indicates type (e.g. "TV series", "feature", "TV mini-series")
        // For now, take the first result that looks like a title
        const bestMatch = suggestions[0];
        const imdbId = bestMatch.id;

        if (!imdbId) {
            return { source: 'IMDb', error: 'Not Found' };
        }

        // 2. Fetch Title Page Details
        const detailUrl = `https://www.imdb.com/title/${imdbId}/`;
        const detailRes = await axios.get(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(detailRes.data);

        // Extract Rating
        const ratingText = $('[data-testid="hero-rating-bar__aggregate-rating__score"] span').first().text();
        const rating = ratingText ? parseFloat(ratingText) : null;

        // Extract Description
        const description = $('[data-testid="plot"] span').first().text();

        // Extract Genres
        const genres = [];
        $('[data-testid="genres"] a').each((i, el) => {
            genres.push($(el).text());
        });

        return {
            source: 'IMDb',
            title: bestMatch.l, // Use IMDb title
            rating: rating, // 0-10
            description: description || 'N/A',
            genres: genres,
            url: detailUrl
        };

    } catch (error) {
        // console.error(`IMDb Error for ${title}:`, error.message);
        return { source: 'IMDb', error: 'Not Found (Error)' };
    }
}

module.exports = fetchIMDb;
