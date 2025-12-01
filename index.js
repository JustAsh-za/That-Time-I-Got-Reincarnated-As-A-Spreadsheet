const fs = require('fs');
const fetchAniList = require('./fetchers/anilist');
const fetchMAL = require('./fetchers/mal');
const fetchIMDb = require('./fetchers/imdb');
const { generateReport } = require('./utils/report');
const generateHTMLReport = require('./utils/htmlReport');

const { loadCache, saveCache, isCacheValid } = require('./utils/cache');

async function main() {
    const listPath = './anime.json';
    if (!fs.existsSync(listPath)) {
        console.error('anime.json not found!');
        return;
    }

    const content = fs.readFileSync(listPath, 'utf-8');
    const titles = JSON.parse(content);

    console.log(`Found ${titles.length} titles. Starting fetch...`);

    const cache = loadCache();
    const results = [];
    let cacheUpdated = false;

    for (const title of titles) {
        console.log(`Processing: ${title}...`);

        // Check cache
        if (cache[title] && isCacheValid(cache[title].timestamp)) {
            console.log(`  -> Found in cache.`);
            results.push(cache[title].data);
            continue;
        }

        // Fetch if not cached or expired
        const [anilist, mal, imdb] = await Promise.all([
            fetchAniList(title).catch(e => ({ source: 'AniList', error: e.message })),
            fetchMAL(title).catch(e => ({ source: 'MyAnimeList', error: e.message })),
            fetchIMDb(title).catch(e => ({ source: 'IMDb', error: e.message }))
        ]);

        // Calculate Average Rating
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

        // Normalize Data
        // Prioritize AniList for Image/Color
        // Prioritize MAL for Description/Genres (usually better formatted)
        const description = (mal && mal.description && mal.description !== 'N/A') ? mal.description :
            (anilist && anilist.description) ? anilist.description :
                (imdb && imdb.description) ? imdb.description : 'No description available.';

        const genres = (mal && mal.genres && mal.genres.length > 0) ? mal.genres :
            (anilist && anilist.genres) ? anilist.genres :
                (imdb && imdb.genres) ? imdb.genres : [];

        const image = (anilist && anilist.image) ? anilist.image : null;
        const color = (anilist && anilist.color) ? anilist.color : null;

        const resultData = {
            title: title, // Keep original search title or use fetched title? Using search title for consistency
            fetchedTitle: (anilist && anilist.title) || (mal && mal.title) || title,
            averageRating: averageRating,
            description: description,
            genres: genres,
            episodes: anilist?.episodes || mal?.episodes || '?',
            format: anilist?.format || mal?.format || '?',
            image: image,
            color: color,
            anilist: anilist,
            mal: mal,
            imdb: imdb
        };

        results.push(resultData);

        // Update Cache
        cache[title] = {
            timestamp: Date.now(),
            data: resultData
        };
        cacheUpdated = true;

        // Polite delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (cacheUpdated) {
        saveCache(cache);
    }

    console.log('Fetching complete. Generating reports...');

    generateReport(results);
    generateHTMLReport(results);
}

main();
