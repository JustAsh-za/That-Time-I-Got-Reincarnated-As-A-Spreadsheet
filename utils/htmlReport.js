const fs = require('fs');
const path = require('path');

function getTier(score) {
    if (score >= 8.5) return 'S';
    if (score >= 8.0) return 'A';
    if (score >= 7.5) return 'B';
    return 'C';
}

function getTierColor(tier) {
    switch (tier) {
        case 'S': return '#FFD700'; // Gold
        case 'A': return '#FF4500'; // OrangeRed
        case 'B': return '#1E90FF'; // DodgerBlue
        case 'C': return '#A9A9A9'; // DarkGray
        default: return '#fff';
    }
}

function generateHTMLReport(results) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime Backlog</title>
    <style>
        :root {
            --bg-color: #121212;
            --card-bg: #1e1e1e;
            --text-color: #e0e0e0;
            --accent-color: #bb86fc;
            --border-color: #333;
        }
        
        [data-theme="light"] {
            --bg-color: #f0f2f5;
            --card-bg: #ffffff;
            --text-color: #333333;
            --accent-color: #6200ee;
            --border-color: #ddd;
        }

        [data-theme="cyberpunk"] {
            --bg-color: #0b0b19;
            --card-bg: #1a1a2e;
            --text-color: #00ffcc;
            --accent-color: #ff0099;
            --border-color: #00ffcc;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            transition: background-color 0.3s, color 0.3s;
        }



        h1 {
            text-align: center;
            color: var(--accent-color);
            margin-bottom: 20px;
            font-size: 3em;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .controls {
            max-width: 1200px;
            margin: 0 auto 40px auto;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            padding: 20px;
            background-color: var(--card-bg);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            align-items: center;
        }
        .control-group {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
        }
        .icon-group {
            display: flex;
            background-color: var(--bg-color);
            border-radius: 8px;
            padding: 4px;
            border: 1px solid var(--border-color);
        }
        .icon-btn {
            background: none;
            border: none;
            color: var(--text-color);
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            transition: all 0.2s;
        }
        .icon-btn svg {
            width: 20px;
            height: 20px;
        }
        .icon-btn:hover {
            background-color: var(--border-color);
            filter: none;
        }
        .icon-btn.active {
            background-color: var(--accent-color);
            color: #fff;
        }
        
        select, button, input {
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid var(--border-color);
            background-color: var(--bg-color);
            color: var(--text-color);
            font-size: 0.9em;
            cursor: pointer;
            transition: all 0.2s;
        }
        input {
            cursor: text;
        }
        input:focus {
            outline: 2px solid var(--accent-color);
        }
        select:hover, button:hover {
            filter: brightness(1.2);
        }
        /* Sort buttons specific style */
        .sort-group button {
            min-width: 60px;
        }
        .sort-group button.active {
            background-color: var(--accent-color);
            color: #fff;
            font-weight: bold;
            border-color: var(--accent-color);
        }
        
        #btn-surprise {
            background: linear-gradient(45deg, #ff00cc, #3333ff);
            font-weight: bold;
            box-shadow: 0 0 10px rgba(255, 0, 204, 0.5);
            border: none;
            color: white;
            margin-left: auto; /* Push to right if space allows */
        }
        #btn-surprise:hover {
            box-shadow: 0 0 20px rgba(255, 0, 204, 0.8);
            transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
            #btn-surprise {
                margin-left: 0;
                width: 100%;
            }
            .controls {
                justify-content: center;
            }
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
        }

            /* List View Styles */
        .container.list-view {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .container.list-view .card {
            flex-direction: row;
            height: auto;
            min-height: 220px;
        }
        .container.list-view .card-image {
            width: 200px;
            height: auto;
            min-height: 100%;
            border-bottom: none;
            border-right: 4px solid var(--accent-color);
        }
        .container.list-view .card-content {
            padding: 20px;
            overflow: visible;
        }
        .container.list-view .card-title {
            white-space: normal;
            overflow: visible;
            margin-bottom: 15px;
        }
        .container.list-view .description {
            -webkit-line-clamp: 4;
            margin-bottom: 15px;
        }

        .card {
            background-color: var(--card-bg);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }
        .card.highlight {
            border: 4px solid #ff00cc;
            box-shadow: 0 0 30px #ff00cc;
            transform: scale(1.02);
            z-index: 100;
        }
        .card-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            border-bottom: 4px solid var(--accent-color);
        }
        .tier-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2em;
            color: #121212;
            z-index: 10;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        .card-content {
            padding: 20px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        .card-title {
            margin: 0 0 10px 0;
            font-size: 1.3em;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .rating-display {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .avg-rating {
            font-size: 2em;
            font-weight: bold;
            color: var(--accent-color);
            margin-right: 15px;
        }
        .source-ratings {
            font-size: 0.8em;
            color: #888;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }
        .source-rating span {
            color: var(--text-color);
            font-weight: bold;
        }
        .genres {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 15px;
        }
        .genre-tag {
            background-color: var(--bg-color);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            color: var(--text-color);
            border: 1px solid var(--border-color);
        }
        .description {
            font-size: 0.9em;
            line-height: 1.4;
            color: var(--text-color);
            opacity: 0.8;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 15px;
        }
        .links {
            margin-top: auto;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .link-btn {
            flex: 1;
            text-align: center;
            padding: 8px;
            background-color: var(--bg-color);
            color: var(--text-color);
            text-decoration: none;
            border-radius: 5px;
            font-size: 0.9em;
            transition: background-color 0.2s;
            border: 1px solid var(--border-color);
            min-width: 60px;
        }
        .link-btn:hover {
            background-color: var(--border-color);
        }
        
        /* ===== MOBILE RESPONSIVENESS ===== */
        
        /* Tablets (Portrait) - 768px and below */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            h1 {
                font-size: 2em;
                letter-spacing: 2px;
                margin-bottom: 15px;
            }

            .controls {
                gap: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }

            select, button, input {
                padding: 8px 12px;
                font-size: 0.85em;
            }

            .container {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }

            .card-image {
                height: 350px;
            }

            .card-content {
                padding: 15px;
            }

            .card-title {
                font-size: 1.1em;
            }

            .avg-rating {
                font-size: 1.8em;
                margin-right: 10px;
            }

            .source-ratings {
                font-size: 0.75em;
            }

            .tier-badge {
                width: 35px;
                height: 35px;
                font-size: 1em;
            }

            /* List view adjustments for tablet */
            .container.list-view .card {
                height: auto;
                min-height: 200px;
            }

            .container.list-view .card-image {
                width: 140px;
            }
        }

        /* Mobile Phones (Portrait) - 480px and below */
        @media (max-width: 480px) {
            body {
                padding: 5px;
            }

            h1 {
                font-size: 1.5em;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }

            .controls {
                gap: 8px;
                padding: 10px;
                margin-bottom: 15px;
            }

            select, button, input {
                padding: 6px 8px;
                font-size: 0.8em;
            }

            /* Stack buttons in pairs for better mobile UX */
            .controls {
                justify-content: center;
            }

            input[type="text"], select {
                width: 100%;
                flex-basis: 100%;
            }

            button {
                min-width: 60px;
                padding: 8px 4px;
            }

            #btn-surprise {
                flex-basis: 100%;
                width: 100%;
            }

            /* Default Mobile Grid View */
            .container {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .card {
                border-radius: 10px;
            }

            .card-image {
                height: 300px;
            }

            .card-content {
                padding: 12px;
            }

            .card-title {
                font-size: 1.1em;
                white-space: normal;
                line-height: 1.3;
                margin-bottom: 8px;
            }

            .meta-info {
                font-size: 0.75em !important;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            .meta-info span {
                margin: 0;
            }

            .rating-display {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }

            .avg-rating {
                font-size: 1.4em;
                margin-right: 10px;
                margin-bottom: 0;
            }

            .source-ratings {
                font-size: 0.7em;
                width: auto;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .source-ratings div {
                display: flex;
                gap: 5px;
            }

            .genres {
                gap: 4px;
                margin-bottom: 10px;
            }

            .genre-tag {
                font-size: 0.7em;
                padding: 2px 5px;
            }

            .description {
                font-size: 0.85em;
                -webkit-line-clamp: 3;
                margin-bottom: 10px;
            }

            .links {
                gap: 6px;
            }

            .link-btn {
                font-size: 0.8em;
                padding: 6px;
                min-width: 40px;
            }

            .tier-badge {
                width: 30px;
                height: 30px;
                font-size: 0.9em;
                top: 8px;
                right: 8px;
            }

            /* Mobile List View */
            .container.list-view {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .container.list-view .card {
                flex-direction: row;
                height: auto; /* Allow auto height */
                min-height: 160px;
                align-items: stretch;
            }

            .container.list-view .card-image {
                width: 110px; /* Slightly larger image */
                height: auto;
                min-height: 100%;
                min-width: 110px;
                border-right: 2px solid var(--accent-color);
                border-bottom: none;
            }

            .container.list-view .card-content {
                padding: 10px;
                overflow: visible;
                display: flex;
                flex-direction: column;
            }
            
            .container.list-view .card-title {
                font-size: 1em;
                margin-bottom: 4px;
                white-space: normal; /* Allow wrapping */
            }

            /* Show info in list view now */
            .container.list-view .meta-info {
                display: flex !important;
                margin-bottom: 8px;
                flex-wrap: wrap;
            }

            .container.list-view .rating-display {
                margin-bottom: 8px;
            }
            
            .container.list-view .avg-rating {
                font-size: 1.2em;
            }
            
            .container.list-view .source-ratings {
                display: flex !important; /* Show source ratings */
            }

            .container.list-view .genres {
                display: none; 
            }

            .container.list-view .description {
                display: -webkit-box !important; /* Show description */
                -webkit-line-clamp: 3;
                font-size: 0.75em;
                margin-bottom: 8px;
                white-space: normal;
            }

            .container.list-view .links {
                margin-top: auto;
                justify-content: flex-start;
            }
            
            .container.list-view .link-btn {
                padding: 4px 8px;
                font-size: 0.75em;
            }
            
            .container.list-view .tier-badge {
                width: 20px;
                height: 20px;
                font-size: 0.7em;
                top: 4px;
                right: 4px;
            }
        }
    </style>

</head>
<body>



    <h1>Anime Backlog</h1>

    <div class="controls">
        <div class="control-group">
            <input type="text" id="search" placeholder="Search anime..." onkeyup="filterAndSort()">
            <select id="genreFilter" onchange="filterAndSort()">
                <option value="All">All Genres</option>
            </select>
        </div>

        <div class="control-group">
            <div class="icon-group" id="theme-controls">
                <button onclick="setTheme('default')" class="icon-btn active" title="Dark Theme">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
                <button onclick="setTheme('light')" class="icon-btn" title="Light Theme">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                </button>
                <button onclick="setTheme('cyberpunk')" class="icon-btn" title="Cyberpunk Theme">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="2" height="2"></rect><rect x="13" y="9" width="2" height="2"></rect><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
            </div>

            <div class="icon-group" id="view-controls">
                <button onclick="setView('grid')" class="icon-btn active" id="btn-view-grid" title="Grid View">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </button>
                <button onclick="setView('list')" class="icon-btn" id="btn-view-list" title="List View">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
            </div>
        </div>
        
        <div class="control-group sort-group">
            <button onclick="setSort('avg')" id="btn-avg" class="active">Avg</button>
            <button onclick="setSort('mal')" id="btn-mal">MAL</button>
            <button onclick="setSort('anilist')" id="btn-anilist">AL</button>
            <button onclick="setSort('imdb')" id="btn-imdb">IMDb</button>
        </div>
        
        <button onclick="surpriseMe()" id="btn-surprise">Surprise Me!</button>
    </div>

    <div class="container" id="animeGrid">
        ${results.map(item => {
        let tier = 'C';
        let color = '#A9A9A9'; // DarkGray

        if (item.averageRating >= 8.5) { tier = 'S'; color = '#FFD700'; } // Gold
        else if (item.averageRating >= 8.0) { tier = 'A'; color = '#FF4500'; } // OrangeRed
        else if (item.averageRating >= 7.5) { tier = 'B'; color = '#1E90FF'; } // DodgerBlue

        const al = item.anilist || {};
        const mal = item.mal || {};
        const imdb = item.imdb || {};

        const safeTitle = item.title.replace(/"/g, '&quot;');
        const safeGenres = JSON.stringify(item.genres).replace(/"/g, '&quot;');
        const coverImage = item.image || 'https://via.placeholder.com/300x400?text=No+Image';
        const cardColor = item.color || '#bb86fc';

        return `
            <div class="card" 
                 data-title="${safeTitle}" 
                 data-genres="${safeGenres}" 
                 data-avg="${item.averageRating}" 
                 data-mal="${mal.rating || 0}" 
                 data-anilist="${al.rating ? al.rating / 10 : 0}" 
                 data-imdb="${imdb.rating || 0}"
                 data-tier="${tier}">
                 
                <div class="tier-badge" style="background-color: ${color}; box-shadow: 0 0 15px ${color};">
                    ${tier}
                </div>
                
                <img src="${coverImage}" alt="${safeTitle}" class="card-image" style="border-color: ${cardColor}" loading="lazy">
                
                <div class="card-content">
                    <h2 class="card-title" title="${safeTitle}">${item.title}</h2>
                    
                    <div class="meta-info" style="margin-bottom: 10px; font-size: 0.85em; color: #aaa;">
                        <span style="background: var(--bg-color); padding: 2px 6px; border-radius: 4px; margin-right: 5px; border: 1px solid var(--border-color);">${item.format || 'TV'}</span>
                        <span style="background: var(--bg-color); padding: 2px 6px; border-radius: 4px; margin-right: 5px; border: 1px solid var(--border-color);">${item.episodes || '?'} Eps</span>
                        ${al.status ? `<span style="background: var(--bg-color); padding: 2px 6px; border-radius: 4px; margin-right: 5px; border: 1px solid var(--border-color);">${al.status}</span>` : ''}
                        ${al.season ? `<span style="background: var(--bg-color); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${al.season} ${al.year || ''}</span>` : ''}
                    </div>

                    <div class="rating-display">
                        <div class="avg-rating" style="color: ${cardColor}">${item.averageRating.toFixed(2)}</div>
                        <div class="source-ratings">
                            <div class="source-rating">MAL: <span>${mal.rating || '-'}</span></div>
                            <div class="source-rating">AL: <span>${al.rating || '-'}</span></div>
                            <div class="source-rating">IMDb: <span>${imdb.rating || '-'}</span></div>
                        </div>
                    </div>
                    
                    <div class="genres">
                        ${item.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>

                    <div class="description" title="${item.description.replace(/"/g, '&quot;')}">
                        ${item.description}
                    </div>



                    <div class="links">
                        ${mal.url ? `<a href="${mal.url}" target="_blank" class="link-btn">MAL</a>` : ''}
                        ${al.url ? `<a href="${al.url}" target="_blank" class="link-btn">AniList</a>` : ''}
                        ${imdb.url ? `<a href="${imdb.url}" target="_blank" class="link-btn">IMDb</a>` : ''}
                        ${al.trailer && al.trailer.site === 'youtube' ? `<a href="https://www.youtube.com/watch?v=${al.trailer.id}" target="_blank" class="link-btn" style="background-color: #c4302b; color: white; border: none;">Trailer</a>` : ''}
                    </div>
                </div>
            </div>`;
    }).join('')}
    </div>

    <script>
        let currentSort = 'avg';
        
        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            populateGenres();
            loadSettings();
        });

        // --- Genre Population ---
        function populateGenres() {
            const allGenres = new Set();
            document.querySelectorAll('.card').forEach(card => {
                const genres = JSON.parse(card.dataset.genres);
                genres.forEach(g => allGenres.add(g));
            });
            const genreSelect = document.getElementById('genreFilter');
            Array.from(allGenres).sort().forEach(g => {
                const option = document.createElement('option');
                option.value = g;
                option.textContent = g;
                genreSelect.appendChild(option);
            });
        }

        // --- View & Theme Settings ---
        function setView(mode) {
            const container = document.getElementById('animeGrid');
            const btnGrid = document.getElementById('btn-view-grid');
            const btnList = document.getElementById('btn-view-list');
            
            if (mode === 'list') {
                container.classList.add('list-view');
                btnList.classList.add('active');
                btnGrid.classList.remove('active');
            } else {
                container.classList.remove('list-view');
                btnGrid.classList.add('active');
                btnList.classList.remove('active');
            }
            localStorage.setItem('viewMode', mode);
        }

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update active icon
            const buttons = document.querySelectorAll('#theme-controls .icon-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Find button by onclick attribute (simple way) or index
            // Since we know the order: 0=default, 1=light, 2=cyberpunk
            if (theme === 'default') buttons[0].classList.add('active');
            else if (theme === 'light') buttons[1].classList.add('active');
            else if (theme === 'cyberpunk') buttons[2].classList.add('active');
        }

        function loadSettings() {
            const savedTheme = localStorage.getItem('theme') || 'default';
            setTheme(savedTheme);

            const savedView = localStorage.getItem('viewMode') || 'grid';
            setView(savedView);
        }

        // --- Sorting & Filtering ---
        function setSort(criteria) {
            currentSort = criteria;
            document.querySelectorAll('.sort-group button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('btn-' + criteria).classList.add('active');
            filterAndSort();
        }

        function filterAndSort() {
            const genre = document.getElementById('genreFilter').value;
            const searchTerm = document.getElementById('search').value.toLowerCase();
            const container = document.getElementById('animeGrid');
            const cards = Array.from(container.getElementsByClassName('card'));

            cards.forEach(card => {
                const cardGenres = JSON.parse(card.dataset.genres);
                const cardTitle = card.dataset.title.toLowerCase();
                
                const matchesGenre = genre === 'All' || cardGenres.includes(genre);
                const matchesSearch = cardTitle.includes(searchTerm);
                
                card.style.display = (matchesGenre && matchesSearch) ? 'flex' : 'none';
                card.classList.remove('highlight');
            });

            const visibleCards = cards.filter(c => c.style.display !== 'none');
            visibleCards.sort((a, b) => {
                const valA = parseFloat(a.dataset[currentSort]);
                const valB = parseFloat(b.dataset[currentSort]);
                return valB - valA;
            });

            visibleCards.forEach(card => container.appendChild(card));
        }

        function surpriseMe() {
            const container = document.getElementById('animeGrid');
            const visibleCards = Array.from(container.querySelectorAll('.card')).filter(c => c.style.display !== 'none');
            
            if (visibleCards.length === 0) {
                alert("No anime visible to pick from!");
                return;
            }

            visibleCards.forEach(c => c.classList.remove('highlight'));

            const weights = { 'S': 40, 'A': 30, 'B': 20, 'C': 10 };
            let weightedPool = [];

            visibleCards.forEach(card => {
                const tier = card.dataset.tier;
                const weight = weights[tier] || 10;
                for (let i = 0; i < weight; i++) {
                    weightedPool.push(card);
                }
            });

            const randomCard = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            
            randomCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            randomCard.classList.add('highlight');
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, '../report.html'), htmlContent);
    console.log('HTML Report saved to report.html');
}

module.exports = generateHTMLReport;
