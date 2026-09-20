const axios = require('axios');

// IMDb's HTML pages are behind an AWS WAF JS challenge (every request returns
// HTTP 202 with a challenge page), so scraping no longer works. Instead we use
// two JSON endpoints that are not challenged:
//   1. Suggestion API - resolves a title string to an IMDb ID
//   2. Public GraphQL API - returns rating, plot and genres for an ID
const SUGGESTION_BASE = 'https://v2.sg.media-imdb.com/suggestion';
const GRAPHQL_URL = 'https://api.graphql.imdb.com/';

// api.graphql.imdb.com rejects unbranded clients with a bare nginx 403 (no
// GraphQL error body). It only answers when the request looks like it came
// from imdb.com itself, so a browser User-Agent plus Origin/Referer is
// mandatory — without them every rating silently reads "Not Found (Error)".
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GRAPHQL_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/graphql+json, application/json',
    'User-Agent': BROWSER_UA,
    'Origin': 'https://www.imdb.com',
    'Referer': 'https://www.imdb.com/'
};

// qid values that represent actual titles (skips people/companies)
const TITLE_TYPES = new Set(['tvSeries', 'movie', 'tvMovie', 'tvMiniSeries', 'video', 'tvSpecial', 'short']);

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestWithRetry(fn, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
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

async function findImdbId(title) {
    // Normalize typographic quotes/dashes — they break suggestion matching
    const query = title.toLowerCase().trim()
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-');
    const firstChar = /^[a-z0-9]/.test(query) ? query[0] : 'x';
    const url = `${SUGGESTION_BASE}/${firstChar}/${encodeURIComponent(query)}.json`;

    const res = await requestWithRetry(() => axios.get(url, {
        headers: { 'User-Agent': BROWSER_UA }
    }));
    const suggestions = res.data?.d || [];

    const match = suggestions.find(s => s.id?.startsWith('tt') && TITLE_TYPES.has(s.qid));
    return match || null;
}

async function fetchTitleDetails(imdbId) {
    const query = `query {
        title(id: "${imdbId}") {
            titleText { text }
            ratingsSummary { aggregateRating voteCount }
            plot { plotText { plainText } }
            titleGenres { genres { genre { text } } }
        }
    }`;

    const res = await requestWithRetry(() => axios.post(GRAPHQL_URL, { query }, {
        headers: GRAPHQL_HEADERS
    }));

    return res.data?.data?.title || null;
}

async function fetchIMDb(title) {
    try {
        const match = await findImdbId(title);
        if (!match) {
            return { source: 'IMDb', error: 'Not Found' };
        }

        const details = await fetchTitleDetails(match.id);
        if (!details) {
            return { source: 'IMDb', error: 'Not Found' };
        }

        return {
            source: 'IMDb',
            title: details.titleText?.text || match.l || title,
            rating: details.ratingsSummary?.aggregateRating ?? null,
            votes: details.ratingsSummary?.voteCount ?? null,
            description: details.plot?.plotText?.plainText || 'N/A',
            genres: (details.titleGenres?.genres || []).map(g => g.genre.text),
            year: match.y || null,
            url: `https://www.imdb.com/title/${match.id}/`
        };
    } catch (error) {
        console.error(`IMDb Error for ${title}:`, error.message);
        return { source: 'IMDb', error: 'Not Found (Error)' };
    }
}

module.exports = fetchIMDb;
