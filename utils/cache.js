const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../anime_cache.json');
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) {
        return {};
    }
    try {
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading cache:', error.message);
        return {};
    }
}

function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log('Cache saved.');
    } catch (error) {
        console.error('Error saving cache:', error.message);
    }
}

function isCacheValid(timestamp) {
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_DURATION_MS;
}

module.exports = { loadCache, saveCache, isCacheValid };
