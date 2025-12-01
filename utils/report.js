const fs = require('fs');
const Table = require('cli-table3');

function generateReport(results) {
    // Results is an array of objects:
    // {
    //   title: "Original Title",
    //   averageRating: 8.5,
    //   sources: [ { source: 'AniList', rating: 85, ... }, ... ]
    // }

    // Sort by average rating descending
    results.sort((a, b) => b.averageRating - a.averageRating);

    // 1. Console Table
    const table = new Table({
        head: ['Rank', 'Title', 'Avg Rating', 'AniList', 'MAL', 'IMDb'],
        colWidths: [6, 40, 12, 10, 10, 10]
    });

    results.forEach((item, index) => {
        const al = item.anilist;
        const mal = item.mal;
        const imdb = item.imdb;

        table.push([
            index + 1,
            item.title.length > 35 ? item.title.substring(0, 35) + '...' : item.title,
            item.averageRating.toFixed(2),
            al && al.rating ? al.rating : '-',
            mal && mal.rating ? mal.rating : '-',
            imdb && imdb.rating ? imdb.rating : '-'
        ]);
    });

    console.log(table.toString());

    // 2. Markdown Report
    let mdContent = '# Anime Rating Report\n\n';
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    results.forEach((item, index) => {
        mdContent += `## ${index + 1}. ${item.title} (Avg: ${item.averageRating.toFixed(2)})\n\n`;

        // Description is already normalized in index.js
        const description = item.description;
        const genres = item.genres.join(', ');

        mdContent += `**Genres:** ${genres}\n\n`;
        mdContent += `**Description:** ${description}\n\n`;

        mdContent += `### Ratings\n`;
        const al = item.anilist;
        const mal = item.mal;
        const imdb = item.imdb;

        if (al) mdContent += `- **AniList**: ${al.rating ? al.rating + '/100' : 'N/A'} [Link](${al.url})\n`;
        if (mal) mdContent += `- **MyAnimeList**: ${mal.rating ? mal.rating + '/10' : 'N/A'} [Link](${mal.url})\n`;
        if (imdb) mdContent += `- **IMDb**: ${imdb.rating ? imdb.rating + '/10' : 'N/A'} [Link](${imdb.url})\n`;

        mdContent += `\n---\n\n`;
    });

    fs.writeFileSync('report.md', mdContent);
    console.log('Report saved to report.md');
}

module.exports = { generateReport };
