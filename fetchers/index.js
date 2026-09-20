const fetchAniList = require('./anilist');
const fetchMAL = require('./mal');
const fetchIMDb = require('./imdb');

// Fetch a title from all three sources in parallel. Never throws;
// individual failures come back as {source, error}. An anilistId (stored
// for entries added through the UI) pins the exact AniList record.
async function fetchSources(title, { anilistId } = {}) {
    const [anilist, mal, imdb] = await Promise.all([
        fetchAniList(title, anilistId).catch(e => ({ source: 'AniList', error: e.message })),
        fetchMAL(title).catch(e => ({ source: 'MyAnimeList', error: e.message })),
        fetchIMDb(title).catch(e => ({ source: 'IMDb', error: e.message }))
    ]);
    return { anilist, mal, imdb };
}

module.exports = { fetchSources };
