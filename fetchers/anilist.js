const axios = require('axios');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search by title, or fetch an exact record when the AniList id is known
// (entries added through the UI store the id the user picked).
async function fetchAniList(title, anilistId) {
  const query = `
    query ($search: String, $id: Int) {
      Media (search: $search, id: $id, type: ANIME) {
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
        relations {
          edges {
            relationType
            node {
              id
              type
              title { romaji english }
              format
              episodes
              seasonYear
              status
              coverImage { medium }
            }
          }
        }
      }
    }
    `;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: query,
        variables: anilistId ? { id: anilistId } : { search: title }
      });

      const data = response.data.data.Media;
      if (data) {
        // First sequel relation, if any — powers the "next season" nudge
        const sequelEdge = (data.relations?.edges || []).find(e =>
          e.relationType === 'SEQUEL' && e.node?.type === 'ANIME');
        const sequel = sequelEdge ? {
          id: sequelEdge.node.id,
          title: sequelEdge.node.title.english || sequelEdge.node.title.romaji,
          format: sequelEdge.node.format,
          episodes: sequelEdge.node.episodes,
          year: sequelEdge.node.seasonYear,
          status: sequelEdge.node.status,
          image: sequelEdge.node.coverImage?.medium || null
        } : null;

        return {
          id: data.id,
          sequel,
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

