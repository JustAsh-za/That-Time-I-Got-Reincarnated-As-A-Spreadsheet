const axios = require('axios');

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
    console.error(`Error fetching from AniList for ${title}:`, error.message);
    return null;
  }
}

module.exports = fetchAniList;
