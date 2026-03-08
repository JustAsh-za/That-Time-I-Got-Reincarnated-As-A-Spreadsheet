const axios = require('axios');
const cheerio = require('cheerio');

const IMDB_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await axios.get(url, options);
        } catch (error) {
            const status = error.response?.status;
            if ((status === 429 || status === 503) && attempt < retries) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                console.warn(`  ⚠ IMDb rate limited (${status}). Retrying in ${(delay / 1000).toFixed(1)}s...`);
                await sleep(delay);
                continue;
            }
            throw error;
        }
    }
}

async function fetchIMDb(title) {
    try {
        // 1. Get ID via Search Page Scrape
        const encodedTitle = encodeURIComponent(title);
        const searchUrl = `https://www.imdb.com/find?q=${encodedTitle}&s=tt`;

        const searchRes = await fetchWithRetry(searchUrl, {
            headers: IMDB_HEADERS
        });

        const $search = cheerio.load(searchRes.data);
        const results = $search('a[href*="/title/tt"]');

        let imdbId = null;
        if (results.length > 0) {
            // Check up to 30 returned links because the first 5 might be unrelated nav links on the IMDb page!
            for (let i = 0; i < Math.min(results.length, 30); i++) {
                const href = $search(results[i]).attr('href');
                if (!href) continue;

                const match = href.match(/tt\d+/);
                if (match) {
                    imdbId = match[0];
                    break;
                }
            }
        }

        if (!imdbId) {
            return { source: 'IMDb', error: 'Not Found' };
        }

        const bestMatch = { l: title };

        // 2. Fetch Title Page Details
        const detailUrl = `https://www.imdb.com/title/${imdbId}/`;
        const detailRes = await fetchWithRetry(detailUrl, {
            headers: IMDB_HEADERS
        });

        const $ = cheerio.load(detailRes.data);

        // Extract data from JSON-LD structured data (much more reliable than CSS selectors)
        let rating = null;
        let description = 'N/A';
        let genres = [];
        let ldTitle = bestMatch.l;

        const jsonLdScript = $('script[type="application/ld+json"]').first().html();
        if (jsonLdScript) {
            try {
                const ld = JSON.parse(jsonLdScript);
                rating = ld.aggregateRating?.ratingValue
                    ? parseFloat(ld.aggregateRating.ratingValue)
                    : null;
                description = ld.description || 'N/A';
                genres = Array.isArray(ld.genre) ? ld.genre : (ld.genre ? [ld.genre] : []);
                ldTitle = ld.name || ldTitle;
            } catch (parseErr) {
                // JSON-LD parsing failed, fall back to CSS selectors
            }
        }

        // Fallback to CSS selectors if JSON-LD didn't provide data
        if (!rating) {
            const ratingText = $('[data-testid="hero-rating-bar__aggregate-rating__score"] span').first().text();
            rating = ratingText ? parseFloat(ratingText) : null;
        }

        if (description === 'N/A') {
            const plotText = $('[data-testid="plot"] span').first().text();
            if (plotText) description = plotText;
        }

        if (genres.length === 0) {
            $('[data-testid="genres"] a').each((i, el) => {
                genres.push($(el).text());
            });
        }

        return {
            source: 'IMDb',
            title: ldTitle,
            rating: rating,
            description: description,
            genres: genres,
            url: detailUrl
        };

    } catch (error) {
        console.error(`IMDb Error for ${title}:`, error.message);
        return { source: 'IMDb', error: 'Not Found (Error)' };
    }
}

module.exports = fetchIMDb;
