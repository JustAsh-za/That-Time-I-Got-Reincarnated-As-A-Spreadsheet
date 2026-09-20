const { fetchSources } = require('./fetchers');
const fetchIMDb = require('./fetchers/imdb');
const { loadLibrary, saveLibrary, buildResults } = require('./utils/library');
const { loadCache, saveCache, isCacheValid } = require('./utils/cache');
const { generateReport } = require('./utils/report');
const generateHTMLReport = require('./utils/htmlReport');

async function main() {
    const entries = loadLibrary();
    if (entries.length === 0) {
        console.error('anime.json not found or empty!');
        return;
    }

    console.log(`Found ${entries.length} titles. Starting fetch...`);

    const cache = loadCache();
    let cacheUpdated = false;

    for (const entry of entries) {
        const title = entry.title;
        console.log(`Processing: ${title}...`);

        if (cache[title] && isCacheValid(cache[title].timestamp)) {
            // Repair entries cached while the IMDb fetcher was broken:
            // refetch only the IMDb part instead of waiting out the cache.
            const cachedImdb = cache[title].data?.imdb;
            if (!cachedImdb || cachedImdb.error) {
                console.log(`  -> Cached, but IMDb missing. Refetching IMDb...`);
                const imdb = await fetchIMDb(title).catch(e => ({ source: 'IMDb', error: e.message }));
                if (imdb && !imdb.error) {
                    cache[title].data.imdb = imdb;
                    cacheUpdated = true;
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            } else {
                console.log(`  -> Found in cache.`);
            }
            continue;
        }

        const fetched = await fetchSources(title, { anilistId: entry.anilistId });
        cache[title] = { timestamp: Date.now(), data: fetched };
        cacheUpdated = true;

        // Polite delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (cacheUpdated) {
        saveCache(cache);
    }

    // Persist library in normalized object form (migrates legacy string arrays)
    saveLibrary(entries);

    console.log('Fetching complete. Generating reports...');

    const results = buildResults(entries, cache);
    generateReport(results);
    generateHTMLReport(results);
}

main();
