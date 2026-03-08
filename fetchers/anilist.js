const axios = require('axios');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAniList(title) {
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        averageScore
        description
        genres
        episodes
        format
        siteUrl
        trailer {
          id
          site
        }
        status
        season
        seasonYear
        coverImage {
          extraLarge
          large
          color
        }
      }
    }
    `;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: query,
        variables: { search: title }
      });

      const data = response.data.data.Media;
      if (data) {
        return {
          title: data.title.english || data.title.romaji,
          rating: data.averageScore,
          description: data.description,
          genres: data.genres,
          url: data.siteUrl,
          episodes: data.episodes,
          format: data.format,
          image: data.coverImage.extraLarge || data.coverImage.large,
          color: data.coverImage.color,
          trailer: data.trailer,
          status: data.status,
          season: data.season,
          year: data.seasonYear
        };
      }
      return null;
    } catch (error) {
      const status = error.response?.status;

      // Handle rate limiting (429)
      if (status === 429 && attempt < MAX_RETRIES) {
        // Use Retry-After header if available, otherwise exponential backoff
        const retryAfter = error.response?.headers?.['retry-after'];
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt);

        console.warn(`  ⚠ AniList rate limited for "${title}". Retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(delayMs);
        continue;
      }

      console.error(`Error fetching from AniList for ${title}:`, error.message);
      return null;
    }
  }

  return null;
}

module.exports = fetchAniList;

