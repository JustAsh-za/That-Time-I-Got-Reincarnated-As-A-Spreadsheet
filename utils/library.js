const fs = require('fs');
const path = require('path');

const LIBRARY_FILE = path.join(__dirname, '../anime.json');

const STATUSES = ['backlog', 'watching', 'completed', 'on-hold', 'dropped'];

// Accepts both legacy string entries and object entries
function normalizeEntry(entry) {
    if (typeof entry === 'string') {
        return { title: entry, status: 'backlog', progress: 0, notes: '' };
    }
    const normalized = {
        title: entry.title,
        status: STATUSES.includes(entry.status) ? entry.status : 'backlog',
        progress: Number.isFinite(entry.progress) && entry.progress >= 0 ? entry.progress : 0,
        notes: typeof entry.notes === 'string' ? entry.notes : ''
    };
    // Pins the exact AniList record for entries added through the UI
    if (Number.isFinite(entry.anilistId)) normalized.anilistId = entry.anilistId;
    return normalized;
}

function loadLibrary(file = LIBRARY_FILE) {
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return raw.map(normalizeEntry).filter(e => e.title);
}

function saveLibrary(entries, file = LIBRARY_FILE) {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2));
}

// Merge one library entry with its cached fetch data into a render-ready result
function buildResult(entry, fetched) {
    const { anilist, mal, imdb } = fetched || {};

    let totalScore = 0;
    let count = 0;

    if (anilist && anilist.rating && !isNaN(anilist.rating)) { totalScore += (anilist.rating / 10); count++; }
    if (mal && mal.rating) {
        const malScore = parseFloat(mal.rating);
        if (!isNaN(malScore)) { totalScore += malScore; count++; }
    }
    if (imdb && imdb.rating) {
        const imdbScore = parseFloat(imdb.rating);
        if (!isNaN(imdbScore)) { totalScore += imdbScore; count++; }
    }

    const averageRating = count > 0 ? totalScore / count : 0;

    // Prioritize AniList for image/color, MAL for description/genres
    const description = (mal && mal.description && mal.description !== 'N/A') ? mal.description :
        (anilist && anilist.description) ? anilist.description :
            (imdb && imdb.description && imdb.description !== 'N/A') ? imdb.description : 'No description available.';

    const genres = (mal && mal.genres && mal.genres.length > 0) ? mal.genres :
        (anilist && anilist.genres) ? anilist.genres :
            (imdb && imdb.genres) ? imdb.genres : [];

    return {
        title: entry.title,
        anilistId: entry.anilistId,
        fetchedTitle: (anilist && anilist.title) || (mal && mal.title) || entry.title,
        status: entry.status,
        progress: entry.progress,
        notes: entry.notes,
        averageRating,
        description,
        genres,
        episodes: anilist?.episodes || mal?.episodes || null,
        format: anilist?.format || mal?.format || '?',
        season: anilist?.season || null,
        year: anilist?.year || imdb?.year || null,
        image: (anilist && anilist.image) || null,
        color: (anilist && anilist.color) || null,
        anilist,
        mal,
        imdb
    };
}

// Cache entries store fetched source data. Older cache entries stored the
// full merged result object; unwrap those so tracking fields never come
// from the cache.
function fetchedFromCache(cacheEntry) {
    if (!cacheEntry || !cacheEntry.data) return null;
    const d = cacheEntry.data;
    return { anilist: d.anilist || null, mal: d.mal || null, imdb: d.imdb || null };
}

function buildResults(entries, cache) {
    return entries.map(entry => buildResult(entry, fetchedFromCache(cache[entry.title])));
}

module.exports = { STATUSES, LIBRARY_FILE, normalizeEntry, loadLibrary, saveLibrary, buildResult, buildResults, fetchedFromCache };
