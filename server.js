const http = require('http');
const axios = require('axios');

const { fetchSources } = require('./fetchers');
const fetchAniList = require('./fetchers/anilist');
const { STATUSES, loadLibrary, saveLibrary, buildResult, buildResults, fetchedFromCache } = require('./utils/library');
const { loadCache, saveCache, isCacheValid } = require('./utils/cache');
const { renderHTML } = require('./utils/htmlReport');

const PORT = process.env.PORT || 4400;

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
            if (data.length > 1e6) { req.destroy(); reject(new Error('Body too large')); }
        });
        req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch (e) { reject(new Error('Invalid JSON body')); }
        });
        req.on('error', reject);
    });
}

function sendJSON(res, status, obj) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
}

function sendHTML(res, html) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
}

// Fetch a title (all sources), store in cache, return merged result
async function fetchAndCache(entry) {
    const cache = loadCache();
    const fetched = await fetchSources(entry.title, { anilistId: entry.anilistId });
    cache[entry.title] = { timestamp: Date.now(), data: fetched };
    saveCache(cache);
    return buildResult(entry, fetched);
}

async function searchAniList(q) {
    const query = `
    query ($search: String) {
      Page(perPage: 8) {
        media(search: $search, type: ANIME) {
          id
          title { romaji english }
          seasonYear
          format
          episodes
          coverImage { medium }
        }
      }
    }`;
    const res = await axios.post('https://graphql.anilist.co', { query, variables: { search: q } });
    return (res.data?.data?.Page?.media || []).map(m => ({
        id: m.id,
        title: m.title.english || m.title.romaji,
        romaji: m.title.romaji,
        year: m.seasonYear,
        format: m.format,
        episodes: m.episodes,
        image: m.coverImage?.medium || null
    }));
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const route = `${req.method} ${url.pathname}`;

    try {
        if (route === 'GET /') {
            const entries = loadLibrary();
            const cache = loadCache();
            return sendHTML(res, renderHTML(buildResults(entries, cache), { serverMode: true }));
        }

        if (route === 'GET /api/library') {
            return sendJSON(res, 200, buildResults(loadLibrary(), loadCache()));
        }

        if (route === 'GET /api/search') {
            const q = (url.searchParams.get('q') || '').trim();
            if (q.length < 2) return sendJSON(res, 200, []);
            return sendJSON(res, 200, await searchAniList(q));
        }

        if (route === 'POST /api/anime') {
            const { title, anilistId } = await readBody(req);
            if (!title || typeof title !== 'string') return sendJSON(res, 400, { error: 'title required' });

            const entries = loadLibrary();
            if (entries.some(e => e.title.toLowerCase() === title.toLowerCase())) {
                return sendJSON(res, 409, { error: 'Already in library' });
            }
            const entry = { title: title.trim(), status: 'backlog', progress: 0, notes: '' };
            if (Number.isFinite(anilistId)) entry.anilistId = anilistId;
            entries.push(entry);
            saveLibrary(entries);

            const result = await fetchAndCache(entry);
            return sendJSON(res, 201, result);
        }

        if (route === 'PATCH /api/anime') {
            const body = await readBody(req);
            const entries = loadLibrary();
            const entry = entries.find(e => e.title === body.title);
            if (!entry) return sendJSON(res, 404, { error: 'Not in library' });

            if (body.status !== undefined) {
                if (!STATUSES.includes(body.status)) return sendJSON(res, 400, { error: 'Invalid status' });
                entry.status = body.status;
            }
            if (body.progress !== undefined) {
                const p = Number(body.progress);
                if (!Number.isFinite(p) || p < 0) return sendJSON(res, 400, { error: 'Invalid progress' });
                entry.progress = Math.round(p);
            }
            if (body.notes !== undefined) {
                if (typeof body.notes !== 'string') return sendJSON(res, 400, { error: 'Invalid notes' });
                entry.notes = body.notes;
            }
            saveLibrary(entries);

            const cache = loadCache();
            return sendJSON(res, 200, buildResult(entry, fetchedFromCache(cache[entry.title])));
        }

        if (route === 'DELETE /api/anime') {
            const { title } = await readBody(req);
            const entries = loadLibrary();
            const idx = entries.findIndex(e => e.title === title);
            if (idx === -1) return sendJSON(res, 404, { error: 'Not in library' });
            entries.splice(idx, 1);
            saveLibrary(entries);
            return sendJSON(res, 200, { ok: true });
        }

        if (route === 'GET /api/sequel') {
            const title = (url.searchParams.get('title') || '').trim();
            const entries = loadLibrary();
            const entry = entries.find(e => e.title === title);
            if (!entry) return sendJSON(res, 404, { error: 'Not in library' });

            const cache = loadCache();
            let anilist = cache[entry.title]?.data?.anilist;
            // Entries cached before sequel support have no `sequel` field;
            // look it up once and persist it back into the cache.
            if (!anilist || anilist.error || anilist.sequel === undefined) {
                const fresh = await fetchAniList(entry.title, entry.anilistId);
                if (fresh && !fresh.error) {
                    if (cache[entry.title]?.data) {
                        cache[entry.title].data.anilist = fresh;
                        saveCache(cache);
                    }
                    anilist = fresh;
                }
            }

            const sequel = anilist?.sequel || null;
            const inLibrary = sequel && entries.some(e =>
                e.anilistId === sequel.id ||
                e.title.toLowerCase() === (sequel.title || '').toLowerCase());
            return sendJSON(res, 200, { sequel: inLibrary ? null : sequel });
        }

        if (route === 'POST /api/refetch') {
            const { title } = await readBody(req);
            const entries = loadLibrary();
            const entry = entries.find(e => e.title === title);
            if (!entry) return sendJSON(res, 404, { error: 'Not in library' });
            const result = await fetchAndCache(entry);
            return sendJSON(res, 200, result);
        }

        return sendJSON(res, 404, { error: 'Not found' });
    } catch (err) {
        console.error(`${route} failed:`, err.message);
        return sendJSON(res, 500, { error: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`Anime backlog running at http://localhost:${PORT}`);
});
